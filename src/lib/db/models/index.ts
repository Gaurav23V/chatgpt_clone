/**
 * Database Models Index
 *
 * This file serves as the central hub for all Mongoose models in the application.
 * It simplifies imports by providing a single entry point.
 *
 * Additionally, it exports the TypeScript document interfaces for type-safe
 * interactions with the database models.
 */

// Re-exporting models for centralized access
import ConversationModel from './conversation.model';
import MessageModel from './message.model';
import UserModel from './user.model';

export const User = UserModel;
export const Conversation = ConversationModel;
export const Message = MessageModel;

// Exporting document interfaces for type safety
export type { IConversationDocument } from './conversation.model';
export type { IMessageDocument } from './message.model';
export type { IUserDocument } from './user.model';

// Exporting subdocument schemas and interfaces
export type { IAttachmentSubdocument } from './attachment.model';
export { attachmentSchema } from './attachment.model';

// Default export is a collection of all models
const models = {
  User,
  Conversation,
  Message,
};

export default models;
