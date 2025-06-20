/**
 * Google Generative AI Configuration for ChatGPT Clone
 *
 * This file contains configuration for Google Generative AI provider integration:
 * - Google client setup with API key validation
 * - Available model configurations with metadata
 * - Rate limiting and performance considerations
 * - Error handling and fallback strategies
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Types for Google Generative AI model configuration
 */
export interface GoogleModelConfig {
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
  type: 'chat' | 'embedding';
  recommended?: boolean;
  speed?: 'fastest' | 'fast' | 'medium' | 'slow';
  special?: 'reasoning' | 'thinking';
  // Input modality capabilities
  capabilities?: {
    imageInput: boolean;
    documentInput: boolean;
    audioInput: boolean;
    fileInput: boolean;
  };
}

// Environment validation
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set. Google Generative AI functionality will be limited.'
  );
}

/**
 * Google Generative AI client instance with custom configuration
 * Optimized for reliable inference and performance
 */
export const google = createGoogleGenerativeAI({
  apiKey: GOOGLE_GENERATIVE_AI_API_KEY || 'dummy-key-for-build',
  // Use the correct base URL for better compatibility
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  // Custom headers for tracking and analytics
  headers: {
    'User-Agent': 'ChatGPT-Clone/1.0',
  },
});

/**
 * Available Google Generative AI models with metadata and specifications
 * Based on latest Google Generative AI model offerings as of 2025
 */
export const GOOGLE_MODELS = {
  // Note: Gemini 2.5 Pro Preview requires paid billing account
  // GEMINI_2_5_PRO_PREVIEW: {
  //   id: 'models/gemini-2.5-pro-preview-05-06',
  //   name: 'Gemini 2.5 Pro (Preview)',
  //   description:
  //     'Most capable Gemini model with advanced reasoning and multimodal capabilities (Requires paid billing)',
  //   contextWindow: 2097152, // 2M tokens
  //   maxOutputTokens: 8192,
  //   supportedFeatures: [
  //     'chat',
  //     'function-calling',
  //     'json-mode',
  //     'vision',
  //     'reasoning',
  //   ] as const,
  //   pricing: {
  //     input: 1.25, // per 1M tokens
  //     output: 5.0, // per 1M tokens
  //   },
  //   recommended: true,
  //   type: 'chat' as const,
  //   speed: 'medium' as const,
  //   special: 'reasoning' as const,
  //   capabilities: {
  //     imageInput: true,
  //     documentInput: true,
  //     audioInput: false,
  //     fileInput: true,
  //   },
  // },

  GEMINI_2_5_FLASH_PREVIEW: {
    id: 'models/gemini-2.5-flash-preview-04-17',
    name: 'Gemini 2.5 Flash (Preview)',
    description: 'Fast and efficient model with thinking capabilities',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    supportedFeatures: [
      'chat',
      'function-calling',
      'json-mode',
      'vision',
      'thinking',
    ] as const,
    pricing: {
      input: 0.075, // per 1M tokens
      output: 0.3, // per 1M tokens
    },
    speed: 'fast' as const,
    type: 'chat' as const,
    special: 'thinking' as const,
    capabilities: {
      imageInput: true,
      documentInput: true,
      audioInput: false,
      fileInput: true,
    },
  },

  // Gemini 2.0 Models
  GEMINI_2_0_FLASH_EXP: {
    id: 'models/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    description:
      'Latest experimental model with image generation and advanced capabilities',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    supportedFeatures: [
      'chat',
      'function-calling',
      'json-mode',
      'vision',
      'image-generation',
      'search-grounding',
    ] as const,
    pricing: {
      input: 0.075, // per 1M tokens
      output: 0.3, // per 1M tokens
    },
    speed: 'fast' as const,
    type: 'chat' as const,
    capabilities: {
      imageInput: true,
      documentInput: true,
      audioInput: false,
      fileInput: true,
    },
  },

  // Gemini 1.5 Models - Stable and reliable
  GEMINI_1_5_PRO: {
    id: 'models/gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro',
    description: 'Highly capable model for complex reasoning and analysis',
    contextWindow: 2097152, // 2M tokens
    maxOutputTokens: 8192,
    supportedFeatures: [
      'chat',
      'function-calling',
      'json-mode',
      'vision',
    ] as const,
    pricing: {
      input: 1.25, // per 1M tokens
      output: 5.0, // per 1M tokens
    },
    type: 'chat' as const,
    speed: 'medium' as const,
    capabilities: {
      imageInput: true,
      documentInput: true,
      audioInput: false,
      fileInput: true,
    },
  },

  GEMINI_1_5_FLASH: {
    id: 'models/gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and efficient model for most chat applications',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    supportedFeatures: [
      'chat',
      'function-calling',
      'json-mode',
      'vision',
    ] as const,
    pricing: {
      input: 0.075, // per 1M tokens
      output: 0.3, // per 1M tokens
    },
    speed: 'fast' as const,
    type: 'chat' as const,
    recommended: true,
    capabilities: {
      imageInput: true,
      documentInput: true,
      audioInput: false,
      fileInput: true,
    },
  },

  GEMINI_1_5_FLASH_8B: {
    id: 'models/gemini-1.5-flash-8b-latest',
    name: 'Gemini 1.5 Flash 8B',
    description: 'Lightweight and fast model for real-time applications',
    contextWindow: 1048576, // 1M tokens
    maxOutputTokens: 8192,
    supportedFeatures: ['chat', 'function-calling', 'json-mode'] as const,
    pricing: {
      input: 0.0375, // per 1M tokens
      output: 0.15, // per 1M tokens
    },
    speed: 'fastest' as const,
    type: 'chat' as const,
    capabilities: {
      imageInput: false,
      documentInput: false,
      audioInput: false,
      fileInput: false,
    },
  },

  // Base Gemini Models
  GEMINI_1_0_PRO: {
    id: 'models/gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    description: 'Stable base model for general applications',
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportedFeatures: ['chat', 'function-calling', 'json-mode'] as const,
    pricing: {
      input: 0.5, // per 1M tokens
      output: 1.5, // per 1M tokens
    },
    type: 'chat' as const,
    speed: 'medium' as const,
    capabilities: {
      imageInput: false,
      documentInput: false,
      audioInput: false,
      fileInput: false,
    },
  },
} as const;

/**
 * Default model configuration
 */
export const DEFAULT_GOOGLE_MODEL = GOOGLE_MODELS.GEMINI_1_5_FLASH;

/**
 * Error handling configuration for Google Generative AI
 */
export const googleErrorHandling = {
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
    'TIMEOUT',
  ],
  nonRetryableErrors: [
    'INVALID_API_KEY',
    'INSUFFICIENT_QUOTA',
    'CONTENT_FILTER',
    'INVALID_REQUEST',
  ],
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  backoffMultiplier: 2,
};

/**
 * Chat configuration optimized for Google Generative AI
 */
export const GOOGLE_CHAT_CONFIG = {
  // Default parameters optimized for Google Generative AI models
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

  // Reasoning parameters for thinking models
  REASONING_PARAMS: {
    temperature: 0.1,
    maxTokens: 8192,
    topP: 0.8,
    stream: true,
  },

  // Thinking parameters for models that support thinkingConfig
  THINKING_PARAMS: {
    temperature: 0.1,
    maxTokens: 8192,
    topP: 0.8,
    stream: true,
    // Google-specific thinking configuration
    thinkingConfig: {
      thinkingBudget: 2048,
    },
  },

  // Image generation parameters
  IMAGE_GENERATION_PARAMS: {
    temperature: 0.8,
    maxTokens: 2048,
    topP: 0.9,
    stream: true,
    // Enable image output modality
    responseModalities: ['TEXT', 'IMAGE'],
  },
} as const;

/**
 * Model selection helpers
 */
export const googleModelHelpers = {
  /**
   * Get all available chat models
   */
  getChatModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) =>
        model.type === 'chat' && model.supportedFeatures.includes('chat')
    );
  },

  /**
   * Get models by capability
   */
  getModelsByFeature: (feature: string) => {
    return Object.values(GOOGLE_MODELS).filter((model: any) =>
      model.supportedFeatures.includes(feature)
    );
  },

  /**
   * Get fastest models
   */
  getFastestModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) => model.speed === 'fastest' || model.speed === 'fast'
    );
  },

  /**
   * Get most capable models
   */
  getMostCapableModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) =>
        model.recommended ||
        (model.contextWindow && model.contextWindow >= 1000000)
    );
  },

  /**
   * Get thinking/reasoning models
   */
  getThinkingModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) => model.special === 'thinking'
    );
  },

  /**
   * Get reasoning models (advanced but no thinkingConfig)
   */
  getReasoningModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) => model.special === 'reasoning'
    );
  },

  /**
   * Get vision-capable models
   */
  getVisionModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) => model.capabilities?.imageInput === true
    );
  },

  /**
   * Get file-processing models
   */
  getFileProcessingModels: () => {
    return Object.values(GOOGLE_MODELS).filter(
      (model: any) => model.capabilities?.fileInput === true
    );
  },

  /**
   * Get model by ID
   */
  getModelById: (id: string) => {
    return Object.values(GOOGLE_MODELS).find((model: any) => model.id === id);
  },

  /**
   * Get cost-effective models (lowest pricing)
   */
  getCostEffectiveModels: () => {
    return Object.values(GOOGLE_MODELS)
      .filter((model: any) => model.pricing && model.type === 'chat')
      .sort(
        (a: any, b: any) => (a.pricing?.input || 0) - (b.pricing?.input || 0)
      );
  },
};

/**
 * Export utility types
 */
export type GoogleModel = keyof typeof GOOGLE_MODELS;
export type GoogleChatParams = typeof GOOGLE_CHAT_CONFIG.DEFAULT_PARAMS;

/**
 * Pre-configured model instances for common use cases
 */
export const googleModels = {
  // Fast model for real-time chat
  fast: google(GOOGLE_MODELS.GEMINI_1_5_FLASH_8B.id),

  // Balanced model for general use
  balanced: google(GOOGLE_MODELS.GEMINI_1_5_FLASH.id),

  // Creative model for content generation
  creative: google(GOOGLE_MODELS.GEMINI_1_5_PRO.id),

  // Thinking model for complex reasoning
  thinking: google(GOOGLE_MODELS.GEMINI_2_5_FLASH_PREVIEW.id),

  // Vision model for image analysis
  vision: google(GOOGLE_MODELS.GEMINI_1_5_PRO.id),

  // Experimental model with image generation
  experimental: google(GOOGLE_MODELS.GEMINI_2_0_FLASH_EXP.id),
} as const;
