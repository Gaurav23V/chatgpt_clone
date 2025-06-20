/**
 * useGroqChat Hook
 *
 * A simplified custom hook that wraps the Vercel AI SDK's useChat with
 * Groq-specific optimizations and enhanced error handling.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type CreateMessage,
  type Message,
  useChat as useAIChat,
} from 'ai/react';

import { groqErrorHandling } from '@/lib/ai/groq-config';

/**
 * Configuration for useGroqChat hook
 */
export interface GroqChatConfig {
  api?: string;
  initialMessages?: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: Error) => void;
  onResponse?: (response: Response) => void;
  onRetry?: (attempt: number) => void;
}

/**
 * Enhanced streaming state
 */
export interface GroqChatState {
  isConnecting: boolean;
  isReconnecting: boolean;
  connectionAttempts: number;
  streamingStats: {
    tokensPerSecond: number;
    chunksReceived: number;
    responseTime: number;
  };
  lastError: Error | null;
  retryCount: number;
}

/**
 * Return type for useGroqChat hook
 */
export interface UseGroqChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  error: Error | null;
  groqState: GroqChatState;
  append: (message: CreateMessage) => void;
  reload: () => void;
  stop: () => void;
  setMessages: (messages: Message[]) => void;
  retry: () => void;
  clearConversation: () => void;
}

/**
 * Enhanced useChat hook with Groq optimizations
 */
export function useGroqChat(config: GroqChatConfig = {}): UseGroqChatReturn {
  const {
    api = '/api/chat',
    initialMessages = [],
    model = 'llama-3.3-70b-versatile',
    temperature = 0.7,
    maxTokens = 2000,
    headers = {},
    onStreamStart = () => {},
    onStreamEnd = () => {},
    onError = () => {},
    onResponse = () => {},
    onRetry = () => {},
  } = config;

  // Enhanced state management
  const [groqState, setGroqState] = useState<GroqChatState>({
    isConnecting: false,
    isReconnecting: false,
    connectionAttempts: 0,
    streamingStats: {
      tokensPerSecond: 0,
      chunksReceived: 0,
      responseTime: 0,
    },
    lastError: null,
    retryCount: 0,
  });

  // Refs for performance tracking
  const streamStartTime = useRef<number>(0);
  const lastMessageRef = useRef<Message | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize the base useChat hook
  const {
    messages,
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    append: originalAppend,
    reload: originalReload,
    stop: originalStop,
    setMessages,
  } = useAIChat({
    api,
    initialMessages,
    headers,
    body: {
      model,
      temperature,
      maxTokens,
      stream: true,
    },
    onResponse: (response) => {
      setGroqState((prev) => ({
        ...prev,
        isConnecting: false,
        isReconnecting: false,
        connectionAttempts: 0,
      }));

      streamStartTime.current = Date.now();
      onStreamStart();
      onResponse(response);
    },
    onFinish: (message) => {
      const responseTime = Date.now() - streamStartTime.current;

      setGroqState((prev) => ({
        ...prev,
        streamingStats: {
          ...prev.streamingStats,
          responseTime,
        },
        retryCount: 0,
      }));

      lastMessageRef.current = message;
      onStreamEnd();
    },
    onError: (errorObj) => {
      const err = errorObj || new Error('Unknown error');
      console.error('Groq chat error:', err);

      setGroqState((prev) => ({
        ...prev,
        lastError: err,
        isConnecting: false,
        isReconnecting: false,
      }));

      onError(err);

      // Auto-retry for certain errors
      if (shouldRetry(err, groqState.retryCount)) {
        handleRetry();
      }
    },
  });

  // Enhanced submit handler with connection management
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      setGroqState((prev) => ({
        ...prev,
        isConnecting: true,
        lastError: null,
      }));

      originalHandleSubmit(e || (new Event('submit') as any));
    },
    [originalHandleSubmit]
  );

  // Enhanced append with retry logic
  const append = useCallback(
    (message: CreateMessage) => {
      setGroqState((prev) => ({
        ...prev,
        isConnecting: true,
        lastError: null,
      }));

      originalAppend(message);
    },
    [originalAppend]
  );

  // Enhanced reload with reconnection logic
  const reload = useCallback(() => {
    if (groqState.connectionAttempts < 3) {
      setGroqState((prev) => ({
        ...prev,
        isReconnecting: true,
        connectionAttempts: prev.connectionAttempts + 1,
      }));

      setTimeout(() => {
        originalReload();
      }, 1000);
    }
  }, [originalReload, groqState.connectionAttempts]);

  // Stop with cleanup
  const stop = useCallback(() => {
    originalStop();

    setGroqState((prev) => ({
      ...prev,
      isConnecting: false,
      isReconnecting: false,
    }));

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [originalStop]);

  // Retry functionality
  const retry = useCallback(() => {
    if (lastMessageRef.current) {
      setGroqState((prev) => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        lastError: null,
      }));

      onRetry(groqState.retryCount + 1);
      reload();
    }
  }, [reload, groqState.retryCount, onRetry]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setInput('');
    setGroqState((prev) => ({
      ...prev,
      retryCount: 0,
      lastError: null,
      connectionAttempts: 0,
      streamingStats: {
        tokensPerSecond: 0,
        chunksReceived: 0,
        responseTime: 0,
      },
    }));
  }, [setMessages, setInput]);

  // Helper function to determine if we should retry
  function shouldRetry(error: Error, retryCount: number): boolean {
    if (retryCount >= 2) return false;

    const errorMessage = error.message.toLowerCase();
    const retryableErrors = ['rate_limit', 'timeout', 'network'];
    return retryableErrors.some((retryableError) =>
      errorMessage.includes(retryableError)
    );
  }

  // Handle automatic retry
  function handleRetry() {
    const delay = Math.min(1000 * Math.pow(2, groqState.retryCount), 10000);

    retryTimeoutRef.current = setTimeout(() => {
      retry();
    }, delay);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error: error || null,
    groqState,
    append,
    reload,
    stop,
    setMessages,
    retry,
    clearConversation,
  };
}
