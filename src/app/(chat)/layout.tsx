/**
 * Chat Layout
 *
 * This layout provides the main chat interface structure with:
 * - Sidebar for chat history and navigation
 * - Main content area for active chat
 * - Responsive design that collapses sidebar on mobile
 * - Authentication protection via middleware
 */

import type { Metadata } from 'next';

import type { ReactNode } from 'react';

interface ChatLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: 'Chat | ChatGPT Clone',
  description: 'AI-powered chat conversations',
};

export default function ChatLayout({ children }: ChatLayoutProps) {
  // Note: Authentication is handled by middleware.ts at the route level
  // This layout assumes the user is already authenticated

  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Sidebar */}
      <div className='hidden md:flex md:w-64 md:flex-col'>
        <div className='flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
          {/* Sidebar Header */}
          <div className='flex flex-shrink-0 items-center border-b border-gray-200 px-4 py-4 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              ChatGPT Clone
            </h2>
            {/* TODO: Add new chat button */}
          </div>

          {/* Chat History */}
          <div className='flex-1 overflow-y-auto'>
            {/* TODO: Implement ChatSidebar component */}
            <div className='p-4'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Chat history will appear here
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className='flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700'>
            {/* TODO: Add user profile and settings */}
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              User menu placeholder
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <main className='relative flex-1 overflow-y-auto focus:outline-none'>
          {children}
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {/* TODO: Add mobile sidebar with backdrop */}
    </div>
  );
}
