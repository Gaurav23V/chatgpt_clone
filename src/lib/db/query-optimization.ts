/**
 * Query Optimization Helpers for ChatGPT Clone
 *
 * Provides utilities for optimizing database queries, monitoring performance,
 * and implementing caching strategies for better database performance.
 *
 * Features:
 * - Query execution time monitoring
 * - Explain plan analysis for development
 * - Query result caching with TTL
 * - Projection helpers for optimal field selection
 * - Aggregation pipeline optimizations
 * - Query performance metrics collection
 */

import type { Aggregate, Document, Query } from 'mongoose';

import { explainQuery, trackQueryTime } from './indexes';

// ========================================
// QUERY PERFORMANCE MONITORING
// ========================================

/**
 * Interface for query performance metrics
 */
export interface QueryMetrics {
  operation: string;
  collection: string;
  executionTime: number;
  documentsExamined: number;
  documentsReturned: number;
  indexUsed: boolean;
  indexName?: string;
  timestamp: Date;
}

/**
 * Global metrics storage for development monitoring
 */
const queryMetrics: QueryMetrics[] = [];

/**
 * Wrapper for monitoring query performance
 */
export async function monitorQuery<T>(
  query: Query<T, any> | Aggregate<T[]>,
  operation: string,
  collection: string
): Promise<T | T[]> {
  const startTime = Date.now();

  try {
    // Execute the query
    const result = await query.exec();
    const executionTime = Date.now() - startTime;

    // In development, get explain information
    if (process.env.NODE_ENV === 'development') {
      try {
        const explanation = await (query as any)
          .clone()
          .explain('executionStats');
        const stats =
          explanation.executionStats || explanation[0]?.executionStats;

        const metrics: QueryMetrics = {
          operation,
          collection,
          executionTime,
          documentsExamined: stats?.totalDocsExamined || 0,
          documentsReturned:
            stats?.totalDocsReturned ||
            (Array.isArray(result) ? result.length : 1),
          indexUsed: stats?.totalKeysExamined > 0,
          indexName: stats?.executionStages?.indexName,
          timestamp: new Date(),
        };

        queryMetrics.push(metrics);

        // Log slow queries
        if (executionTime > 100) {
          console.warn(`🐌 Slow query detected:`, {
            operation,
            collection,
            executionTime: `${executionTime}ms`,
            documentsExamined: metrics.documentsExamined,
            indexUsed: metrics.indexUsed,
          });
        }

        // Trim metrics array to last 100 entries
        if (queryMetrics.length > 100) {
          queryMetrics.splice(0, queryMetrics.length - 100);
        }
      } catch (explainError) {
        console.warn('Could not explain query:', explainError);
      }
    }

    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`💥 Query failed after ${executionTime}ms:`, {
      operation,
      collection,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Get query performance metrics for development analysis
 */
export function getQueryMetrics(): QueryMetrics[] {
  return [...queryMetrics];
}

/**
 * Clear query metrics
 */
export function clearQueryMetrics(): void {
  queryMetrics.length = 0;
}

// ========================================
// PROJECTION HELPERS
// ========================================

/**
 * Common projection patterns for different use cases
 */
export const PROJECTIONS = {
  // User projections
  USER_BASIC: {
    clerkId: 1,
    email: 1,
    firstName: 1,
    lastName: 1,
    imageUrl: 1,
    isActive: 1,
  },

  USER_WITH_PREFERENCES: {
    clerkId: 1,
    email: 1,
    firstName: 1,
    lastName: 1,
    imageUrl: 1,
    preferences: 1,
    isActive: 1,
  },

  USER_FOR_AUTH: {
    clerkId: 1,
    email: 1,
    isActive: 1,
    lastLoginAt: 1,
  },

  // Conversation projections
  CONVERSATION_LIST: {
    _id: 1,
    title: 1,
    clerkId: 1,
    messageCount: 1,
    lastMessageAt: 1,
    status: 1,
    pinnedAt: 1,
    updatedAt: 1,
  },

  CONVERSATION_DETAIL: {
    _id: 1,
    title: 1,
    description: 1,
    clerkId: 1,
    settings: 1,
    messageCount: 1,
    totalTokens: 1,
    lastMessageAt: 1,
    status: 1,
    pinnedAt: 1,
    tags: 1,
    createdAt: 1,
    updatedAt: 1,
  },

  CONVERSATION_BASIC: {
    _id: 1,
    title: 1,
    clerkId: 1,
    status: 1,
  },

  // Message projections
  MESSAGE_LIST: {
    _id: 1,
    conversationId: 1,
    role: 1,
    content: 1,
    createdAt: 1,
    isEdited: 1,
    editedAt: 1,
    'aiMetadata.model': 1,
    'aiMetadata.tokenCount': 1,
  },

  MESSAGE_DETAIL: {
    _id: 1,
    conversationId: 1,
    clerkId: 1,
    role: 1,
    content: 1,
    aiMetadata: 1,
    status: 1,
    isEdited: 1,
    editedAt: 1,
    attachments: 1,
    feedback: 1,
    createdAt: 1,
    updatedAt: 1,
  },

  MESSAGE_SEARCH: {
    _id: 1,
    conversationId: 1,
    role: 1,
    content: 1,
    createdAt: 1,
    score: { $meta: 'textScore' },
  },
} as const;

/**
 * Creates optimized projection for specific fields
 */
export function createProjection(fields: string[]): Record<string, 1> {
  const projection: Record<string, 1> = {};
  fields.forEach((field) => {
    projection[field] = 1;
  });
  return projection;
}

/**
 * Excludes sensitive fields from projections
 */
export function excludeSensitiveFields(
  projection: Record<string, any>
): Record<string, any> {
  const sensitiveFields = [
    'password',
    'privateMetadata',
    'stripeCustomerId',
    'stripeSubscriptionId',
    'internalNotes',
  ];

  const cleanProjection = { ...projection };
  sensitiveFields.forEach((field) => {
    if (cleanProjection[field]) {
      delete cleanProjection[field];
    }
  });

  return cleanProjection;
}

// ========================================
// QUERY BUILDERS
// ========================================

/**
 * Optimized query builder for user conversations with pagination
 */
export function buildUserConversationsQuery(
  clerkId: string,
  options: {
    status?: string[];
    limit?: number;
    cursor?: string;
    sortBy?: 'updatedAt' | 'lastMessageAt' | 'createdAt' | 'messageCount';
    sortOrder?: 1 | -1;
    includeArchived?: boolean;
  } = {}
) {
  const {
    status = ['active'],
    limit = 20,
    cursor,
    sortBy = 'updatedAt',
    sortOrder = -1,
    includeArchived = false,
  } = options;

  const filter: any = { clerkId };

  if (!includeArchived) {
    filter.status = { $in: status };
  }

  if (cursor) {
    const cursorDate = new Date(cursor);
    filter[sortBy] =
      sortOrder === -1 ? { $lt: cursorDate } : { $gt: cursorDate };
  }

  const sort: any = {};
  sort[sortBy] = sortOrder;

  return {
    filter,
    sort,
    limit: Math.min(limit, 50), // Cap at 50 for performance
    projection: PROJECTIONS.CONVERSATION_LIST,
  };
}

/**
 * Optimized query builder for conversation messages with pagination
 */
export function buildConversationMessagesQuery(
  conversationId: string,
  options: {
    limit?: number;
    cursor?: string;
    sortOrder?: 1 | -1;
    includeDeleted?: boolean;
  } = {}
) {
  const { limit = 50, cursor, sortOrder = 1, includeDeleted = false } = options;

  const filter: any = { conversationId };

  if (!includeDeleted) {
    filter.deletedAt = { $exists: false };
  }

  if (cursor) {
    const cursorDate = new Date(cursor);
    filter.createdAt =
      sortOrder === 1 ? { $gt: cursorDate } : { $lt: cursorDate };
  }

  return {
    filter,
    sort: { createdAt: sortOrder },
    limit: Math.min(limit, 100), // Cap at 100 for performance
    projection: PROJECTIONS.MESSAGE_LIST,
  };
}

// ========================================
// AGGREGATION OPTIMIZATIONS
// ========================================

/**
 * Optimized aggregation for conversation statistics
 */
export function buildConversationStatsAggregation(clerkId: string) {
  return [
    { $match: { clerkId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalMessages: { $sum: '$messageCount' },
        totalTokens: { $sum: '$totalTokens' },
      },
    },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            totalMessages: '$totalMessages',
            totalTokens: '$totalTokens',
          },
        },
        overallMessages: { $sum: '$totalMessages' },
        overallTokens: { $sum: '$totalTokens' },
      },
    },
  ];
}

/**
 * Optimized aggregation for user activity analytics
 */
export function buildUserActivityAggregation(clerkId: string, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return [
    {
      $match: {
        clerkId,
        createdAt: { $gte: cutoffDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: 'conversation',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ];
}

// ========================================
// CACHING UTILITIES
// ========================================

/**
 * Simple in-memory cache with TTL for development
 * In production, use Redis or similar
 */
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds = 300): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const queryCache = new SimpleCache();

/**
 * Cache wrapper for query results
 */
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  // Check cache first
  const cached = queryCache.get(key);
  if (cached !== null) {
    console.log(`📦 Cache hit for key: ${key}`);
    return cached;
  }

  // Execute query and cache result
  console.log(`🔍 Cache miss for key: ${key} - executing query`);
  const result = await queryFn();
  queryCache.set(key, result, ttlSeconds);

  return result;
}

/**
 * Generate cache keys for common queries
 */
export const CACHE_KEYS = {
  userConversations: (clerkId: string, status?: string) =>
    `user:${clerkId}:conversations${status ? `:${status}` : ''}`,

  conversationMessages: (conversationId: string, limit: number) =>
    `conversation:${conversationId}:messages:${limit}`,

  userStats: (clerkId: string) => `user:${clerkId}:stats`,

  conversationStats: (conversationId: string) =>
    `conversation:${conversationId}:stats`,
} as const;

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const keys = Array.from(queryCache['cache'].keys());
  const regex = new RegExp(pattern.replace('*', '.*'));

  keys.forEach((key) => {
    if (regex.test(key)) {
      queryCache.delete(key);
    }
  });
}

// ========================================
// QUERY OPTIMIZATION HELPERS
// ========================================

/**
 * Optimize lean queries for read-only operations
 */
export function optimizeReadQuery(query: any): any {
  return query.lean().allowDiskUse(false);
}

/**
 * Optimize write queries with proper options
 */
export function optimizeWriteQuery<T>(query: Query<T, any>): Query<T, any> {
  return query.setOptions({
    runValidators: true,
    new: true,
  });
}

/**
 * Add query hints for better performance
 */
export function addQueryHints<T>(
  query: Query<T, any>,
  hints: { index?: string; maxTimeMS?: number } = {}
): Query<T, any> {
  if (hints.index) {
    query.hint(hints.index);
  }

  if (hints.maxTimeMS) {
    query.maxTimeMS(hints.maxTimeMS);
  }

  return query;
}

/**
 * Performance analysis for development
 */
export function analyzeQueryPerformance(): {
  totalQueries: number;
  avgExecutionTime: number;
  slowQueries: QueryMetrics[];
  queryBreakdown: Record<string, number>;
  indexUsage: { withIndex: number; withoutIndex: number };
} {
  if (queryMetrics.length === 0) {
    return {
      totalQueries: 0,
      avgExecutionTime: 0,
      slowQueries: [],
      queryBreakdown: {},
      indexUsage: { withIndex: 0, withoutIndex: 0 },
    };
  }

  const totalQueries = queryMetrics.length;
  const avgExecutionTime =
    queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries;
  const slowQueries = queryMetrics.filter((m) => m.executionTime > 100);

  const queryBreakdown: Record<string, number> = {};
  let withIndex = 0;
  let withoutIndex = 0;

  queryMetrics.forEach((metric) => {
    const key = `${metric.collection}.${metric.operation}`;
    queryBreakdown[key] = (queryBreakdown[key] || 0) + 1;

    if (metric.indexUsed) {
      withIndex++;
    } else {
      withoutIndex++;
    }
  });

  return {
    totalQueries,
    avgExecutionTime,
    slowQueries,
    queryBreakdown,
    indexUsage: { withIndex, withoutIndex },
  };
}
