/**
 * AI SDK Configuration for ChatGPT Clone
 *
 * This file contains configuration constants and setup for AI functionality:
 * - ai: Vercel AI SDK React hooks and utilities for streaming chat responses
 * - groq: Fast inference with Groq LPU Inference Engine
 * - openai: Official OpenAI client library for direct API interactions (fallback)
 */

import { createOpenAI } from '@ai-sdk/openai';

import { DEFAULT_GROQ_MODEL, groq, GROQ_CHAT_CONFIG } from './groq-config';

// Environment validation
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn(
    'GROQ_API_KEY environment variable is not set. GROQ functionality will be limited.'
  );
}

// Create OpenAI client with fallback for missing key
const openai = createOpenAI({
  apiKey: GROQ_API_KEY || 'dummy-key-for-build',
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
 * Default model configuration - Using Groq for fast inference
 */
export const DEFAULT_MODEL = DEFAULT_GROQ_MODEL.id;

/**
 * AI SDK model configurations with optimized settings
 * Now using Groq as the primary provider for fast inference
 */
export const aiConfig = {
  // Primary model for chat completions - Groq for speed
  defaultModel: groq(DEFAULT_MODEL),

  // Alternative models for different use cases
  models: {
    // Groq models (fast inference)
    fast: groq('llama-3.1-8b-instant'),
    balanced: groq('llama-3.3-70b-versatile'),
    creative: groq('llama-3.1-70b-versatile'),
    reasoning: groq('qwen-qwq-32b'),

    // OpenAI models (fallback)
    openai_creative: openai(AI_MODELS.GPT_4O),
    openai_precise: openai(AI_MODELS.GPT_4O_MINI),
    openai_fast: openai(AI_MODELS.GPT_3_5_TURBO),
  },
};

/**
 * Chat configuration constants
 * Optimized for Groq's fast inference capabilities
 */
export const CHAT_CONFIG = {
  // Maximum number of messages to keep in context
  MAX_MESSAGES: 30, // Increased for Groq's larger context windows

  // Maximum length for user input
  MAX_INPUT_LENGTH: 8000, // Increased for better context utilization

  // Default system message
  SYSTEM_MESSAGE: `You are a helpful AI assistant powered by Groq's ultra-fast inference. You provide clear, accurate, and helpful responses while being conversational and engaging. You can process complex requests quickly and efficiently.`,

  // Model parameters for different use cases - optimized for Groq
  MODEL_PARAMS: {
    // Default parameters for balanced responses (Groq optimized)
    default: GROQ_CHAT_CONFIG.DEFAULT_PARAMS,

    // Creative parameters for more diverse responses
    creative: GROQ_CHAT_CONFIG.CREATIVE_PARAMS,

    // Precise parameters for focused responses
    precise: {
      temperature: 0.3,
      maxTokens: 1500,
      topP: 0.8,
      stream: true,
    },

    // Fast parameters for quick responses
    fast: GROQ_CHAT_CONFIG.FAST_PARAMS,

    // Reasoning parameters for complex thinking
    reasoning: GROQ_CHAT_CONFIG.REASONING_PARAMS,
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
