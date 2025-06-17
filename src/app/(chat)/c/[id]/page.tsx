/**
 * Individual Chat Conversation Page
 *
 * This page displays a specific chat conversation identified by the chat ID.
 * It handles:
 * - Loading chat history from the database
 * - Displaying messages in chronological order
 * - Providing input for new messages
 * - Real-time message streaming
 *
 * Route: /c/[id] where id is the chat conversation ID
 */

import { notFound } from 'next/navigation';

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  // TODO: Validate chat ID format
  if (!id || id.length < 1) {
    notFound();
  }

  // TODO: Fetch chat data from database
  // const chat = await getChatById(id);
  // if (!chat) {
  //   notFound();
  // }

  // TODO: Verify user has access to this chat
  // const { userId } = auth();
  // if (chat.userId !== userId) {
  //   notFound();
  // }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {/* TODO: Display chat title or first message preview */}
              Chat {id}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {/* TODO: Display message count and last updated */}
              Loading chat details...
            </p>
          </div>

          {/* Chat Actions */}
          <div className="flex items-center space-x-2">
            {/* TODO: Add chat actions (rename, delete, share, etc.) */}
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <span className="sr-only">Chat options</span>
              {/* TODO: Add menu icon */}
              ⋯
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* TODO: Implement ChatMessages component */}
        <div className="space-y-4">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Chat messages will appear here</p>
            <p className="text-sm mt-2">Chat ID: {id}</p>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        {/* TODO: Implement ChatInput component */}
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <textarea
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              rows={1}
              disabled
            />
          </div>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// TODO: Add metadata generation
export async function generateMetadata({ params }: ChatPageProps) {
  const { id } = await params;

  // TODO: Fetch chat title from database
  // const chat = await getChatById(id);
  // const title = chat?.title || `Chat ${id}`;

  return {
    title: `Chat ${id} | ChatGPT Clone`,
    description: `Continue your conversation in chat ${id}`,
  };
}
