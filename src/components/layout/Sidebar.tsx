'use client';

import { useState } from 'react';

import { UserButton } from '@clerk/nextjs';
import {
  MoreHorizontal,
  PenSquare,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock conversation data - replace with actual data from your backend
const mockConversations: any[] = [
  {
    id: '1',
    title: 'Getting started with Next.js',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '2',
    title: 'Building a chat application',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '3',
    title: 'Understanding React hooks',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
  },
  {
    id: '4',
    title: 'TypeScript best practices',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
  },
  {
    id: '5',
    title: 'CSS Grid vs Flexbox',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 2 weeks ago
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [_conversations, setConversations] = useState(mockConversations);

  // Filter conversations based on search term
  const filteredConversations = mockConversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Group conversations by time period
  const groupConversationsByTime = (conversations: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      today: conversations.filter((conv) => conv.updatedAt >= today),
      yesterday: conversations.filter(
        (conv) => conv.updatedAt >= yesterday && conv.updatedAt < today,
      ),
      lastWeek: conversations.filter(
        (conv) => conv.updatedAt >= lastWeek && conv.updatedAt < yesterday,
      ),
      lastMonth: conversations.filter(
        (conv) => conv.updatedAt >= lastMonth && conv.updatedAt < lastWeek,
      ),
      older: conversations.filter((conv) => conv.updatedAt < lastMonth),
    };
  };

  const groupedConversations = groupConversationsByTime(filteredConversations);

  // Handle new chat
  const handleNewChat = () => {
    router.push('/c/new');
    onClose();
  };

  // Render conversation group
  const renderConversationGroup = (
    title: string,
    conversations: any[],
  ) => {
    if (conversations.length === 0) return null;

    return (
      <div className='mb-4'>
        <h3 className='mb-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider'>
          {title}
        </h3>
        <div className='space-y-1'>
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/c/${conversation.id}`}
              onClick={onClose}
              className='group flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#2f2f2f] hover:text-white'
            >
              <div className='flex-1 truncate'>{conversation.title}</div>
              <div className='opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 text-gray-400 hover:text-white'
                >
                  <MoreHorizontal className='h-3 w-3' />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // Collapsed sidebar view
  if (!isOpen) {
    return (
      <div className='flex w-16 flex-col items-center space-y-4 border-r border-[#444444] bg-[#171717] py-4'>
        <Button
          variant='ghost'
          size='icon'
          className='h-10 w-10 text-white hover:bg-[#303030]'
          onClick={onClose}
        >
          <PenSquare className='h-5 w-5' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='h-10 w-10 text-white hover:bg-[#303030]'
        >
          <Search className='h-5 w-5' />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`${
        isOpen ? 'w-[260px]' : 'w-0'
      } flex flex-col overflow-hidden border-r border-[#444444] bg-[#171717] transition-all duration-200`}
    >
      {/* Header */}
      <div className='space-y-3 p-3'>
        <div className='flex items-center space-x-2'>
          <Button
            className='h-11 flex-1 justify-start border border-[#444444] bg-transparent text-white hover:bg-[#303030]'
            onClick={handleNewChat}
          >
            <PenSquare className='mr-3 h-4 w-4' />
            New chat
          </Button>

          <Button
            size='icon'
            variant='ghost'
            className='h-11 w-11 flex-shrink-0 border border-[#444444] text-white hover:bg-[#303030]'
            onClick={onClose}
          >
            <PenSquare className='h-4 w-4' />
          </Button>
        </div>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Search className='mr-3 h-4 w-4' />
          Search chats
        </Button>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Plus className='mr-3 h-4 w-4' />
          Library
        </Button>
      </div>

      {/* GPT Models */}
      <div className='space-y-1 px-3'>
        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Plus className='mr-3 h-4 w-4' />
          Sora
        </Button>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Plus className='mr-3 h-4 w-4' />
          GPTs
        </Button>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Users className='mr-3 h-4 w-4' />
          Humanize AI
        </Button>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Plus className='mr-3 h-4 w-4' />
          Data Analyst
        </Button>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Plus className='mr-3 h-4 w-4' />
          Code Copilot
        </Button>

        <Button
          variant='ghost'
          className='h-10 w-full justify-start text-white hover:bg-[#303030]'
        >
          <Plus className='mr-3 h-4 w-4' />
          Web Browser
        </Button>
      </div>

      {/* Chats Section */}
      <div className='mt-6 flex-1 px-3'>
        <div className='mb-2 px-2 text-xs text-gray-400'>Chats</div>
        <div className='space-y-1'>
          {renderConversationGroup('Today', groupedConversations.today)}
          {renderConversationGroup('Yesterday', groupedConversations.yesterday)}
          {renderConversationGroup('Last Week', groupedConversations.lastWeek)}
          {renderConversationGroup('Last Month', groupedConversations.lastMonth)}
          {renderConversationGroup('Older', groupedConversations.older)}
        </div>
      </div>

      {/* Footer with User Profile */}
      <div className='border-t border-[#444444] p-3'>
        <div className='flex items-center justify-between text-white'>
          <div className='flex min-w-0 flex-1 items-center'>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                  userButtonBox: 'flex-row-reverse',
                },
              }}
            />
            <div className='ml-3 min-w-0 flex-1'>
              <div className='truncate text-sm font-medium'>
                User
              </div>
              <div className='text-xs text-gray-400'>Upgrade plan</div>
            </div>
          </div>
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 flex-shrink-0 text-gray-400 hover:bg-[#404040] hover:text-white'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
