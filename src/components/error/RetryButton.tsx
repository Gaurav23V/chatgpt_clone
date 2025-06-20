/**
 * Retry Button Component
 *
 * Smart retry button with exponential backoff, loading states,
 * and customizable retry strategies for AI chat errors.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type AIError, type RecoveryAction } from '@/lib/ai/error-handler';

/**
 * Retry Button Props
 */
export interface RetryButtonProps {
  error: AIError;
  onRetry: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showCountdown?: boolean;
  autoRetry?: boolean;
  maxAutoRetries?: number;
  children?: React.ReactNode;
}

/**
 * Retry State
 */
interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  nextRetryIn: number;
  canAutoRetry: boolean;
  lastRetryTime: number;
}

/**
 * Calculate retry delay with exponential backoff
 */
function calculateRetryDelay(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000
): number {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Get retry delay from error or calculate it
 */
function getRetryDelay(error: AIError, attempt: number): number {
  if (error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }

  // Use different base delays based on error type
  switch (error.type) {
    case 'GOOGLE_RATE_LIMIT':
      return calculateRetryDelay(attempt, 5000, 60000); // Longer delays for rate limits
    case 'NETWORK_ERROR':
    case 'NETWORK_TIMEOUT':
      return calculateRetryDelay(attempt, 2000, 15000); // Medium delays for network
    case 'GOOGLE_API_UNAVAILABLE':
      return calculateRetryDelay(attempt, 3000, 30000); // Longer for API issues
    default:
      return calculateRetryDelay(attempt, 1000, 10000); // Default delays
  }
}

/**
 * Format countdown time
 */
function formatCountdown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Retry Button Component
 */
export function RetryButton({
  error,
  onRetry,
  onCancel,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  showCountdown = true,
  autoRetry = false,
  maxAutoRetries = 2,
  children,
}: RetryButtonProps) {
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    nextRetryIn: 0,
    canAutoRetry: false,
    lastRetryTime: 0,
  });

  const [countdownInterval, setCountdownInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  // Determine if we can auto-retry
  const canAutoRetry =
    autoRetry &&
    error.retryable &&
    state.retryCount < maxAutoRetries;

  // Handle retry logic
  const handleRetry = useCallback(async () => {
    if (state.isRetrying || disabled) return;

    const newRetryCount = state.retryCount + 1;
    setState((prev) => ({
      ...prev,
      isRetrying: true,
      retryCount: newRetryCount,
      lastRetryTime: Date.now(),
    }));

    try {
      await onRetry();

      // Reset state on successful retry
      setState((prev) => ({
        ...prev,
        isRetrying: false,
        retryCount: 0,
        nextRetryIn: 0,
        canAutoRetry: false,
      }));

      // Clear any active timeouts
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        setRetryTimeout(null);
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);

      setState((prev) => ({
        ...prev,
        isRetrying: false,
        canAutoRetry: canAutoRetry && newRetryCount < maxAutoRetries,
      }));

      // Schedule next auto-retry if applicable
      if (canAutoRetry && newRetryCount < maxAutoRetries) {
        scheduleAutoRetry(newRetryCount);
      }
    }
  }, [
    state.isRetrying,
    state.retryCount,
    disabled,
    onRetry,
    canAutoRetry,
    maxAutoRetries,
    countdownInterval,
    retryTimeout,
  ]);

  // Schedule automatic retry with countdown
  const scheduleAutoRetry = useCallback(
    (attempt: number) => {
      const delay = getRetryDelay(error, attempt);
      const delaySeconds = Math.ceil(delay / 1000);

      setState((prev) => ({
        ...prev,
        nextRetryIn: delaySeconds,
        canAutoRetry: true,
      }));

      // Start countdown
      if (showCountdown) {
        const interval = setInterval(() => {
          setState((prev) => {
            if (prev.nextRetryIn <= 1) {
              clearInterval(interval);
              return { ...prev, nextRetryIn: 0 };
            }
            return { ...prev, nextRetryIn: prev.nextRetryIn - 1 };
          });
        }, 1000);
        setCountdownInterval(interval);
      }

      // Schedule the actual retry
      const timeout = setTimeout(() => {
        handleRetry();
      }, delay);
      setRetryTimeout(timeout);
    },
    [error, showCountdown, handleRetry]
  );

  // Start auto-retry on mount if conditions are met
  useEffect(() => {
    if (canAutoRetry && state.retryCount === 0 && !state.isRetrying) {
      scheduleAutoRetry(1);
    }
  }, [canAutoRetry, scheduleAutoRetry, state.retryCount, state.isRetrying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [countdownInterval, retryTimeout]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }

    setState((prev) => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: 0,
      canAutoRetry: false,
    }));

    if (onCancel) {
      onCancel();
    }
  }, [countdownInterval, retryTimeout, onCancel]);

  // Determine button state and text
  const isDisabled = disabled || state.isRetrying;
  const showAutoRetryCountdown = state.canAutoRetry && state.nextRetryIn > 0;

  let buttonText = children || 'Try Again';
  if (state.isRetrying) {
    buttonText = 'Retrying...';
  } else if (showAutoRetryCountdown) {
    buttonText = `Retrying in ${formatCountdown(state.nextRetryIn)}`;
  } else if (state.retryCount > 0 && !showAutoRetryCountdown) {
    buttonText = `Try Again (${state.retryCount + 1})`;
  }

  // Button variant styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-700 text-gray-300 border-gray-600';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <div className='flex flex-col items-center space-y-2'>
      <Button
        onClick={handleRetry}
        disabled={isDisabled}
        className={` ${getVariantClasses()} ${getSizeClasses()} ${className} transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {state.isRetrying ? (
          <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
        ) : showAutoRetryCountdown ? (
          <Clock className='mr-2 h-4 w-4' />
        ) : (
          <RefreshCw className='mr-2 h-4 w-4' />
        )}
        {buttonText}
      </Button>

      {/* Cancel button for auto-retry */}
      {showAutoRetryCountdown && onCancel && (
        <Button
          onClick={handleCancel}
          variant='ghost'
          size='sm'
          className='text-xs text-gray-400 hover:text-gray-300'
        >
          Cancel Auto-Retry
        </Button>
      )}

      {/* Retry info */}
      {state.retryCount > 0 && (
        <div className='text-center text-xs text-gray-400'>
          <div className='flex items-center space-x-1'>
            <AlertCircle className='h-3 w-3' />
            <span>
              {state.retryCount}{' '}
              {state.retryCount === 1 ? 'retry attempt' : 'retry attempts'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple retry button for basic cases
 */
export function BasicRetryButton({
  onRetry,
  disabled = false,
  className = '',
  children = 'Try Again',
}: {
  onRetry: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (isRetrying || disabled) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      className={`${className}`}
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`}
      />
      {isRetrying ? 'Retrying...' : children}
    </Button>
  );
}

export default RetryButton;
