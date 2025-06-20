/**
 * Chat Page Client Component
 * 
 * Client-side component that loads messages for an existing conversation
 * and displays the chat interface.
 */

'use client';

import { useEffect, useState } from 'react';

import { notFound } from 'next/navigation';

import { useAuth } from '@clerk/nextjs';

import { ChatArea } from '@/components/chat';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface ChatPageClientProps {
  conversationId: string;
}

export function ChatPageClient({ conversationId }: ChatPageClientProps) {
  const { isLoaded, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (!isLoaded || !userId) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log(`Loading messages for conversation: ${conversationId}`);

        const response = await fetch(`/api/conversations/${conversationId}/messages`);

        if (response.status === 404) {
          // Conversation doesn't exist
          notFound();
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`);
        }

        const data = await response.json();
        const loadedMessages = data.data?.messages || [];

        console.log(`Loaded ${loadedMessages.length} messages for conversation: ${conversationId}`);

        // Transform messages and ensure Date objects
        const formattedMessages = loadedMessages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        }));

        setMessages(formattedMessages);

      } catch (err) {
        console.error('Error loading messages:', err);
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, isLoaded, userId]);

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#19C37D] border-t-transparent'></div>
          <p className='mt-2 text-[#b4b4b4]'>Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <p className='text-red-400'>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className='mt-2 rounded bg-[#19C37D] px-4 py-2 text-black hover:bg-[#17b377]'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatArea
      conversationId={conversationId}
      initialMessages={messages}
    />
  );
} 