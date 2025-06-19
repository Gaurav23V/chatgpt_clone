'use client';

import { useState } from 'react';

import { Mic, Paperclip, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WelcomeScreenProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function WelcomeScreen({
  onToggleSidebar,
  sidebarOpen,
}: WelcomeScreenProps) {
  const [input, setInput] = useState('');

  const suggestions = [
    {
      icon: '📄',
      text: 'Summarize text',
      color: 'border-orange-500/20 bg-orange-500/10',
    },
    {
      icon: '📊',
      text: 'Analyze data',
      color: 'border-blue-500/20 bg-blue-500/10',
    },
    {
      icon: '🖼️',
      text: 'Analyze images',
      color: 'border-purple-500/20 bg-purple-500/10',
    },
    {
      icon: '✨',
      text: 'Surprise me',
      color: 'border-green-500/20 bg-green-500/10',
    },
    { text: 'More', color: 'border-gray-500/20 bg-gray-500/10' },
  ];

  return (
    <div className='flex h-full flex-col'>
      <div className='flex flex-1 flex-col items-center justify-center px-4'>
        <div className='w-full max-w-3xl'>
          <h1 className='mb-8 text-center text-2xl font-normal text-white'>
            What can I help with?
          </h1>

          <div className='relative mb-6'>
            <div className='relative rounded-3xl border border-[#444444] bg-[#2f2f2f] transition-colors focus-within:border-[#666666]'>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Ask anything'
                className='w-full rounded-3xl border-0 bg-transparent px-4 py-4 pr-20 text-base text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0'
              />
              <div className='absolute top-1/2 right-2 flex -translate-y-1/2 items-center space-x-2'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-lg text-gray-400 hover:bg-[#404040] hover:text-white'
                >
                  <Paperclip className='h-4 w-4' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-lg text-gray-400 hover:bg-[#404040] hover:text-white'
                >
                  <Settings className='h-4 w-4' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-lg text-gray-400 hover:bg-[#404040] hover:text-white'
                >
                  <Mic className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>

          <div className='mb-8 flex flex-wrap justify-center gap-2'>
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant='outline'
                className={`${suggestion.color} hover:bg-opacity-20 rounded-full border px-4 py-2 text-sm text-white`}
              >
                {suggestion.icon && (
                  <span className='mr-2'>{suggestion.icon}</span>
                )}
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className='pb-4 text-center text-xs text-gray-400'>
        By messaging ChatGPT, you agree to our{' '}
        <a href='#' className='underline hover:text-gray-300'>
          Terms
        </a>{' '}
        and have read our{' '}
        <a href='#' className='underline hover:text-gray-300'>
          Privacy Policy
        </a>
        . See{' '}
        <a href='#' className='underline hover:text-gray-300'>
          Cookie Preferences
        </a>
        .
      </div>
    </div>
  );
}
