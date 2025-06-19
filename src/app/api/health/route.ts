/**
 * Database Health Check API Route
 * 
 * This endpoint demonstrates the database utilities and provides
 * a comprehensive health check for the database connection.
 */

import { NextRequest, NextResponse } from 'next/server';

import { 
  performHealthCheck,
  getQueryPerformanceStats,
  monitorConnection,
  debugConnection,
  type IDatabaseHealthCheck,
  type IConnectionMonitor
} from '@/lib/db/utils';
import { withTiming } from '@/lib/db/middleware';

export async function GET(request: NextRequest) {
  try {
    // Perform comprehensive health check with timing
    const { result: healthCheck, duration: healthCheckDuration } = await withTiming(
      () => performHealthCheck(),
      'Database Health Check'
    );

    // Get connection monitoring info
    const connectionMonitor = monitorConnection();

    // Get query performance statistics
    const performanceStats = getQueryPerformanceStats();

    // Debug connection in development
    if (process.env.NODE_ENV === 'development') {
      debugConnection();
    }

    const response = {
      status: healthCheck.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      healthCheck: {
        ...healthCheck,
        healthCheckDuration,
      },
      connection: connectionMonitor,
      performance: performanceStats,
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(response, {
      status: healthCheck.isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': String(healthCheckDuration),
        'X-DB-Latency': String(healthCheck.latency),
      },
    });

  } catch (error) {
    console.error('❌ Health check API error:', error);

    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'HEALTH_CHECK_ERROR',
      },
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
} 