/**
 * Database Utility Functions for ChatGPT Clone
 *
 * This module provides comprehensive database utilities including:
 * - Health check functions
 * - Connection monitoring
 * - Query performance helpers
 * - Common database operations
 * - Error handling utilities
 * - Security helpers
 * - Development tools
 */

import type {
  Connection,
  Document,
  FilterQuery,
  Model,
  QueryOptions,
  SortOrder,
} from 'mongoose';
import mongoose from 'mongoose';

import type {
  IConnectionStatus,
  IPaginatedResponse,
  IPaginationOptions,
  ISearchOptions,
} from '@/types/database';

import { connectToDatabase, getConnectionStatus } from './connection';

// =============================================================================
// HEALTH CHECK AND MONITORING
// =============================================================================

/**
 * Comprehensive database health check
 * Tests connection, basic operations, and response times
 */
export interface IDatabaseHealthCheck {
  isHealthy: boolean;
  connection: IConnectionStatus;
  latency: number;
  errors: string[];
  timestamp: Date;
  version?: string;
}

export async function performHealthCheck(): Promise<IDatabaseHealthCheck> {
  const startTime = Date.now();
  const errors: string[] = [];
  let isHealthy = false;
  let version: string | undefined;

  try {
    // Check connection status
    const connection = getConnectionStatus();

    if (!connection.isConnected) {
      errors.push('Database not connected');
      return {
        isHealthy: false,
        connection,
        latency: Date.now() - startTime,
        errors,
        timestamp: new Date(),
      };
    }

    // Test basic database operation
    const db = mongoose.connection.db;
    if (db) {
      // Ping the database
      await db.admin().ping();

      // Get database version
      const buildInfo = await db.admin().buildInfo();
      version = buildInfo.version;

      // Test a simple operation
      await db.collection('healthcheck').findOne({});

      isHealthy = true;
    } else {
      errors.push('Database connection not available');
    }
  } catch (error) {
    errors.push(
      `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return {
    isHealthy,
    connection: getConnectionStatus(),
    latency: Date.now() - startTime,
    errors,
    timestamp: new Date(),
    version,
  };
}

/**
 * Connection status monitor
 * Returns detailed connection information
 */
export interface IConnectionMonitor {
  status: IConnectionStatus;
  metrics: {
    activeConnections: number;
    totalConnections: number;
    uptime: number;
    lastActivity: Date;
  };
}

export function monitorConnection(): IConnectionMonitor {
  const connection = mongoose.connection;

  return {
    status: getConnectionStatus(),
    metrics: {
      activeConnections: connection.readyState === 1 ? 1 : 0,
      totalConnections: 1, // Single connection in our singleton pattern
      uptime:
        connection.readyState === 1
          ? Date.now() - (connection as any)._startTime || 0
          : 0,
      lastActivity: new Date(),
    },
  };
}

// =============================================================================
// QUERY PERFORMANCE HELPERS
// =============================================================================

/**
 * Query performance tracker
 */
export interface IQueryPerformance {
  query: string;
  collection: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

const queryPerformanceLog: IQueryPerformance[] = [];

/**
 * Wrap database operations with performance monitoring
 */
export async function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  queryInfo: { query: string; collection: string }
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const result = await operation();
    success = true;
    return result;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const performance: IQueryPerformance = {
      ...queryInfo,
      duration: Date.now() - startTime,
      timestamp: new Date(),
      success,
      error,
    };

    queryPerformanceLog.push(performance);

    // Keep only last 100 entries in development
    if (
      process.env.NODE_ENV === 'development' &&
      queryPerformanceLog.length > 100
    ) {
      queryPerformanceLog.shift();
    }

    // Log slow queries
    if (performance.duration > 1000) {
      console.warn(
        `🐌 Slow query detected: ${performance.query} on ${performance.collection} took ${performance.duration}ms`
      );
    }
  }
}

/**
 * Get query performance statistics
 */
export function getQueryPerformanceStats(): {
  totalQueries: number;
  averageDuration: number;
  slowQueries: IQueryPerformance[];
  recentQueries: IQueryPerformance[];
} {
  const slowQueries = queryPerformanceLog.filter((q) => q.duration > 1000);
  const recentQueries = queryPerformanceLog.slice(-10);
  const totalDuration = queryPerformanceLog.reduce(
    (sum, q) => sum + q.duration,
    0
  );

  return {
    totalQueries: queryPerformanceLog.length,
    averageDuration:
      queryPerformanceLog.length > 0
        ? totalDuration / queryPerformanceLog.length
        : 0,
    slowQueries,
    recentQueries,
  };
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Custom MongoDB error types
 */
export enum MongoErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_KEY_ERROR = 'DUPLICATE_KEY_ERROR',
  CAST_ERROR = 'CAST_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface IMongoError {
  type: MongoErrorType;
  message: string;
  originalError: Error;
  userMessage: string;
  code?: number;
  retryable: boolean;
}

/**
 * Parse and categorize MongoDB errors
 */
export function parseMongoError(error: Error): IMongoError {
  let type = MongoErrorType.UNKNOWN_ERROR;
  let userMessage = 'An unexpected database error occurred. Please try again.';
  let retryable = false;

  // Handle mongoose validation errors
  if (error.name === 'ValidationError') {
    type = MongoErrorType.VALIDATION_ERROR;
    userMessage =
      'The provided data is invalid. Please check your input and try again.';
    retryable = false;
  }
  // Handle duplicate key errors
  else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    type = MongoErrorType.DUPLICATE_KEY_ERROR;
    userMessage = 'This item already exists. Please use a different value.';
    retryable = false;
  }
  // Handle cast errors
  else if (error.name === 'CastError') {
    type = MongoErrorType.CAST_ERROR;
    userMessage = 'Invalid data format provided. Please check your input.';
    retryable = false;
  }
  // Handle connection errors
  else if (
    error.message.includes('connection') ||
    error.message.includes('ECONNREFUSED')
  ) {
    type = MongoErrorType.CONNECTION_ERROR;
    userMessage = 'Database connection issue. Please try again in a moment.';
    retryable = true;
  }
  // Handle timeout errors
  else if (
    error.message.includes('timeout') ||
    error.message.includes('ETIMEDOUT')
  ) {
    type = MongoErrorType.TIMEOUT_ERROR;
    userMessage = 'The operation took too long to complete. Please try again.';
    retryable = true;
  }

  return {
    type,
    message: error.message,
    originalError: error,
    userMessage,
    code: (error as any).code,
    retryable,
  };
}

/**
 * Retry logic for transient database failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = true } = options;
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      const mongoError = parseMongoError(lastError);

      // Don't retry non-retryable errors
      if (!mongoError.retryable) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;

      console.warn(
        `🔄 Database operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${currentDelay}ms...`,
        mongoError.message
      );

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError!;
}

// =============================================================================
// SECURITY HELPERS
// =============================================================================

/**
 * Sanitize user input to prevent NoSQL injection
 */
export function sanitizeQuery<T = any>(query: FilterQuery<T>): FilterQuery<T> {
  if (typeof query !== 'object' || query === null) {
    return {};
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(query)) {
    // Remove dangerous operators
    if (key.startsWith('$')) {
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Safe field projection builder
 */
export function projectFields(fields: string[]): Record<string, 1 | 0> {
  const projection: Record<string, 1 | 0> = {};

  for (const field of fields) {
    // Only allow alphanumeric characters, dots, and underscores
    if (/^[a-zA-Z0-9._]+$/.test(field)) {
      projection[field] = 1;
    }
  }

  return projection;
}

/**
 * Safe sort builder
 */
export function sortBuilder(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Record<string, SortOrder> {
  if (!sortBy || !/^[a-zA-Z0-9._]+$/.test(sortBy)) {
    return { createdAt: -1 }; // Default sort
  }

  return { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

/**
 * Standard pagination helper
 */
export function paginate(options: IPaginationOptions): {
  skip: number;
  limit: number;
  sort: Record<string, SortOrder>;
} {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Ensure reasonable limits
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);

  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    sort: sortBuilder(sortBy, sortOrder),
  };
}

/**
 * Execute paginated query
 */
export async function executePaginatedQuery<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: IPaginationOptions,
  projection?: Record<string, 1 | 0>
): Promise<IPaginatedResponse<T>> {
  const { skip, limit, sort } = paginate(options);

  const [data, total] = await Promise.all([
    model
      .find(sanitizeQuery(filter), projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    model.countDocuments(sanitizeQuery(filter)).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = options.page || 1;

  return {
    data: data as T[],
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
}

// =============================================================================
// COMMON DATABASE OPERATIONS
// =============================================================================

/**
 * Safe database operation wrapper
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<
  { success: true; data: T } | { success: false; error: IMongoError }
> {
  try {
    // Ensure database connection
    await connectToDatabase();

    const data = await withRetry(operation, { maxRetries: 2 });

    return { success: true, data };
  } catch (error) {
    const mongoError = parseMongoError(
      error instanceof Error ? error : new Error('Unknown error')
    );

    console.error(`❌ Database operation failed in ${context}:`, mongoError);

    return { success: false, error: mongoError };
  }
}

/**
 * Batch operation helper
 */
export async function executeBatch<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 10
): Promise<(T | Error)[]> {
  const results: (T | Error)[] = [];

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((operation) => operation())
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push(result.reason);
      }
    }
  }

  return results;
}

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Database connection debugger
 */
export function debugConnection(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const connection = mongoose.connection;

  console.log('🔍 Database Connection Debug Info:');
  console.log('════════════════════════════════════');
  console.log(`Ready State: ${connection.readyState} (1 = connected)`);
  console.log(`Host: ${connection.host}`);
  console.log(`Port: ${connection.port}`);
  console.log(`Database: ${connection.name}`);
  console.log(
    `Collections: ${Object.keys(connection.collections).join(', ') || 'None'}`
  );
  console.log('════════════════════════════════════');
}

/**
 * Query logger for development
 */
export function enableQueryLogging(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  mongoose.set(
    'debug',
    (collectionName: string, method: string, query: any) => {
      console.log(
        `🔍 MongoDB Query: ${collectionName}.${method}`,
        JSON.stringify(query, null, 2)
      );
    }
  );
}

/**
 * Performance monitoring setup
 */
export function setupPerformanceMonitoring(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Log connection events
  mongoose.connection.on('connected', () => {
    console.log('📊 Performance monitoring enabled');
    debugConnection();
  });

  // Periodic performance reports
  setInterval(() => {
    const stats = getQueryPerformanceStats();
    if (stats.totalQueries > 0) {
      console.log('📊 Query Performance Report:');
      console.log(`Total Queries: ${stats.totalQueries}`);
      console.log(`Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
      console.log(`Slow Queries: ${stats.slowQueries.length}`);
    }
  }, 60000); // Every minute
}

/**
 * Initialize development tools
 */
export function initDevTools(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Initializing database development tools...');
    enableQueryLogging();
    setupPerformanceMonitoring();
  }
}
