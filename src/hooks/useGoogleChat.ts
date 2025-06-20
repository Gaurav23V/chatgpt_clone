/**
 * useGoogleChat Hook
 *
 * A custom hook that wraps the Vercel AI SDK's useChat with
 * Google Generative AI-specific optimizations and enhanced error handling.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type CreateMessage,
  type Message,
  useChat as useAIChat,
} from 'ai/react';

import { googleErrorHandling } from '@/lib/ai/google-config';

/**
 * Configuration for useGoogleChat hook
 */
export interface GoogleChatConfig {
  api?: string;
  initialMessages?: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
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
export interface GoogleChatState {
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
 * Return type for useGoogleChat hook
 */
export interface UseGoogleChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  error: Error | null;
  googleState: GoogleChatState;
  append: (message: CreateMessage) => void;
  reload: () => void;
  stop: () => void;
  setMessages: (messages: Message[]) => void;
  retry: () => void;
  clearConversation: () => void;
}

/**
 * Enhanced useChat hook with Google Generative AI optimizations
 */
export function useGoogleChat(config: GoogleChatConfig = {}): UseGoogleChatReturn {
  const {
    api = '/api/chat',
    initialMessages = [],
    model = 'gemini-1.5-flash-latest',
    temperature = 0.7,
    maxTokens = 2000,
    conversationId,
    headers = {},
    onStreamStart = () => {},
    onStreamEnd = () => {},
    onError = () => {},
    onResponse = () => {},
    onRetry = () => {},
  } = config;

  // Enhanced state management
  const [googleState, setGoogleState] = useState<GoogleChatState>({
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
      ...(conversationId ? { conversationId } : {}),
    },
    onResponse: (response) => {
      setGoogleState((prev) => ({
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

      setGoogleState((prev) => ({
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
      const err = errorObj ?? new Error('Unknown error');
      console.error('Google Generative AI chat error:', err);

      setGoogleState((prev) => ({
        ...prev,
        lastError: err instanceof Error ? err : new Error('Unknown error'),
        isConnecting: false,
        isReconnecting: false,
      }));

      onError(err);

      // Auto-retry for certain errors
      if (shouldRetry(err, googleState.retryCount)) {
        handleRetry();
      }
    },
  });

  // Enhanced submit handler with connection management
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      setGoogleState((prev) => ({
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
      setGoogleState((prev) => ({
        ...prev,
        isConnecting: true,
        lastError: null,
      }));

      originalAppend(message);
    },
    [originalAppend]
  );

  // Enhanced reload with retry tracking
  const reload = useCallback(() => {
    setGoogleState((prev) => ({
      ...prev,
      isReconnecting: true,
      lastError: null,
    }));

    originalReload();
  }, [originalReload]);

  // Stop function
  const stop = useCallback(() => {
    originalStop();
    setGoogleState((prev) => ({
      ...prev,
      isConnecting: false,
      isReconnecting: false,
    }));
  }, [originalStop]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setGoogleState((prev) => ({
      ...prev,
      lastError: null,
      retryCount: 0,
      streamingStats: {
        tokensPerSecond: 0,
        chunksReceived: 0,
        responseTime: 0,
      },
    }));
  }, [setMessages]);

  // Retry function
  const retry = useCallback(() => {
    if (googleState.retryCount >= googleErrorHandling.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    setGoogleState((prev) => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));

    onRetry(googleState.retryCount + 1);

    // Retry the last message or reload
    if (lastMessageRef.current) {
      reload();
    }
  }, [googleState.retryCount, reload, onRetry]);

  // Auto-retry logic
  function shouldRetry(error: Error, retryCount: number): boolean {
    if (retryCount >= googleErrorHandling.maxRetries) {
      return false;
    }

    const errorMessage = error.message.toLowerCase();
    return googleErrorHandling.retryableErrors.some((retryableError) =>
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  function handleRetry() {
    const delay = googleErrorHandling.retryDelay * Math.pow(googleErrorHandling.backoffMultiplier, googleState.retryCount);
    
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
    error: error ?? null,
    googleState,
    append,
    reload,
    stop,
    setMessages,
    retry,
    clearConversation,
  };
} 