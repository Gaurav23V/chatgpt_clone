'use client';

import { useEffect, useRef, useState } from 'react';

import { Mic, Send, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ChatAttachment } from './FileUploadButton';
import FileUploadButton from './FileUploadButton';


interface WelcomeScreenProps {
  onSubmit: (message: string, attachments: ChatAttachment[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function WelcomeScreen({
  onSubmit,
  isLoading = false,
  disabled = false,
}: WelcomeScreenProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
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

    onSubmit(input.trim(), attachments);
    setInput('');
    setAttachments([]);
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
    if (value.length <= 4000) {
      setInput(value);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading || disabled) return;
    onSubmit(suggestion, []);
  };

  // Suggestion categories with v0's exact content
  const suggestions = [
    {
      category: 'Creative',
      color: 'text-orange-400',
      items: [
        'Write a story about a magic backpack',
        'Create a poem about oceans',
        'Design a new holiday',
      ],
    },
    {
      category: 'Learning',
      color: 'text-blue-400',
      items: [
        'Explain quantum physics simply',
        'How do airplanes stay up?',
        'What is photosynthesis?',
      ],
    },
    {
      category: 'Productivity',
      color: 'text-green-400',
      items: [
        'Plan a weekly meal prep',
        'Create a study schedule',
        'Help me organize my desk',
      ],
    },
    {
      category: 'Fun',
      color: 'text-purple-400',
      items: [
        'Tell me a random fun fact',
        'Create a riddle for me',
        "What's a good ice breaker?",
      ],
    },
  ];

  return (
    <div className='animate-in fade-in-0 flex min-h-screen flex-col items-center justify-center px-4 py-8 duration-500'>
      {/* Main heading */}
      <div className='animate-in slide-in-from-bottom-4 mb-8 text-center duration-700'>
        <h1 className='mb-2 text-2xl font-normal text-white'>
          Where should we begin?
        </h1>
      </div>

      {/* Suggestion grid */}
      <div className='animate-in slide-in-from-bottom-6 mb-8 grid w-full max-w-6xl grid-cols-1 gap-4 delay-200 duration-700 md:grid-cols-2 lg:grid-cols-4'>
        {suggestions.map((category, categoryIndex) => (
          <div key={category.category} className='space-y-3'>
            <h3
              className={`text-sm font-medium ${category.color} animate-in slide-in-from-left-4 duration-500`}
              style={{ animationDelay: `${300 + categoryIndex * 100}ms` }}
            >
              {category.category}
            </h3>
            <div className='space-y-2'>
              {category.items.map((suggestion, index) => (
                <Button
                  key={index}
                  variant='ghost'
                  className='suggestion-button animate-in slide-in-from-left-4 hover-lift duration-500'
                  style={{
                    animationDelay: `${400 + categoryIndex * 100 + index * 50}ms`,
                  }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading || disabled}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Input area with model selector */}
      <div className='animate-in slide-in-from-bottom-8 w-full max-w-3xl delay-500 duration-700'>

        <form onSubmit={handleSubmit}>
          <div className='relative'>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder='Ask anything'
              className='chat-input max-h-[200px] min-h-[56px] w-full resize-none overflow-hidden rounded-3xl border-0 bg-transparent px-4 py-4 pr-24 text-base text-white placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0'
              disabled={disabled || isLoading}
              rows={1}
            />

            <div className='absolute top-1/2 right-2 flex -translate-y-1/2 items-center space-x-2'>
              {/* File upload */}
              <FileUploadButton
                onFileUploaded={(file) =>
                  setAttachments((prev) => [...prev, file])
                }
                disabled={disabled || isLoading}
              />

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

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className='mt-2 mb-3 flex flex-wrap gap-2'>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className='relative flex items-center rounded-md border border-[#444] px-2 py-1 text-xs text-gray-200'
              >
                {att.mimeType.startsWith('image') ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className='mr-2 h-8 w-8 rounded object-cover'
                  />
                ) : (
                  <span className='mr-2'>📄</span>
                )}
                <span className='max-w-[120px] truncate'>{att.name}</span>
                <button
                  type='button'
                  className='ml-2 text-gray-400 hover:text-red-400'
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

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
          {input.length > 3200 && (
            <div className='animate-in fade-in-0 slide-in-from-right-5 ml-2 text-xs text-gray-400'>
              {input.length}/4000
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
