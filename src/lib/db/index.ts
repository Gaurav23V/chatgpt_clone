/**
 * Database Module Index for ChatGPT Clone
 *
 * This file serves as the main entry point for all database operations.
 * It exports connection utilities, models, and provides a centralized
 * access point for database functionality throughout the application.
 *
 * Usage:
 * import { connectToDatabase, getConnectionStatus } from '@/lib/db';
 * import { User, Conversation, Message } from '@/lib/db/models';
 */

// Connection utilities
// Import for internal use
import type { IConnectionStatus } from '@/types/database';

import {
  closeConnection as _closeConnection,
  connectDB as _connectDB,
  CONNECTION_STATES as _CONNECTION_STATES,
  connectToDatabase as _connectToDatabase,
  disconnectDB as _disconnectDB,
  getConnectionStatus as _getConnectionStatus,
  isConnected as _isConnected,
  testConnection as _testConnection,
} from './connection';

export {
  closeConnection,
  connectDB,
  CONNECTION_STATES,
  connectToDatabase,
  disconnectDB,
  getConnectionStatus,
  isConnected,
  testConnection,
} from './connection';

// Database types
export type {
  AttachmentStatus,
  ConversationStatus,
  CreateAttachmentData,
  CreateConversationData,
  CreateMessageData,
  CreateUserData,
  IAttachment,
  IConnectionStatus,
  IConversation,
  IMessage,
  IPaginatedResponse,
  IPaginationOptions,
  ISearchOptions,
  IUser,
  MessageRole,
  UpdateAttachmentData,
  UpdateConversationData,
  UpdateMessageData,
  UpdateUserData,
  UserRole,
} from '@/types/database';

// Model exports
export { Conversation, User } from './models';

// Service exports
export * from './services/conversation.service';
export * from './services/user.service';

// Utility exports
export * from './utils';

// Middleware exports
export * from './middleware';

/**
 * Database initialization function
 * Call this once at application startup to ensure database connection
 *
 * @returns Promise<boolean> - Whether initialization was successful
 */
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('🚀 Initializing database...');

    // Test database connection
    const isConnected = await _testConnection();

    if (isConnected) {
      console.log('✅ Database initialized successfully');
      return true;
    } else {
      console.error('❌ Database initialization failed');
      return false;
    }
  } catch (error) {
    console.error('💥 Database initialization error:', error);
    return false;
  }
}

/**
 * Database health check function
 * Useful for API health check endpoints
 *
 * @returns Promise<{ healthy: boolean; status: IConnectionStatus }>
 */
export async function getDatabaseHealth(): Promise<{
  healthy: boolean;
  status: IConnectionStatus;
}> {
  const status = _getConnectionStatus();
  const healthy = status.isConnected && !status.error;

  return {
    healthy,
    status,
  };
}

/**
 * Default export for convenience
 */
export default {
  connectToDatabase: _connectToDatabase,
  connectDB: _connectDB,
  disconnectDB: _disconnectDB,
  isConnected: _isConnected,
  getConnectionStatus: _getConnectionStatus,
  testConnection: _testConnection,
  closeConnection: _closeConnection,
  initializeDatabase,
  getDatabaseHealth,
  CONNECTION_STATES: _CONNECTION_STATES,
};
