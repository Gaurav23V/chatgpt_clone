'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession, useUser } from '@clerk/nextjs';

import {
  clearAllPreferences,
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  UserPreferences,
} from '@/lib/storage/user-preferences';

/**
 * Authentication state change events
 */
export type AuthStateChangeEvent =
  | 'signIn'
  | 'signOut'
  | 'userUpdate'
  | 'sessionUpdate'
  | 'accountSwitch';

/**
 * Authentication transition states
 */
export interface AuthTransitionState {
  isTransitioning: boolean;
  transitionType: AuthStateChangeEvent | null;
  error: string | null;
  progress: number; // 0-100
}

/**
 * Cleanup configuration for sign-out
 */
export interface CleanupConfig {
  clearPreferences?: boolean;
  clearConversationHistory?: boolean;
  clearCachedResponses?: boolean;
  clearTempFiles?: boolean;
  clearSessionData?: boolean;
}

/**
 * Default cleanup configuration - aggressive cleanup for security
 */
const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  clearPreferences: false, // Keep user preferences for next sign-in
  clearConversationHistory: true, // Clear for privacy
  clearCachedResponses: true, // Clear cached API responses
  clearTempFiles: true, // Clear temporary files
  clearSessionData: true, // Clear session-specific data
};

/**
 * Hook for handling authentication state changes
 */
export function useAuthStateChange(
  cleanupConfig: CleanupConfig = DEFAULT_CLEANUP_CONFIG
) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  // Track previous states to detect changes
  const prevUserIdRef = useRef<string | null>(null);
  const prevIsSignedInRef = useRef<boolean | null>(null);
  const prevSessionIdRef = useRef<string | null>(null);
  const initializationRef = useRef(false);

  // Transition state
  const [transitionState, setTransitionState] = useState<AuthTransitionState>({
    isTransitioning: false,
    transitionType: null,
    error: null,
    progress: 0,
  });

  /**
   * Update transition progress
   */
  const updateProgress = useCallback((progress: number) => {
    setTransitionState((prev) => ({ ...prev, progress }));
  }, []);

  /**
   * Set transition state
   */
  const setTransition = useCallback(
    (type: AuthStateChangeEvent | null, error: string | null = null) => {
      setTransitionState({
        isTransitioning: type !== null,
        transitionType: type,
        error,
        progress: type ? 0 : 100,
      });
    },
    []
  );

  /**
   * Clear conversation data from memory and storage
   */
  const clearConversationData = useCallback(async () => {
    try {
      // Clear current conversation from sessionStorage
      sessionStorage.removeItem('currentConversation');

      // Clear conversation history from localStorage (if configured)
      if (cleanupConfig.clearConversationHistory) {
        const conversationKeys = Object.keys(localStorage).filter(
          (key) => key.includes('conversation') || key.includes('chat')
        );

        conversationKeys.forEach((key) => {
          localStorage.removeItem(key);
        });
      }

      // Clear conversation-related data from memory
      // This would integrate with your chat state management
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('clearConversations'));
      }
    } catch (error) {
      console.error('Error clearing conversation data:', error);
    }
  }, [cleanupConfig.clearConversationHistory]);

  /**
   * Clear cached API responses
   */
  const clearCachedResponses = useCallback(async () => {
    if (!cleanupConfig.clearCachedResponses) return;

    try {
      // Clear cache from localStorage
      const cacheKeys = Object.keys(localStorage).filter(
        (key) => key.includes('cache') || key.includes('api-response')
      );

      cacheKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage cache
      const sessionCacheKeys = Object.keys(sessionStorage).filter(
        (key) => key.includes('cache') || key.includes('api-response')
      );

      sessionCacheKeys.forEach((key) => {
        sessionStorage.removeItem(key);
      });

      // Clear any in-memory caches
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('clearApiCache'));
      }
    } catch (error) {
      console.error('Error clearing cached responses:', error);
    }
  }, [cleanupConfig.clearCachedResponses]);

  /**
   * Clear temporary files and data
   */
  const clearTempFiles = useCallback(async () => {
    if (!cleanupConfig.clearTempFiles) return;

    try {
      // Clear temporary file references from localStorage
      const tempKeys = Object.keys(localStorage).filter(
        (key) =>
          key.includes('temp') ||
          key.includes('upload') ||
          key.includes('draft')
      );

      tempKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear IndexedDB temporary data (if any)
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        window.dispatchEvent(new CustomEvent('clearTempFiles'));
      }
    } catch (error) {
      console.error('Error clearing temporary files:', error);
    }
  }, [cleanupConfig.clearTempFiles]);

  /**
   * Clear session-specific data
   */
  const clearSessionData = useCallback(async () => {
    if (!cleanupConfig.clearSessionData) return;

    try {
      // Clear all sessionStorage
      sessionStorage.clear();

      // Clear session-specific localStorage keys
      const sessionKeys = Object.keys(localStorage).filter(
        (key) => key.includes('session') || key.includes('current-')
      );

      sessionKeys.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }, [cleanupConfig.clearSessionData]);

  /**
   * Handle user sign-in
   */
  const handleSignIn = useCallback(
    async (userId: string) => {
      setTransition('signIn');

      try {
        updateProgress(20);

        // Load user preferences
        const preferences = await loadPreferences(userId);
        updateProgress(40);

        // Initialize default settings if needed
        // This would integrate with your settings system
        updateProgress(60);

        // Clear any stale data from previous sessions
        await clearSessionData();
        updateProgress(80);

        // Emit sign-in event for other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('userSignIn', {
              detail: { userId, preferences },
            })
          );
        }

        updateProgress(100);
        setTransition(null);

        console.info('User signed in successfully:', userId);
      } catch (error) {
        console.error('Error during sign-in:', error);
        setTransition(
          null,
          error instanceof Error ? error.message : 'Sign-in failed'
        );
      }
    },
    [updateProgress, setTransition, clearSessionData]
  );

  /**
   * Handle user sign-out
   */
  const handleSignOut = useCallback(async () => {
    setTransition('signOut');

    try {
      updateProgress(20);

      // Clear conversation data
      await clearConversationData();
      updateProgress(40);

      // Clear cached responses
      await clearCachedResponses();
      updateProgress(60);

      // Clear temporary files
      await clearTempFiles();
      updateProgress(80);

      // Clear session data
      await clearSessionData();
      updateProgress(90);

      // Clear preferences if configured
      if (cleanupConfig.clearPreferences) {
        clearAllPreferences();
      }

      // Emit sign-out event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userSignOut'));
      }

      updateProgress(100);
      setTransition(null);

      console.info('User signed out and data cleared');
    } catch (error) {
      console.error('Error during sign-out cleanup:', error);
      setTransition(
        null,
        error instanceof Error ? error.message : 'Sign-out cleanup failed'
      );
    }
  }, [
    updateProgress,
    setTransition,
    clearConversationData,
    clearCachedResponses,
    clearTempFiles,
    clearSessionData,
    cleanupConfig.clearPreferences,
  ]);

  /**
   * Handle user profile update
   */
  const handleUserUpdate = useCallback(
    async (userId: string) => {
      setTransition('userUpdate');

      try {
        updateProgress(50);

        // Sync any profile changes
        // This would integrate with your user profile system

        // Emit user update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('userUpdate', {
              detail: { userId },
            })
          );
        }

        updateProgress(100);
        setTransition(null);

        console.info('User profile updated:', userId);
      } catch (error) {
        console.error('Error during user update:', error);
        setTransition(
          null,
          error instanceof Error ? error.message : 'User update failed'
        );
      }
    },
    [updateProgress, setTransition]
  );

  /**
   * Handle session update (token refresh, etc.)
   */
  const handleSessionUpdate = useCallback(async () => {
    setTransition('sessionUpdate');

    try {
      updateProgress(50);

      // Handle token refresh
      // Update any session-dependent data

      // Emit session update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sessionUpdate'));
      }

      updateProgress(100);
      setTransition(null);

      console.info('Session updated');
    } catch (error) {
      console.error('Error during session update:', error);
      setTransition(
        null,
        error instanceof Error ? error.message : 'Session update failed'
      );
    }
  }, [updateProgress, setTransition]);

  /**
   * Handle account switching
   */
  const handleAccountSwitch = useCallback(
    async (oldUserId: string | null, newUserId: string) => {
      setTransition('accountSwitch');

      try {
        updateProgress(20);

        // Clear data from previous account
        await handleSignOut();
        updateProgress(60);

        // Load data for new account
        await handleSignIn(newUserId);
        updateProgress(100);

        setTransition(null);

        console.info('Account switched:', { from: oldUserId, to: newUserId });
      } catch (error) {
        console.error('Error during account switch:', error);
        setTransition(
          null,
          error instanceof Error ? error.message : 'Account switch failed'
        );
      }
    },
    [updateProgress, setTransition, handleSignOut, handleSignIn]
  );

  /**
   * Main effect to monitor auth state changes
   */
  useEffect(() => {
    // don&apos;t process changes until Clerk is loaded
    if (!isLoaded) return;

    const currentUserId = user?.id || null;
    const currentIsSignedIn = isSignedIn;
    const currentSessionId = session?.id || null;

    // Handle initialization (first load)
    if (!initializationRef.current) {
      initializationRef.current = true;
      prevUserIdRef.current = currentUserId;
      prevIsSignedInRef.current = currentIsSignedIn;
      prevSessionIdRef.current = currentSessionId;

      // If user is already signed in on first load, trigger sign-in handler
      if (currentIsSignedIn && currentUserId) {
        handleSignIn(currentUserId);
      }

      return;
    }

    const prevUserId = prevUserIdRef.current;
    const prevIsSignedIn = prevIsSignedInRef.current;
    const prevSessionId = prevSessionIdRef.current;

    // Detect sign-in
    if (!prevIsSignedIn && currentIsSignedIn && currentUserId) {
      handleSignIn(currentUserId);
    }
    // Detect sign-out
    else if (prevIsSignedIn && !currentIsSignedIn) {
      handleSignOut();
    }
    // Detect account switch (user ID changed while signed in)
    else if (
      prevIsSignedIn &&
      currentIsSignedIn &&
      prevUserId &&
      currentUserId &&
      prevUserId !== currentUserId
    ) {
      handleAccountSwitch(prevUserId, currentUserId);
    }
    // Detect user profile update (same user, potentially updated data)
    else if (
      prevIsSignedIn &&
      currentIsSignedIn &&
      prevUserId === currentUserId &&
      currentUserId
    ) {
      // Only trigger if there's an actual change in user data
      // This would need more sophisticated change detection in a real app
      handleUserUpdate(currentUserId);
    }
    // Detect session update (session ID changed)
    else if (
      prevIsSignedIn &&
      currentIsSignedIn &&
      prevSessionId !== currentSessionId &&
      currentSessionId
    ) {
      handleSessionUpdate();
    }

    // Update refs for next comparison
    prevUserIdRef.current = currentUserId;
    prevIsSignedInRef.current = currentIsSignedIn;
    prevSessionIdRef.current = currentSessionId;
  }, [
    isLoaded,
    isSignedIn,
    user?.id,
    session?.id,
    handleSignIn,
    handleSignOut,
    handleAccountSwitch,
    handleUserUpdate,
    handleSessionUpdate,
  ]);

  /**
   * Manual cleanup function for components
   */
  const manualCleanup = useCallback(
    async (config?: Partial<CleanupConfig>) => {
      const finalConfig = { ...cleanupConfig, ...config };

      if (finalConfig.clearConversationHistory) await clearConversationData();
      if (finalConfig.clearCachedResponses) await clearCachedResponses();
      if (finalConfig.clearTempFiles) await clearTempFiles();
      if (finalConfig.clearSessionData) await clearSessionData();
      if (finalConfig.clearPreferences) clearAllPreferences();
    },
    [
      cleanupConfig,
      clearConversationData,
      clearCachedResponses,
      clearTempFiles,
      clearSessionData,
    ]
  );

  return {
    transitionState,
    manualCleanup,
    // Expose individual handlers for manual triggering if needed
    handlers: {
      handleSignIn,
      handleSignOut,
      handleUserUpdate,
      handleSessionUpdate,
      handleAccountSwitch,
    },
  };
}
