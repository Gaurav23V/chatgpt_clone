'use client';

import { useState } from 'react';

import { UserButton } from '@clerk/nextjs';
import { ChevronDown, ChevronUp, Menu, Share } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useModel } from '@/contexts/model-context';
import { UI_MODEL_GROUPS } from '@/lib/ai/models';

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
  const { selectedModel, setSelectedModel } = useModel();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentModel = UI_MODEL_GROUPS.flatMap((g) => g.models).find(
    (m) => m.id === selectedModel
  );

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

        <div className='relative'>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className='flex items-center space-x-2 rounded-lg px-3 py-2 text-white hover:bg-[#404040] transition-colors'
          >
            <span className='font-medium'>Aria</span>
            <span className='text-sm text-gray-400'>
              {currentModel?.name || 'Select model'}
            </span>
            {dropdownOpen ? (
              <ChevronUp className='h-4 w-4 text-gray-400' />
            ) : (
              <ChevronDown className='h-4 w-4 text-gray-400' />
            )}
          </button>

          {dropdownOpen && (
            <div className='animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-lg border border-[#333] bg-[#1e1e1e] shadow-xl'>
              {UI_MODEL_GROUPS.map((group) => (
                <div key={group.title} className='px-3 py-2'>
                  <p className='mb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase'>
                    {group.title}
                  </p>
                  {group.models.map((model) => {
                    const active = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        type='button'
                        onClick={() => {
                          setSelectedModel(model.id);
                          setDropdownOpen(false);
                        }}
                        className={`group mb-1 flex w-full flex-col rounded-md px-2 py-1 text-left transition-colors hover:bg-[#2f2f2f] ${
                          active ? 'bg-[#3a3a3a]' : ''
                        }`}
                      >
                        <span className='text-xs text-gray-200'>{model.name}</span>
                        <span className='text-[10px] text-gray-400'>
                          {model.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
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
