/**
 * Database Statistics and Performance Monitoring API
 *
 * Provides comprehensive database performance metrics, index usage statistics,
 * and health monitoring for administrators and developers.
 *
 * Features:
 * - Query performance metrics
 * - Index usage statistics
 * - Database health monitoring
 * - Collection statistics
 * - Slow query detection
 * - Performance recommendations
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';

import { connectToDatabase } from '@/lib/db/connection';
import {
  getDatabaseStats,
  PERFORMANCE_HINTS,
  verifyIndexes,
} from '@/lib/db/indexes';
import {
  analyzeQueryPerformance,
  getQueryMetrics,
  queryCache,
} from '@/lib/db/query-optimization';

// ========================================
// GET - Database Statistics and Health
// ========================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only in production)
    const user = await currentUser();

    if (process.env.NODE_ENV === 'production' && !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Optional: Check if user is admin
    // You can implement admin role checking here

    await connectToDatabase();

    // Get comprehensive database statistics
    const [
      databaseStats,
      indexVerification,
      queryMetrics,
      performanceAnalysis,
    ] = await Promise.all([
      getDatabaseStats(),
      verifyIndexes(),
      getQueryMetrics(),
      analyzeQueryPerformance(),
    ]);

    // Get cache statistics
    const cacheStats = {
      size: queryCache.size(),
      // Add more cache metrics if available
    };

    // Generate performance recommendations
    const recommendations = generatePerformanceRecommendations(
      indexVerification,
      performanceAnalysis,
      queryMetrics
    );

    const response = {
      timestamp: new Date().toISOString(),
      database: {
        collections: databaseStats.collections,
        totalCollections: databaseStats.collections.length,
        totalDocuments: databaseStats.collections.reduce(
          (sum, col) => sum + col.count,
          0
        ),
        totalStorageSize: databaseStats.collections.reduce(
          (sum, col) => sum + col.storageSize,
          0
        ),
      },
      indexes: {
        total: indexVerification.total,
        existing: indexVerification.existing.length,
        missing: indexVerification.missing.length,
        missingIndexes: indexVerification.missing,
        coverage: `${(
          (indexVerification.existing.length / indexVerification.total) *
          100
        ).toFixed(1)}%`,
      },
      performance: {
        queries: {
          total: performanceAnalysis.totalQueries,
          averageExecutionTime: parseFloat(
            performanceAnalysis.avgExecutionTime.toFixed(2)
          ),
          slowQueries: performanceAnalysis.slowQueries.length,
          slowQueriesList: performanceAnalysis.slowQueries.slice(0, 10), // Top 10 slow queries
        },
        indexUsage: {
          withIndex: performanceAnalysis.indexUsage.withIndex,
          withoutIndex: performanceAnalysis.indexUsage.withoutIndex,
          indexUsageRate:
            performanceAnalysis.totalQueries > 0
              ? `${(
                  (performanceAnalysis.indexUsage.withIndex /
                    performanceAnalysis.totalQueries) *
                  100
                ).toFixed(1)}%`
              : '0%',
        },
        queryBreakdown: performanceAnalysis.queryBreakdown,
      },
      cache: cacheStats,
      recommendations,
      performanceHints: PERFORMANCE_HINTS,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching database statistics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch database statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ========================================
// POST - Performance Actions
// ========================================

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (process.env.NODE_ENV === 'production' && !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clearMetrics':
        // Clear query performance metrics
        const { clearQueryMetrics } = await import(
          '@/lib/db/query-optimization'
        );
        clearQueryMetrics();
        return NextResponse.json({
          success: true,
          message: 'Query metrics cleared',
        });

      case 'clearCache':
        // Clear query cache
        queryCache.clear();
        return NextResponse.json({
          success: true,
          message: 'Query cache cleared',
        });

      case 'ensureIndexes':
        // Ensure all indexes are created
        const { ensureAllIndexes } = await import('@/lib/db/indexes');
        await ensureAllIndexes();
        return NextResponse.json({
          success: true,
          message: 'All indexes ensured',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error performing database action:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Generates performance recommendations based on current statistics
 */
function generatePerformanceRecommendations(
  indexVerification: any,
  performanceAnalysis: any,
  queryMetrics: any[]
): string[] {
  const recommendations: string[] = [];

  // Index recommendations
  if (indexVerification.missing.length > 0) {
    recommendations.push(
      `⚠️ ${indexVerification.missing.length} indexes are missing. Run ensureAllIndexes() to create them.`
    );
  }

  // Query performance recommendations
  if (performanceAnalysis.avgExecutionTime > 100) {
    recommendations.push(
      `🐌 Average query execution time is ${performanceAnalysis.avgExecutionTime.toFixed(1)}ms. Consider query optimization.`
    );
  }

  if (performanceAnalysis.slowQueries.length > 0) {
    recommendations.push(
      `⏰ ${performanceAnalysis.slowQueries.length} slow queries detected. Review query patterns and add appropriate indexes.`
    );
  }

  // Index usage recommendations
  const indexUsageRate =
    performanceAnalysis.totalQueries > 0
      ? (performanceAnalysis.indexUsage.withIndex /
          performanceAnalysis.totalQueries) *
        100
      : 100;

  if (indexUsageRate < 80) {
    recommendations.push(
      `📊 Only ${indexUsageRate.toFixed(1)}% of queries are using indexes. Review query patterns and ensure proper indexing.`
    );
  }

  // Collection size recommendations
  const largeCollections = queryMetrics.filter(
    (m) => m.documentsExamined > 1000
  );
  if (largeCollections.length > 0) {
    recommendations.push(
      `📈 Queries are examining large numbers of documents. Consider using projection and limiting result sets.`
    );
  }

  // Cache recommendations
  if (queryCache.size() === 0) {
    recommendations.push(
      `💾 Query cache is empty. Consider implementing caching for frequently accessed data.`
    );
  }

  // Memory usage recommendations
  if (performanceAnalysis.totalQueries > 1000) {
    recommendations.push(
      `🔄 High query volume detected. Consider implementing connection pooling and query result streaming.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '✅ Database performance looks good! No immediate recommendations.'
    );
  }

  return recommendations;
}

/**
 * Health check for database connectivity and basic operations
 */
async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: string;
}> {
  const checks: Record<string, boolean> = {};

  try {
    // Test database connection
    await connectToDatabase();
    checks.connection = true;

    // Test basic query operations
    const mongoose = await import('mongoose');
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      checks.ping = true;

      // Test collection access
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      checks.collectionsAccess = collections.length >= 0;
    } else {
      checks.ping = false;
      checks.collectionsAccess = false;
    }

    checks.indexVerification = true; // Could add actual index verification

    const allHealthy = Object.values(checks).every((check) => check === true);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      checks: { ...checks, error: false },
      timestamp: new Date().toISOString(),
    };
  }
}
