/**
 * Message Service for ChatGPT Clone
 *
 * Handles all message related operations including creation, retrieval,
 * updates, deletion and statistics. Keeps conversation state in-sync
 * (messageCount, totalTokens, lastMessageAt) and provides utility bulk
 * operations for importing / cleaning conversations.
 */

import type { ClientSession, FilterQuery } from 'mongoose';
import { Types } from 'mongoose';

import { connectToDatabase } from '@/lib/db/connection';
import { Conversation, Message } from '@/lib/db/models';
import {
  createErrorResult,
  createSuccessResult,
  logError,
  type ServiceResult,
} from '@/lib/db/services/utils';
import type {
  CreateMessageData,
  IMessage,
  MessageRole,
  UpdateMessageData,
} from '@/types/database';

// ========================================
// CONSTANTS & VALIDATION HELPERS
// ========================================

const ALLOWED_ROLES: MessageRole[] = ['system', 'user', 'assistant'];
const MAX_CONTENT_LENGTH = 16_000; // characters – sane default

/**
 * Very naive token counter – assumes ~4 characters per token.
 * Replace with a proper tokenizer when available.
 */
const countTokens = (text: string): number => {
  return Math.ceil(text.trim().length / 4);
};

/** Validate an attachment sub-document */
function isValidAttachment(attachment: any): boolean {
  if (!attachment) return false;
  const requiredFields = [
    'originalName',
    'fileName',
    'fileSize',
    'mimeType',
    'storageProvider',
    'storageUrl',
  ];
  return requiredFields.every(
    (f) =>
      typeof attachment[f] === 'string' || typeof attachment[f] === 'number'
  );
}

// ========================================
// ERROR CODES
// ========================================

export type MessageErrorCode =
  | 'MESSAGE_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'INVALID_ROLE'
  | 'INVALID_INPUT'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR';

// ========================================
// CORE SERVICE FUNCTIONS
// ========================================

/**
 * Creates a new message inside a conversation and keeps conversation stats in sync.
 *
 * @param conversationId The parent conversation id
 * @param messageData    Partial message data (role, content, etc.)
 * @param session        Optional mongoose session – useful when caller already opened one
 */
export async function createMessage(
  conversationId: string,
  messageData: Omit<CreateMessageData, 'conversationId'>,
  session?: ClientSession
): Promise<ServiceResult<any, MessageErrorCode>> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid conversation id.');
    }

    // Role validation
    if (!ALLOWED_ROLES.includes(messageData.role as MessageRole)) {
      return createErrorResult('INVALID_ROLE', 'Invalid message role.');
    }

    // Content validation
    if (!messageData.content || typeof messageData.content !== 'string') {
      return createErrorResult(
        'VALIDATION_ERROR',
        'Message content is required.'
      );
    }
    if (messageData.content.length > MAX_CONTENT_LENGTH) {
      return createErrorResult(
        'VALIDATION_ERROR',
        `Message content exceeds ${MAX_CONTENT_LENGTH} characters.`
      );
    }

    // Fetch conversation (lean false bc we need _id reference later)
    const conversationQuery = Conversation.findById(conversationId);
    if (session) conversationQuery.session(session);
    const conversation = await conversationQuery;
    if (!conversation) {
      return createErrorResult(
        'CONVERSATION_NOT_FOUND',
        'Conversation not found.'
      );
    }

    // Token counting
    const tokenCount = countTokens(messageData.content);

    // Ensure aiMetadata exists so we can store tokenCount
    const enrichedData: any = { ...messageData };
    if (!enrichedData.aiMetadata) {
      enrichedData.aiMetadata = {
        model: conversation.settings.aiModel,
        temperature: conversation.settings.temperature ?? 1,
        maxTokens: conversation.settings.maxTokens ?? 2048,
        tokenCount,
        finishReason: 'stop',
      };
    } else {
      enrichedData.aiMetadata.tokenCount = tokenCount;
    }

    // Prepare message document
    const messageDoc = new Message({
      ...enrichedData,
      conversationId: conversation._id,
    });

    if (session) await messageDoc.save({ session });
    else await messageDoc.save();

    // Keep reference list short? Conversation.messages is array of ObjectId – push new msg id
    conversation.messages.push(messageDoc._id);
    conversation.messageCount += 1;
    conversation.totalTokens += tokenCount;
    conversation.lastMessageAt = new Date();

    if (session) await conversation.save({ session });
    else await conversation.save();

    return createSuccessResult(messageDoc.toObject() as any);
  } catch (error: any) {
    logError('createMessage', error, { conversationId, messageData });
    return createErrorResult('DATABASE_ERROR', 'Failed to create message.');
  }
}

// ----------------------------------------
// GET MESSAGES WITH PAGINATION
// ----------------------------------------

export interface PaginatedMessages {
  messages: Pick<
    IMessage,
    | '_id'
    | 'role'
    | 'content'
    | 'createdAt'
    | 'aiMetadata'
    | 'isEdited'
    | 'attachments'
  >[];
  nextCursor: string | null;
  total: number;
}

export async function getMessages(
  conversationId: string,
  limit = 50,
  cursor?: string
): Promise<ServiceResult<any, MessageErrorCode>> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid conversation id.');
    }

    const query: FilterQuery<IMessage> = {
      conversationId: new Types.ObjectId(conversationId),
      deletedAt: { $exists: false },
    } as any;

    if (cursor) {
      // Using createdAt for cursor pagination – get messages older than cursor
      query.createdAt = { $lt: new Date(cursor) } as any;
    }

    const projection = {
      role: 1,
      content: 1,
      createdAt: 1,
      aiMetadata: 1,
      isEdited: 1,
      attachments: 1,
    } as const;

    const messages = await Message.find(query, projection as any)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      deletedAt: { $exists: false },
    });

    const nextCursor =
      messages.length === limit
        ? (messages[messages.length - 1].createdAt?.toISOString() ?? null)
        : null;

    return createSuccessResult({
      messages: messages.reverse(),
      nextCursor,
      total,
    } as any);
  } catch (error: any) {
    logError('getMessages', error, { conversationId, limit, cursor });
    return createErrorResult('DATABASE_ERROR', 'Failed to fetch messages.');
  }
}

// ----------------------------------------
// UPDATE MESSAGE (EDIT)
// ----------------------------------------

export async function updateMessage(
  messageId: string,
  updates: Pick<UpdateMessageData, 'content' | 'attachments'>,
  session?: ClientSession
): Promise<ServiceResult<any, MessageErrorCode>> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(messageId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid message id.');
    }

    const message = await Message.findById(messageId).session(session || null);
    if (!message) {
      return createErrorResult('MESSAGE_NOT_FOUND', 'Message not found.');
    }

    if (updates.content) {
      if (
        typeof updates.content !== 'string' ||
        updates.content.trim().length === 0
      ) {
        return createErrorResult(
          'VALIDATION_ERROR',
          'Content must be a non-empty string.'
        );
      }
      if (updates.content.length > MAX_CONTENT_LENGTH) {
        return createErrorResult(
          'VALIDATION_ERROR',
          `Message content exceeds ${MAX_CONTENT_LENGTH} characters.`
        );
      }
      const previousTokens =
        message.aiMetadata?.tokenCount ?? countTokens(message.content);
      message.content = updates.content.trim();
      // Re-calculate tokens
      const newTokens = countTokens(message.content);
      const tokenDiff = newTokens - previousTokens;
      // adjust conversation totals if diff exists
      if (tokenDiff !== 0) {
        await Conversation.findByIdAndUpdate(
          message.conversationId,
          { $inc: { totalTokens: tokenDiff } },
          { session }
        );
      }
      if (!message.aiMetadata) message.aiMetadata = {} as any;
      message.aiMetadata!.tokenCount = newTokens;
    }

    if (updates.attachments) {
      if (
        !Array.isArray(updates.attachments) ||
        updates.attachments.some((a) => !isValidAttachment(a))
      ) {
        return createErrorResult(
          'VALIDATION_ERROR',
          'Invalid attachment data.'
        );
      }
      // Replace attachments completely for simplicity
      message.attachments = updates.attachments as any;
    }

    await message.save({ session });

    return createSuccessResult(message.toObject() as any);
  } catch (error: any) {
    logError('updateMessage', error, { messageId, updates });
    return createErrorResult('DATABASE_ERROR', 'Failed to update message.');
  }
}

// ----------------------------------------
// DELETE MESSAGE (SOFT DELETE)
// ----------------------------------------

export async function deleteMessage(
  messageId: string,
  session?: ClientSession
): Promise<ServiceResult<{ deleted: true }, MessageErrorCode>> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(messageId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid message id.');
    }

    const message = await Message.findById(messageId).session(session || null);
    if (!message) {
      return createErrorResult('MESSAGE_NOT_FOUND', 'Message not found.');
    }

    // Soft delete
    message.deletedAt = new Date();
    await message.save({ session });

    // Update conversation stats (decrement counts)
    const tokenCount =
      message.aiMetadata?.tokenCount ?? countTokens(message.content);
    await Conversation.findByIdAndUpdate(
      message.conversationId,
      {
        $inc: { messageCount: -1, totalTokens: -tokenCount },
      },
      { session }
    );

    return createSuccessResult({ deleted: true });
  } catch (error: any) {
    logError('deleteMessage', error, { messageId });
    return createErrorResult('DATABASE_ERROR', 'Failed to delete message.');
  }
}

// ----------------------------------------
// ADD ATTACHMENT TO MESSAGE
// ----------------------------------------

export async function addAttachment(
  messageId: string,
  attachment: any,
  session?: ClientSession
): Promise<ServiceResult<any, MessageErrorCode>> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(messageId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid message id.');
    }

    if (!isValidAttachment(attachment)) {
      return createErrorResult('VALIDATION_ERROR', 'Invalid attachment data.');
    }

    const update = { $push: { attachments: attachment } };
    const options = { new: true, runValidators: true, session } as const;

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      update,
      options
    ).lean();

    if (!updatedMessage) {
      return createErrorResult('MESSAGE_NOT_FOUND', 'Message not found.');
    }

    return createSuccessResult(updatedMessage as any);
  } catch (error: any) {
    logError('addAttachment', error, { messageId, attachment });
    return createErrorResult('DATABASE_ERROR', 'Failed to add attachment.');
  }
}

// ========================================
// BULK OPERATIONS
// ========================================

/**
 * Bulk create messages – useful for importing entire conversation histories.
 * Each item must include conversationId to which it belongs.
 */
export async function bulkCreateMessages(
  messages: Array<
    { conversationId: string } & Omit<CreateMessageData, 'conversationId'>
  >,
  session?: ClientSession
): Promise<
  ServiceResult<{ inserted: number; failed: number }, MessageErrorCode>
> {
  try {
    await connectToDatabase();

    if (!Array.isArray(messages) || messages.length === 0) {
      return createErrorResult('INVALID_INPUT', 'No messages provided.');
    }

    const docs = [] as any[];
    const convUpdates: Record<
      string,
      { messageCount: number; tokenCount: number }
    > = {};

    for (const m of messages) {
      if (!Types.ObjectId.isValid(m.conversationId)) continue;
      if (!ALLOWED_ROLES.includes(m.role as MessageRole)) continue;
      if (typeof m.content !== 'string' || m.content.length === 0) continue;
      const tokens = countTokens(m.content);

      const doc = {
        ...m,
        conversationId: new Types.ObjectId(m.conversationId),
        tokenCount: tokens,
      } as any;
      docs.push(doc);

      if (!convUpdates[m.conversationId]) {
        convUpdates[m.conversationId] = { messageCount: 0, tokenCount: 0 };
      }
      convUpdates[m.conversationId].messageCount += 1;
      convUpdates[m.conversationId].tokenCount += tokens;
    }

    if (docs.length === 0) {
      return createErrorResult(
        'VALIDATION_ERROR',
        'No valid messages to insert.'
      );
    }

    const inserted = await Message.insertMany(docs, {
      session,
      ordered: false,
    });

    // Update conversations in bulk
    const bulkOps = Object.entries(convUpdates).map(([convId, stats]) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(convId) },
        update: {
          $inc: {
            messageCount: stats.messageCount,
            totalTokens: stats.tokenCount,
          },
          $set: { lastMessageAt: new Date() },
        },
      },
    }));

    if (bulkOps.length > 0) {
      await Conversation.bulkWrite(bulkOps, { session });
    }

    return createSuccessResult({
      inserted: inserted.length,
      failed: messages.length - inserted.length,
    });
  } catch (error: any) {
    logError('bulkCreateMessages', error);
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to bulk insert messages.'
    );
  }
}

// Clean up all messages of a conversation
export async function deleteConversationMessages(
  conversationId: string,
  session?: ClientSession
): Promise<ServiceResult<{ deletedCount: number }, MessageErrorCode>> {
  try {
    await connectToDatabase();
    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid conversation id.');
    }

    const filter = { conversationId: new Types.ObjectId(conversationId) };
    const { deletedCount } = await Message.deleteMany(filter).session(
      session || null
    );

    // reset message counters for conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { messageCount: 0, totalTokens: 0 },
    });

    return createSuccessResult({ deletedCount: deletedCount ?? 0 });
  } catch (error: any) {
    logError('deleteConversationMessages', error, { conversationId });
    return createErrorResult(
      'DATABASE_ERROR',
      'Failed to delete conversation messages.'
    );
  }
}

// Aggregated stats for a conversation
export async function getMessageStats(conversationId: string): Promise<
  ServiceResult<
    {
      totalMessages: number;
      totalTokens: number;
      firstMessageAt?: Date;
      lastMessageAt?: Date;
    },
    MessageErrorCode
  >
> {
  try {
    await connectToDatabase();

    if (!Types.ObjectId.isValid(conversationId)) {
      return createErrorResult('INVALID_INPUT', 'Invalid conversation id.');
    }

    const result = await Message.aggregate([
      {
        $match: {
          conversationId: new Types.ObjectId(conversationId),
          deletedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: '$conversationId',
          totalMessages: { $sum: 1 },
          totalTokens: {
            $sum: {
              $ifNull: [
                '$aiMetadata.tokenCount',
                { $ceil: { $divide: [{ $strLenCP: '$content' }, 4] } },
              ],
            },
          },
          firstMessageAt: { $min: '$createdAt' },
          lastMessageAt: { $max: '$createdAt' },
        },
      },
    ]);

    if (result.length === 0) {
      return createSuccessResult({ totalMessages: 0, totalTokens: 0 });
    }

    const stats = result[0];
    return createSuccessResult({
      totalMessages: stats.totalMessages,
      totalTokens: stats.totalTokens,
      firstMessageAt: stats.firstMessageAt,
      lastMessageAt: stats.lastMessageAt,
    });
  } catch (error: any) {
    logError('getMessageStats', error, { conversationId });
    return createErrorResult('DATABASE_ERROR', 'Failed to get message stats.');
  }
}
