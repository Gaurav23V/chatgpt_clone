/**
 * Conversation Model for ChatGPT Clone
 *
 * MongoDB Conversation model using Mongoose that manages chat conversations
 * and their association with users. This model serves as the foundation for
 * chat history, conversation management, and user-specific chat data.
 *
 * Features:
 * - User association via Clerk ID for fast lookups
 * - Conversation metadata and settings management
 * - Message counting and token tracking
 * - Archive and soft delete functionality
 * - Comprehensive indexing for optimal query performance
 * - Static methods for user-related operations
 * - Auto-generated conversation titles
 */

import type { Document, Model, Query, Types } from 'mongoose';
import { model, models, Schema } from 'mongoose';

import type { IConversation, IUser } from '@/types/database';

/**
 * Extends the IConversation interface to include Mongoose Document properties.
 */
export interface IConversationDocument extends IConversation, Document {
  _id: Types.ObjectId;
}

// Define enums for conversation-related fields
export const ConversationStatusEnum = [
  'active',
  'archived',
  'deleted',
] as const;
export const AIModelEnum = [
  // Google Generative AI (with models/ prefix as used by the AI SDK)
  'models/gemini-2.5-flash-preview-04-17',
  'models/gemini-2.0-flash-exp',
  'models/gemini-1.5-pro-latest',
  'models/gemini-1.5-flash-latest',
  'models/gemini-1.5-flash-8b-latest',
  'models/gemini-1.0-pro-latest',
  // Also include without prefix for backward compatibility
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b-latest',
  'gemini-1.0-pro-latest',

  // OpenAI
  'gpt-3.5-turbo',
  'gpt-4',
  'gpt-4-turbo',
  'gpt-4o',
  'gpt-4o-mini',

  // Groq / Llama and others
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-guard-3-8b',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
  'qwen-qwq-32b',
  'qwen-2-5-32b',
  'mistral-saba-24b',
  'deepseek-r1-distill-qwen-32b',
  'deepseek-r1-distill-llama-70b',
  'whisper-large-v3',
] as const;

export type ConversationStatus = (typeof ConversationStatusEnum)[number];
export type AIModel = (typeof AIModelEnum)[number];

/**
 * Conversation settings subdocument schema
 * Defines AI model settings and conversation behavior
 */
const conversationSettingsSchema = new Schema(
  {
    aiModel: {
      type: String,
      enum: AIModelEnum,
      default: 'gpt-3.5-turbo',
      required: true,
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 1,
      required: true,
    },
    maxTokens: {
      type: Number,
      min: 1,
      max: 32000,
      default: 2048,
      required: true,
    },
    systemMessage: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      required: true,
    },
    allowAnalytics: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * Main Conversation schema definition
 * Defines the complete structure of a conversation document in MongoDB
 */
const conversationSchema = new Schema<IConversationDocument>(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default() {
        return `New Chat ${new Date().toLocaleDateString()}`;
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Ownership and Access
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      trim: true,
      index: true, // Index for fast user-based lookups
    },

    // Conversation Settings
    settings: {
      type: conversationSettingsSchema,
      default: () => ({
        aiModel: 'gpt-3.5-turbo',
        temperature: 1,
        maxTokens: 2048,
        isPublic: false,
        allowAnalytics: true,
      }),
      required: true,
    },

    // Conversation State
    status: {
      type: String,
      enum: ConversationStatusEnum,
      default: 'active',
      required: true,
      index: true,
    },

    messageCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
      index: true, // For sorting by activity
    },

    totalTokens: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },

    // Relationships
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50,
      },
    ],

    // Metadata
    lastMessageAt: {
      type: Date,
      index: true, // For sorting by recent activity
    },

    pinnedAt: {
      type: Date,
      index: { sparse: true },
    },

    archivedAt: {
      type: Date,
      index: { sparse: true },
    },

    deletedAt: {
      type: Date,
      index: { sparse: true },
    },
  },
  {
    // Schema options
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'conversations',
    versionKey: false,

    // Transform output when converting to JSON
    toJSON: {
      transform(doc, ret) {
        delete ret.deletedAt; // Don't expose soft delete field
        return ret;
      },
    },
  }
);

// ========================================
// COMPREHENSIVE INDEX DEFINITIONS
// ========================================

// Primary compound index for user conversations sorted by recent activity
conversationSchema.index(
  { clerkId: 1, updatedAt: -1 },
  {
    background: true,
    name: 'idx_user_conversations_recent',
  }
);

// Compound index for filtering conversations by status
conversationSchema.index(
  { clerkId: 1, status: 1 },
  {
    background: true,
    name: 'idx_user_conversations_status',
  }
);

// Sparse compound index for pinned conversations
conversationSchema.index(
  { clerkId: 1, pinnedAt: -1 },
  {
    sparse: true,
    background: true,
    name: 'idx_user_pinned_conversations',
  }
);

// Compound index for conversations sorted by recent message activity
conversationSchema.index(
  { clerkId: 1, lastMessageAt: -1 },
  {
    background: true,
    name: 'idx_user_conversations_activity',
  }
);

// Compound index for conversations sorted by message count
conversationSchema.index(
  { clerkId: 1, messageCount: -1 },
  {
    background: true,
    name: 'idx_user_conversations_count',
  }
);

// Index for archived conversation cleanup and analytics
conversationSchema.index(
  { status: 1, archivedAt: -1 },
  {
    sparse: true,
    background: true,
    name: 'idx_archived_conversations',
  }
);

// Index for global recent activity across all users
conversationSchema.index(
  { updatedAt: -1 },
  {
    background: true,
    name: 'idx_global_recent_activity',
  }
);

// Index for conversation creation analytics
conversationSchema.index(
  { createdAt: -1 },
  {
    background: true,
    name: 'idx_conversation_creation',
  }
);

// Index for AI model usage analytics and filtering
conversationSchema.index(
  { 'settings.aiModel': 1, createdAt: -1 },
  {
    background: true,
    name: 'idx_ai_model_usage',
  }
);

// Compound index for public conversations and sharing features
conversationSchema.index(
  { 'settings.isPublic': 1, updatedAt: -1 },
  {
    background: true,
    name: 'idx_public_conversations',
  }
);

// Index for conversation token usage analytics
conversationSchema.index(
  { totalTokens: -1, clerkId: 1 },
  {
    background: true,
    name: 'idx_token_usage_analytics',
  }
);

// Sparse index for conversations with tags
conversationSchema.index(
  { tags: 1 },
  {
    sparse: true,
    background: true,
    name: 'idx_conversation_tags',
  }
);

// Compound index for user conversations filtered by activity threshold
conversationSchema.index(
  { clerkId: 1, messageCount: 1, lastMessageAt: -1 },
  {
    background: true,
    name: 'idx_user_active_conversations',
  }
);

// Text search index for conversation search functionality
conversationSchema.index(
  {
    title: 'text',
    description: 'text',
    tags: 'text',
  },
  {
    background: true,
    weights: {
      title: 10,
      description: 5,
      tags: 1,
    },
    name: 'conversation_search_index',
  }
);

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware for data validation and normalization
conversationSchema.pre('save', function (next) {
  // Auto-generate title if not provided
  if (!this.title || this.title.trim() === '') {
    this.title = `New Chat ${new Date().toLocaleDateString()}`;
  }

  // Update lastMessageAt when messageCount changes
  if (this.isModified('messageCount') && this.messageCount > 0) {
    this.lastMessageAt = new Date();
  }

  // Set archivedAt when status changes to archived
  if (
    this.isModified('status') &&
    this.status === 'archived' &&
    !this.archivedAt
  ) {
    this.archivedAt = new Date();
  }

  next();
});

// Pre-find middleware to exclude soft-deleted conversations by default
conversationSchema.pre(
  /^find/,
  function (this: Query<IConversationDocument, IConversationDocument[]>, next) {
    // `this` is a Mongoose Query object
    this.where({ deletedAt: { $exists: false } });
    next();
  }
);

// ========================================
// STATIC METHODS
// ========================================

/**
 * Interface for the Conversation model's static methods
 * Ensures type safety for all static functions
 */
interface IConversationModel extends Model<IConversationDocument> {
  getUserConversations(
    clerkId: string,
    limit?: number
  ): Promise<IConversationDocument[]>;
  countUserConversations(clerkId: string): Promise<number>;
  getRecentConversations(
    clerkId: string,
    days?: number
  ): Promise<IConversationDocument[]>;
  getActiveConversations(clerkId: string): Promise<IConversationDocument[]>;
  getArchivedConversations(clerkId: string): Promise<IConversationDocument[]>;
  getPinnedConversations(clerkId: string): Promise<IConversationDocument[]>;
  searchUserConversations(
    clerkId: string,
    query: string,
    limit?: number
  ): Promise<IConversationDocument[]>;
  incrementMessageCount(
    conversationId: string,
    tokenCount?: number
  ): Promise<IConversationDocument | null>;
  archiveConversation(
    conversationId: string
  ): Promise<IConversationDocument | null>;
  pinConversation(
    conversationId: string
  ): Promise<IConversationDocument | null>;
  unpinConversation(
    conversationId: string
  ): Promise<IConversationDocument | null>;
  softDeleteConversation(
    conversationId: string
  ): Promise<IConversationDocument | null>;
  deleteUserConversations(clerkId: string): Promise<{ deletedCount: number }>;
}

/**
 * Gets all conversations for a user, sorted by last update time.
 * @param clerkId The Clerk user ID.
 * @param limit The maximum number of conversations to return.
 * @returns A promise that resolves to an array of conversation documents.
 */
conversationSchema.statics.getUserConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string,
  limit: number = 20
) {
  return this.find({ clerkId }).sort({ updatedAt: -1 }).limit(limit).exec();
};

/**
 * Counts the total number of conversations for a user.
 * @param clerkId The Clerk user ID.
 * @returns A promise that resolves to the total conversation count.
 */
conversationSchema.statics.countUserConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string
) {
  return this.countDocuments({ clerkId }).exec();
};

/**
 * Retrieves recent conversations for a user within a given timeframe.
 * @param clerkId The Clerk user ID.
 * @param days The number of days to look back.
 * @returns A promise that resolves to an array of recent conversation documents.
 */
conversationSchema.statics.getRecentConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string,
  days: number = 7
) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ clerkId, updatedAt: { $gte: date } })
    .sort({ updatedAt: -1 })
    .exec();
};

/**
 * Gets all active conversations for a user.
 * @param clerkId The Clerk user ID.
 * @returns A promise that resolves to an array of active conversation documents.
 */
conversationSchema.statics.getActiveConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string
) {
  return this.find({ clerkId, status: 'active' })
    .sort({ updatedAt: -1 })
    .exec();
};

/**
 * Gets all archived conversations for a user.
 * @param clerkId The Clerk user ID.
 * @returns A promise that resolves to an array of archived conversation documents.
 */
conversationSchema.statics.getArchivedConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string
) {
  return this.find({ clerkId, status: 'archived' })
    .sort({ updatedAt: -1 })
    .exec();
};

/**
 * Gets all pinned conversations for a user.
 * @param clerkId The Clerk user ID.
 * @returns A promise that resolves to an array of pinned conversation documents.
 */
conversationSchema.statics.getPinnedConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string
) {
  return this.find({ clerkId, pinnedAt: { $exists: true, $ne: null } })
    .sort({ pinnedAt: -1 })
    .exec();
};

/**
 * Searches user conversations by title, description, or tags.
 * @param clerkId The Clerk user ID.
 * @param query The search query.
 * @param limit The maximum number of results to return.
 * @returns A promise that resolves to an array of matching conversation documents.
 */
conversationSchema.statics.searchUserConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string,
  query: string,
  limit: number = 10
) {
  return this.find(
    { clerkId, $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .exec();
};

/**
 * Increments the message count and total tokens for a conversation.
 * @param conversationId The ID of the conversation to update.
 * @param tokenCount The number of tokens to add.
 * @returns A promise that resolves to the updated conversation document.
 */
conversationSchema.statics.incrementMessageCount = function (
  this: Model<IConversationDocument>,
  conversationId: string,
  tokenCount: number = 0
) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $inc: { messageCount: 1, totalTokens: tokenCount },
      $set: { lastMessageAt: new Date() },
    },
    { new: true, runValidators: true }
  ).exec();
};

/**
 * Archives a conversation by setting its status to 'archived'.
 * @param conversationId The ID of the conversation to archive.
 * @returns A promise that resolves to the archived conversation document.
 */
conversationSchema.statics.archiveConversation = function (
  this: Model<IConversationDocument>,
  conversationId: string
) {
  return this.findByIdAndUpdate(
    conversationId,
    { status: 'archived', archivedAt: new Date() },
    { new: true, runValidators: true }
  ).exec();
};

/**
 * Pins a conversation by setting the `pinnedAt` timestamp.
 * @param conversationId The ID of the conversation to pin.
 * @returns A promise that resolves to the pinned conversation document.
 */
conversationSchema.statics.pinConversation = function (
  this: Model<IConversationDocument>,
  conversationId: string
) {
  return this.findByIdAndUpdate(
    conversationId,
    { pinnedAt: new Date() },
    { new: true, runValidators: true }
  ).exec();
};

/**
 * Unpins a conversation by unsetting the `pinnedAt` field.
 * @param conversationId The ID of the conversation to unpin.
 * @returns A promise that resolves to the unpinned conversation document.
 */
conversationSchema.statics.unpinConversation = function (
  this: Model<IConversationDocument>,
  conversationId: string
) {
  return this.findByIdAndUpdate(
    conversationId,
    { $unset: { pinnedAt: 1 } },
    { new: true, runValidators: true }
  ).exec();
};

/**
 * Soft deletes a conversation by setting its status to 'deleted'.
 * @param conversationId The ID of the conversation to soft delete.
 * @returns A promise that resolves to the soft-deleted conversation document.
 */
conversationSchema.statics.softDeleteConversation = function (
  this: Model<IConversationDocument>,
  conversationId: string
) {
  return this.findByIdAndUpdate(
    conversationId,
    { status: 'deleted', deletedAt: new Date() },
    { new: true, runValidators: true }
  ).exec();
};

/**
 * Deletes all conversations for a specific user.
 * This is a hard delete and should be used with caution.
 * @param clerkId The Clerk user ID.
 * @returns A promise that resolves with the deletion result.
 */
conversationSchema.statics.deleteUserConversations = function (
  this: Model<IConversationDocument>,
  clerkId: string
) {
  return this.deleteMany({ clerkId }).exec();
};

// ========================================
// VIRTUAL FIELDS
// ========================================

// Is conversation pinned
conversationSchema.virtual('isPinned').get(function () {
  return !!this.pinnedAt;
});

// Is conversation archived
conversationSchema.virtual('isArchived').get(function () {
  return this.status === 'archived';
});

// Is conversation deleted
conversationSchema.virtual('isDeleted').get(function () {
  return this.status === 'deleted';
});

// Days since last activity
conversationSchema.virtual('daysSinceLastMessage').get(function () {
  if (!this.lastMessageAt) return null;
  const diffTime = Math.abs(Date.now() - this.lastMessageAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Activity level based on message count
conversationSchema.virtual('activityLevel').get(function () {
  if (this.messageCount === 0) return 'empty';
  if (this.messageCount < 10) return 'low';
  if (this.messageCount < 50) return 'medium';
  if (this.messageCount < 100) return 'high';
  return 'very-high';
});

// Include virtuals when converting to JSON
conversationSchema.set('toJSON', { virtuals: true });

// ========================================
// MODEL EXPORT
// ========================================

// Check if model already exists to prevent OverwriteModelError in development
const ConversationModel =
  (models.Conversation as IConversationModel) ||
  model<IConversationDocument, IConversationModel>(
    'Conversation',
    conversationSchema
  );

export default ConversationModel;

// Export types for use in other parts of the application
export type { IConversation, IConversationModel };
export { conversationSchema };
