/**
 * Stream Handler for Groq AI Responses
 *
 * This module provides comprehensive utilities for handling streaming responses
 * from Groq AI, including:
 * - Stream parsing with proper error handling
 * - Partial JSON response handling
 * - Stream interruption and cleanup
 * - Backpressure management for smooth UI updates
 * - Memory-efficient stream processing
 * - Real-time response reconstruction
 */

// Remove type-only import for runtime check

/**
 * Types for stream handling
 */
export interface StreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      finish_reason?: string | null;
    };
    finish_reason?: string | null;
  }>;
}

export interface StreamParsingOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onContent?: (content: string, isPartial: boolean) => void;
  onError?: (error: Error) => void;
  onComplete?: (fullContent: string) => void;
  onProgress?: (bytesProcessed: number, totalBytes?: number) => void;
  maxChunkSize?: number;
  debounceMs?: number;
}

export interface StreamState {
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: Error | null;
  bytesProcessed: number;
  chunksReceived: number;
  startTime: number;
  lastUpdateTime: number;
}

export interface BackpressureConfig {
  maxBufferSize: number;
  throttleMs: number;
  batchSize: number;
  enableRAF: boolean;
}

/**
 * Default configuration for stream handling
 */
export const DEFAULT_STREAM_CONFIG: Required<StreamParsingOptions> = {
  onChunk: () => {},
  onContent: () => {},
  onError: () => {},
  onComplete: () => {},
  onProgress: () => {},
  maxChunkSize: 1024 * 8, // 8KB chunks
  debounceMs: 16, // ~60fps updates
};

export const DEFAULT_BACKPRESSURE_CONFIG: BackpressureConfig = {
  maxBufferSize: 1024 * 1024, // 1MB buffer
  throttleMs: 16, // 60fps
  batchSize: 10, // Process 10 chunks at once
  enableRAF: true, // Use requestAnimationFrame
};

/**
 * Stream parsing error types
 */
export class StreamParsingError extends Error {
  constructor(
    message: string,
    public readonly chunk?: string,
    public readonly position?: number
  ) {
    super(message);
    this.name = 'StreamParsingError';
  }
}

export class StreamInterruptedError extends Error {
  constructor(message: string = 'Stream was interrupted') {
    super(message);
    this.name = 'StreamInterruptedError';
  }
}

export class BackpressureError extends Error {
  constructor(message: string = 'Stream backpressure limit exceeded') {
    super(message);
    this.name = 'BackpressureError';
  }
}

/**
 * Parse a single SSE chunk from Groq
 */
export function parseSSEChunk(chunk: string): StreamChunk | null {
  try {
    // Remove SSE prefixes
    const cleanChunk = chunk
      .replace(/^data: /, '')
      .replace(/^\n+/, '')
      .replace(/\n+$/, '');

    // Handle stream end
    if (cleanChunk === '[DONE]' || cleanChunk === '') {
      return null;
    }

    // Parse JSON
    const parsed = JSON.parse(cleanChunk);

    // Validate structure
    if (!parsed.choices || !Array.isArray(parsed.choices)) {
      throw new StreamParsingError(
        'Invalid chunk structure: missing choices array',
        cleanChunk
      );
    }

    return parsed as StreamChunk;
  } catch (error) {
    if (error instanceof StreamParsingError) {
      throw error;
    }
    throw new StreamParsingError(
      `Failed to parse SSE chunk: ${error instanceof Error ? error.message : 'Unknown error'}`,
      chunk
    );
  }
}

/**
 * Extract content from a parsed chunk
 */
export function extractContent(chunk: StreamChunk): string {
  return chunk.choices[0]?.delta?.content || '';
}

/**
 * Check if chunk indicates stream completion
 */
export function isStreamComplete(chunk: StreamChunk): boolean {
  return (
    chunk.choices[0]?.finish_reason !== null ||
    chunk.choices[0]?.delta?.finish_reason !== null
  );
}

/**
 * Stream controller for managing interruption and cleanup
 */
export class StreamController {
  private _abortController: AbortController;
  private _isInterrupted = false;
  private _onInterrupt?: () => void;

  constructor(onInterrupt?: () => void) {
    this._abortController = new AbortController();
    this._onInterrupt = onInterrupt;
  }

  get signal(): AbortSignal {
    return this._abortController.signal;
  }

  get isInterrupted(): boolean {
    return this._isInterrupted;
  }

  interrupt(reason?: string): void {
    if (this._isInterrupted) return;

    this._isInterrupted = true;
    this._abortController.abort(reason);
    this._onInterrupt?.();
  }

  throwIfInterrupted(): void {
    if (this._isInterrupted) {
      throw new StreamInterruptedError('Stream processing was interrupted');
    }
  }
}

/**
 * Backpressure manager for smooth UI updates
 */
export class BackpressureManager {
  private _buffer: string[] = [];
  private _isProcessing = false;
  private _config: BackpressureConfig;
  private _lastFlushTime = 0;
  private _rafId?: number;

  constructor(
    private readonly onFlush: (content: string) => void,
    config: Partial<BackpressureConfig> = {}
  ) {
    this._config = { ...DEFAULT_BACKPRESSURE_CONFIG, ...config };
  }

  add(content: string): void {
    this._buffer.push(content);

    // Check buffer size
    if (this._buffer.length > this._config.maxBufferSize) {
      throw new BackpressureError(
        `Buffer size exceeded: ${this._buffer.length}`
      );
    }

    this._scheduleFlush();
  }

  private _scheduleFlush(): void {
    if (this._isProcessing) return;

    const now = Date.now();
    const timeSinceLastFlush = now - this._lastFlushTime;

    if (timeSinceLastFlush >= this._config.throttleMs) {
      this._flush();
    } else if (
      this._config.enableRAF &&
      typeof requestAnimationFrame !== 'undefined'
    ) {
      this._rafId = requestAnimationFrame(() => this._flush());
    } else {
      setTimeout(
        () => this._flush(),
        this._config.throttleMs - timeSinceLastFlush
      );
    }
  }

  private _flush(): void {
    if (this._isProcessing || this._buffer.length === 0) return;

    this._isProcessing = true;
    this._lastFlushTime = Date.now();

    try {
      // Process in batches
      const batchSize = Math.min(this._config.batchSize, this._buffer.length);
      const batch = this._buffer.splice(0, batchSize);
      const content = batch.join('');

      if (content) {
        this.onFlush(content);
      }
    } finally {
      this._isProcessing = false;

      // Schedule next flush if buffer has more content
      if (this._buffer.length > 0) {
        this._scheduleFlush();
      }
    }
  }

  flush(): void {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }

    if (this._buffer.length > 0) {
      const content = this._buffer.splice(0).join('');
      if (content) {
        this.onFlush(content);
      }
    }
  }

  clear(): void {
    this._buffer.length = 0;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
    this._isProcessing = false;
  }

  get bufferSize(): number {
    return this._buffer.length;
  }
}

/**
 * Stream processor for handling complete Groq response streams
 */
export class GroqStreamProcessor {
  private _state: StreamState;
  private _controller: StreamController;
  private _backpressureManager?: BackpressureManager;
  private _options: Required<StreamParsingOptions>;

  constructor(
    options: StreamParsingOptions = {},
    backpressureConfig?: Partial<BackpressureConfig>
  ) {
    this._options = { ...DEFAULT_STREAM_CONFIG, ...options };
    this._controller = new StreamController(() => {
      this._backpressureManager?.clear();
    });

    this._state = {
      content: '',
      isStreaming: false,
      isComplete: false,
      error: null,
      bytesProcessed: 0,
      chunksReceived: 0,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
    };

    // Setup backpressure management if debouncing is enabled
    if (this._options.debounceMs > 0) {
      this._backpressureManager = new BackpressureManager((content) => {
        this._state.content += content;
        this._state.lastUpdateTime = Date.now();
        this._options.onContent(this._state.content, this._state.isStreaming);
      }, backpressureConfig);
    }
  }

  get state(): Readonly<StreamState> {
    return { ...this._state };
  }

  get controller(): StreamController {
    return this._controller;
  }

  async processStream(response: Response): Promise<string> {
    if (!response.body) {
      throw new Error('Response body is null');
    }

    this._state.isStreaming = true;
    this._state.startTime = Date.now();

    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        this._controller.throwIfInterrupted();

        const { done, value } = await reader.read();

        if (done) break;

        // Update progress
        this._state.bytesProcessed += value.byteLength;
        this._options.onProgress(this._state.bytesProcessed);

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsedChunk = parseSSEChunk(line);
            if (!parsedChunk) continue; // [DONE] or empty

            this._state.chunksReceived++;
            this._options.onChunk(parsedChunk);

            const content = extractContent(parsedChunk);
            if (content) {
              if (this._backpressureManager) {
                this._backpressureManager.add(content);
              } else {
                this._state.content += content;
                this._state.lastUpdateTime = Date.now();
                this._options.onContent(this._state.content, true);
              }
            }

            if (isStreamComplete(parsedChunk)) {
              this._state.isComplete = true;
              break;
            }
          } catch (error) {
            const streamError =
              error instanceof Error
                ? error
                : new Error('Unknown parsing error');
            this._state.error = streamError;
            this._options.onError(streamError);
          }
        }

        if (this._state.isComplete) break;
      }

      // Flush any remaining content
      this._backpressureManager?.flush();

      this._state.isStreaming = false;
      this._options.onComplete(this._state.content);

      return this._state.content;
    } catch (error) {
      this._state.isStreaming = false;
      const streamError =
        error instanceof Error ? error : new Error('Stream processing failed');
      this._state.error = streamError;
      this._options.onError(streamError);
      throw streamError;
    }
  }

  interrupt(reason?: string): void {
    this._controller.interrupt(reason);
  }
}

/**
 * Utility function to create a simple stream processor
 */
export function createStreamProcessor(
  options: StreamParsingOptions = {},
  backpressureConfig?: Partial<BackpressureConfig>
): GroqStreamProcessor {
  return new GroqStreamProcessor(options, backpressureConfig);
}

/**
 * High-level function to process a Groq stream response
 */
export async function processGroqStream(
  response: Response,
  options: StreamParsingOptions = {}
): Promise<string> {
  const processor = createStreamProcessor(options);
  return processor.processStream(response);
}

/**
 * Utility to check if the current environment supports streaming
 */
export function isStreamingSupported(): boolean {
  return (
    typeof ReadableStream !== 'undefined' &&
    typeof TextDecoder !== 'undefined' &&
    typeof AbortController !== 'undefined'
  );
}

/**
 * Debug utilities for stream monitoring
 */
export const StreamDebug = {
  logChunk: (chunk: StreamChunk, index: number) => {
    console.log(`[Stream Debug] Chunk ${index}:`, {
      content: extractContent(chunk),
      isComplete: isStreamComplete(chunk),
      finishReason: chunk.choices[0]?.finish_reason,
    });
  },

  logState: (state: StreamState) => {
    console.log('[Stream Debug] State:', {
      contentLength: state.content.length,
      chunksReceived: state.chunksReceived,
      bytesProcessed: state.bytesProcessed,
      duration: Date.now() - state.startTime,
      isStreaming: state.isStreaming,
    });
  },

  createLogger: (prefix: string = '[Stream]') => ({
    onChunk: (chunk: StreamChunk) =>
      console.log(`${prefix} Chunk:`, extractContent(chunk)),
    onContent: (content: string, isPartial: boolean) =>
      console.log(`${prefix} Content Update:`, {
        length: content.length,
        isPartial,
      }),
    onError: (error: Error) => console.error(`${prefix} Error:`, error),
    onComplete: (content: string) =>
      console.log(`${prefix} Complete:`, { length: content.length }),
  }),
};
