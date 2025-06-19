/**
 * Conversation Service for ChatGPT Clone
 *
 * This service provides a comprehensive set of functions for managing chat
 * conversations. It handles creation, retrieval, updates, and deletion of
 * conversations, including all necessary business logic like ownership
 * verification, pagination, and data sanitization.
 *
 * Features:
 * - CRUD operations for conversations
 * - Business logic for conversation management
 * - Ownership verification for all operations
 * - Efficient, indexed queries for performance
 * - Cursor-based pagination for conversation lists
 * - Data validation and sanitization
 * - Consistent error handling and response format
 */
import type { ClientSession, FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import sanitizeHtml from 'sanitize-html';

import { connectToDatabase } from '@/lib/db/connection';
import { Conversation, User } from '@/lib/db/models';
import type { ServiceResult } from '@/lib/db/services/utils';
import {
  createErrorResult,
  createSuccessResult,
  logError,
} from '@/lib/db/services/utils';
import type { IConversation } from '@/types/database';

// ========================================
// CONSTANTS
// ========================================

const MAX_ACTIVE_CONVERSATIONS = 50;
const DEFAULT_CONVERSATION_LIMIT = 20;

// ========================================
// TYPE DEFINITIONS
// ========================================

export type ConversationErrorCode =
  | 'CONVERSATION_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'MAX_CONVERSATIONS_REACHED'
  | 'INVALID_INPUT';

export interface CreateConversationInput {
  clerkId: string;
  title?: string;
  model?: string;
  systemMessage?: string;
}

export interface UpdateConversationInput {
  title?: string;
  model?: string;
  systemMessage?: string;
  isPublic?: boolean;
}

export interface PaginatedConversations {
  conversations: IConversation[];
  nextCursor: string | null;
  total: number;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Sanitizes a conversation title by removing HTML and trimming whitespace.
 * @param title The title to sanitize.
 * @returns The sanitized title.
 */
const sanitizeTitle = (title: string): string =>
  sanitizeHtml(title, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

/**
 * Validates a model name against a list of allowed models.
 * @param model The model name to validate.
 * @returns True if the model is valid, false otherwise.
 */
const isValidModel = (model: string): boolean => {
  const allowedModels = [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-4o',
    'gpt-4o-mini',
  ];
  return allowedModels.includes(model);
};

/**
 * Generates an automatic title for a new conversation.
 * @returns A default conversation title.
 */
const generateAutoTitle = (): string =>
  `New Conversation - ${new Date().toLocaleString()}`;

// ========================================
// CORE SERVICE FUNCTIONS
// ========================================

/**
 * Creates a new conversation for a user.
 * @param input The input data for creating the conversation.
 * @param session An optional Mongoose client session.
 * @returns A service result with the newly created conversation.
 */
export async function createConversation(
  input: CreateConversationInput,
  session?: ClientSession
): Promise<ServiceResult<IConversation, ConversationErrorCode>> {
  try {
    await connectToDatabase();
    const { clerkId, title, model, systemMessage } = input;

    const userQuery = User.findOne({ clerkId, isActive: true });
    if (session) userQuery.session(session);
    const user = await userQuery;
    if (!user) {
      return createErrorResult('USER_NOT_FOUND', 'User not found.');
    }

    const activeCountQuery = Conversation.countDocuments({
      clerkId,
      status: 'active',
    });
    if (session) activeCountQuery.session(session);
    const activeCount = await activeCountQuery;
    if (activeCount >= MAX_ACTIVE_CONVERSATIONS) {
      return createErrorResult(
        'MAX_CONVERSATIONS_REACHED',
        `Limit of ${MAX_ACTIVE_CONVERSATIONS} active conversations reached.`
      );
    }

    const newConversationData: Partial<IConversation> = {
      clerkId,
      userId: user._id,
      title: title ? sanitizeTitle(title) : generateAutoTitle(),
      settings: {
        aiModel: 'gpt-3.5-turbo',
        temperature: 1,
        maxTokens: 2048,
        isPublic: false,
        allowAnalytics: true,
      },
    };

    if (model) {
      if (!isValidModel(model)) {
        return createErrorResult('VALIDATION_ERROR', 'Invalid AI model.');
      }
      newConversationData.settings!.aiModel = model;
    }
    if (systemMessage) {
      newConversationData.settings!.systemMessage = systemMessage;
    }

    const [newConversation] = await Conversation.create(
      [newConversationData],
      session ? { session } : undefined
    );
    return createSuccessResult(newConversation.toObject());
  } catch (error: any) {
    logError('createConversation', error, input);
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to create conversation.'
    );
  }
}

/**
 * Retrieves a single conversation by its ID, verifying user ownership.
 * @param conversationId The ID of the conversation to retrieve.
 * @param clerkId The Clerk ID of the user requesting the conversation.
 * @returns A service result with the conversation data.
 */
export async function getConversation(
  conversationId: string,
  clerkId: string
): Promise<ServiceResult<IConversation, ConversationErrorCode>> {
  try {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult(
        'INVALID_INPUT',
        'Invalid conversation ID format.'
      );
    }

    const conversation = await Conversation.findOne({
      _id: new Types.ObjectId(conversationId),
      clerkId,
      status: { $ne: 'deleted' },
    }).lean();

    if (!conversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found or access denied.'
      );
    }
    return createSuccessResult(conversation);
  } catch (error: any) {
    logError('getConversation', error, { conversationId, clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to retrieve conversation.'
    );
  }
}

/**
 * Retrieves a paginated list of a user's conversations.
 * @param clerkId The Clerk ID of the user.
 * @param limit The number of conversations to return.
 * @param cursor The cursor for pagination (ISO date string).
 * @returns A service result with the paginated conversations.
 */
export async function getUserConversations(
  clerkId: string,
  limit: number = DEFAULT_CONVERSATION_LIMIT,
  cursor?: string
): Promise<ServiceResult<PaginatedConversations, ConversationErrorCode>> {
  try {
    await connectToDatabase();
    const query: FilterQuery<IConversation> = { clerkId, status: 'active' };
    if (cursor) {
      query.lastMessageAt = { $lt: new Date(cursor) };
    }

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1, _id: -1 })
      .limit(limit)
      .lean<IConversation[]>();

    const total = await Conversation.countDocuments({
      clerkId,
      status: 'active',
    });

    const nextCursor =
      conversations.length === limit
        ? (conversations[
            conversations.length - 1
          ].lastMessageAt?.toISOString() ?? null)
        : null;

    return createSuccessResult({ conversations, nextCursor, total });
  } catch (error: any) {
    logError('getUserConversations', error, { clerkId, limit, cursor });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to retrieve conversations.'
    );
  }
}

/**
 * Updates a conversation's title or settings.
 * @param conversationId The ID of the conversation to update.
 * @param clerkId The Clerk ID of the user performing the update.
 * @param updates The updates to apply to the conversation.
 * @param session An optional Mongoose client session.
 * @returns A service result with the updated conversation.
 */
export async function updateConversation(
  conversationId: string,
  clerkId: string,
  updates: UpdateConversationInput,
  session?: ClientSession
): Promise<ServiceResult<IConversation, ConversationErrorCode>> {
  try {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult(
        'INVALID_INPUT',
        'Invalid conversation ID format.'
      );
    }

    const updatePayload: Record<string, any> = {};
    if (updates.title) updatePayload.title = sanitizeTitle(updates.title);
    if (updates.model) {
      if (!isValidModel(updates.model)) {
        return createErrorResult('VALIDATION_ERROR', 'Invalid AI model.');
      }
      updatePayload['settings.aiModel'] = updates.model;
    }
    if (updates.systemMessage) {
      updatePayload['settings.systemMessage'] = updates.systemMessage;
    }
    if (typeof updates.isPublic === 'boolean') {
      updatePayload['settings.isPublic'] = updates.isPublic;
    }

    const updatedConversation = await Conversation.findOneAndUpdate(
      {
        _id: new Types.ObjectId(conversationId),
        clerkId,
        status: { $ne: 'deleted' },
      },
      { $set: updatePayload },
      { new: true, ...(session ? { session } : {}) }
    ).lean();

    if (!updatedConversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found or access denied.'
      );
    }
    return createSuccessResult(updatedConversation);
  } catch (error: any) {
    logError('updateConversation', error, { conversationId, clerkId, updates });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to update conversation.'
    );
  }
}

/**
 * Soft deletes a conversation.
 * @param conversationId The ID of the conversation to delete.
 * @param clerkId The Clerk ID of the user performing the deletion.
 * @param session An optional Mongoose client session.
 * @returns A service result indicating success.
 */
export async function deleteConversation(
  conversationId: string,
  clerkId: string,
  session?: ClientSession
): Promise<ServiceResult<{ deleted: true }, ConversationErrorCode>> {
  try {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult(
        'INVALID_INPUT',
        'Invalid conversation ID format.'
      );
    }

    const result = await Conversation.updateOne(
      { _id: new Types.ObjectId(conversationId), clerkId },
      { $set: { status: 'deleted', deletedAt: new Date() } },
      session ? { session } : undefined
    );

    if (result.matchedCount === 0) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found or access denied.'
      );
    }
    return createSuccessResult({ deleted: true });
  } catch (error: any) {
    logError('deleteConversation', error, { conversationId, clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to delete conversation.'
    );
  }
}

/**
 * Archives a conversation.
 * @param conversationId The ID of the conversation to archive.
 * @param clerkId The Clerk ID of the user performing the archival.
 * @param session An optional Mongoose client session.
 * @returns A service result with the archived conversation.
 */
export async function archiveConversation(
  conversationId: string,
  clerkId: string,
  session?: ClientSession
): Promise<ServiceResult<IConversation, ConversationErrorCode>> {
  try {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult(
        'INVALID_INPUT',
        'Invalid conversation ID format.'
      );
    }

    const archivedConversation = await Conversation.findOneAndUpdate(
      { _id: new Types.ObjectId(conversationId), clerkId, status: 'active' },
      { $set: { status: 'archived', archivedAt: new Date() } },
      { new: true, ...(session ? { session } : {}) }
    ).lean();

    if (!archivedConversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Active conversation not found or access denied.'
      );
    }
    return createSuccessResult(archivedConversation);
  } catch (error: any) {
    logError('archiveConversation', error, { conversationId, clerkId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to archive conversation.'
    );
  }
}

export async function getConversationById(
  id: string
): Promise<IConversation | null> {
  await connectToDatabase();
  const conversation = await Conversation.findById(id).lean();
  return conversation;
}

export async function getConversationsForUser(
  userId: string
): Promise<IConversation[]> {
  await connectToDatabase();
  const conversations = await Conversation.find({ clerkId: userId }).lean();
  return conversations;
}
