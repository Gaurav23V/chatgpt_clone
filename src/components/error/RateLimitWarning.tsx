/**
 * Rate Limit Warning Component
 *
 * Displays rate limit warnings with countdown timers, usage quotas,
 * and helpful guidance for Groq API rate limits.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { AlertTriangle, Clock, Info, TrendingUp, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type AIError } from '@/lib/ai/error-handler';
import { GROQ_RATE_LIMITS } from '@/lib/ai/groq-config';

/**
 * Rate Limit Warning Props
 */
export interface RateLimitWarningProps {
  error: AIError;
  className?: string;
  variant?: 'banner' | 'card' | 'inline';
  showQuota?: boolean;
  showTips?: boolean;
  onRetry?: () => void;
  onUpgrade?: () => void;
}

/**
 * Rate Limit State
 */
interface RateLimitState {
  timeRemaining: number;
  canRetry: boolean;
  quotaUsed: number;
  quotaLimit: number;
  tierType: 'free' | 'paid';
}

/**
 * Format countdown time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}

/**
 * Get rate limit type from error
 */
function getRateLimitType(error: AIError): 'requests' | 'tokens' | 'quota' {
  const message = error.message.toLowerCase();
  if (message.includes('token')) return 'tokens';
  if (message.includes('quota')) return 'quota';
  return 'requests';
}

/**
 * Get estimated tier from rate limit info
 */
function estimateTier(retryAfter?: number): 'free' | 'paid' {
  // Heuristic: free tier typically has longer retry delays
  return (retryAfter || 0) > 300 ? 'free' : 'paid';
}

/**
 * Rate Limit Warning Component
 */
export function RateLimitWarning({
  error,
  className = '',
  variant = 'card',
  showQuota = true,
  showTips = true,
  onRetry,
  onUpgrade,
}: RateLimitWarningProps) {
  const [state, setState] = useState<RateLimitState>({
    timeRemaining: error.retryAfter || 60,
    canRetry: false,
    quotaUsed: 0,
    quotaLimit: 100,
    tierType: estimateTier(error.retryAfter),
  });

  const [countdownInterval, setCountdownInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Get rate limit details
  const rateLimitType = getRateLimitType(error);
  const limits =
    state.tierType === 'free'
      ? GROQ_RATE_LIMITS.FREE_TIER
      : GROQ_RATE_LIMITS.PAID_TIER;

  // Start countdown timer
  useEffect(() => {
    if (state.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          return { ...prev, timeRemaining: 0, canRetry: true };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    setCountdownInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.timeRemaining]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (state.canRetry && onRetry) {
      onRetry();
    }
  }, [state.canRetry, onRetry]);

  // Handle upgrade
  const handleUpgrade = useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default action - open Groq console
      window.open('https://console.groq.com/settings/billing', '_blank');
    }
  }, [onUpgrade]);

  // Get rate limit icon and color
  const getIcon = () => {
    const iconClass = 'h-5 w-5';
    return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
  };

  // Get rate limit message
  const getMessage = () => {
    switch (rateLimitType) {
      case 'tokens':
        return 'Token limit exceeded';
      case 'quota':
        return 'Daily quota exceeded';
      default:
        return 'Request limit exceeded';
    }
  };

  // Get helpful description
  const getDescription = () => {
    switch (rateLimitType) {
      case 'tokens':
        return "You've sent too many tokens per minute. Please wait before sending more messages.";
      case 'quota':
        return "You've reached your daily usage quota. Upgrade your plan for higher limits.";
      default:
        return "You've made too many requests. Please wait before trying again.";
    }
  };

  // Get quota information
  const getQuotaInfo = () => {
    switch (rateLimitType) {
      case 'tokens':
        return {
          used: '95%',
          limit: `${limits.TPM.toLocaleString()} tokens/min`,
          resetTime: 'Resets every minute',
        };
      case 'quota':
        return {
          used: '100%',
          limit: `${limits.TPD.toLocaleString()} tokens/day`,
          resetTime: 'Resets daily at midnight UTC',
        };
      default:
        return {
          used: '90%',
          limit: `${limits.RPM} requests/min`,
          resetTime: 'Resets every minute',
        };
    }
  };

  const quotaInfo = getQuotaInfo();

  // Get tips for avoiding rate limits
  const getTips = () => {
    const commonTips = [
      'Use shorter messages to reduce token usage',
      'Wait between requests to avoid burst limits',
      'Consider upgrading to a paid plan for higher limits',
    ];

    switch (rateLimitType) {
      case 'tokens':
        return [
          'Break long conversations into smaller chunks',
          'Remove unnecessary context from messages',
          ...commonTips,
        ];
      case 'quota':
        return [
          'Monitor your daily usage in the console',
          'Upgrade to a paid plan for unlimited access',
          'Use more efficient models when possible',
        ];
      default:
        return [
          'Space out your requests over time',
          'Implement client-side rate limiting',
          ...commonTips,
        ];
    }
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center space-x-2 text-sm text-yellow-700 dark:text-yellow-300 ${className}`}
      >
        {getIcon()}
        <span>{getMessage()}</span>
        {state.timeRemaining > 0 && (
          <span className='font-mono text-xs'>
            {formatTime(state.timeRemaining)}
          </span>
        )}
      </div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div
        className={`border-l-4 border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-950/20 ${className} `}
      >
        <div className='flex items-start justify-between'>
          <div className='flex items-start space-x-3'>
            <div className='mt-0.5 flex-shrink-0'>{getIcon()}</div>
            <div>
              <h4 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                {getMessage()}
              </h4>
              <p className='mt-1 text-xs text-yellow-700 dark:text-yellow-300'>
                {getDescription()}
              </p>
              {state.timeRemaining > 0 && (
                <div className='mt-2 flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400'>
                  <Clock className='h-3 w-3' />
                  <span>Try again in {formatTime(state.timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
          {state.canRetry && onRetry && (
            <Button
              onClick={handleRetry}
              size='sm'
              variant='ghost'
              className='text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900/20'
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className={`rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-950/20 ${className} `}
    >
      {/* Header */}
      <div className='mb-4 flex items-start space-x-3'>
        <div className='flex-shrink-0'>{getIcon()}</div>
        <div className='flex-1'>
          <h3 className='text-lg font-semibold text-yellow-800 dark:text-yellow-200'>
            {getMessage()}
          </h3>
          <p className='mt-1 text-sm text-yellow-700 dark:text-yellow-300'>
            {getDescription()}
          </p>
        </div>
      </div>

      {/* Countdown */}
      {state.timeRemaining > 0 && (
        <div className='mb-4 rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Clock className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
              <span className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
                Next attempt in:
              </span>
            </div>
            <div className='font-mono text-lg font-bold text-yellow-800 dark:text-yellow-200'>
              {formatTime(state.timeRemaining)}
            </div>
          </div>
        </div>
      )}

      {/* Quota Information */}
      {showQuota && (
        <div className='mb-4 rounded-lg border border-yellow-200 bg-white p-3 dark:border-yellow-700 dark:bg-gray-800/50'>
          <h4 className='mb-2 flex items-center text-sm font-medium text-gray-900 dark:text-gray-100'>
            <TrendingUp className='mr-1 h-4 w-4' />
            Usage Information
          </h4>
          <div className='space-y-2 text-xs'>
            <div className='flex justify-between'>
              <span className='text-gray-600 dark:text-gray-400'>
                Current Usage:
              </span>
              <span className='font-medium text-yellow-700 dark:text-yellow-300'>
                {quotaInfo.used}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600 dark:text-gray-400'>Limit:</span>
              <span className='font-medium'>{quotaInfo.limit}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600 dark:text-gray-400'>Reset:</span>
              <span className='font-medium'>{quotaInfo.resetTime}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600 dark:text-gray-400'>Plan:</span>
              <span className='font-medium capitalize'>
                {state.tierType} tier
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      {showTips && (
        <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20'>
          <h4 className='mb-2 flex items-center text-sm font-medium text-blue-900 dark:text-blue-100'>
            <Info className='mr-1 h-4 w-4' />
            Tips to Avoid Rate Limits
          </h4>
          <ul className='space-y-1 text-xs text-blue-800 dark:text-blue-200'>
            {getTips().map((tip, index) => (
              <li key={index} className='flex items-start'>
                <span className='mr-2'>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center justify-between pt-2'>
        <div className='flex space-x-2'>
          {state.canRetry && onRetry && (
            <Button
              onClick={handleRetry}
              size='sm'
              className='bg-yellow-600 text-white hover:bg-yellow-700'
            >
              Try Again
            </Button>
          )}
          {state.tierType === 'free' && (
            <Button
              onClick={handleUpgrade}
              size='sm'
              variant='outline'
              className='border-yellow-600 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-500 dark:text-yellow-300 dark:hover:bg-yellow-900/20'
            >
              <Zap className='mr-1 h-3 w-3' />
              Upgrade Plan
            </Button>
          )}
        </div>
        <a
          href='https://console.groq.com/docs/rate-limits'
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs text-yellow-600 hover:underline dark:text-yellow-400'
        >
          Learn about rate limits →
        </a>
      </div>
    </div>
  );
}

/**
 * Simple rate limit indicator for basic cases
 */
export function SimpleRateLimitWarning({
  timeRemaining,
  className = '',
}: {
  timeRemaining: number;
  className?: string;
}) {
  const [time, setTime] = useState(timeRemaining);

  useEffect(() => {
    if (time <= 0) return;

    const interval = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [time]);

  if (time <= 0) return null;

  return (
    <div
      className={`flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400 ${className}`}
    >
      <Clock className='h-4 w-4' />
      <span>Rate limited. Try again in {formatTime(time)}</span>
    </div>
  );
}

export default RateLimitWarning;
