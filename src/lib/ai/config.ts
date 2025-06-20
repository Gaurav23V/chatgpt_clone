/**
 * AI SDK Configuration for ChatGPT Clone
 *
 * This file contains configuration constants and setup for AI functionality:
 * - ai: Vercel AI SDK React hooks and utilities for streaming chat responses
 * - google: Google Generative AI for fast and reliable inference
 * - openai: Official OpenAI client library for direct API interactions (fallback)
 */

import { createOpenAI } from '@ai-sdk/openai';

import {
  DEFAULT_GOOGLE_MODEL,
  google,
  GOOGLE_CHAT_CONFIG,
} from './google-config';

// Environment validation
const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GOOGLE_GENERATIVE_AI_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set. Google Generative AI functionality will be limited.'
  );
}

// Create OpenAI client with fallback for missing key
const openai = createOpenAI({
  apiKey: OPENAI_API_KEY || 'dummy-key-for-build',
});

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
 * Default model configuration - Using Google Generative AI for reliable inference
 */
export const DEFAULT_MODEL = DEFAULT_GOOGLE_MODEL.id;

/**
 * AI SDK model configurations with optimized settings
 * Now using Google Generative AI as the primary provider for reliable inference
 */
export const aiConfig = {
  // Primary model for chat completions - Google Generative AI for reliability
  defaultModel: google(DEFAULT_MODEL),

  // Alternative models for different use cases
  models: {
    // Google Generative AI models (reliable inference)
    fast: google('gemini-1.5-flash-8b-latest'),
    balanced: google('gemini-1.5-flash-latest'),
    creative: google('gemini-1.5-pro-latest'),
    thinking: google('gemini-2.5-flash-preview-04-17'),

    // OpenAI models (fallback)
    openai_creative: openai(AI_MODELS.GPT_4O),
    openai_precise: openai(AI_MODELS.GPT_4O_MINI),
    openai_fast: openai(AI_MODELS.GPT_3_5_TURBO),
  },
};

/**
 * Chat configuration constants
 * Optimized for Google Generative AI's advanced capabilities
 */
export const CHAT_CONFIG = {
  // Maximum number of messages to keep in context
  MAX_MESSAGES: 50, // Increased for Google Generative AI's large context windows

  // Maximum length for user input
  MAX_INPUT_LENGTH: 10000, // Increased for better context utilization

  // Default system message
  SYSTEM_MESSAGE: `You are a helpful AI assistant powered by Google Generative AI. You provide clear, accurate, and helpful responses while being conversational and engaging. You can process complex requests, analyze images, and work with various file formats efficiently.`,

  // Model parameters for different use cases - optimized for Google Generative AI
  MODEL_PARAMS: {
    // Default parameters for balanced responses (Google Generative AI optimized)
    default: GOOGLE_CHAT_CONFIG.DEFAULT_PARAMS,

    // Creative parameters for more diverse responses
    creative: GOOGLE_CHAT_CONFIG.CREATIVE_PARAMS,

    // Precise parameters for focused responses
    precise: {
      temperature: 0.3,
      maxTokens: 1500,
      topP: 0.8,
      stream: true,
    },

    // Fast parameters for quick responses
    fast: GOOGLE_CHAT_CONFIG.FAST_PARAMS,

    // Reasoning parameters for complex thinking
    reasoning: GOOGLE_CHAT_CONFIG.REASONING_PARAMS,

    // Vision parameters for image analysis
    vision: {
      temperature: 0.4,
      maxTokens: 2048,
      topP: 0.8,
      stream: true,
    },

    // Image generation parameters
    imageGeneration: GOOGLE_CHAT_CONFIG.IMAGE_GENERATION_PARAMS,
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
  MAX_TOKENS_PER_REQUEST: 8000, // Increased for Google Generative AI capabilities
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
