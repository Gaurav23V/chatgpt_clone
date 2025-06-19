/**
 * Individual Chat Conversation Page
 *
 * This page displays a specific chat conversation identified by the chat ID.
 * Protected with authentication and proper loading states.
 */

import { notFound } from 'next/navigation';

import { ProtectedPageWrapper } from '@/components/auth';

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Chat page content component (server component)
async function ChatPageContent({ chatId }: { chatId: string }) {
  // TODO: Validate chat ID format
  if (!chatId || chatId.length < 1) {
    notFound();
  }

  // TODO: Fetch chat data from database
  // const chat = await getChatById(chatId);
  // if (!chat) {
  //   notFound();
  // }

  // TODO: Verify user has access to this chat
  // const { userId } = auth();
  // if (chat.userId !== userId) {
  //   notFound();
  // }

  return (
    <div className='flex h-full flex-col'>
      {/* Chat Header */}
      <div className='flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {/* TODO: Display chat title or first message preview */}
              Chat {chatId}
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              {/* TODO: Display message count and last updated */}
              Loading chat details...
            </p>
          </div>

          {/* Chat Actions */}
          <div className='flex items-center space-x-2'>
            {/* TODO: Add chat actions (rename, delete, share, etc.) */}
            <button className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
              <span className='sr-only'>Chat options</span>
              {/* TODO: Add menu icon */}⋯
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className='flex-1 overflow-y-auto px-6 py-4'>
        {/* TODO: Implement ChatMessages component */}
        <div className='space-y-4'>
          <div className='text-center text-gray-500 dark:text-gray-400'>
            <p>Chat messages will appear here</p>
            <p className='mt-2 text-sm'>Chat ID: {chatId}</p>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className='flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800'>
        {/* TODO: Implement ChatInput component */}
        <div className='flex items-center space-x-2'>
          <div className='flex-1'>
            <textarea
              placeholder='Type your message...'
              className='w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'
              rows={1}
              disabled
            />
          </div>
          <button
            className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Main page component with protection
export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    <ProtectedPageWrapper
      requirements={{
        level: 'chat',
        requireVerified: false,
        requireComplete: false,
      }}
      loadingVariant='chat'
      enableErrorBoundary={true}
      enableDevTools={true}
      pageTitle={`Chat ${id}`}
      pageDescription={`Continue your conversation in chat ${id}`}
      className='h-full'
    >
      <ChatPageContent chatId={id} />
    </ProtectedPageWrapper>
  );
}

// SEO metadata generation
export async function generateMetadata({ params }: ChatPageProps) {
  const { id } = await params;

  // TODO: Fetch chat title from database for better SEO
  // const chat = await getChatById(id);
  // const title = chat?.title || `Chat ${id}`;

  return {
    title: `Chat ${id} | ChatGPT Clone`,
    description: `Continue your conversation in chat ${id}`,
    robots: {
      index: false, // Protected content should not be indexed
      follow: false,
    },
  };
}
