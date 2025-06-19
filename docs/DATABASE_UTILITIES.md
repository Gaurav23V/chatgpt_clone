# Database Utilities Documentation

This document explains how to use the comprehensive database utilities and middleware for the
ChatGPT clone project.

## Table of Contents

- [Overview](#overview)
- [Database Utilities](#database-utilities)
- [Middleware Functions](#middleware-functions)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Performance Monitoring](#performance-monitoring)
- [Security Features](#security-features)
- [Development Tools](#development-tools)

## Overview

The database utilities provide a robust foundation for all MongoDB operations with:

- **Health monitoring** - Real-time connection and performance monitoring
- **Error handling** - Comprehensive error parsing and user-friendly messages
- **Security** - Query sanitization and injection prevention
- **Performance** - Query timing and optimization helpers
- **Middleware** - Next.js integration for API routes
- **Development tools** - Debugging and logging capabilities

## Database Utilities

### Import Utilities

```typescript
import {
  // Health and monitoring
  performHealthCheck,
  monitorConnection,

  // Error handling
  parseMongoError,
  withRetry,
  safeDbOperation,

  // Performance
  withPerformanceMonitoring,
  getQueryPerformanceStats,

  // Security
  sanitizeQuery,
  projectFields,
  sortBuilder,

  // Pagination
  paginate,
  executePaginatedQuery,

  // Development
  debugConnection,
  enableQueryLogging,
  initDevTools,
} from '@/lib/db/utils';
```

### Health Monitoring

#### Check Database Health

```typescript
const healthCheck = await performHealthCheck();

if (healthCheck.isHealthy) {
  console.log(`Database is healthy (${healthCheck.latency}ms)`);
  console.log(`MongoDB version: ${healthCheck.version}`);
} else {
  console.error('Database issues:', healthCheck.errors);
}
```

#### Monitor Connection Status

```typescript
const monitor = monitorConnection();
console.log('Connection status:', monitor.status.isConnected);
console.log('Active connections:', monitor.metrics.activeConnections);
```

### Error Handling

#### Parse MongoDB Errors

```typescript
try {
  // Database operation
  await User.create(userData);
} catch (error) {
  const mongoError = parseMongoError(error);

  console.log('Error type:', mongoError.type);
  console.log('User message:', mongoError.userMessage);
  console.log('Retryable:', mongoError.retryable);
}
```

#### Safe Database Operations

```typescript
const result = await safeDbOperation(async () => {
  return await User.findById(userId);
}, 'Find user by ID');

if (result.success) {
  const user = result.data;
  // Use user data
} else {
  const error = result.error;
  // Handle error with user-friendly message
  console.error(error.userMessage);
}
```

#### Retry Logic

```typescript
const user = await withRetry(
  async () => {
    return await User.findByIdAndUpdate(userId, updateData);
  },
  {
    maxRetries: 3,
    delay: 1000,
    backoff: true, // Exponential backoff
  }
);
```

### Performance Monitoring

#### Monitor Query Performance

```typescript
const result = await withPerformanceMonitoring(
  async () => {
    return await User.find({ active: true }).limit(100);
  },
  { query: 'findActiveUsers', collection: 'users' }
);
```

#### Get Performance Statistics

```typescript
const stats = getQueryPerformanceStats();
console.log('Total queries:', stats.totalQueries);
console.log('Average duration:', stats.averageDuration);
console.log('Slow queries:', stats.slowQueries.length);
```

### Security Features

#### Sanitize Queries

```typescript
// Remove dangerous operators from user input
const userFilter = { name: req.body.name, $where: 'malicious code' };
const safeFilter = sanitizeQuery(userFilter);
// Result: { name: 'John' } - $where is removed
```

#### Project Fields Safely

```typescript
const allowedFields = ['name', 'email', 'profile.avatar'];
const projection = projectFields(allowedFields);
const users = await User.find({}, projection);
```

#### Build Sort Objects

```typescript
const sort = sortBuilder('createdAt', 'desc');
// Result: { createdAt: -1 }

const invalidSort = sortBuilder('$where', 'desc');
// Result: { createdAt: -1 } - falls back to default
```

### Pagination

#### Simple Pagination

```typescript
const options = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
const { skip, limit, sort } = paginate(options);

const users = await User.find({}).sort(sort).skip(skip).limit(limit);
```

#### Paginated Query with Response

```typescript
const filter = { active: true };
const options = { page: 1, limit: 20, sortBy: 'createdAt' };
const projection = projectFields(['name', 'email', 'createdAt']);

const result = await executePaginatedQuery(User, filter, options, projection);

// result.data contains the documents
// result.pagination contains metadata
console.log('Total pages:', result.pagination.totalPages);
console.log('Has next page:', result.pagination.hasNextPage);
```

## Middleware Functions

### Import Middleware

```typescript
import {
  withDatabase,
  withHealthCheck,
  withTiming,
  defaultDbMiddleware,
  databaseMiddleware,
} from '@/lib/db/middleware';
```

### API Routes Middleware

#### Wrap API Handler

```typescript
// pages/api/users.ts or app/api/users/route.ts
import { withDatabase } from '@/lib/db/middleware';
import type { IApiRequestWithTiming } from '@/lib/db/middleware';

async function handler(req: IApiRequestWithTiming, res: NextApiResponse) {
  // Database is guaranteed to be connected
  // Access timing info via req.timing

  const users = await User.find({});
  res.json(users);
}

export default withDatabase(handler, {
  enableTiming: true,
  retryAttempts: 3,
});
```

#### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { withHealthCheck } from '@/lib/db/middleware';

async function handler(req: IApiRequestWithTiming, res: NextApiResponse) {
  res.json({ status: 'healthy', timing: req.timing });
}

export default withHealthCheck(handler);
```

### App Router Middleware

#### Global Middleware

```typescript
// middleware.ts
import { NextRequest } from 'next/server';
import { defaultDbMiddleware } from '@/lib/db/middleware';

export async function middleware(request: NextRequest) {
  return await defaultDbMiddleware(request);
}

export const config = {
  matcher: ['/api/:path*'],
};
```

#### Custom Middleware

```typescript
import { databaseMiddleware } from '@/lib/db/middleware';

export async function middleware(request: NextRequest) {
  return await databaseMiddleware(request, {
    requireConnection: true,
    enableTiming: process.env.NODE_ENV === 'development',
    timeout: 5000,
    retryAttempts: 2,
  });
}
```

## Usage Examples

### Complete API Route Example

```typescript
// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  safeDbOperation,
  sanitizeQuery,
  executePaginatedQuery,
  projectFields,
  parseMongoError,
  MongoErrorType,
} from '@/lib/db/utils';
import { withTiming } from '@/lib/db/middleware';
import { Conversation } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');

    // Build safe filter
    let filter: any = {};
    if (search) {
      filter = sanitizeQuery({
        title: { $regex: search, $options: 'i' },
      });
    }

    // Execute paginated query with timing
    const result = await safeDbOperation(async () => {
      return await withTiming(
        () =>
          executePaginatedQuery(
            Conversation,
            filter,
            { page, limit, sortBy: 'updatedAt', sortOrder: 'desc' },
            projectFields(['title', 'messageCount', 'updatedAt'])
          ),
        'Get conversations'
      );
    }, 'Fetch conversations with pagination');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.userMessage },
        { status: result.error.type === MongoErrorType.CONNECTION_ERROR ? 503 : 500 }
      );
    }

    const { result: queryResult, duration } = result.data;

    return NextResponse.json(queryResult, {
      headers: {
        'X-Query-Duration': String(duration),
        'X-Total-Count': String(queryResult.pagination.total),
      },
    });
  } catch (error) {
    const mongoError = parseMongoError(error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json({ error: mongoError.userMessage }, { status: 500 });
  }
}
```

### Batch Operations

```typescript
import { executeBatch } from '@/lib/db/utils';

// Process multiple operations in batches
const operations = users.map(
  (user) => () => User.findByIdAndUpdate(user.id, { lastLogin: new Date() })
);

const results = await executeBatch(operations, 5); // Process 5 at a time

// Handle results
results.forEach((result, index) => {
  if (result instanceof Error) {
    console.error(`Operation ${index} failed:`, result.message);
  } else {
    console.log(`Operation ${index} succeeded`);
  }
});
```

## Development Tools

### Enable Development Tools

```typescript
// In your app initialization (e.g., app/layout.tsx or pages/_app.tsx)
import { initDevTools } from '@/lib/db/utils';

if (process.env.NODE_ENV === 'development') {
  initDevTools();
}
```

### Manual Debugging

```typescript
import { debugConnection, enableQueryLogging } from '@/lib/db/utils';

// Debug connection info
debugConnection();

// Enable query logging
enableQueryLogging();
```

### Performance Reports

```typescript
import { getQueryPerformanceStats } from '@/lib/db/utils';

// Get performance statistics
const stats = getQueryPerformanceStats();
console.log('Performance Report:', {
  totalQueries: stats.totalQueries,
  averageDuration: `${stats.averageDuration.toFixed(2)}ms`,
  slowQueries: stats.slowQueries.length,
  recentQueries: stats.recentQueries.map((q) => ({
    query: q.query,
    duration: q.duration,
    success: q.success,
  })),
});
```

## Error Types and Handling

### MongoDB Error Types

```typescript
enum MongoErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR', // Network/connection issues
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Data validation failed
  DUPLICATE_KEY_ERROR = 'DUPLICATE_KEY_ERROR', // Unique constraint violation
  CAST_ERROR = 'CAST_ERROR', // Type casting failed
  TIMEOUT_ERROR = 'TIMEOUT_ERROR', // Operation timeout
  UNKNOWN_ERROR = 'UNKNOWN_ERROR', // Other errors
}
```

### Error Response Format

All database errors return a consistent format:

```typescript
interface IMongoError {
  type: MongoErrorType;
  message: string; // Technical error message
  userMessage: string; // User-friendly message
  originalError: Error; // Original error object
  code?: number; // MongoDB error code
  retryable: boolean; // Whether operation can be retried
}
```

## Best Practices

1. **Always use `safeDbOperation`** for database operations in API routes
2. **Sanitize user input** with `sanitizeQuery` before database queries
3. **Use pagination helpers** for any list endpoints
4. **Monitor performance** with `withPerformanceMonitoring` for critical operations
5. **Enable development tools** in development environment
6. **Handle errors gracefully** with user-friendly messages
7. **Use middleware** to ensure database connectivity in API routes
8. **Project fields** to limit data exposure and improve performance

## Health Check Endpoint

Your application now includes a comprehensive health check endpoint at `/api/health` that provides:

- Database connectivity status
- Connection latency
- MongoDB version information
- Query performance statistics
- Connection monitoring metrics

Use this endpoint for monitoring and load balancer health checks.
