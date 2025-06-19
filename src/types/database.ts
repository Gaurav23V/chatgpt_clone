/**
 * Database Type Definitions for ChatGPT Clone
 *
 * This file contains TypeScript interfaces for all database schemas.
 * These types ensure type safety across the application and provide
 * clear documentation of the data structure.
 */

import type { Types } from 'mongoose';

/**
 * Base interface for all database documents
 * Includes common fields that all documents should have
 */
export interface BaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Document Interface
 * Syncs with Clerk authentication and stores additional user data
 */
export interface IUser extends BaseDocument {
  // Clerk Integration
  clerkId: string; // Primary key from Clerk (unique identifier)
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  username?: string;

  // User Preferences
  preferences: {
    aiModel: string; // Default AI model preference
    theme: 'light' | 'dark' | 'system';
    language: string; // User's preferred language
    fontSize: 'small' | 'medium' | 'large';
    soundEnabled: boolean;
    emailNotifications: boolean;
  };

  // Subscription Information
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired' | 'past_due';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };

  // Usage Statistics
  usage: {
    totalMessages: number;
    totalTokens: number;
    messagesThisMonth: number;
    tokensThisMonth: number;
    lastResetDate: Date;
  };

  // Relationships
  conversations: Types.ObjectId[]; // References to user's conversations

  // Account Status
  isActive: boolean;
  lastLoginAt?: Date;
  deletedAt?: Date; // Soft delete timestamp
}

/**
 * Conversation Document Interface
 * Represents a chat session between user and AI
 */
export interface IConversation extends BaseDocument {
  // Basic Information
  title: string; // Auto-generated or user-defined title
  description?: string; // Optional conversation description

  // Ownership and Access
  userId: Types.ObjectId; // Reference to the user who owns this conversation
  clerkId: string; // Clerk user ID for quick lookups

  // Conversation Settings
  settings: {
    aiModel: string; // AI model used for this conversation
    temperature: number; // AI creativity setting
    maxTokens: number; // Maximum tokens per response
    systemMessage?: string; // Custom system prompt
    isPublic: boolean; // Whether conversation can be shared
    allowAnalytics: boolean; // Whether to include in usage analytics
  };

  // Conversation State
  status: 'active' | 'archived' | 'deleted';
  messageCount: number; // Total number of messages
  totalTokens: number; // Total tokens used in this conversation

  // Relationships
  messages: Types.ObjectId[]; // References to messages in this conversation
  tags: string[]; // User-defined tags for organization

  // Metadata
  lastMessageAt?: Date; // Timestamp of last message
  pinnedAt?: Date; // If conversation is pinned
  archivedAt?: Date; // If conversation is archived
  deletedAt?: Date; // Soft delete timestamp
}

/**
 * Message Document Interface
 * Individual messages within a conversation
 */
export interface IMessage extends BaseDocument {
  // Basic Information
  conversationId: Types.ObjectId; // Reference to parent conversation
  userId: Types.ObjectId; // Reference to user (for user messages)
  clerkId: string; // Clerk user ID for quick lookups

  // Message Content
  role: 'system' | 'user' | 'assistant'; // Message role
  content: string; // Message text content

  // AI Response Metadata (for assistant messages)
  aiMetadata?: {
    model: string; // AI model used to generate response
    temperature: number; // Temperature setting used
    maxTokens: number; // Max tokens setting used
    tokenCount: number; // Actual tokens used
    finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls';
    responseTime: number; // Response time in milliseconds
    cost?: number; // Cost in USD (if available)
  };

  // Message Status
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  isEdited: boolean; // Whether message was edited
  editedAt?: Date; // When message was last edited

  // Relationships
  attachments: Types.ObjectId[]; // References to message attachments
  parentMessageId?: Types.ObjectId; // For threaded conversations

  // Feedback and Analytics
  feedback?: {
    rating: 1 | 2 | 3 | 4 | 5; // User rating (1-5 stars)
    helpful: boolean; // Whether user found message helpful
    reportReason?: string; // If message was reported
    reportedAt?: Date;
  };

  // Metadata
  ipAddress?: string; // User's IP address (for analytics)
  userAgent?: string; // User's browser/device info
  deletedAt?: Date; // Soft delete timestamp
}

/**
 * Attachment Document Interface
 * File attachments associated with messages
 */
export interface IAttachment extends BaseDocument {
  // Basic Information
  messageId: Types.ObjectId; // Reference to parent message
  conversationId: Types.ObjectId; // Reference to parent conversation
  userId: Types.ObjectId; // Reference to user who uploaded
  clerkId: string; // Clerk user ID for quick lookups

  // File Information
  originalName: string; // Original filename
  fileName: string; // Stored filename (usually UUID-based)
  fileSize: number; // File size in bytes
  mimeType: string; // MIME type (image/png, text/plain, etc.)
  fileExtension: string; // File extension (.png, .txt, etc.)

  // Storage Information
  storageProvider: 'local' | 'cloudinary' | 'aws-s3' | 'uploadcare';
  storageUrl: string; // URL to access the file
  publicId?: string; // Public ID for CDN providers

  // File Processing
  status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
  processingError?: string; // Error message if processing failed

  // Image-specific metadata (if applicable)
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
    hasTransparency: boolean;
    colorSpace: string;
  };

  // Text extraction (for document files)
  extractedText?: string; // Extracted text content

  // Security and Validation
  isScanned: boolean; // Whether file was scanned for malware
  scanResult?: 'clean' | 'infected' | 'suspicious';
  checksum: string; // File checksum for integrity verification

  // Access Control
  isPublic: boolean; // Whether file can be accessed publicly
  expiresAt?: Date; // Expiration date for temporary files
  downloadCount: number; // Number of times file was downloaded

  // Metadata
  uploadedAt: Date; // When file was uploaded
  deletedAt?: Date; // Soft delete timestamp
}

/**
 * Database Connection Status Interface
 */
export interface IConnectionStatus {
  isConnected: boolean;
  readyState: number;
  host?: string;
  port?: number;
  name?: string;
  error?: string;
}

/**
 * Pagination Interface for database queries
 */
export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated Response Interface
 */
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Search Options Interface
 */
export interface ISearchOptions extends IPaginationOptions {
  query: string;
  fields?: string[]; // Fields to search in
  filters?: Record<string, any>; // Additional filters
}

/**
 * Export type unions for convenience
 */
export type UserRole = IUser['subscription']['plan'];
export type ConversationStatus = IConversation['status'];
export type MessageRole = IMessage['role'];
export type AttachmentStatus = IAttachment['status'];

/**
 * Utility types for creating and updating documents
 */
export type CreateUserData = Omit<
  IUser,
  keyof BaseDocument | 'conversations' | 'usage'
>;
export type UpdateUserData = Partial<
  Omit<IUser, keyof BaseDocument | 'clerkId'>
>;

export type CreateConversationData = Omit<
  IConversation,
  keyof BaseDocument | 'messages' | 'messageCount' | 'totalTokens'
>;
export type UpdateConversationData = Partial<
  Omit<IConversation, keyof BaseDocument | 'userId' | 'clerkId'>
>;

export type CreateMessageData = Omit<
  IMessage,
  keyof BaseDocument | 'attachments'
>;
export type UpdateMessageData = Partial<
  Omit<IMessage, keyof BaseDocument | 'conversationId' | 'userId' | 'clerkId'>
>;

export type CreateAttachmentData = Omit<
  IAttachment,
  keyof BaseDocument | 'downloadCount'
>;
export type UpdateAttachmentData = Partial<
  Omit<
    IAttachment,
    keyof BaseDocument | 'messageId' | 'conversationId' | 'userId' | 'clerkId'
  >
>;
