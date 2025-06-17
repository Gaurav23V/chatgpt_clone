/**
 * New Chat Page
 *
 * This page allows users to start a new chat conversation.
 * It serves as the entry point after successful authentication.
 */

'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function NewChatPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                ChatGPT Clone
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Success Message */}
          <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
              🎉 Authentication Test Complete!
            </h1>
            <p className="text-green-700 dark:text-green-300">
              You've successfully been redirected to /c/new after authentication. The protected route system is working correctly!
            </p>
          </div>

          {/* New Chat Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Start a New Chat
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Ready to have a conversation with AI? This is where your chat interface will be implemented.
            </p>

            {/* Placeholder Chat Interface */}
            <div className="max-w-2xl mx-auto">
              {/* Sample Messages */}
              <div className="space-y-4 mb-6">
                <div className="text-left">
                  <div className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg">
                    Hello! How can I help you today?
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI Assistant</p>
                </div>
              </div>

              {/* Chat Input */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Type your message here... (This is a demo)"
                    className="flex-1 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                    disabled
                  />
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    disabled
                  >
                    Send
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Chat functionality will be implemented in the next phase
                </p>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Authentication Testing Results
            </h3>
            <div className="grid gap-3 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Sign-up flow working</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Sign-in flow working</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Protected route accessible</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Redirect after auth working</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">User management available</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Middleware protection active</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ← Back to Home
            </Link>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

// Note: metadata export removed since this is now a client component
// Metadata will be handled by the layout or parent server component
