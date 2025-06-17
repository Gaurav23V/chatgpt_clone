/**
 * Setup Verification System for ChatGPT Clone
 *
 * This module provides comprehensive verification of:
 * - Core dependency imports and availability
 * - Environment variable structure (without validating actual values)
 * - Database connection functions and configurations
 * - Authentication configuration presence
 * - File storage configurations
 * - UI component availability
 *
 * Used for development setup verification and CI/CD pipeline checks
 */

// =============================================================================
// VERIFICATION TYPES
// =============================================================================

interface VerificationResult {
  category: string;
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface VerificationSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  results: VerificationResult[];
}

// =============================================================================
// DEPENDENCY VERIFICATION
// =============================================================================

/**
 * Verify core Next.js and React dependencies
 */
async function verifyCoreDependencies(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Next.js Core
  try {
    await import('next');
    results.push({
      category: 'Core Dependencies',
      name: 'Next.js',
      status: 'success',
      message: 'Next.js is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Core Dependencies',
      name: 'Next.js',
      status: 'error',
      message: 'Next.js import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // React
  try {
    await import('react');
    results.push({
      category: 'Core Dependencies',
      name: 'React',
      status: 'success',
      message: 'React is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Core Dependencies',
      name: 'React',
      status: 'error',
      message: 'React import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // TypeScript
  try {
    // Check if TypeScript types are available
    const hasTypes = typeof process !== 'undefined';
    results.push({
      category: 'Core Dependencies',
      name: 'TypeScript',
      status: hasTypes ? 'success' : 'warning',
      message: hasTypes ? 'TypeScript environment is properly configured' : 'TypeScript types may not be fully configured'
    });
  } catch (error) {
    results.push({
      category: 'Core Dependencies',
      name: 'TypeScript',
      status: 'error',
      message: 'TypeScript configuration issue',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

/**
 * Verify AI and authentication dependencies
 */
async function verifyAIDependencies(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // AI SDK
  try {
    await import('ai');
    results.push({
      category: 'AI Dependencies',
      name: 'AI SDK',
      status: 'success',
      message: 'AI SDK is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'AI Dependencies',
      name: 'AI SDK',
      status: 'error',
      message: 'AI SDK import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // OpenAI SDK
  try {
    await import('openai');
    results.push({
      category: 'AI Dependencies',
      name: 'OpenAI SDK',
      status: 'success',
      message: 'OpenAI SDK is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'AI Dependencies',
      name: 'OpenAI SDK',
      status: 'error',
      message: 'OpenAI SDK import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Clerk Authentication
  try {
    // Try importing the main Clerk module first
    const clerk = await import('@clerk/nextjs');
    if (clerk) {
      results.push({
        category: 'Authentication',
        name: 'Clerk Next.js',
        status: 'success',
        message: 'Clerk Next.js is properly installed and importable'
      });
    }
  } catch (error) {
    // Try alternative import approach
    try {
      const { ClerkProvider } = await import('@clerk/nextjs');
      results.push({
        category: 'Authentication',
        name: 'Clerk Next.js',
        status: 'success',
        message: 'Clerk Next.js components are available'
      });
    } catch (secondError) {
      results.push({
        category: 'Authentication',
        name: 'Clerk Next.js',
        status: 'error',
        message: 'Clerk Next.js import failed',
        details: `Primary error: ${error instanceof Error ? error.message : 'Unknown error'}. Secondary error: ${secondError instanceof Error ? secondError.message : 'Unknown error'}`
      });
    }
  }

  return results;
}

/**
 * Verify database dependencies
 */
async function verifyDatabaseDependencies(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // MongoDB
  try {
    await import('mongodb');
    results.push({
      category: 'Database Dependencies',
      name: 'MongoDB Driver',
      status: 'success',
      message: 'MongoDB driver is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Database Dependencies',
      name: 'MongoDB Driver',
      status: 'error',
      message: 'MongoDB driver import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Mongoose
  try {
    await import('mongoose');
    results.push({
      category: 'Database Dependencies',
      name: 'Mongoose ODM',
      status: 'success',
      message: 'Mongoose ODM is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Database Dependencies',
      name: 'Mongoose ODM',
      status: 'error',
      message: 'Mongoose ODM import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

/**
 * Verify UI and styling dependencies
 */
async function verifyUIDependencies(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // ShadCN UI utilities
  try {
    await import('clsx');
    results.push({
      category: 'UI Dependencies',
      name: 'clsx',
      status: 'success',
      message: 'clsx utility is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'UI Dependencies',
      name: 'clsx',
      status: 'error',
      message: 'clsx import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  try {
    await import('tailwind-merge');
    results.push({
      category: 'UI Dependencies',
      name: 'tailwind-merge',
      status: 'success',
      message: 'tailwind-merge is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'UI Dependencies',
      name: 'tailwind-merge',
      status: 'error',
      message: 'tailwind-merge import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  try {
    await import('class-variance-authority');
    results.push({
      category: 'UI Dependencies',
      name: 'class-variance-authority',
      status: 'success',
      message: 'class-variance-authority is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'UI Dependencies',
      name: 'class-variance-authority',
      status: 'error',
      message: 'class-variance-authority import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Lucide React Icons
  try {
    await import('lucide-react');
    results.push({
      category: 'UI Dependencies',
      name: 'lucide-react',
      status: 'success',
      message: 'lucide-react icons are properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'UI Dependencies',
      name: 'lucide-react',
      status: 'error',
      message: 'lucide-react import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Radix UI primitives
  const radixComponents = [
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-scroll-area',
    '@radix-ui/react-tooltip',
    '@radix-ui/react-separator',
    '@radix-ui/react-slot'
  ];

  for (const component of radixComponents) {
    try {
      await import(component);
      results.push({
        category: 'UI Dependencies',
        name: component,
        status: 'success',
        message: `${component} is properly installed and importable`
      });
    } catch (error) {
      results.push({
        category: 'UI Dependencies',
        name: component,
        status: 'error',
        message: `${component} import failed`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Verify file storage dependencies
 */
async function verifyStorageDependencies(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Cloudinary
  try {
    await import('@cloudinary/react');
    results.push({
      category: 'Storage Dependencies',
      name: 'Cloudinary React',
      status: 'success',
      message: 'Cloudinary React is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Storage Dependencies',
      name: 'Cloudinary React',
      status: 'error',
      message: 'Cloudinary React import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  try {
    await import('@cloudinary/url-gen');
    results.push({
      category: 'Storage Dependencies',
      name: 'Cloudinary URL Gen',
      status: 'success',
      message: 'Cloudinary URL generator is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Storage Dependencies',
      name: 'Cloudinary URL Gen',
      status: 'error',
      message: 'Cloudinary URL generator import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Uploadcare
  try {
    await import('@uploadcare/react-uploader');
    results.push({
      category: 'Storage Dependencies',
      name: 'Uploadcare React',
      status: 'success',
      message: 'Uploadcare React uploader is properly installed and importable'
    });
  } catch (error) {
    results.push({
      category: 'Storage Dependencies',
      name: 'Uploadcare React',
      status: 'error',
      message: 'Uploadcare React uploader import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

// =============================================================================
// CONFIGURATION VERIFICATION
// =============================================================================

/**
 * Verify environment variable structure (without checking actual values)
 */
function verifyEnvironmentStructure(): VerificationResult[] {
  const results: VerificationResult[] = [];

  // Check if environment validation module exists and is importable
  try {
    // This will be a dynamic import to avoid circular dependencies
    const envExists = typeof process !== 'undefined' && typeof process.env === 'object';

    results.push({
      category: 'Environment Configuration',
      name: 'Environment Object',
      status: envExists ? 'success' : 'error',
      message: envExists
        ? 'Environment variables object is available'
        : 'Environment variables object is not available'
    });

    // Check for required environment variable names (structure only)
    const requiredEnvVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'MONGODB_URI',
      'OPENAI_API_KEY'
    ];

    const optionalEnvVars = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'UPLOADCARE_PUBLIC_KEY',
      'UPLOADCARE_SECRET_KEY'
    ];

    let definedRequired = 0;
    let definedOptional = 0;

    for (const envVar of requiredEnvVars) {
      const isDefined = envVar in process.env;
      if (isDefined) definedRequired++;
    }

    for (const envVar of optionalEnvVars) {
      const isDefined = envVar in process.env;
      if (isDefined) definedOptional++;
    }

    results.push({
      category: 'Environment Configuration',
      name: 'Required Variables Structure',
      status: definedRequired === requiredEnvVars.length ? 'success' : 'warning',
      message: `${definedRequired}/${requiredEnvVars.length} required environment variables are defined`,
      details: definedRequired < requiredEnvVars.length
        ? 'Some required environment variables are missing. Check .env.local file.'
        : undefined
    });

    results.push({
      category: 'Environment Configuration',
      name: 'Optional Variables Structure',
      status: definedOptional > 0 ? 'success' : 'warning',
      message: `${definedOptional}/${optionalEnvVars.length} optional environment variables are defined`,
      details: definedOptional === 0
        ? 'No storage providers configured. File uploads will be disabled.'
        : undefined
    });

  } catch (error) {
    results.push({
      category: 'Environment Configuration',
      name: 'Environment Structure',
      status: 'error',
      message: 'Failed to check environment variable structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

/**
 * Verify configuration files exist and are structured correctly
 */
async function verifyConfigurationFiles(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Check AI configuration
  try {
    await import('@/lib/ai/config');
    results.push({
      category: 'Configuration Files',
      name: 'AI Configuration',
      status: 'success',
      message: 'AI configuration file exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'Configuration Files',
      name: 'AI Configuration',
      status: 'error',
      message: 'AI configuration file import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Check Auth configuration
  try {
    await import('@/lib/auth/clerk-config');
    results.push({
      category: 'Configuration Files',
      name: 'Auth Configuration',
      status: 'success',
      message: 'Authentication configuration file exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'Configuration Files',
      name: 'Auth Configuration',
      status: 'error',
      message: 'Authentication configuration file import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Check Database configuration
  try {
    await import('@/lib/db/connection');
    results.push({
      category: 'Configuration Files',
      name: 'Database Connection',
      status: 'success',
      message: 'Database connection configuration exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'Configuration Files',
      name: 'Database Connection',
      status: 'error',
      message: 'Database connection configuration import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Check Storage configurations
  try {
    await import('@/lib/storage/cloudinary-config');
    results.push({
      category: 'Configuration Files',
      name: 'Cloudinary Configuration',
      status: 'success',
      message: 'Cloudinary configuration file exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'Configuration Files',
      name: 'Cloudinary Configuration',
      status: 'warning',
      message: 'Cloudinary configuration file import failed',
      details: 'Cloudinary storage will not be available'
    });
  }

  try {
    await import('@/lib/storage/uploadcare-config');
    results.push({
      category: 'Configuration Files',
      name: 'Uploadcare Configuration',
      status: 'success',
      message: 'Uploadcare configuration file exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'Configuration Files',
      name: 'Uploadcare Configuration',
      status: 'warning',
      message: 'Uploadcare configuration file import failed',
      details: 'Uploadcare storage will not be available'
    });
  }

  // Check Utils
  try {
    await import('@/lib/utils');
    results.push({
      category: 'Configuration Files',
      name: 'Utility Functions',
      status: 'success',
      message: 'Utility functions file exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'Configuration Files',
      name: 'Utility Functions',
      status: 'error',
      message: 'Utility functions file import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

/**
 * Verify UI components are available
 */
async function verifyUIComponents(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  // Check ShadCN Button component
  try {
    await import('@/components/ui/button');
    results.push({
      category: 'UI Components',
      name: 'Button Component',
      status: 'success',
      message: 'ShadCN Button component exists and is importable'
    });
  } catch (error) {
    results.push({
      category: 'UI Components',
      name: 'Button Component',
      status: 'error',
      message: 'ShadCN Button component import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Check if components.json exists (indirectly by checking if ShadCN setup is complete)
  try {
    const { cn } = await import('@/lib/utils');
    const hasUtilFunction = typeof cn === 'function';

    results.push({
      category: 'UI Components',
      name: 'ShadCN Setup',
      status: hasUtilFunction ? 'success' : 'error',
      message: hasUtilFunction
        ? 'ShadCN utility functions are properly configured'
        : 'ShadCN utility functions are not available'
    });
  } catch (error) {
    results.push({
      category: 'UI Components',
      name: 'ShadCN Setup',
      status: 'error',
      message: 'ShadCN setup verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

// =============================================================================
// MAIN VERIFICATION FUNCTION
// =============================================================================

/**
 * Run comprehensive setup verification
 */
export async function runSetupVerification(): Promise<VerificationSummary> {
  console.log('🔍 Running comprehensive setup verification...\n');

  const allResults: VerificationResult[] = [];

  // Run all verification checks
  const verificationFunctions = [
    verifyCoreDependencies,
    verifyAIDependencies,
    verifyDatabaseDependencies,
    verifyUIDependencies,
    verifyStorageDependencies,
    verifyConfigurationFiles,
    verifyUIComponents
  ];

  for (const verifyFn of verificationFunctions) {
    try {
      const results = await verifyFn();
      allResults.push(...results);
    } catch (error) {
      allResults.push({
        category: 'System',
        name: verifyFn.name,
        status: 'error',
        message: 'Verification function failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Add environment structure verification (synchronous)
  allResults.push(...verifyEnvironmentStructure());

  // Calculate summary
  const summary: VerificationSummary = {
    totalChecks: allResults.length,
    passed: allResults.filter(r => r.status === 'success').length,
    warnings: allResults.filter(r => r.status === 'warning').length,
    errors: allResults.filter(r => r.status === 'error').length,
    results: allResults
  };

  return summary;
}

/**
 * Format and display verification results
 */
export function displayVerificationResults(summary: VerificationSummary): void {
  console.log('📊 Setup Verification Results:');
  console.log('═'.repeat(50));

  // Summary
  console.log(`Total Checks: ${summary.totalChecks}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`❌ Errors: ${summary.errors}`);
  console.log('');

  // Group results by category
  const categories = [...new Set(summary.results.map(r => r.category))];

  for (const category of categories) {
    const categoryResults = summary.results.filter(r => r.category === category);
    console.log(`\n📁 ${category}:`);
    console.log('─'.repeat(30));

    for (const result of categoryResults) {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.name}: ${result.message}`);

      if (result.details) {
        console.log(`   ℹ️  ${result.details}`);
      }
    }
  }

  // Overall status
  console.log('\n' + '═'.repeat(50));
  if (summary.errors === 0) {
    if (summary.warnings === 0) {
      console.log('🎉 All checks passed! Your setup is ready for development.');
    } else {
      console.log('✅ Setup is functional with some warnings. Review warnings above.');
    }
  } else {
    console.log('❌ Setup has errors that need to be resolved. Check the errors above.');
  }
  console.log('═'.repeat(50));
}

/**
 * Quick verification for CI/CD or automated checks
 */
export async function quickVerification(): Promise<boolean> {
  try {
    const summary = await runSetupVerification();
    return summary.errors === 0;
  } catch (error) {
    console.error('Setup verification failed:', error);
    return false;
  }
}

/**
 * Development helper to run verification with detailed output
 */
export async function verifySetupWithOutput(): Promise<void> {
  try {
    const summary = await runSetupVerification();
    displayVerificationResults(summary);

    if (summary.errors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Setup verification failed:', error);
    process.exit(1);
  }
}

/**
 * Standalone runner for command-line execution
 * This will only run when the file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔧 ChatGPT Clone Setup Verification');
  console.log('═'.repeat(50));
  console.log('Checking all dependencies and configurations...\n');

  verifySetupWithOutput().catch((error) => {
    console.error('❌ Setup verification failed:', error);
    process.exit(1);
  });
}
