/**
 * Message Model for ChatGPT Clone
 *
 * This model represents individual messages within a conversation. It includes
 * rich metadata, support for attachments, and a history of edits.
 */

import type { Document, Model, Types } from 'mongoose';
import { model, models, Schema } from 'mongoose';

import type { IMessage } from '@/types/database';

import type { IAttachmentSubdocument } from './attachment.model';
import { attachmentSchema } from './attachment.model';

/**
 * Extends the IMessage interface to include Mongoose Document properties.
 */
export interface IMessageDocument
  extends Omit<IMessage, 'attachments'>,
    Document {
  _id: Types.ObjectId;
  attachments: IAttachmentSubdocument[];
  editHistory: {
    content: string;
    editedAt: Date;
  }[];
}

/**
 * Subdocument schema for AI response metadata.
 */
const aiMetadataSchema = new Schema(
  {
    model: { type: String, required: true },
    temperature: { type: Number, required: true },
    maxTokens: { type: Number, required: true },
    tokenCount: { type: Number, required: true },
    finishReason: {
      type: String,
      enum: ['stop', 'length', 'content_filter', 'tool_calls'],
      required: true,
    },
    responseTime: { type: Number }, // in milliseconds
    cost: { type: Number },
  },
  { _id: false }
);

/**
 * Subdocument schema for message edit history.
 */
const editHistorySchema = new Schema(
  {
    content: { type: String, required: true },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Main Message schema definition.
 */
const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    aiMetadata: {
      type: aiMetadataSchema,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed',
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    attachments: [attachmentSchema], // Embedded subdocuments
    editHistory: [editHistorySchema], // Embedded subdocuments
    parentMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      helpful: Boolean,
      reportReason: String,
      reportedAt: Date,
    },
    deletedAt: {
      type: Date,
      index: { sparse: true },
    },
  },
  {
    timestamps: true,
    collection: 'messages',
    versionKey: false,
  }
);

// ========================================
// COMPREHENSIVE INDEX DEFINITIONS
// ========================================

// Primary compound index for retrieving messages in chronological order
messageSchema.index(
  { conversationId: 1, createdAt: 1 },
  {
    background: true,
    name: 'idx_conversation_created_asc',
  }
);

// Compound index for retrieving messages in reverse chronological order
messageSchema.index(
  { conversationId: 1, createdAt: -1 },
  {
    background: true,
    name: 'idx_conversation_created_desc',
  }
);

// Index for user-specific message queries and analytics
messageSchema.index(
  { clerkId: 1, createdAt: -1 },
  {
    background: true,
    name: 'idx_user_messages',
  }
);

// Index for filtering messages by role within conversations
messageSchema.index(
  { role: 1, conversationId: 1 },
  {
    background: true,
    name: 'idx_role_conversation',
  }
);

// Index for AI model usage analytics and filtering
messageSchema.index(
  { 'aiMetadata.model': 1, createdAt: -1 },
  {
    background: true,
    name: 'idx_ai_model_analytics',
  }
);

// Sparse index for soft-deleted messages cleanup
messageSchema.index(
  { deletedAt: 1 },
  {
    sparse: true,
    background: true,
    name: 'idx_deleted_messages',
  }
);

// Text search index for message content search functionality
messageSchema.index(
  { content: 'text' },
  {
    background: true,
    name: 'message_search_index',
    weights: { content: 1 },
  }
);

// Sparse index for message threading and replies
messageSchema.index(
  { parentMessageId: 1 },
  {
    sparse: true,
    background: true,
    name: 'idx_message_threading',
  }
);

// Attachment-related indexes (since attachments are subdocuments)
messageSchema.index(
  { 'attachments.storageProvider': 1, 'attachments.createdAt': -1 },
  {
    sparse: true,
    background: true,
    name: 'idx_attachments_provider',
  }
);

messageSchema.index(
  { 'attachments.mimeType': 1 },
  {
    sparse: true,
    background: true,
    name: 'idx_attachments_type',
  }
);

messageSchema.index(
  { 'attachments.fileSize': 1 },
  {
    sparse: true,
    background: true,
    name: 'idx_attachments_size',
  }
);

/**
 * Pre-save hook to manage edit history.
 * If the content is modified, it updates `isEdited`, `editedAt`,
 * and pushes the old version to `editHistory`.
 */
messageSchema.pre('save', function (next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
    // `this.get('content', null, { getters: false })` might be needed for original
    const originalContent = this.get('content', null, { original: true });
    if (originalContent) {
      this.editHistory.push({ content: originalContent, editedAt: new Date() });
    }
  }
  next();
});

interface IMessageModel extends Model<IMessageDocument> {
  // Future static methods can be defined here
}

const MessageModel = (models.Message || 
  model<IMessageDocument, IMessageModel>('Message', messageSchema)
) as Model<IMessageDocument, IMessageModel>;

export default MessageModel;
