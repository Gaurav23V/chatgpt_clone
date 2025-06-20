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

import type { Document, Model, Types } from 'mongoose';
import { model, models, Schema } from 'mongoose';

import type { IUser } from '@/types/database';

/**
 * Extends the IUser interface to include Mongoose Document properties.
 * This allows for type-safe interaction with the User model.
 */
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
}

// Define specific enums for user preferences to ensure data consistency
export const ThemeEnum = ['light', 'dark', 'system'] as const;
export const ModelEnum = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] as const;
export const FontSizeEnum = ['small', 'medium', 'large'] as const;

export type Theme = (typeof ThemeEnum)[number];
export type AIModel = (typeof ModelEnum)[number];
export type FontSize = (typeof FontSizeEnum)[number];

/**
 * User preferences subdocument schema
 * Defines the structure for user-specific preferences
 */
const userPreferencesSchema = new Schema(
  {
    theme: {
      type: String,
      enum: ThemeEnum,
      default: 'system',
      required: true,
    },
    aiModel: {
      type: String,
      enum: ModelEnum,
      default: 'gpt-3.5-turbo',
      required: true,
    },
    language: {
      type: String,
      default: 'en',
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 5,
    },
    fontSize: {
      type: String,
      enum: FontSizeEnum,
      default: 'medium',
      required: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false, // Disable _id for subdocuments
    timestamps: false, // Handled by parent document
  }
);

/**
 * Main User schema definition
 * Defines the complete structure of a user document in MongoDB
 */
const userSchema = new Schema<IUserDocument>(
  {
    // Clerk Integration Fields
    clerkId: {
      type: String,
      required: [true, 'Clerk ID is required'],
      unique: true,
      trim: true,
      index: true, // Primary index for fast lookups
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true, // Index for email-based queries
      validate: {
        validator(email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },

    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
      default: '',
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
      default: '',
    },

    imageUrl: {
      type: String,
      trim: true,
      validate: {
        validator(url: string) {
          if (!url) return true; // Optional field
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
        },
        message: 'Please provide a valid image URL',
      },
    },

    username: {
      type: String,
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
      index: { sparse: true }, // Sparse index since username is optional
    },

    // User Preferences
    preferences: {
      type: userPreferencesSchema,
      default: () => ({}),
      required: true,
    },

    // Subscription Information (from existing IUser interface)
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free',
        required: true,
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'expired', 'past_due'],
        default: 'active',
        required: true,
      },
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
    },

    // Usage Statistics (from existing IUser interface)
    usage: {
      totalMessages: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
        min: 0,
      },
      messagesThisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
      tokensThisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },

    // Relationships
    conversations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Conversation',
      },
    ],

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      index: true, // For analytics and cleanup
    },

    deletedAt: {
      type: Date,
      index: { sparse: true }, // Sparse index for soft delete queries
    },
  },
  {
    // Schema options
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'users', // Explicit collection name
    versionKey: false, // Disable __v field

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

// Primary unique index on clerkId for user lookups (already defined in schema)
// This is the most critical index for performance

// Index on email for email-based queries and duplicate prevention (already defined in schema)

// Username sparse index (already defined in schema) for username-based queries

// Compound indexes for subscription queries and analytics
userSchema.index(
  { 'subscription.status': 1, 'subscription.plan': 1 },
  {
    background: true,
    name: 'idx_subscription_status_plan',
  }
);

// Index for active user queries sorted by last login
userSchema.index(
  { isActive: 1, lastLoginAt: -1 },
  {
    background: true,
    name: 'idx_active_users_login',
  }
);

// Index for user registration analytics and recent user queries
userSchema.index(
  { createdAt: -1 },
  {
    background: true,
    name: 'idx_user_registration',
  }
);

// Compound index for usage analytics and billing
userSchema.index(
  { 'subscription.plan': 1, 'usage.messagesThisMonth': -1 },
  {
    background: true,
    name: 'idx_usage_analytics',
  }
);

// Index for user activity tracking and cleanup
userSchema.index(
  { lastLoginAt: -1 },
  {
    background: true,
    name: 'idx_last_login',
  }
);

// Compound index for subscription management queries
userSchema.index(
  { 'subscription.status': 1, 'subscription.currentPeriodEnd': 1 },
  {
    background: true,
    name: 'idx_subscription_expiry',
  }
);

// Index for soft-deleted users cleanup (already sparse in schema)

// Compound index for user search with status filter
userSchema.index(
  { isActive: 1, email: 1 },
  {
    background: true,
    name: 'idx_active_email_lookup',
  }
);

// Index for usage limits and billing cycle queries
userSchema.index(
  { 'usage.lastResetDate': 1 },
  {
    background: true,
    name: 'idx_usage_reset_date',
  }
);

// Text index for comprehensive user search functionality
userSchema.index(
  {
    firstName: 'text',
    lastName: 'text',
    username: 'text',
    email: 'text',
  },
  {
    background: true,
    weights: {
      username: 10,
      firstName: 5,
      lastName: 5,
      email: 3,
    },
    name: 'user_search_index',
  }
);

// ========================================
// MIDDLEWARE
// ========================================

// Pre-save middleware for data validation and normalization
userSchema.pre('save', function (next) {
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
userSchema.pre(/^find/, function (this: any) {
  // Only exclude deleted users if deletedAt filter isn't explicitly set
  if (!this.getQuery().deletedAt) {
    this.where({ deletedAt: { $exists: false } });
  }
});

// ========================================
// STATIC METHODS
// ========================================

/**
 * Finds a user by their Clerk ID.
 * @param clerkId The Clerk ID of the user to find.
 * @returns A promise that resolves to the user document or null if not found.
 */
userSchema.statics.findByClerkId = function (
  this: Model<IUserDocument>,
  clerkId: string
) {
  return this.findOne({ clerkId }).exec();
};

/**
 * Updates a user's preferences.
 * @param clerkId The Clerk ID of the user to update.
 * @param preferences The partial preferences object to apply.
 * @returns A promise that resolves to the updated user document or null.
 */
userSchema.statics.updatePreferences = function (
  this: Model<IUserDocument>,
  clerkId: string,
  preferences: Partial<IUser['preferences']>
) {
  return this.findOneAndUpdate(
    { clerkId },
    { $set: { preferences } },
    { new: true, runValidators: true }
  ).exec();
};

/**
 * Increments user's message and token counts.
 * This is useful for tracking usage for free or metered plans.
 * @param clerkId The Clerk ID of the user.
 * @param messages The number of messages to add.
 * @param tokens The number of tokens to add.
 * @returns A promise that resolves to the updated user document.
 */
userSchema.statics.incrementUsage = function (
  this: Model<IUserDocument>,
  clerkId: string,
  messages: number,
  tokens: number
) {
  return this.findOneAndUpdate(
    { clerkId },
    {
      $inc: {
        'usage.totalMessages': messages,
        'usage.totalTokens': tokens,
        'usage.messagesThisMonth': messages,
        'usage.tokensThisMonth': tokens,
      },
    },
    { new: true }
  ).exec();
};

/**
 * Resets the monthly usage counters for all users.
 * Typically run by a scheduled job at the beginning of each billing cycle.
 * @returns A promise that resolves with the result of the update operation.
 */
userSchema.statics.resetMonthlyUsage = function (this: Model<IUserDocument>) {
  return this.updateMany(
    {},
    {
      $set: {
        'usage.messagesThisMonth': 0,
        'usage.tokensThisMonth': 0,
        'usage.lastResetDate': new Date(),
      },
    }
  ).exec();
};

/**
 * Finds all active users.
 * @returns A promise that resolves to an array of active user documents.
 */
userSchema.statics.findActiveUsers = function (this: Model<IUserDocument>) {
  return this.find({ isActive: true, deletedAt: { $exists: false } }).exec();
};

/**
 * Soft deletes a user by their Clerk ID.
 * Sets the `deletedAt` field to the current date.
 * @param clerkId The Clerk ID of the user to soft delete.
 * @returns A promise that resolves to the soft-deleted user document.
 */
userSchema.statics.softDelete = function (
  this: Model<IUserDocument>,
  clerkId: string
) {
  return this.findOneAndUpdate(
    { clerkId },
    { $set: { deletedAt: new Date(), isActive: false } },
    { new: true }
  ).exec();
};

// ========================================
// VIRTUAL FIELDS
// ========================================

// Full name virtual field
userSchema.virtual('fullName').get(function () {
  return (
    `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Unknown User'
  );
});

// Display name virtual field (prefers username, falls back to full name)
userSchema.virtual('displayName').get(function () {
  const fullName =
    `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Unknown User';
  return this.username || fullName;
});

// Account age virtual field
userSchema.virtual('accountAge').get(function () {
  return Date.now() - this.createdAt.getTime();
});

// Include virtuals when converting to JSON
userSchema.set('toJSON', { virtuals: true });

// ========================================
// MODEL EXPORT
// ========================================

// Define the interface for the model statics
interface IUserModel extends Model<IUserDocument> {
  findByClerkId(clerkId: string): Promise<IUserDocument | null>;
  updatePreferences(
    clerkId: string,
    preferences: Partial<IUser['preferences']>
  ): Promise<IUserDocument | null>;
  incrementUsage(
    clerkId: string,
    messages: number,
    tokens: number
  ): Promise<IUserDocument | null>;
  resetMonthlyUsage(): Promise<{
    modifiedCount: number;
    matchedCount: number;
    acknowledged: boolean;
    upsertedId: any;
    upsertedCount: number;
  }>;
  findActiveUsers(): Promise<IUserDocument[]>;
  softDelete(clerkId: string): Promise<IUserDocument | null>;
}

// Create and export the User model
// The model is constrained by IUserDocument and IUserModel
const UserModel = (models.User ||
  model<IUserDocument, IUserModel>('User', userSchema)) as Model<
  IUserDocument,
  IUserModel
>;

export default UserModel;

// Export types for use in other parts of the application
export type { IUser, IUserModel };
export { userSchema };
