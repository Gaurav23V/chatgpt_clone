# User Context System

This directory contains the user context and related functionality that extends Clerk's basic
authentication with app-specific user state management.

## Overview

The user context system provides:

- **Extended User State**: Combines Clerk's authentication data with app-specific preferences and
  settings
- **Persistent Storage**: Automatically saves user preferences to localStorage
- **Type Safety**: Full TypeScript support with proper type definitions
- **Custom Hooks**: Convenient hooks for accessing specific parts of user state
- **Real-time Updates**: Immediate state updates with automatic persistence

## Architecture

```
UserProvider (Context Provider)
├── Clerk Integration (useUser hook)
├── User Preferences (theme, model, language, fontSize)
├── User Settings (history limit, system prompt, auto-save, etc.)
├── Current Conversation State
└── Custom Hooks for specific functionality
```

## Files

- `user-context.tsx` - Main context implementation with provider and hooks
- `README.md` - This documentation file

## Usage

### 1. Provider Setup

The `UserProvider` is already integrated in the root layout (`src/app/layout.tsx`):

```tsx
import { UserProvider } from '@/contexts/user-context';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <UserProvider>{children}</UserProvider>
    </ClerkProvider>
  );
}
```

### 2. Using Custom Hooks

#### useAuthState Hook

Access authentication status and user data:

```tsx
import { useAuthState } from '@/hooks';

function MyComponent() {
  const { user, isSignedIn, isLoaded, isReady } = useAuthState();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Please sign in</div>;

  return <div>Welcome, {user?.firstName}!</div>;
}
```

#### useUserPreferences Hook

Manage user preferences (theme, model, language, font size):

```tsx
import { useUserPreferences } from '@/hooks';

function PreferencesPanel() {
  const { preferences, updatePreferences, isLoading, isSaving } = useUserPreferences();

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updatePreferences({ theme });
  };

  return (
    <div>
      <h3>Preferences {isSaving && '(Saving...)'}</h3>
      <select value={preferences.theme} onChange={(e) => handleThemeChange(e.target.value as any)}>
        <option value='light'>Light</option>
        <option value='dark'>Dark</option>
        <option value='system'>System</option>
      </select>
    </div>
  );
}
```

#### useUserSettings Hook

Manage chat-specific settings:

```tsx
import { useUserSettings } from '@/hooks';

function SettingsPanel() {
  const { settings, updateSettings, isLoading, isSaving } = useUserSettings();

  return (
    <div>
      <h3>Chat Settings</h3>
      <label>
        History Limit: {settings.historyLimit}
        <input
          type='range'
          min='10'
          max='100'
          value={settings.historyLimit}
          onChange={(e) => updateSettings({ historyLimit: parseInt(e.target.value) })}
        />
      </label>

      <label>
        <input
          type='checkbox'
          checked={settings.autoSave}
          onChange={(e) => updateSettings({ autoSave: e.target.checked })}
        />
        Auto-save conversations
      </label>
    </div>
  );
}
```

#### useCurrentConversation Hook

Manage active conversation state:

```tsx
import { useCurrentConversation } from '@/hooks';

function ChatInterface() {
  const { currentConversationId, setCurrentConversationId } = useCurrentConversation();

  const startNewConversation = () => {
    const newId = `conversation-${Date.now()}`;
    setCurrentConversationId(newId);
  };

  return (
    <div>
      <p>Current: {currentConversationId || 'No active conversation'}</p>
      <button onClick={startNewConversation}>New Chat</button>
      <button onClick={() => setCurrentConversationId(null)}>End Chat</button>
    </div>
  );
}
```

#### useUserContext Hook (Full Access)

Access the complete user context:

```tsx
import { useUserContext } from '@/hooks';

function AdvancedUserComponent() {
  const {
    clerkUser,
    isSignedIn,
    isLoaded,
    preferences,
    settings,
    currentConversationId,
    updatePreferences,
    updateSettings,
    setCurrentConversationId,
    resetToDefaults,
    isLoadingPreferences,
    isLoadingSettings,
    isSaving,
  } = useUserContext();

  // Full access to all user state and functions
}
```

## Type Definitions

### UserPreferences Interface

```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  model: string;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
}
```

### UserSettings Interface

```typescript
interface UserSettings {
  historyLimit: number;
  defaultSystemPrompt: string;
  autoSave: boolean;
  soundEffects: boolean;
}
```

### ExtendedUserState Interface

```typescript
interface ExtendedUserState {
  // Clerk user data
  clerkUser: User | null;
  isSignedIn: boolean;
  isLoaded: boolean;

  // App-specific state
  preferences: UserPreferences;
  settings: UserSettings;
  currentConversationId: string | null;

  // Loading states
  isLoadingPreferences: boolean;
  isLoadingSettings: boolean;
  isSaving: boolean;

  // Update functions
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;

  // Reset function
  resetToDefaults: () => Promise<void>;
}
```

## Data Persistence

The user context automatically persists data to localStorage with the following strategy:

### Storage Keys

- `chatgpt-clone-preferences-${userId}` - User preferences
- `chatgpt-clone-settings-${userId}` - User settings
- `chatgpt-clone-current-conversation-${userId}` - Active conversation ID

### Behavior

- **Automatic Save**: Changes are immediately saved to localStorage
- **User-Specific**: Each user's data is stored separately using their Clerk user ID
- **Error Handling**: Failed saves are logged and state is reverted
- **Sign Out**: Data is cleared from memory when user signs out (but persists in localStorage)

## Error Handling

The context includes comprehensive error handling:

- Failed localStorage operations are logged and gracefully handled
- State reverts to previous values on save errors
- Default values are used when stored data is corrupted
- Loading states indicate when operations are in progress

## Demo Component

A demo component is available to test the user context functionality:

```tsx
import { UserPreferencesDemo } from '@/components/common';

function TestPage() {
  return <UserPreferencesDemo />;
}
```

This component provides an interactive interface to test all user context features.

## Integration with Database

While the current implementation uses localStorage for persistence, the system is designed to easily
integrate with a database:

1. Replace localStorage operations in the context with API calls
2. Add server-side endpoints for user preferences and settings
3. Implement optimistic updates for better UX
4. Add conflict resolution for concurrent updates

## Best Practices

1. **Use Specific Hooks**: Prefer `useUserPreferences()` over `useUserContext()` when you only need
   preferences
2. **Check Loading States**: Always check `isLoaded` before accessing user data
3. **Handle Errors**: Implement error boundaries around components using user context
4. **Optimize Updates**: Batch multiple preference updates when possible
5. **Type Safety**: Use TypeScript interfaces for all user data structures

## Future Enhancements

- Database integration for server-side persistence
- Real-time synchronization across devices
- Preference validation and schema versioning
- A/B testing for default preferences
- Analytics for preference usage patterns
- Import/export functionality for user data
