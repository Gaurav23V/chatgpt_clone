/**
 * AI Library Exports
 *
 * Main export barrel for AI-related functionality including:
 * - Model configurations and providers
 * - Google Generative AI-specific utilities and configurations
 * - Stream handling and processing utilities
 * - OpenAI fallback configurations
 * - Type definitions and interfaces
 */

// Core AI configurations
export {
  AI_MODELS,
  aiConfig,
  type AIModel,
  CHAT_CONFIG,
  type ChatCompletionOptions,
  type ChatMessage,
  type ChatRole,
  DEFAULT_MODEL,
  RATE_LIMITS,
} from './config';

// Google Generative AI-specific exports (all available exports)
export * from './google-config';

// Model definitions and utilities
export {
  ALL_MODELS,
  modelHelpers,
  MODEL_CATEGORIES,
  DEFAULT_MODELS,
} from './models';

// Stream handling utilities
export * from './stream-handler';

// Error handling
export * from './error-handler';
