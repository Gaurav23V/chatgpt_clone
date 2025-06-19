'use client';

import React from 'react';

import {
  useAuthState,
  useCurrentConversation,
  useUserPreferences,
  useUserSettings,
} from '@/hooks';

/**
 * Demo component showing how to use the user context hooks
 * This component demonstrates:
 * - Reading and updating user preferences
 * - Managing user settings
 * - Handling current conversation state
 * - Checking authentication status
 */
export function UserPreferencesDemo() {
  const { user, isSignedIn, isLoaded, isReady } = useAuthState();
  const {
    preferences,
    updatePreferences,
    isLoading: prefsLoading,
    isSaving: prefsSaving,
  } = useUserPreferences();
  const {
    settings,
    updateSettings,
    isLoading: settingsLoading,
    isSaving: settingsSaving,
  } = useUserSettings();
  const { currentConversationId, setCurrentConversationId } =
    useCurrentConversation();

  // don&apos;t render if user data isn&apos;t loaded yet
  if (!isLoaded) {
    return <div className='p-4'>Loading user data...</div>;
  }

  // Show sign-in prompt if user isn&apos;t authenticated
  if (!isSignedIn) {
    return (
      <div className='rounded-lg border p-4'>
        <h3 className='mb-2 text-lg font-semibold'>User Context Demo</h3>
        <p className='text-gray-600'>
          Please sign in to see user preferences and settings.
        </p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6 p-6'>
      <div className='rounded-lg border p-4'>
        <h2 className='mb-4 text-xl font-bold'>User Context Demo</h2>

        {/* User Info */}
        <div className='mb-6'>
          <h3 className='mb-2 text-lg font-semibold'>User Information</h3>
          <div className='rounded bg-gray-50 p-3 text-sm'>
            <p>
              <strong>Name:</strong> {user?.firstName} {user?.lastName}
            </p>
            <p>
              <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
            </p>
            <p>
              <strong>User ID:</strong> {user?.id}
            </p>
            <p>
              <strong>Ready:</strong> {isReady ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* User Preferences */}
        <div className='mb-6'>
          <h3 className='mb-2 text-lg font-semibold'>
            User Preferences
            {prefsLoading && (
              <span className='ml-2 text-sm text-gray-500'>(Loading...)</span>
            )}
            {prefsSaving && (
              <span className='ml-2 text-sm text-blue-500'>(Saving...)</span>
            )}
          </h3>

          <div className='space-y-3'>
            {/* Theme Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>Theme:</label>
              <select
                value={preferences.theme}
                onChange={(e) =>
                  updatePreferences({ theme: e.target.value as any })
                }
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
                value={preferences.model}
                onChange={(e) =>
                  updatePreferences({ model: e.target.value as any })
                }
                className='w-full rounded border px-3 py-1'
              >
                <option value='gpt-3.5-turbo'>GPT-3.5 Turbo</option>
                <option value='gpt-4o-mini'>GPT-4o Mini</option>
                <option value='gpt-4o'>GPT-4o</option>
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Language:
              </label>
              <select
                value={preferences.language}
                onChange={(e) =>
                  updatePreferences({ language: e.target.value as any })
                }
                className='w-full rounded border px-3 py-1'
              >
                <option value='en'>English</option>
                <option value='es'>Spanish</option>
                <option value='fr'>French</option>
                <option value='de'>German</option>
              </select>
            </div>

            {/* Font Size Selection */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Font Size:
              </label>
              <select
                value={preferences.fontSize}
                onChange={(e) =>
                  updatePreferences({ fontSize: e.target.value as any })
                }
                className='w-full rounded border px-3 py-1'
              >
                <option value='small'>Small</option>
                <option value='medium'>Medium</option>
                <option value='large'>Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Settings */}
        <div className='mb-6'>
          <h3 className='mb-2 text-lg font-semibold'>
            Chat Settings
            {settingsLoading && (
              <span className='ml-2 text-sm text-gray-500'>(Loading...)</span>
            )}
            {settingsSaving && (
              <span className='ml-2 text-sm text-blue-500'>(Saving...)</span>
            )}
          </h3>

          <div className='space-y-3'>
            {/* History Limit */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                History Limit: {settings.historyLimit}
              </label>
              <input
                type='range'
                min='10'
                max='100'
                step='10'
                value={settings.historyLimit}
                onChange={(e) =>
                  updateSettings({ historyLimit: parseInt(e.target.value) })
                }
                className='w-full'
              />
            </div>

            {/* Default System Prompt */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Default System Prompt:
              </label>
              <textarea
                value={settings.defaultSystemPrompt}
                onChange={(e) =>
                  updateSettings({ defaultSystemPrompt: e.target.value })
                }
                className='h-20 w-full resize-none rounded border px-3 py-2'
                placeholder='Enter default system prompt...'
              />
            </div>

            {/* Auto Save */}
            <div>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={settings.autoSave}
                  onChange={(e) =>
                    updateSettings({ autoSave: e.target.checked })
                  }
                  className='rounded'
                />
                <span className='text-sm font-medium'>
                  Auto-save conversations
                </span>
              </label>
            </div>

            {/* Sound Effects */}
            <div>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={settings.soundEffects}
                  onChange={(e) =>
                    updateSettings({ soundEffects: e.target.checked })
                  }
                  className='rounded'
                />
                <span className='text-sm font-medium'>Sound effects</span>
              </label>
            </div>
          </div>
        </div>

        {/* Current Conversation */}
        <div className='mb-6'>
          <h3 className='mb-2 text-lg font-semibold'>Current Conversation</h3>
          <div className='space-y-2'>
            <p className='text-sm'>
              <strong>Active Conversation ID:</strong>{' '}
              {currentConversationId || 'None'}
            </p>
            <div className='flex gap-2'>
              <button
                onClick={() =>
                  setCurrentConversationId('demo-conversation-123')
                }
                className='rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600'
              >
                Set Demo Conversation
              </button>
              <button
                onClick={() => setCurrentConversationId(null)}
                className='rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600'
              >
                Clear Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Current Values Display */}
        <div className='rounded bg-gray-50 p-4'>
          <h4 className='mb-2 font-semibold'>Current Values (JSON):</h4>
          <pre className='overflow-auto text-xs'>
            {JSON.stringify(
              {
                preferences,
                settings,
                currentConversationId,
                user: {
                  id: user?.id,
                  name: `${user?.firstName} ${user?.lastName}`,
                  email: user?.primaryEmailAddress?.emailAddress,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
