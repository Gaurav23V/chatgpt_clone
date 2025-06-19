'use client';

import { UserButton } from '@clerk/nextjs';
import { ChevronDown, Maximize2, Menu, Share } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface TopBarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  title?: string;
  showShare?: boolean;
  isHomePage?: boolean;
  user?: any; // Clerk user object
}

export function TopBar({
  onToggleSidebar,
  sidebarOpen,
  title,
  showShare,
  isHomePage = false,
  user,
}: TopBarProps) {
  return (
    <div className='flex items-center justify-between border-b border-[#444444] p-4'>
      <div className='flex items-center space-x-4'>
        {!sidebarOpen && (
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 text-white hover:bg-[#404040]'
            onClick={onToggleSidebar}
          >
            <Menu className='h-4 w-4' />
          </Button>
        )}

        <div className='flex items-center space-x-2'>
          <span className='font-medium text-white'>ChatGPT</span>
          <ChevronDown className='h-4 w-4 text-gray-400' />
        </div>

        {title && (
          <span className='max-w-md truncate text-sm text-gray-400'>
            {title}
          </span>
        )}
      </div>

      <div className='flex items-center space-x-2'>
        {!isHomePage && (
          <>
            <div className='rounded bg-[#2f2f2f] px-2 py-1 text-xs text-gray-400'>
              Saved memory full
            </div>
            <Button
              size='sm'
              className='bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700'
            >
              ⚡ Get Plus
            </Button>
          </>
        )}

        {showShare && (
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 text-white hover:bg-[#404040]'
          >
            <Share className='h-4 w-4' />
          </Button>
        )}

        <Button
          size='icon'
          variant='ghost'
          className='h-8 w-8 text-white hover:bg-[#404040]'
        >
          <Maximize2 className='h-4 w-4' />
        </Button>

        {user && (
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
                userButtonBox: 'bg-blue-600 rounded-full',
                userButtonOuterBox: 'hover:opacity-80',
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
