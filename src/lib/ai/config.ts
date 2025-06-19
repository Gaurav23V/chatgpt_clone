/**
 * AI SDK Configuration for ChatGPT Clone
 *
 * This file contains configuration constants and setup for AI functionality:
 * - ai: Vercel AI SDK React hooks and utilities for streaming chat responses
 * - openai: Official OpenAI client library for direct API interactions
 */

import { openai } from '@ai-sdk/openai';

// Environment validation
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY && process.env.NODE_ENV !== 'development') {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

/**
 * Available AI models configuration
 * Each model has different capabilities, pricing, and response times
 */
export const AI_MODELS = {
  // GPT-3.5 Turbo - Fast and cost-effective for most chat use cases
  GPT_3_5_TURBO: 'gpt-3.5-turbo',

  // GPT-4 Models - More capable but slower and more expensive
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',

  // Latest GPT-4 variants
  GPT_4_LATEST: 'gpt-4-turbo-preview',
} as const;

/**
 * Default model configuration
 */
export const DEFAULT_MODEL = AI_MODELS.GPT_4O_MINI;

/**
 * AI SDK model configurations with optimized settings
 */
export const aiConfig = {
  // Primary model for chat completions
  defaultModel: openai(DEFAULT_MODEL),

  // Alternative models for different use cases
  models: {
    creative: openai(AI_MODELS.GPT_4O),
    precise: openai(AI_MODELS.GPT_4O_MINI),
    fast: openai(AI_MODELS.GPT_3_5_TURBO),
  },
};

/**
 * Chat configuration constants
 */
export const CHAT_CONFIG = {
  // Maximum number of messages to keep in context
  MAX_MESSAGES: 20,

  // Maximum length for user input
  MAX_INPUT_LENGTH: 4000,

  // Default system message
  SYSTEM_MESSAGE: `You are a helpful AI assistant. You provide clear, accurate, and helpful responses while being conversational and engaging.`,

  // Model parameters for different use cases
  MODEL_PARAMS: {
    // Default parameters for balanced responses
    default: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },

    // Creative parameters for more diverse responses
    creative: {
      temperature: 0.9,
      maxTokens: 1500,
      topP: 0.95,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
    },

    // Precise parameters for focused responses
    precise: {
      temperature: 0.3,
      maxTokens: 800,
      topP: 0.8,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
    },

    // Fast parameters for quick responses
    fast: {
      temperature: 0.7,
      maxTokens: 500,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
    },
  },

  // Streaming configuration
  STREAM_CONFIG: {
    // Enable streaming responses
    stream: true,

    // Callback options for handling streaming data
    onFinish: (message: any) => {
      console.log('Chat completion finished:', message);
    },

    onError: (error: any) => {
      console.error('Chat completion error:', error);
    },
  },
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Requests per minute per user
  RPM: 60,

  // Requests per day per user
  RPD: 1000,

  // Token limit per request
  MAX_TOKENS_PER_REQUEST: 4000,
} as const;

/**
 * Export types for TypeScript support
 */
export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
export type ChatRole = 'system' | 'user' | 'assistant';

/**
 * Message interface for chat functionality
 */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  stream?: boolean;
}
