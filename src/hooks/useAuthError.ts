/**
 * Authentication Error Hooks
 *
 * React hooks for handling authentication errors, recovery strategies,
 * and error state management.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth, useClerk } from '@clerk/nextjs';

import {
  basicErrorTracker,
  calculateRetryDelay,
  consoleLogger,
  createAuthError,
  createErrorContext,
  DEFAULT_RETRY_CONFIG,
  isRetryableError,
} from '@/lib/auth/error-utils';
import { storeCurrentLocationAndRedirect } from '@/lib/auth/redirect-utils';
import type {
  AuthError,
  AuthErrorContext,
  ErrorRecoveryStrategy,
  RecoveryActionType,
  UseAuthErrorReturn,
  UseErrorRecoveryReturn,
} from '@/types/auth-errors';

/**
 * Hook for managing authentication errors
 */
export function useAuthError(): UseAuthErrorReturn {
  const [error, setError] = useState<AuthError | null>(null);
  const [context, setContext] = useState<AuthErrorContext | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { userId } = useAuth();

  const clearError = useCallback(() => {
    setError(null);
    setContext(null);
    setRetryCount(0);
    setIsRetrying(false);

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const reportError = useCallback(
    (authError: AuthError) => {
      const errorContext = createErrorContext(
        userId || undefined,
        undefined,
        error ? [error.type] : []
      );

      setError(authError);
      setContext(errorContext);

      // Log and track the error
      consoleLogger.logError(authError, errorContext);
      basicErrorTracker.track(authError, errorContext);
    },
    [userId, error]
  );

  const retry = useCallback(async () => {
    if (!error || !isRetryableError(error) || isRetrying) {
      return;
    }

    const newRetryCount = retryCount + 1;
    const delay = calculateRetryDelay(newRetryCount);

    setIsRetrying(true);
    setRetryCount(newRetryCount);

    // Wait for the calculated delay
    await new Promise((resolve) => {
      retryTimeoutRef.current = setTimeout(resolve, delay);
    });

    try {
      // Clear the error to trigger a retry
      setError(null);
      setContext(null);
      setIsRetrying(false);

      // Track successful retry
      basicErrorTracker.trackRecovery(error, 'retry', true);
    } catch (retryError) {
      // Handle retry failure
      const newError = createAuthError(
        'UNKNOWN_AUTH_ERROR',
        `Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`,
        'RETRY_FAILED'
      );

      reportError(newError);
      basicErrorTracker.trackRecovery(error, 'retry', false);
      setIsRetrying(false);
    }
  }, [error, retryCount, isRetrying, reportError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    error,
    context,
    retry,
    clearError,
    reportError,
    isRetrying,
    retryCount,
  };
}

/**
 * Hook for executing error recovery strategies
 */
export function useErrorRecovery(): UseErrorRecoveryReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecutedStrategy, setLastExecutedStrategy] =
    useState<RecoveryActionType | null>(null);
  const { signOut } = useClerk();

  const executeRecovery = useCallback(
    async (strategy: RecoveryActionType): Promise<boolean> => {
      if (isExecuting) return false;

      setIsExecuting(true);
      setLastExecutedStrategy(strategy);

      try {
        switch (strategy) {
          case 'retry':
            // This should be handled by the calling component
            return true;

          case 'refresh_page':
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
            return true;

          case 'redirect_to_signin':
            storeCurrentLocationAndRedirect('sign-in');
            return true;

          case 'sign_out':
            try {
              await signOut();
              if (typeof window !== 'undefined') {
                window.location.href = '/sign-in';
              }
            } catch (signOutError) {
              // Fallback to direct redirect
              if (typeof window !== 'undefined') {
                window.location.href = '/sign-in';
              }
            }
            return true;

          case 'clear_and_retry':
            if (typeof window !== 'undefined') {
              localStorage.clear();
              sessionStorage.clear();
              // Clear auth-related data
              const authKeys = Object.keys(localStorage).filter(
                (key) =>
                  key.includes('clerk') ||
                  key.includes('auth') ||
                  key.includes('session')
              );
              authKeys.forEach((key) => localStorage.removeItem(key));
            }
            return true;

          case 'contact_support':
            if (typeof window !== 'undefined') {
              window.open(
                'mailto:support@yourdomain.com?subject=Authentication Error',
                '_blank'
              );
            }
            return true;

          case 'refresh_token':
            // This would typically involve calling Clerk's token refresh
            // For now, redirect to sign-in as a fallback
            storeCurrentLocationAndRedirect('sign-in');
            return true;

          default:
            console.warn('Unknown recovery strategy:', strategy);
            return false;
        }
      } catch (error) {
        consoleLogger.log('error', 'Recovery strategy failed', {
          strategy,
          error,
        });
        return false;
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting, signOut]
  );

  const getAvailableStrategies = useCallback(
    (error: AuthError): ErrorRecoveryStrategy[] => {
      const strategies: ErrorRecoveryStrategy[] = [];

      error.suggestedActions.forEach((action) => {
        switch (action) {
          case 'retry':
            strategies.push({
              type: 'retry',
              label: 'Try Again',
              description: 'Attempt the operation again',
              icon: '🔄',
              primary: true,
              action: () => executeRecovery('retry'),
            });
            break;

          case 'refresh_page':
            strategies.push({
              type: 'refresh_page',
              label: 'Refresh Page',
              description: 'Reload the current page',
              icon: '🔄',
              action: () => executeRecovery('refresh_page'),
            });
            break;

          case 'redirect_to_signin':
            strategies.push({
              type: 'redirect_to_signin',
              label: 'Sign In',
              description: 'Go to the sign-in page',
              icon: '🔑',
              primary:
                error.type === 'SESSION_EXPIRED' ||
                error.type === 'INVALID_SESSION',
              action: () => executeRecovery('redirect_to_signin'),
            });
            break;

          case 'sign_out':
            strategies.push({
              type: 'sign_out',
              label: 'Sign Out',
              description: 'Sign out and clear your session',
              icon: '🚪',
              action: () => executeRecovery('sign_out'),
            });
            break;

          case 'clear_and_retry':
            strategies.push({
              type: 'clear_and_retry',
              label: 'Clear Data & Retry',
              description: 'Clear local data and try again',
              icon: '🧹',
              action: () => executeRecovery('clear_and_retry'),
            });
            break;

          case 'contact_support':
            strategies.push({
              type: 'contact_support',
              label: 'Contact Support',
              description: 'Get help from our support team',
              icon: '💬',
              action: () => executeRecovery('contact_support'),
            });
            break;

          case 'refresh_token':
            strategies.push({
              type: 'refresh_token',
              label: 'Refresh Authentication',
              description: 'Refresh your authentication token',
              icon: '🔑',
              action: () => executeRecovery('refresh_token'),
            });
            break;
        }
      });

      return strategies;
    },
    [executeRecovery]
  );

  return {
    executeRecovery,
    getAvailableStrategies,
    isExecuting,
    lastExecutedStrategy,
  };
}

/**
 * Hook for handling network-related auth errors
 */
export function useAuthNetworkError() {
  const { reportError } = useAuthError();

  const handleNetworkError = useCallback(
    (error: Error) => {
      const authError = createAuthError(
        'NETWORK_ERROR',
        error.message,
        'NETWORK_FAILURE',
        {
          originalError: error.name,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        }
      );

      reportError(authError);
    },
    [reportError]
  );

  const wrapAsyncCall = useCallback(
    async <T>(
      asyncCall: () => Promise<T>,
      errorMessage = 'Network request failed'
    ): Promise<T | null> => {
      try {
        return await asyncCall();
      } catch (error) {
        if (error instanceof Error) {
          handleNetworkError(error);
        } else {
          const networkError = new Error(errorMessage);
          handleNetworkError(networkError);
        }
        return null;
      }
    },
    [handleNetworkError]
  );

  return {
    handleNetworkError,
    wrapAsyncCall,
  };
}

/**
 * Hook for automatic error recovery with exponential backoff
 */
export function useAutoRecovery(
  error: AuthError | null,
  maxAttempts: number = 3,
  enableAutoRetry: boolean = true
) {
  const [autoRetryCount, setAutoRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const { executeRecovery } = useErrorRecovery();
  const autoRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!error || !enableAutoRetry || !isRetryableError(error)) {
      return;
    }

    if (autoRetryCount >= maxAttempts) {
      return;
    }

    const delay = calculateRetryDelay(autoRetryCount + 1);
    setIsAutoRetrying(true);

    autoRetryTimeoutRef.current = setTimeout(async () => {
      try {
        const success = await executeRecovery('retry');
        if (success) {
          setAutoRetryCount((prev) => prev + 1);
          basicErrorTracker.trackRecovery(error, 'retry', true);
        } else {
          basicErrorTracker.trackRecovery(error, 'retry', false);
        }
      } catch (recoveryError) {
        basicErrorTracker.trackRecovery(error, 'retry', false);
      } finally {
        setIsAutoRetrying(false);
      }
    }, delay);

    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, [error, autoRetryCount, maxAttempts, enableAutoRetry, executeRecovery]);

  // Reset retry count when error changes or clears
  useEffect(() => {
    if (!error) {
      setAutoRetryCount(0);
      setIsAutoRetrying(false);
    }
  }, [error]);

  return {
    autoRetryCount,
    isAutoRetrying,
    maxAttempts,
  };
}
