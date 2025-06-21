/**
 * Enhanced useGroqChat Hook
 *
 * Advanced version of useGroqChat with comprehensive error handling,
 * automatic recovery strategies, and enhanced user feedback.
 * Integrates with the new error handling system.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type CreateMessage,
  type Message,
  useChat as useAIChat,
} from 'ai/react';

import {
  type AIError,
  classifyError,
  DEFAULT_RECOVERY_CONFIG,
  defaultErrorHandlerInstance,
  type ErrorRecoveryConfig,
  type RecoveryAction,
} from '@/components/error';
import {
  googleErrorHandling,
  googleModelHelpers,
} from '@/lib/ai/google-config';

/**
 * Enhanced Groq Chat Configuration
 */
export interface EnhancedGroqChatConfig {
  api?: string;
  initialMessages?: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enableAutoRetry?: boolean;
  enableModelFallback?: boolean;
  enableContextReduction?: boolean;
  recoveryConfig?: Partial<ErrorRecoveryConfig>;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: AIError) => void;
  onRetry?: (attempt: number) => void;
  onModelFallback?: (fromModel: string, toModel: string) => void;
  onRecoveryAction?: (action: RecoveryAction, success: boolean) => void;
}

/**
 * Enhanced Chat State
 */
export interface EnhancedGroqChatState {
  // Connection state
  isConnecting: boolean;
  isReconnecting: boolean;
  isRecovering: boolean;
  connectionAttempts: number;

  // Error state
  lastError: AIError | null;
  errorHistory: AIError[];
  retryCount: number;

  // Performance metrics
  streamingStats: {
    tokensPerSecond: number;
    chunksReceived: number;
    responseTime: number;
    averageResponseTime: number;
  };

  // Recovery state
  currentModel: string;
  fallbackAttempts: number;
  contextReduced: boolean;

  // Network state
  isOnline: boolean;
  networkStatus: 'online' | 'offline' | 'slow';
}

/**
 * Enhanced useGroqChat Hook Return Type
 */
export interface UseEnhancedGroqChatReturn {
  // Base chat functionality
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  error: Error | null;

  // Enhanced functionality
  enhancedState: EnhancedGroqChatState;

  // Actions
  append: (message: CreateMessage) => void;
  reload: () => void;
  stop: () => void;
  setMessages: (messages: Message[]) => void;
  retry: () => Promise<void>;
  clearConversation: () => void;

  // Recovery actions
  switchModel: (modelId: string) => void;
  reduceContext: (percentage?: number) => void;
  resetErrorState: () => void;

  // Utility functions
  canRetry: boolean;
  getErrorUI: () => { component: string; props: any } | null;
  getRecommendedAction: () => RecoveryAction | null;
}

/**
 * Enhanced useGroqChat Hook
 */
export function useEnhancedGroqChat(
  config: EnhancedGroqChatConfig = {}
): UseEnhancedGroqChatReturn {
  const {
    api = '/api/chat',
    initialMessages = [],
    model: initialModel = 'llama-3.1-8b-instant',
    temperature = 0.7,
    maxTokens = 2000,
    enableAutoRetry = true,
    enableModelFallback = true,
    enableContextReduction = true,
    recoveryConfig = {},
    onStreamStart = () => {},
    onStreamEnd = () => {},
    onError = () => {},
    onRetry = () => {},
    onModelFallback = () => {},
    onRecoveryAction = () => {},
  } = config;

  // Merge recovery configuration
  const finalRecoveryConfig = { ...DEFAULT_RECOVERY_CONFIG, ...recoveryConfig };

  // Enhanced state management
  const [enhancedState, setEnhancedState] = useState<EnhancedGroqChatState>({
    isConnecting: false,
    isReconnecting: false,
    isRecovering: false,
    connectionAttempts: 0,
    lastError: null,
    errorHistory: [],
    retryCount: 0,
    streamingStats: {
      tokensPerSecond: 0,
      chunksReceived: 0,
      responseTime: 0,
      averageResponseTime: 0,
    },
    currentModel: initialModel,
    fallbackAttempts: 0,
    contextReduced: false,
    isOnline: true,
    networkStatus: 'online',
  });

  // Refs for performance tracking and cleanup
  const streamStartTime = useRef<number>(0);
  const lastMessageRef = useRef<Message | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const responseTimesRef = useRef<number[]>([]);
  const requestIdRef = useRef<string>('default');

  // Initialize the base useChat hook with current model
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
    body: {
      model: enhancedState.currentModel,
      temperature,
      maxTokens,
      stream: true,
    },
    onResponse: (response) => {
      setEnhancedState((prev) => ({
        ...prev,
        isConnecting: false,
        isReconnecting: false,
        isRecovering: false,
        connectionAttempts: 0,
      }));

      streamStartTime.current = Date.now();
      onStreamStart();
    },
    onFinish: (message) => {
      const responseTime = Date.now() - streamStartTime.current;
      responseTimesRef.current.push(responseTime);

      // Keep only last 10 response times for average calculation
      if (responseTimesRef.current.length > 10) {
        responseTimesRef.current.shift();
      }

      const averageResponseTime =
        responseTimesRef.current.reduce((a, b) => a + b, 0) /
        responseTimesRef.current.length;

      setEnhancedState((prev) => ({
        ...prev,
        streamingStats: {
          ...prev.streamingStats,
          responseTime,
          averageResponseTime,
        },
        retryCount: 0,
        lastError: null, // Clear error on successful completion
      }));

      lastMessageRef.current = message;
      onStreamEnd();
    },
    onError: async (errorObj) => {
      const rawError = errorObj || new Error('Unknown error');
      const aiError = classifyError(rawError);

      console.error('🚨 Enhanced Groq chat error:', aiError);

      setEnhancedState((prev) => ({
        ...prev,
        lastError: aiError,
        errorHistory: [...prev.errorHistory.slice(-9), aiError], // Keep last 10 errors
        isConnecting: false,
        isReconnecting: false,
        isRecovering: false,
      }));

      onError(aiError);

      // Handle error with recovery strategies
      await handleErrorWithRecovery(aiError);
    },
  });

  // Network status monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      setEnhancedState((prev) => ({
        ...prev,
        isOnline,
        networkStatus: isOnline ? 'online' : 'offline',
      }));
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Handle error with recovery strategies
  const handleErrorWithRecovery = useCallback(
    async (aiError: AIError) => {
      const errorResult = defaultErrorHandlerInstance.handleError(
        aiError,
        requestIdRef.current
      );
      const { canRetry, retryDelay } = errorResult;

      setEnhancedState((prev) => ({
        ...prev,
        isRecovering: true,
      }));

      // Execute recovery action based on error type
      let recoverySuccess = false;

      try {
        switch (aiError.type) {
          case 'GOOGLE_MODEL_UNAVAILABLE':
            if (enableModelFallback) {
              const fallbackModel =
                googleModelHelpers.getFastestModels()[0]?.id;
              if (fallbackModel) {
                recoverySuccess = await attemptModelFallback(fallbackModel);
              }
            }
            break;

          case 'GOOGLE_CONTEXT_LENGTH_EXCEEDED':
            if (enableContextReduction) {
              recoverySuccess = await attemptContextReduction();
            }
            break;

          case 'GOOGLE_RATE_LIMIT':
          case 'GOOGLE_API_UNAVAILABLE':
            if (enableAutoRetry && canRetry) {
              recoverySuccess = await attemptAutoRetry(retryDelay || 1000);
            }
            break;

          default:
            // No automatic recovery for this action
            break;
        }

        onRecoveryAction('RETRY', recoverySuccess);
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        recoverySuccess = false;
      }

      setEnhancedState((prev) => ({
        ...prev,
        isRecovering: false,
      }));
    },
    [
      enableAutoRetry,
      enableModelFallback,
      enableContextReduction,
      onRecoveryAction,
    ]
  );

  // Attempt model fallback
  const attemptModelFallback = useCallback(
    async (fallbackModel: string): Promise<boolean> => {
      try {
        const currentModel = enhancedState.currentModel;

        setEnhancedState((prev) => ({
          ...prev,
          currentModel: fallbackModel,
          fallbackAttempts: prev.fallbackAttempts + 1,
        }));

        onModelFallback(currentModel, fallbackModel);

        // Retry the last message with the new model
        if (lastMessageRef.current) {
          await originalAppend(lastMessageRef.current);
        }

        return true;
      } catch {
        return false;
      }
    },
    [enhancedState.currentModel, onModelFallback, originalAppend]
  );

  // Attempt context reduction
  const attemptContextReduction = useCallback(async (): Promise<boolean> => {
    try {
      const currentMessages = messages;
      // Simple context reduction - keep first and last few messages
      const reducedMessages =
        currentMessages.length > 4
          ? [currentMessages[0], ...currentMessages.slice(-3)]
          : currentMessages;

      setMessages(reducedMessages);
      setEnhancedState((prev) => ({
        ...prev,
        contextReduced: true,
      }));

      // Retry with reduced context
      if (lastMessageRef.current) {
        await originalAppend(lastMessageRef.current);
      }

      return true;
    } catch {
      return false;
    }
  }, [messages, setMessages, originalAppend]);

  // Attempt automatic retry
  const attemptAutoRetry = useCallback(
    async (delay: number): Promise<boolean> => {
      return new Promise((resolve) => {
        setEnhancedState((prev) => ({
          ...prev,
          isReconnecting: true,
          retryCount: prev.retryCount + 1,
        }));

        retryTimeoutRef.current = setTimeout(async () => {
          try {
            onRetry(enhancedState.retryCount + 1);
            await originalReload();
            resolve(true);
          } catch {
            resolve(false);
          }
        }, delay);
      });
    },
    [enhancedState.retryCount, onRetry, originalReload]
  );

  // Enhanced submit handler
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      setEnhancedState((prev) => ({
        ...prev,
        isConnecting: true,
        lastError: null,
      }));

      originalHandleSubmit(e || (new Event('submit') as any));
    },
    [originalHandleSubmit]
  );

  // Enhanced append
  const append = useCallback(
    (message: CreateMessage) => {
      setEnhancedState((prev) => ({
        ...prev,
        isConnecting: true,
        lastError: null,
      }));

      originalAppend(message);
    },
    [originalAppend]
  );

  // Enhanced reload
  const reload = useCallback(() => {
    setEnhancedState((prev) => ({
      ...prev,
      isReconnecting: true,
      connectionAttempts: prev.connectionAttempts + 1,
    }));

    originalReload();
  }, [originalReload]);

  // Enhanced stop
  const stop = useCallback(() => {
    originalStop();

    setEnhancedState((prev) => ({
      ...prev,
      isConnecting: false,
      isReconnecting: false,
      isRecovering: false,
    }));

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [originalStop]);

  // Manual retry
  const retry = useCallback(async () => {
    if (enhancedState.lastError && lastMessageRef.current) {
      setEnhancedState((prev) => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        lastError: null,
      }));

      try {
        await originalAppend(lastMessageRef.current);
      } catch (error) {
        console.error('Manual retry failed:', error);
      }
    }
  }, [enhancedState.lastError, originalAppend]);

  // Switch model manually
  const switchModel = useCallback((modelId: string) => {
    setEnhancedState((prev) => ({
      ...prev,
      currentModel: modelId,
      fallbackAttempts: 0,
    }));
  }, []);

  // Reduce context manually
  const reduceContext = useCallback(
    (percentage = 0.3) => {
      const currentMessages = messages;
      // Simple context reduction
      const keepCount = Math.max(
        2,
        Math.floor(currentMessages.length * (1 - percentage))
      );
      const reducedMessages = currentMessages.slice(-keepCount);
      setMessages(reducedMessages);

      setEnhancedState((prev) => ({
        ...prev,
        contextReduced: true,
      }));
    },
    [messages, setMessages]
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    setInput('');
    setEnhancedState((prev) => ({
      ...prev,
      retryCount: 0,
      lastError: null,
      errorHistory: [],
      connectionAttempts: 0,
      fallbackAttempts: 0,
      contextReduced: false,
      streamingStats: {
        tokensPerSecond: 0,
        chunksReceived: 0,
        responseTime: 0,
        averageResponseTime: 0,
      },
    }));
  }, [setMessages, setInput]);

  // Reset error state
  const resetErrorState = useCallback(() => {
    setEnhancedState((prev) => ({
      ...prev,
      lastError: null,
      errorHistory: [],
      retryCount: 0,
    }));
  }, []);

  // Get appropriate error UI
  const getErrorUI = useCallback(() => {
    if (!enhancedState.lastError) return null;

    switch (enhancedState.lastError.type) {
      case 'GOOGLE_RATE_LIMIT':
        return {
          component: 'RateLimitWarning',
          props: { error: enhancedState.lastError, onRetry: retry },
        };
      case 'NETWORK_OFFLINE':
      case 'NETWORK_ERROR':
        return {
          component: 'OfflineIndicator',
          props: { variant: 'card' as const, onRetry: retry },
        };
      default:
        return {
          component: 'ErrorMessage',
          props: { error: enhancedState.lastError, variant: 'card' as const },
        };
    }
  }, [enhancedState.lastError, retry]);

  // Get recommended action
  const getRecommendedAction = useCallback((): RecoveryAction | null => {
    if (!enhancedState.lastError) return null;

    // Simple recommendation based on error type
    if (enhancedState.lastError.retryable) {
      return 'RETRY';
    }
    return 'USER_ACTION_REQUIRED';
  }, [enhancedState.lastError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Base functionality
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error: error || null,

    // Enhanced state
    enhancedState,

    // Actions
    append,
    reload,
    stop,
    setMessages,
    retry,
    clearConversation,

    // Recovery actions
    switchModel,
    reduceContext,
    resetErrorState,

    // Utility functions
    canRetry:
      !!enhancedState.lastError?.retryable &&
      enhancedState.retryCount < finalRecoveryConfig.maxRetries,
    getErrorUI,
    getRecommendedAction,
  };
}

export default useEnhancedGroqChat;
