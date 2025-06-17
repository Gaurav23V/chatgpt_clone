'use client';

import React from 'react';
import {
  usePersistedPreferences,
  useThemePreference,
  useModelPreference,
  useInterfacePreferences,
  useAuthState
} from '@/hooks';
import { getStorageStats, clearAllPreferences } from '@/lib/storage/user-preferences';

/**
 * Enhanced demo component showing the new persistence system
 * This component demonstrates:
 * - Enhanced preference management with new fields
 * - Auto-saving with debouncing
 * - Migration and versioning capabilities
 * - Error handling and validation
 * - Storage statistics and debugging
 */
export function EnhancedPreferencesDemo() {
  const { user, isSignedIn, isLoaded } = useAuthState();
  const {
    preferences,
    updatePreferences,
    resetToDefaults,
    isLoading,
    isSaving,
    error,
    lastSaved
  } = usePersistedPreferences();

  // Specialized hooks for demonstration
  const { theme, setTheme } = useThemePreference();
  const { model, setModel } = useModelPreference();
  const {
    fontSize,
    language,
    sendOnEnter,
    showCodeLineNumbers,
    setFontSize,
    setLanguage,
    setSendOnEnter,
    setShowCodeLineNumbers
  } = useInterfacePreferences();

  // Storage stats for debugging
  const [storageStats, setStorageStats] = React.useState<ReturnType<typeof getStorageStats> | null>(null);

  // Update storage stats
  const refreshStorageStats = () => {
    setStorageStats(getStorageStats());
  };

  React.useEffect(() => {
    refreshStorageStats();
  }, [preferences]);

  // Don't render if user data isn't loaded yet
  if (!isLoaded) {
    return <div className="p-4">Loading user data...</div>;
  }

  // Show sign-in prompt if user isn't authenticated
  if (!isSignedIn) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Enhanced Preferences Demo</h3>
        <p className="text-gray-600">Please sign in to see the enhanced preference system with persistence.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Enhanced User Preference System</h2>

        {/* Status Bar */}
        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {isLoading ? 'Loading...' : 'Loaded'}
            </span>
            <span className={`px-2 py-1 rounded ${isSaving ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {isSaving ? 'Saving...' : 'Saved'}
            </span>
            {error && (
              <span className="px-2 py-1 rounded bg-red-100 text-red-800">
                Error: {error}
              </span>
            )}
            {lastSaved && (
              <span className="text-gray-600">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Preferences</h3>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Theme:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Preferred Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            {/* Font Size Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Font Size:</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          {/* Interface Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Interface Preferences</h3>

            {/* Send on Enter */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={sendOnEnter}
                  onChange={(e) => setSendOnEnter(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Send message on Enter</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, pressing Enter sends the message. Use Shift+Enter for new line.
              </p>
            </div>

            {/* Show Code Line Numbers */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showCodeLineNumbers}
                  onChange={(e) => setShowCodeLineNumbers(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Show code line numbers</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Display line numbers in code blocks for easier reference.
              </p>
            </div>

            {/* Bulk Update Example */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Bulk Operations</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => updatePreferences({
                    theme: 'dark',
                    fontSize: 'large',
                    sendOnEnter: false,
                    showCodeLineNumbers: true
                  })}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Power User Settings
                </button>
                <button
                  onClick={() => updatePreferences({
                    theme: 'light',
                    fontSize: 'medium',
                    sendOnEnter: true,
                    showCodeLineNumbers: false
                  })}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Default Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Information */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Storage Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Storage Stats */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Storage Statistics</h4>
              {storageStats ? (
                <div className="text-sm space-y-1">
                  <p><strong>Available:</strong> {storageStats.available ? 'Yes' : 'No'}</p>
                  <p><strong>User Count:</strong> {storageStats.userCount}</p>
                  <p><strong>Total Size:</strong> {storageStats.totalSize} bytes</p>
                  <p><strong>Keys:</strong> {storageStats.keys.length}</p>
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

            {/* Current Preferences JSON */}
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">Current Preferences</h4>
              <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded border">
                {JSON.stringify(preferences, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              disabled={isSaving}
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => {
                if (confirm('This will clear ALL user preferences from localStorage. Continue?')) {
                  clearAllPreferences();
                  refreshStorageStats();
                  alert('All preferences cleared!');
                }
              }}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Clear All Data
            </button>
            <button
              onClick={() => {
                // Simulate a preference migration by updating with legacy data
                const legacyData = {
                  theme: 'light',
                  model: 'gpt-4-turbo-preview', // This will be migrated to 'gpt-4-turbo'
                  language: 'en',
                  fontSize: 'medium'
                  // Missing sendOnEnter and showCodeLineNumbers - will use defaults
                };
                localStorage.setItem(`chatgpt-clone-prefs-${user?.id}`, JSON.stringify(legacyData));
                window.location.reload(); // Refresh to trigger migration
              }}
              className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            >
              Test Migration
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-6 pt-6 border-t bg-blue-50 p-3 rounded">
          <h4 className="font-medium mb-2">User Information</h4>
          <div className="text-sm space-y-1">
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
