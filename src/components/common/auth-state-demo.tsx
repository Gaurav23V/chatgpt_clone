'use client';

import React from 'react';

import { useAuthState, useAuthStateChange, useAuthTransition } from '@/hooks';
import { getStorageStats } from '@/lib/storage/user-preferences';

/**
 * Demo component showing auth state change management
 * This component demonstrates:
 * - Auth transition states and progress
 * - Manual cleanup functions
 * - Storage monitoring during transitions
 * - Error handling and recovery
 * - Custom cleanup configurations
 */
export function AuthStateDemo() {
  const {
    user,
    isSignedIn,
    isLoaded,
    isReady,
    isTransitioning,
    transitionType,
    transitionError,
  } = useAuthState();
  const { manualCleanup } = useAuthTransition();

  // Initialize auth state change hook with custom config for demo
  const { transitionState, manualCleanup: demoCleanup } = useAuthStateChange({
    clearPreferences: false,
    clearConversationHistory: true,
    clearCachedResponses: true,
    clearTempFiles: true,
    clearSessionData: true,
  });

  // Storage stats for monitoring
  const [storageStats, setStorageStats] = React.useState<ReturnType<
    typeof getStorageStats
  > | null>(null);
  const [cleanupHistory, setCleanupHistory] = React.useState<string[]>([]);

  // Update storage stats
  const refreshStorageStats = () => {
    setStorageStats(getStorageStats());
  };

  React.useEffect(() => {
    refreshStorageStats();
  }, [transitionState]);

  // Add cleanup event to history
  const addCleanupEvent = (event: string) => {
    setCleanupHistory((prev) => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${event}`,
    ]);
  };

  // Handle manual cleanup with different configurations
  const handleManualCleanup = async (config: any, description: string) => {
    try {
      await demoCleanup(config);
      addCleanupEvent(`Manual cleanup: ${description}`);
      refreshStorageStats();
    } catch (error) {
      addCleanupEvent(`Cleanup failed: ${description} - ${error}`);
    }
  };

  // Simulate data creation for testing cleanup
  const simulateDataCreation = () => {
    try {
      // Create some test data
      localStorage.setItem(
        'test-cache-item',
        JSON.stringify({ data: 'cached response' })
      );
      localStorage.setItem('test-temp-file', 'temporary file data');
      sessionStorage.setItem('test-session-data', 'session specific data');
      sessionStorage.setItem('currentConversation', 'demo-conversation-123');

      addCleanupEvent('Test data created');
      refreshStorageStats();
    } catch (error) {
      addCleanupEvent(`Failed to create test data: ${error}`);
    }
  };

  // don&apos;t render if user data isn&apos;t loaded yet
  if (!isLoaded) {
    return <div className='p-4'>Loading auth state...</div>;
  }

  return (
    <div className='mx-auto max-w-4xl space-y-6 p-6'>
      <div className='rounded-lg border p-4'>
        <h2 className='mb-4 text-xl font-bold'>
          Authentication State Change Demo
        </h2>

        {/* Auth Status */}
        <div className='mb-6 rounded-lg bg-gray-50 p-4'>
          <h3 className='mb-2 text-lg font-semibold'>Current Auth Status</h3>
          <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
            <div>
              <strong>Signed In:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {isSignedIn ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <strong>Loaded:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 ${isLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {isLoaded ? 'Yes' : 'Loading...'}
              </span>
            </div>
            <div>
              <strong>Ready:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 ${isReady ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
              >
                {isReady ? 'Yes' : 'Not Ready'}
              </span>
            </div>
            <div>
              <strong>Transitioning:</strong>
              <span
                className={`ml-2 rounded px-2 py-1 ${isTransitioning ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
              >
                {isTransitioning ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {user && (
            <div className='mt-2 text-sm'>
              <strong>User:</strong> {user.firstName} {user.lastName} ({user.id}
              )
            </div>
          )}
        </div>

        {/* Transition State */}
        <div className='mb-6 rounded-lg bg-blue-50 p-4'>
          <h3 className='mb-2 text-lg font-semibold'>Transition State</h3>

          {isTransitioning ? (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Type: {transitionType}</span>
                <span className='text-sm'>
                  Progress: {transitionState.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className='h-2 w-full rounded-full bg-gray-200'>
                <div
                  className='h-2 rounded-full bg-blue-600 transition-all duration-300'
                  style={{ width: `${transitionState.progress}%` }}
                ></div>
              </div>

              {transitionError && (
                <div className='text-sm text-red-600'>
                  Error: {transitionError}
                </div>
              )}
            </div>
          ) : (
            <div className='text-gray-600'>No active transition</div>
          )}
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Manual Cleanup Controls */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Manual Cleanup Controls</h3>

            {/* Test Data Creation */}
            <div className='rounded bg-yellow-50 p-3'>
              <h4 className='mb-2 font-medium'>Test Data</h4>
              <button
                onClick={simulateDataCreation}
                className='rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600'
              >
                Create Test Data
              </button>
              <p className='mt-1 text-xs text-gray-600'>
                Creates cache, temp files, and session data for testing cleanup
              </p>
            </div>

            {/* Cleanup Options */}
            <div className='space-y-2'>
              <h4 className='font-medium'>Cleanup Options</h4>

              <button
                onClick={() =>
                  handleManualCleanup(
                    { clearSessionData: true },
                    'Session data only'
                  )
                }
                className='block w-full rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600'
              >
                Clear Session Data
              </button>

              <button
                onClick={() =>
                  handleManualCleanup(
                    { clearCachedResponses: true },
                    'Cached responses only'
                  )
                }
                className='block w-full rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600'
              >
                Clear Cached Responses
              </button>

              <button
                onClick={() =>
                  handleManualCleanup(
                    { clearTempFiles: true },
                    'Temp files only'
                  )
                }
                className='block w-full rounded bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600'
              >
                Clear Temp Files
              </button>

              <button
                onClick={() =>
                  handleManualCleanup(
                    {
                      clearConversationHistory: true,
                      clearCachedResponses: true,
                      clearTempFiles: true,
                      clearSessionData: true,
                    },
                    'Everything except preferences'
                  )
                }
                className='block w-full rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600'
              >
                Full Cleanup (Keep Preferences)
              </button>

              <button
                onClick={() =>
                  handleManualCleanup(
                    {
                      clearPreferences: true,
                      clearConversationHistory: true,
                      clearCachedResponses: true,
                      clearTempFiles: true,
                      clearSessionData: true,
                    },
                    'Everything including preferences'
                  )
                }
                className='block w-full rounded bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800'
              >
                Nuclear Cleanup (Everything)
              </button>
            </div>
          </div>

          {/* Storage Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Storage Information</h3>

            {/* Storage Stats */}
            <div className='rounded bg-gray-50 p-3'>
              <h4 className='mb-2 font-medium'>Current Storage</h4>
              {storageStats ? (
                <div className='space-y-1 text-sm'>
                  <p>
                    <strong>Available:</strong>{' '}
                    {storageStats.available ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>User Count:</strong> {storageStats.userCount}
                  </p>
                  <p>
                    <strong>Total Size:</strong> {storageStats.totalSize} bytes
                  </p>
                  <p>
                    <strong>Storage Keys:</strong> {storageStats.keys.length}
                  </p>

                  {storageStats.keys.length > 0 && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer font-medium'>
                        View Keys
                      </summary>
                      <div className='mt-1 max-h-20 overflow-y-auto rounded border bg-white p-2 text-xs'>
                        {storageStats.keys.map((key, index) => (
                          <div key={index}>{key}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <p className='text-sm text-gray-500'>Loading stats...</p>
              )}

              <button
                onClick={refreshStorageStats}
                className='mt-2 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300'
              >
                Refresh
              </button>
            </div>

            {/* Cleanup History */}
            <div className='rounded bg-gray-50 p-3'>
              <h4 className='mb-2 font-medium'>Cleanup History</h4>
              {cleanupHistory.length > 0 ? (
                <div className='max-h-32 space-y-1 overflow-y-auto text-xs'>
                  {cleanupHistory.map((event, index) => (
                    <div key={index} className='rounded border bg-white p-1'>
                      {event}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No cleanup events yet</p>
              )}

              <button
                onClick={() => setCleanupHistory([])}
                className='mt-2 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300'
              >
                Clear History
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className='mt-6 rounded-lg bg-green-50 p-4'>
          <h3 className='mb-2 text-lg font-semibold'>How to Test</h3>
          <ol className='list-inside list-decimal space-y-1 text-sm'>
            <li>
              Click "Create Test Data" to simulate cached data and temp files
            </li>
            <li>Use the cleanup buttons to test different cleanup scenarios</li>
            <li>
              Watch the storage stats and cleanup history to see what gets
              cleared
            </li>
            <li>Sign out and back in to see automatic cleanup in action</li>
            <li>
              Open browser dev tools → Application → Local Storage to see the
              cleanup effects
            </li>
          </ol>
        </div>

        {/* Sign Out Instructions */}
        {isSignedIn && (
          <div className='mt-4 rounded-lg bg-blue-50 p-4'>
            <h4 className='mb-2 font-medium'>Test Automatic Cleanup</h4>
            <p className='text-sm text-gray-700'>
              Sign out using your app's sign-out button to see automatic cleanup
              in action. The system will automatically clear conversation
              history, cached responses, temp files, and session data while
              preserving your preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
