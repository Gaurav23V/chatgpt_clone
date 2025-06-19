/**
 * Database Indexes Configuration for ChatGPT Clone
 *
 * Centralized index management for optimal database performance.
 * This module defines all database indexes, provides utilities to ensure
 * indexes are created, and includes performance monitoring helpers.
 *
 * Features:
 * - All indexes defined in one place for maintainability
 * - Index creation utilities for startup initialization
 * - Performance hints and optimization guidance
 * - Index usage monitoring and verification
 * - Slow query detection capabilities
 */

import type { IndexDefinition } from 'mongoose';
import mongoose from 'mongoose';

import { connectToDatabase } from './connection';

// ========================================
// INDEX DEFINITIONS
// ========================================

/**
 * User Model Indexes
 * Optimized for Clerk integration and user-based queries
 */
export const USER_INDEXES: Array<{
  spec: IndexDefinition;
  options?: any;
  description: string;
}> = [
  {
    spec: { clerkId: 1 },
    options: { unique: true, background: true },
    description: 'Unique index on clerkId for primary user lookups',
  },
  {
    spec: { email: 1 },
    options: { background: true },
    description:
      'Index on email for email-based queries and duplicate prevention',
  },
  {
    spec: { username: 1 },
    options: { sparse: true, background: true },
    description: 'Sparse index on username (optional field)',
  },
  {
    spec: { 'subscription.status': 1, 'subscription.plan': 1 },
    options: { background: true },
    description: 'Compound index for subscription queries and analytics',
  },
  {
    spec: { isActive: 1, lastLoginAt: -1 },
    options: { background: true },
    description: 'Index for active user queries sorted by last login',
  },
  {
    spec: { createdAt: -1 },
    options: { background: true },
    description:
      'Index for user registration analytics and recent user queries',
  },
];

/**
 * Conversation Model Indexes
 * Optimized for user-specific conversation queries and sorting
 */
export const CONVERSATION_INDEXES: Array<{
  spec: IndexDefinition;
  options?: any;
  description: string;
}> = [
  {
    spec: { clerkId: 1, updatedAt: -1 },
    options: { background: true },
    description:
      'Primary compound index for user conversations sorted by recent activity',
  },
  {
    spec: { clerkId: 1, status: 1 },
    options: { background: true },
    description:
      'Compound index for filtering conversations by status (active, archived, deleted)',
  },
  {
    spec: { clerkId: 1, pinnedAt: -1 },
    options: { sparse: true, background: true },
    description: 'Sparse compound index for pinned conversations',
  },
  {
    spec: { clerkId: 1, lastMessageAt: -1 },
    options: { background: true },
    description:
      'Compound index for conversations sorted by recent message activity',
  },
  {
    spec: { clerkId: 1, messageCount: -1 },
    options: { background: true },
    description: 'Compound index for conversations sorted by message count',
  },
  {
    spec: { status: 1, archivedAt: -1 },
    options: { sparse: true, background: true },
    description: 'Index for archived conversation cleanup and analytics',
  },
  {
    spec: { title: 'text', description: 'text', tags: 'text' },
    options: {
      background: true,
      weights: { title: 10, description: 5, tags: 1 },
      name: 'conversation_search_index',
    },
    description: 'Text search index for conversation search functionality',
  },
];

/**
 * Message Model Indexes
 * Optimized for conversation-based message queries and search
 */
export const MESSAGE_INDEXES: Array<{
  spec: IndexDefinition;
  options?: any;
  description: string;
}> = [
  {
    spec: { conversationId: 1, createdAt: 1 },
    options: { background: true },
    description:
      'Primary compound index for retrieving messages in chronological order',
  },
  {
    spec: { conversationId: 1, createdAt: -1 },
    options: { background: true },
    description:
      'Compound index for retrieving messages in reverse chronological order',
  },
  {
    spec: { clerkId: 1, createdAt: -1 },
    options: { background: true },
    description: 'Index for user-specific message queries and analytics',
  },
  {
    spec: { role: 1, conversationId: 1 },
    options: { background: true },
    description: 'Index for filtering messages by role within conversations',
  },
  {
    spec: { 'aiMetadata.model': 1, createdAt: -1 },
    options: { background: true },
    description: 'Index for AI model usage analytics and filtering',
  },
  {
    spec: { deletedAt: 1 },
    options: { sparse: true, background: true },
    description: 'Sparse index for soft-deleted messages cleanup',
  },
  {
    spec: { content: 'text' },
    options: {
      background: true,
      name: 'message_search_index',
    },
    description: 'Text search index for message content search functionality',
  },
  {
    spec: { parentMessageId: 1 },
    options: { sparse: true, background: true },
    description: 'Sparse index for message threading and replies',
  },
];

/**
 * Attachment Subdocument Indexes
 * Note: These are applied to the message collection since attachments are subdocuments
 */
export const ATTACHMENT_INDEXES: Array<{
  spec: IndexDefinition;
  options?: any;
  description: string;
}> = [
  {
    spec: { 'attachments.storageProvider': 1, 'attachments.createdAt': -1 },
    options: { sparse: true, background: true },
    description: 'Index for attachment queries by storage provider',
  },
  {
    spec: { 'attachments.mimeType': 1 },
    options: { sparse: true, background: true },
    description: 'Index for filtering attachments by file type',
  },
  {
    spec: { 'attachments.fileSize': 1 },
    options: { sparse: true, background: true },
    description: 'Index for attachment size analytics and cleanup',
  },
];

// ========================================
// INDEX MANAGEMENT UTILITIES
// ========================================

/**
 * Ensures all indexes are created for a specific model
 */
export async function ensureModelIndexes(
  modelName: string,
  indexes: Array<{ spec: IndexDefinition; options?: any; description: string }>
): Promise<void> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not established');
    const collection = db.collection(`${modelName.toLowerCase()}s`);

    console.log(`🔄 Creating indexes for ${modelName} model...`);

    for (const { spec, options, description } of indexes) {
      try {
        await collection.createIndex(spec as any, options);
        console.log(`✅ Created index: ${description}`);
      } catch (error: any) {
        // Index might already exist, check if it's a duplicate key error
        if (error.code === 85 || error.message.includes('already exists')) {
          console.log(`ℹ️  Index already exists: ${description}`);
        } else {
          console.error(`❌ Failed to create index: ${description}`, error);
          throw error;
        }
      }
    }

    console.log(`✅ Completed index creation for ${modelName} model\n`);
  } catch (error) {
    console.error(`❌ Error ensuring indexes for ${modelName}:`, error);
    throw error;
  }
}

/**
 * Creates all database indexes during application startup
 */
export async function ensureAllIndexes(): Promise<void> {
  console.log('🚀 Starting database index creation...\n');

  try {
    // Create indexes for each model
    await ensureModelIndexes('User', USER_INDEXES);
    await ensureModelIndexes('Conversation', CONVERSATION_INDEXES);
    await ensureModelIndexes('Message', [
      ...MESSAGE_INDEXES,
      ...ATTACHMENT_INDEXES,
    ]);

    console.log('🎉 All database indexes created successfully!');
  } catch (error) {
    console.error('💥 Failed to create database indexes:', error);
    throw error;
  }
}

/**
 * Verifies that all required indexes exist
 */
export async function verifyIndexes(): Promise<{
  missing: string[];
  existing: string[];
  total: number;
}> {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not established');

  const missing: string[] = [];
  const existing: string[] = [];

  const collections = [
    { name: 'users', indexes: USER_INDEXES },
    { name: 'conversations', indexes: CONVERSATION_INDEXES },
    { name: 'messages', indexes: [...MESSAGE_INDEXES, ...ATTACHMENT_INDEXES] },
  ];

  for (const { name, indexes } of collections) {
    try {
      const collection = db.collection(name);
      const existingIndexes = await collection.listIndexes().toArray();
      const existingSpecs = existingIndexes.map((idx) =>
        JSON.stringify(idx.key)
      );

      for (const { spec, description } of indexes) {
        const specString = JSON.stringify(spec);
        if (existingSpecs.includes(specString)) {
          existing.push(`${name}: ${description}`);
        } else {
          missing.push(`${name}: ${description}`);
        }
      }
    } catch (error) {
      console.warn(`Could not verify indexes for collection ${name}:`, error);
    }
  }

  return {
    missing,
    existing,
    total: missing.length + existing.length,
  };
}

// ========================================
// PERFORMANCE MONITORING
// ========================================

/**
 * Query execution time tracking wrapper
 */
export function trackQueryTime<T>(
  operation: string,
  query: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();

    try {
      const result = await query();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log slow queries (> 100ms)
      if (duration > 100) {
        console.warn(`🐌 Slow query detected: ${operation} took ${duration}ms`);
      } else if (duration > 50) {
        console.log(`⚡ Query timing: ${operation} took ${duration}ms`);
      }

      resolve(result);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(
        `💥 Query failed: ${operation} failed after ${duration}ms`,
        error
      );
      reject(error);
    }
  });
}

/**
 * Adds explain() output for development query optimization
 */
export async function explainQuery(
  model: any,
  query: any,
  operation: string = 'unknown'
): Promise<any> {
  if (process.env.NODE_ENV === 'development') {
    try {
      const explanation = await query.explain('executionStats');
      console.log(`📊 Query explanation for ${operation}:`, {
        executionTimeMillis: explanation.executionStats.executionTimeMillis,
        totalKeysExamined: explanation.executionStats.totalKeysExamined,
        totalDocsExamined: explanation.executionStats.totalDocsExamined,
        executionStages: explanation.executionStats.executionStages.stage,
        indexesUsed:
          explanation.executionStats.executionStages.indexName ||
          'No index used',
      });
    } catch (error) {
      console.warn(`Could not explain query for ${operation}:`, error);
    }
  }
}

/**
 * Database statistics and health check
 */
export async function getDatabaseStats(): Promise<{
  indexes: { missing: string[]; existing: string[]; total: number };
  collections: Array<{
    name: string;
    count: number;
    avgObjSize: number;
    storageSize: number;
    indexes: number;
  }>;
}> {
  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection not established');

  const indexes = await verifyIndexes();
  const collections = [];

  const collectionNames = ['users', 'conversations', 'messages'];

  for (const name of collectionNames) {
    try {
      const collection = db.collection(name);
      const count = await collection.countDocuments();
      const indexStats = await collection.listIndexes().toArray();

      collections.push({
        name,
        count: count || 0,
        avgObjSize: 0,
        storageSize: 0,
        indexes: indexStats.length,
      });
    } catch (error) {
      console.warn(`Could not get stats for collection ${name}:`, error);
    }
  }

  return { indexes, collections };
}

// ========================================
// PERFORMANCE HINTS
// ========================================

/**
 * Performance optimization hints for queries
 */
export const PERFORMANCE_HINTS = {
  USER_QUERIES: {
    findByClerkId: 'Use clerkId index for O(1) lookups',
    findByEmail: 'Use email index for fast email-based searches',
    activeUsers:
      'Use compound index (isActive, lastLoginAt) for optimal sorting',
  },

  CONVERSATION_QUERIES: {
    userConversations:
      'Use compound index (clerkId, updatedAt) for optimal pagination',
    recentActivity:
      'Use (clerkId, lastMessageAt) index for recent conversations',
    statusFiltering:
      'Use (clerkId, status) index for filtering by conversation status',
    search: 'Use text index for conversation title/description search',
  },

  MESSAGE_QUERIES: {
    conversationMessages:
      'Use compound index (conversationId, createdAt) for chronological order',
    userMessages:
      'Use (clerkId, createdAt) index for user-specific message queries',
    contentSearch: 'Use text index for message content search',
    roleFiltering:
      'Use (role, conversationId) index for filtering by message role',
  },

  GENERAL_TIPS: [
    'Always use projection to limit returned fields',
    'Use lean() for read-only operations to improve performance',
    'Implement proper pagination with cursor-based approach',
    'Use aggregation pipeline for complex queries instead of multiple queries',
    'Monitor query execution time and add indexes for slow queries',
    'Use sparse indexes for optional fields to save space',
    'Consider TTL indexes for automatic cleanup of old data',
  ],
} as const;
