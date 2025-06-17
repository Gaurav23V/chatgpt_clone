'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  savePreferences,
  loadPreferences,
} from '@/lib/storage/user-preferences';
import { useAuthStateChange } from '@/hooks/useAuthStateChange';

/**
 * User Settings Interface (separate from preferences)
 * These are chat-specific settings that don't overlap with preferences
 */
export interface UserSettings {
  historyLimit: number;
  defaultSystemPrompt: string;
  autoSave: boolean;
  soundEffects: boolean;
}

/**
 * Extended User State Interface
 * Combines Clerk's authentication data with app-specific preferences and settings
 */
export interface ExtendedUserState {
  // Clerk user data
  clerkUser: ReturnType<typeof useUser>['user'];
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

  // Auth transition state
  isTransitioning: boolean;
  transitionType: string | null;
  transitionError: string | null;

  // Update functions
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;

  // Reset function
  resetToDefaults: () => Promise<void>;

  // Manual cleanup function
  manualCleanup: (config?: any) => Promise<void>;
}

/**
 * Default user settings
 */
const DEFAULT_SETTINGS: UserSettings = {
  historyLimit: 50,
  defaultSystemPrompt: 'You are a helpful AI assistant.',
  autoSave: true,
  soundEffects: false,
};

/**
 * User Context
 */
const UserContext = createContext<ExtendedUserState | null>(null);

/**
 * UserProvider Component
 * Wraps the app and provides user context with Clerk integration
 */
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();

  // Initialize auth state change handler
  const { transitionState, manualCleanup } = useAuthStateChange({
    clearPreferences: false,
    clearConversationHistory: true,
    clearCachedResponses: true,
    clearTempFiles: true,
    clearSessionData: true,
  });

  // App-specific state - now using enhanced preferences from storage module
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Loading states
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Generate localStorage keys based on user ID
   */
  const getStorageKeys = (userId: string) => ({
    settings: `chatgpt-clone-settings-${userId}`,
    currentConversation: `chatgpt-clone-current-conversation-${userId}`,
  });

  /**
   * Load user preferences using the new persistence system
   */
  const loadUserPreferences = async (userId: string) => {
    setIsLoadingPreferences(true);
    try {
      const loadedPreferences = await loadPreferences(userId);
      setPreferences(loadedPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  /**
   * Load user settings from localStorage
   */
  const loadUserSettings = async (userId: string) => {
    setIsLoadingSettings(true);
    try {
      const keys = getStorageKeys(userId);
      const storedSettings = localStorage.getItem(keys.settings);

      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  /**
   * Load current conversation ID from localStorage
   */
  const loadCurrentConversation = (userId: string) => {
    try {
      const keys = getStorageKeys(userId);
      const storedConversationId = localStorage.getItem(keys.currentConversation);
      setCurrentConversationId(storedConversationId);
    } catch (error) {
      console.error('Error loading current conversation:', error);
      setCurrentConversationId(null);
    }
  };

  /**
   * Update user preferences using the new persistence system
   */
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!clerkUser?.id) return;

    setIsSaving(true);
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      // Use the new persistence system
      const success = await savePreferences(clerkUser.id, newPreferences);
      if (!success) {
        // Revert on error
        setPreferences(preferences);
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revert on error
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Update user settings
   */
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!clerkUser?.id) return;

    setIsSaving(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      const keys = getStorageKeys(clerkUser.id);
      localStorage.setItem(keys.settings, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Update current conversation ID
   */
  const updateCurrentConversationId = (id: string | null) => {
    if (!clerkUser?.id) return;

    setCurrentConversationId(id);

    try {
      const keys = getStorageKeys(clerkUser.id);
      if (id) {
        localStorage.setItem(keys.currentConversation, id);
      } else {
        localStorage.removeItem(keys.currentConversation);
      }
    } catch (error) {
      console.error('Error updating current conversation:', error);
    }
  };

  /**
   * Reset all user data to defaults
   */
  const resetToDefaults = async () => {
    if (!clerkUser?.id) return;

    setIsSaving(true);
    try {
      setPreferences(DEFAULT_PREFERENCES);
      setSettings(DEFAULT_SETTINGS);
      setCurrentConversationId(null);

      // Clear preferences using the new persistence system
      await savePreferences(clerkUser.id, DEFAULT_PREFERENCES);

      // Clear settings and conversation from localStorage
      const keys = getStorageKeys(clerkUser.id);
      localStorage.removeItem(keys.settings);
      localStorage.removeItem(keys.currentConversation);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Listen for auth state change events from the useAuthStateChange hook
   */
  useEffect(() => {
    const handleUserSignIn = (event: CustomEvent) => {
      const { userId, preferences: loadedPreferences } = event.detail;
      console.info('User signed in event received:', userId);

      // Update preferences with loaded data
      if (loadedPreferences) {
        setPreferences(loadedPreferences);
      }

      // Load additional user data
      if (userId) {
        loadUserSettings(userId);
        loadCurrentConversation(userId);
      }
    };

    const handleUserSignOut = () => {
      console.info('User signed out event received');

      // Reset all state to defaults
      setPreferences(DEFAULT_PREFERENCES);
      setSettings(DEFAULT_SETTINGS);
      setCurrentConversationId(null);

      // Reset loading states
      setIsLoadingPreferences(false);
      setIsLoadingSettings(false);
      setIsSaving(false);
    };

    const handleClearConversations = () => {
      console.info('Clear conversations event received');
      setCurrentConversationId(null);
    };

    // Add event listeners
    window.addEventListener('userSignIn', handleUserSignIn as EventListener);
    window.addEventListener('userSignOut', handleUserSignOut);
    window.addEventListener('clearConversations', handleClearConversations);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('userSignIn', handleUserSignIn as EventListener);
      window.removeEventListener('userSignOut', handleUserSignOut);
      window.removeEventListener('clearConversations', handleClearConversations);
    };
  }, []);

  /**
   * Legacy effect for fallback - kept for compatibility
   * The main auth handling is now done by useAuthStateChange
   */
  useEffect(() => {
    // Only handle cases not covered by useAuthStateChange
    if (isLoaded && isSignedIn && clerkUser?.id && !transitionState.isTransitioning) {
      // If auth state handler isn't running, load data manually
      const hasData = preferences !== DEFAULT_PREFERENCES ||
                     settings !== DEFAULT_SETTINGS ||
                     currentConversationId !== null;

      if (!hasData) {
        loadUserPreferences(clerkUser.id);
        loadUserSettings(clerkUser.id);
        loadCurrentConversation(clerkUser.id);
      }
    }
  }, [isLoaded, isSignedIn, clerkUser?.id, transitionState.isTransitioning]);

  const contextValue: ExtendedUserState = {
    // Clerk data
    clerkUser,
    isSignedIn: isSignedIn || false,
    isLoaded,

    // App-specific state
    preferences,
    settings,
    currentConversationId,

    // Loading states
    isLoadingPreferences,
    isLoadingSettings,
    isSaving,

    // Auth transition state from useAuthStateChange
    isTransitioning: transitionState.isTransitioning,
    transitionType: transitionState.transitionType,
    transitionError: transitionState.error,

    // Update functions
    updatePreferences,
    updateSettings,
    setCurrentConversationId: updateCurrentConversationId,

    // Reset function
    resetToDefaults,

    // Manual cleanup function from useAuthStateChange
    manualCleanup,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 */
export function useUserContext() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }

  return context;
}

/**
 * Hook to access user preferences
 */
export function useUserPreferences() {
  const { preferences, updatePreferences, isLoadingPreferences, isSaving } = useUserContext();

  return {
    preferences,
    updatePreferences,
    isLoading: isLoadingPreferences,
    isSaving,
  };
}

/**
 * Hook to access user settings
 */
export function useUserSettings() {
  const { settings, updateSettings, isLoadingSettings, isSaving } = useUserContext();

  return {
    settings,
    updateSettings,
    isLoading: isLoadingSettings,
    isSaving,
  };
}

/**
 * Hook to access current conversation state
 */
export function useCurrentConversation() {
  const { currentConversationId, setCurrentConversationId } = useUserContext();

  return {
    currentConversationId,
    setCurrentConversationId,
  };
}

/**
 * Hook to check if user is fully loaded and authenticated
 */
export function useAuthState() {
  const { clerkUser, isSignedIn, isLoaded, isTransitioning, transitionType, transitionError } = useUserContext();

  return {
    user: clerkUser,
    isSignedIn,
    isLoaded,
    isReady: isLoaded && isSignedIn && !isTransitioning,
    isTransitioning,
    transitionType,
    transitionError,
  };
}

/**
 * Hook to access auth transition state and cleanup functions
 */
export function useAuthTransition() {
  const { isTransitioning, transitionType, transitionError, manualCleanup } = useUserContext();

  return {
    isTransitioning,
    transitionType,
    transitionError,
    manualCleanup,
  };
}
