/**
 * Authentication Retry Button
 *
 * Standardized retry button component with loading states, retry limits,
 * and exponential backoff visualization.
 */

'use client';

import { useState } from 'react';

import type { ReactNode } from 'react';

import type { AuthRetryButtonProps } from '@/types/auth-errors';

interface ExtendedAuthRetryButtonProps extends AuthRetryButtonProps {
  children?: ReactNode;
}

export function AuthRetryButton({
  onRetry,
  loading = false,
  disabled = false,
  retryCount = 0,
  maxRetries = 3,
  variant = 'primary',
  size = 'md',
  children = 'Retry',
}: ExtendedAuthRetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (disabled || isRetrying || loading) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isDisabled =
    disabled || loading || isRetrying || retryCount >= maxRetries;
  const isLoading = loading || isRetrying;

  // Get button styles based on variant
  const getButtonStyles = () => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variantStyles = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:hover:bg-blue-600',
      secondary:
        'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:hover:bg-gray-600',
      ghost:
        'bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 focus:ring-blue-500 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900',
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]}`;
  };

  // Get loading spinner size
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  // Get retry progress indicator
  const getRetryProgress = () => {
    if (maxRetries <= 1) return null;

    return (
      <div className='mt-2 flex items-center justify-center space-x-1'>
        {Array.from({ length: maxRetries }, (_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-colors duration-200 ${
              index < retryCount
                ? 'bg-red-400'
                : index === retryCount && isLoading
                  ? 'animate-pulse bg-yellow-400'
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
        <span className='ml-2 text-xs text-gray-500 dark:text-gray-400'>
          {retryCount}/{maxRetries}
        </span>
      </div>
    );
  };

  return (
    <div className='inline-block'>
      <button
        onClick={handleRetry}
        disabled={isDisabled}
        className={getButtonStyles()}
        aria-label={
          isLoading ? 'Retrying...' : `Retry (${retryCount}/${maxRetries})`
        }
      >
        {isLoading && (
          <svg
            className={`${getSpinnerSize()} mr-2 animate-spin`}
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        )}

        {isLoading ? 'Retrying...' : children}

        {retryCount >= maxRetries && (
          <svg
            className={`${getSpinnerSize()} ml-2 text-red-400`}
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
        )}
      </button>

      {/* Retry progress indicator */}
      {getRetryProgress()}

      {/* Max retries reached message */}
      {retryCount >= maxRetries && (
        <p className='mt-2 text-center text-xs text-red-600 dark:text-red-400'>
          Maximum retry attempts reached
        </p>
      )}
    </div>
  );
}

/**
 * Simple retry button without progress indicators
 */
export function SimpleRetryButton({
  onRetry,
  loading = false,
  disabled = false,
  children = 'Retry',
  className = '',
}: {
  onRetry: () => Promise<void> | void;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (disabled || isRetrying || loading) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isDisabled = disabled || loading || isRetrying;
  const isLoading = loading || isRetrying;

  return (
    <button
      onClick={handleRetry}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600 ${className} `}
    >
      {isLoading && (
        <svg
          className='mr-2 h-4 w-4 animate-spin'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          />
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          />
        </svg>
      )}
      {isLoading ? 'Retrying...' : children}
    </button>
  );
}
