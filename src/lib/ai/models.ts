/**
 * AI Models Configuration
 *
 * This file defines available AI models from different providers with comprehensive metadata:
 * - Model specifications (context windows, capabilities, pricing)
 * - UI-friendly descriptions and categorization
 * - Selection helpers and filtering utilities
 * - Provider-specific configurations
 */

import { GOOGLE_MODELS } from './google-config';

/**
 * Unified model interface for all providers
 */
export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportedFeatures: string[];
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  category:
    | 'fast'
    | 'balanced'
    | 'creative'
    | 'thinking'
    | 'vision'
    | 'experimental';
  recommended?: boolean;
  speed?: 'fastest' | 'fast' | 'medium' | 'slow';
  quality?: 'basic' | 'good' | 'excellent' | 'best';
  specialFeatures?: string[];
  capabilities?: {
    imageInput: boolean;
    documentInput: boolean;
    audioInput: boolean;
    fileInput: boolean;
  };
}

/**
 * Convert Google Generative AI model configs to unified format
 */
function googleToUnified(googleModel: any, key: string): AIModel {
  return {
    id: googleModel.id,
    name: googleModel.name,
    provider: 'google',
    description: googleModel.description,
    contextWindow: googleModel.contextWindow || 0,
    maxOutputTokens: googleModel.maxOutputTokens || 0,
    supportedFeatures: [...googleModel.supportedFeatures],
    pricing: googleModel.pricing || { input: 0, output: 0 },
    category:
      googleModel.special === 'thinking'
        ? 'thinking'
        : googleModel.supportedFeatures.includes('vision')
          ? 'vision'
          : googleModel.supportedFeatures.includes('image-generation')
            ? 'experimental'
            : googleModel.speed === 'fastest'
              ? 'fast'
              : googleModel.recommended
                ? 'balanced'
                : 'creative',
    recommended: googleModel.recommended,
    speed: googleModel.speed as AIModel['speed'],
    quality:
      googleModel.contextWindow >= 1000000
        ? 'excellent'
        : googleModel.recommended
          ? 'good'
          : 'basic',
    specialFeatures: googleModel.special ? [googleModel.special] : undefined,
    capabilities: googleModel.capabilities || {
      imageInput: false,
      documentInput: false,
      audioInput: false,
      fileInput: false,
    },
  };
}

/**
 * All available AI models from all providers
 */
export const ALL_MODELS: AIModel[] = [
  // Google Generative AI Models
  ...Object.entries(GOOGLE_MODELS).map(([key, model]) =>
    googleToUnified(model, key)
  ),
];

/**
 * Model selection helpers
 */
export const modelHelpers = {
  /**
   * Get models by provider
   */
  getModelsByProvider: (provider: 'google' | 'openai' | 'anthropic') => {
    return ALL_MODELS.filter((model) => model.provider === provider);
  },

  /**
   * Get models by category
   */
  getModelsByCategory: (category: AIModel['category']) => {
    return ALL_MODELS.filter((model) => model.category === category);
  },

  /**
   * Get models by feature
   */
  getModelsByFeature: (feature: string) => {
    return ALL_MODELS.filter((model) =>
      model.supportedFeatures.includes(feature)
    );
  },

  /**
   * Get fastest models
   */
  getFastestModels: () => {
    return ALL_MODELS.filter(
      (model) => model.speed === 'fastest' || model.speed === 'fast'
    );
  },

  /**
   * Get models with vision capabilities
   */
  getVisionModels: () => {
    return ALL_MODELS.filter(
      (model) => model.capabilities?.imageInput === true
    );
  },

  /**
   * Get thinking/reasoning models
   */
  getThinkingModels: () => {
    return ALL_MODELS.filter(
      (model) =>
        model.category === 'thinking' ||
        model.specialFeatures?.includes('thinking')
    );
  },

  /**
   * Get recommended models
   */
  getRecommendedModels: () => {
    return ALL_MODELS.filter((model) => model.recommended);
  },

  /**
   * Get cost-effective models
   */
  getCostEffectiveModels: () => {
    return ALL_MODELS.sort((a, b) => a.pricing.input - b.pricing.input);
  },

  /**
   * Get model by ID
   */
  getModelById: (id: string) => {
    return ALL_MODELS.find((model) => model.id === id);
  },

  /**
   * Get models suitable for different use cases
   */
  getModelsForUseCase: (
    useCase: 'chat' | 'vision' | 'reasoning' | 'creative' | 'fast'
  ) => {
    switch (useCase) {
      case 'chat':
        return ALL_MODELS.filter(
          (model) =>
            model.supportedFeatures.includes('chat') &&
            model.category === 'balanced'
        );
      case 'vision':
        return ALL_MODELS.filter(
          (model) => model.capabilities?.imageInput === true
        );
      case 'reasoning':
        return ALL_MODELS.filter(
          (model) =>
            model.category === 'thinking' ||
            model.specialFeatures?.includes('thinking')
        );
      case 'creative':
        return ALL_MODELS.filter(
          (model) =>
            model.category === 'creative' ||
            model.supportedFeatures.includes('image-generation')
        );
      case 'fast':
        return ALL_MODELS.filter(
          (model) => model.speed === 'fastest' || model.category === 'fast'
        );
      default:
        return ALL_MODELS;
    }
  },
};

/**
 * Model categories for UI display
 */
export const MODEL_CATEGORIES = {
  FAST: {
    id: 'fast',
    name: 'Fast',
    description: 'Optimized for speed and real-time applications',
    icon: '⚡',
  },
  BALANCED: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance of speed, quality, and cost',
    icon: '⚖️',
  },
  CREATIVE: {
    id: 'creative',
    name: 'Creative',
    description: 'Best for creative writing and content generation',
    icon: '🎨',
  },
  THINKING: {
    id: 'thinking',
    name: 'Thinking',
    description: 'Advanced reasoning and complex problem solving',
    icon: '🧠',
  },
  VISION: {
    id: 'vision',
    name: 'Vision',
    description: 'Image analysis and multimodal capabilities',
    icon: '👁️',
  },
  EXPERIMENTAL: {
    id: 'experimental',
    name: 'Experimental',
    description: 'Latest features like image generation',
    icon: '🧪',
  },
} as const;

/**
 * Default model recommendations for different scenarios
 */
export const DEFAULT_MODELS = {
  // General chat - balanced performance
  GENERAL: 'gemini-1.5-flash-latest',

  // Fast responses - lowest latency
  FAST: 'gemini-1.5-flash-8b-latest',

  // Complex reasoning - best capability
  REASONING: 'gemini-2.5-flash-preview-04-17',

  // Creative tasks - high quality output
  CREATIVE: 'gemini-1.5-pro-latest',

  // Vision tasks - image analysis
  VISION: 'gemini-1.5-pro-latest',

  // Experimental features
  EXPERIMENTAL: 'gemini-2.0-flash-exp',
} as const;

/**
 * Default model for new conversations
 */
export const defaultModel = {
  id: DEFAULT_MODELS.GENERAL,
  name: 'Gemini 1.5 Flash',
  description: 'Fast and capable model for general chat',
};

/**
 * UI Model Groups for the ModelSelector component
 * Organizes models by category for display in the UI
 */
export const UI_MODEL_GROUPS = [
  {
    title: 'Fast',
    models: modelHelpers.getModelsByCategory('fast').map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
    })),
  },
  {
    title: 'Balanced',
    models: modelHelpers.getModelsByCategory('balanced').map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
    })),
  },
  {
    title: 'Thinking',
    models: modelHelpers.getModelsByCategory('thinking').map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
    })),
  },
  {
    title: 'Vision',
    models: modelHelpers.getModelsByCategory('vision').map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
    })),
  },
  {
    title: 'Creative',
    models: modelHelpers.getModelsByCategory('creative').map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
    })),
  },
  {
    title: 'Experimental',
    models: modelHelpers.getModelsByCategory('experimental').map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
    })),
  },
].filter((group) => group.models.length > 0); // Only include groups that have models
