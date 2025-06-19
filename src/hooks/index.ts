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

// Export auth error handling hooks
export {
  useAuthError,
  useAuthNetworkError,
  useAutoRecovery,
  useErrorRecovery,
} from './useAuthError';

// TODO: Export additional custom hooks when they are created
// export { useChat } from './useChat';
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
 * Planned Additional Hooks:
 *
 * 1. useChat - Main chat functionality hook
 *    - Send messages, manage conversation state
 *    - Handle streaming responses
 *    - Manage chat history
 *
 * 2. useApi - API request management
 *    - Generic API calling with loading states
 *    - Error handling and retry logic
 *    - Request caching
 *
 * 3. useLocalStorage - Local storage state management
 *    - Persist state to localStorage
 *    - Sync across tabs
 *    - Type-safe storage
 *
 * 4. useDebounce - Debounce values and functions
 *    - Debounce input values
 *    - Debounce API calls
 *    - Configurable delay
 *
 * 5. useWebSocket - WebSocket connection management
 *    - Real-time chat updates
 *    - Connection status
 *    - Auto-reconnection
 *
 * 6. useTheme - Theme management
 *    - Light/dark mode toggle
 *    - System preference detection
 *    - Theme persistence
 *
 * 7. useCopyToClipboard - Copy text to clipboard
 *    - Copy functionality with feedback
 *    - Success/error states
 *    - Browser compatibility
 *
 * 8. useKeyboardShortcuts - Keyboard shortcut handling
 *    - Global shortcuts (Cmd+K, etc.)
 *    - Context-specific shortcuts
 *    - Shortcut registration
 *
 * 9. useInfiniteScroll - Infinite scrolling
 *    - Chat history pagination
 *    - Automatic loading
 *    - Scroll position management
 */
