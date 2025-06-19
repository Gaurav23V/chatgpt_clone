/**
 * Authentication Error Alert
 *
 * Inline error alert component for displaying authentication-related errors
 * within forms and components without taking over the entire page.
 */

'use client';

import { useState } from 'react';

import { ERROR_MESSAGES } from '@/lib/auth/error-utils';
import type { AuthErrorAlertProps } from '@/types/auth-errors';

import { SimpleRetryButton } from './AuthRetryButton';

export function AuthErrorAlert({
  error,
  context,
  onRetry,
  onDismiss,
  showTechnicalDetails = false,
  compact = false,
}: AuthErrorAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const template = ERROR_MESSAGES[error.type];

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Get alert styles based on error severity
  const getAlertStyles = () => {
    const baseStyles = 'rounded-lg border transition-all duration-300';

    switch (error.severity) {
      case 'critical':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`;
      case 'high':
        return `${baseStyles} bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800`;
      case 'medium':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`;
    }
  };

  const getIconStyles = () => {
    switch (error.severity) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'high':
        return 'text-orange-600 dark:text-orange-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTextStyles = () => {
    switch (error.severity) {
      case 'critical':
        return 'text-red-800 dark:text-red-200';
      case 'high':
        return 'text-orange-800 dark:text-orange-200';
      case 'medium':
        return 'text-yellow-800 dark:text-yellow-200';
      default:
        return 'text-blue-800 dark:text-blue-200';
    }
  };

  const getErrorIcon = () => {
    switch (error.severity) {
      case 'critical':
        return (
          <svg
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        );
      case 'high':
      case 'medium':
        return (
          <svg
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
      default:
        return (
          <svg
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        );
    }
  };

  const renderActions = () => {
    const actions = [];

    // Retry action
    if (error.suggestedActions.includes('retry') && onRetry) {
      actions.push(
        <SimpleRetryButton
          key='retry'
          onRetry={onRetry}
          className='px-3 py-1 text-xs'
        >
          {template.actionText || 'Retry'}
        </SimpleRetryButton>
      );
    }

    // Sign in action
    if (error.suggestedActions.includes('redirect_to_signin')) {
      actions.push(
        <button
          key='signin'
          onClick={() => (window.location.href = '/sign-in')}
          className='rounded bg-blue-600 px-3 py-1 text-xs text-white transition-colors duration-200 hover:bg-blue-700'
        >
          Sign In
        </button>
      );
    }

    // Refresh page action
    if (error.suggestedActions.includes('refresh_page')) {
      actions.push(
        <button
          key='refresh'
          onClick={() => window.location.reload()}
          className='rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          Refresh Page
        </button>
      );
    }

    // Contact support action
    if (error.suggestedActions.includes('contact_support')) {
      actions.push(
        <button
          key='support'
          onClick={() => window.open('mailto:support@yourdomain.com', '_blank')}
          className='rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          Contact Support
        </button>
      );
    }

    return actions;
  };

  if (compact) {
    return (
      <div className={`${getAlertStyles()} p-3`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className={getIconStyles()}>{getErrorIcon()}</div>
            <div>
              <p className={`text-sm font-medium ${getTextStyles()}`}>
                {error.userMessage}
              </p>
              {error.code && (
                <p className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                  Error: {error.code}
                </p>
              )}
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            {renderActions()}

            {onDismiss && (
              <button
                onClick={handleDismiss}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getAlertStyles()} p-4`}>
      <div className='flex'>
        <div className={`flex-shrink-0 ${getIconStyles()}`}>
          {getErrorIcon()}
        </div>

        <div className='ml-3 flex-1'>
          <h3 className={`text-sm font-medium ${getTextStyles()}`}>
            {template.title}
          </h3>

          <div className={`mt-2 text-sm ${getTextStyles()}`}>
            <p>{error.userMessage}</p>
          </div>

          {/* Error details */}
          {(error.code || context?.errorId) && (
            <div className='mt-3 text-xs text-gray-600 dark:text-gray-400'>
              {error.code && (
                <span className='mr-4 inline-block'>
                  Error Code: <span className='font-mono'>{error.code}</span>
                </span>
              )}
              {context?.errorId && (
                <span className='inline-block'>
                  Error ID: <span className='font-mono'>{context.errorId}</span>
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          {renderActions().length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2'>{renderActions()}</div>
          )}

          {/* Technical details toggle */}
          {showTechnicalDetails &&
            (error.technicalInfo || process.env.NODE_ENV === 'development') && (
              <div className='mt-4'>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className='text-xs text-gray-500 transition-colors duration-200 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                >
                  {isExpanded ? 'Hide' : 'Show'} Technical Details
                </button>

                {isExpanded && (
                  <div className='mt-2 rounded bg-gray-100 p-3 text-xs dark:bg-gray-800'>
                    <div className='space-y-2 text-gray-600 dark:text-gray-400'>
                      <div>
                        <span className='font-medium'>Type:</span> {error.type}
                      </div>
                      <div>
                        <span className='font-medium'>Severity:</span>{' '}
                        {error.severity}
                      </div>
                      <div>
                        <span className='font-medium'>Timestamp:</span>{' '}
                        {error.timestamp.toISOString()}
                      </div>
                      {error.technicalInfo && (
                        <div>
                          <span className='font-medium'>Details:</span>
                          <pre className='mt-1 overflow-x-auto rounded bg-gray-200 p-2 text-xs whitespace-pre-wrap dark:bg-gray-700'>
                            {error.technicalInfo}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <div className='ml-auto pl-3'>
            <div className='-mx-1.5 -my-1.5'>
              <button
                onClick={handleDismiss}
                className='inline-flex rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:hover:bg-gray-700 dark:hover:text-gray-300'
              >
                <span className='sr-only'>Dismiss</span>
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple error alert without actions
 */
export function SimpleErrorAlert({
  message,
  severity = 'medium',
  onDismiss,
}: {
  message: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  onDismiss?: () => void;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'high':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
    }
  };

  return (
    <div className={`rounded-lg border p-3 ${getStyles()}`}>
      <div className='flex items-start justify-between'>
        <p className='text-sm'>{message}</p>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className='ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
