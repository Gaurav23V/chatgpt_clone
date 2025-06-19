/**
 * Individual Chat Conversation Page
 *
 * This page displays a specific chat conversation identified by the chat ID.
 * Protected with authentication and proper loading states.
 * Now uses the new ChatArea component with v0's pixel-perfect design.
 */

import { notFound } from 'next/navigation';

import { ProtectedPageWrapper } from '@/components/auth';
import { ChatArea } from '@/components/chat';

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Chat page content component (server component)
async function ChatPageContent({ chatId }: { chatId: string }) {
  // Validate chat ID format
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

  // TODO: Fetch messages from database
  // const messages = await getMessagesByConversationId(chatId);

  // Mock initial messages for demonstration
  const initialMessages = [
    {
      id: 'msg_1',
      role: 'user' as const,
      content: 'Hello! Can you help me understand LALR(1) parsers?',
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'msg_2',
      role: 'assistant' as const,
      content:
        "I'd be happy to help you understand LALR(1) parsers! **LALR(1)** stands for Look-Ahead LR(1), and it's a type of bottom-up parser used in compiler construction.\n\nHere are the key points:\n\n• **LR(1) parsers** are the most powerful of the LR family\n• **LALR(1) parsers** are constructed by merging LR(1) states with the same LR(0) core\n• This can sometimes introduce conflicts not present in full LR(1)\n\nWould you like me to explain any specific aspect in more detail?",
      createdAt: new Date('2024-01-01T10:00:30Z'),
    },
  ];

  return <ChatArea conversationId={chatId} initialMessages={initialMessages} />;
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
