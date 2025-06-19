/**
 * Message Model for ChatGPT Clone
 *
 * This model represents individual messages within a conversation. It includes
 * rich metadata, support for attachments, and a history of edits.
 */

import type { Document, Model, Types } from 'mongoose';
import { model, Schema } from 'mongoose';

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

// Compound index for efficient querying of messages within a conversation
messageSchema.index({ conversationId: 1, createdAt: 1 });

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

const MessageModel = model<IMessageDocument, IMessageModel>(
  'Message',
  messageSchema
);

export default MessageModel;
