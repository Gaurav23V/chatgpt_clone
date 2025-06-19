/**
 * Redirect System Example Component
 *
 * This component demonstrates various ways to use the sophisticated redirect system
 * for authentication flows. It's meant for testing and demonstration purposes.
 */

'use client';

import { useState } from 'react';

import { useAuth } from '@clerk/nextjs';

import {
  buildAuthUrl,
  clearStoredRedirectUrl,
  getStoredRedirectUrl,
  isValidRedirectUrl,
  sanitizeRedirectUrl,
  storeRedirectUrl,
  useAuthRedirect,
} from '@/lib/auth/redirect-utils';

export function RedirectExample() {
  const { isSignedIn } = useAuth();
  const { redirectToAuth, getCurrentRedirectUrl } = useAuthRedirect();
  const [testUrl, setTestUrl] = useState('/chat/example');
  const [validationResult, setValidationResult] = useState<string>('');

  const handleManualRedirect = () => {
    storeRedirectUrl(testUrl);
    window.location.href = buildAuthUrl('sign-in', testUrl);
  };

  const handleHookRedirect = () => {
    redirectToAuth('sign-in');
  };

  const handleValidateUrl = () => {
    const isValid = isValidRedirectUrl(testUrl);
    const sanitized = sanitizeRedirectUrl(testUrl);
    setValidationResult(`Valid: ${isValid}, Sanitized: ${sanitized}`);
  };

  const handleClearStored = () => {
    clearStoredRedirectUrl();
    alert('Cleared stored redirect URL');
  };

  const storedUrl = getStoredRedirectUrl();
  const currentRedirect = getCurrentRedirectUrl();

  if (isSignedIn) {
    return (
      <div className='mx-auto max-w-2xl space-y-6 p-6'>
        <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
          <h2 className='mb-2 text-lg font-semibold text-green-800'>
            ✅ You're Signed In!
          </h2>
          <p className='text-green-700'>
            The redirect system worked! You can test the features below.
          </p>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <h3 className='mb-4 text-lg font-semibold'>Redirect System Status</h3>

          <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='rounded bg-gray-50 p-4'>
              <h4 className='font-medium text-gray-800'>Stored URL</h4>
              <p className='mt-1 text-sm text-gray-600'>
                {storedUrl || 'None'}
              </p>
            </div>

            <div className='rounded bg-gray-50 p-4'>
              <h4 className='font-medium text-gray-800'>Current Redirect</h4>
              <p className='mt-1 text-sm text-gray-600'>{currentRedirect}</p>
            </div>
          </div>

          <button
            onClick={handleClearStored}
            className='rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700'
          >
            Clear Stored URL
          </button>
        </div>

        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <h3 className='mb-4 text-lg font-semibold'>Test URL Validation</h3>

          <div className='space-y-4'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                Test URL
              </label>
              <input
                type='text'
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                placeholder='Enter URL to test...'
              />
            </div>

            <button
              onClick={handleValidateUrl}
              className='rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
            >
              Validate URL
            </button>

            {validationResult && (
              <div className='rounded border border-blue-200 bg-blue-50 p-3'>
                <p className='text-sm text-blue-800'>{validationResult}</p>
              </div>
            )}
          </div>
        </div>

        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
          <h4 className='mb-2 font-medium text-yellow-800'>Test Examples</h4>
          <div className='space-y-1 text-sm text-yellow-700'>
            <p>
              ✅ Valid: <code>/chat</code>, <code>/dashboard</code>,{' '}
              <code>/settings</code>
            </p>
            <p>
              ❌ Invalid: <code>https://evil.com</code>,{' '}
              <code>javascript:alert(1)</code>
            </p>
            <p>
              🛡️ Blocked: <code>/api/webhooks</code>, <code>/_next/static</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6 p-6'>
      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
        <h2 className='mb-2 text-lg font-semibold text-blue-800'>
          🔐 Redirect System Demo
        </h2>
        <p className='text-blue-700'>
          Test the sophisticated redirect system by trying different
          authentication flows.
        </p>
      </div>

      <div className='rounded-lg border border-gray-200 bg-white p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Test URL Input</h3>

        <div className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700'>
              Destination URL (where you want to go after auth)
            </label>
            <input
              type='text'
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none'
              placeholder='/chat/example'
            />
            <p className='mt-1 text-xs text-gray-500'>
              Try: /chat, /dashboard, /settings, or any internal URL
            </p>
          </div>

          <button
            onClick={handleValidateUrl}
            className='rounded bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700'
          >
            Validate URL
          </button>

          {validationResult && (
            <div className='rounded border border-gray-200 bg-gray-50 p-3'>
              <p className='text-sm text-gray-800'>{validationResult}</p>
            </div>
          )}
        </div>
      </div>

      <div className='rounded-lg border border-gray-200 bg-white p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Test Redirect Methods</h3>

        <div className='space-y-4'>
          <div>
            <h4 className='mb-2 font-medium text-gray-800'>
              Method 1: Manual Redirect
            </h4>
            <p className='mb-3 text-sm text-gray-600'>
              Manually store URL and build auth redirect. You'll return to:{' '}
              <code>{testUrl}</code>
            </p>
            <button
              onClick={handleManualRedirect}
              className='rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
            >
              Sign In (Manual Method)
            </button>
          </div>

          <div>
            <h4 className='mb-2 font-medium text-gray-800'>
              Method 2: Hook-Based Redirect
            </h4>
            <p className='mb-3 text-sm text-gray-600'>
              Use the useAuthRedirect hook. Stores current page automatically.
            </p>
            <button
              onClick={handleHookRedirect}
              className='rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700'
            >
              Sign In (Hook Method)
            </button>
          </div>
        </div>
      </div>

      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
        <h4 className='mb-2 font-medium text-gray-800'>What Will Happen</h4>
        <ol className='list-inside list-decimal space-y-1 text-sm text-gray-600'>
          <li>Your destination URL will be stored in sessionStorage</li>
          <li>
            You'll be redirected to the sign-in page with a return parameter
          </li>
          <li>
            After authentication, Clerk will redirect you back to your intended
            destination
          </li>
          <li>The stored URL will be cleared to prevent future redirects</li>
        </ol>
      </div>

      <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
        <h4 className='mb-2 font-medium text-yellow-800'>Security Features</h4>
        <ul className='list-inside list-disc space-y-1 text-sm text-yellow-700'>
          <li>Only internal URLs are allowed (same origin)</li>
          <li>Dangerous parameters are sanitized</li>
          <li>Blocked paths (like /api/webhooks) are rejected</li>
          <li>Invalid URLs fallback to /chat</li>
        </ul>
      </div>
    </div>
  );
}
