'use client';

import React from 'react';

import {
  useAuthState,
  useInterfacePreferences,
  useModelPreference,
  usePersistedPreferences,
  useThemePreference,
} from '@/hooks';
import {
  clearAllPreferences,
  getStorageStats,
} from '@/lib/storage/user-preferences';

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
    lastSaved,
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
    setShowCodeLineNumbers,
  } = useInterfacePreferences();

  // Storage stats for debugging
  const [storageStats, setStorageStats] = React.useState<ReturnType<
    typeof getStorageStats
  > | null>(null);

  // Update storage stats
  const refreshStorageStats = () => {
    setStorageStats(getStorageStats());
  };

  React.useEffect(() => {
    refreshStorageStats();
  }, [preferences]);

  // don&apos;t render if user data isn&apos;t loaded yet
  if (!isLoaded) {
    return <div className='p-4'>Loading user data...</div>;
  }

  // Show sign-in prompt if user isn&apos;t authenticated
  if (!isSignedIn) {
    return (
      <div className='rounded-lg border p-4'>
        <h3 className='mb-2 text-lg font-semibold'>
          Enhanced Preferences Demo
        </h3>
        <p className='text-gray-600'>
          Please sign in to see the enhanced preference system with persistence.
        </p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-4xl space-y-6 p-6'>
      <div className='rounded-lg border p-4'>
        <h2 className='mb-4 text-xl font-bold'>
          Enhanced User Preference System
        </h2>

        {/* Status Bar */}
        <div className='mb-6 rounded-lg bg-gray-50 p-3'>
          <div className='flex flex-wrap items-center gap-4 text-sm'>
            <span
              className={`rounded px-2 py-1 ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}
            >
              {isLoading ? 'Loading...' : 'Loaded'}
            </span>
            <span
              className={`rounded px-2 py-1 ${isSaving ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {isSaving ? 'Saving...' : 'Saved'}
            </span>
            {error && (
              <span className='rounded bg-red-100 px-2 py-1 text-red-800'>
                Error: {error}
              </span>
            )}
            {lastSaved && (
              <span className='text-gray-600'>
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Basic Preferences */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Basic Preferences</h3>

            {/* Theme Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>Theme:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className='w-full rounded border px-3 py-1'
              >
                <option value='light'>Light</option>
                <option value='dark'>Dark</option>
                <option value='system'>System</option>
              </select>
            </div>

            {/* Model Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Preferred Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                className='w-full rounded border px-3 py-1'
              >
                <option value='gpt-3.5-turbo'>GPT-3.5 Turbo</option>
                <option value='gpt-4o-mini'>GPT-4o Mini</option>
                <option value='gpt-4o'>GPT-4o</option>
                <option value='gpt-4'>GPT-4</option>
                <option value='gpt-4-turbo'>GPT-4 Turbo</option>
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className='w-full rounded border px-3 py-1'
              >
                <option value='en'>English</option>
                <option value='es'>Spanish</option>
                <option value='fr'>French</option>
                <option value='de'>German</option>
                <option value='it'>Italian</option>
                <option value='pt'>Portuguese</option>
                <option value='ru'>Russian</option>
                <option value='ja'>Japanese</option>
                <option value='ko'>Korean</option>
                <option value='zh'>Chinese</option>
              </select>
            </div>

            {/* Font Size Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Font Size:
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
                className='w-full rounded border px-3 py-1'
              >
                <option value='small'>Small</option>
                <option value='medium'>Medium</option>
                <option value='large'>Large</option>
              </select>
            </div>
          </div>

          {/* Interface Preferences */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Interface Preferences</h3>

            {/* Send on Enter */}
            <div>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={sendOnEnter}
                  onChange={(e) => setSendOnEnter(e.target.checked)}
                  className='rounded'
                />
                <span className='text-sm font-medium'>
                  Send message on Enter
                </span>
              </label>
              <p className='mt-1 text-xs text-gray-500'>
                When enabled, pressing Enter sends the message. Use Shift+Enter
                for new line.
              </p>
            </div>

            {/* Show Code Line Numbers */}
            <div>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={showCodeLineNumbers}
                  onChange={(e) => setShowCodeLineNumbers(e.target.checked)}
                  className='rounded'
                />
                <span className='text-sm font-medium'>
                  Show code line numbers
                </span>
              </label>
              <p className='mt-1 text-xs text-gray-500'>
                Display line numbers in code blocks for easier reference.
              </p>
            </div>

            {/* Bulk Update Example */}
            <div className='border-t pt-4'>
              <h4 className='mb-2 font-medium'>Bulk Operations</h4>
              <div className='flex gap-2'>
                <button
                  onClick={() =>
                    updatePreferences({
                      theme: 'dark',
                      fontSize: 'large',
                      sendOnEnter: false,
                      showCodeLineNumbers: true,
                    })
                  }
                  className='rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600'
                >
                  Power User Settings
                </button>
                <button
                  onClick={() =>
                    updatePreferences({
                      theme: 'light',
                      fontSize: 'medium',
                      sendOnEnter: true,
                      showCodeLineNumbers: false,
                    })
                  }
                  className='rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600'
                >
                  Default Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Information */}
        <div className='mt-6 border-t pt-6'>
          <h3 className='mb-4 text-lg font-semibold'>Storage Information</h3>

          <div className='grid gap-4 md:grid-cols-2'>
            {/* Storage Stats */}
            <div className='rounded bg-gray-50 p-3'>
              <h4 className='mb-2 font-medium'>Storage Statistics</h4>
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
                    <strong>Keys:</strong> {storageStats.keys.length}
                  </p>
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

            {/* Current Preferences JSON */}
            <div className='rounded bg-gray-50 p-3'>
              <h4 className='mb-2 font-medium'>Current Preferences</h4>
              <pre className='max-h-32 overflow-auto rounded border bg-white p-2 text-xs'>
                {JSON.stringify(preferences, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='mt-6 border-t pt-6'>
          <h3 className='mb-4 text-lg font-semibold'>Actions</h3>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={resetToDefaults}
              className='rounded bg-yellow-500 px-3 py-1 text-sm text-white hover:bg-yellow-600'
              disabled={isSaving}
            >
              Reset to Defaults
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    'This will clear ALL user preferences from localStorage. Continue?'
                  )
                ) {
                  clearAllPreferences();
                  refreshStorageStats();
                  alert('All preferences cleared!');
                }
              }}
              className='rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600'
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
                  fontSize: 'medium',
                  // Missing sendOnEnter and showCodeLineNumbers - will use defaults
                };
                localStorage.setItem(
                  `chatgpt-clone-prefs-${user?.id}`,
                  JSON.stringify(legacyData)
                );
                window.location.reload(); // Refresh to trigger migration
              }}
              className='rounded bg-purple-500 px-3 py-1 text-sm text-white hover:bg-purple-600'
            >
              Test Migration
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className='mt-6 rounded border-t bg-blue-50 p-3 pt-6'>
          <h4 className='mb-2 font-medium'>User Information</h4>
          <div className='space-y-1 text-sm'>
            <p>
              <strong>Name:</strong> {user?.firstName} {user?.lastName}
            </p>
            <p>
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
