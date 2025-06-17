/**
 * Application Constants Export Barrel
 *
 * This file exports all application constants and configuration values.
 * Includes:
 * - API endpoints and URLs
 * - UI constants and breakpoints
 * - Feature flags and limits
 * - Default values and settings
 * - Error messages and text
 */

/**
 * API Configuration Constants
 */
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  HISTORY: '/api/history',
  USER: '/api/user',
  SETTINGS: '/api/settings',
  UPLOAD: '/api/upload',
} as const;

/**
 * Chat Configuration Constants
 */
export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_CHAT_HISTORY: 50,
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  TYPING_DELAY: 100,
  AUTO_SAVE_DELAY: 2000,
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  SIDEBAR_WIDTH: 264,
  HEADER_HEIGHT: 64,
  MOBILE_MENU_BREAKPOINT: 768,
} as const;

/**
 * Theme Constants
 */
export const THEME_CONSTANTS = {
  THEMES: ['light', 'dark', 'system'] as const,
  DEFAULT_THEME: 'system',
  STORAGE_KEY: 'chatgpt-clone-theme',
} as const;

/**
 * User Role and Permission Constants
 */
export const USER_ROLES = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const RATE_LIMITS = {
  [USER_ROLES.FREE]: {
    MESSAGES_PER_HOUR: 20,
    MESSAGES_PER_DAY: 100,
    MAX_TOKENS_PER_MESSAGE: 1000,
  },
  [USER_ROLES.PRO]: {
    MESSAGES_PER_HOUR: 100,
    MESSAGES_PER_DAY: 1000,
    MAX_TOKENS_PER_MESSAGE: 4000,
  },
  [USER_ROLES.ENTERPRISE]: {
    MESSAGES_PER_HOUR: -1, // unlimited
    MESSAGES_PER_DAY: -1, // unlimited
    MAX_TOKENS_PER_MESSAGE: 8000,
  },
} as const;

/**
 * AI Model Constants
 */
export const AI_MODELS = {
  GPT_3_5_TURBO: {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for most tasks',
    maxTokens: 4096,
    costPer1kTokens: 0.002,
    provider: 'openai',
  },
  GPT_4O_MINI: {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Balanced performance and cost',
    maxTokens: 8192,
    costPer1kTokens: 0.01,
    provider: 'openai',
  },
  GPT_4O: {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model for complex tasks',
    maxTokens: 8192,
    costPer1kTokens: 0.03,
    provider: 'openai',
  },
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please sign in to continue.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  MESSAGE_TOO_LONG: `Message too long. Maximum ${CHAT_CONSTANTS.MAX_MESSAGE_LENGTH} characters.`,
  INVALID_MODEL: 'Selected model is not available for your plan.',
  CHAT_NOT_FOUND: 'Chat conversation not found.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message sent successfully',
  CHAT_SAVED: 'Chat saved successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard',
  CHAT_DELETED: 'Chat deleted successfully',
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  THEME: 'chatgpt-clone-theme',
  CHAT_DRAFTS: 'chatgpt-clone-drafts',
  USER_PREFERENCES: 'chatgpt-clone-preferences',
  SIDEBAR_COLLAPSED: 'chatgpt-clone-sidebar-collapsed',
} as const;

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_STREAMING: true,
  ENABLE_CHAT_EXPORT: true,
  ENABLE_VOICE_INPUT: false,
  ENABLE_IMAGE_UPLOAD: false,
  ENABLE_DARK_MODE: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
} as const;

/**
 * Keyboard Shortcuts
 */
export const KEYBOARD_SHORTCUTS = {
  NEW_CHAT: 'cmd+k',
  TOGGLE_SIDEBAR: 'cmd+\\',
  FOCUS_INPUT: '/',
  SEND_MESSAGE: 'cmd+enter',
  COPY_LAST_RESPONSE: 'cmd+shift+c',
} as const;

/**
 * Animation Constants
 */
export const ANIMATION_CONSTANTS = {
  DURATION: {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
  },
  EASING: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;
