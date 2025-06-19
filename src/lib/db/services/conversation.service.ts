/**
 * Conversation Service for ChatGPT Clone
 *
 * Service layer for conversation management that handles CRUD operations,
 * user associations, and conversation lifecycle management. Provides clean
 * abstractions for conversation operations with proper error handling.
 *
 * Features:
 * - Complete CRUD operations for conversations
 * - User-specific conversation management
 * - Search and filtering capabilities
 * - Archive and pin functionality
 * - Message count and token tracking
 * - Comprehensive error handling and logging
 */

import type { ClientSession } from 'mongoose';
import { startSession } from 'mongoose';

import { connectToDatabase } from '@/lib/db/connection';
import { Conversation, User } from '@/lib/db/models';
import type {
  CreateConversationData,
  IConversation,
  IUser,
} from '@/types/database';

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Conversation creation input
 */
export interface CreateConversationInput {
  clerkId: string;
  title?: string;
  description?: string;
  aiModel?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Conversation update input
 */
export interface UpdateConversationInput {
  title?: string;
  description?: string;
  aiModel?: string;
  temperature?: number;
  maxTokens?: number;
  systemMessage?: string;
  isPublic?: boolean;
  tags?: string[];
}

/**
 * Service operation result
 */
export interface ConversationServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Conversation query options
 */
export interface ConversationQueryOptions {
  limit?: number;
  skip?: number;
  sortBy?: 'updatedAt' | 'createdAt' | 'lastMessageAt' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
  status?: 'active' | 'archived' | 'deleted';
  includeDeleted?: boolean;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create standardized error result
 */
function createErrorResult(
  code: string,
  message: string,
  details?: any
): ConversationServiceResult {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Create standardized success result
 */
function createSuccessResult<T>(data: T): ConversationServiceResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Log service errors with context
 */
function logError(operation: string, error: any, context?: any): void {
  console.error(`[ConversationService.${operation}] Error:`, {
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
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
// CORE CONVERSATION OPERATIONS
// ========================================

/**
 * Create a new conversation for a user
 */
export async function createConversation(
  input: CreateConversationInput,
  session?: ClientSession
): Promise<ConversationServiceResult<IConversation>> {
  try {
    await connectToDatabase();

    // Validate input
    if (!isValidClerkId(input.clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Verify user exists
    const user = await User.findOne({ clerkId: input.clerkId }).session(
      session || null
    );
    if (!user) {
      return createErrorResult('USER_NOT_FOUND', 'User not found');
    }

    // Prepare conversation data
    const conversationData = {
      clerkId: input.clerkId,
      userId: user._id,
      title: input.title || `New Chat ${new Date().toLocaleDateString()}`,
      description: input.description,
      settings: {
        aiModel: input.aiModel || 'gpt-3.5-turbo',
        temperature: input.temperature ?? 1,
        maxTokens: input.maxTokens ?? 2048,
        systemMessage: input.systemMessage,
        isPublic: input.isPublic ?? false,
        allowAnalytics: true,
      },
      tags: input.tags || [],
      status: 'active' as const,
    };

    // Create conversation
    const [conversation] = await Conversation.create([conversationData], {
      session,
    });

    console.log(
      `[ConversationService.createConversation] Created conversation: ${conversation._id} for user: ${input.clerkId}`
    );

    return createSuccessResult(conversation);
  } catch (error: any) {
    logError('createConversation', error, { clerkId: input.clerkId });

    if (error.name === 'ValidationError') {
      return createErrorResult(
        'VALIDATION_ERROR',
        'Conversation data validation failed',
        error.errors
      );
    }

    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to create conversation',
      error.message
    );
  }
}

/**
 * Get conversation by ID with user verification
 */
export async function getConversationById(
  conversationId: string,
  clerkId?: string
): Promise<ConversationServiceResult<IConversation>> {
  try {
    await connectToDatabase();

    const query: any = { _id: conversationId };
    if (clerkId) {
      query.clerkId = clerkId;
    }

    const conversation = await Conversation.findOne(query).populate(
      'messages',
      'content role createdAt',
      undefined,
      { sort: { createdAt: 1 } }
    );

    if (!conversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found'
      );
    }

    return createSuccessResult(conversation);
  } catch (error: any) {
    logError('getConversationById', error, { conversationId, clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch conversation',
      error.message
    );
  }
}

/**
 * Update conversation details
 */
export async function updateConversation(
  conversationId: string,
  clerkId: string,
  updates: UpdateConversationInput,
  session?: ClientSession
): Promise<ConversationServiceResult<IConversation>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    // Update settings if provided
    const settingsUpdates: any = {};
    if (updates.aiModel !== undefined) {
      settingsUpdates['settings.aiModel'] = updates.aiModel;
    }
    if (updates.temperature !== undefined) {
      settingsUpdates['settings.temperature'] = updates.temperature;
    }
    if (updates.maxTokens !== undefined) {
      settingsUpdates['settings.maxTokens'] = updates.maxTokens;
    }
    if (updates.systemMessage !== undefined) {
      settingsUpdates['settings.systemMessage'] = updates.systemMessage;
    }
    if (updates.isPublic !== undefined) {
      settingsUpdates['settings.isPublic'] = updates.isPublic;
    }

    const finalUpdateData = { ...updateData, ...settingsUpdates };

    if (Object.keys(finalUpdateData).length === 0) {
      return createErrorResult('NO_UPDATES', 'No valid updates provided');
    }

    // Update conversation
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clerkId, status: { $ne: 'deleted' } },
      { $set: finalUpdateData },
      { new: true, runValidators: true, session }
    );

    if (!conversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found or access denied'
      );
    }

    console.log(
      `[ConversationService.updateConversation] Updated conversation: ${conversationId}`
    );

    return createSuccessResult(conversation);
  } catch (error: any) {
    logError('updateConversation', error, { conversationId, clerkId, updates });

    if (error.name === 'ValidationError') {
      return createErrorResult(
        'VALIDATION_ERROR',
        'Update data validation failed',
        error.errors
      );
    }

    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to update conversation',
      error.message
    );
  }
}

/**
 * Delete conversation (soft delete by default)
 */
export async function deleteConversation(
  conversationId: string,
  clerkId: string,
  hardDelete: boolean = false,
  session?: ClientSession
): Promise<ConversationServiceResult<{ deleted: boolean }>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    if (hardDelete) {
      // Hard delete - permanently remove
      const result = await Conversation.findOneAndDelete(
        { _id: conversationId, clerkId },
        { session }
      );

      if (!result) {
        return createErrorResult(
          'CONVERSATION_NOT_FOUND',
          'Conversation not found'
        );
      }

      console.log(
        `[ConversationService.deleteConversation] Hard deleted conversation: ${conversationId}`
      );
    } else {
      // Soft delete - mark as deleted
      const result = await Conversation.softDeleteConversation(conversationId);

      if (!result) {
        return createErrorResult(
          'CONVERSATION_NOT_FOUND',
          'Conversation not found'
        );
      }

      console.log(
        `[ConversationService.deleteConversation] Soft deleted conversation: ${conversationId}`
      );
    }

    return createSuccessResult({ deleted: true });
  } catch (error: any) {
    logError('deleteConversation', error, {
      conversationId,
      clerkId,
      hardDelete,
    });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to delete conversation',
      error.message
    );
  }
}

// ========================================
// CONVERSATION MANAGEMENT OPERATIONS
// ========================================

/**
 * Archive a conversation
 */
export async function archiveConversation(
  conversationId: string,
  clerkId: string
): Promise<ConversationServiceResult<IConversation>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Verify ownership and archive
    const conversation = await Conversation.findOne({
      _id: conversationId,
      clerkId,
    });
    if (!conversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found'
      );
    }

    const archivedConversation =
      await Conversation.archiveConversation(conversationId);

    if (!archivedConversation) {
      return createErrorResult(
        'ARCHIVE_FAILED',
        'Failed to archive conversation'
      );
    }

    console.log(
      `[ConversationService.archiveConversation] Archived conversation: ${conversationId}`
    );

    return createSuccessResult(archivedConversation);
  } catch (error: any) {
    logError('archiveConversation', error, { conversationId, clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to archive conversation',
      error.message
    );
  }
}

/**
 * Pin/Unpin a conversation
 */
export async function toggleConversationPin(
  conversationId: string,
  clerkId: string,
  pin: boolean
): Promise<ConversationServiceResult<IConversation>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    // Verify ownership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      clerkId,
    });
    if (!conversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found'
      );
    }

    const updatedConversation = pin
      ? await Conversation.pinConversation(conversationId)
      : await Conversation.unpinConversation(conversationId);

    if (!updatedConversation) {
      return createErrorResult(
        'PIN_FAILED',
        `Failed to ${pin ? 'pin' : 'unpin'} conversation`
      );
    }

    console.log(
      `[ConversationService.toggleConversationPin] ${pin ? 'Pinned' : 'Unpinned'} conversation: ${conversationId}`
    );

    return createSuccessResult(updatedConversation);
  } catch (error: any) {
    logError('toggleConversationPin', error, { conversationId, clerkId, pin });
    return createErrorResult(
      'DATABASE_ERROR',
      `Failed to ${pin ? 'pin' : 'unpin'} conversation`,
      error.message
    );
  }
}

/**
 * Get user conversations with filtering and pagination
 */
export async function getUserConversations(
  clerkId: string,
  options: ConversationQueryOptions = {}
): Promise<ConversationServiceResult<IConversation[]>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    const {
      limit = 50,
      skip = 0,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      status,
      includeDeleted = false,
    } = options;

    // Build query
    const query: any = { clerkId };

    if (status) {
      query.status = status;
    } else if (!includeDeleted) {
      query.status = { $ne: 'deleted' };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const conversations = await Conversation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('messages', 'content role createdAt', undefined, {
        sort: { createdAt: -1 },
        limit: 1,
      });

    return createSuccessResult(conversations);
  } catch (error: any) {
    logError('getUserConversations', error, { clerkId, options });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to fetch user conversations',
      error.message
    );
  }
}

/**
 * Search user conversations
 */
export async function searchUserConversations(
  clerkId: string,
  query: string,
  limit: number = 20
): Promise<ConversationServiceResult<IConversation[]>> {
  try {
    await connectToDatabase();

    if (!isValidClerkId(clerkId)) {
      return createErrorResult(
        'INVALID_CLERK_ID',
        'Invalid Clerk user ID format'
      );
    }

    if (!query || query.trim().length === 0) {
      return createErrorResult('INVALID_QUERY', 'Search query is required');
    }

    const conversations = await Conversation.searchUserConversations(
      clerkId,
      query.trim(),
      limit
    );

    return createSuccessResult(conversations);
  } catch (error: any) {
    logError('searchUserConversations', error, { clerkId, query });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to search conversations',
      error.message
    );
  }
}

// All functions are already exported above with their declarations
