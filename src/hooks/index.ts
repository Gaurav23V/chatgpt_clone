/**
 * Custom Hooks Export Barrel
 *
 * This file exports all custom React hooks used throughout the application.
 * Includes:
 * - Chat and messaging hooks
 * - Authentication state hooks
 * - Data fetching hooks
 * - UI state management hooks
 * - Utility hooks
 */

// Export user-related hooks from user context
export {
  useAuthState,
  useAuthTransition,
  useCurrentConversation,
  useUserContext,
  useUserPreferences,
  useUserSettings,
} from '../contexts/user-context';

// Export auth state change hook
export type {
  AuthStateChangeEvent,
  AuthTransitionState,
  CleanupConfig,
} from './useAuthStateChange';
export { useAuthStateChange } from './useAuthStateChange';

// Export persisted preferences hooks
export {
  useInterfacePreferences,
  useModelPreference,
  usePersistedPreferences,
  useThemePreference,
} from './usePersistedPreferences';

// Export database-backed user preferences hook
export type {
  PreferenceUpdate,
  UserPreferences,
  UseUserPreferencesReturn,
} from './useUserPreferences';
export {
  useModelPreference as useModelPreferenceDB,
  usePreference,
  useThemePreference as useThemePreferenceDB,
  useUserPreferences as useUserPreferencesDB,
} from './useUserPreferences';

// Export auth error handling hooks
export {
  useAuthError,
  useAuthNetworkError,
  useAutoRecovery,
  useErrorRecovery,
} from './useAuthError';

// Export Google Generative AI hooks
export {
  useGoogleChat,
  type GoogleChatConfig,
  type GoogleChatState,
  type UseGoogleChatReturn,
} from './useGoogleChat';

// Enhanced chat hooks
// TODO: Create enhanced Google chat hook
// export { default as useEnhancedGoogleChat } from './useEnhancedGoogleChat';

// TODO: Export additional custom hooks when they are created
// export { useLocalStorage } from './useLocalStorage';
// export { useDebounce } from './useDebounce';
// export { useApi } from './useApi';
// export { useWebSocket } from './useWebSocket';
// export { useTheme } from './useTheme';
// export { useCopyToClipboard } from './useCopyToClipboard';

// Placeholder exports to prevent import errors
export const CustomHooks = {
  // This object will be replaced with actual hook exports
  placeholder: true,
};

/**
 * Available Custom Hooks:
 *
 * User Management Hooks:
 * - useUserContext() - Access full user context state
 * - useUserPreferences() - Manage user preferences (theme, model, language, fontSize)
 * - useUserSettings() - Manage chat settings (history limit, system prompt, etc.)
 * - useCurrentConversation() - Manage active conversation state
 * - useAuthState() - Check authentication status and user data (now includes transition state)
 * - useAuthTransition() - Access auth transition state and cleanup functions
 *
 * Auth State Change Management:
 * - useAuthStateChange() - Handle auth state transitions with cleanup and loading states
 * - AuthStateChangeEvent - Type for auth state change events
 * - AuthTransitionState - Interface for transition state
 * - CleanupConfig - Configuration for cleanup behavior
 *
 * Persisted Preferences Hooks:
 * - usePersistedPreferences() - Full-featured preference management with auto-save
 * - useThemePreference() - Manage theme preference specifically
 * - useModelPreference() - Manage AI model preference specifically
 * - useInterfacePreferences() - Manage UI preferences (fontSize, language, etc.)
 *
 * Chat and Streaming Hooks:
 * - useGoogleChat() - Basic chat hook with Google Generative AI integration and error handling
 * - useEnhancedGoogleChat() - Advanced chat hook with comprehensive error handling and recovery
 *
 * Planned Additional Hooks:
 *
 * 1. useApi - API request management
 *    - Generic API calling with loading states
 *    - Error handling and retry logic
 *    - Request caching
 *
 * 2. useLocalStorage - Local storage state management
 *    - Persist state to localStorage
 *    - Sync across tabs
 *    - Type-safe storage
 *
 * 3. useDebounce - Debounce values and functions
 *    - Debounce input values
 *    - Debounce API calls
 *    - Configurable delay
 *
 * 4. useWebSocket - WebSocket connection management
 *    - Real-time chat updates
 *    - Connection status
 *    - Auto-reconnection
 *
 * 5. useTheme - Theme management
 *    - Light/dark mode toggle
 *    - System preference detection
 *    - Theme persistence
 *
 * 6. useCopyToClipboard - Copy text to clipboard
 *    - Copy functionality with feedback
 *    - Success/error states
 *    - Browser compatibility
 *
 * 7. useKeyboardShortcuts - Keyboard shortcut handling
 *    - Global shortcuts (Cmd+K, etc.)
 *    - Context-specific shortcuts
 *    - Shortcut registration
 *
 * 8. useInfiniteScroll - Infinite scrolling
 *    - Chat history pagination
 *    - Automatic loading
 *    - Scroll position management
 *
 * 9. useStreamHandler - Low-level stream processing
 *    - Parse SSE streams
 *    - Handle partial JSON responses
 *    - Backpressure management
 *    - Stream interruption
 */

// Hook descriptions and documentation
export const HOOK_DESCRIPTIONS = {
  // Authentication hooks
  useAuthError: 'Hook for handling authentication errors with automatic retry and recovery',
  useAuthStateChange: 'Hook for monitoring and reacting to authentication state changes',
  
  // Preferences hooks
  useUserPreferences: 'Hook for managing user preferences with API synchronization',
  usePersistedPreferences: 'Hook for local storage persistence of user preferences',
  
  // AI Chat hooks
  useGoogleChat: 'Basic chat hook with Google Generative AI integration and error handling',
  useEnhancedGoogleChat: 'Advanced chat hook with comprehensive error handling and recovery',
} as const;

/**
 * Hook categories for documentation and organization
 */
export const HOOK_CATEGORIES = {
  AUTHENTICATION: {
    name: 'Authentication',
    description: 'Hooks for managing user authentication and session state',
    hooks: ['useAuthError', 'useAuthStateChange'],
  },
  
  PREFERENCES: {
    name: 'User Preferences',
    description: 'Hooks for managing user settings and preferences',
    hooks: ['useUserPreferences', 'usePersistedPreferences'],
  },
  
  AI_CHAT: {
    name: 'AI Chat',
    description: 'Hooks for AI chat functionality with Google Generative AI',
    hooks: ['useGoogleChat', 'useEnhancedGoogleChat'],
  },
} as const;

/**
 * Available hooks metadata
 */
export const AVAILABLE_HOOKS = [
  // Authentication hooks
  {
    name: 'useAuthError',
    category: 'AUTHENTICATION',
    description: HOOK_DESCRIPTIONS.useAuthError,
    features: ['Error handling', 'Automatic retry', 'Recovery strategies'],
  },
  
  {
    name: 'useAuthStateChange', 
    category: 'AUTHENTICATION',
    description: HOOK_DESCRIPTIONS.useAuthStateChange,
    features: ['State monitoring', 'Event handling', 'Callback support'],
  },
  
  // Preferences hooks
  {
    name: 'useUserPreferences',
    category: 'PREFERENCES', 
    description: HOOK_DESCRIPTIONS.useUserPreferences,
    features: ['API sync', 'Optimistic updates', 'Error handling'],
  },
  
  {
    name: 'usePersistedPreferences',
    category: 'PREFERENCES',
    description: HOOK_DESCRIPTIONS.usePersistedPreferences, 
    features: ['Local storage', 'Persistence', 'Hydration'],
  },
  
  // AI Chat hooks
  {
    name: 'useGoogleChat',
    category: 'AI_CHAT',
    description: HOOK_DESCRIPTIONS.useGoogleChat,
    features: ['Google Generative AI', 'Streaming', 'Error handling', 'Retry logic'],
  },
  
  {
    name: 'useEnhancedGoogleChat',
    category: 'AI_CHAT', 
    description: HOOK_DESCRIPTIONS.useEnhancedGoogleChat,
    features: ['Advanced error handling', 'Model fallback', 'Context reduction', 'Network monitoring'],
  },
] as const;

/**
 * Recommended hooks for common use cases
 */
export const RECOMMENDED_HOOKS = {
  // For basic chat functionality
  BASIC_CHAT: 'useGoogleChat',
  
  // For production chat with advanced error handling
  PRODUCTION_CHAT: 'useEnhancedGoogleChat',
  
  // For user authentication
  AUTH_HANDLING: 'useAuthStateChange',
  
  // For user preferences
  PREFERENCES: 'useUserPreferences',
} as const;
