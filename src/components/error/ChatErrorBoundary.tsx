/**
 * Chat Error Boundary
 *
 * React error boundary specifically designed for chat components.
 * Catches errors during chat interactions, provides user-friendly messages,
 * offers retry mechanisms, and logs errors appropriately.
 */

'use client';

import React, { Component } from 'react';

import {
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { AIErrorHandler, defaultErrorHandler } from '@/lib/ai/error-handler';
import type { AIError, RecoveryAction } from '@/lib/ai/error-handler';

/**
 * Chat Error Boundary Props
 */
export interface ChatErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AIError, retry: () => void) => ReactNode;
  onError?: (error: AIError) => void;
  onRetry?: (attempt: number) => void;
  enableAutoRetry?: boolean;
  maxAutoRetries?: number;
  showErrorDetails?: boolean;
  className?: string;
}

/**
 * Chat Error Boundary State
 */
interface ChatErrorBoundaryState {
  hasError: boolean;
  aiError: AIError | null;
  retryAttempt: number;
  isRetrying: boolean;
  canAutoRetry: boolean;
  errorId: string;
}

/**
 * Error Boundary Class Component
 */
class ChatErrorBoundaryClass extends Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  private errorHandler: AIErrorHandler;
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ChatErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      aiError: null,
      retryAttempt: 0,
      isRetrying: false,
      canAutoRetry: false,
      errorId: '',
    };

    this.errorHandler = defaultErrorHandler;
  }

  /**
   * Static method to catch errors
   */
  static getDerivedStateFromError(
    error: Error
  ): Partial<ChatErrorBoundaryState> {
    const errorId = `chat-error-${Date.now()}`;
    return {
      hasError: true,
      errorId,
    };
  }

  /**
   * Component did catch error
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, enableAutoRetry = false, maxAutoRetries = 2 } = this.props;
    const { errorId } = this.state;

    // Handle the error through our AI error handler
    const errorResult = this.errorHandler.handleError(error, errorId);
    const { aiError, canRetry, retryDelay } = errorResult;

    this.setState({
      aiError,
      canAutoRetry:
        enableAutoRetry && canRetry && this.state.retryAttempt < maxAutoRetries,
    });

    // Call onError callback
    if (onError) {
      onError(aiError);
    }

    // Log error details
    console.error('🚨 Chat Error Boundary caught error:', {
      error: error.message,
      errorInfo,
      aiError,
      canRetry,
      retryDelay,
    });

    // Schedule auto-retry if enabled
    if (this.state.canAutoRetry && retryDelay) {
      this.scheduleAutoRetry(retryDelay);
    }
  }

  /**
   * Schedule automatic retry
   */
  private scheduleAutoRetry = (delay: number) => {
    this.setState({ isRetrying: true });

    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  /**
   * Handle manual or automatic retry
   */
  private handleRetry = () => {
    const { onRetry } = this.props;
    const { retryAttempt, errorId } = this.state;

    const newRetryAttempt = retryAttempt + 1;

    // Clear retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Reset error boundary state
    this.setState({
      hasError: false,
      aiError: null,
      retryAttempt: newRetryAttempt,
      isRetrying: false,
      canAutoRetry: false,
    });

    // Track retry attempt
    this.errorHandler.recovery.incrementRetryAttempts(errorId);

    // Call onRetry callback
    if (onRetry) {
      onRetry(newRetryAttempt);
    }

    console.log(`🔄 Retrying chat operation (attempt ${newRetryAttempt})`);
  };

  /**
   * Handle refresh page action
   */
  private handleRefreshPage = () => {
    window.location.reload();
  };

  /**
   * Handle contact support action
   */
  private handleContactSupport = () => {
    // In a real app, this would open a support widget or email
    console.log('📧 Contact support requested');
    alert('Please contact support at support@example.com');
  };

  /**
   * Component will unmount
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Render error UI
   */
  private renderErrorUI() {
    const { aiError, isRetrying, canAutoRetry } = this.state;
    const { showErrorDetails = false } = this.props;

    if (!aiError) {
      return this.renderGenericError();
    }

    return (
      <div className='flex min-h-[400px] items-center justify-center p-8'>
        <div className='max-w-md text-center'>
          {/* Error Icon */}
          <div className='mb-6 flex justify-center'>
            {this.getErrorIcon(aiError)}
          </div>

          {/* Error Message */}
          <h3 className='mb-2 text-lg font-semibold text-white'>
            {this.getErrorTitle(aiError)}
          </h3>

          <p className='mb-6 text-sm text-gray-300'>{aiError.userMessage}</p>

          {/* Error Details (Development) */}
          {showErrorDetails && (
            <div className='mb-6 rounded-lg bg-gray-800 p-3 text-left text-xs'>
              <p className='mb-1'>
                <strong>Type:</strong> {aiError.type}
              </p>
              <p className='mb-1'>
                <strong>Severity:</strong> {aiError.severity}
              </p>
              <p className='mb-1'>
                <strong>Retryable:</strong> {aiError.retryable ? 'Yes' : 'No'}
              </p>
              {aiError.code && (
                <p className='mb-1'>
                  <strong>Code:</strong> {aiError.code}
                </p>
              )}
            </div>
          )}

          {/* Auto-retry indicator */}
          {isRetrying && canAutoRetry && (
            <div className='mb-4 flex items-center justify-center text-sm text-blue-400'>
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
              Retrying automatically...
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col gap-3'>
            {this.renderActionButtons(aiError)}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Get error icon based on error type
   */
  private getErrorIcon(aiError: AIError) {
    const iconClass = 'h-12 w-12';

    switch (aiError.type) {
      case 'NETWORK_ERROR':
      case 'NETWORK_TIMEOUT':
        return <WifiOff className={`${iconClass} text-orange-500`} />;
      case 'NETWORK_OFFLINE':
        return <WifiOff className={`${iconClass} text-red-500`} />;
      case 'GROQ_RATE_LIMIT':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      case 'GROQ_AUTH_ERROR':
      case 'GROQ_QUOTA_EXCEEDED':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      default:
        return <MessageSquare className={`${iconClass} text-gray-500`} />;
    }
  }

  /**
   * Get error title based on error type
   */
  private getErrorTitle(aiError: AIError): string {
    switch (aiError.type) {
      case 'NETWORK_ERROR':
      case 'NETWORK_TIMEOUT':
        return 'Connection Problem';
      case 'NETWORK_OFFLINE':
        return "You're Offline";
      case 'GROQ_RATE_LIMIT':
        return 'Too Many Requests';
      case 'GROQ_AUTH_ERROR':
        return 'Authentication Error';
      case 'GROQ_API_UNAVAILABLE':
        return 'Service Unavailable';
      case 'GROQ_MODEL_UNAVAILABLE':
        return 'Model Unavailable';
      case 'GROQ_CONTEXT_LENGTH_EXCEEDED':
        return 'Message Too Long';
      case 'GROQ_QUOTA_EXCEEDED':
        return 'Usage Limit Reached';
      case 'STREAM_ERROR':
      case 'STREAM_INTERRUPTED':
        return 'Streaming Error';
      case 'VALIDATION_ERROR':
        return 'Invalid Request';
      default:
        return 'Something Went Wrong';
    }
  }

  /**
   * Render action buttons based on recovery actions
   */
  private renderActionButtons(aiError: AIError) {
    const { isRetrying } = this.state;
    const buttons = [];

    // Primary retry button
    if (aiError.retryable && !isRetrying) {
      buttons.push(
        <Button
          key='retry'
          onClick={this.handleRetry}
          className='bg-blue-600 hover:bg-blue-700'
          disabled={isRetrying}
        >
          <RefreshCw className='mr-2 h-4 w-4' />
          Try Again
        </Button>
      );
    }

    // Secondary actions based on recovery actions
    if (aiError.recoveryActions.includes('refresh_page')) {
      buttons.push(
        <Button
          key='refresh'
          onClick={this.handleRefreshPage}
          variant='outline'
          className='border-gray-600 text-gray-300 hover:bg-gray-700'
        >
          Refresh Page
        </Button>
      );
    }

    if (aiError.recoveryActions.includes('contact_support')) {
      buttons.push(
        <Button
          key='support'
          onClick={this.handleContactSupport}
          variant='outline'
          className='border-gray-600 text-gray-300 hover:bg-gray-700'
        >
          Contact Support
        </Button>
      );
    }

    return buttons;
  }

  /**
   * Render generic error when no specific error info
   */
  private renderGenericError() {
    return (
      <div className='flex min-h-[400px] items-center justify-center p-8'>
        <div className='max-w-md text-center'>
          <div className='mb-6 flex justify-center'>
            <AlertCircle className='h-12 w-12 text-red-500' />
          </div>

          <h3 className='mb-2 text-lg font-semibold text-white'>Chat Error</h3>

          <p className='mb-6 text-sm text-gray-300'>
            Something went wrong with the chat. Please try again.
          </p>

          <Button
            onClick={this.handleRetry}
            className='bg-blue-600 hover:bg-blue-700'
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  /**
   * Render method
   */
  render() {
    const { hasError, aiError } = this.state;
    const { children, fallback, className = '' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback && aiError) {
        return (
          <div className={className}>{fallback(aiError, this.handleRetry)}</div>
        );
      }

      // Use default error UI
      return (
        <div className={`chat-error-boundary ${className}`}>
          {this.renderErrorUI()}
        </div>
      );
    }

    return children;
  }
}

/**
 * Functional wrapper component for easier usage
 */
export function ChatErrorBoundary(props: ChatErrorBoundaryProps) {
  return <ChatErrorBoundaryClass {...props} />;
}

/**
 * HOC for wrapping components with chat error boundary
 */
export function withChatErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ChatErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ChatErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ChatErrorBoundary>
  );

  WrappedComponent.displayName = `withChatErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ChatErrorBoundary;
