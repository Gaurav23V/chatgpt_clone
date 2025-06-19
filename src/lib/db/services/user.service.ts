/**
 * User Service for ChatGPT Clone
 *
 * Comprehensive service layer for user data operations that syncs with Clerk
 * authentication system. Provides clean abstractions for user CRUD operations
 * with proper error handling, validation, and transaction support.
 *
 * Features:
 * - Clerk webhook integration for user lifecycle events
 * - Data transformation between Clerk and MongoDB schemas
 * - Transaction support for data consistency
 * - Comprehensive error handling and logging
 * - Type-safe operations with proper TypeScript interfaces
 * - Duplicate prevention and conflict resolution
 */

import type { ClientSession } from 'mongoose';
import { startSession } from 'mongoose';

import { connectToDatabase } from '@/lib/db/connection';
import { Conversation, User } from '@/lib/db/models';
import type { IConversation, IUser } from '@/types/database';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Clerk User Data Interface
 * Maps to the structure received from Clerk webhooks and API calls
 */
export interface ClerkUserData {
  id: string; // Clerk user ID
  emailAddresses: Array<{
    emailAddress: string;
    id: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  username: string | null;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  lastSignInAt: number | null; // Unix timestamp
  // Additional fields that might come from Clerk
  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
  unsafeMetadata?: Record<string, any>;
}

/**
 * Service Operation Result Types
 */
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: Date;
}

export type ErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'INVALID_CLERK_ID'
  | 'INVALID_EMAIL'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'TRANSACTION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * User Creation Input
 */
export interface CreateUserInput {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  preferences?: Partial<IUser['preferences']>;
  subscription?: Partial<IUser['subscription']>;
}

/**
 * User Update Input
 */
export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  username?: string;
  preferences?: Partial<IUser['preferences']>;
  subscription?: Partial<IUser['subscription']>;
  lastLoginAt?: Date;
}

/**
 * Upsert Operation Result
 */
export interface UpsertResult {
  user: IUser;
  created: boolean; // true if user was created, false if updated
}

// ========================================
// DATA TRANSFORMATION UTILITIES
// ========================================

/**
 * Transform Clerk user data to our user schema format
 */
export function transformClerkUser(clerkUser: ClerkUserData): CreateUserInput {
  const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error('User must have a primary email address');
  }

  return {
    clerkId: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    imageUrl: clerkUser.imageUrl || '',
    username: clerkUser.username || undefined,
    preferences: {
      theme: 'system',
      language: 'en',
      fontSize: 'medium',
      aiModel: 'gpt-3.5-turbo',
      soundEnabled: true,
      emailNotifications: true,
    },
    subscription: {
      plan: 'free',
      status: 'active',
      cancelAtPeriodEnd: false,
    },
  };
}

/**
 * Sanitize and validate user input data
 */
export function sanitizeUserInput(
  input: Partial<UpdateUserInput>
): Partial<UpdateUserInput> {
  const sanitized: Partial<UpdateUserInput> = {};

  // Sanitize email
  if (input.email) {
    sanitized.email = input.email.toLowerCase().trim();
    if (!isValidEmail(sanitized.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Sanitize string fields
  if (input.firstName !== undefined) {
    sanitized.firstName = input.firstName?.trim() || '';
  }
  if (input.lastName !== undefined) {
    sanitized.lastName = input.lastName?.trim() || '';
  }
  if (input.username !== undefined) {
    sanitized.username = input.username?.trim() || undefined;
  }

  // Validate and sanitize imageUrl
  if (input.imageUrl !== undefined) {
    sanitized.imageUrl = input.imageUrl?.trim() || '';
    if (sanitized.imageUrl && !isValidUrl(sanitized.imageUrl)) {
      throw new Error('Invalid image URL format');
    }
  }

  // Copy other fields as-is (they have their own validation in the schema)
  if (input.preferences) {
    sanitized.preferences = input.preferences;
  }
  if (input.subscription) {
    sanitized.subscription = input.subscription;
  }
  if (input.lastLoginAt) {
    sanitized.lastLoginAt = input.lastLoginAt;
  }

  return sanitized;
}

/**
 * Validate and sanitize user preferences
 */
export function validateAndSanitizePreferences(
  preferences: Partial<IUser['preferences']>
): Partial<IUser['preferences']> {
  const sanitized: Partial<IUser['preferences']> = {};

  // Validate theme
  if (preferences.theme !== undefined) {
    const validThemes = ['light', 'dark', 'system'] as const;
    if (validThemes.includes(preferences.theme as any)) {
      sanitized.theme = preferences.theme;
    } else {
      throw new Error(
        `Invalid theme: ${preferences.theme}. Must be one of: ${validThemes.join(', ')}`
      );
    }
  }

  // Validate aiModel
  if (preferences.aiModel !== undefined) {
    const validModels = [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o-mini',
      'gpt-4o',
    ] as const;
    if (validModels.includes(preferences.aiModel as any)) {
      sanitized.aiModel = preferences.aiModel;
    } else {
      throw new Error(
        `Invalid AI model: ${preferences.aiModel}. Must be one of: ${validModels.join(', ')}`
      );
    }
  }

  // Validate language (ISO 639-1 format)
  if (preferences.language !== undefined) {
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (
      typeof preferences.language === 'string' &&
      preferences.language.length >= 2 &&
      preferences.language.length <= 5 &&
      languageRegex.test(preferences.language)
    ) {
      sanitized.language = preferences.language.toLowerCase();
    } else {
      throw new Error(
        `Invalid language code: ${preferences.language}. Must be ISO 639-1 format (e.g., 'en', 'es', 'fr')`
      );
    }
  }

  // Validate fontSize
  if (preferences.fontSize !== undefined) {
    const validSizes = ['small', 'medium', 'large'] as const;
    if (validSizes.includes(preferences.fontSize as any)) {
      sanitized.fontSize = preferences.fontSize;
    } else {
      throw new Error(
        `Invalid font size: ${preferences.fontSize}. Must be one of: ${validSizes.join(', ')}`
      );
    }
  }

  // Validate boolean preferences
  if (preferences.soundEnabled !== undefined) {
    if (typeof preferences.soundEnabled === 'boolean') {
      sanitized.soundEnabled = preferences.soundEnabled;
    } else {
      throw new Error('soundEnabled must be a boolean value');
    }
  }

  if (preferences.emailNotifications !== undefined) {
    if (typeof preferences.emailNotifications === 'boolean') {
      sanitized.emailNotifications = preferences.emailNotifications;
    } else {
      throw new Error('emailNotifications must be a boolean value');
    }
  }

  return sanitized;
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Clerk ID format
 */
function isValidClerkId(clerkId: string): boolean {
  return (
    typeof clerkId === 'string' &&
    clerkId.length > 0 &&
    clerkId.startsWith('user_')
  );
}

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

/**
 * Create standardized error result
 */
function createErrorResult(
  code: ErrorCode,
  message: string,
  details?: any
): ServiceResult {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date(),
    },
  };
}

/**
 * Create success result
 */
function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Log service errors with context
 */
function logError(operation: string, error: any, context?: any): void {
  console.error(`[UserService.${operation}] Error:`, {
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

// ========================================
// CORE SERVICE FUNCTIONS
// ========================================

/**
 * Create a new user from Clerk data
 * Handles duplicate prevention and validation
 */
export async function createUser(
  clerkUserData: ClerkUserData,
  session?: ClientSession
): Promise<ServiceResult<IUser>> {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Validate Clerk ID
    if (!isValidClerkId(clerkUserData.id)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Transform Clerk data to our schema
    const userData = transformClerkUser(clerkUserData);

    // Check if user already exists
    const existingUser = await User.findOne({
      clerkId: userData.clerkId,
    }).session(session || null);
    if (existingUser) {
      return createErrorResult(
        'USER_ALREADY_EXISTS',
        'User with this Clerk ID already exists',
        { clerkId: userData.clerkId }
      );
    }

    // Create new user
    const [newUser] = await User.create(
      [
        {
          ...userData,
          lastLoginAt: new Date(),
          usage: {
            totalMessages: 0,
            totalTokens: 0,
            messagesThisMonth: 0,
            tokensThisMonth: 0,
            lastResetDate: new Date(),
          },
        },
      ],
      { session }
    );

    console.log(
      `[UserService.createUser] User created successfully: ${userData.clerkId}`
    );
    return createSuccessResult(newUser);
  } catch (error: any) {
    logError('createUser', error, { clerkId: clerkUserData?.id });

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      return createErrorResult(
        'USER_ALREADY_EXISTS',
        'User already exists with this email or Clerk ID'
      );
    }

    if (error.name === 'ValidationError') {
      return createErrorResult(
        'VALIDATION_ERROR',
        'User data validation failed',
        error.errors
      );
    }

    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to create user in database',
      error.message
    );
  }
}

/**
 * Update an existing user by Clerk ID
 * Provides safe partial updates with validation
 */
export async function updateUser(
  clerkId: string,
  updates: UpdateUserInput,
  session?: ClientSession
): Promise<ServiceResult<IUser>> {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Validate Clerk ID
    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Sanitize input data
    const sanitizedUpdates = sanitizeUserInput(updates);

    // Update user with validation
    const updatedUser = await User.findOneAndUpdate(
      { clerkId, isActive: true },
      {
        $set: {
          ...sanitizedUpdates,
          lastLoginAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
        session,
      }
    );

    if (!updatedUser) {
      return createErrorResult('USER_NOT_FOUND', 'User not found or inactive', {
        clerkId,
      });
    }

    console.log(
      `[UserService.updateUser] User updated successfully: ${clerkId}`
    );
    return createSuccessResult(updatedUser);
  } catch (error: any) {
    logError('updateUser', error, { clerkId, updates });

    if (error.name === 'ValidationError') {
      return createErrorResult(
        'VALIDATION_ERROR',
        'User data validation failed',
        error.errors
      );
    }

    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to update user in database',
      error.message
    );
  }
}

/**
 * Create or update user based on existence (upsert operation)
 * Ideal for Clerk webhook handlers
 */
export async function upsertUser(
  clerkUserData: ClerkUserData,
  session?: ClientSession
): Promise<ServiceResult<UpsertResult>> {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Validate Clerk ID
    if (!isValidClerkId(clerkUserData.id)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({
      clerkId: clerkUserData.id,
    }).session(session || null);

    if (existingUser) {
      // Update existing user
      const userData = transformClerkUser(clerkUserData);
      const updateResult = await updateUser(
        clerkUserData.id,
        {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
          username: userData.username,
        },
        session
      );

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return createSuccessResult({
        user: updateResult.data!,
        created: false,
      });
    } else {
      // Create new user
      const createResult = await createUser(clerkUserData, session);

      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }

      return createSuccessResult({
        user: createResult.data!,
        created: true,
      });
    }
  } catch (error: any) {
    logError('upsertUser', error, { clerkId: clerkUserData?.id });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to upsert user',
      error.message
    );
  }
}

/**
 * Delete user (soft delete by default, hard delete optional)
 * Handles cleanup of related data
 */
export async function deleteUser(
  clerkId: string,
  hardDelete: boolean = false,
  session?: ClientSession
): Promise<ServiceResult<{ deleted: boolean; hardDelete: boolean }>> {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Validate Clerk ID
    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    if (hardDelete) {
      // Hard delete - permanently remove user
      const deletedUser = await User.findOneAndDelete({ clerkId }, { session });

      if (!deletedUser) {
        return createErrorResult('USER_NOT_FOUND', 'User not found', {
          clerkId,
        });
      }

      console.log(`[UserService.deleteUser] User hard deleted: ${clerkId}`);
      return createSuccessResult({ deleted: true, hardDelete: true });
    } else {
      // Soft delete - mark as deleted
      const updatedUser = await User.findOneAndUpdate(
        { clerkId },
        {
          $set: {
            isActive: false,
            deletedAt: new Date(),
          },
        },
        { session }
      );

      if (!updatedUser) {
        return createErrorResult('USER_NOT_FOUND', 'User not found', {
          clerkId,
        });
      }

      console.log(`[UserService.deleteUser] User soft deleted: ${clerkId}`);
      return createSuccessResult({ deleted: true, hardDelete: false });
    }
  } catch (error: any) {
    logError('deleteUser', error, { clerkId, hardDelete });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to delete user',
      error.message
    );
  }
}

// ========================================
// ADDITIONAL UTILITY FUNCTIONS
// ========================================

/**
 * Get user by Clerk ID with error handling
 */
export async function getUserByClerkId(
  clerkId: string,
  includeDeleted: boolean = false
): Promise<ServiceResult<IUser>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    const query = includeDeleted ? { clerkId } : { clerkId, isActive: true };

    const user = await User.findOne(query);

    if (!user) {
      return createErrorResult('USER_NOT_FOUND', 'User not found', { clerkId });
    }

    return createSuccessResult(user);
  } catch (error: any) {
    logError('getUserByClerkId', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch user',
      error.message
    );
  }
}

/**
 * Update only user preferences
 * Optimized function for preference updates with enhanced validation
 */
export async function updateUserPreferences(
  clerkId: string,
  preferences: Partial<IUser['preferences']>,
  session?: ClientSession
): Promise<ServiceResult<IUser>> {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Validate Clerk ID
    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Validate and sanitize preferences
    const sanitizedPreferences = validateAndSanitizePreferences(preferences);

    // Check if user exists
    const existingUser = await User.findOne({
      clerkId,
      isActive: true,
    })
      .select('_id clerkId preferences')
      .lean()
      .session(session || null);

    if (!existingUser) {
      return createErrorResult('USER_NOT_FOUND', 'User not found or inactive', {
        clerkId,
      });
    }

    // Update user preferences using dot notation for better performance
    const updateFields: Record<string, any> = {};
    Object.entries(sanitizedPreferences).forEach(([key, value]) => {
      updateFields[`preferences.${key}`] = value;
    });

    // Update user preferences
    const updatedUser = await User.findOneAndUpdate(
      { clerkId, isActive: true },
      {
        $set: {
          ...updateFields,
          lastLoginAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
        session: session || null,
        lean: true,
      }
    );

    if (!updatedUser) {
      return createErrorResult(
        'USER_NOT_FOUND',
        'User not found during update',
        { clerkId }
      );
    }

    console.log(
      `[UserService.updateUserPreferences] Updated preferences for user: ${clerkId}`,
      { preferences: sanitizedPreferences }
    );

    return createSuccessResult(updatedUser);
  } catch (error: any) {
    logError('updateUserPreferences', error, { clerkId, preferences });

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return createErrorResult(
        'VALIDATION_ERROR',
        'Preference validation failed',
        error.errors
      );
    }

    // Handle custom validation errors from our sanitization
    if (error.message.includes('Invalid')) {
      return createErrorResult('VALIDATION_ERROR', error.message);
    }

    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to update user preferences',
      error.message
    );
  }
}

/**
 * Execute operations within a transaction
 */
export async function withTransaction<T>(
  operation: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await startSession();

  try {
    let result: T;

    await session.withTransaction(async () => {
      result = await operation(session);
    });

    return result!;
  } catch (error) {
    logError('withTransaction', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

// ========================================
// WEBHOOK HANDLER UTILITIES
// ========================================

/**
 * Handle Clerk user.created webhook
 */
export async function handleUserCreated(
  clerkUserData: ClerkUserData
): Promise<ServiceResult<IUser>> {
  return withTransaction(async (session) => {
    const result = await createUser(clerkUserData, session);
    if (!result.success) {
      throw new Error(`Failed to create user: ${result.error?.message}`);
    }
    return result;
  });
}

/**
 * Handle Clerk user.updated webhook
 */
export async function handleUserUpdated(
  clerkUserData: ClerkUserData
): Promise<ServiceResult<UpsertResult>> {
  return withTransaction(async (session) => {
    const result = await upsertUser(clerkUserData, session);
    if (!result.success) {
      throw new Error(`Failed to update user: ${result.error?.message}`);
    }
    return result;
  });
}

/**
 * Handle Clerk user.deleted webhook
 */
export async function handleUserDeleted(
  clerkId: string,
  hardDelete: boolean = false
): Promise<ServiceResult<{ deleted: boolean; hardDelete: boolean }>> {
  return withTransaction(async (session) => {
    const result = await deleteUser(clerkId, hardDelete, session);
    if (!result.success) {
      throw new Error(`Failed to delete user: ${result.error?.message}`);
    }
    return result;
  });
}

// ========================================
// CONVERSATION-RELATED USER OPERATIONS
// ========================================

/**
 * Get user with their conversations populated
 * Useful for dashboard and profile views
 */
export async function getUserWithConversations(
  clerkId: string,
  limit: number = 20
): Promise<ServiceResult<IUser & { conversationList: IConversation[] }>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Get user
    const userResult = await getUserByClerkId(clerkId);
    if (!userResult.success) {
      return { success: false, error: userResult.error };
    }

    const user = userResult.data!;

    // Get user's conversations
    const conversations = await Conversation.getUserConversations(
      clerkId,
      limit
    );

    return createSuccessResult({
      ...user,
      conversationList: conversations,
    });
  } catch (error: any) {
    logError('getUserWithConversations', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch user with conversations',
      error.message
    );
  }
}

/**
 * Delete all conversations for a user
 * Called when user account is deleted
 */
export async function deleteUserConversations(
  clerkId: string,
  session?: ClientSession
): Promise<ServiceResult<{ deletedCount: number }>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Delete all user conversations
    const result = await Conversation.deleteUserConversations(clerkId);

    console.log(
      `[UserService.deleteUserConversations] Deleted ${result.deletedCount} conversations for user: ${clerkId}`
    );

    return createSuccessResult({ deletedCount: result.deletedCount });
  } catch (error: any) {
    logError('deleteUserConversations', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to delete user conversations',
      error.message
    );
  }
}

/**
 * Get user conversation statistics
 * Returns conversation counts and activity metrics
 */
export async function getUserConversationStats(clerkId: string): Promise<
  ServiceResult<{
    totalConversations: number;
    activeConversations: number;
    archivedConversations: number;
    recentConversations: number;
    totalMessages: number;
  }>
> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Get various conversation counts
    const [
      totalConversations,
      activeConversations,
      archivedConversations,
      recentConversations,
    ] = await Promise.all([
      Conversation.countUserConversations(clerkId),
      Conversation.getActiveConversations(clerkId).then(
        (convs) => convs.length
      ),
      Conversation.getArchivedConversations(clerkId).then(
        (convs) => convs.length
      ),
      Conversation.getRecentConversations(clerkId, 7).then(
        (convs) => convs.length
      ),
    ]);

    // Calculate total messages across all conversations
    const conversations = await Conversation.find({
      clerkId,
      status: { $ne: 'deleted' },
    });
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    );

    return createSuccessResult({
      totalConversations,
      activeConversations,
      archivedConversations,
      recentConversations,
      totalMessages,
    });
  } catch (error: any) {
    logError('getUserConversationStats', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch user conversation statistics',
      error.message
    );
  }
}

/**
 * Archive all inactive conversations for a user
 * Useful for cleanup operations
 */
export async function archiveInactiveConversations(
  clerkId: string,
  inactiveDays: number = 30
): Promise<ServiceResult<{ archivedCount: number }>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    // Find and archive inactive conversations
    const result = await Conversation.updateMany(
      {
        clerkId,
        status: 'active',
        $or: [
          { lastMessageAt: { $lt: cutoffDate } },
          { updatedAt: { $lt: cutoffDate } },
        ],
      },
      {
        $set: {
          status: 'archived',
          archivedAt: new Date(),
        },
      }
    );

    console.log(
      `[UserService.archiveInactiveConversations] Archived ${result.modifiedCount} conversations for user: ${clerkId}`
    );

    return createSuccessResult({ archivedCount: result.modifiedCount });
  } catch (error: any) {
    logError('archiveInactiveConversations', error, { clerkId, inactiveDays });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to archive inactive conversations',
      error.message
    );
  }
}

// ========================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ========================================

/**
 * Get user with minimal fields for performance
 * Useful for authentication checks and basic operations
 */
export async function getUserBasicInfo(
  clerkId: string
): Promise<
  ServiceResult<
    Pick<IUser, 'clerkId' | 'email' | 'firstName' | 'lastName' | 'isActive'>
  >
> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    const user = await User.findOne(
      { clerkId, isActive: true },
      'clerkId email firstName lastName isActive'
    ).lean();

    if (!user) {
      return createErrorResult('USER_NOT_FOUND', 'User not found', { clerkId });
    }

    return createSuccessResult(user);
  } catch (error: any) {
    logError('getUserBasicInfo', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch user basic info',
      error.message
    );
  }
}

/**
 * Check if user exists without fetching full document
 * Optimized for existence checks
 */
export async function userExists(
  clerkId: string
): Promise<ServiceResult<boolean>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    const exists = await User.exists({ clerkId, isActive: true });
    return createSuccessResult(!!exists);
  } catch (error: any) {
    logError('userExists', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to check user existence',
      error.message
    );
  }
}

/**
 * Batch update user preferences for multiple users
 * Useful for bulk operations or migrations
 */
export async function batchUpdateUserPreferences(
  updates: Array<{
    clerkId: string;
    preferences: Partial<IUser['preferences']>;
  }>,
  session?: ClientSession
): Promise<
  ServiceResult<{
    modifiedCount: number;
    errors: Array<{ clerkId: string; error: string }>;
  }>
> {
  try {
    await connectToDatabase();

    const results = {
      modifiedCount: 0,
      errors: [] as Array<{ clerkId: string; error: string }>,
    };

    for (const update of updates) {
      try {
        const result = await updateUserPreferences(
          update.clerkId,
          update.preferences,
          session
        );

        if (result.success) {
          results.modifiedCount++;
        } else {
          results.errors.push({
            clerkId: update.clerkId,
            error: result.error?.message || 'Unknown error',
          });
        }
      } catch (error: any) {
        results.errors.push({
          clerkId: update.clerkId,
          error: error.message || 'Unknown error',
        });
      }
    }

    console.log(
      `[UserService.batchUpdateUserPreferences] Updated ${results.modifiedCount} users, ${results.errors.length} errors`
    );

    return createSuccessResult(results);
  } catch (error: any) {
    logError('batchUpdateUserPreferences', error, {
      updateCount: updates.length,
    });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to batch update user preferences',
      error.message
    );
  }
}

/**
 * Get user preferences only
 * Optimized for preference-only operations
 */
export async function getUserPreferences(
  clerkId: string
): Promise<ServiceResult<IUser['preferences']>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    const user = await User.findOne(
      { clerkId, isActive: true },
      'preferences'
    ).lean();

    if (!user) {
      return createErrorResult('USER_NOT_FOUND', 'User not found', { clerkId });
    }

    return createSuccessResult(user.preferences);
  } catch (error: any) {
    logError('getUserPreferences', error, { clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch user preferences',
      error.message
    );
  }
}

// ========================================
// CACHE PREPARATION UTILITIES
// ========================================

/**
 * Cache keys for Redis implementation (if needed in the future)
 */
export const CacheKeys = {
  user: (clerkId: string) => `user:${clerkId}`,
  userBasic: (clerkId: string) => `user:basic:${clerkId}`,
  userPreferences: (clerkId: string) => `user:preferences:${clerkId}`,
  userExists: (clerkId: string) => `user:exists:${clerkId}`,
} as const;

/**
 * Cache TTL values (in seconds)
 */
export const CacheTTL = {
  user: 300, // 5 minutes
  userBasic: 600, // 10 minutes
  userPreferences: 180, // 3 minutes
  userExists: 600, // 10 minutes
} as const;

// All types are already exported with their interface declarations above
