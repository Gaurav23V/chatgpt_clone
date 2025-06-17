'use client';

import React from 'react';
import {
  useUserPreferences,
  useUserSettings,
  useCurrentConversation,
  useAuthState
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
  const { preferences, updatePreferences, isLoading: prefsLoading, isSaving: prefsSaving } = useUserPreferences();
  const { settings, updateSettings, isLoading: settingsLoading, isSaving: settingsSaving } = useUserSettings();
  const { currentConversationId, setCurrentConversationId } = useCurrentConversation();

  // Don't render if user data isn't loaded yet
  if (!isLoaded) {
    return <div className="p-4">Loading user data...</div>;
  }

  // Show sign-in prompt if user isn't authenticated
  if (!isSignedIn) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">User Context Demo</h3>
        <p className="text-gray-600">Please sign in to see user preferences and settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">User Context Demo</h2>

        {/* User Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">User Information</h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Ready:</strong> {isReady ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* User Preferences */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            User Preferences
            {prefsLoading && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
            {prefsSaving && <span className="text-sm text-blue-500 ml-2">(Saving...)</span>}
          </h3>

          <div className="space-y-3">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Theme:</label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreferences({ theme: e.target.value as any })}
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
                value={preferences.model}
                onChange={(e) => updatePreferences({ model: e.target.value })}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Language:</label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value })}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            {/* Font Size Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">Font Size:</label>
              <select
                value={preferences.fontSize}
                onChange={(e) => updatePreferences({ fontSize: e.target.value as any })}
                className="border rounded px-3 py-1 w-full"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Chat Settings
            {settingsLoading && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
            {settingsSaving && <span className="text-sm text-blue-500 ml-2">(Saving...)</span>}
          </h3>

          <div className="space-y-3">
            {/* History Limit */}
            <div>
              <label className="block text-sm font-medium mb-1">
                History Limit: {settings.historyLimit}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={settings.historyLimit}
                onChange={(e) => updateSettings({ historyLimit: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Default System Prompt */}
            <div>
              <label className="block text-sm font-medium mb-1">Default System Prompt:</label>
              <textarea
                value={settings.defaultSystemPrompt}
                onChange={(e) => updateSettings({ defaultSystemPrompt: e.target.value })}
                className="border rounded px-3 py-2 w-full h-20 resize-none"
                placeholder="Enter default system prompt..."
              />
            </div>

            {/* Auto Save */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-save conversations</span>
              </label>
            </div>

            {/* Sound Effects */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm font-medium">Sound effects</span>
              </label>
            </div>
          </div>
        </div>

        {/* Current Conversation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Current Conversation</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Active Conversation ID:</strong> {currentConversationId || 'None'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentConversationId('demo-conversation-123')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Set Demo Conversation
              </button>
              <button
                onClick={() => setCurrentConversationId(null)}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Clear Conversation
              </button>
            </div>
          </div>
        </div>

        {/* Current Values Display */}
        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Current Values (JSON):</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({
              preferences,
              settings,
              currentConversationId,
              user: {
                id: user?.id,
                name: `${user?.firstName} ${user?.lastName}`,
                email: user?.primaryEmailAddress?.emailAddress
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
