/**
 * Database Models Index for ChatGPT Clone
 *
 * This file will export all Mongoose models once they are created.
 * Models define the structure and behavior of database collections.
 *
 * TODO: Create the following model files:
 * - user.ts - User model with Clerk integration
 * - conversation.ts - Conversation model for chat sessions
 * - message.ts - Message model for individual chat messages
 * - attachment.ts - Attachment model for file uploads
 *
 * Example usage (once models are created):
 * import { User, Conversation, Message, Attachment } from '@/lib/db/models';
 *
 * const user = await User.findOne({ clerkId: 'user_123' });
 * const conversation = await Conversation.create({ userId: user._id, title: 'New Chat' });
 */

// Model exports
export { default as User } from './user.model';
// export { default as Conversation } from './conversation';
// export { default as Message } from './message';
// export { default as Attachment } from './attachment';

/**
 * Model creation guidelines:
 *
 * 1. Each model should extend the BaseDocument interface from @/types/database
 * 2. Use proper TypeScript typing with the interface definitions
 * 3. Include pre/post middleware for common operations (timestamps, validation)
 * 4. Add indexes for frequently queried fields (clerkId, userId, etc.)
 * 5. Implement soft delete functionality where appropriate
 * 6. Add proper validation rules and error handling
 * 7. Include static methods for common queries
 * 8. Use virtual fields for computed properties
 *
 * Example model structure:
 *
 * ```typescript
 * import { Schema, model, Model } from 'mongoose';
 * import { IUser } from '@/types/database';
 *
 * const userSchema = new Schema<IUser>({
 *   clerkId: { type: String, required: true, unique: true },
 *   email: { type: String, required: true },
 *   // ... other fields
 * }, {
 *   timestamps: true,
 *   collection: 'users'
 * });
 *
 * // Add indexes
 * userSchema.index({ clerkId: 1 });
 * userSchema.index({ email: 1 });
 *
 * // Add middleware
 * userSchema.pre('save', function(next) {
 *   // Pre-save logic
 *   next();
 * });
 *
 * // Add static methods
 * userSchema.statics.findByClerkId = function(clerkId: string) {
 *   return this.findOne({ clerkId });
 * };
 *
 * export default model<IUser>('User', userSchema);
 * ```
 */

export default {};
