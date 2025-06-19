 # User Preferences Storage System

This document outlines the user preferences storage system implemented in the ChatGPT Clone application. The system provides persistent storage of user preferences in MongoDB with real-time synchronization.

## Overview

The user preferences system consists of:
- **API Endpoints** for CRUD operations on user preferences
- **Client-side Hook** for managing preferences with caching and optimistic updates
- **Database Integration** with the User model and service layer
- **Type Safety** throughout the entire stack

## API Endpoints

### GET `/api/user/preferences`

Fetch current user preferences.

**Authentication**: Required (Clerk JWT)

**Response**:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "theme": "dark",
      "aiModel": "gpt-4",
      "language": "en",
      "fontSize": "medium",
      "soundEnabled": true,
      "emailNotifications": false
    },
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required"
  }
}
```

### PUT `/api/user/preferences`

Update user preferences (partial or full updates supported).

**Authentication**: Required (Clerk JWT)

**Request Body**:
```json
{
  "theme": "dark",
  "aiModel": "gpt-4"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "preferences": {
      "theme": "dark",
      "aiModel": "gpt-4",
      "language": "en",
      "fontSize": "medium",
      "soundEnabled": true,
      "emailNotifications": false
    },
    "lastUpdated": "2024-01-15T10:35:00Z",
    "message": "Preferences updated successfully"
  }
}
```

## Client-side Hook

### `useUserPreferences()`

Primary hook for managing user preferences.

```typescript
import { useUserPreferences } from '@/hooks';

function SettingsPage() {
  const {
    preferences,
    isLoading,
    isUpdating,
    error,
    updatePreferences,
    updateTheme,
    updateModel,
    toggleSound,
  } = useUserPreferences();

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    const success = await updateTheme(theme);
    if (success) {
      console.log('Theme updated successfully');
    }
  };

  if (isLoading) return <div>Loading preferences...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Settings</h1>
      <select 
        value={preferences?.theme} 
        onChange={(e) => handleThemeChange(e.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
```

### Hook Return Interface

```typescript
interface UseUserPreferencesReturn {
  // Data
  preferences: UserPreferences | null;
  lastUpdated: Date | null;
  
  // States
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions
  updatePreferences: (updates: PreferenceUpdate) => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
  resetError: () => void;
  
  // Convenience methods
  updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<boolean>;
  updateModel: (model: string) => Promise<boolean>;
  updateLanguage: (language: string) => Promise<boolean>;
  updateFontSize: (fontSize: 'small' | 'medium' | 'large') => Promise<boolean>;
  toggleSound: () => Promise<boolean>;
  toggleEmailNotifications: () => Promise<boolean>;
}
```

### Utility Hooks

#### `usePreference<K>(key: K)`

Hook for managing a specific preference value:

```typescript
const [theme, setTheme] = usePreference('theme');
const [model, setModel] = usePreference('aiModel');

// Update theme
await setTheme('dark');
```

#### `useThemePreferenceDB()` and `useModelPreferenceDB()`

Specialized hooks for common preferences:

```typescript
const { theme, updateTheme, isLoading } = useThemePreferenceDB();
const { model, updateModel, isLoading } = useModelPreferenceDB();
```

## Preference Types

### UserPreferences Interface

```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  aiModel: string;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  emailNotifications: boolean;
}
```

### Validation Rules

| Field | Type | Valid Values | Default |
|-------|------|--------------|---------|
| `theme` | string | `'light'`, `'dark'`, `'system'` | `'system'` |
| `aiModel` | string | `'gpt-3.5-turbo'`, `'gpt-4'`, `'gpt-4-turbo'` | `'gpt-3.5-turbo'` |
| `language` | string | ISO language codes (2-5 chars) | `'en'` |
| `fontSize` | string | `'small'`, `'medium'`, `'large'` | `'medium'` |
| `soundEnabled` | boolean | `true`, `false` | `true` |
| `emailNotifications` | boolean | `true`, `false` | `true` |

## Database Integration

### User Model

Preferences are stored in the `preferences` field of the User model:

```typescript
{
  clerkId: "user_123",
  email: "user@example.com",
  preferences: {
    theme: "dark",
    aiModel: "gpt-4",
    language: "en",
    fontSize: "medium",
    soundEnabled: true,
    emailNotifications: false
  },
  // ... other fields
}
```

### Service Layer

The API uses the user service layer for database operations:

- `getUserByClerkId()` - Fetch user data
- `updateUser()` - Update user preferences
- `withTransaction()` - Ensure data consistency

## Features

### ✅ Implemented Features

- **Real-time Updates**: Changes are immediately reflected in the UI
- **Optimistic Updates**: UI updates instantly with rollback on error
- **Type Safety**: Full TypeScript support throughout
- **Error Handling**: Comprehensive error states and recovery
- **Caching**: In-memory caching for performance
- **Transaction Support**: Database consistency guarantees
- **Authentication**: Clerk integration for secure access
- **Validation**: Server-side input validation and sanitization

### 🔄 Loading States

- `isLoading` - Initial data fetch
- `isUpdating` - Preference update in progress
- `error` - Error state with descriptive messages

### 🛡️ Error Handling

- **Network Errors**: Automatic retry logic
- **Validation Errors**: Clear error messages
- **Authentication Errors**: Proper redirect handling
- **Rollback Support**: Optimistic updates with error recovery

## Usage Examples

### Basic Usage

```typescript
function App() {
  const { preferences, updateTheme } = useUserPreferences();
  
  return (
    <ThemeProvider theme={preferences?.theme || 'system'}>
      <button onClick={() => updateTheme('dark')}>
        Switch to Dark Mode
      </button>
    </ThemeProvider>
  );
}
```

### Form Integration

```typescript
function PreferencesForm() {
  const { 
    preferences, 
    isUpdating, 
    updatePreferences, 
    error 
  } = useUserPreferences();
  
  const handleSubmit = async (formData: PreferenceUpdate) => {
    const success = await updatePreferences(formData);
    if (success) {
      toast.success('Preferences saved!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
      <button type="submit" disabled={isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
}
```

### Context Integration

```typescript
function UserProvider({ children }) {
  const preferences = useUserPreferences();
  
  return (
    <UserContext.Provider value={{ preferences }}>
      {children}
    </UserContext.Provider>
  );
}
```

## Security

- **Authentication**: All API endpoints require valid Clerk JWT
- **Authorization**: Users can only access their own preferences
- **Validation**: Server-side input validation and sanitization
- **Rate Limiting**: TODO - Implement rate limiting for API endpoints
- **CORS**: Proper CORS headers for security

## Performance

- **Caching**: In-memory caching of preferences
- **Optimistic Updates**: Immediate UI feedback
- **Minimal Requests**: Only updates changed fields
- **Indexing**: Database indexes for fast queries
- **Transaction Support**: Atomic operations for consistency

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `UNAUTHENTICATED` | User not signed in | Redirect to sign-in |
| `USER_NOT_FOUND` | User profile missing | Create user profile |
| `VALIDATION_ERROR` | Invalid input data | Fix validation errors |
| `DATABASE_ERROR` | Database operation failed | Retry operation |
| `INTERNAL_ERROR` | Unexpected server error | Contact support |

## Future Enhancements

- **Real-time Sync**: WebSocket updates across tabs
- **Preference History**: Track preference changes over time
- **Bulk Updates**: Update multiple preferences atomically
- **Preference Sharing**: Share preference profiles
- **Advanced Validation**: Custom validation rules per preference
- **Preference Categories**: Group related preferences together
- **Export/Import**: Backup and restore preferences