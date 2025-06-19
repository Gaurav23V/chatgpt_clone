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

import { Schema, model, Model } from 'mongoose';
import type { IConversation, IUser } from '@/types/database';

// Define enums for conversation-related fields
export const ConversationStatusEnum = ['active', 'archived', 'deleted'] as const;
export const AIModelEnum = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'] as const;

export type ConversationStatus = typeof ConversationStatusEnum[number];
export type AIModel = typeof AIModelEnum[number];

/**
 * Conversation settings subdocument schema
 * Defines AI model settings and conversation behavior
 */
const conversationSettingsSchema = new Schema({
  aiModel: {
    type: String,
    enum: AIModelEnum,
    default: 'gpt-3.5-turbo',
    required: true
  },
  temperature: {
    type: Number,
    min: 0,
    max: 2,
    default: 1,
    required: true
  },
  maxTokens: {
    type: Number,
    min: 1,
    max: 32000,
    default: 2048,
    required: true
  },
  systemMessage: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    required: true
  },
  allowAnalytics: {
    type: Boolean,
    default: true,
    required: true
  }
}, {
  _id: false,
  timestamps: false
});

/**
 * Main Conversation schema definition
 * Defines the complete structure of a conversation document in MongoDB
 */
const conversationSchema = new Schema<IConversation>({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Conversation title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: function() {
      return `New Chat ${new Date().toLocaleDateString()}`;
    }
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Ownership and Access
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  clerkId: {
    type: String,
    required: [true, 'Clerk ID is required'],
    trim: true,
    index: true // Index for fast user-based lookups
  },

  // Conversation Settings
  settings: {
    type: conversationSettingsSchema,
    default: () => ({
      aiModel: 'gpt-3.5-turbo',
      temperature: 1,
      maxTokens: 2048,
      isPublic: false,
      allowAnalytics: true
    }),
    required: true
  },

  // Conversation State
  status: {
    type: String,
    enum: ConversationStatusEnum,
    default: 'active',
    required: true,
    index: true
  },
  
  messageCount: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
    index: true // For sorting by activity
  },
  
  totalTokens: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  },

  // Relationships
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],

  // Metadata
  lastMessageAt: {
    type: Date,
    index: true // For sorting by recent activity
  },
  
  pinnedAt: {
    type: Date,
    index: { sparse: true }
  },
  
  archivedAt: {
    type: Date,
    index: { sparse: true }
  },
  
  deletedAt: {
    type: Date,
    index: { sparse: true }
  }
}, {
  // Schema options
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'conversations',
  versionKey: false,
  
  // Transform output when converting to JSON
  toJSON: {
    transform: function(doc, ret) {
      delete ret.deletedAt; // Don't expose soft delete field
      return ret;
    }
  }
});

// ========================================
// INDEXES
// ========================================

// Compound indexes for optimized queries
conversationSchema.index({ clerkId: 1, status: 1 }); // User conversations by status
conversationSchema.index({ clerkId: 1, updatedAt: -1 }); // Recent conversations for user
conversationSchema.index({ clerkId: 1, lastMessageAt: -1 }); // Last active conversations
conversationSchema.index({ clerkId: 1, pinnedAt: -1 }); // Pinned conversations
conversationSchema.index({ clerkId: 1, messageCount: -1 }); // Most active conversations

// Performance indexes
conversationSchema.index({ updatedAt: -1 }); // Recent activity across all users
conversationSchema.index({ createdAt: -1 }); // Recently created conversations
conversationSchema.index({ 'settings.aiModel': 1 }); // Filter by AI model

// Text search index for conversation titles and descriptions
conversationSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 3
  },
  name: 'conversation_search'
});

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware for data validation and normalization
conversationSchema.pre('save', function(next) {
  // Auto-generate title if not provided
  if (!this.title || this.title.trim() === '') {
    this.title = `New Chat ${new Date().toLocaleDateString()}`;
  }
  
  // Update lastMessageAt when messageCount changes
  if (this.isModified('messageCount') && this.messageCount > 0) {
    this.lastMessageAt = new Date();
  }
  
  // Set archivedAt when status changes to archived
  if (this.isModified('status') && this.status === 'archived' && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted conversations by default
conversationSchema.pre(/^find/, function(this: any) {
  // Only exclude deleted conversations if deletedAt filter isn't explicitly set
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: { $exists: false } });
  }
});

// ========================================
// STATIC METHODS
// ========================================

interface IConversationModel extends Model<IConversation> {
  getUserConversations(clerkId: string, limit?: number): Promise<IConversation[]>;
  countUserConversations(clerkId: string): Promise<number>;
  getRecentConversations(clerkId: string, days?: number): Promise<IConversation[]>;
  getActiveConversations(clerkId: string): Promise<IConversation[]>;
  getArchivedConversations(clerkId: string): Promise<IConversation[]>;
  getPinnedConversations(clerkId: string): Promise<IConversation[]>;
  searchUserConversations(clerkId: string, query: string, limit?: number): Promise<IConversation[]>;
  incrementMessageCount(conversationId: string, tokenCount?: number): Promise<IConversation | null>;
  archiveConversation(conversationId: string): Promise<IConversation | null>;
  pinConversation(conversationId: string): Promise<IConversation | null>;
  unpinConversation(conversationId: string): Promise<IConversation | null>;
  softDeleteConversation(conversationId: string): Promise<IConversation | null>;
  deleteUserConversations(clerkId: string): Promise<{ deletedCount: number }>;
}

/**
 * Get user conversations with optional limit
 * Returns conversations sorted by most recent activity
 */
conversationSchema.statics.getUserConversations = function(
  clerkId: string, 
  limit: number = 50
) {
  return this.find({ 
    clerkId, 
    status: { $ne: 'deleted' } 
  })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .populate('messages', 'content role createdAt', null, { sort: { createdAt: -1 }, limit: 1 });
};

/**
 * Count total conversations for a user
 * Excludes deleted conversations
 */
conversationSchema.statics.countUserConversations = function(clerkId: string) {
  return this.countDocuments({ 
    clerkId, 
    status: { $ne: 'deleted' } 
  });
};

/**
 * Get recent conversations within specified days
 * Default to last 30 days
 */
conversationSchema.statics.getRecentConversations = function(
  clerkId: string, 
  days: number = 30
) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return this.find({
    clerkId,
    status: { $ne: 'deleted' },
    $or: [
      { lastMessageAt: { $gte: dateThreshold } },
      { updatedAt: { $gte: dateThreshold } }
    ]
  })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .limit(100);
};

/**
 * Get active conversations for a user
 */
conversationSchema.statics.getActiveConversations = function(clerkId: string) {
  return this.find({ 
    clerkId, 
    status: 'active' 
  })
    .sort({ updatedAt: -1 });
};

/**
 * Get archived conversations for a user
 */
conversationSchema.statics.getArchivedConversations = function(clerkId: string) {
  return this.find({ 
    clerkId, 
    status: 'archived' 
  })
    .sort({ archivedAt: -1 });
};

/**
 * Get pinned conversations for a user
 */
conversationSchema.statics.getPinnedConversations = function(clerkId: string) {
  return this.find({ 
    clerkId, 
    status: { $ne: 'deleted' },
    pinnedAt: { $exists: true }
  })
    .sort({ pinnedAt: -1 });
};

/**
 * Search conversations by title, description, or tags
 */
conversationSchema.statics.searchUserConversations = function(
  clerkId: string, 
  query: string, 
  limit: number = 20
) {
  return this.find({
    clerkId,
    status: { $ne: 'deleted' },
    $text: { $search: query }
  }, {
    score: { $meta: 'textScore' }
  })
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
    .limit(limit);
};

/**
 * Increment message count and update metadata
 */
conversationSchema.statics.incrementMessageCount = function(
  conversationId: string,
  tokenCount: number = 0
) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $inc: { 
        messageCount: 1,
        totalTokens: tokenCount 
      },
      $set: { 
        lastMessageAt: new Date() 
      }
    },
    { new: true }
  );
};

/**
 * Archive a conversation
 */
conversationSchema.statics.archiveConversation = function(conversationId: string) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $set: {
        status: 'archived',
        archivedAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Pin a conversation
 */
conversationSchema.statics.pinConversation = function(conversationId: string) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $set: { pinnedAt: new Date() }
    },
    { new: true }
  );
};

/**
 * Unpin a conversation
 */
conversationSchema.statics.unpinConversation = function(conversationId: string) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $unset: { pinnedAt: 1 }
    },
    { new: true }
  );
};

/**
 * Soft delete a conversation
 */
conversationSchema.statics.softDeleteConversation = function(conversationId: string) {
  return this.findByIdAndUpdate(
    conversationId,
    {
      $set: {
        status: 'deleted',
        deletedAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Delete all conversations for a user (for user cleanup)
 */
conversationSchema.statics.deleteUserConversations = function(clerkId: string) {
  return this.deleteMany({ clerkId });
};

// ========================================
// VIRTUAL FIELDS
// ========================================

// Is conversation pinned
conversationSchema.virtual('isPinned').get(function() {
  return !!this.pinnedAt;
});

// Is conversation archived
conversationSchema.virtual('isArchived').get(function() {
  return this.status === 'archived';
});

// Is conversation deleted
conversationSchema.virtual('isDeleted').get(function() {
  return this.status === 'deleted';
});

// Days since last activity
conversationSchema.virtual('daysSinceLastMessage').get(function() {
  if (!this.lastMessageAt) return null;
  const diffTime = Math.abs(Date.now() - this.lastMessageAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Activity level based on message count
conversationSchema.virtual('activityLevel').get(function() {
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

// Create and export the Conversation model
const Conversation = model<IConversation, IConversationModel>('Conversation', conversationSchema);

export default Conversation;

// Export types for use in other parts of the application
export type { IConversation, IConversationModel };
export { conversationSchema }; 