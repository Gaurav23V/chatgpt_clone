/**
 * AI Models Configuration
 *
 * This file defines available AI models from different providers with comprehensive metadata:
 * - Model specifications (context windows, capabilities, pricing)
 * - UI-friendly descriptions and categorization
 * - Selection helpers and filtering utilities
 * - Provider-specific configurations
 */

import { GROQ_MODELS } from './groq-config';

/**
 * Unified model interface for all providers
 */
export interface AIModel {
  id: string;
  name: string;
  provider: 'groq' | 'openai' | 'anthropic';
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportedFeatures: string[];
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  category: 'fast' | 'balanced' | 'creative' | 'reasoning' | 'audio' | 'vision';
  recommended?: boolean;
  speed?: 'fastest' | 'fast' | 'medium' | 'slow';
  quality?: 'basic' | 'good' | 'excellent' | 'best';
  specialFeatures?: string[];
}

/**
 * Convert Groq model configs to unified format
 */
function groqToUnified(groqModel: any, key: string): AIModel {
  return {
    id: groqModel.id,
    name: groqModel.name,
    provider: 'groq',
    description: groqModel.description,
    contextWindow: groqModel.contextWindow || 0,
    maxOutputTokens: groqModel.maxOutputTokens || 0,
    supportedFeatures: [...groqModel.supportedFeatures],
    pricing: groqModel.pricing || { input: 0, output: 0 },
    category:
      groqModel.type === 'audio'
        ? 'audio'
        : groqModel.special === 'reasoning'
          ? 'reasoning'
          : groqModel.speed === 'fastest'
            ? 'fast'
            : groqModel.recommended
              ? 'balanced'
              : 'fast',
    recommended: groqModel.recommended,
    speed: groqModel.speed as AIModel['speed'],
    quality:
      groqModel.contextWindow >= 100000
        ? 'excellent'
        : groqModel.recommended
          ? 'good'
          : 'basic',
    specialFeatures: groqModel.special ? [groqModel.special] : undefined,
  };
}

/**
 * All available AI models from all providers
 */
export const ALL_MODELS: AIModel[] = [
  // Groq Models
  ...Object.entries(GROQ_MODELS).map(([key, model]) =>
    groqToUnified(model, key)
  ),
];

/**
 * Categorized models for easy selection
 */
export const MODELS_BY_CATEGORY = {
  // Fast models optimized for speed
  fast: ALL_MODELS.filter(
    (model) => model.category === 'fast' || model.speed === 'fastest'
  ),

  // Balanced models for general use
  balanced: ALL_MODELS.filter(
    (model) => model.category === 'balanced' || model.recommended
  ),

  // Creative models for content generation
  creative: ALL_MODELS.filter(
    (model) => model.category === 'creative' || model.contextWindow >= 32000
  ),

  // Reasoning models for complex problem solving
  reasoning: ALL_MODELS.filter(
    (model) =>
      model.category === 'reasoning' ||
      model.specialFeatures?.includes('reasoning')
  ),

  // Audio processing models
  audio: ALL_MODELS.filter((model) => model.category === 'audio'),

  // Vision models (when available)
  vision: ALL_MODELS.filter(
    (model) =>
      model.category === 'vision' || model.supportedFeatures.includes('vision')
  ),
} as const;

/**
 * Recommended models for different use cases
 */
export const RECOMMENDED_MODELS = {
  // Best overall performance/cost ratio
  default: ALL_MODELS.find((m) => m.id === 'llama-3.1-8b-instant')!,

  // Fastest response times
  realtime: ALL_MODELS.find((m) => m.id === 'llama-3.1-8b-instant')!,

  // Best for complex reasoning
  reasoning: ALL_MODELS.find((m) => m.id === 'qwen-qwq-32b')!,

  // Best for creative writing
  creative: ALL_MODELS.find((m) => m.id === 'llama-3.3-70b-versatile')!,

  // Most cost-effective
  budget: ALL_MODELS.find((m) => m.id === 'llama-3.1-8b-instant')!,

  // Highest quality
  premium: ALL_MODELS.find((m) => m.id === 'llama-3.3-70b-versatile')!,

  // Audio transcription
  transcription: ALL_MODELS.find((m) => m.id === 'whisper-large-v3')!,
} as const;

/**
 * Model selection utilities
 */
export const modelHelpers = {
  /**
   * Get models by provider
   */
  getByProvider: (provider: AIModel['provider']) => {
    return ALL_MODELS.filter((model) => model.provider === provider);
  },

  /**
   * Get models by feature
   */
  getByFeature: (feature: string) => {
    return ALL_MODELS.filter((model) =>
      model.supportedFeatures.includes(feature)
    );
  },

  /**
   * Get models by context window size
   */
  getByContextWindow: (minTokens: number) => {
    return ALL_MODELS.filter((model) => model.contextWindow >= minTokens).sort(
      (a, b) => b.contextWindow - a.contextWindow
    );
  },

  /**
   * Get models by pricing (cheapest first)
   */
  getByCost: (sortBy: 'input' | 'output' = 'input') => {
    return ALL_MODELS.filter((model) => model.pricing.input > 0).sort(
      (a, b) => a.pricing[sortBy] - b.pricing[sortBy]
    );
  },

  /**
   * Get models by speed
   */
  getBySpeed: (speed: AIModel['speed']) => {
    return ALL_MODELS.filter((model) => model.speed === speed);
  },

  /**
   * Get models supporting function calling
   */
  getFunctionCallingModels: () => {
    return ALL_MODELS.filter(
      (model) =>
        model.supportedFeatures.includes('function-calling') ||
        model.supportedFeatures.includes('tool-calling')
    );
  },

  /**
   * Get models supporting JSON mode
   */
  getJSONModeModels: () => {
    return ALL_MODELS.filter((model) =>
      model.supportedFeatures.includes('json-mode')
    );
  },

  /**
   * Find best model for specific requirements
   */
  findBestModel: (requirements: {
    maxCost?: number; // per 1M tokens
    minContextWindow?: number;
    features?: string[];
    category?: AIModel['category'];
    provider?: AIModel['provider'];
  }) => {
    let candidates = ALL_MODELS;

    if (requirements.provider) {
      candidates = candidates.filter(
        (m) => m.provider === requirements.provider
      );
    }

    if (requirements.maxCost) {
      candidates = candidates.filter(
        (m) => m.pricing.input <= requirements.maxCost!
      );
    }

    if (requirements.minContextWindow) {
      candidates = candidates.filter(
        (m) => m.contextWindow >= requirements.minContextWindow!
      );
    }

    if (requirements.features) {
      candidates = candidates.filter((m) =>
        requirements.features!.every((f) => m.supportedFeatures.includes(f))
      );
    }

    if (requirements.category) {
      candidates = candidates.filter(
        (m) => m.category === requirements.category
      );
    }

    // Sort by quality and cost effectiveness
    return candidates.sort((a, b) => {
      const aScore =
        (a.quality === 'excellent' ? 3 : a.quality === 'good' ? 2 : 1) /
        a.pricing.input;
      const bScore =
        (b.quality === 'excellent' ? 3 : b.quality === 'good' ? 2 : 1) /
        b.pricing.input;
      return bScore - aScore;
    });
  },

  /**
   * Get model by ID
   */
  getById: (id: string) => {
    return ALL_MODELS.find((model) => model.id === id);
  },

  /**
   * Get model display info for UI
   */
  getDisplayInfo: (model: AIModel) => ({
    name: model.name,
    provider: model.provider.toUpperCase(),
    category: model.category.charAt(0).toUpperCase() + model.category.slice(1),
    contextSize:
      model.contextWindow > 1000
        ? `${Math.round(model.contextWindow / 1000)}K`
        : `${model.contextWindow}`,
    pricing:
      model.pricing.input > 0
        ? `$${model.pricing.input.toFixed(2)}/1M`
        : 'Free',
    speed: model.speed || 'medium',
    quality: model.quality || 'good',
    badge: model.recommended
      ? 'Recommended'
      : model.speed === 'fastest'
        ? 'Fastest'
        : model.specialFeatures?.includes('reasoning')
          ? 'Reasoning'
          : undefined,
  }),
};

/**
 * UI-friendly model groups for selection interfaces
 */
export const UI_MODEL_GROUPS = [
  {
    title: 'Recommended',
    description: 'Best models for most use cases',
    models: ALL_MODELS.filter((m) => m.recommended),
  },
  {
    title: 'Fastest',
    description: 'Optimized for real-time applications',
    models: MODELS_BY_CATEGORY.fast,
  },
  {
    title: 'Most Capable',
    description: 'Highest quality responses',
    models: ALL_MODELS.filter((m) => m.quality === 'excellent'),
  },
  {
    title: 'Reasoning',
    description: 'Advanced problem-solving capabilities',
    models: MODELS_BY_CATEGORY.reasoning,
  },
  {
    title: 'Audio',
    description: 'Speech recognition and processing',
    models: MODELS_BY_CATEGORY.audio,
  },
  {
    title: 'Budget-Friendly',
    description: 'Cost-effective options',
    models: modelHelpers.getByCost('input').slice(0, 3),
  },
] as const;

/**
 * Model comparison utilities
 */
export const modelComparison = {
  /**
   * Compare two models
   */
  compare: (model1: AIModel, model2: AIModel) => ({
    contextWindow: {
      winner: model1.contextWindow > model2.contextWindow ? model1 : model2,
      difference: Math.abs(model1.contextWindow - model2.contextWindow),
    },
    cost: {
      winner: model1.pricing.input < model2.pricing.input ? model1 : model2,
      difference: Math.abs(model1.pricing.input - model2.pricing.input),
    },
    features: {
      model1Only: model1.supportedFeatures.filter(
        (f) => !model2.supportedFeatures.includes(f)
      ),
      model2Only: model2.supportedFeatures.filter(
        (f) => !model1.supportedFeatures.includes(f)
      ),
      common: model1.supportedFeatures.filter((f) =>
        model2.supportedFeatures.includes(f)
      ),
    },
  }),

  /**
   * Get model alternatives
   */
  getAlternatives: (modelId: string, count = 3) => {
    const model = modelHelpers.getById(modelId);
    if (!model) return [];

    return ALL_MODELS.filter(
      (m) => m.id !== modelId && m.category === model.category
    )
      .sort((a, b) => {
        // Sort by similarity (context window and pricing)
        const aDiff =
          Math.abs(a.contextWindow - model.contextWindow) +
          Math.abs(a.pricing.input - model.pricing.input) * 10000;
        const bDiff =
          Math.abs(b.contextWindow - model.contextWindow) +
          Math.abs(b.pricing.input - model.pricing.input) * 10000;
        return aDiff - bDiff;
      })
      .slice(0, count);
  },
};

/**
 * Default exports for common usage
 */
export const defaultModel = RECOMMENDED_MODELS.default;
export const fastestModel = RECOMMENDED_MODELS.realtime;
export const bestModel = RECOMMENDED_MODELS.premium;

/**
 * Export types
 */
export type ModelCategory = keyof typeof MODELS_BY_CATEGORY;
export type ModelProvider = AIModel['provider'];
export type ModelSpeed = AIModel['speed'];
export type ModelQuality = AIModel['quality'];

/**
 * Context window size constants for easy reference
 */
export const CONTEXT_SIZES = {
  SMALL: 8192, // 8K tokens
  MEDIUM: 32768, // 32K tokens
  LARGE: 131072, // 128K tokens
  EXTRA_LARGE: 200000, // 200K+ tokens
} as const;
