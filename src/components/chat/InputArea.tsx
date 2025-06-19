'use client';

import { useEffect, useRef, useState } from 'react';

import { Mic, Plus, Send, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface InputAreaProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function InputArea({
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = 'Ask anything',
  maxLength = 4000,
}: InputAreaProps) {
  const [input, setInput] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled || isComposing) return;

    onSubmit(input.trim());
    setInput('');
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setInput(value);
    }
  };

  return (
    <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-t border-[#444444] p-4 backdrop-blur'>
      <div className='mx-auto max-w-3xl'>
        <form onSubmit={handleSubmit}>
          <div className='chat-input relative'>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={placeholder}
              className='chat-input max-h-[200px] min-h-[56px] w-full resize-none overflow-hidden rounded-3xl border-0 bg-transparent px-4 py-4 pr-24 text-base text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0'
              disabled={disabled || isLoading}
              rows={1}
            />

            <div className='absolute top-1/2 right-2 flex -translate-y-1/2 items-center space-x-2'>
              {/* File upload button - prepared for future functionality */}
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='hover-lift h-8 w-8 rounded-lg text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                disabled={disabled || isLoading}
              >
                <Plus className='h-4 w-4' />
              </Button>

              {/* Settings button */}
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='hover-lift h-8 w-8 rounded-lg text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                disabled={disabled || isLoading}
              >
                <Settings className='h-4 w-4' />
              </Button>

              {/* Microphone button - prepared for future functionality */}
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='hover-lift h-8 w-8 rounded-lg text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                disabled={disabled || isLoading}
              >
                <Mic className='h-4 w-4' />
              </Button>

              {/* Send button - only show when there's text */}
              {input.trim() && (
                <Button
                  type='submit'
                  size='icon'
                  className='hover-lift animate-in fade-in-0 zoom-in-95 h-8 w-8 rounded-lg bg-white text-black transition-all duration-200 hover:bg-gray-200'
                  disabled={disabled || isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <div className='loading-spinner h-4 w-4 rounded-full border-2 border-black border-t-transparent' />
                  ) : (
                    <Send className='h-4 w-4' />
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Character count and disclaimer */}
        <div className='mt-2 flex items-center justify-between'>
          <div className='flex-1 text-center text-xs text-gray-400'>
            ChatGPT can make mistakes. Check important info.{' '}
            <a
              href='#'
              className='underline transition-colors hover:text-gray-300'
            >
              See Cookie Preferences
            </a>
            .
          </div>
          {input.length > maxLength * 0.8 && (
            <div className='animate-in fade-in-0 slide-in-from-right-5 ml-2 text-xs text-gray-400'>
              {input.length}/{maxLength}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
