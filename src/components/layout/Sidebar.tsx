'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { UserButton } from '@clerk/nextjs';
import {
  MoreHorizontal,
  PenSquare,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationItem {
  id: string;
  title: string;
  lastMessageAt: string | Date;
  updatedAt?: string | Date; // fallback for older schema
}

// Helper to safely parse ISO dates
const toDate = (value: string | Date | undefined): Date => {
  if (!value) return new Date(0);
  return value instanceof Date ? value : new Date(value);
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [_conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/conversations?limit=100');
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations (${res.status})`);
      }
      const json = await res.json();
      const docs = json.data?.conversations || [];
      const items: ConversationItem[] = docs.map((doc: any) => ({
        id: doc._id ?? doc.id ?? '',
        title: doc.title || 'Untitled',
        lastMessageAt: doc.lastMessageAt || doc.updatedAt || new Date(),
        updatedAt: doc.updatedAt,
      }));
      setConversations(items);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on initial mount and whenever the route changes (e.g., after creating a chat)
  useEffect(() => {
    fetchConversations();
  }, [pathname]);

  // Filter conversations based on search term
  const filteredConversations = _conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group conversations by time period
  const groupConversationsByTime = (conversations: ConversationItem[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      today: conversations.filter(
        (conv) => toDate(conv.lastMessageAt ?? conv.updatedAt) >= today
      ),
      yesterday: conversations.filter((conv) => {
        const d = toDate(conv.lastMessageAt ?? conv.updatedAt);
        return d >= yesterday && d < today;
      }),
      lastWeek: conversations.filter((conv) => {
        const d = toDate(conv.lastMessageAt ?? conv.updatedAt);
        return d >= lastWeek && d < yesterday;
      }),
      lastMonth: conversations.filter((conv) => {
        const d = toDate(conv.lastMessageAt ?? conv.updatedAt);
        return d >= lastMonth && d < lastWeek;
      }),
      older: conversations.filter(
        (conv) => toDate(conv.lastMessageAt ?? conv.updatedAt) < lastMonth
      ),
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
    conversations: ConversationItem[]
  ) => {
    if (conversations.length === 0) return null;

    return (
      <div className='mb-4'>
        <h3 className='mb-2 px-3 text-xs font-medium tracking-wider text-gray-500 uppercase'>
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
              <div className='flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100'>
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
          onClick={handleNewChat}
        >
          <PenSquare className='h-5 w-5' />
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

      </div>

      {/* Chats Section */}
      <div className='mt-6 flex-1 px-3'>
        <div className='mb-2 px-2 text-xs text-gray-400'>Chats</div>
        <div className='space-y-1'>
          {renderConversationGroup('Today', groupedConversations.today)}
          {renderConversationGroup('Yesterday', groupedConversations.yesterday)}
          {renderConversationGroup('Last Week', groupedConversations.lastWeek)}
          {renderConversationGroup(
            'Last Month',
            groupedConversations.lastMonth
          )}
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
              <div className='truncate text-sm font-medium'>User</div>
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
