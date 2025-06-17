'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  savePreferences,
  loadPreferences,
  resetPreferences,
} from '@/lib/storage/user-preferences';

/**
 * Hook return type for persisted preferences
 */
interface UsePersistedPreferencesReturn {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
}

/**
 * Auto-debounce delay for saving preferences (ms)
 */
const SAVE_DEBOUNCE_DELAY = 500;

/**
 * Custom hook for persisted user preferences
 *
 * Features:
 * - Auto-loads preferences on mount
 * - Auto-saves changes with debouncing
 * - Handles loading and error states
 * - Integrates with Clerk authentication
 * - Type-safe preference management
 */
export function usePersistedPreferences(): UsePersistedPreferencesReturn {
  const { user, isLoaded } = useUser();

  // State management
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Refs for debouncing and tracking
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  /**
   * Load preferences for the current user
   */
  const loadUserPreferences = useCallback(async (userId: string) => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const loadedPreferences = await loadPreferences(userId);

      if (mountedRef.current) {
        setPreferences(loadedPreferences);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
        setPreferences(DEFAULT_PREFERENCES);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Save preferences with debouncing
   */
  const debouncedSave = useCallback(async (userId: string, prefs: UserPreferences) => {
    if (!mountedRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      setIsSaving(true);
      setError(null);

      try {
        const success = await savePreferences(userId, prefs);

        if (mountedRef.current) {
          if (success) {
            setLastSaved(new Date());
          } else {
            setError('Failed to save preferences');
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to save preferences');
        }
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    }, SAVE_DEBOUNCE_DELAY);
  }, []);

  /**
   * Update preferences with auto-save
   */
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user?.id || !isLoaded) {
      setError('User not authenticated');
      return;
    }

    const newPreferences = { ...preferences, ...updates };

    // Update state immediately for responsive UI
    setPreferences(newPreferences);

    // Save to storage (debounced)
    await debouncedSave(user.id, newPreferences);
  }, [user?.id, isLoaded, preferences, debouncedSave]);

  /**
   * Reset preferences to defaults
   */
  const resetToDefaults = useCallback(async () => {
    if (!user?.id || !isLoaded) {
      setError('User not authenticated');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const success = await resetPreferences(user.id);

      if (mountedRef.current) {
        if (success) {
          setPreferences(DEFAULT_PREFERENCES);
          setLastSaved(new Date());
        } else {
          setError('Failed to reset preferences');
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to reset preferences');
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [user?.id, isLoaded]);

  /**
   * Load preferences when user changes or component mounts
   */
  useEffect(() => {
    const currentUserId = user?.id;

    if (isLoaded && currentUserId) {
      // Only load if user ID has changed or this is the first load
      if (currentUserId !== lastUserIdRef.current) {
        lastUserIdRef.current = currentUserId;
        loadUserPreferences(currentUserId);
      }
    } else if (isLoaded && !currentUserId) {
      // User signed out, reset to defaults
      lastUserIdRef.current = null;
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
      setError(null);
      setLastSaved(null);
    }
  }, [user?.id, isLoaded, loadUserPreferences]);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    preferences,
    updatePreferences,
    resetToDefaults,
    isLoading,
    isSaving,
    error,
    lastSaved,
  };
}

/**
 * Hook for managing specific preference categories
 */
export function useThemePreference() {
  const { preferences, updatePreferences, isLoading, isSaving } = usePersistedPreferences();

  return {
    theme: preferences.theme,
    setTheme: (theme: UserPreferences['theme']) => updatePreferences({ theme }),
    isLoading,
    isSaving,
  };
}

export function useModelPreference() {
  const { preferences, updatePreferences, isLoading, isSaving } = usePersistedPreferences();

  return {
    model: preferences.model,
    setModel: (model: UserPreferences['model']) => updatePreferences({ model }),
    isLoading,
    isSaving,
  };
}

export function useInterfacePreferences() {
  const { preferences, updatePreferences, isLoading, isSaving } = usePersistedPreferences();

  return {
    fontSize: preferences.fontSize,
    language: preferences.language,
    sendOnEnter: preferences.sendOnEnter,
    showCodeLineNumbers: preferences.showCodeLineNumbers,
    setFontSize: (fontSize: UserPreferences['fontSize']) => updatePreferences({ fontSize }),
    setLanguage: (language: string) => updatePreferences({ language }),
    setSendOnEnter: (sendOnEnter: boolean) => updatePreferences({ sendOnEnter }),
    setShowCodeLineNumbers: (showCodeLineNumbers: boolean) => updatePreferences({ showCodeLineNumbers }),
    isLoading,
    isSaving,
  };
}
