/**
 * Attachment Subdocument Schema for ChatGPT Clone
 *
 * This file defines the Mongoose schema for an attachment, which is intended
 * to be used as a subdocument within the Message model. It does not create a
 * separate collection in MongoDB.
 */

import type { Types } from 'mongoose';
import { Schema } from 'mongoose';

/**
 * TypeScript interface for the Attachment subdocument.
 * Note: This is not a full-fledged Mongoose document but a subdocument.
 */
export interface IAttachmentSubdocument {
  _id: Types.ObjectId;
  originalName: string;
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  storageProvider: 'local' | 'cloudinary' | 'aws-s3' | 'uploadcare';
  storageUrl: string;
  publicId?: string; // For providers like Cloudinary
  createdAt: Date;
}

/**
 * Mongoose schema for an attachment subdocument.
 * This schema will be embedded within the `Message` schema.
 */
export const attachmentSchema = new Schema<IAttachmentSubdocument>(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required.'],
      trim: true,
      maxlength: 255,
    },
    fileName: {
      type: String,
      required: [true, 'Stored file name is required.'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required.'],
      min: [1, 'File size must be at least 1 byte.'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required.'],
      trim: true,
      lowercase: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 'cloudinary', 'aws-s3', 'uploadcare'],
      required: [true, 'Storage provider is required.'],
    },
    storageUrl: {
      type: String,
      required: [true, 'Storage URL is required.'],
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true, // Subdocuments get IDs by default, which is useful
    timestamps: { updatedAt: false }, // only createdAt will be there from the field above.
    versionKey: false,
  }
);
