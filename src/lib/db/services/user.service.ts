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

import { startSession, ClientSession } from 'mongoose';
import { User } from '@/lib/db/models';
import { connectToDatabase } from '@/lib/db/connection';
import type { IUser } from '@/types/database';

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
      emailNotifications: true
    },
    subscription: {
      plan: 'free',
      status: 'active',
      cancelAtPeriodEnd: false
    }
  };
}

/**
 * Sanitize and validate user input data
 */
export function sanitizeUserInput(input: Partial<UpdateUserInput>): Partial<UpdateUserInput> {
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
  return typeof clerkId === 'string' && clerkId.length > 0 && clerkId.startsWith('user_');
}

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

/**
 * Create standardized error result
 */
function createErrorResult(code: ErrorCode, message: string, details?: any): ServiceResult {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date()
    }
  };
}

/**
 * Create success result
 */
function createSuccessResult<T>(data: T): ServiceResult<T> {
  return {
    success: true,
    data
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
    timestamp: new Date().toISOString()
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
      return createErrorResult('INVALID_CLERK_ID', 'Invalid Clerk user ID format');
    }

    // Transform Clerk data to our schema
    const userData = transformClerkUser(clerkUserData);

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId: userData.clerkId }).session(session || null);
    if (existingUser) {
      return createErrorResult(
        'USER_ALREADY_EXISTS', 
        'User with this Clerk ID already exists',
        { clerkId: userData.clerkId }
      );
    }

    // Create new user
    const [newUser] = await User.create([{
      ...userData,
      lastLoginAt: new Date(),
      usage: {
        totalMessages: 0,
        totalTokens: 0,
        messagesThisMonth: 0,
        tokensThisMonth: 0,
        lastResetDate: new Date()
      }
    }], { session });

    console.log(`[UserService.createUser] User created successfully: ${userData.clerkId}`);
    return createSuccessResult(newUser);

  } catch (error: any) {
    logError('createUser', error, { clerkId: clerkUserData?.id });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) { // Duplicate key error
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
      return createErrorResult('INVALID_CLERK_ID', 'Invalid Clerk user ID format');
    }

    // Sanitize input data
    const sanitizedUpdates = sanitizeUserInput(updates);

    // Update user with validation
    const updatedUser = await User.findOneAndUpdate(
      { clerkId, isActive: true },
      {
        $set: {
          ...sanitizedUpdates,
          lastLoginAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true,
        session
      }
    );

    if (!updatedUser) {
      return createErrorResult(
        'USER_NOT_FOUND',
        'User not found or inactive',
        { clerkId }
      );
    }

    console.log(`[UserService.updateUser] User updated successfully: ${clerkId}`);
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
      return createErrorResult('INVALID_CLERK_ID', 'Invalid Clerk user ID format');
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      clerkId: clerkUserData.id 
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
          username: userData.username
        },
        session
      );

      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }

      return createSuccessResult({
        user: updateResult.data!,
        created: false
      });
    } else {
      // Create new user
      const createResult = await createUser(clerkUserData, session);
      
      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }

      return createSuccessResult({
        user: createResult.data!,
        created: true
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
      return createErrorResult('INVALID_CLERK_ID', 'Invalid Clerk user ID format');
    }

    if (hardDelete) {
      // Hard delete - permanently remove user
      const deletedUser = await User.findOneAndDelete(
        { clerkId },
        { session }
      );

      if (!deletedUser) {
        return createErrorResult(
          'USER_NOT_FOUND',
          'User not found',
          { clerkId }
        );
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
            deletedAt: new Date()
          }
        },
        { session }
      );

      if (!updatedUser) {
        return createErrorResult(
          'USER_NOT_FOUND',
          'User not found',
          { clerkId }
        );
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
      return createErrorResult('INVALID_CLERK_ID', 'Invalid Clerk user ID format');
    }

    const query = includeDeleted 
      ? { clerkId }
      : { clerkId, isActive: true };

    const user = await User.findOne(query);

    if (!user) {
      return createErrorResult(
        'USER_NOT_FOUND',
        'User not found',
        { clerkId }
      );
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
export async function handleUserCreated(clerkUserData: ClerkUserData): Promise<ServiceResult<IUser>> {
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
export async function handleUserUpdated(clerkUserData: ClerkUserData): Promise<ServiceResult<UpsertResult>> {
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

// All types are already exported with their interface declarations above 