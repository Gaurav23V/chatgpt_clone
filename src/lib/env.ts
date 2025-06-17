/**
 * Environment Variables Configuration and Validation
 *
 * This module provides runtime validation of environment variables with:
 * - Schema-based validation using Zod-like patterns
 * - Type-safe environment variable access
 * - Development vs production checks
 * - Clear error messages for missing variables
 * - Automatic type inference and IntelliSense support
 */

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Simple validation utilities for environment variables
 * Provides basic type checking and validation without external dependencies
 */
const validators = {
  string: (value: string | undefined, name: string): string => {
    if (!value || value.trim() === '') {
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    return value.trim();
  },

  optionalString: (value: string | undefined): string | undefined => {
    return value && value.trim() !== '' ? value.trim() : undefined;
  },

  url: (value: string | undefined, name: string): string => {
    const url = validators.string(value, name);
    try {
      new URL(url);
      return url;
    } catch {
      throw new Error(`Environment variable ${name} must be a valid URL, got: ${url}`);
    }
  },

  boolean: (value: string | undefined, defaultValue = false): boolean => {
    if (!value) return defaultValue;
    const normalized = value.toLowerCase().trim();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
    return defaultValue;
  },

  number: (value: string | undefined, name: string, defaultValue?: number): number => {
    if (!value) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
    }
    return num;
  },

  enum: <T extends string>(
    value: string | undefined,
    name: string,
    allowedValues: readonly T[],
    defaultValue?: T
  ): T => {
    if (!value) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Environment variable ${name} is required but not set`);
    }
    if (!allowedValues.includes(value as T)) {
      throw new Error(
        `Environment variable ${name} must be one of: ${allowedValues.join(', ')}, got: ${value}`
      );
    }
    return value as T;
  },
};

// =============================================================================
// ENVIRONMENT VARIABLE DEFINITIONS
// =============================================================================

/**
 * Environment variable schema definition
 * Each variable is validated according to its type and requirements
 */
const envSchema = {
  // Node.js Environment
  NODE_ENV: () => validators.enum(
    process.env.NODE_ENV,
    'NODE_ENV',
    ['development', 'staging', 'production'] as const,
    'development'
  ),

  // Application Configuration
  NEXT_PUBLIC_APP_URL: () => validators.url(
    process.env.NEXT_PUBLIC_APP_URL,
    'NEXT_PUBLIC_APP_URL'
  ),

  // Clerk Authentication (Required)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: () => validators.string(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'
  ),
  CLERK_SECRET_KEY: () => validators.string(
    process.env.CLERK_SECRET_KEY,
    'CLERK_SECRET_KEY'
  ),

  // Database Configuration (Required)
  MONGODB_URI: () => validators.string(
    process.env.MONGODB_URI,
    'MONGODB_URI'
  ),

  // OpenAI API (Required)
  OPENAI_API_KEY: () => {
    const key = validators.string(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY');
    if (!key.startsWith('sk-')) {
      throw new Error('OPENAI_API_KEY must start with "sk-"');
    }
    return key;
  },

  // Storage Providers (At least one required)
  CLOUDINARY_CLOUD_NAME: () => validators.optionalString(process.env.CLOUDINARY_CLOUD_NAME),
  CLOUDINARY_API_KEY: () => validators.optionalString(process.env.CLOUDINARY_API_KEY),
  CLOUDINARY_API_SECRET: () => validators.optionalString(process.env.CLOUDINARY_API_SECRET),

  UPLOADCARE_PUBLIC_KEY: () => validators.optionalString(process.env.UPLOADCARE_PUBLIC_KEY),
  UPLOADCARE_SECRET_KEY: () => validators.optionalString(process.env.UPLOADCARE_SECRET_KEY),

  // Optional Configuration
  DEFAULT_STORAGE_PROVIDER: () => validators.enum(
    process.env.DEFAULT_STORAGE_PROVIDER,
    'DEFAULT_STORAGE_PROVIDER',
    ['cloudinary', 'uploadcare'] as const,
    'cloudinary'
  ),

  ENABLE_FILE_UPLOADS: () => validators.boolean(process.env.ENABLE_FILE_UPLOADS, true),
  MAX_FILE_SIZE: () => validators.number(process.env.MAX_FILE_SIZE, 'MAX_FILE_SIZE', 10485760), // 10MB default

  // Development Configuration
  DEBUG_MODE: () => validators.boolean(process.env.DEBUG_MODE, false),
  DISABLE_AUTH_IN_DEV: () => validators.boolean(process.env.DISABLE_AUTH_IN_DEV, false),
  MOCK_EXTERNAL_APIS: () => validators.boolean(process.env.MOCK_EXTERNAL_APIS, false),

  // Build Configuration
  BUILD_STANDALONE: () => validators.boolean(process.env.BUILD_STANDALONE, false),
  ANALYZE: () => validators.boolean(process.env.ANALYZE, false),
};

// =============================================================================
// VALIDATION AND EXPORT
// =============================================================================

/**
 * Validates all environment variables and returns typed configuration
 * Throws detailed errors for missing or invalid variables
 */
function validateEnvironment() {
  const errors: string[] = [];
  const config: Record<string, any> = {};

  // Validate each environment variable
  for (const [key, validator] of Object.entries(envSchema)) {
    try {
      config[key] = validator();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Unknown error validating ${key}`);
    }
  }

  // Check storage provider configuration
  const hasCloudinary = config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET;
  const hasUploadcare = config.UPLOADCARE_PUBLIC_KEY && config.UPLOADCARE_SECRET_KEY;

  if (config.ENABLE_FILE_UPLOADS && !hasCloudinary && !hasUploadcare) {
    errors.push(
      'File uploads are enabled but no storage provider is configured. ' +
      'Please configure either Cloudinary or Uploadcare credentials.'
    );
  }

  // Development-specific warnings
  if (config.NODE_ENV === 'development') {
    const warnings: string[] = [];

    if (config.DISABLE_AUTH_IN_DEV) {
      warnings.push('⚠️  Authentication is disabled in development mode');
    }

    if (config.MOCK_EXTERNAL_APIS) {
      warnings.push('⚠️  External APIs are being mocked in development mode');
    }

    if (warnings.length > 0) {
      console.warn('\n' + warnings.join('\n') + '\n');
    }
  }

  // Production-specific checks
  if (config.NODE_ENV === 'production') {
    if (config.DEBUG_MODE) {
      errors.push('DEBUG_MODE should not be enabled in production');
    }

    if (config.DISABLE_AUTH_IN_DEV) {
      errors.push('DISABLE_AUTH_IN_DEV must not be true in production');
    }

    if (config.MOCK_EXTERNAL_APIS) {
      errors.push('MOCK_EXTERNAL_APIS must not be true in production');
    }
  }

  // Throw error if validation failed
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Environment validation failed:',
      '',
      ...errors.map(error => `  • ${error}`),
      '',
      '💡 Please check your .env.local file and ensure all required variables are set.',
      '📖 See .env.example for reference and setup instructions.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  return config;
}

// =============================================================================
// TYPED ENVIRONMENT EXPORT
// =============================================================================

/**
 * Validated and typed environment configuration
 * All variables are guaranteed to be present and valid when imported
 */
export const env = validateEnvironment() as {
  // Core Configuration
  readonly NODE_ENV: 'development' | 'staging' | 'production';
  readonly NEXT_PUBLIC_APP_URL: string;

  // Authentication
  readonly NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  readonly CLERK_SECRET_KEY: string;

  // Database
  readonly MONGODB_URI: string;

  // AI Services
  readonly OPENAI_API_KEY: string;

  // Storage Providers
  readonly CLOUDINARY_CLOUD_NAME?: string;
  readonly CLOUDINARY_API_KEY?: string;
  readonly CLOUDINARY_API_SECRET?: string;
  readonly UPLOADCARE_PUBLIC_KEY?: string;
  readonly UPLOADCARE_SECRET_KEY?: string;

  // Application Settings
  readonly DEFAULT_STORAGE_PROVIDER: 'cloudinary' | 'uploadcare';
  readonly ENABLE_FILE_UPLOADS: boolean;
  readonly MAX_FILE_SIZE: number;

  // Development Settings
  readonly DEBUG_MODE: boolean;
  readonly DISABLE_AUTH_IN_DEV: boolean;
  readonly MOCK_EXTERNAL_APIS: boolean;

  // Build Settings
  readonly BUILD_STANDALONE: boolean;
  readonly ANALYZE: boolean;
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if the application is running in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if the application is running in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if the application is running in staging mode
 */
export const isStaging = env.NODE_ENV === 'staging';

/**
 * Check if file uploads are enabled and properly configured
 */
export const isFileUploadsEnabled = env.ENABLE_FILE_UPLOADS && (
  (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) ||
  (env.UPLOADCARE_PUBLIC_KEY && env.UPLOADCARE_SECRET_KEY)
);

/**
 * Get the configured storage providers
 */
export const getAvailableStorageProviders = (): ('cloudinary' | 'uploadcare')[] => {
  const providers: ('cloudinary' | 'uploadcare')[] = [];

  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    providers.push('cloudinary');
  }

  if (env.UPLOADCARE_PUBLIC_KEY && env.UPLOADCARE_SECRET_KEY) {
    providers.push('uploadcare');
  }

  return providers;
};

/**
 * Log environment configuration summary (safe for logs)
 */
export const logEnvironmentSummary = (): void => {
  if (!isDevelopment) return;

  const availableProviders = getAvailableStorageProviders();

  console.log('\n🚀 Environment Configuration:');
  console.log(`   Mode: ${env.NODE_ENV}`);
  console.log(`   App URL: ${env.NEXT_PUBLIC_APP_URL}`);
  console.log(`   File Uploads: ${isFileUploadsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Storage Providers: ${availableProviders.length > 0 ? availableProviders.join(', ') : 'None'}`);
  console.log(`   Default Provider: ${env.DEFAULT_STORAGE_PROVIDER}`);
  console.log(`   Max File Size: ${(env.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`);
  console.log('');
};

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Development-only function to validate environment without throwing
 * Useful for debugging environment issues
 */
export const validateEnvironmentSafe = (): { success: boolean; errors: string[] } => {
  if (!isDevelopment) {
    return { success: true, errors: [] };
  }

  try {
    validateEnvironment();
    return { success: true, errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    const errors = message.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.trim().substring(1).trim());
    return { success: false, errors };
  }
};

// Initialize environment validation on module load
if (typeof window === 'undefined') {
  // Only validate on server-side to avoid issues with client-side rendering
  logEnvironmentSummary();
}
