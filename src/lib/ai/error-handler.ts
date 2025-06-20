/**
 * AI Chat Error Handler
 *
 * Comprehensive error handling system for AI chat functionality:
 * - Google Generative AI error handling with specific error types
 * - Network failure detection and recovery
 * - Authentication error management
 * - Model availability and fallback strategies
 * - Automatic retry with exponential backoff
 * - Error tracking and monitoring
 */

import {
  GOOGLE_MODELS,
  googleErrorHandling,
  googleModelHelpers,
} from './google-config';

/**
 * AI Chat Error Types
 */
export type AIErrorType =
  | 'GOOGLE_RATE_LIMIT'
  | 'GOOGLE_AUTH_ERROR'
  | 'GOOGLE_API_UNAVAILABLE'
  | 'GOOGLE_MODEL_UNAVAILABLE'
  | 'GOOGLE_CONTEXT_LENGTH_EXCEEDED'
  | 'GOOGLE_QUOTA_EXCEEDED'
  | 'GOOGLE_CONTENT_FILTER'
  | 'NETWORK_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_OFFLINE'
  | 'STREAM_ERROR'
  | 'STREAM_INTERRUPTED'
  | 'VALIDATION_ERROR'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

/**
 * AI Error interface with metadata
 */
export interface AIError extends Error {
  type: AIErrorType;
  code?: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  metadata?: {
    model?: string;
    requestId?: string;
    timestamp?: number;
    context?: any;
  };
}

/**
 * Error classification and recovery strategies
 */
export const errorClassification = {
  // Google Generative AI specific errors
  'API key': { type: 'GOOGLE_AUTH_ERROR' as AIErrorType, retryable: false },
  'authentication': { type: 'GOOGLE_AUTH_ERROR' as AIErrorType, retryable: false },
  'quota': { type: 'GOOGLE_QUOTA_EXCEEDED' as AIErrorType, retryable: true, retryAfter: 3600 as number | undefined },
  'rate limit': { type: 'GOOGLE_RATE_LIMIT' as AIErrorType, retryable: true, retryAfter: 60 as number | undefined },
  'content': { type: 'GOOGLE_CONTENT_FILTER' as AIErrorType, retryable: false },
  'model not found': { type: 'GOOGLE_MODEL_UNAVAILABLE' as AIErrorType, retryable: true },
  'service unavailable': { type: 'GOOGLE_API_UNAVAILABLE' as AIErrorType, retryable: true },
  'context length': { type: 'GOOGLE_CONTEXT_LENGTH_EXCEEDED' as AIErrorType, retryable: false },
  
  // Network errors
  'network': { type: 'NETWORK_ERROR' as AIErrorType, retryable: true },
  'timeout': { type: 'NETWORK_TIMEOUT' as AIErrorType, retryable: true },
  'offline': { type: 'NETWORK_OFFLINE' as AIErrorType, retryable: true },
  
  // Stream errors
  'stream': { type: 'STREAM_ERROR' as AIErrorType, retryable: true },
  'aborted': { type: 'STREAM_INTERRUPTED' as AIErrorType, retryable: true },
  
  // Validation errors
  'validation': { type: 'VALIDATION_ERROR' as AIErrorType, retryable: false },
  'invalid': { type: 'INVALID_REQUEST' as AIErrorType, retryable: false },
};

/**
 * Classify error based on message and response
 */
export function classifyError(error: Error | any, response?: Response): AIError {
  const message = error.message?.toLowerCase() || '';
  const status = response?.status;
  
  // Find matching error classification
  const classification = Object.entries(errorClassification).find(([key]) =>
    message.includes(key)
  );
  
  const baseClassification = classification?.[1] || {
    type: 'UNKNOWN_ERROR' as AIErrorType,
    retryable: false,
  };
  
  // Override based on HTTP status codes
  let finalClassification = { ...baseClassification };
  
  if (status) {
    switch (status) {
      case 401:
        finalClassification = { type: 'GOOGLE_AUTH_ERROR', retryable: false };
        break;
      case 403:
        finalClassification = { type: 'GOOGLE_QUOTA_EXCEEDED', retryable: true };
        break;
      case 429:
        finalClassification = { type: 'GOOGLE_RATE_LIMIT', retryable: true };
        break;
      case 400:
        if (message.includes('content')) {
          finalClassification = { type: 'GOOGLE_CONTENT_FILTER', retryable: false };
        }
        break;
      case 404:
        finalClassification = { type: 'GOOGLE_MODEL_UNAVAILABLE', retryable: true };
        break;
      case 500:
      case 502:
      case 503:
        finalClassification = { type: 'GOOGLE_API_UNAVAILABLE', retryable: true };
        break;
    }
  }
  
  // Create enhanced error object
  const enhancedError: AIError = Object.assign(error, {
    type: finalClassification.type,
    code: status?.toString(),
    retryable: finalClassification.retryable,
    // Only include retryAfter if it exists on finalClassification and is not undefined
    ...(typeof (finalClassification as any).retryAfter !== 'undefined'
      ? { retryAfter: (finalClassification as any).retryAfter }
      : {}),
    metadata: {
      timestamp: Date.now(),
      originalMessage: error.message,
      status,
    },
  });
  
  return enhancedError;
}

/**
 * Recovery strategy configuration
 */
export interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  enableModelFallback: boolean;
  enableContextReduction: boolean;
  fallbackModels: string[];
}

export const DEFAULT_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  enableModelFallback: true,
  enableContextReduction: true,
  fallbackModels: [
    GOOGLE_MODELS.GEMINI_1_5_FLASH.id,
    GOOGLE_MODELS.GEMINI_1_5_FLASH_8B.id,
    GOOGLE_MODELS.GEMINI_1_0_PRO.id,
  ],
};

/**
 * Recovery action types
 */
export type RecoveryAction =
  | 'RETRY'
  | 'SWITCH_MODEL'
  | 'REDUCE_CONTEXT'
  | 'WAIT_AND_RETRY'
  | 'USER_ACTION_REQUIRED'
  | 'PERMANENT_FAILURE';

/**
 * Get recommended recovery action for error
 */
export function getRecoveryAction(
  error: AIError,
  retryCount: number,
  config: ErrorRecoveryConfig = DEFAULT_RECOVERY_CONFIG
): RecoveryAction {
  // Non-retryable errors
  if (!error.retryable) {
    switch (error.type) {
      case 'GOOGLE_CONTENT_FILTER':
      case 'VALIDATION_ERROR':
      case 'INVALID_REQUEST':
        return 'USER_ACTION_REQUIRED';
      case 'GOOGLE_AUTH_ERROR':
        return 'PERMANENT_FAILURE';
      case 'GOOGLE_CONTEXT_LENGTH_EXCEEDED':
        return config.enableContextReduction ? 'REDUCE_CONTEXT' : 'USER_ACTION_REQUIRED';
      default:
        return 'PERMANENT_FAILURE';
    }
  }
  
  // Retryable errors - check retry count
  if (retryCount >= config.maxRetries) {
    return config.enableModelFallback ? 'SWITCH_MODEL' : 'PERMANENT_FAILURE';
  }
  
  // Rate limit errors - wait
  if (error.type === 'GOOGLE_RATE_LIMIT' && error.retryAfter) {
    return 'WAIT_AND_RETRY';
  }
  
  // Model unavailable - try fallback
  if (error.type === 'GOOGLE_MODEL_UNAVAILABLE' && config.enableModelFallback) {
    return 'SWITCH_MODEL';
  }
  
  // Default retry
  return 'RETRY';
}

/**
 * Default error handler with automatic recovery
 */
export function defaultErrorHandler(
  error: Error | any,
  response?: Response,
  config: ErrorRecoveryConfig = DEFAULT_RECOVERY_CONFIG
) {
  const classifiedError = classifyError(error, response);
  const recoveryAction = getRecoveryAction(classifiedError, 0, config);
  
  console.error('AI Chat Error:', {
    type: classifiedError.type,
    message: classifiedError.message,
    retryable: classifiedError.retryable,
    recoveryAction,
    metadata: classifiedError.metadata,
  });
  
  return {
    error: classifiedError,
    recoveryAction,
    shouldRetry: classifiedError.retryable && recoveryAction === 'RETRY',
    retryDelay: calculateRetryDelay(classifiedError, 0, config),
  };
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  error: AIError,
  retryCount: number,
  config: ErrorRecoveryConfig
): number {
  // Use error-specific retry delay if available
  if (error.retryAfter) {
    return error.retryAfter * 1000;
  }
  
  // Exponential backoff
  return Math.min(
    config.retryDelay * Math.pow(config.backoffMultiplier, retryCount),
    30000 // Max 30 seconds
  );
}

/**
 * Model fallback utilities
 */
export const modelFallback = {
  /**
   * Get next fallback model
   */
  getNextModel: (currentModel: string, config: ErrorRecoveryConfig): string | null => {
    const fallbackModels = config.fallbackModels;
    const currentIndex = fallbackModels.indexOf(currentModel);
    
    if (currentIndex === -1) {
      // Current model not in fallback list, use first fallback
      return fallbackModels[0] || null;
    }
    
    // Get next model in fallback chain
    return fallbackModels[currentIndex + 1] || null;
  },
  
  /**
   * Get fastest available model
   */
  getFastestModel: (): string => {
    const fastModels = googleModelHelpers.getFastestModels();
    return fastModels[0]?.id || GOOGLE_MODELS.GEMINI_1_5_FLASH_8B.id;
  },
  
  /**
   * Get most reliable model
   */
  getMostReliableModel: (): string => {
    return GOOGLE_MODELS.GEMINI_1_5_FLASH.id;
  },
};

/**
 * Context reduction utilities
 */
export const contextReduction = {
  /**
   * Reduce message context by percentage
   */
  reduceMessages: (messages: any[], percentage: number = 0.5): any[] => {
    if (messages.length <= 2) return messages; // Keep system message and at least one user message
    
    const keepCount = Math.max(2, Math.floor(messages.length * (1 - percentage)));
    return [messages[0], ...messages.slice(-keepCount + 1)]; // Keep system message + recent messages
  },
  
  /**
   * Truncate long messages
   */
  truncateMessages: (messages: any[], maxLength: number = 4000): any[] => {
    return messages.map((message) => ({
      ...message,
      content: message.content.length > maxLength 
        ? message.content.substring(0, maxLength) + '...'
        : message.content,
    }));
  },
};

/**
 * Error monitoring and analytics
 */
export const errorMonitoring = {
  /**
   * Track error occurrence
   */
  trackError: (error: AIError, context?: any) => {
    // In production, send to analytics service
    console.warn('AI Error Tracked:', {
      type: error.type,
      message: error.message,
      retryable: error.retryable,
      timestamp: error.metadata?.timestamp,
      context,
    });
  },
  
  /**
   * Track recovery success
   */
  trackRecovery: (error: AIError, action: RecoveryAction, success: boolean) => {
    console.log('Recovery Attempt:', {
      errorType: error.type,
      action,
      success,
      timestamp: Date.now(),
    });
  },
};
