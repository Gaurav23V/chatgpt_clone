/**
 * Chat Authentication Guard
 *
 * Specialized authentication guard for the chat interface.
 * Provides chat-specific loading states and fallback UI.
 */

import type { ReactNode } from 'react';

import { AuthGuard } from './AuthGuard';

interface ChatAuthGuardProps {
  children: ReactNode;
  showSidebar?: boolean;
}

// Chat-specific loading component that matches the chat layout
const ChatLoadingComponent = ({
  showSidebar = true,
}: {
  showSidebar?: boolean;
}) => (
  <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
    {/* Sidebar skeleton */}
    {showSidebar && (
      <div className='hidden md:flex md:w-64 md:flex-col'>
        <div className='flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
          {/* Sidebar header skeleton */}
          <div className='flex-shrink-0 border-b border-gray-200 px-4 py-4 dark:border-gray-700'>
            <div className='h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
          </div>

          {/* Chat history skeleton */}
          <div className='flex-1 space-y-3 overflow-y-auto p-4'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='animate-pulse'>
                <div className='mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700'></div>
              </div>
            ))}
          </div>

          {/* User menu skeleton */}
          <div className='flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700'>
            <div className='flex items-center space-x-3'>
              <div className='h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700'></div>
              <div className='h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Main content skeleton */}
    <div className='flex flex-1 flex-col overflow-hidden'>
      <main className='relative flex-1 overflow-y-auto focus:outline-none'>
        <div className='mx-auto max-w-4xl space-y-6 px-4 py-8'>
          {/* Chat messages skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className='animate-pulse'>
              <div className='mb-4 flex space-x-3'>
                <div className='h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700'></div>
                  <div className='space-y-1'>
                    <div className='h-4 rounded bg-gray-200 dark:bg-gray-700'></div>
                    <div className='h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700'></div>
                    <div className='h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700'></div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Input area skeleton */}
          <div className='border-t border-gray-200 pt-4 dark:border-gray-700'>
            <div className='mx-auto max-w-4xl'>
              <div className='relative'>
                <div className='h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700'></div>
                <div className='absolute top-2 right-2'>
                  <div className='h-8 w-8 animate-pulse rounded bg-gray-300 dark:bg-gray-600'></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);

// Chat-specific fallback component
const ChatFallback = () => {
  // Import redirect utilities dynamically to avoid SSR issues
  const handleSignInClick = () => {
    import('@/lib/auth/redirect-utils')
      .then(({ storeCurrentLocationAndRedirect }) => {
        storeCurrentLocationAndRedirect('sign-in');
      })
      .catch(() => {
        // Fallback if import fails
        window.location.href = '/sign-in';
      });
  };

  const handleSignUpClick = () => {
    import('@/lib/auth/redirect-utils')
      .then(({ storeCurrentLocationAndRedirect }) => {
        storeCurrentLocationAndRedirect('sign-up');
      })
      .catch(() => {
        // Fallback if import fails
        window.location.href = '/sign-up';
      });
  };

  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='flex flex-1 items-center justify-center'>
        <div className='mx-auto max-w-md space-y-6 p-6 text-center'>
          <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
            <svg
              className='h-10 w-10 text-blue-600 dark:text-blue-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
          </div>
          <div>
            <h2 className='mb-2 text-3xl font-bold text-gray-900 dark:text-white'>
              Sign in to chat
            </h2>
            <p className='mb-6 text-gray-600 dark:text-gray-400'>
              Access your chat history and start new conversations with AI.
            </p>
          </div>
          <div className='space-y-3'>
            <button
              onClick={handleSignInClick}
              className='inline-flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            >
              Sign In
            </button>
            <button
              onClick={handleSignUpClick}
              className='inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              Create Account
            </button>
          </div>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * ChatAuthGuard Component
 *
 * Specialized authentication guard for chat interfaces.
 * Provides chat-specific loading states and fallback UI.
 */
export const ChatAuthGuard = ({
  children,
  showSidebar = true,
}: ChatAuthGuardProps) => {
  return (
    <AuthGuard
      showLoading={true}
      loadingComponent={<ChatLoadingComponent showSidebar={showSidebar} />}
      fallback={<ChatFallback />}
    >
      {children}
    </AuthGuard>
  );
};

export default ChatAuthGuard;
