'use client';

import { useState } from 'react';

import {
  Copy,
  Download,
  RotateCcw,
  Share,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  onCopy?: (content: string) => void;
  onThumbsUp?: (messageId: string) => void;
  onThumbsDown?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onShare?: (messageId: string) => void;
  onDownload?: (messageId: string) => void;
}

export function MessageBubble({
  id,
  role,
  content,
  isStreaming = false,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
  onShare,
  onDownload,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  // Handle copy functionality
  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  // Format content - in real app, this would use proper markdown parser
  const formatContent = (text: string) => {
    // Simple formatting for bold text
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  if (role === 'user') {
    return (
      <div className='animate-message-appear mb-6 flex justify-end'>
        <div className='message-user'>
          <p
            className='text-sm text-white'
            dangerouslySetInnerHTML={{ __html: formatContent(content) }}
          />
        </div>
      </div>
    );
  }

  if (role === 'assistant') {
    return (
      <div
        className={`animate-message-appear mb-6 flex justify-start ${isStreaming ? 'loading-message' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className='message-assistant'>
          <div className='space-y-4 text-sm text-white'>
            {/* Render content - in real app, use proper markdown renderer */}
            <div dangerouslySetInnerHTML={{ __html: formatContent(content) }} />

            {/* Streaming indicator */}
            {isStreaming && (
              <div className='mt-2 flex items-center space-x-1'>
                <div className='animate-typing-dots h-2 w-2 rounded-full bg-white'></div>
                <div
                  className='animate-typing-dots h-2 w-2 rounded-full bg-white'
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className='animate-typing-dots h-2 w-2 rounded-full bg-white'
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            )}

            {/* Action buttons - show on hover */}
            {!isStreaming && showActions && (
              <div className='animate-in fade-in-0 mt-4 flex items-center space-x-2 pt-2 opacity-0 duration-200'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                  onClick={handleCopy}
                >
                  <Copy className='h-4 w-4' />
                </Button>
                {onThumbsUp && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                    onClick={() => onThumbsUp(id)}
                  >
                    <ThumbsUp className='h-4 w-4' />
                  </Button>
                )}
                {onThumbsDown && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                    onClick={() => onThumbsDown(id)}
                  >
                    <ThumbsDown className='h-4 w-4' />
                  </Button>
                )}
                {onRegenerate && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                    onClick={() => onRegenerate(id)}
                  >
                    <RotateCcw className='h-4 w-4' />
                  </Button>
                )}
                {onShare && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                    onClick={() => onShare(id)}
                  >
                    <Share className='h-4 w-4' />
                  </Button>
                )}
                {onDownload && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                    onClick={() => onDownload(id)}
                  >
                    <Download className='h-4 w-4' />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // System messages (if needed)
  return null;
}
