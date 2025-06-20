'use client';

import { useEffect, useState } from 'react';

import { usePathname } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';

import { useCurrentConversation } from '@/contexts/user-context';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

import { ModelProvider } from '@/contexts/model-context';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Auth state
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Current conversation state
  const { currentConversationId, setCurrentConversationId } =
    useCurrentConversation();

  // Extract conversation ID from URL
  const conversationId = pathname.startsWith('/c/')
    ? pathname.split('/c/')[1]
    : null;

  // Update current conversation when URL changes
  useEffect(() => {
    if (
      conversationId &&
      conversationId !== 'new' &&
      conversationId !== currentConversationId
    ) {
      setCurrentConversationId(conversationId);
    }
  }, [conversationId, currentConversationId, setCurrentConversationId]);

  // Handle mobile responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-close sidebar on mobile
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (id: string | null) => {
    setCurrentConversationId(id);

    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Don't render until auth is loaded
  if (!isLoaded) {
    return (
      <div className='flex h-screen items-center justify-center bg-[#212121] text-white'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-white'></div>
      </div>
    );
  }

  // Redirect to auth if not signed in (this should be handled by auth guards)
  if (!isSignedIn) {
    return null;
  }

  return (
    <ModelProvider>
      <div className='flex h-screen bg-[#212121] text-white'>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className='flex min-w-0 flex-1 flex-col'>
          <TopBar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            title={
              conversationId && conversationId !== 'new'
                ? `Chat ${conversationId}`
                : undefined
            }
            showShare={!!conversationId && conversationId !== 'new'}
            isHomePage={!conversationId || conversationId === 'new'}
            user={user}
          />

          <div className='flex-1 overflow-hidden'>{children}</div>
        </div>
      </div>
    </ModelProvider>
  );
}
