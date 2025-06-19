/**
 * Authentication Error Handling Demo
 *
 * Comprehensive demo component showcasing all authentication error handling features.
 * This component demonstrates error scenarios, recovery strategies, and UI components.
 */

'use client';

import { useState } from 'react';

import {
  AuthErrorAlert,
  AuthErrorBoundary,
  AuthErrorPage,
  AuthRetryButton,
} from '@/components/auth';
import {
  useAuthError,
  useAuthNetworkError,
  useAutoRecovery,
  useErrorRecovery,
} from '@/hooks';
import {
  createAuthError,
  ERROR_MESSAGES,
  mapClerkError,
  mapNetworkError,
} from '@/lib/auth/error-utils';
import type { AuthErrorType } from '@/types/auth-errors';

export function AuthErrorDemo() {
  const [selectedErrorType, setSelectedErrorType] =
    useState<AuthErrorType>('NETWORK_ERROR');
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [demoError, setDemoError] = useState<any>(null);

  const { reportError, error, clearError, retry, isRetrying, retryCount } =
    useAuthError();
  const { executeRecovery, getAvailableStrategies, isExecuting } =
    useErrorRecovery();
  const { handleNetworkError, wrapAsyncCall } = useAuthNetworkError();
  const { autoRetryCount, isAutoRetrying } = useAutoRecovery(error, 3, true);

  // Demo error scenarios
  const errorScenarios: {
    type: AuthErrorType;
    label: string;
    description: string;
  }[] = [
    {
      type: 'NETWORK_ERROR',
      label: 'Network Error',
      description: 'Simulates a network connectivity issue',
    },
    {
      type: 'SESSION_EXPIRED',
      label: 'Session Expired',
      description: 'User session has expired and needs to sign in again',
    },
    {
      type: 'INVALID_SESSION',
      label: 'Invalid Session',
      description: 'Session token is corrupted or invalid',
    },
    {
      type: 'RATE_LIMITED',
      label: 'Rate Limited',
      description: 'Too many requests, user needs to wait',
    },
    {
      type: 'ACCOUNT_SUSPENDED',
      label: 'Account Suspended',
      description: 'User account has been suspended',
    },
    {
      type: 'ACCOUNT_DELETED',
      label: 'Account Deleted',
      description: 'User account no longer exists',
    },
    {
      type: 'INSUFFICIENT_PERMISSIONS',
      label: 'Access Denied',
      description: 'User lacks required permissions',
    },
    {
      type: 'TOKEN_REFRESH_FAILED',
      label: 'Token Refresh Failed',
      description: 'Unable to refresh authentication token',
    },
    {
      type: 'CLERK_SERVICE_ERROR',
      label: 'Service Error',
      description: 'Authentication service is temporarily unavailable',
    },
    {
      type: 'UNKNOWN_AUTH_ERROR',
      label: 'Unknown Error',
      description: 'An unexpected error occurred',
    },
  ];

  const triggerError = (errorType: AuthErrorType) => {
    const authError = createAuthError(
      errorType,
      `Demo ${errorType} triggered at ${new Date().toLocaleTimeString()}`,
      `DEMO_${errorType}`,
      { demoMode: true, timestamp: Date.now() }
    );

    setDemoError(authError);
    reportError(authError);
  };

  const triggerClerkError = () => {
    const clerkError = {
      code: 'session_token_expired',
      message: 'Session token has expired',
      status: 401,
    };
    const authError = mapClerkError(clerkError);
    setDemoError(authError);
    reportError(authError);
  };

  const triggerNetworkError = () => {
    const networkError = new Error(
      'Network request failed: Unable to connect to server'
    );
    handleNetworkError(networkError);
  };

  const triggerAsyncError = async () => {
    const result = await wrapAsyncCall(async () => {
      throw new Error('Simulated async operation failure');
    }, 'Demo async operation failed');

    if (result === null) {
      console.log('Async operation failed and was handled by error system');
    }
  };

  const ComponentThatThrows = () => {
    if (demoError) {
      throw new Error(`React Error: ${demoError.message}`);
    }
    return <div>This component throws errors when demo error is set.</div>;
  };

  const availableStrategies = error ? getAvailableStrategies(error) : [];

  return (
    <div className='mx-auto max-w-6xl space-y-8 p-6'>
      <div className='text-center'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900 dark:text-white'>
          Authentication Error Handling Demo
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>
          Interactive demonstration of comprehensive auth error handling system
        </p>
      </div>

      {/* Current Error Status */}
      {error && (
        <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
            Current Error Status
          </h3>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
            <div>
              <span className='font-medium'>Type:</span> {error.type}
            </div>
            <div>
              <span className='font-medium'>Severity:</span> {error.severity}
            </div>
            <div>
              <span className='font-medium'>Retry Count:</span> {retryCount}
            </div>
            <div>
              <span className='font-medium'>Auto Retry:</span> {autoRetryCount}
            </div>
          </div>
          <div className='mt-2'>
            <span className='font-medium'>Message:</span> {error.userMessage}
          </div>
          <div className='mt-4 flex gap-2'>
            <button
              onClick={clearError}
              className='rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700'
            >
              Clear Error
            </button>
            <AuthRetryButton
              onRetry={retry}
              loading={isRetrying}
              retryCount={retryCount}
              maxRetries={3}
              size='sm'
            />
          </div>
        </div>
      )}

      {/* Error Scenario Triggers */}
      <div className='grid gap-6 md:grid-cols-2'>
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
            Error Scenarios
          </h2>

          <div className='space-y-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Select Error Type:
              </label>
              <select
                value={selectedErrorType}
                onChange={(e) =>
                  setSelectedErrorType(e.target.value as AuthErrorType)
                }
                className='w-full rounded border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              >
                {errorScenarios.map((scenario) => (
                  <option key={scenario.type} value={scenario.type}>
                    {scenario.label}
                  </option>
                ))}
              </select>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {
                  errorScenarios.find((s) => s.type === selectedErrorType)
                    ?.description
                }
              </p>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={() => triggerError(selectedErrorType)}
                className='rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
              >
                Trigger Error
              </button>
              <button
                onClick={() => setShowErrorAlert(!showErrorAlert)}
                className='rounded bg-yellow-600 px-4 py-2 text-sm text-white hover:bg-yellow-700'
              >
                Show Alert
              </button>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <button
                onClick={triggerClerkError}
                className='rounded bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700'
              >
                Clerk Error
              </button>
              <button
                onClick={triggerNetworkError}
                className='rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700'
              >
                Network Error
              </button>
            </div>

            <button
              onClick={triggerAsyncError}
              className='w-full rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700'
            >
              Async Error
            </button>
          </div>
        </div>

        {/* Recovery Strategies */}
        <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
          <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
            Recovery Strategies
          </h2>

          {error ? (
            <div className='space-y-3'>
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                Available recovery options for current error:
              </p>

              {availableStrategies.map((strategy) => (
                <button
                  key={strategy.type}
                  onClick={() => executeRecovery(strategy.type)}
                  disabled={isExecuting}
                  className={`w-full rounded p-3 text-left transition-colors ${
                    strategy.primary
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>
                        {strategy.icon} {strategy.label}
                      </div>
                      <div className='text-sm opacity-80'>
                        {strategy.description}
                      </div>
                    </div>
                    {strategy.primary && (
                      <span className='bg-opacity-20 rounded bg-white px-2 py-1 text-xs'>
                        Recommended
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {isExecuting && (
                <div className='text-center text-sm text-gray-600 dark:text-gray-400'>
                  Executing recovery strategy...
                </div>
              )}
            </div>
          ) : (
            <p className='text-gray-600 dark:text-gray-400'>
              No active error. Trigger an error to see available recovery
              strategies.
            </p>
          )}
        </div>
      </div>

      {/* Error Alert Demo */}
      {showErrorAlert && error && (
        <div>
          <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
            Error Alert Component
          </h3>
          <AuthErrorAlert
            error={error}
            onRetry={retry}
            onDismiss={() => setShowErrorAlert(false)}
            showTechnicalDetails={true}
          />
        </div>
      )}

      {/* Error Boundary Demo */}
      <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
        <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
          Error Boundary Demo
        </h2>

        <div className='grid gap-4 md:grid-cols-2'>
          <div>
            <h4 className='mb-2 font-medium text-gray-900 dark:text-white'>
              Protected Component
            </h4>
            <AuthErrorBoundary
              enableLogging={true}
              autoRetry={true}
              maxRetries={2}
            >
              <div className='rounded bg-gray-50 p-4 dark:bg-gray-700'>
                <ComponentThatThrows />
              </div>
            </AuthErrorBoundary>
          </div>

          <div>
            <h4 className='mb-2 font-medium text-gray-900 dark:text-white'>
              Controls
            </h4>
            <div className='space-y-2'>
              <button
                onClick={() =>
                  setDemoError(
                    createAuthError('NETWORK_ERROR', 'Demo boundary error')
                  )
                }
                className='w-full rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
              >
                Trigger Component Error
              </button>
              <button
                onClick={() => setDemoError(null)}
                className='w-full rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700'
              >
                Reset Component
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Page Demo */}
      <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
        <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
          Error Page Demo
        </h2>

        <div className='mb-4 flex gap-4'>
          <button
            onClick={() => setShowErrorPage(!showErrorPage)}
            className='rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
          >
            {showErrorPage ? 'Hide' : 'Show'} Error Page
          </button>
        </div>

        {showErrorPage && error && (
          <div className='overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600'>
            <AuthErrorPage
              error={error}
              onRetry={() => {
                retry();
                setShowErrorPage(false);
              }}
              onGoHome={() => setShowErrorPage(false)}
              showContactSupport={true}
            />
          </div>
        )}
      </div>

      {/* Error Messages Reference */}
      <div className='rounded-lg bg-white p-6 shadow dark:bg-gray-800'>
        <h2 className='mb-4 text-xl font-semibold text-gray-900 dark:text-white'>
          Error Messages Reference
        </h2>

        <div className='grid gap-4 md:grid-cols-2'>
          {Object.entries(ERROR_MESSAGES).map(([type, template]) => (
            <div key={type} className='rounded bg-gray-50 p-3 dark:bg-gray-700'>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                {type}
              </h4>
              <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                {template.title}
              </p>
              <p className='mt-1 text-xs text-gray-500 dark:text-gray-500'>
                {template.userMessage}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
