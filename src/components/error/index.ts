/**
 * Error Components Export Barrel
 *
 * This file exports all error handling components and utilities for easy importing.
 * Components in this directory handle:
 * - Chat error boundaries and fallback UI
 * - AI error classification and recovery
 * - Network status and offline handling
 * - Rate limit warnings and guidance
 * - Retry mechanisms with exponential backoff
 */

// Main error boundary for chat components
export {
  ChatErrorBoundary,
  type ChatErrorBoundaryProps,
  withChatErrorBoundary,
} from './ChatErrorBoundary';

// Error message components
export {
  ErrorMessage,
  type ErrorMessageProps,
  QuickErrorMessage,
} from './ErrorMessage';

// Retry functionality
export {
  BasicRetryButton,
  RetryButton,
  type RetryButtonProps,
} from './RetryButton';

// Network status and offline handling
export {
  type NetworkStatus,
  OfflineIndicator,
  type OfflineIndicatorProps,
  useNetworkStatus,
} from './OfflineIndicator';

// Rate limit warnings
export {
  RateLimitWarning,
  type RateLimitWarningProps,
  SimpleRateLimitWarning,
} from './RateLimitWarning';

// Re-export error handler utilities for convenience
export {
  // Types
  type AIError,
  type AIErrorType,
  type ErrorSeverity,
  type ErrorRecoveryConfig,
  type RecoveryAction,
  // Main error handler
  type AIErrorHandler,
  DefaultAIErrorHandler,
  defaultErrorHandlerInstance,
  // Error classification
  classifyError,
  // Configuration
  DEFAULT_RECOVERY_CONFIG,
  defaultErrorHandler,
  // Recovery utilities
  getRecoveryAction,
  calculateRetryDelay,
} from '@/lib/ai/error-handler';

// Re-export utility functions are available through individual imports
