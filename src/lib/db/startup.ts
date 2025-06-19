/**
 * Database Startup Initialization
 *
 * This module handles database initialization tasks that should be performed
 * when the application starts, including index creation, connection verification,
 * and basic health checks.
 *
 * Features:
 * - Automatic index creation on startup
 * - Database connection verification
 * - Health checks and monitoring setup
 * - Performance optimization initialization
 * - Error handling and graceful degradation
 */

import { connectToDatabase } from './connection';
import { ensureAllIndexes, verifyIndexes } from './indexes';

// ========================================
// STARTUP CONFIGURATION
// ========================================

interface StartupConfig {
  createIndexes: boolean;
  verifyConnection: boolean;
  performHealthCheck: boolean;
  logLevel: 'minimal' | 'detailed' | 'verbose';
}

const DEFAULT_CONFIG: StartupConfig = {
  createIndexes: true,
  verifyConnection: true,
  performHealthCheck: true,
  logLevel: process.env.NODE_ENV === 'development' ? 'detailed' : 'minimal',
};

// ========================================
// STARTUP FUNCTIONS
// ========================================

/**
 * Initialize database with comprehensive setup
 */
export async function initializeDatabase(
  config: Partial<StartupConfig> = {}
): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    log('🚀 Starting database initialization...', finalConfig.logLevel);

    // Step 1: Connect to database
    if (finalConfig.verifyConnection) {
      await connectToDatabase();
      log('✅ Database connection established', finalConfig.logLevel);
    }

    // Step 2: Create indexes
    if (finalConfig.createIndexes) {
      log('📚 Creating database indexes...', finalConfig.logLevel);
      await ensureAllIndexes();
      log('✅ Database indexes created successfully', finalConfig.logLevel);
    }

    // Step 3: Verify indexes
    if (
      finalConfig.logLevel === 'detailed' ||
      finalConfig.logLevel === 'verbose'
    ) {
      const indexVerification = await verifyIndexes();
      log('📊 Index verification results:', finalConfig.logLevel);
      log(
        `   - Total indexes: ${indexVerification.total}`,
        finalConfig.logLevel
      );
      log(
        `   - Existing: ${indexVerification.existing.length}`,
        finalConfig.logLevel
      );
      log(
        `   - Missing: ${indexVerification.missing.length}`,
        finalConfig.logLevel
      );

      if (
        indexVerification.missing.length > 0 &&
        finalConfig.logLevel === 'verbose'
      ) {
        log('⚠️ Missing indexes:', finalConfig.logLevel);
        indexVerification.missing.forEach((index) => {
          log(`   - ${index}`, finalConfig.logLevel);
        });
      }
    }

    // Step 4: Health check
    if (finalConfig.performHealthCheck) {
      const healthCheck = await performStartupHealthCheck();
      if (!healthCheck.success) {
        log('⚠️ Health check warnings detected', finalConfig.logLevel);
        if (finalConfig.logLevel === 'verbose') {
          log(`   Details: ${healthCheck.message}`, finalConfig.logLevel);
        }
      } else {
        log('✅ Database health check passed', finalConfig.logLevel);
      }
    }

    log(
      '🎉 Database initialization completed successfully!',
      finalConfig.logLevel
    );

    return {
      success: true,
      message: 'Database initialized successfully',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    log(
      `💥 Database initialization failed: ${errorMessage}`,
      finalConfig.logLevel
    );

    return {
      success: false,
      message: 'Database initialization failed',
      details: errorMessage,
    };
  }
}

/**
 * Quick database startup for production
 */
export async function quickStartup(): Promise<boolean> {
  try {
    await connectToDatabase();

    // Only create missing indexes in production to avoid blocking startup
    if (process.env.NODE_ENV === 'production') {
      // Run index creation in background
      ensureAllIndexes().catch((error) => {
        console.error('Background index creation failed:', error);
      });
    } else {
      await ensureAllIndexes();
    }

    return true;
  } catch (error) {
    console.error('Quick database startup failed:', error);
    return false;
  }
}

/**
 * Development-only full initialization
 */
export async function developmentStartup(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Development startup called in non-development environment');
    return;
  }

  const result = await initializeDatabase({
    logLevel: 'verbose',
    createIndexes: true,
    verifyConnection: true,
    performHealthCheck: true,
  });

  if (!result.success) {
    console.error('Development database startup failed:', result.details);
    // Don't throw in development to allow for graceful degradation
  }
}

// ========================================
// HEALTH CHECK FUNCTIONS
// ========================================

/**
 * Comprehensive startup health check
 */
async function performStartupHealthCheck(): Promise<{
  success: boolean;
  message: string;
  checks: Record<string, boolean>;
}> {
  const checks: Record<string, boolean> = {};

  try {
    // Test basic connection
    await connectToDatabase();
    checks.connection = true;

    // Test MongoDB operations
    const mongoose = await import('mongoose');
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      checks.ping = true;

      // Test collection access
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      checks.collectionsAccess = true;
      checks.hasCollections = collections.length > 0;
    } else {
      checks.ping = false;
      checks.collectionsAccess = false;
      checks.hasCollections = false;
    }

    // Test model operations (basic query)
    try {
      const { User } = await import('./models');
      await User.countDocuments({}).limit(1);
      checks.modelQueries = true;
    } catch (error) {
      checks.modelQueries = false;
    }

    const allPassed = Object.values(checks).every((check) => check === true);

    return {
      success: allPassed,
      message: allPassed
        ? 'All health checks passed'
        : 'Some health checks failed',
      checks,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Health check failed',
      checks: { ...checks, error: false },
    };
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Conditional logging based on log level
 */
function log(message: string, level: StartupConfig['logLevel']): void {
  if (level === 'minimal') {
    // Only log errors and critical messages in minimal mode
    if (message.includes('💥') || message.includes('⚠️')) {
      console.log(message);
    }
  } else if (level === 'detailed') {
    // Log important milestones
    if (
      message.includes('🚀') ||
      message.includes('✅') ||
      message.includes('🎉') ||
      message.includes('💥') ||
      message.includes('⚠️') ||
      message.includes('📚')
    ) {
      console.log(message);
    }
  } else if (level === 'verbose') {
    // Log everything
    console.log(message);
  }
}

/**
 * Graceful shutdown handling
 */
export async function gracefulShutdown(): Promise<void> {
  try {
    console.log('🔄 Initiating graceful database shutdown...');

    const mongoose = await import('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed gracefully');
    }
  } catch (error) {
    console.error('💥 Error during graceful shutdown:', error);
  }
}

/**
 * Register graceful shutdown handlers
 */
export function registerShutdownHandlers(): void {
  // Handle process termination
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM signal');
    await gracefulShutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT signal');
    await gracefulShutdown();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await gracefulShutdown();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown();
    process.exit(1);
  });
}

// ========================================
// ENVIRONMENT-SPECIFIC INITIALIZATION
// ========================================

/**
 * Initialize database based on environment
 */
export async function environmentBasedInit(): Promise<void> {
  const environment = process.env.NODE_ENV || 'development';

  switch (environment) {
    case 'development':
      await developmentStartup();
      break;

    case 'production':
      const success = await quickStartup();
      if (!success) {
        console.error('Production database startup failed');
        // In production, we might want to exit the process
        // process.exit(1);
      }
      break;

    case 'test':
      // Minimal setup for testing
      await connectToDatabase();
      break;

    default:
      console.warn(
        `Unknown environment: ${environment}, using development setup`
      );
      await developmentStartup();
  }
}

// ========================================
// EXPORT FOR NEXT.JS INTEGRATION
// ========================================

/**
 * Next.js middleware-friendly initialization
 */
export async function nextjsInit(): Promise<void> {
  // Only run once per process
  if (global.databaseInitialized) {
    return;
  }

  try {
    await environmentBasedInit();
    global.databaseInitialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't throw to prevent Next.js from crashing
  }
}

// Add type declaration for global variable
declare global {
  var databaseInitialized: boolean | undefined;
}
