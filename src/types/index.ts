/**
 * Types Export Barrel
 *
 * This file exports all TypeScript type definitions used throughout the application.
 * Includes:
 * - Database model types
 * - API request/response types
 * - Component prop types
 * - Utility types
 * - Third-party service types
 */

// Export existing types
export * from './database';
export * from './file-upload';

// TODO: Export additional types when they are created
// export * from './api';
// export * from './chat';
// export * from './user';
// export * from './auth';
// export * from './ai';

/**
 * Common utility types used across the application
 */
export type ID = string;
export type Timestamp = Date | string;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * API Response wrapper types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Chat-related types (to be expanded)
 */
export interface ChatMessage {
  id: ID;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Timestamp;
  metadata?: {
    model?: string;
    tokens?: number;
    [key: string]: any;
  };
}

export interface ChatConversation {
  id: ID;
  userId: ID;
  title?: string;
  messages: ChatMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: {
    model?: string;
    totalTokens?: number;
    [key: string]: any;
  };
}

/**
 * User-related types (to be expanded)
 */
export interface UserProfile {
  id: ID;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: 'free' | 'pro' | 'enterprise';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    defaultModel: string;
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Planned type files:
 *
 * 1. api.ts - API request/response types
 * 2. chat.ts - Chat and messaging types
 * 3. user.ts - User profile and preferences types
 * 4. auth.ts - Authentication and authorization types
 * 5. ai.ts - AI model and service types
 * 6. components.ts - Component prop types
 * 7. forms.ts - Form validation types
 * 8. navigation.ts - Routing and navigation types
 * 9. settings.ts - Application settings types
 * 10. webhooks.ts - Webhook payload types
 */
