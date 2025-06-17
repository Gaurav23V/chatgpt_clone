/**
 * Chat Layout
 *
 * This layout provides the main chat interface structure with:
 * - Sidebar for chat history and navigation
 * - Main content area for active chat
 * - Responsive design that collapses sidebar on mobile
 * - Authentication protection via middleware
 */

import { ReactNode } from 'react';
import { Metadata } from 'next';

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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          {/* Sidebar Header */}
          <div className="flex-shrink-0 flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              ChatGPT Clone
            </h2>
            {/* TODO: Add new chat button */}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            {/* TODO: Implement ChatSidebar component */}
            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chat history will appear here
              </p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            {/* TODO: Add user profile and settings */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              User menu placeholder
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {/* TODO: Add mobile sidebar with backdrop */}
    </div>
  );
}
