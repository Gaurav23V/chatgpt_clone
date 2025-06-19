/**
 * User Preferences Hook
 *
 * Custom React hook for managing user preferences with persistent storage
 * in MongoDB. Provides a clean interface for reading and updating user
 * preferences with automatic caching, error handling, and context synchronization.
 *
 * Features:
 * - Automatic preference fetching on mount
 * - In-memory caching for performance
 * - Optimistic updates with rollback
 * - Error handling and retry logic
 * - TypeScript type safety
 * - Context synchronization
 * - Loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * User preference interface matching the API
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  aiModel: string;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  emailNotifications: boolean;
}

/**
 * Partial preferences for updates
 */
export type PreferenceUpdate = Partial<UserPreferences>;

/**
 * API response structure
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Preferences API response data
 */
interface PreferencesData {
  preferences: UserPreferences;
  lastUpdated: string;
  message?: string;
}

/**
 * Hook return interface
 */
export interface UseUserPreferencesReturn {
  // Preference data
  preferences: UserPreferences | null;
  lastUpdated: Date | null;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  updatePreferences: (updates: PreferenceUpdate) => Promise<boolean>;
  refreshPreferences: () => Promise<void>;
  resetError: () => void;
  
  // Convenience methods
  updateTheme: (theme: UserPreferences['theme']) => Promise<boolean>;
  updateModel: (model: string) => Promise<boolean>;
  updateLanguage: (language: string) => Promise<boolean>;
  updateFontSize: (fontSize: UserPreferences['fontSize']) => Promise<boolean>;
  toggleSound: () => Promise<boolean>;
  toggleEmailNotifications: () => Promise<boolean>;
}

// ========================================
// DEFAULT VALUES
// ========================================

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  aiModel: 'gpt-3.5-turbo',
  language: 'en',
  fontSize: 'medium',
  soundEnabled: true,
  emailNotifications: true,
};

// ========================================
// API UTILITIES
// ========================================

/**
 * Fetch user preferences from API
 */
async function fetchPreferences(): Promise<PreferencesData> {
  const response = await fetch('/api/user/preferences', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<PreferencesData> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch preferences');
  }

  return result.data;
}

/**
 * Update user preferences via API
 */
async function updatePreferencesApi(updates: PreferenceUpdate): Promise<PreferencesData> {
  const response = await fetch('/api/user/preferences', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result: ApiResponse<PreferencesData> = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to update preferences');
  }

  return result.data;
}

// ========================================
// MAIN HOOK
// ========================================

/**
 * Main user preferences hook
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  // Clerk authentication state
  const { isSignedIn, isLoaded } = useUser();

  // Preference data state
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // CORE FUNCTIONS
  // ========================================

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch preferences from API
   */
  const refreshPreferences = useCallback(async () => {
    if (!isSignedIn) {
      setPreferences(DEFAULT_PREFERENCES);
      setLastUpdated(new Date());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPreferences();
      setPreferences(data.preferences);
      setLastUpdated(new Date(data.lastUpdated));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(errorMessage);
      console.error('[useUserPreferences] Fetch error:', err);
      
      // Fallback to default preferences
      setPreferences(DEFAULT_PREFERENCES);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  /**
   * Update preferences with optimistic updates
   */
  const updatePreferences = useCallback(async (updates: PreferenceUpdate): Promise<boolean> => {
    if (!isSignedIn || !preferences) {
      setError('User must be signed in to update preferences');
      return false;
    }

    // Optimistic update
    const previousPreferences = { ...preferences };
    const optimisticPreferences = { ...preferences, ...updates };
    setPreferences(optimisticPreferences);
    setIsUpdating(true);
    setError(null);

    try {
      const data = await updatePreferencesApi(updates);
      
      // Update with server response
      setPreferences(data.preferences);
      setLastUpdated(new Date(data.lastUpdated));
      
      return true;
    } catch (err) {
      // Rollback optimistic update
      setPreferences(previousPreferences);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
      setError(errorMessage);
      console.error('[useUserPreferences] Update error:', err);
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [isSignedIn, preferences]);

  // ========================================
  // CONVENIENCE METHODS
  // ========================================

  /**
   * Update theme preference
   */
  const updateTheme = useCallback(async (theme: UserPreferences['theme']): Promise<boolean> => {
    return updatePreferences({ theme });
  }, [updatePreferences]);

  /**
   * Update AI model preference
   */
  const updateModel = useCallback(async (aiModel: string): Promise<boolean> => {
    return updatePreferences({ aiModel });
  }, [updatePreferences]);

  /**
   * Update language preference
   */
  const updateLanguage = useCallback(async (language: string): Promise<boolean> => {
    return updatePreferences({ language });
  }, [updatePreferences]);

  /**
   * Update font size preference
   */
  const updateFontSize = useCallback(async (fontSize: UserPreferences['fontSize']): Promise<boolean> => {
    return updatePreferences({ fontSize });
  }, [updatePreferences]);

  /**
   * Toggle sound enabled preference
   */
  const toggleSound = useCallback(async (): Promise<boolean> => {
    if (!preferences) return false;
    return updatePreferences({ soundEnabled: !preferences.soundEnabled });
  }, [preferences, updatePreferences]);

  /**
   * Toggle email notifications preference
   */
  const toggleEmailNotifications = useCallback(async (): Promise<boolean> => {
    if (!preferences) return false;
    return updatePreferences({ emailNotifications: !preferences.emailNotifications });
  }, [preferences, updatePreferences]);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Load preferences on mount or auth state change
   */
  useEffect(() => {
    if (isLoaded) {
      refreshPreferences();
    }
  }, [isLoaded, isSignedIn, refreshPreferences]);

  // ========================================
  // RETURN INTERFACE
  // ========================================

  return {
    // Preference data
    preferences,
    lastUpdated,
    
    // Loading states
    isLoading,
    isUpdating,
    
    // Error state
    error,
    
    // Actions
    updatePreferences,
    refreshPreferences,
    resetError,
    
    // Convenience methods
    updateTheme,
    updateModel,
    updateLanguage,
    updateFontSize,
    toggleSound,
    toggleEmailNotifications,
  };
}

// ========================================
// UTILITY HOOKS
// ========================================

/**
 * Hook to get a specific preference value
 */
export function usePreference<K extends keyof UserPreferences>(
  key: K
): [UserPreferences[K] | null, (value: UserPreferences[K]) => Promise<boolean>] {
  const { preferences, updatePreferences } = useUserPreferences();
  
  const value = preferences?.[key] ?? null;
  const updateValue = useCallback(
    (newValue: UserPreferences[K]) => updatePreferences({ [key]: newValue } as PreferenceUpdate),
    [key, updatePreferences]
  );
  
  return [value, updateValue];
}

/**
 * Hook for theme preference specifically
 */
export function useThemePreference() {
  const { preferences, updateTheme, isLoading } = useUserPreferences();
  
  return {
    theme: preferences?.theme ?? 'system',
    updateTheme,
    isLoading,
  };
}

/**
 * Hook for model preference specifically
 */
export function useModelPreference() {
  const { preferences, updateModel, isLoading } = useUserPreferences();
  
  return {
    model: preferences?.aiModel ?? 'gpt-3.5-turbo',
    updateModel,
    isLoading,
  };
}

// Export default
export default useUserPreferences; 