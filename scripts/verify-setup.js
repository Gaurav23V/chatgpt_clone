#!/usr/bin/env node

/**
 * Setup Verification Runner
 *
 * This script runs the comprehensive setup verification and displays results.
 * Can be used for development checks and CI/CD pipeline validation.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Set up the environment for Next.js
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Get the project root
const projectRoot = path.resolve(__dirname, '..');

async function runVerification() {
  console.log('🔧 ChatGPT Clone Setup Verification');
  console.log('═'.repeat(50));
  console.log('Checking all dependencies and configurations...\n');

  try {
    // Use tsx to run TypeScript files with proper path resolution
    const { execSync } = require('child_process');

    // Check if tsx is available
    try {
      execSync('npx tsx --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('📦 Installing tsx for TypeScript execution...');
      execSync('npm install -D tsx', { stdio: 'inherit', cwd: projectRoot });
    }

    // Run the verification using tsx with proper path resolution
    console.log('🔍 Running verification with TypeScript support...\n');
    execSync(`npx tsx ${projectRoot}/src/lib/setup-verification.ts`, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        ...process.env,
      },
    });
  } catch (error) {
    console.error('❌ Failed to run setup verification:');
    console.error(error.message);

    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n💡 This might be because:');
      console.log('  • TypeScript files need to be compiled');
      console.log('  • Some dependencies are missing');
      console.log('  • Project structure is not as expected');
      console.log('\n🔧 Try running: npm install && npm run build');
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the verification
runVerification();
