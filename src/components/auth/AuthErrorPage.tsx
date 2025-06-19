/**
 * Authentication Error Page
 *
 * Full-page error component for displaying authentication-related errors
 * with recovery actions and user-friendly messaging.
 */

'use client';

import { useState } from 'react';

import { ERROR_MESSAGES } from '@/lib/auth/error-utils';
import type { AuthErrorPageProps } from '@/types/auth-errors';

import { AuthRetryButton } from './AuthRetryButton';

export function AuthErrorPage({
  error,
  context,
  onRetry,
  onGoHome,
  showContactSupport = true,
}: AuthErrorPageProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const template = ERROR_MESSAGES[error.type];

  // Get appropriate icon based on error severity
  const getErrorIcon = () => {
    switch (error.severity) {
      case 'critical':
        return (
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
            <svg
              className='h-10 w-10 text-red-600 dark:text-red-400'
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
          </div>
        );
      case 'high':
        return (
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900'>
            <svg
              className='h-10 w-10 text-orange-600 dark:text-orange-400'
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
          </div>
        );
      case 'medium':
        return (
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900'>
            <svg
              className='h-10 w-10 text-yellow-600 dark:text-yellow-400'
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
          </div>
        );
      default:
        return (
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
            <svg
              className='h-10 w-10 text-blue-600 dark:text-blue-400'
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
          </div>
        );
    }
  };

  const getSeverityColor = () => {
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

  const getActionButtons = () => {
    const buttons = [];

    // Primary action based on error type
    if (error.suggestedActions.includes('retry') && onRetry) {
      buttons.push(
        <AuthRetryButton
          key='retry'
          onRetry={onRetry}
          variant='primary'
          size='lg'
        >
          {template.actionText || 'Try Again'}
        </AuthRetryButton>
      );
    }

    if (error.suggestedActions.includes('redirect_to_signin')) {
      buttons.push(
        <button
          key='signin'
          onClick={() => (window.location.href = '/sign-in')}
          className='rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          Sign In
        </button>
      );
    }

    // Secondary actions
    if (onGoHome) {
      buttons.push(
        <button
          key='home'
          onClick={onGoHome}
          className='rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          Go Home
        </button>
      );
    }

    if (
      showContactSupport &&
      error.suggestedActions.includes('contact_support')
    ) {
      buttons.push(
        <button
          key='support'
          onClick={() => window.open('mailto:support@yourdomain.com', '_blank')}
          className='rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
        >
          Contact Support
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900'>
      <div className='w-full max-w-md'>
        <div className='space-y-6 text-center'>
          {/* Error Icon */}
          {getErrorIcon()}

          {/* Error Title */}
          <div>
            <h1 className='mb-2 text-3xl font-bold text-gray-900 dark:text-white'>
              {template.title}
            </h1>
            <p className='text-lg text-gray-600 dark:text-gray-400'>
              {error.userMessage}
            </p>
          </div>

          {/* Error Details */}
          {error.code && (
            <div className='rounded-lg bg-gray-100 p-4 dark:bg-gray-800'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Error Code:{' '}
                <span className='font-mono font-medium'>{error.code}</span>
              </p>
              {context?.errorId && (
                <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                  Error ID:{' '}
                  <span className='font-mono font-medium'>
                    {context.errorId}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-3'>
            {getActionButtons().map((button) => (
              <div key={button.key} className='w-full'>
                {button}
              </div>
            ))}
          </div>

          {/* Technical Details Toggle */}
          {(error.technicalInfo || process.env.NODE_ENV === 'development') && (
            <div className='space-y-3'>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className='text-sm text-gray-500 transition-colors duration-200 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              >
                {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
              </button>

              {showTechnicalDetails && (
                <div className='rounded-lg bg-gray-100 p-4 text-left dark:bg-gray-800'>
                  <h4 className='mb-2 text-sm font-medium text-gray-900 dark:text-white'>
                    Technical Information
                  </h4>
                  <div className='space-y-2 text-xs text-gray-600 dark:text-gray-400'>
                    <div>
                      <span className='font-medium'>Type:</span> {error.type}
                    </div>
                    <div>
                      <span className='font-medium'>Severity:</span>
                      <span className={`ml-1 ${getSeverityColor()}`}>
                        {error.severity}
                      </span>
                    </div>
                    <div>
                      <span className='font-medium'>Timestamp:</span>{' '}
                      {error.timestamp.toISOString()}
                    </div>
                    {error.technicalInfo && (
                      <div>
                        <span className='font-medium'>Details:</span>
                        <pre className='mt-1 overflow-x-auto rounded bg-gray-200 p-2 text-xs dark:bg-gray-700'>
                          {error.technicalInfo}
                        </pre>
                      </div>
                    )}
                    {context && (
                      <div>
                        <span className='font-medium'>Context:</span>
                        <pre className='mt-1 overflow-x-auto rounded bg-gray-200 p-2 text-xs dark:bg-gray-700'>
                          {JSON.stringify(
                            {
                              url: context.url,
                              userAgent: `${context.userAgent.substring(0, 50)}...`,
                              errorId: context.errorId,
                            },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className='text-center'>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              If this problem persists, please contact our support team with the
              error ID above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
