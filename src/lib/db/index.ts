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
  CONNECTION_STATES as _CONNECTION_STATES,
  connectToDatabase as _connectToDatabase,
  getConnectionStatus as _getConnectionStatus,
  testConnection as _testConnection,
} from './connection';

export {
  closeConnection,
  CONNECTION_STATES,
  connectToDatabase,
  getConnectionStatus,
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

// Models will be exported here once created
// export { User, Conversation, Message, Attachment } from './models';

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
  getConnectionStatus: _getConnectionStatus,
  testConnection: _testConnection,
  closeConnection: _closeConnection,
  initializeDatabase,
  getDatabaseHealth,
  CONNECTION_STATES: _CONNECTION_STATES,
};
