/**
 * Protected Page Wrapper Demo
 *
 * Demonstrates different configurations and features of the ProtectedPageWrapper
 * including loading variants, protection levels, and development tools.
 */

'use client';

import { useState } from 'react';

import {
  type AuthRequirements,
  type LoadingVariant,
  ProtectedPageWrapper,
  type ProtectionLevel,
} from '@/components/auth';

interface DemoConfig {
  loadingVariant: LoadingVariant;
  protectionLevel: ProtectionLevel;
  requireVerified: boolean;
  requireComplete: boolean;
  enableErrorBoundary: boolean;
  enableDevTools: boolean;
  showLoadingProgress: boolean;
}

const DEFAULT_CONFIG: DemoConfig = {
  loadingVariant: 'chat',
  protectionLevel: 'basic',
  requireVerified: false,
  requireComplete: false,
  enableErrorBoundary: true,
  enableDevTools: true,
  showLoadingProgress: false,
};

const DEMO_CONTENT = () => (
  <div className='min-h-screen bg-gray-50 p-6 dark:bg-gray-900'>
    <div className='mx-auto max-w-4xl'>
      <header className='mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
        <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
          🛡️ Protected Page Content
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>
          This content is only visible to authenticated users who meet the
          specified requirements.
        </p>
      </header>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* User Info Card */}
        <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
            Authentication Status
          </h2>
          <div className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <span className='text-green-600'>✅</span>
              <span className='text-gray-700 dark:text-gray-300'>
                User is authenticated
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <span className='text-green-600'>✅</span>
              <span className='text-gray-700 dark:text-gray-300'>
                Permissions verified
              </span>
            </div>
            <div className='flex items-center space-x-2'>
              <span className='text-green-600'>✅</span>
              <span className='text-gray-700 dark:text-gray-300'>
                Error boundary active
              </span>
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
            Wrapper Features
          </h2>
          <div className='space-y-2 text-sm'>
            <div className='text-gray-700 dark:text-gray-300'>
              • Automatic authentication checks
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              • Customizable loading states
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              • Role-based access control
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              • Error boundary integration
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              • Development debugging tools
            </div>
            <div className='text-gray-700 dark:text-gray-300'>
              • SEO-friendly metadata
            </div>
          </div>
        </div>

        {/* Sample Content */}
        <div className='rounded-lg bg-white p-6 shadow-sm md:col-span-2 dark:bg-gray-800'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
            Sample Protected Content
          </h2>
          <div className='prose dark:prose-invert max-w-none'>
            <p className='text-gray-700 dark:text-gray-300'>
              This is an example of content that requires authentication to
              view. The Protected Page Wrapper ensures that only authenticated
              users with the proper permissions can access this content.
            </p>
            <p className='mt-4 text-gray-700 dark:text-gray-300'>
              The wrapper handles all the complex authentication logic, loading
              states, and error scenarios so you can focus on building your
              application content.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export function ProtectedPageDemo() {
  const [config, setConfig] = useState<DemoConfig>(DEFAULT_CONFIG);
  const [showDemo, setShowDemo] = useState(false);

  const updateConfig = (key: keyof DemoConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const requirements: AuthRequirements = {
    level: config.protectionLevel,
    requireVerified: config.requireVerified,
    requireComplete: config.requireComplete,
  };

  if (showDemo) {
    return (
      <ProtectedPageWrapper
        requirements={requirements}
        loadingVariant={config.loadingVariant}
        enableErrorBoundary={config.enableErrorBoundary}
        enableDevTools={config.enableDevTools}
        showLoadingProgress={config.showLoadingProgress}
        pageTitle='Protected Page Demo'
        pageDescription='Demonstration of protected page wrapper features'
      >
        <DEMO_CONTENT />
        <div className='fixed top-4 left-4 z-50'>
          <button
            onClick={() => setShowDemo(false)}
            className='rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700'
          >
            ← Back to Config
          </button>
        </div>
      </ProtectedPageWrapper>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6 dark:bg-gray-900'>
      <div className='mx-auto max-w-4xl'>
        <header className='mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
            🛡️ Protected Page Wrapper Demo
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Configure and test different protection settings and loading
            variants.
          </p>
        </header>

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Configuration Panel */}
          <div className='space-y-6'>
            {/* Loading Variant */}
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Loading Variant
              </h3>
              <div className='space-y-2'>
                {(
                  ['skeleton', 'spinner', 'chat', 'minimal'] as LoadingVariant[]
                ).map((variant) => (
                  <label
                    key={variant}
                    className='flex cursor-pointer items-center space-x-2'
                  >
                    <input
                      type='radio'
                      name='loadingVariant'
                      value={variant}
                      checked={config.loadingVariant === variant}
                      onChange={(e) =>
                        updateConfig('loadingVariant', e.target.value)
                      }
                      className='text-blue-600'
                    />
                    <span className='text-gray-700 capitalize dark:text-gray-300'>
                      {variant}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Protection Level */}
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Protection Level
              </h3>
              <div className='space-y-2'>
                {(
                  ['basic', 'chat', 'premium', 'admin'] as ProtectionLevel[]
                ).map((level) => (
                  <label
                    key={level}
                    className='flex cursor-pointer items-center space-x-2'
                  >
                    <input
                      type='radio'
                      name='protectionLevel'
                      value={level}
                      checked={config.protectionLevel === level}
                      onChange={(e) =>
                        updateConfig('protectionLevel', e.target.value)
                      }
                      className='text-blue-600'
                    />
                    <span className='text-gray-700 capitalize dark:text-gray-300'>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Auth Requirements */}
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Auth Requirements
              </h3>
              <div className='space-y-3'>
                <label className='flex cursor-pointer items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={config.requireVerified}
                    onChange={(e) =>
                      updateConfig('requireVerified', e.target.checked)
                    }
                    className='text-blue-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Require Email Verification
                  </span>
                </label>
                <label className='flex cursor-pointer items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={config.requireComplete}
                    onChange={(e) =>
                      updateConfig('requireComplete', e.target.checked)
                    }
                    className='text-blue-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Require Complete Profile
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Feature Options */}
          <div className='space-y-6'>
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Wrapper Features
              </h3>
              <div className='space-y-3'>
                <label className='flex cursor-pointer items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={config.enableErrorBoundary}
                    onChange={(e) =>
                      updateConfig('enableErrorBoundary', e.target.checked)
                    }
                    className='text-blue-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Enable Error Boundary
                  </span>
                </label>
                <label className='flex cursor-pointer items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={config.enableDevTools}
                    onChange={(e) =>
                      updateConfig('enableDevTools', e.target.checked)
                    }
                    className='text-blue-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Enable Dev Tools
                  </span>
                </label>
                <label className='flex cursor-pointer items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={config.showLoadingProgress}
                    onChange={(e) =>
                      updateConfig('showLoadingProgress', e.target.checked)
                    }
                    className='text-blue-600'
                  />
                  <span className='text-gray-700 dark:text-gray-300'>
                    Show Loading Progress
                  </span>
                </label>
              </div>
            </div>

            {/* Configuration Preview */}
            <div className='rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800'>
              <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
                Current Configuration
              </h3>
              <div className='rounded bg-gray-50 p-3 font-mono text-sm dark:bg-gray-900'>
                <pre className='whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
                  {`<ProtectedPageWrapper
  requirements={{
    level: '${config.protectionLevel}',
    requireVerified: ${config.requireVerified},
    requireComplete: ${config.requireComplete}
  }}
  loadingVariant="${config.loadingVariant}"
  enableErrorBoundary={${config.enableErrorBoundary}}
  enableDevTools={${config.enableDevTools}}
  showLoadingProgress={${config.showLoadingProgress}}
>
  {/* Your protected content */}
</ProtectedPageWrapper>`}
                </pre>
              </div>
            </div>

            {/* Test Button */}
            <button
              onClick={() => setShowDemo(true)}
              className='w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700'
            >
              Test Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProtectedPageDemo;
