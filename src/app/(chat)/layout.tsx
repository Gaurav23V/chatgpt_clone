/**
 * Chat Layout
 *
 * This layout provides the main chat interface structure with:
 * - Sidebar for chat history and navigation
 * - Main content area for active chat
 * - Responsive design that collapses sidebar on mobile
 * - Authentication protection via middleware
 * - v0's pixel-perfect ChatGPT design
 */

import type { Metadata } from 'next';

import type { ReactNode } from 'react';

import { ChatLayout } from '@/components/layout';

interface ChatLayoutProps {
  children: ReactNode;
}

export const metadata: Metadata = {
      title: 'Chat | Aria',
  description: 'AI-powered chat conversations',
};

export default function ChatLayoutPage({ children }: ChatLayoutProps) {
  // Note: Authentication is handled by middleware.ts at the route level
  // This layout assumes the user is already authenticated

  return <ChatLayout>{children}</ChatLayout>;
}
