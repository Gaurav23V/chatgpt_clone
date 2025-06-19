/**
 * User Model for ChatGPT Clone
 *
 * MongoDB User model using Mongoose that syncs with Clerk authentication data.
 * This model serves as the primary user data store and integrates seamlessly
 * with Clerk's authentication system.
 *
 * Features:
 * - Clerk ID as primary reference with unique indexing
 * - User preferences with strict typing
 * - Comprehensive indexing strategy for optimal query performance
 * - Static methods for common operations
 * - Automatic timestamps and validation
 * - Type-safe exports for use throughout the application
 */

import { Schema, model, Model, Types } from 'mongoose';
import type { IUser } from '@/types/database';

// Define specific enums for user preferences to ensure data consistency
export const ThemeEnum = ['light', 'dark', 'system'] as const;
export const ModelEnum = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] as const;
export const FontSizeEnum = ['small', 'medium', 'large'] as const;

export type Theme = typeof ThemeEnum[number];
export type AIModel = typeof ModelEnum[number];
export type FontSize = typeof FontSizeEnum[number];

/**
 * User preferences subdocument schema
 * Defines the structure for user-specific preferences
 */
const userPreferencesSchema = new Schema({
  theme: {
    type: String,
    enum: ThemeEnum,
    default: 'system',
    required: true
  },
  model: {
    type: String,
    enum: ModelEnum,
    default: 'gpt-3.5-turbo',
    required: true
  },
  language: {
    type: String,
    default: 'en',
    required: true,
    trim: true,
    lowercase: true,
    minlength: 2,
    maxlength: 5
  },
  fontSize: {
    type: String,
    enum: FontSizeEnum,
    default: 'medium',
    required: true
  }
}, {
  _id: false, // Disable _id for subdocuments
  timestamps: false // Handled by parent document
});

/**
 * Main User schema definition
 * Defines the complete structure of a user document in MongoDB
 */
const userSchema = new Schema<IUser>({
  // Clerk Integration Fields
  clerkId: {
    type: String,
    required: [true, 'Clerk ID is required'],
    unique: true,
    trim: true,
    index: true // Primary index for fast lookups
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    index: true, // Index for email-based queries
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    default: ''
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    default: ''
  },
  
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Please provide a valid image URL'
    }
  },
  
  username: {
    type: String,
    trim: true,
    maxlength: [30, 'Username cannot exceed 30 characters'],
    index: { sparse: true } // Sparse index since username is optional
  },

  // User Preferences
  preferences: {
    type: userPreferencesSchema,
    default: () => ({
      theme: 'system',
      model: 'gpt-3.5-turbo',
      language: 'en',
      fontSize: 'medium'
    }),
    required: true,
    
    // Additional fields from existing IUser interface for compatibility
    aiModel: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },

  // Subscription Information (from existing IUser interface)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'past_due'],
      default: 'active',
      required: true
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },

  // Usage Statistics (from existing IUser interface)
  usage: {
    totalMessages: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTokens: {
      type: Number,
      default: 0,
      min: 0
    },
    messagesThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    tokensThisMonth: {
      type: Number,
      default: 0,
      min: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },

  // Relationships
  conversations: [{
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  }],

  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  lastLoginAt: {
    type: Date,
    index: true // For analytics and cleanup
  },
  
  deletedAt: {
    type: Date,
    index: { sparse: true } // Sparse index for soft delete queries
  }
}, {
  // Schema options
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'users', // Explicit collection name
  versionKey: false, // Disable __v field
  
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
userSchema.index({ clerkId: 1, isActive: 1 }); // Primary lookup with status
userSchema.index({ email: 1, isActive: 1 }); // Email lookup with status
userSchema.index({ 'subscription.plan': 1, isActive: 1 }); // Subscription queries
userSchema.index({ createdAt: 1 }); // Time-based queries
userSchema.index({ lastLoginAt: 1 }); // Activity tracking
userSchema.index({ 'usage.messagesThisMonth': 1 }); // Usage analytics

// Text index for search functionality
userSchema.index({
  firstName: 'text',
  lastName: 'text',
  username: 'text',
  email: 'text'
}, {
  weights: {
    username: 10,
    firstName: 5,
    lastName: 5,
    email: 1
  },
  name: 'user_search'
});

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware for data validation and normalization
userSchema.pre('save', function(next) {
  // Ensure email is lowercase
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  
  // Set lastLoginAt for new users
  if (this.isNew && !this.lastLoginAt) {
    this.lastLoginAt = new Date();
  }
  
  next();
});

// Pre-find middleware to exclude soft-deleted users by default
userSchema.pre(/^find/, function(this: any) {
  // Only exclude deleted users if deletedAt filter isn't explicitly set
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: { $exists: false } });
  }
});

// ========================================
// STATIC METHODS
// ========================================

interface IUserModel extends Model<IUser> {
  findByClerkId(clerkId: string): Promise<IUser | null>;
  updatePreferences(clerkId: string, preferences: Partial<IUser['preferences']>): Promise<IUser | null>;
  incrementUsage(clerkId: string, messages: number, tokens: number): Promise<IUser | null>;
  resetMonthlyUsage(): Promise<{ modifiedCount: number }>;
  findActiveUsers(): Promise<IUser[]>;
  softDelete(clerkId: string): Promise<IUser | null>;
}

/**
 * Find user by Clerk ID
 * Primary method for user lookups from Clerk authentication
 */
userSchema.statics.findByClerkId = function(clerkId: string) {
  return this.findOne({ clerkId, isActive: true });
};

/**
 * Update user preferences
 * Safely updates user preferences with validation
 */
userSchema.statics.updatePreferences = function(
  clerkId: string, 
  preferences: Partial<IUser['preferences']>
) {
  return this.findOneAndUpdate(
    { clerkId, isActive: true },
    { 
      $set: { 
        'preferences': { 
          ...preferences 
        },
        lastLoginAt: new Date()
      }
    },
    { 
      new: true, 
      runValidators: true 
    }
  );
};

/**
 * Increment user usage statistics
 * Updates message and token counters for billing/analytics
 */
userSchema.statics.incrementUsage = function(
  clerkId: string, 
  messages: number = 1, 
  tokens: number = 0
) {
  return this.findOneAndUpdate(
    { clerkId, isActive: true },
    {
      $inc: {
        'usage.totalMessages': messages,
        'usage.totalTokens': tokens,
        'usage.messagesThisMonth': messages,
        'usage.tokensThisMonth': tokens
      },
      $set: {
        lastLoginAt: new Date()
      }
    },
    { new: true }
  );
};

/**
 * Reset monthly usage statistics
 * Called by scheduled job at the beginning of each month
 */
userSchema.statics.resetMonthlyUsage = function() {
  return this.updateMany(
    { isActive: true },
    {
      $set: {
        'usage.messagesThisMonth': 0,
        'usage.tokensThisMonth': 0,
        'usage.lastResetDate': new Date()
      }
    }
  );
};

/**
 * Find all active users
 * Returns users who haven't been soft-deleted
 */
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, deletedAt: { $exists: false } });
};

/**
 * Soft delete a user
 * Marks user as deleted without removing from database
 */
userSchema.statics.softDelete = function(clerkId: string) {
  return this.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        isActive: false,
        deletedAt: new Date()
      }
    },
    { new: true }
  );
};

// ========================================
// VIRTUAL FIELDS
// ========================================

// Full name virtual field
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Unknown User';
});

// Display name virtual field (prefers username, falls back to full name)
userSchema.virtual('displayName').get(function() {
  const fullName = `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Unknown User';
  return this.username || fullName;
});

// Account age virtual field
userSchema.virtual('accountAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Include virtuals when converting to JSON
userSchema.set('toJSON', { virtuals: true });

// ========================================
// MODEL EXPORT
// ========================================

// Create and export the User model
const User = model<IUser, IUserModel>('User', userSchema);

export default User;

// Export types for use in other parts of the application
export type { IUser, IUserModel };
export { userSchema }; 