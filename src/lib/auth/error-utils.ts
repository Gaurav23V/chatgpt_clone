/**
 * Authentication Error Utilities
 *
 * Core utilities for handling authentication errors, including error mapping,
 * logging, recovery strategies, and error context generation.
 */

import type {
  AuthError,
  AuthErrorContext,
  AuthErrorType,
  ClerkErrorMapping,
  ErrorLogger,
  ErrorMessageTemplates,
  ErrorSeverity,
  ErrorTracker,
  RecoveryActionType,
  RetryConfig,
} from '@/types/auth-errors';

// Generate unique error ID
export function generateErrorId(): string {
  return `auth-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Error message templates
export const ERROR_MESSAGES: ErrorMessageTemplates = {
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message:
      'Unable to connect to our servers. Please check your internet connection.',
    userMessage: 'Please check your internet connection and try again.',
    actionText: 'Retry',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    userMessage: 'Your session has expired. Please sign in again to continue.',
    actionText: 'Sign In',
  },
  INVALID_SESSION: {
    title: 'Invalid Session',
    message: 'Your session is invalid. Please sign in again.',
    userMessage: 'There was a problem with your session. Please sign in again.',
    actionText: 'Sign In',
  },
  RATE_LIMITED: {
    title: 'Too Many Attempts',
    message:
      'Too many authentication attempts. Please wait before trying again.',
    userMessage:
      'You&apos;ve made too many attempts. Please wait a few minutes before trying again.',
    actionText: 'Wait and Retry',
  },
  ACCOUNT_SUSPENDED: {
    title: 'Account Suspended',
    message:
      'Your account has been suspended. Please contact support for assistance.',
    userMessage:
      'Your account has been temporarily suspended. Please contact our support team.',
    actionText: 'Contact Support',
  },
  ACCOUNT_DELETED: {
    title: 'Account Not Found',
    message: 'This account no longer exists. Please create a new account.',
    userMessage:
      'This account no longer exists. You may need to create a new account.',
    actionText: 'Sign Up',
  },
  INSUFFICIENT_PERMISSIONS: {
    title: 'Access Denied',
    message: 'You don&apos;t have permission to access this resource.',
    userMessage:
      'You don&apos;t have permission to access this feature. Please contact support if you believe this is an error.',
    actionText: 'Contact Support',
  },
  TOKEN_REFRESH_FAILED: {
    title: 'Authentication Error',
    message: 'Failed to refresh your authentication. Please sign in again.',
    userMessage:
      'There was a problem refreshing your authentication. Please sign in again.',
    actionText: 'Sign In',
  },
  CLERK_SERVICE_ERROR: {
    title: 'Service Temporarily Unavailable',
    message:
      'Our authentication service is temporarily unavailable. Please try again later.',
    userMessage:
      'Our authentication service is experiencing issues. Please try again in a few minutes.',
    actionText: 'Retry',
  },
  UNKNOWN_AUTH_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected authentication error occurred. Please try again.',
    userMessage:
      'Something unexpected happened. Please try again or contact support if the problem persists.',
    actionText: 'Retry',
  },
};

// Clerk error code mappings
export const CLERK_ERROR_MAPPINGS: ClerkErrorMapping[] = [
  {
    clerkCode: 'session_token_expired',
    authErrorType: 'SESSION_EXPIRED',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'medium',
    recoverable: true,
    suggestedActions: ['redirect_to_signin', 'refresh_token'],
  },
  {
    clerkCode: 'session_token_invalid',
    authErrorType: 'INVALID_SESSION',
    userMessage: 'Your session is invalid. Please sign in again.',
    severity: 'medium',
    recoverable: true,
    suggestedActions: ['redirect_to_signin', 'clear_and_retry'],
  },
  {
    clerkCode: 'rate_limit_exceeded',
    authErrorType: 'RATE_LIMITED',
    userMessage: 'Too many attempts. Please wait before trying again.',
    severity: 'medium',
    recoverable: true,
    suggestedActions: ['retry'],
  },
  {
    clerkCode: 'user_locked',
    authErrorType: 'ACCOUNT_SUSPENDED',
    userMessage: 'Your account has been temporarily locked.',
    severity: 'high',
    recoverable: false,
    suggestedActions: ['contact_support'],
  },
  {
    clerkCode: 'user_not_found',
    authErrorType: 'ACCOUNT_DELETED',
    userMessage: 'Account not found. You may need to create a new account.',
    severity: 'high',
    recoverable: false,
    suggestedActions: ['redirect_to_signin', 'contact_support'],
  },
  {
    clerkCode: 'insufficient_permissions',
    authErrorType: 'INSUFFICIENT_PERMISSIONS',
    userMessage: 'You don&apos;t have permission to perform this action.',
    severity: 'medium',
    recoverable: false,
    suggestedActions: ['contact_support'],
  },
  {
    clerkCode: 'network_error',
    authErrorType: 'NETWORK_ERROR',
    userMessage: 'Connection failed. Please check your internet and try again.',
    severity: 'low',
    recoverable: true,
    suggestedActions: ['retry', 'refresh_page'],
  },
];

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'CLERK_SERVICE_ERROR',
    'TOKEN_REFRESH_FAILED',
    'UNKNOWN_AUTH_ERROR',
  ],
};

/**
 * Maps Clerk errors to our standardized auth error format
 */
export function mapClerkError(clerkError: any): AuthError {
  const errorCode = clerkError?.code || clerkError?.message || 'unknown';
  const mapping = CLERK_ERROR_MAPPINGS.find(
    (m) =>
      errorCode.includes(m.clerkCode) ||
      clerkError?.message?.toLowerCase().includes(m.clerkCode)
  );

  const authErrorType = mapping?.authErrorType || 'UNKNOWN_AUTH_ERROR';
  const template = ERROR_MESSAGES[authErrorType];

  return {
    type: authErrorType,
    message: template.message,
    userMessage: mapping?.userMessage || template.userMessage,
    severity: mapping?.severity || 'medium',
    code: errorCode,
    details: {
      clerkErrorCode: clerkError?.code,
      clerkMessage: clerkError?.message,
      clerkStatus: clerkError?.status,
    },
    timestamp: new Date(),
    recoverable: mapping?.recoverable ?? true,
    suggestedActions: mapping?.suggestedActions || ['retry', 'contact_support'],
    technicalInfo:
      process.env.NODE_ENV === 'development'
        ? JSON.stringify(clerkError, null, 2)
        : undefined,
    clerkError,
  };
}

/**
 * Maps network errors to auth error format
 */
export function mapNetworkError(error: Error): AuthError {
  const template = ERROR_MESSAGES.NETWORK_ERROR;

  return {
    type: 'NETWORK_ERROR',
    message: template.message,
    userMessage: template.userMessage,
    severity: 'low',
    code: 'NETWORK_FAILURE',
    details: {
      errorMessage: error.message,
      errorName: error.name,
    },
    timestamp: new Date(),
    recoverable: true,
    suggestedActions: ['retry', 'refresh_page'],
    technicalInfo:
      process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}

/**
 * Creates an auth error context
 */
export function createErrorContext(
  userId?: string,
  sessionId?: string,
  previousErrors: string[] = []
): AuthErrorContext {
  return {
    userId,
    sessionId,
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    timestamp: new Date(),
    errorId: generateErrorId(),
    previousErrors,
  };
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(
  _error: AuthError,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  return config.retryableErrors.includes(_error.type) && _error.recoverable;
}

/**
 * Calculates retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay =
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Console logger for development
 */
export const consoleLogger: ErrorLogger = {
  log: (level, message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console[level](`[Auth ${level.toUpperCase()}]`, message, data);
    }
  },

  logError: (error, context) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 Auth Error: ${error.type}`);
      console.error('Error:', error);
      console.info('Context:', context);
      if (error.technicalInfo) {
        console.debug('Technical Info:', error.technicalInfo);
      }
      console.groupEnd();
    }
  },
};

/**
 * Basic error tracker (placeholder for production tracking)
 */
export const basicErrorTracker: ErrorTracker = {
  track: (error, context) => {
    // In development, log to console
    consoleLogger.logError(error, context);

    // TODO: Replace with actual tracking service in production
    // Examples: Sentry, LogRocket, Datadog, etc.
    // trackingService.track('auth_error', {
    //   error_type: error.type,
    //   error_code: error.code,
    //   user_id: context.userId,
    //   severity: error.severity,
    //   recoverable: error.recoverable
    // });
  },

  trackRecovery: (error, action, success) => {
    consoleLogger.log('info', `Recovery ${success ? 'succeeded' : 'failed'}`, {
      errorType: error.type,
      recoveryAction: action,
      success,
    });

    // TODO: Track recovery attempts in production
    // trackingService.track('auth_recovery', {
    //   error_type: error.type,
    //   recovery_action: action,
    //   success,
    //   timestamp: new Date().toISOString()
    // });
  },
};

/**
 * Creates a generic auth error
 */
export function createAuthError(
  type: AuthErrorType,
  message?: string,
  code?: string | number,
  details?: Record<string, any>
): AuthError {
  const template = ERROR_MESSAGES[type];

  return {
    type,
    message: message || template.message,
    userMessage: template.userMessage,
    severity: getSeverityForErrorType(type),
    code,
    details,
    timestamp: new Date(),
    recoverable: isErrorTypeRecoverable(type),
    suggestedActions: getSuggestedActionsForErrorType(type),
    technicalInfo: process.env.NODE_ENV === 'development' ? message : undefined,
  };
}

// Helper functions
function getSeverityForErrorType(type: AuthErrorType): ErrorSeverity {
  const severityMap: Record<AuthErrorType, ErrorSeverity> = {
    NETWORK_ERROR: 'low',
    SESSION_EXPIRED: 'medium',
    INVALID_SESSION: 'medium',
    RATE_LIMITED: 'medium',
    ACCOUNT_SUSPENDED: 'high',
    ACCOUNT_DELETED: 'high',
    INSUFFICIENT_PERMISSIONS: 'medium',
    TOKEN_REFRESH_FAILED: 'medium',
    CLERK_SERVICE_ERROR: 'medium',
    UNKNOWN_AUTH_ERROR: 'medium',
  };

  return severityMap[type];
}

function isErrorTypeRecoverable(type: AuthErrorType): boolean {
  const nonRecoverableTypes: AuthErrorType[] = [
    'ACCOUNT_SUSPENDED',
    'ACCOUNT_DELETED',
    'INSUFFICIENT_PERMISSIONS',
  ];

  return !nonRecoverableTypes.includes(type);
}

function getSuggestedActionsForErrorType(
  type: AuthErrorType
): RecoveryActionType[] {
  const actionMap: Record<AuthErrorType, RecoveryActionType[]> = {
    NETWORK_ERROR: ['retry', 'refresh_page'],
    SESSION_EXPIRED: ['redirect_to_signin', 'refresh_token'],
    INVALID_SESSION: ['redirect_to_signin', 'clear_and_retry'],
    RATE_LIMITED: ['retry'],
    ACCOUNT_SUSPENDED: ['contact_support'],
    ACCOUNT_DELETED: ['redirect_to_signin', 'contact_support'],
    INSUFFICIENT_PERMISSIONS: ['contact_support'],
    TOKEN_REFRESH_FAILED: ['redirect_to_signin', 'refresh_token'],
    CLERK_SERVICE_ERROR: ['retry', 'refresh_page'],
    UNKNOWN_AUTH_ERROR: ['retry', 'contact_support'],
  };

  return actionMap[type];
}
