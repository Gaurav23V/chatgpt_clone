/**
 * User Preferences Persistence System
 *
 * This module provides robust localStorage-based persistence for user preferences
 * with support for migration, validation, and error handling. Designed to eventually
 * integrate with database storage while maintaining backward compatibility.
 */

/**
 * Enhanced User Preferences Interface
 * Extends the existing structure with additional ChatGPT-like preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  model: 'gpt-3.5-turbo' | 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4' | 'gpt-4-turbo';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  sendOnEnter: boolean;
  showCodeLineNumbers: boolean;
}

/**
 * Preference storage metadata for versioning and migration
 */
interface PreferenceStorage {
  version: number;
  preferences: UserPreferences;
  lastUpdated: string;
  userId: string;
}

/**
 * Default preference values matching ChatGPT defaults
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  model: 'gpt-3.5-turbo',
  language: 'en',
  fontSize: 'medium',
  sendOnEnter: true,
  showCodeLineNumbers: true,
};

/**
 * Current storage version for migration purposes
 */
const STORAGE_VERSION = 1;

/**
 * Storage key prefix for user preferences
 */
const STORAGE_KEY_PREFIX = 'chatgpt-clone-prefs';

/**
 * Generate storage key for a specific user
 */
function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}-${userId}`;
}

/**
 * Check if localStorage is available and functional
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate preference data against the expected structure
 */
function validatePreferences(data: any): data is UserPreferences {
  if (!data || typeof data !== 'object') return false;

  const requiredFields: (keyof UserPreferences)[] = [
    'theme', 'model', 'language', 'fontSize', 'sendOnEnter', 'showCodeLineNumbers'
  ];

  for (const field of requiredFields) {
    if (!(field in data)) return false;
  }

  // Validate specific field types and values
  const validThemes = ['light', 'dark', 'system'];
  const validModels = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-4-turbo'];
  const validFontSizes = ['small', 'medium', 'large'];

  if (!validThemes.includes(data.theme)) return false;
  if (!validModels.includes(data.model)) return false;
  if (!validFontSizes.includes(data.fontSize)) return false;
  if (typeof data.language !== 'string') return false;
  if (typeof data.sendOnEnter !== 'boolean') return false;
  if (typeof data.showCodeLineNumbers !== 'boolean') return false;

  return true;
}

/**
 * Migrate preferences from older versions
 */
function migratePreferences(data: any, fromVersion: number): UserPreferences {
  let migrated = { ...data };

  // Migration from version 0 (legacy format) to version 1
  if (fromVersion < 1) {
    // Add new fields with defaults if they don't exist
    if (!('sendOnEnter' in migrated)) {
      migrated.sendOnEnter = DEFAULT_PREFERENCES.sendOnEnter;
    }
    if (!('showCodeLineNumbers' in migrated)) {
      migrated.showCodeLineNumbers = DEFAULT_PREFERENCES.showCodeLineNumbers;
    }

    // Update model names if using old format
    if (migrated.model === 'gpt-4-turbo-preview') {
      migrated.model = 'gpt-4-turbo';
    }
  }

  // Ensure all fields are present and valid
  return {
    theme: migrated.theme || DEFAULT_PREFERENCES.theme,
    model: migrated.model || DEFAULT_PREFERENCES.model,
    language: migrated.language || DEFAULT_PREFERENCES.language,
    fontSize: migrated.fontSize || DEFAULT_PREFERENCES.fontSize,
    sendOnEnter: migrated.sendOnEnter ?? DEFAULT_PREFERENCES.sendOnEnter,
    showCodeLineNumbers: migrated.showCodeLineNumbers ?? DEFAULT_PREFERENCES.showCodeLineNumbers,
  };
}

/**
 * Save user preferences to localStorage
 */
export async function savePreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  if (!userId) {
    console.warn('Cannot save preferences: userId is required');
    return false;
  }

  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, preferences cannot be saved');
    return false;
  }

  try {
    // Load existing preferences to merge with new ones
    const existing = await loadPreferences(userId);
    const merged = { ...existing, ...preferences };

    // Validate merged preferences
    if (!validatePreferences(merged)) {
      console.error('Invalid preference data, falling back to defaults');
      return false;
    }

    const storageData: PreferenceStorage = {
      version: STORAGE_VERSION,
      preferences: merged,
      lastUpdated: new Date().toISOString(),
      userId,
    };

    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(storageData));

    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
}

/**
 * Load user preferences from localStorage
 */
export async function loadPreferences(userId: string): Promise<UserPreferences> {
  if (!userId) {
    console.warn('Cannot load preferences: userId is required');
    return DEFAULT_PREFERENCES;
  }

  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, using default preferences');
    return DEFAULT_PREFERENCES;
  }

  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);

    if (!stored) {
      // No stored preferences, return defaults
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(stored);

    // Handle legacy format (direct preferences object)
    if (!parsed.version) {
      console.info('Migrating preferences from legacy format');
      const migrated = migratePreferences(parsed, 0);

      // Save migrated preferences
      await savePreferences(userId, migrated);
      return migrated;
    }

    // Handle versioned format
    const storageData = parsed as PreferenceStorage;

    // Verify user ID matches
    if (storageData.userId !== userId) {
      console.warn('User ID mismatch in stored preferences, using defaults');
      return DEFAULT_PREFERENCES;
    }

    // Check if migration is needed
    if (storageData.version < STORAGE_VERSION) {
      console.info(`Migrating preferences from version ${storageData.version} to ${STORAGE_VERSION}`);
      const migrated = migratePreferences(storageData.preferences, storageData.version);

      // Save migrated preferences
      await savePreferences(userId, migrated);
      return migrated;
    }

    // Validate preferences
    if (!validatePreferences(storageData.preferences)) {
      console.error('Stored preferences are invalid, using defaults');
      return DEFAULT_PREFERENCES;
    }

    return storageData.preferences;
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Reset user preferences to defaults
 */
export async function resetPreferences(userId: string): Promise<boolean> {
  if (!userId) {
    console.warn('Cannot reset preferences: userId is required');
    return false;
  }

  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, cannot reset preferences');
    return false;
  }

  try {
    const key = getStorageKey(userId);
    localStorage.removeItem(key);

    // Save default preferences
    return await savePreferences(userId, DEFAULT_PREFERENCES);
  } catch (error) {
    console.error('Failed to reset preferences:', error);
    return false;
  }
}

/**
 * Migrate all user preferences to the current version
 */
export async function migrateAllPreferences(): Promise<void> {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, cannot migrate preferences');
    return;
  }

  try {
    const keys = Object.keys(localStorage);
    const preferenceKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));

    for (const key of preferenceKeys) {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        const parsed = JSON.parse(stored);

        // Extract userId from key
        const userId = key.replace(`${STORAGE_KEY_PREFIX}-`, '');

        if (!parsed.version || parsed.version < STORAGE_VERSION) {
          console.info(`Migrating preferences for user ${userId}`);
          const currentPrefs = await loadPreferences(userId);
          await savePreferences(userId, currentPrefs);
        }
      } catch (error) {
        console.error(`Failed to migrate preferences for key ${key}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to migrate preferences:', error);
  }
}

/**
 * Get storage statistics for debugging
 */
export function getStorageStats(): {
  available: boolean;
  userCount: number;
  totalSize: number;
  keys: string[];
} {
  if (!isLocalStorageAvailable()) {
    return {
      available: false,
      userCount: 0,
      totalSize: 0,
      keys: [],
    };
  }

  try {
    const keys = Object.keys(localStorage);
    const preferenceKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));

    let totalSize = 0;
    for (const key of preferenceKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }

    return {
      available: true,
      userCount: preferenceKeys.length,
      totalSize,
      keys: preferenceKeys,
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      available: false,
      userCount: 0,
      totalSize: 0,
      keys: [],
    };
  }
}

/**
 * Clear all preference data (useful for development/testing)
 */
export function clearAllPreferences(): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available');
    return false;
  }

  try {
    const keys = Object.keys(localStorage);
    const preferenceKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));

    for (const key of preferenceKeys) {
      localStorage.removeItem(key);
    }

    console.info(`Cleared ${preferenceKeys.length} preference entries`);
    return true;
  } catch (error) {
    console.error('Failed to clear preferences:', error);
    return false;
  }
}
