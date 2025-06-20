/**
 * MongoDB Connection Singleton for ChatGPT Clone
 *
 * This module implements a singleton pattern for MongoDB connections following
 * the Dub repository approach and Next.js best practices. It ensures:
 * - Single connection instance across the application
 * - Proper connection pooling for performance
 * - Graceful error handling and reconnection logic
 * - Development and production environment support
 *
 * Connection Pooling Best Practices:
 * - Reuses existing connections to reduce overhead
 * - Handles connection timeouts and retries
 * - Monitors connection health and performance
 * - Implements proper cleanup on application shutdown
 *
 * Environment Variables Required:
 * - MONGODB_URI: Full MongoDB connection string
 *   Format: mongodb://username:password@host:port/database
 *   Or: mongodb+srv://username:password@cluster.mongodb.net/database
 *
 * Optional Environment Variables:
 * - MONGODB_DB_NAME: Database name (if not in URI)
 * - NODE_ENV: Environment mode (development/production)
 */

import type { Connection, ConnectOptions } from 'mongoose';
import mongoose from 'mongoose';

import type { IConnectionStatus } from '@/types/database';

/**
 * Global interface for storing the cached connection
 * This prevents multiple connections in development with hot reloading
 */
interface GlobalWithMongoose {
  mongoose: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

// Extend global object to include mongoose cache
declare const global: GlobalWithMongoose;

/**
 * MongoDB connection configuration
 * Optimized for both development and production environments
 */
const MONGODB_CONFIG: ConnectOptions = {
  // Connection Pool Settings (matching your requirements)
  maxPoolSize: 10, // Maximum connections in pool
  minPoolSize: process.env.NODE_ENV === 'production' ? 2 : 1, // Minimum connections in pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 30000, // Increased timeout for MongoDB Atlas
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take
  connectTimeoutMS: 30000, // How long to wait for initial connection

  // Buffering Settings - Allow buffering in development for better UX
  bufferCommands: process.env.NODE_ENV === 'development', // Enable buffering in dev

  // Connection Management
  heartbeatFrequencyMS: 10000, // How often to check connection health
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads

  // Development vs Production Settings
  ...(process.env.NODE_ENV === 'development' && {
    // Development-specific settings
    autoIndex: true, // Build indexes automatically
  }),

  ...(process.env.NODE_ENV === 'production' && {
    // Production-specific settings
    autoIndex: false, // don't build indexes automatically in production
    debug: false, // Disable debug mode for performance
  }),
};

/**
 * Environment variable validation
 */
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Initialize global mongoose cache
 * This prevents multiple connections during development hot reloads
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * MongoDB Connection Singleton
 *
 * This function implements the singleton pattern to ensure only one
 * MongoDB connection is maintained throughout the application lifecycle.
 *
 * Features:
 * - Caches connection to prevent multiple instances
 * - Handles reconnection automatically
 * - Provides connection status monitoring
 * - Implements proper error handling
 *
 * @returns Promise<Connection> - MongoDB connection instance
 */
export async function connectToDatabase(): Promise<Connection> {
  // Return cached connection if available
  if (cached.conn) {
    console.log('📦 Using cached MongoDB connection');
    return cached.conn;
  }

  // Return existing connection promise if in progress
  if (!cached.promise) {
    console.log('🔌 Establishing new MongoDB connection...');

    // Enable Mongoose debug mode in development (queries logged to console)
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    // Create new connection promise
    cached.promise = mongoose
      .connect(MONGODB_URI!, MONGODB_CONFIG)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        console.log(
          `📍 Connected to: ${mongoose.connection.host}:${mongoose.connection.port}`
        );
        console.log(`🗄️  Database: ${mongoose.connection.name}`);

        // Set up connection event listeners
        setupConnectionEventListeners(mongoose.connection);

        return mongoose.connection;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        // Reset promise on error to allow retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Reset cache on connection failure
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

/**
 * Set up MongoDB connection event listeners
 * Monitors connection health and handles reconnection scenarios
 *
 * @param connection - Mongoose connection instance
 */
function setupConnectionEventListeners(connection: Connection): void {
  // Connection opened
  connection.on('connected', () => {
    console.log('🟢 MongoDB connection established');
  });

  // Connection disconnected
  connection.on('disconnected', () => {
    console.log('🔴 MongoDB connection disconnected');
    // Reset cached connection
    cached.conn = null;
  });

  // Connection error
  connection.on('error', (error) => {
    console.error('💥 MongoDB connection error:', error);
    // Reset cached connection on error
    cached.conn = null;
    cached.promise = null;
  });

  // Connection reconnected
  connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });

  // Connection timeout
  connection.on('timeout', () => {
    console.warn('⏰ MongoDB connection timeout');
  });

  // Connection close
  connection.on('close', () => {
    console.log('🔒 MongoDB connection closed');
    cached.conn = null;
    cached.promise = null;
  });

  // Process termination handlers (only in Node.js runtime)
  if (typeof process !== 'undefined' && process.on) {
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart
  }
}

/**
 * Graceful shutdown handler
 * Properly closes MongoDB connection on application termination
 *
 * @param signal - Process signal that triggered shutdown
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);

  try {
    if (cached.conn) {
      await cached.conn.close();
      console.log('✅ MongoDB connection closed gracefully');
    }
    // Only call process.exit in Node.js runtime
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    // Only call process.exit in Node.js runtime
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
}

/**
 * Get current MongoDB connection status
 * Useful for health checks and monitoring
 *
 * @returns IConnectionStatus - Current connection status
 */
export function getConnectionStatus(): IConnectionStatus {
  const connection = mongoose.connection;

  return {
    isConnected: connection.readyState === 1,
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    error: connection.readyState === 99 ? 'Connection error' : undefined,
  };
}

/**
 * Test database connection
 * Useful for health check endpoints
 *
 * @returns Promise<boolean> - Whether connection test passed
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await connectToDatabase();
    // Perform a simple operation to test connection
    if (connection.db) {
      await connection.db.admin().ping();
    }
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

/**
 * Close database connection
 * Useful for testing or manual connection management
 */
export async function closeConnection(): Promise<void> {
  try {
    if (cached.conn) {
      await cached.conn.close();
      cached.conn = null;
      cached.promise = null;
      console.log('✅ MongoDB connection closed manually');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
}

/**
 * Connection readiness states for reference
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 * 99 = uninitialized
 */
export const CONNECTION_STATES = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
  UNINITIALIZED: 99,
} as const;

// =============================================================================
// HELPER FUNCTIONS (Convenience aliases for your requirements)
// =============================================================================

/**
 * Initialize MongoDB connection
 * Alias for connectToDatabase() to match your requirements
 *
 * @returns Promise<Connection> - MongoDB connection instance
 */
export const connectDB = connectToDatabase;

/**
 * Close MongoDB connection gracefully
 * Alias for closeConnection() to match your requirements
 */
export const disconnectDB = closeConnection;

/**
 * Check if MongoDB is connected
 *
 * @returns boolean - True if connected, false otherwise
 */
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

/**
 * Default export for convenience
 */
export default connectToDatabase;
