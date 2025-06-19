/**
 * Authentication Error Types
 *
 * Comprehensive type definitions for authentication-related errors,
 * error handling strategies, and recovery mechanisms.
 */

import type { ReactNode } from 'react';

// Core auth error types
export type AuthErrorType =
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'INVALID_SESSION'
  | 'RATE_LIMITED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_DELETED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'TOKEN_REFRESH_FAILED'
  | 'CLERK_SERVICE_ERROR'
  | 'UNKNOWN_AUTH_ERROR';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Recovery action types
export type RecoveryActionType =
  | 'retry'
  | 'refresh_token'
  | 'clear_and_retry'
  | 'sign_out'
  | 'redirect_to_signin'
  | 'contact_support'
  | 'refresh_page';

// Auth error interface
export interface AuthError {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  code?: string | number;
  details?: Record<string, any>;
  timestamp: Date;
  recoverable: boolean;
  suggestedActions: RecoveryActionType[];
  technicalInfo?: string;
  clerkError?: any;
}

// Error recovery strategy
export interface ErrorRecoveryStrategy {
  type: RecoveryActionType;
  label: string;
  description: string;
  icon?: string;
  primary?: boolean;
  action: () => Promise<boolean> | Promise<void> | void;
}

// Error context for error boundary
export interface AuthErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent: string;
  url: string;
  timestamp: Date;
  errorId: string;
  previousErrors: string[];
}

// Error boundary props
export interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: (_error: AuthError, context: AuthErrorContext) => ReactNode;
  onError?: (_error: AuthError, context: AuthErrorContext) => void;
  enableLogging?: boolean;
  maxRetries?: number;
  autoRetry?: boolean;
}

// Error alert props
export interface AuthErrorAlertProps {
  error: AuthError;
  context?: AuthErrorContext;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  compact?: boolean;
}

// Error page props
export interface AuthErrorPageProps {
  error: AuthError;
  context?: AuthErrorContext;
  onRetry?: () => void;
  onGoHome?: () => void;
  showContactSupport?: boolean;
}

// Retry button props
export interface AuthRetryButtonProps {
  onRetry: () => Promise<void> | void;
  loading?: boolean;
  disabled?: boolean;
  retryCount?: number;
  maxRetries?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// Error tracking interface
export interface ErrorTracker {
  track: (_error: AuthError, context: AuthErrorContext) => void;
  trackRecovery: (
    _error: AuthError,
    action: RecoveryActionType,
    success: boolean
  ) => void;
}

// Error logger interface
export interface ErrorLogger {
  log: (level: 'info' | 'warn' | 'error', message: string, data?: any) => void;
  logError: (_error: AuthError, context: AuthErrorContext) => void;
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: AuthErrorType[];
}

// Auth error handler configuration
export interface AuthErrorHandlerConfig {
  enableAutoRetry: boolean;
  retryConfig: RetryConfig;
  enableLogging: boolean;
  enableTracking: boolean;
  showTechnicalDetails: boolean;
  contactSupportUrl?: string;
  homeUrl: string;
}

// Error statistics for monitoring
export interface ErrorStatistics {
  errorType: AuthErrorType;
  count: number;
  lastOccurrence: Date;
  successfulRecoveries: number;
  failedRecoveries: number;
  averageRecoveryTime: number;
}

// Auth error event
export interface AuthErrorEvent {
  type: 'error' | 'recovery' | 'retry';
  error: AuthError;
  context: AuthErrorContext;
  recoveryAction?: RecoveryActionType;
  success?: boolean;
  retryAttempt?: number;
}

// Error boundary state
export interface ErrorBoundaryState {
  hasError: boolean;
  error: AuthError | null;
  context: AuthErrorContext | null;
  retryCount: number;
  isRetrying: boolean;
  lastRetryTime: Date | null;
}

// Hook return types
export interface UseAuthErrorReturn {
  error: AuthError | null;
  context: AuthErrorContext | null;
  retry: () => Promise<void>;
  clearError: () => void;
  reportError: (error: AuthError) => void;
  isRetrying: boolean;
  retryCount: number;
}

export interface UseErrorRecoveryReturn {
  executeRecovery: (strategy: RecoveryActionType) => Promise<boolean>;
  getAvailableStrategies: (error: AuthError) => ErrorRecoveryStrategy[];
  isExecuting: boolean;
  lastExecutedStrategy: RecoveryActionType | null;
}

// Clerk-specific error mappings
export interface ClerkErrorMapping {
  clerkCode: string | number;
  authErrorType: AuthErrorType;
  userMessage: string;
  severity: ErrorSeverity;
  recoverable: boolean;
  suggestedActions: RecoveryActionType[];
}

// Error message templates
export type ErrorMessageTemplates = {
  [K in AuthErrorType]: {
    title: string;
    message: string;
    userMessage: string;
    actionText?: string;
  };
};

// Export utility types
export type AuthErrorHandler = (
  _error: AuthError,
  context: AuthErrorContext
) => void;
export type RecoveryExecutor = (
  strategy: RecoveryActionType
) => Promise<boolean>;
export type ErrorReporter = (
  _error: AuthError,
  context: AuthErrorContext
) => void;
