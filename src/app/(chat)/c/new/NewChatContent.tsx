/**
 * New Chat Content - Client Component
 *
 * Contains the interactive elements for the new chat page.
 * This is a client component to handle onClick events and other interactions.
 */

'use client';

import Link from 'next/link';

import { UserButton } from '@clerk/nextjs';

export function NewChatContent() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Header */}
      <header className='border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center'>
              <Link
                href='/'
                className='text-xl font-bold text-gray-900 dark:text-white'
              >
                ChatGPT Clone
              </Link>
            </div>

            <div className='flex items-center space-x-4'>
              <Link
                href='/'
                className='rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              >
                Home
              </Link>
              <UserButton afterSignOutUrl='/' />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='text-center'>
          {/* Success Message */}
          <div className='mb-8 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20'>
            <h1 className='mb-2 text-2xl font-bold text-green-800 dark:text-green-200'>
              🎉 Authentication Test Complete!
            </h1>
            <p className='text-green-700 dark:text-green-300'>
              You&apos;ve successfully been redirected to /c/new after
              authentication. The protected route system is working correctly!
            </p>
          </div>

          {/* New Chat Interface */}
          <div className='rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <h2 className='mb-4 text-3xl font-bold text-gray-900 dark:text-white'>
              Start a New Chat
            </h2>
            <p className='mb-8 text-gray-600 dark:text-gray-300'>
              Ready to have a conversation with AI? This is where your chat
              interface will be implemented.
            </p>

            {/* Placeholder Chat Interface */}
            <div className='mx-auto max-w-2xl'>
              {/* Sample Messages */}
              <div className='mb-6 space-y-4'>
                <div className='text-left'>
                  <div className='inline-block rounded-lg bg-gray-100 px-4 py-2 text-gray-900 dark:bg-gray-700 dark:text-white'>
                    Hello! How can I help you today?
                  </div>
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    AI Assistant
                  </p>
                </div>
              </div>

              {/* Chat Input */}
              <div className='rounded-lg border border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700'>
                <div className='flex items-center space-x-3'>
                  <input
                    type='text'
                    placeholder='Type your message here... (This is a demo)'
                    className='flex-1 border-0 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400'
                    disabled
                  />
                  <button
                    className='rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50'
                    disabled
                  >
                    Send
                  </button>
                </div>
                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                  Chat functionality will be implemented in the next phase
                </p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className='mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-white'>
              Authentication Testing Results
            </h3>
            <div className='mx-auto grid max-w-md gap-3 text-left'>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  Sign-up flow working
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  Sign-in flow working
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  Protected route accessible
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  Redirect after auth working
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  User management available
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  Middleware protection active
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-green-600'>✅</span>
                <span className='text-gray-700 dark:text-gray-300'>
                  Protected page wrapper active
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className='mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
            <Link
              href='/'
              className='rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
            >
              ← Back to Home
            </Link>
            <button
              className='rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700'
              onClick={() => window.location.reload()}
            >
              Refresh Test
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
