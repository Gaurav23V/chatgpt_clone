# Database Optimization Guide

This document provides a comprehensive overview of the database optimizations implemented in the
ChatGPT clone, including indexes, query optimization, performance monitoring, and best practices.

## Table of Contents

- [Overview](#overview)
- [Database Indexes](#database-indexes)
- [Query Optimization](#query-optimization)
- [Performance Monitoring](#performance-monitoring)
- [Data Validation](#data-validation)
- [Caching Strategy](#caching-strategy)
- [Startup and Initialization](#startup-and-initialization)
- [API Endpoints](#api-endpoints)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The database optimization system provides:

- **Comprehensive Indexing**: Optimized indexes for all models (User, Conversation, Message)
- **Query Performance Monitoring**: Real-time query performance tracking and analysis
- **Data Validation**: Robust input validation and sanitization
- **Caching Layer**: Query result caching with TTL
- **Performance Analytics**: Detailed performance metrics and recommendations
- **Automated Startup**: Index creation and health checks on application start

## Database Indexes

### User Model Indexes

```typescript
// Primary indexes
{ clerkId: 1 } (unique)           // Primary user lookups
{ email: 1 }                     // Email-based queries
{ username: 1 } (sparse)         // Username lookups

// Compound indexes
{ isActive: 1, lastLoginAt: -1 } // Active users by login
{ 'subscription.status': 1, 'subscription.plan': 1 } // Subscription queries
{ 'subscription.plan': 1, 'usage.messagesThisMonth': -1 } // Usage analytics

// Additional indexes
{ createdAt: -1 }                // Registration analytics
{ lastLoginAt: -1 }              // Activity tracking
```

### Conversation Model Indexes

```typescript
// Primary compound indexes
{ clerkId: 1, updatedAt: -1 }    // User conversations by activity
{ clerkId: 1, status: 1 }        // Filter by conversation status
{ clerkId: 1, lastMessageAt: -1 } // Recent message activity
{ clerkId: 1, messageCount: -1 } // Most active conversations

// Specialized indexes
{ clerkId: 1, pinnedAt: -1 } (sparse) // Pinned conversations
{ status: 1, archivedAt: -1 } (sparse) // Archived cleanup
{ 'settings.isPublic': 1, updatedAt: -1 } // Public conversations

// Text search
{ title: 'text', description: 'text', tags: 'text' } // Full-text search
```

### Message Model Indexes

```typescript
// Primary compound indexes
{ conversationId: 1, createdAt: 1 }  // Messages in chronological order
{ conversationId: 1, createdAt: -1 } // Messages in reverse order
{ clerkId: 1, createdAt: -1 }        // User messages

// Specialized indexes
{ role: 1, conversationId: 1 }       // Filter by message role
{ 'aiMetadata.model': 1, createdAt: -1 } // AI model analytics
{ deletedAt: 1 } (sparse)            // Soft-deleted cleanup
{ parentMessageId: 1 } (sparse)      // Message threading

// Text search
{ content: 'text' }                  // Message content search
```

### Managing Indexes

```typescript
import { ensureAllIndexes, verifyIndexes } from '@/lib/db';

// Create all indexes
await ensureAllIndexes();

// Verify index status
const status = await verifyIndexes();
console.log(`Indexes: ${status.existing.length}/${status.total}`);
```

## Query Optimization

### Performance Monitoring

```typescript
import { monitorQuery, analyzeQueryPerformance } from '@/lib/db';

// Monitor individual queries
const users = await monitorQuery(User.find({ isActive: true }).lean(), 'findActiveUsers', 'users');

// Analyze overall performance
const analysis = analyzeQueryPerformance();
console.log(`Avg execution time: ${analysis.avgExecutionTime}ms`);
console.log(`Slow queries: ${analysis.slowQueries.length}`);
```

### Query Builders

```typescript
import { buildUserConversationsQuery, buildConversationMessagesQuery } from '@/lib/db';

// Optimized conversation queries
const conversationQuery = buildUserConversationsQuery(clerkId, {
  status: ['active'],
  limit: 20,
  sortBy: 'lastMessageAt',
  sortOrder: -1,
});

// Optimized message queries
const messageQuery = buildConversationMessagesQuery(conversationId, {
  limit: 50,
  sortOrder: 1,
});
```

### Projections

```typescript
import { PROJECTIONS, createProjection } from '@/lib/db';

// Use predefined projections
const users = await User.find(filter, PROJECTIONS.USER_BASIC);

// Create custom projections
const customProjection = createProjection(['clerkId', 'email', 'firstName']);
const result = await User.find(filter, customProjection);
```

## Performance Monitoring

### Real-time Metrics

```typescript
import { getQueryMetrics, analyzeQueryPerformance } from '@/lib/db';

// Get raw metrics
const metrics = getQueryMetrics();

// Get analysis
const analysis = analyzeQueryPerformance();
console.log('Performance Analysis:', {
  totalQueries: analysis.totalQueries,
  avgExecutionTime: analysis.avgExecutionTime,
  indexUsageRate: analysis.indexUsage.withIndex / analysis.totalQueries,
  slowQueries: analysis.slowQueries.length,
});
```

### Database Statistics

```typescript
import { getDatabaseStats } from '@/lib/db';

const stats = await getDatabaseStats();
console.log('Database Stats:', {
  collections: stats.collections.length,
  totalDocuments: stats.collections.reduce((sum, col) => sum + col.count, 0),
  indexCoverage: stats.indexes.existing.length / stats.indexes.total,
});
```

## Data Validation

### Input Validation

```typescript
import { validateUserData, validateConversationData, throwIfInvalid } from '@/lib/db';

// Validate user input
const userErrors = validateUserData(userData);
throwIfInvalid(userErrors);

// Validate conversation data
const conversationErrors = validateConversationData(conversationData);
throwIfInvalid(conversationErrors);
```

### Sanitization

```typescript
import { sanitizeHTML, sanitizeText, preventMongoInjection } from '@/lib/db';

// Sanitize user input
const cleanHTML = sanitizeHTML(userInput);
const cleanText = sanitizeText(userInput, { maxLength: 1000 });

// Prevent MongoDB injection
const safeData = preventMongoInjection(inputData);
```

### Custom Validation

```typescript
import { validateText, validateEmail, validateObjectId } from '@/lib/db';

// Validate specific data types
const emailErrors = validateEmail(email);
const textErrors = validateText(content, 'content', {
  required: true,
  minLength: 1,
  maxLength: 1000,
});
const idErrors = validateObjectId(id, 'conversationId');
```

## Caching Strategy

### Query Caching

```typescript
import { withCache, CACHE_KEYS, queryCache } from '@/lib/db';

// Cache query results
const conversations = await withCache(
  CACHE_KEYS.userConversations(clerkId),
  () => Conversation.find({ clerkId }).lean(),
  300 // 5 minutes TTL
);

// Manual cache management
queryCache.set('custom-key', data, 600);
const cached = queryCache.get('custom-key');
queryCache.delete('custom-key');
```

### Cache Invalidation

```typescript
import { invalidateCachePattern } from '@/lib/db';

// Invalidate user-specific cache
invalidateCachePattern(`user:${clerkId}:*`);

// Clear all cache
queryCache.clear();
```

## Startup and Initialization

### Application Startup

```typescript
import { nextjsInit, environmentBasedInit } from '@/lib/db';

// Next.js initialization (recommended)
await nextjsInit();

// Manual environment-based initialization
await environmentBasedInit();
```

### Development Setup

```typescript
import { developmentStartup, registerShutdownHandlers } from '@/lib/db';

// Development initialization with verbose logging
await developmentStartup();

// Register graceful shutdown handlers
registerShutdownHandlers();
```

### Production Setup

```typescript
import { quickStartup } from '@/lib/db';

// Quick production startup (indexes created in background)
const success = await quickStartup();
```

## API Endpoints

### Database Statistics Endpoint

```bash
# Get comprehensive database statistics
GET /api/admin/database-stats

# Response includes:
# - Collection statistics
# - Index status and coverage
# - Query performance metrics
# - Performance recommendations
```

### Administrative Actions

```bash
# Clear query metrics
POST /api/admin/database-stats
Content-Type: application/json
{ "action": "clearMetrics" }

# Clear query cache
POST /api/admin/database-stats
Content-Type: application/json
{ "action": "clearCache" }

# Ensure all indexes
POST /api/admin/database-stats
Content-Type: application/json
{ "action": "ensureIndexes" }
```

## Best Practices

### Query Optimization

1. **Always use projections** to limit returned fields
2. **Use lean() queries** for read-only operations
3. **Implement pagination** with cursor-based approach
4. **Monitor query performance** in development
5. **Use compound indexes** for multi-field queries

### Index Management

1. **Create indexes in background** to avoid blocking operations
2. **Use sparse indexes** for optional fields
3. **Monitor index usage** and remove unused indexes
4. **Consider index size** impact on write performance
5. **Test index effectiveness** with explain plans

### Data Validation

1. **Validate at the API layer** before database operations
2. **Sanitize user input** to prevent XSS and injection attacks
3. **Use type-safe validation** with TypeScript
4. **Implement size limits** to prevent abuse
5. **Handle validation errors** gracefully

### Performance Monitoring

1. **Track query execution times** in development
2. **Set up alerts** for slow queries in production
3. **Monitor index usage** regularly
4. **Analyze query patterns** to optimize indexes
5. **Use caching** for frequently accessed data

## Troubleshooting

### Common Issues

#### Slow Queries

```typescript
// Check query explanation
import { explainQuery } from '@/lib/db';

const query = User.find({ isActive: true });
await explainQuery(User, query, 'findActiveUsers');
```

#### Missing Indexes

```typescript
// Verify and create missing indexes
import { verifyIndexes, ensureAllIndexes } from '@/lib/db';

const verification = await verifyIndexes();
if (verification.missing.length > 0) {
  console.log('Missing indexes:', verification.missing);
  await ensureAllIndexes();
}
```

#### Cache Issues

```typescript
// Debug cache performance
import { queryCache, analyzeQueryPerformance } from '@/lib/db';

console.log('Cache size:', queryCache.size());
const analysis = analyzeQueryPerformance();
console.log('Cache hit rate:' /* calculate from metrics */);
```

### Performance Debugging

1. **Enable query monitoring** in development
2. **Use explain plans** to understand query execution
3. **Monitor resource usage** (CPU, memory, disk I/O)
4. **Check index effectiveness** with database tools
5. **Analyze slow query logs** regularly

### Memory Management

1. **Use streaming** for large result sets
2. **Implement proper pagination** to limit memory usage
3. **Clear unused cache entries** regularly
4. **Monitor connection pool** usage
5. **Set query timeouts** to prevent hanging operations

## Configuration

### Environment Variables

```bash
# Database connection
MONGODB_URI=mongodb://localhost:27017/chatgpt_clone

# Performance settings
ENABLE_QUERY_MONITORING=true
CACHE_TTL_SECONDS=300
MAX_QUERY_TIME_MS=5000

# Development settings
LOG_SLOW_QUERIES=true
EXPLAIN_QUERIES=true
```

### Recommended MongoDB Settings

```javascript
// MongoDB configuration
{
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,

  // Query settings
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,

  // Write concern
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 5000
  }
}
```

This optimization system provides a robust foundation for high-performance database operations in
your ChatGPT clone application.
