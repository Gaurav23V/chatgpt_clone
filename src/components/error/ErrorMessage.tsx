/**
 * Error Message Component
 *
 * ChatGPT-style error message component for displaying user-friendly
 * error messages in the chat interface with consistent styling.
 */

'use client';

import React from 'react';

import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

import { type AIError, type ErrorSeverity } from '@/lib/ai/error-handler';

/**
 * Error Message Props
 */
export interface ErrorMessageProps {
  error: AIError;
  showIcon?: boolean;
  showCode?: boolean;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Get error icon based on severity
 */
function getErrorIcon(severity: ErrorSeverity, className = 'h-5 w-5') {
  switch (severity) {
    case 'critical':
      return <XCircle className={`${className} text-red-500`} />;
    case 'high':
      return <AlertCircle className={`${className} text-red-400`} />;
    case 'medium':
      return <AlertTriangle className={`${className} text-yellow-500`} />;
    case 'low':
      return <Info className={`${className} text-blue-400`} />;
    default:
      return <AlertCircle className={`${className} text-gray-400`} />;
  }
}

/**
 * Get error colors based on severity
 */
function getErrorColors(severity: ErrorSeverity) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-900 dark:text-red-100',
        accent: 'text-red-600 dark:text-red-400',
      };
    case 'high':
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-800 dark:text-red-200',
        accent: 'text-red-600 dark:text-red-400',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        border: 'border-yellow-200 dark:border-yellow-700',
        text: 'text-yellow-800 dark:text-yellow-200',
        accent: 'text-yellow-600 dark:text-yellow-400',
      };
    case 'low':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-800 dark:text-blue-200',
        accent: 'text-blue-600 dark:text-blue-400',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-600',
        text: 'text-gray-800 dark:text-gray-200',
        accent: 'text-gray-600 dark:text-gray-400',
      };
  }
}

/**
 * Error Message Component
 */
export function ErrorMessage({
  error,
  showIcon = true,
  showCode = false,
  className = '',
  variant = 'card',
  size = 'md',
}: ErrorMessageProps) {
  const colors = getErrorColors(error.severity || 'medium');
  const iconSize =
    size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const textSize =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm';
  const padding = size === 'sm' ? 'p-3' : size === 'lg' ? 'p-6' : 'p-4';

  // Inline variant - minimal styling for inline errors
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center space-x-2 ${textSize} ${colors.text} ${className}`}
      >
        {showIcon && getErrorIcon(error.severity || 'medium', iconSize)}
        <span>{error.userMessage}</span>
        {showCode && error.code && (
          <span className={`font-mono text-xs ${colors.accent}`}>
            ({error.code})
          </span>
        )}
      </div>
    );
  }

  // Banner variant - full width notification style
  if (variant === 'banner') {
    return (
      <div
        className={` ${colors.bg} ${colors.border} ${colors.text} border-l-4 ${padding} ${className} `}
        role='alert'
      >
        <div className='flex items-start space-x-3'>
          {showIcon && (
            <div className='mt-0.5 flex-shrink-0'>
              {getErrorIcon(error.severity || 'medium', iconSize)}
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <p className={`font-medium ${textSize}`}>{error.userMessage}</p>
            {showCode && error.code && (
              <p className={`mt-1 font-mono text-xs ${colors.accent}`}>
                Error Code: {error.code}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant - default ChatGPT-style error card
  return (
    <div
      className={` ${colors.bg} ${colors.border} ${colors.text} rounded-lg border ${padding} ${className} `}
      role='alert'
    >
      <div className='flex items-start space-x-3'>
        {showIcon && (
          <div className='mt-0.5 flex-shrink-0'>
            {getErrorIcon(error.severity || 'medium', iconSize)}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <div className={`font-medium ${textSize}`}>{error.userMessage}</div>
          {showCode && error.code && (
            <div className={`mt-2 font-mono text-xs ${colors.accent}`}>
              Error Code: {error.code}
            </div>
          )}
          {process.env.NODE_ENV === 'development' && (
            <details className='mt-2'>
              <summary
                className={`cursor-pointer text-xs ${colors.accent} hover:underline`}
              >
                Development Details
              </summary>
              <div className='mt-1 rounded bg-gray-100 p-2 font-mono text-xs dark:bg-gray-800'>
                <div>
                  <strong>Type:</strong> {error.type}
                </div>
                <div>
                  <strong>Severity:</strong> {error.severity}
                </div>
                <div>
                  <strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Message:</strong> {error.message}
                </div>
                {error.metadata?.timestamp && (
                  <div>
                    <strong>Time:</strong>{' '}
                    {new Date(error.metadata.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Quick error message for simple cases
 */
export function QuickErrorMessage({
  message,
  severity = 'medium',
  className = '',
}: {
  message: string;
  severity?: ErrorSeverity;
  className?: string;
}) {
  const mockError: AIError = {
    name: 'MockError',
    type: 'UNKNOWN_ERROR',
    severity,
    message,
    userMessage: message,
    retryable: false,
  };

  return (
    <ErrorMessage
      error={mockError}
      variant='inline'
      showIcon={true}
      className={className}
    />
  );
}

export default ErrorMessage;
