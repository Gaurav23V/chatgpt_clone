/**
 * Chat Page Skeleton Component
 *
 * Specialized loading skeleton for chat pages that maintains the exact
 * layout structure while loading. Provides a smooth transition experience.
 */

'use client';

interface ChatPageSkeletonProps {
  showSidebar?: boolean;
  messagesCount?: number;
  variant?: 'new-chat' | 'existing-chat' | 'loading-messages';
}

export function ChatPageSkeleton({
  showSidebar = true,
  messagesCount = 4,
  variant = 'existing-chat',
}: ChatPageSkeletonProps) {
  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Sidebar Skeleton */}
      {showSidebar && (
        <div className='hidden md:flex md:w-64 md:flex-col'>
          <div className='flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
            {/* Sidebar Header */}
            <div className='flex-shrink-0 border-b border-gray-200 px-4 py-4 dark:border-gray-700'>
              <div className='h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='mt-3 h-8 animate-pulse rounded bg-blue-100 dark:bg-blue-900'></div>
            </div>

            {/* Chat List */}
            <div className='flex-1 space-y-2 overflow-y-auto p-3'>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className='space-y-2 rounded-lg p-3'>
                  <div className='h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                  <div className='h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
                  <div className='h-2 w-1/2 animate-pulse rounded bg-gray-50 dark:bg-gray-500'></div>
                </div>
              ))}
            </div>

            {/* User Menu */}
            <div className='flex-shrink-0 border-t border-gray-200 p-4 dark:border-gray-700'>
              <div className='flex items-center space-x-3'>
                <div className='h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700'></div>
                <div className='flex-1 space-y-1'>
                  <div className='h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                  <div className='h-2 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Chat Header */}
        <div className='flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <div className='h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {variant === 'new-chat' ? (
            // New chat welcome state
            <div className='flex h-full items-center justify-center'>
              <div className='max-w-md space-y-4 text-center'>
                <div className='mx-auto h-16 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700'></div>
                <div className='mx-auto h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                <div className='space-y-2'>
                  <div className='h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
                  <div className='mx-auto h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
                </div>
              </div>
            </div>
          ) : (
            // Existing chat messages
            <div className='space-y-6'>
              {Array.from({ length: messagesCount }).map((_, i) => (
                <div key={i} className='space-y-4'>
                  {/* User Message */}
                  <div className='flex justify-end'>
                    <div className='max-w-xs space-y-2 lg:max-w-md'>
                      <div className='space-y-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20'>
                        <div className='h-4 animate-pulse rounded bg-blue-200 dark:bg-blue-800'></div>
                        <div className='h-4 w-3/4 animate-pulse rounded bg-blue-200 dark:bg-blue-800'></div>
                      </div>
                      <div className='ml-auto h-2 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className='flex justify-start'>
                    <div className='flex max-w-2xl space-x-3'>
                      <div className='h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700'></div>
                      <div className='flex-1 space-y-2'>
                        <div className='space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800'>
                          <div className='h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                          <div className='h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                          <div className='h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
                          {i === messagesCount - 1 &&
                            variant === 'loading-messages' && (
                              <div className='flex items-center space-x-2 pt-2'>
                                <div className='h-2 w-2 animate-bounce rounded-full bg-gray-400'></div>
                                <div
                                  className='h-2 w-2 animate-bounce rounded-full bg-gray-400'
                                  style={{ animationDelay: '0.1s' }}
                                ></div>
                                <div
                                  className='h-2 w-2 animate-bounce rounded-full bg-gray-400'
                                  style={{ animationDelay: '0.2s' }}
                                ></div>
                              </div>
                            )}
                        </div>
                        <div className='h-2 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className='flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mx-auto max-w-4xl'>
            <div className='flex items-end space-x-3'>
              <div className='flex-1 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700'>
                <div className='mb-2 h-6 animate-pulse rounded bg-gray-200 dark:bg-gray-600'></div>
                <div className='h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-500'></div>
              </div>
              <div className='flex-shrink-0 space-y-2'>
                <div className='h-10 w-10 animate-pulse rounded-lg bg-blue-100 dark:bg-blue-900'></div>
              </div>
            </div>
            <div className='mt-3 flex items-center justify-between px-1'>
              <div className='h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
              <div className='h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-600'></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact chat skeleton for smaller spaces
 */
export function CompactChatSkeleton() {
  return (
    <div className='flex h-96 flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
      {/* Header */}
      <div className='border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
        <div className='h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
      </div>

      {/* Messages */}
      <div className='flex-1 space-y-4 overflow-hidden p-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <div className='flex justify-end'>
              <div className='h-3 w-24 animate-pulse rounded bg-blue-100 dark:bg-blue-900'></div>
            </div>
            <div className='flex justify-start'>
              <div className='h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className='border-t border-gray-200 px-4 py-3 dark:border-gray-700'>
        <div className='h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-700'></div>
      </div>
    </div>
  );
}

/**
 * Mobile chat skeleton
 */
export function MobileChatSkeleton() {
  return (
    <div className='flex h-screen flex-col bg-gray-50 dark:bg-gray-900'>
      {/* Mobile Header */}
      <div className='flex-shrink-0 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center space-x-3'>
          <div className='h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='h-5 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='h-6 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 space-y-4 overflow-y-auto px-4 py-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs space-y-1 ${i % 2 === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'} rounded-lg p-3`}
            >
              <div className='h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
              <div className='h-3 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-700'></div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Input */}
      <div className='flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center space-x-2'>
          <div className='h-10 flex-1 animate-pulse rounded-full bg-gray-100 dark:bg-gray-700'></div>
          <div className='h-10 w-10 animate-pulse rounded-full bg-blue-100 dark:bg-blue-900'></div>
        </div>
      </div>
    </div>
  );
}
