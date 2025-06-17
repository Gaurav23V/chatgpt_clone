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

import { ReactNode, Suspense } from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
}

// Loading component for auth pages
function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
            <div className="mt-6 h-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer component with important links
function AuthFooter() {
  return (
    <footer className="text-center py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Company info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          © 2024 ChatGPT Clone. Built with Next.js, Clerk & OpenAI.
        </p>

        {/* Important links */}
        <div className="flex justify-center space-x-4 text-xs">
          <a
            href="#"
            className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
          >
            Privacy Policy
          </a>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <a
            href="#"
            className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
          >
            Terms of Service
          </a>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <a
            href="#"
            className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
          >
            Support
          </a>
        </div>

        {/* Security badge */}
        <div className="mt-4 flex justify-center items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secured by Clerk</span>
        </div>
      </div>
    </footer>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background pattern overlay for visual interest */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(156, 163, 175, 0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main content container */}
      <div className="relative flex flex-col min-h-screen">
        {/* Header with branding */}
        <header className="flex-shrink-0 pt-8 px-4">
          <div className="max-w-md mx-auto text-center mb-8">
            {/* Logo/Branding Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                ChatGPT Clone
              </h1>
              <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto mt-2 rounded-full" />
            </div>

            {/* Simple navigation between sign-in and sign-up */}
            <div className="flex justify-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 max-w-xs mx-auto">
              <Link
                href="/sign-in"
                className="flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="flex-1 text-center py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </header>

        {/* Main authentication content */}
        <main className="flex-1 flex items-start justify-center px-4">
          <div className="w-full max-w-md">
            <Suspense fallback={<AuthLoadingFallback />}>
              {children}
            </Suspense>
          </div>
        </main>

        {/* Footer */}
        <AuthFooter />
      </div>
    </div>
  );
}
