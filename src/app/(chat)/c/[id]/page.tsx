/**
 * Individual Chat Conversation Page
 *
 * This page displays a specific chat conversation identified by the chat ID.
 * Protected with authentication and proper loading states.
 * Now uses the new ChatArea component with v0's pixel-perfect design.
 */

import { ProtectedPageWrapper } from '@/components/auth';

import { ChatPageClient } from './ChatPageClient';

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Chat page content component (server component)
function ChatPageContent({ chatId }: { chatId: string }) {
  return <ChatPageClient conversationId={chatId} />;
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
      enableDevTools={false}
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
    title: `Chat ${id} | Aria`,
    description: `Continue your conversation in chat ${id}`,
    robots: {
      index: false, // Protected content should not be indexed
      follow: false,
    },
  };
}
