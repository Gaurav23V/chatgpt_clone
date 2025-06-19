/**
 * Authentication Layout
 *
 * This layout wraps all authentication pages (sign-in, sign-up) and provides
 * a consistent, professional authentication experience with ChatGPT-inspired design.
 *
 * Features:
 * - Clean white background with ChatGPT-style layout
 * - Centered, responsive design
 * - Simple branding and navigation
 * - Footer with important links
 * - Loading state handling
 * - Accessibility considerations
 */

import { Suspense } from 'react';

import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

// Loading component for auth pages
function AuthLoadingFallback() {
  return (
    <div className='flex items-center justify-center py-12'>
      <div className='w-full max-w-sm'>
        <div className='animate-pulse space-y-6'>
          <div className='text-center'>
            <div className='mb-2 h-8 rounded bg-gray-200'></div>
            <div className='mx-auto h-4 w-3/4 rounded bg-gray-200'></div>
          </div>
          <div className='space-y-4'>
            <div className='h-12 rounded bg-gray-200'></div>
            <div className='h-12 rounded bg-gray-200'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='flex min-h-screen flex-col bg-white'>
      {/* Header with ChatGPT branding */}
      <div className='p-6'>
        <h1 className='text-2xl font-bold text-black'>ChatGPT</h1>
      </div>

      {/* Main authentication content */}
      <div className='flex flex-1 items-center justify-center px-6'>
        <div className='w-full max-w-sm'>
          <Suspense fallback={<AuthLoadingFallback />}>{children}</Suspense>
        </div>
      </div>

      {/* Footer */}
      <div className='p-6 text-center'>
        <div className='space-x-4 text-xs text-gray-500'>
          <a href='#' className='hover:underline'>
            Terms of Use
          </a>
          <span>|</span>
          <a href='#' className='hover:underline'>
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
