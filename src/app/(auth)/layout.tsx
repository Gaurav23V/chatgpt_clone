/**
 * Authentication Layout
 *
 * This layout wraps all authentication pages (sign-in, sign-up) and provides
 * a consistent, professional authentication experience with ChatGPT-inspired design.
 *
 * Features:
 * - Centered, responsive design
 * - ChatGPT-style gradient background with subtle pattern
 * - Branding and logo placement
 * - Navigation between auth pages
 * - Footer with important links
 * - Loading state handling
 * - Accessibility considerations
 */

import { Suspense } from 'react';

import Link from 'next/link';

import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

// Loading component for auth pages
function AuthLoadingFallback() {
  return (
    <div className='flex items-center justify-center py-12'>
      <div className='w-full max-w-md'>
        <div className='rounded-xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800'>
          <div className='animate-pulse'>
            <div className='mb-4 h-8 rounded bg-gray-200 dark:bg-gray-600'></div>
            <div className='space-y-3'>
              <div className='h-4 rounded bg-gray-200 dark:bg-gray-600'></div>
              <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-600'></div>
            </div>
            <div className='mt-6 h-12 rounded bg-gray-200 dark:bg-gray-600'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer component with important links
function AuthFooter() {
  return (
    <footer className='px-4 py-8 text-center'>
      <div className='mx-auto max-w-md'>
        {/* Company info */}
        <p className='mb-3 text-xs text-gray-500 dark:text-gray-400'>
          © 2024 ChatGPT Clone. Built with Next.js, Clerk & OpenAI.
        </p>

        {/* Important links */}
        <div className='flex justify-center space-x-4 text-xs'>
          <a
            href='#'
            className='text-gray-500 transition-colors duration-200 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
          >
            Privacy Policy
          </a>
          <span className='text-gray-300 dark:text-gray-600'>|</span>
          <a
            href='#'
            className='text-gray-500 transition-colors duration-200 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
          >
            Terms of Service
          </a>
          <span className='text-gray-300 dark:text-gray-600'>|</span>
          <a
            href='#'
            className='text-gray-500 transition-colors duration-200 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
          >
            Support
          </a>
        </div>

        {/* Security badge */}
        <div className='mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400 dark:text-gray-500'>
          <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
              clipRule='evenodd'
            />
          </svg>
          <span>Secured by Clerk</span>
        </div>
      </div>
    </footer>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      {/* Background pattern overlay for visual interest */}
      <div
        className='absolute inset-0 opacity-20 dark:opacity-10'
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(156, 163, 175, 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Main content container */}
      <div className='relative flex min-h-screen flex-col'>
        {/* Header with branding */}
        <header className='flex-shrink-0 px-4 pt-8'>
          <div className='mx-auto mb-8 max-w-md text-center'>
            {/* Logo/Branding Section */}
            <div className='mb-6'>
              <h1 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
                ChatGPT Clone
              </h1>
              <div className='mx-auto mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-green-500 to-green-600' />
            </div>

            {/* Simple navigation between sign-in and sign-up */}
            <div className='mx-auto flex max-w-xs justify-center space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800'>
              <Link
                href='/sign-in'
                className='flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-white/50 hover:text-gray-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300 dark:focus:ring-offset-gray-800'
              >
                Sign In
              </Link>
              <Link
                href='/sign-up'
                className='flex-1 rounded-md px-4 py-2 text-center text-sm font-medium text-gray-500 transition-all duration-200 hover:bg-white/50 hover:text-gray-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-300 dark:focus:ring-offset-gray-800'
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        {/* Main authentication content */}
        <main className='flex flex-1 items-start justify-center px-4'>
          <div className='w-full max-w-md'>
            <Suspense fallback={<AuthLoadingFallback />}>{children}</Suspense>
          </div>
        </main>

        {/* Footer */}
        <AuthFooter />
      </div>
    </div>
  );
}
