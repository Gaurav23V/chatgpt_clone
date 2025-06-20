/**
 * New Chat Content - Client Component
 *
 * Contains the interactive elements for the new chat page.
 * This is a client component that uses the ChatArea component
 * with v0's pixel-perfect ChatGPT design.
 */

'use client';

import { useRouter } from 'next/navigation';

import { ChatArea } from '@/components/chat';

export function NewChatContent() {
  const router = useRouter();

  const handleConversationCreated = (conversationId: string) => {
    console.log('Redirecting to conversation:', conversationId);
    // Redirect to the new conversation URL
    router.push(`/c/${conversationId}`);
  };

  return (
    <ChatArea
      conversationId={undefined} // No conversation ID for new chats
      initialMessages={[]} // Start with empty messages
      onConversationCreated={handleConversationCreated}
    />
  );
}
