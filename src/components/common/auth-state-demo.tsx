'use client';

import React from 'react';
import {
  useAuthState,
  useAuthTransition,
  useAuthStateChange
} from '@/hooks';
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
  const { user, isSignedIn, isLoaded, isReady, isTransitioning, transitionType, transitionError } = useAuthState();
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
  const [storageStats, setStorageStats] = React.useState<ReturnType<typeof getStorageStats> | null>(null);
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
    setCleanupHistory(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${event}`]);
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
      localStorage.setItem('test-cache-item', JSON.stringify({ data: 'cached response' }));
      localStorage.setItem('test-temp-file', 'temporary file data');
      sessionStorage.setItem('test-session-data', 'session specific data');
      sessionStorage.setItem('currentConversation', 'demo-conversation-123');

      addCleanupEvent('Test data created');
      refreshStorageStats();
    } catch (error) {
      addCleanupEvent(`Failed to create test data: ${error}`);
    }
  };

  // Don't render if user data isn't loaded yet
  if (!isLoaded) {
    return <div className="p-4">Loading auth state...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Authentication State Change Demo</h2>

        {/* Auth Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Auth Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Signed In:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${isSignedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isSignedIn ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <strong>Loaded:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${isLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isLoaded ? 'Yes' : 'Loading...'}
              </span>
            </div>
            <div>
              <strong>Ready:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${isReady ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {isReady ? 'Yes' : 'Not Ready'}
              </span>
            </div>
            <div>
              <strong>Transitioning:</strong>
              <span className={`ml-2 px-2 py-1 rounded ${isTransitioning ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                {isTransitioning ? 'Yes' : 'No'}
              </span>
            </div>
          </div>

          {user && (
            <div className="mt-2 text-sm">
              <strong>User:</strong> {user.firstName} {user.lastName} ({user.id})
            </div>
          )}
        </div>

        {/* Transition State */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Transition State</h3>

          {isTransitioning ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Type: {transitionType}</span>
                <span className="text-sm">Progress: {transitionState.progress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${transitionState.progress}%` }}
                ></div>
              </div>

              {transitionError && (
                <div className="text-red-600 text-sm">
                  Error: {transitionError}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600">No active transition</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Manual Cleanup Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Cleanup Controls</h3>

            {/* Test Data Creation */}
            <div className="p-3 bg-yellow-50 rounded">
              <h4 className="font-medium mb-2">Test Data</h4>
              <button
                onClick={simulateDataCreation}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                Create Test Data
              </button>
              <p className="text-xs text-gray-600 mt-1">
                Creates cache, temp files, and session data for testing cleanup
              </p>
            </div>

            {/* Cleanup Options */}
            <div className="space-y-2">
              <h4 className="font-medium">Cleanup Options</h4>

              <button
                onClick={() => handleManualCleanup({ clearSessionData: true }, 'Session data only')}
                className="block w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Clear Session Data
              </button>

              <button
                onClick={() => handleManualCleanup({ clearCachedResponses: true }, 'Cached responses only')}
                className="block w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Clear Cached Responses
              </button>

              <button
                onClick={() => handleManualCleanup({ clearTempFiles: true }, 'Temp files only')}
                className="block w-full px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                Clear Temp Files
              </button>

              <button
                onClick={() => handleManualCleanup({
                  clearConversationHistory: true,
                  clearCachedResponses: true,
                  clearTempFiles: true,
                  clearSessionData: true
                }, 'Everything except preferences')}
                className="block w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Full Cleanup (Keep Preferences)
              </button>

              <button
                onClick={() => handleManualCleanup({
                  clearPreferences: true,
                  clearConversationHistory: true,
                  clearCachedResponses: true,
                  clearTempFiles: true,
                  clearSessionData: true
                }, 'Everything including preferences')}
                className="block w-full px-3 py-2 bg-red-700 text-white rounded text-sm hover:bg-red-800"
              >
                Nuclear Cleanup (Everything)
              </button>
            </div>
          </div>

          {/* Storage Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Storage Information</h3>

            {/* Storage Stats */}
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Current Storage</h4>
              {storageStats ? (
                <div className="text-sm space-y-1">
                  <p><strong>Available:</strong> {storageStats.available ? 'Yes' : 'No'}</p>
                  <p><strong>User Count:</strong> {storageStats.userCount}</p>
                  <p><strong>Total Size:</strong> {storageStats.totalSize} bytes</p>
                  <p><strong>Storage Keys:</strong> {storageStats.keys.length}</p>

                  {storageStats.keys.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">View Keys</summary>
                      <div className="mt-1 text-xs bg-white p-2 rounded border max-h-20 overflow-y-auto">
                        {storageStats.keys.map((key, index) => (
                          <div key={index}>{key}</div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Loading stats...</p>
              )}

              <button
                onClick={refreshStorageStats}
                className="mt-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                Refresh
              </button>
            </div>

            {/* Cleanup History */}
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Cleanup History</h4>
              {cleanupHistory.length > 0 ? (
                <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {cleanupHistory.map((event, index) => (
                    <div key={index} className="p-1 bg-white rounded border">
                      {event}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No cleanup events yet</p>
              )}

              <button
                onClick={() => setCleanupHistory([])}
                className="mt-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How to Test</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Click "Create Test Data" to simulate cached data and temp files</li>
            <li>Use the cleanup buttons to test different cleanup scenarios</li>
            <li>Watch the storage stats and cleanup history to see what gets cleared</li>
            <li>Sign out and back in to see automatic cleanup in action</li>
            <li>Open browser dev tools → Application → Local Storage to see the cleanup effects</li>
          </ol>
        </div>

        {/* Sign Out Instructions */}
        {isSignedIn && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Test Automatic Cleanup</h4>
            <p className="text-sm text-gray-700">
              Sign out using your app's sign-out button to see automatic cleanup in action.
              The system will automatically clear conversation history, cached responses,
              temp files, and session data while preserving your preferences.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
