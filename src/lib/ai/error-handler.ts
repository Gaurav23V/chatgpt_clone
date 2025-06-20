/**
 * AI Chat Error Handler
 *
 * Comprehensive error handling system for AI chat functionality:
 * - Groq API error handling with specific error types
 * - Network failure detection and recovery
 * - Authentication error management
 * - Model availability and fallback strategies
 * - Automatic retry with exponential backoff
 * - Error tracking and monitoring
 */

import {
  GROQ_MODELS,
  groqErrorHandling,
  groqModelHelpers,
} from './groq-config';

/**
 * AI Chat Error Types
 */
export type AIErrorType =
  | 'GROQ_RATE_LIMIT'
  | 'GROQ_AUTH_ERROR'
  | 'GROQ_API_UNAVAILABLE'
  | 'GROQ_MODEL_UNAVAILABLE'
  | 'GROQ_CONTEXT_LENGTH_EXCEEDED'
  | 'GROQ_QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'NETWORK_OFFLINE'
  | 'STREAM_ERROR'
  | 'STREAM_INTERRUPTED'
  | 'VALIDATION_ERROR'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

/**
 * Error Severity Levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Recovery Action Types
 */
export type RecoveryAction =
  | 'retry'
  | 'retry_with_backoff'
  | 'fallback_model'
  | 'reduce_context'
  | 'wait_and_retry'
  | 'manual_retry'
  | 'contact_support'
  | 'refresh_page';

/**
 * AI Chat Error Interface
 */
export interface AIError {
  type: AIErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string | number;
  retryable: boolean;
  recoveryActions: RecoveryAction[];
  retryAfter?: number; // seconds
  context?: {
    model?: string;
    requestId?: string;
    timestamp: number;
    userAgent?: string;
    endpoint?: string;
  };
}

/**
 * Error Recovery Configuration
 */
export interface ErrorRecoveryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableModelFallback: boolean;
  enableContextReduction: boolean;
  fallbackModels: string[];
}

/**
 * Default Recovery Configuration
 */
export const DEFAULT_RECOVERY_CONFIG: ErrorRecoveryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  enableModelFallback: true,
  enableContextReduction: true,
  fallbackModels: [
    GROQ_MODELS.LLAMA_3_1_8B.id,
    GROQ_MODELS.LLAMA_3_3_70B.id,
    GROQ_MODELS.LLAMA_3_1_70B.id,
  ],
};

/**
 * Error Classification Helper
 */
export function classifyError(error: any): AIError {
  const timestamp = Date.now();
  const context = {
    timestamp,
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };

  // Groq Rate Limit Errors
  if (groqErrorHandling.isRateLimitError(error)) {
    return {
      type: 'GROQ_RATE_LIMIT',
      severity: 'medium',
      message: `Rate limit exceeded: ${error.message || 'Too many requests'}`,
      userMessage:
        'Too many requests. Please wait a moment before trying again.',
      code: error.status || 429,
      retryable: true,
      recoveryActions: ['wait_and_retry', 'manual_retry'],
      retryAfter: extractRetryAfter(error) || 60,
      context,
    };
  }

  // Groq Authentication Errors
  if (groqErrorHandling.isAuthError(error)) {
    return {
      type: 'GROQ_AUTH_ERROR',
      severity: 'critical',
      message: `Authentication failed: ${error.message || 'Invalid API key'}`,
      userMessage: 'Authentication error. Please contact support.',
      code: error.status || 401,
      retryable: false,
      recoveryActions: ['contact_support', 'refresh_page'],
      context,
    };
  }

  // Network Errors
  if (isNetworkError(error)) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      type: isOffline ? 'NETWORK_OFFLINE' : 'NETWORK_ERROR',
      severity: isOffline ? 'high' : 'medium',
      message: `Network error: ${error.message || 'Connection failed'}`,
      userMessage: isOffline
        ? 'You appear to be offline. Please check your internet connection.'
        : 'Network connection error. Please try again.',
      retryable: true,
      recoveryActions: isOffline
        ? ['manual_retry']
        : ['retry_with_backoff', 'manual_retry'],
      context,
    };
  }

  // Timeout Errors
  if (isTimeoutError(error)) {
    return {
      type: 'NETWORK_TIMEOUT',
      severity: 'medium',
      message: `Request timeout: ${error.message || 'Operation timed out'}`,
      userMessage: 'Request timed out. The AI service might be busy.',
      retryable: true,
      recoveryActions: ['retry_with_backoff', 'fallback_model', 'manual_retry'],
      context,
    };
  }

  // Model Unavailable Errors
  if (isModelUnavailableError(error)) {
    return {
      type: 'GROQ_MODEL_UNAVAILABLE',
      severity: 'medium',
      message: `Model unavailable: ${error.message || 'Selected model is not available'}`,
      userMessage:
        'The selected AI model is temporarily unavailable. Trying an alternative.',
      retryable: true,
      recoveryActions: ['fallback_model', 'retry', 'manual_retry'],
      context,
    };
  }

  // Context Length Exceeded
  if (isContextLengthError(error)) {
    return {
      type: 'GROQ_CONTEXT_LENGTH_EXCEEDED',
      severity: 'medium',
      message: `Context length exceeded: ${error.message || 'Message too long'}`,
      userMessage: 'Your message is too long. Please try a shorter message.',
      retryable: true,
      recoveryActions: ['reduce_context', 'manual_retry'],
      context,
    };
  }

  // Quota Exceeded Errors
  if (isQuotaExceededError(error)) {
    return {
      type: 'GROQ_QUOTA_EXCEEDED',
      severity: 'high',
      message: `Quota exceeded: ${error.message || 'API quota exceeded'}`,
      userMessage: 'API usage limit reached. Please try again later.',
      retryable: false,
      recoveryActions: ['contact_support', 'manual_retry'],
      retryAfter: 3600, // 1 hour
      context,
    };
  }

  // Stream Errors
  if (isStreamError(error)) {
    return {
      type: error.message.includes('interrupted')
        ? 'STREAM_INTERRUPTED'
        : 'STREAM_ERROR',
      severity: 'medium',
      message: `Stream error: ${error.message || 'Streaming failed'}`,
      userMessage: 'Response streaming was interrupted. Please try again.',
      retryable: true,
      recoveryActions: ['retry', 'manual_retry'],
      context,
    };
  }

  // Validation Errors
  if (isValidationError(error)) {
    return {
      type: 'VALIDATION_ERROR',
      severity: 'low',
      message: `Validation error: ${error.message || 'Invalid request'}`,
      userMessage: 'Invalid request format. Please check your input.',
      retryable: false,
      recoveryActions: ['manual_retry'],
      context,
    };
  }

  // Generic API Unavailable
  if (error.status >= 500 && error.status < 600) {
    return {
      type: 'GROQ_API_UNAVAILABLE',
      severity: 'high',
      message: `API unavailable: ${error.message || 'Service temporarily unavailable'}`,
      userMessage:
        'AI service is temporarily unavailable. Please try again in a moment.',
      retryable: true,
      recoveryActions: ['retry_with_backoff', 'fallback_model', 'manual_retry'],
      context,
    };
  }

  // Unknown Error
  return {
    type: 'UNKNOWN_ERROR',
    severity: 'medium',
    message: `Unknown error: ${error.message || 'An unexpected error occurred'}`,
    userMessage: 'Something went wrong. Please try again.',
    retryable: true,
    recoveryActions: ['retry', 'manual_retry', 'refresh_page'],
    context,
  };
}

/**
 * Error Detection Helpers
 */
function isNetworkError(error: any): boolean {
  return (
    error.name === 'NetworkError' ||
    error.code === 'NETWORK_ERROR' ||
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.type === 'network'
  );
}

function isTimeoutError(error: any): boolean {
  return (
    error.name === 'TimeoutError' ||
    error.code === 'TIMEOUT' ||
    error.message?.includes('timeout') ||
    error.message?.includes('timed out')
  );
}

function isModelUnavailableError(error: any): boolean {
  return (
    error.status === 503 ||
    error.code === 'model_unavailable' ||
    (error.message?.includes('model') && error.message?.includes('unavailable'))
  );
}

function isContextLengthError(error: any): boolean {
  return (
    error.code === 'context_length_exceeded' ||
    error.message?.includes('context length') ||
    error.message?.includes('too long') ||
    error.message?.includes('token limit')
  );
}

function isQuotaExceededError(error: any): boolean {
  return (
    error.code === 'quota_exceeded' ||
    error.message?.includes('quota') ||
    error.message?.includes('limit reached')
  );
}

function isStreamError(error: any): boolean {
  return (
    error.name === 'StreamError' ||
    error.message?.includes('stream') ||
    error.message?.includes('streaming')
  );
}

function isValidationError(error: any): boolean {
  return (
    error.status === 400 ||
    error.code === 'validation_error' ||
    error.message?.includes('validation') ||
    error.message?.includes('invalid')
  );
}

function extractRetryAfter(error: any): number | undefined {
  return error.retryAfter || error.headers?.['retry-after'] || undefined;
}

/**
 * Recovery Strategy Implementation
 */
export class AIErrorRecovery {
  private config: ErrorRecoveryConfig;
  private retryAttempts = new Map<string, number>();
  private lastErrors = new Map<string, AIError>();

  constructor(config: ErrorRecoveryConfig = DEFAULT_RECOVERY_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt: number): number {
    const delay =
      this.config.baseDelay *
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error: AIError, requestId?: string): boolean {
    if (!error.retryable) return false;

    const attempts = this.getRetryAttempts(requestId);
    return attempts < this.config.maxRetries;
  }

  /**
   * Get fallback model for failed request
   */
  getFallbackModel(currentModel: string): string | null {
    if (!this.config.enableModelFallback) return null;

    const fallbackModels = this.config.fallbackModels.filter(
      (model) => model !== currentModel
    );

    // Return fastest available model as fallback
    const fastestModels = groqModelHelpers.getFastestModels();
    for (const fallback of fallbackModels) {
      if (fastestModels.some((model) => model.id === fallback)) {
        return fallback;
      }
    }

    return fallbackModels[0] || null;
  }

  /**
   * Reduce context length for context overflow errors
   */
  reduceContext(messages: any[], targetReduction = 0.3): any[] {
    if (!this.config.enableContextReduction) return messages;

    const keepCount = Math.floor(messages.length * (1 - targetReduction));

    // Always keep the system message (if any) and recent messages
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const otherMessages = messages.filter((msg) => msg.role !== 'system');
    const recentMessages = otherMessages.slice(-keepCount);

    return [...systemMessages, ...recentMessages];
  }

  /**
   * Track retry attempt
   */
  incrementRetryAttempts(requestId: string = 'default'): number {
    const current = this.getRetryAttempts(requestId);
    const newCount = current + 1;
    this.retryAttempts.set(requestId, newCount);
    return newCount;
  }

  /**
   * Get current retry attempts
   */
  getRetryAttempts(requestId: string = 'default'): number {
    return this.retryAttempts.get(requestId) || 0;
  }

  /**
   * Reset retry attempts
   */
  resetRetryAttempts(requestId: string = 'default'): void {
    this.retryAttempts.delete(requestId);
  }

  /**
   * Store last error for context
   */
  setLastError(error: AIError, requestId: string = 'default'): void {
    this.lastErrors.set(requestId, error);
  }

  /**
   * Get last error
   */
  getLastError(requestId: string = 'default'): AIError | null {
    return this.lastErrors.get(requestId) || null;
  }

  /**
   * Clear error history
   */
  clearErrorHistory(requestId?: string): void {
    if (requestId) {
      this.retryAttempts.delete(requestId);
      this.lastErrors.delete(requestId);
    } else {
      this.retryAttempts.clear();
      this.lastErrors.clear();
    }
  }
}

/**
 * Error Tracking and Monitoring
 */
export interface ErrorTracker {
  trackError: (error: AIError) => void;
  trackRecovery: (
    error: AIError,
    action: RecoveryAction,
    success: boolean
  ) => void;
  getErrorStats: () => ErrorStats;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<AIErrorType, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRetryCount: number;
}

/**
 * Console Error Tracker (Development)
 */
export class ConsoleErrorTracker implements ErrorTracker {
  private stats: ErrorStats = {
    totalErrors: 0,
    errorsByType: {} as Record<AIErrorType, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    successfulRecoveries: 0,
    failedRecoveries: 0,
    averageRetryCount: 0,
  };

  trackError(error: AIError): void {
    this.stats.totalErrors++;
    this.stats.errorsByType[error.type] =
      (this.stats.errorsByType[error.type] || 0) + 1;
    this.stats.errorsBySeverity[error.severity] =
      (this.stats.errorsBySeverity[error.severity] || 0) + 1;

    console.error('🚨 AI Chat Error:', {
      type: error.type,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      context: error.context,
    });
  }

  trackRecovery(
    error: AIError,
    action: RecoveryAction,
    success: boolean
  ): void {
    if (success) {
      this.stats.successfulRecoveries++;
      console.log('✅ Error Recovery Success:', { error: error.type, action });
    } else {
      this.stats.failedRecoveries++;
      console.warn('❌ Error Recovery Failed:', { error: error.type, action });
    }
  }

  getErrorStats(): ErrorStats {
    return { ...this.stats };
  }
}

/**
 * Default error tracker instance
 */
export const defaultErrorTracker = new ConsoleErrorTracker();

/**
 * Main Error Handler Class
 */
export class AIErrorHandler {
  public recovery: AIErrorRecovery;
  private tracker: ErrorTracker;

  constructor(
    config: ErrorRecoveryConfig = DEFAULT_RECOVERY_CONFIG,
    tracker: ErrorTracker = defaultErrorTracker
  ) {
    this.recovery = new AIErrorRecovery(config);
    this.tracker = tracker;
  }

  /**
   * Handle an error and return recovery strategy
   */
  handleError(
    error: any,
    requestId?: string
  ): {
    aiError: AIError;
    canRetry: boolean;
    retryDelay?: number;
    fallbackModel?: string;
    reducedContext?: any[];
    recommendedAction: RecoveryAction;
  } {
    const aiError = classifyError(error);
    this.tracker.trackError(aiError);
    this.recovery.setLastError(aiError, requestId);

    const canRetry = this.recovery.shouldRetry(aiError, requestId);
    const retryAttempt = this.recovery.getRetryAttempts(requestId) + 1;
    const retryDelay = canRetry
      ? this.calculateRetryDelay(aiError, retryAttempt)
      : undefined;

    // Determine primary recovery action
    const recommendedAction = this.getRecommendedAction(aiError, canRetry);

    return {
      aiError,
      canRetry,
      retryDelay,
      fallbackModel:
        this.recovery.getFallbackModel('current-model') || undefined,
      recommendedAction,
    };
  }

  /**
   * Calculate appropriate retry delay
   */
  private calculateRetryDelay(error: AIError, attempt: number): number {
    if (error.retryAfter) {
      return error.retryAfter * 1000; // Convert to milliseconds
    }
    return this.recovery.calculateRetryDelay(attempt);
  }

  /**
   * Get recommended recovery action
   */
  private getRecommendedAction(
    error: AIError,
    canRetry: boolean
  ): RecoveryAction {
    if (!canRetry) {
      return error.recoveryActions[0] || 'manual_retry';
    }

    // Prioritize actions based on error type
    switch (error.type) {
      case 'GROQ_RATE_LIMIT':
        return 'wait_and_retry';
      case 'GROQ_MODEL_UNAVAILABLE':
        return 'fallback_model';
      case 'GROQ_CONTEXT_LENGTH_EXCEEDED':
        return 'reduce_context';
      case 'NETWORK_ERROR':
      case 'NETWORK_TIMEOUT':
        return 'retry_with_backoff';
      default:
        return 'retry';
    }
  }

  /**
   * Record successful recovery
   */
  recordRecovery(
    error: AIError,
    action: RecoveryAction,
    success: boolean
  ): void {
    this.tracker.trackRecovery(error, action, success);
  }

  /**
   * Get error statistics
   */
  getStats(): ErrorStats {
    return this.tracker.getErrorStats();
  }

  /**
   * Reset recovery state
   */
  reset(requestId?: string): void {
    this.recovery.clearErrorHistory(requestId);
  }
}

/**
 * Default error handler instance
 */
export const defaultErrorHandler = new AIErrorHandler();

// All exports are already declared above
