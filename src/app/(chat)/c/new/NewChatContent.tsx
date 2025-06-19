/**
 * New Chat Content - Client Component
 *
 * Contains the interactive elements for the new chat page.
 * This is a client component that uses the ChatArea component
 * with v0's pixel-perfect ChatGPT design.
 */

'use client';

import { ChatArea } from '@/components/chat';

export function NewChatContent() {
  return (
    <ChatArea
      conversationId={undefined} // No conversation ID for new chats
      initialMessages={[]} // Start with empty messages
    />
  );
}
