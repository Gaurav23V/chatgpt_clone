'use client';

import { useEffect, useRef, useState } from 'react';

import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { ChatAttachment } from './FileUploadButton';
import FileUploadButton from './FileUploadButton';


interface InputAreaProps {
  onSubmit: (message: string, attachments: ChatAttachment[]) => void;
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
    if (value.length <= maxLength) {
      setInput(value);
    }
  };

  return (
    <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-t border-[#444444] p-4 backdrop-blur'>
      <div className='mx-auto max-w-3xl'>

        <form onSubmit={handleSubmit}>
          <div className='relative'>
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
              {/* File upload button */}
              <FileUploadButton
                onFileUploaded={(file) => {
                  setAttachments((prev) => [...prev, file]);
                }}
                disabled={disabled || isLoading}
              />



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

        {/* Character count */}
        {input.length > maxLength * 0.8 && (
          <div className='animate-in fade-in-0 slide-in-from-right-5 mt-2 flex justify-end'>
            <div className='text-xs text-gray-400'>
              {input.length}/{maxLength}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
