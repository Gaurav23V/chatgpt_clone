/**
 * Authentication Error Boundary
 *
 * React error boundary specifically designed for handling authentication-related errors.
 * Catches errors, provides user-friendly messages, and offers recovery actions.
 */

'use client';

import React, { Component, ReactNode } from 'react';

import { useAuth, useUser } from '@clerk/nextjs';

import {
  basicErrorTracker,
  calculateRetryDelay,
  consoleLogger,
  createAuthError,
  createErrorContext,
  DEFAULT_RETRY_CONFIG,
  isRetryableError,
  mapClerkError,
  mapNetworkError,
} from '@/lib/auth/error-utils';
import { storeCurrentLocationAndRedirect } from '@/lib/auth/redirect-utils';
import type {
  AuthError,
  AuthErrorBoundaryProps,
  AuthErrorContext,
  ErrorBoundaryState,
  RecoveryActionType,
} from '@/types/auth-errors';

import { AuthErrorPage } from './AuthErrorPage';

/**
 * Error boundary class component (required for React error boundaries)
 */
class AuthErrorBoundaryClass extends Component<
  AuthErrorBoundaryProps & {
    userId?: string;
    sessionId?: string;
  },
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(
    props: AuthErrorBoundaryProps & { userId?: string; sessionId?: string }
  ) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      context: null,
      retryCount: 0,
      isRetrying: false,
      lastRetryTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // This runs during the render phase, so we just update state
    return {
      hasError: true,
    };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // This runs during the commit phase, so we can perform side effects
    const authError = this.mapErrorToAuthError(_error);
    const context = createErrorContext(
      this.props.userId,
      this.props.sessionId,
      this.state.error ? [this.state.error.type] : []
    );

    this.setState({
      error: authError,
      context,
    });

    // Log and track the error
    if (this.props.enableLogging !== false) {
      consoleLogger.logError(authError, context);
    }

    basicErrorTracker.track(authError, context);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(authError, context);
    }

    // Auto-retry if enabled and error is retryable
    if (
      this.props.autoRetry &&
      isRetryableError(authError) &&
      this.state.retryCount <
        (this.props.maxRetries || DEFAULT_RETRY_CONFIG.maxAttempts)
    ) {
      this.scheduleRetry();
    }
  }

  private mapErrorToAuthError(error: Error): AuthError {
    // Check if it's a Clerk error
    if (
      error.name === 'ClerkAPIResponseError' ||
      error.message.includes('clerk')
    ) {
      return mapClerkError(error);
    }

    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return mapNetworkError(error);
    }

    // Default to unknown auth error
    return createAuthError('UNKNOWN_AUTH_ERROR', error.message, undefined, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  private scheduleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    const delay = calculateRetryDelay(this.state.retryCount + 1);

    this.setState({ isRetrying: true });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      context: null,
      retryCount: prevState.retryCount + 1,
      isRetrying: false,
      lastRetryTime: new Date(),
    }));

    // Track retry attempt
    if (this.state.error) {
      basicErrorTracker.trackRecovery(this.state.error, 'retry', true);
    }
  };

  private handleRecoveryAction = async (action: RecoveryActionType) => {
    if (!this.state.error || !this.state.context) return;

    try {
      await this.executeRecoveryAction(action);
      basicErrorTracker.trackRecovery(this.state.error, action, true);
    } catch (error) {
      consoleLogger.log('error', 'Recovery action failed', { action, error });
      basicErrorTracker.trackRecovery(this.state.error, action, false);
    }
  };

  private executeRecoveryAction = async (
    action: RecoveryActionType
  ): Promise<void> => {
    switch (action) {
      case 'retry':
        this.handleRetry();
        break;

      case 'refresh_page':
        window.location.reload();
        break;

      case 'redirect_to_signin':
        storeCurrentLocationAndRedirect('sign-in');
        break;

      case 'sign_out':
        // This would need to be handled by a parent component with access to Clerk
        if (typeof window !== 'undefined') {
          window.location.href = '/sign-in';
        }
        break;

      case 'clear_and_retry':
        // Clear local storage and session storage
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        this.handleRetry();
        break;

      case 'contact_support':
        if (typeof window !== 'undefined') {
          window.open('mailto:support@yourdomain.com', '_blank');
        }
        break;

      case 'refresh_token':
        // This would need to be implemented with Clerk token refresh
        // For now, redirect to sign-in
        storeCurrentLocationAndRedirect('sign-in');
        break;

      default:
        console.warn('Unknown recovery action:', action);
    }
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.context) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.context);
      }

      // Use default error page
      return (
        <AuthErrorPage
          error={this.state.error}
          context={this.state.context}
          onRetry={() => this.handleRecoveryAction('retry')}
          onGoHome={() => (window.location.href = '/')}
          showContactSupport={true}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to get auth context for error boundary
 */
function useAuthContext() {
  const { userId } = useAuth();
  const { user } = useUser();

  return {
    userId: userId || undefined,
    sessionId: user?.id || undefined,
  };
}

/**
 * Wrapper component that provides auth context to error boundary
 */
export function AuthErrorBoundary(props: AuthErrorBoundaryProps) {
  const authContext = useAuthContext();

  return (
    <AuthErrorBoundaryClass
      {...props}
      userId={authContext.userId}
      sessionId={authContext.sessionId}
    />
  );
}

/**
 * HOC for wrapping components with auth error boundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<AuthErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default AuthErrorBoundary;
