/**
 * Groq Configuration for ChatGPT Clone
 *
 * This file contains configuration for Groq AI provider integration:
 * - Groq client setup with API key validation
 * - Available model configurations with metadata
 * - Rate limiting and performance considerations
 * - Error handling and fallback strategies
 */

import { createGroq } from '@ai-sdk/groq';

/**
 * Types for Groq model configuration
 */
export interface GroqModelConfig {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportedFeatures: readonly string[];
  pricing: {
    input: number;
    output: number;
  };
  type: 'chat' | 'audio';
  recommended?: boolean;
  speed?: 'fastest' | 'fast' | 'medium' | 'slow';
  special?: 'reasoning';
}

// Environment validation
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    'GROQ_API_KEY environment variable is not set. Groq functionality will be limited.'
  );
}

/**
 * Groq client instance with custom configuration
 * Optimized for fast inference and reliability
 */
export const groq = createGroq({
  apiKey: GROQ_API_KEY || 'dummy-key-for-build',
  // Custom headers for tracking and analytics
  headers: {
    'User-Agent': 'ChatGPT-Clone/1.0',
  },
});

/**
 * Available Groq models with metadata and specifications
 * Based on latest Groq model offerings as of 2024
 */
export const GROQ_MODELS = {
  // Llama Models - Meta's flagship models
  LLAMA_3_3_70B: {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    description:
      "Meta's most capable model with balanced performance and speed",
    contextWindow: 131072, // 128K tokens
    maxOutputTokens: 131072,
    supportedFeatures: ['chat', 'function-calling', 'json-mode'] as const,
    pricing: {
      input: 0.59, // per 1M tokens
      output: 0.79, // per 1M tokens
    },
    recommended: true,
    type: 'chat' as const,
  },

  LLAMA_3_1_8B: {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    description: 'Fast and efficient model for real-time applications',
    contextWindow: 131072, // 128K tokens
    maxOutputTokens: 131072,
    supportedFeatures: ['chat', 'function-calling', 'json-mode'] as const,
    pricing: {
      input: 0.05, // per 1M tokens
      output: 0.08, // per 1M tokens
    },
    speed: 'fastest' as const,
    type: 'chat' as const,
  },

  LLAMA_3_1_70B: {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B Versatile',
    description: 'High-performance model for complex reasoning tasks',
    contextWindow: 131072, // 128K tokens
    maxOutputTokens: 131072,
    supportedFeatures: ['chat', 'function-calling', 'json-mode'] as const,
    pricing: {
      input: 0.59, // per 1M tokens
      output: 0.79, // per 1M tokens
    },
    type: 'chat' as const,
  },

  // Mixtral Models - Mistral AI's mixture of experts
  MIXTRAL_8X7B: {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    description: 'Efficient mixture of experts model for diverse tasks',
    contextWindow: 32768,
    maxOutputTokens: 32768,
    supportedFeatures: ['chat', 'function-calling', 'json-mode'] as const,
    pricing: {
      input: 0.24, // per 1M tokens
      output: 0.24, // per 1M tokens
    },
    type: 'chat' as const,
  },

  // Gemma Models - Google's lightweight models
  GEMMA2_9B: {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B IT',
    description: "Google's instruction-tuned model for chat applications",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportedFeatures: ['chat', 'json-mode'] as const,
    pricing: {
      input: 0.2, // per 1M tokens
      output: 0.2, // per 1M tokens
    },
    type: 'chat' as const,
  },

  // Reasoning Models
  QWEN_QWQ_32B: {
    id: 'qwen-qwq-32b',
    name: 'Qwen QWQ 32B',
    description: 'Advanced reasoning model with step-by-step thinking',
    contextWindow: 32768,
    maxOutputTokens: 32768,
    supportedFeatures: ['chat', 'reasoning', 'json-mode'] as const,
    pricing: {
      input: 0.18, // per 1M tokens
      output: 0.18, // per 1M tokens
    },
    special: 'reasoning' as const,
    type: 'chat' as const,
  },

  DEEPSEEK_R1_DISTILL_LLAMA_70B: {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    description: 'Distilled reasoning model based on Llama architecture',
    contextWindow: 32768,
    maxOutputTokens: 32768,
    supportedFeatures: ['chat', 'reasoning', 'json-mode'] as const,
    pricing: {
      input: 0.59, // per 1M tokens
      output: 0.79, // per 1M tokens
    },
    special: 'reasoning' as const,
    type: 'chat' as const,
  },

  // Whisper Models - Audio processing
  WHISPER_LARGE_V3: {
    id: 'whisper-large-v3',
    name: 'Whisper Large V3',
    description: 'State-of-the-art speech recognition and translation',
    contextWindow: 0, // Audio model - no text context
    maxOutputTokens: 0,
    supportedFeatures: ['transcription', 'translation'] as const,
    pricing: {
      input: 0.02, // per minute of audio
      output: 0, // No output pricing for transcription
    },
    type: 'audio' as const,
  },
} as const;

/**
 * Default model configuration
 */
export const DEFAULT_GROQ_MODEL = GROQ_MODELS.LLAMA_3_1_8B;

/**
 * Rate limiting configuration for Groq API
 * Based on Groq's documented limits and best practices
 */
export const GROQ_RATE_LIMITS = {
  // Free tier limits (approximate)
  FREE_TIER: {
    RPM: 30, // Requests per minute
    RPD: 14400, // Requests per day
    TPM: 6000, // Tokens per minute
    TPD: 18000, // Tokens per day
  },

  // Paid tier limits (higher)
  PAID_TIER: {
    RPM: 6000, // Requests per minute
    RPD: 1000000, // Requests per day
    TPM: 250000, // Tokens per minute
    TPD: 2000000, // Tokens per day
  },

  // Conservative limits for application use
  RECOMMENDED: {
    REQUESTS_PER_MINUTE: 25,
    CONCURRENT_REQUESTS: 5,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // ms
  },
} as const;

/**
 * Chat configuration optimized for Groq
 */
export const GROQ_CHAT_CONFIG = {
  // Default parameters optimized for Groq models
  DEFAULT_PARAMS: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    stream: true,
  },

  // Fast response parameters
  FAST_PARAMS: {
    temperature: 0.5,
    maxTokens: 1024,
    topP: 0.8,
    stream: true,
  },

  // Creative parameters
  CREATIVE_PARAMS: {
    temperature: 0.9,
    maxTokens: 4096,
    topP: 0.95,
    stream: true,
  },

  // Reasoning parameters for reasoning models
  REASONING_PARAMS: {
    temperature: 0.1,
    maxTokens: 8192,
    topP: 0.8,
    stream: true,
    // Groq-specific reasoning format
    reasoningFormat: 'parsed' as const,
  },
} as const;

/**
 * Model selection helpers
 */
export const groqModelHelpers = {
  /**
   * Get all available chat models
   */
  getChatModels: () => {
    return Object.values(GROQ_MODELS).filter(
      (model: any) =>
        model.type !== 'audio' && model.supportedFeatures.includes('chat')
    );
  },

  /**
   * Get models by capability
   */
  getModelsByFeature: (feature: string) => {
    return Object.values(GROQ_MODELS).filter((model: any) =>
      model.supportedFeatures.includes(feature)
    );
  },

  /**
   * Get fastest models
   */
  getFastestModels: () => {
    return Object.values(GROQ_MODELS).filter(
      (model: any) => model.speed === 'fastest' || model.id.includes('instant')
    );
  },

  /**
   * Get most capable models
   */
  getMostCapableModels: () => {
    return Object.values(GROQ_MODELS).filter(
      (model: any) =>
        model.recommended ||
        (model.contextWindow && model.contextWindow >= 100000)
    );
  },

  /**
   * Get reasoning models
   */
  getReasoningModels: () => {
    return Object.values(GROQ_MODELS).filter(
      (model: any) => model.special === 'reasoning'
    );
  },

  /**
   * Get model by ID
   */
  getModelById: (id: string) => {
    return Object.values(GROQ_MODELS).find((model: any) => model.id === id);
  },

  /**
   * Get cost-effective models (lowest pricing)
   */
  getCostEffectiveModels: () => {
    return Object.values(GROQ_MODELS)
      .filter((model: any) => model.pricing && model.type !== 'audio')
      .sort(
        (a: any, b: any) => (a.pricing?.input || 0) - (b.pricing?.input || 0)
      );
  },
};

/**
 * Error handling utilities for Groq API
 */
export const groqErrorHandling = {
  /**
   * Check if error is rate limit related
   */
  isRateLimitError: (error: any): boolean => {
    return error?.status === 429 || error?.code === 'rate_limit_exceeded';
  },

  /**
   * Check if error is API key related
   */
  isAuthError: (error: any): boolean => {
    return error?.status === 401 || error?.code === 'invalid_api_key';
  },

  /**
   * Get retry delay for rate limit errors
   */
  getRetryDelay: (attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
  },
};

/**
 * Export types for TypeScript support
 */
export type GroqModel = keyof typeof GROQ_MODELS;
export type GroqChatParams = typeof GROQ_CHAT_CONFIG.DEFAULT_PARAMS;

/**
 * Pre-configured model instances for common use cases
 */
export const groqModels = {
  // Fast model for real-time chat
  fast: groq(GROQ_MODELS.LLAMA_3_1_8B.id),

  // Balanced model for general use
  balanced: groq(GROQ_MODELS.LLAMA_3_3_70B.id),

  // Creative model for content generation
  creative: groq(GROQ_MODELS.LLAMA_3_1_70B.id),

  // Reasoning model for complex tasks
  reasoning: groq(GROQ_MODELS.QWEN_QWQ_32B.id),

  // Transcription model
  transcription: groq.transcription(GROQ_MODELS.WHISPER_LARGE_V3.id),
} as const;

export default groq;
