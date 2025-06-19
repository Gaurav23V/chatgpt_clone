/**
 * Database Middleware for ChatGPT Clone
 *
 * This module provides middleware functions to:
 * - Ensure database connection before API calls
 * - Add request timing for database operations
 * - Handle connection failures gracefully
 * - Provide Next.js middleware helpers
 */

import type { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';

import { connectToDatabase, getConnectionStatus } from './connection';
import { parseMongoError, withRetry, performHealthCheck, type IMongoError } from './utils';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Extended API request with database timing information
 */
export interface IApiRequestWithTiming extends NextApiRequest {
  timing?: {
    dbConnectionStart: number;
    dbConnectionEnd: number;
    dbConnectionDuration: number;
  };
}

/**
 * Database middleware options
 */
export interface IDbMiddlewareOptions {
  requireConnection?: boolean;
  enableTiming?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Middleware response type
 */
export type MiddlewareResult = 
  | { success: true; timing?: any }
  | { success: false; error: IMongoError; status: number };

// =============================================================================
// CORE MIDDLEWARE FUNCTIONS
// =============================================================================

/**
 * Ensure database connection middleware
 * Guarantees database is connected before API handler execution
 */
export async function ensureDbConnection(
  options: IDbMiddlewareOptions = {}
): Promise<MiddlewareResult> {
  const {
    requireConnection = true,
    enableTiming = true,
    timeout = 10000,
    retryAttempts = 3,
  } = options;

  const startTime = Date.now();
  let timing: any = undefined;

  try {
    // Check if connection is already established
    const status = getConnectionStatus();
    
    if (status.isConnected && !status.error) {
      if (enableTiming) {
        timing = {
          dbConnectionStart: startTime,
          dbConnectionEnd: Date.now(),
          dbConnectionDuration: Date.now() - startTime,
          cached: true,
        };
      }
      return { success: true, timing };
    }

    // If connection is required, establish it
    if (requireConnection) {
      await withRetry(
        async () => {
          const connection = await connectToDatabase();
          if (!connection) {
            throw new Error('Failed to establish database connection');
          }
        },
        { maxRetries: retryAttempts, delay: 1000 }
      );

      if (enableTiming) {
        timing = {
          dbConnectionStart: startTime,
          dbConnectionEnd: Date.now(),
          dbConnectionDuration: Date.now() - startTime,
          cached: false,
        };
      }

      return { success: true, timing };
    }

    return { success: true };
  } catch (error) {
    const mongoError = parseMongoError(
      error instanceof Error ? error : new Error('Database connection failed')
    );

    return {
      success: false,
      error: mongoError,
      status: mongoError.type === 'CONNECTION_ERROR' ? 503 : 500,
    };
  }
}

/**
 * Database health check middleware
 * Performs comprehensive health check before allowing requests
 */
export async function dbHealthCheckMiddleware(): Promise<MiddlewareResult> {
  try {
    const healthCheck = await performHealthCheck();

    if (healthCheck.isHealthy) {
      return { 
        success: true, 
        timing: { healthCheckDuration: healthCheck.latency } 
      };
    } else {
      const error: IMongoError = {
        type: 'CONNECTION_ERROR' as any,
        message: `Health check failed: ${healthCheck.errors.join(', ')}`,
        originalError: new Error('Health check failed'),
        userMessage: 'Database is currently unavailable. Please try again later.',
        retryable: true,
      };

      return {
        success: false,
        error,
        status: 503,
      };
    }
  } catch (error) {
    const mongoError = parseMongoError(
      error instanceof Error ? error : new Error('Health check failed')
    );

    return {
      success: false,
      error: mongoError,
      status: 503,
    };
  }
}

// =============================================================================
// NEXT.JS API ROUTES MIDDLEWARE
// =============================================================================

/**
 * Higher-order function to wrap API routes with database middleware
 */
export function withDatabase<T = any>(
  handler: (req: IApiRequestWithTiming, res: NextApiResponse<T>) => Promise<void> | void,
  options: IDbMiddlewareOptions = {}
) {
  return async (req: IApiRequestWithTiming, res: NextApiResponse<T>) => {
    const startTime = Date.now();

    try {
      // Ensure database connection
      const result = await ensureDbConnection(options);

      if (!result.success) {
        console.error('❌ Database middleware failed:', result.error);
        
        return res.status(result.status).json({
          error: result.error.userMessage,
          code: result.error.type,
          retryable: result.error.retryable,
        } as any);
      }

      // Add timing information to request
      if (result.timing && options.enableTiming !== false) {
        req.timing = result.timing;
      }

      // Add response headers for debugging
      if (process.env.NODE_ENV === 'development') {
        res.setHeader('X-DB-Connection-Duration', 
          result.timing?.dbConnectionDuration || 0);
        res.setHeader('X-DB-Connection-Cached', 
          result.timing?.cached || false);
      }

      // Execute the actual handler
      await handler(req, res);

      // Add total request timing
      if (options.enableTiming !== false) {
        const totalDuration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          res.setHeader('X-Total-Duration', totalDuration);
        }
      }
    } catch (error) {
      console.error('❌ API handler error:', error);
      
      const mongoError = parseMongoError(
        error instanceof Error ? error : new Error('Unknown error')
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: mongoError.userMessage,
          code: mongoError.type,
          retryable: mongoError.retryable,
        } as any);
      }
    }
  };
}

/**
 * Database health check endpoint middleware
 */
export function withHealthCheck<T = any>(
  handler: (req: IApiRequestWithTiming, res: NextApiResponse<T>) => Promise<void> | void
) {
  return async (req: IApiRequestWithTiming, res: NextApiResponse<T>) => {
    try {
      const result = await dbHealthCheckMiddleware();

      if (!result.success) {
        return res.status(result.status).json({
          healthy: false,
          error: result.error.userMessage,
          code: result.error.type,
        } as any);
      }

      // Add health check timing to request
      req.timing = result.timing;

      // Execute the handler
      await handler(req, res);
    } catch (error) {
      console.error('❌ Health check handler error:', error);
      
      res.status(503).json({
        healthy: false,
        error: 'Health check failed',
      } as any);
    }
  };
}

// =============================================================================
// NEXT.JS APP ROUTER MIDDLEWARE
// =============================================================================

/**
 * App Router middleware for database operations
 */
export async function databaseMiddleware(
  request: NextRequest,
  options: IDbMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const startTime = Date.now();

  try {
    // Skip middleware for static assets and certain paths
    if (shouldSkipMiddleware(request.nextUrl.pathname)) {
      return null;
    }

    // Ensure database connection for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const result = await ensureDbConnection(options);

      if (!result.success) {
        console.error('❌ Database middleware failed for API route:', result.error);
        
        return new NextResponse(
          JSON.stringify({
            error: result.error.userMessage,
            code: result.error.type,
            retryable: result.error.retryable,
          }),
          {
            status: result.status,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Add timing headers for development
      if (process.env.NODE_ENV === 'development' && result.timing) {
        const response = NextResponse.next();
        response.headers.set('X-DB-Connection-Duration', 
          String(result.timing.dbConnectionDuration));
        response.headers.set('X-DB-Connection-Cached', 
          String(result.timing.cached));
        return response;
      }
    }

    return null; // Continue to next middleware
  } catch (error) {
    console.error('❌ Database middleware error:', error);
    
    const mongoError = parseMongoError(
      error instanceof Error ? error : new Error('Middleware error')
    );

    return new NextResponse(
      JSON.stringify({
        error: mongoError.userMessage,
        code: mongoError.type,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Check if middleware should be skipped for certain paths
 */
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPaths = [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/images',
    '/icons',
    '/static',
  ];

  return skipPaths.some(path => pathname.startsWith(path));
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a timed database operation wrapper
 */
export function withTiming<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️  ${operationName} completed in ${duration}ms`);
      }
      
      resolve({ result, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`⏱️  ${operationName} failed after ${duration}ms:`, error);
      }
      
      reject(error);
    }
  });
}

/**
 * Database operation timeout wrapper
 */
export function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: Array<(req: NextRequest) => Promise<NextResponse | null>>
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    for (const middleware of middlewares) {
      const result = await middleware(req);
      if (result) {
        return result;
      }
    }
    return null;
  };
}

// =============================================================================
// EXPORTED HELPERS
// =============================================================================

/**
 * Default database middleware configuration
 */
export const defaultDbMiddleware = (req: NextRequest) => 
  databaseMiddleware(req, {
    requireConnection: true,
    enableTiming: process.env.NODE_ENV === 'development',
    timeout: 10000,
    retryAttempts: 3,
  });

/**
 * Health check middleware configuration
 */
export const healthCheckMiddleware = (req: NextRequest) =>
  databaseMiddleware(req, {
    requireConnection: false,
    enableTiming: true,
    timeout: 5000,
    retryAttempts: 1,
  });

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

/**
 * Example API route usage:
 * 
 * ```typescript
 * // pages/api/users.ts
 * import { withDatabase } from '@/lib/db/middleware';
 * 
 * async function handler(req: IApiRequestWithTiming, res: NextApiResponse) {
 *   // Database is guaranteed to be connected here
 *   // Access timing info via req.timing
 * }
 * 
 * export default withDatabase(handler, { enableTiming: true });
 * ```
 * 
 * Example App Router middleware:
 * 
 * ```typescript
 * // middleware.ts
 * import { defaultDbMiddleware } from '@/lib/db/middleware';
 * 
 * export async function middleware(request: NextRequest) {
 *   return await defaultDbMiddleware(request);
 * }
 * ```
 */ 