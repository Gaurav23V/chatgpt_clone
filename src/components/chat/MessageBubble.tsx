'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Pencil,
  RotateCcw,
  Share,
  ThumbsDown,
  ThumbsUp,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: any;
  isStreaming?: boolean;
  isLoading?: boolean;
  streamingState?: {
    isConnecting?: boolean;
    isReconnecting?: boolean;
    error?: Error | null;
    tokensPerSecond?: number;
    chunksReceived?: number;
  };
  onCopy?: (content: string) => void;
  onThumbsUp?: (messageId: string) => void;
  onThumbsDown?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onShare?: (messageId: string) => void;
  onDownload?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  isEdited?: boolean;
  // Streaming optimization props
  smoothStreaming?: boolean;
  preserveSelection?: boolean;
  showTypingIndicator?: boolean;
  showStreamingStats?: boolean;
}

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  preserveSelection?: boolean;
  smoothStreaming?: boolean;
  className?: string;
}

/**
 * StreamingText component that preserves text selection during updates
 * Uses React Fragments with stable keys to prevent selection loss
 */
function StreamingText({
  text,
  isStreaming,
  preserveSelection = true,
  smoothStreaming = true,
  className = '',
}: StreamingTextProps) {
  const [displayText, setDisplayText] = useState<string>('');
  const rafRef = useRef<number | undefined>(undefined);
  const lastLengthRef = useRef<number>(0);

  useEffect(() => {
    if (!smoothStreaming || !isStreaming) {
      setDisplayText(text);
      lastLengthRef.current = text.length;
      return;
    }

    // Smooth text appearance using RAF for 60fps updates
    const animateText = (): void => {
      setDisplayText((currentDisplayText: string) => {
        const currentLength = currentDisplayText.length;
        const targetLength = text.length;

        if (currentLength < targetLength) {
          // Add characters gradually
          const step = Math.max(
            1,
            Math.ceil((targetLength - currentLength) / 10)
          );
          const newLength = Math.min(targetLength, currentLength + step);
          const newText = text.slice(0, newLength);

          if (newLength < targetLength) {
            rafRef.current = requestAnimationFrame(animateText);
          }

          return newText;
        }

        return currentDisplayText;
      });
    };

    if (text.length > lastLengthRef.current) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(animateText);
    } else {
      setDisplayText(text);
    }

    lastLengthRef.current = text.length;

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [text, isStreaming, smoothStreaming]);

  // For better text selection preservation, render each character as a Fragment with stable key
  const renderedText = useMemo(() => {
    if (!preserveSelection || !isStreaming) {
      return <span className={className}>{displayText}</span>;
    }

    return (
      <span className={className}>
        {displayText.split('').map((char, index) => (
          <Fragment key={`char-${index}`}>{char}</Fragment>
        ))}
      </span>
    );
  }, [displayText, preserveSelection, isStreaming, className]);

  return <>{renderedText}</>;
}

/**
 * Typing indicator with animated dots
 */
function TypingIndicator({
  show,
  className = '',
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className='animate-typing-dots h-2 w-2 rounded-full bg-white opacity-60'></div>
      <div
        className='animate-typing-dots h-2 w-2 rounded-full bg-white opacity-60'
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div
        className='animate-typing-dots h-2 w-2 rounded-full bg-white opacity-60'
        style={{ animationDelay: '0.4s' }}
      ></div>
    </div>
  );
}

/**
 * Streaming stats display
 */
function StreamingStats({
  tokensPerSecond,
  chunksReceived,
  show,
}: {
  tokensPerSecond?: number;
  chunksReceived?: number;
  show: boolean;
}) {
  if (!show || (!tokensPerSecond && !chunksReceived)) return null;

  return (
    <div className='mt-2 flex items-center space-x-3 text-xs text-gray-400'>
      {tokensPerSecond && (
        <span className='flex items-center space-x-1'>
          <Wifi className='h-3 w-3' />
          <span>{tokensPerSecond} t/s</span>
        </span>
      )}
      {chunksReceived && (
        <span className='flex items-center space-x-1'>
          <span>{chunksReceived} chunks</span>
        </span>
      )}
    </div>
  );
}

/**
 * Connection status indicator
 */
function ConnectionStatus({
  isConnecting,
  isReconnecting,
  error,
}: {
  isConnecting?: boolean;
  isReconnecting?: boolean;
  error?: Error | null;
}) {
  if (error) {
    return (
      <div className='mt-2 flex items-center space-x-1 text-xs text-red-400'>
        <AlertCircle className='h-3 w-3' />
        <span>Connection error</span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className='mt-2 flex items-center space-x-1 text-xs text-yellow-400'>
        <WifiOff className='h-3 w-3 animate-pulse' />
        <span>Reconnecting...</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className='mt-2 flex items-center space-x-1 text-xs text-blue-400'>
        <Wifi className='h-3 w-3 animate-pulse' />
        <span>Connecting...</span>
      </div>
    );
  }

  return null;
}

export function MessageBubble({
  id,
  role,
  content,
  isStreaming = false,
  isLoading = false,
  streamingState,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
  onShare,
  onDownload,
  onRetry,
  onEdit,
  isEdited = false,
  smoothStreaming = true,
  preserveSelection = true,
  showTypingIndicator = true,
  showStreamingStats = false,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const messageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (isStreaming && messageRef.current) {
      // Use RAF to ensure smooth scrolling that doesn't interfere with text rendering
      requestAnimationFrame(() => {
        messageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }, [content, isStreaming]);

  // Handle copy functionality
  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  // Enhanced markdown formatting function
  const formatContent = (text: string) => {
    // Always process markdown formatting for better UX
    let formatted = text;

    // Bold text: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic text: *text* -> <em>text</em> (but not if it's part of **)
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    // Code: `code` -> <code>code</code>
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>'
    );

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Headers: ### Header -> <h3>Header</h3>
    formatted = formatted.replace(
      /^### (.*$)/gm,
      '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>'
    );
    formatted = formatted.replace(
      /^## (.*$)/gm,
      '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>'
    );
    formatted = formatted.replace(
      /^# (.*$)/gm,
      '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>'
    );

    return formatted;
  };

  // Normalize content: handle either string or multimodal array
  const normalizeContent = (rawContent: any): string => {
    if (typeof rawContent === 'string') return rawContent;

    if (Array.isArray(rawContent)) {
      return rawContent
        .map((part: any) => {
          if (!part) return '';
          if (typeof part === 'string') return part;
          // Google Generative AI multimodal parts
          switch (part.type) {
            case 'text':
              return part.text || '';
            case 'image':
              // Placeholder; you could render <img> in future
              return '[Image]';
            case 'file':
              return `[File: ${part.mimeType || 'file'}]`;
            default:
              return '';
          }
        })
        .join('\n');
    }

    // Fallback
    try {
      return String(rawContent);
    } catch {
      return '';
    }
  };

  const normalizedContent = normalizeContent(content);
  const formattedContent = formatContent(normalizedContent);
  const hasStreamingError = streamingState?.error;

  // Handle edit mode
  const startEdit = () => {
    setIsEditing(true);
    setEditContent(normalizedContent);
    // Focus textarea after state update
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const saveEdit = () => {
    if (onEdit && editContent.trim() !== normalizedContent) {
      onEdit(id, editContent.trim());
    }
    setIsEditing(false);
    setEditContent('');
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editContent, isEditing]);

  if (role === 'user') {
    return (
      <div
        className='animate-message-appear mb-6 flex justify-end'
        ref={messageRef}
        onMouseEnter={() => !isEditing && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div
          className={`message-user group relative ${isLoading ? 'disabled-editing' : ''} ${isEditing ? 'editing' : ''}`}
        >
          {isEditing ? (
            <div className='edit-textarea-container space-y-2'>
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className='edit-textarea min-h-[60px] w-full'
                placeholder='Edit your message...'
              />
              <div className='edit-actions'>
                <Button
                  size='sm'
                  variant='ghost'
                  className='edit-cancel-button h-8 px-3'
                  onClick={cancelEdit}
                >
                  <X className='mr-1 h-4 w-4' />
                  Cancel
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  className='edit-save-button h-8 px-3'
                  onClick={saveEdit}
                >
                  <Check className='mr-1 h-4 w-4' />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                dangerouslySetInnerHTML={{ __html: formattedContent }}
                className='message-content message-content-transition text-sm'
              />
              {isEdited && <span className='edited-indicator'>(edited)</span>}
              {/* Edit button - show on hover */}
              {showActions && onEdit && !isLoading && (
                <Button
                  size='icon'
                  variant='ghost'
                  className='edit-button absolute -top-2 -right-2 h-7 w-7 text-gray-400 hover:bg-[#404040] hover:text-white'
                  onClick={startEdit}
                  title='Edit message'
                >
                  <Pencil className='h-3 w-3' />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (role === 'assistant') {
    return (
      <div
        className={`animate-message-appear mb-6 flex justify-start ${
          isStreaming ? 'loading-message' : ''
        } ${hasStreamingError ? 'border-l-2 border-red-500' : ''}`}
        onMouseEnter={() => !isStreaming && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        ref={messageRef}
      >
        <div className='message-assistant'>
          <div className='space-y-4 text-sm text-white'>
            {/* Main content with markdown support */}
            <div
              dangerouslySetInnerHTML={{ __html: formattedContent }}
              className='message-content text-sm'
            />

            {/* Streaming indicators and status */}
            {isStreaming && (
              <div className='space-y-2'>
                {showTypingIndicator && (
                  <TypingIndicator show={isStreaming} className='mt-2' />
                )}

                <ConnectionStatus
                  isConnecting={streamingState?.isConnecting}
                  isReconnecting={streamingState?.isReconnecting}
                  error={streamingState?.error}
                />

                {showStreamingStats && (
                  <StreamingStats
                    tokensPerSecond={streamingState?.tokensPerSecond}
                    chunksReceived={streamingState?.chunksReceived}
                    show={showStreamingStats}
                  />
                )}
              </div>
            )}

            {/* Error state with retry option */}
            {hasStreamingError && !isStreaming && (
              <div className='mt-2 flex items-center space-x-2 text-xs text-red-400'>
                <AlertCircle className='h-3 w-3' />
                <span>Failed to complete response</span>
                {onRetry && (
                  <Button
                    size='sm'
                    variant='ghost'
                    className='h-6 px-2 text-xs text-red-400 hover:bg-red-900/20'
                    onClick={() => onRetry(id)}
                  >
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Action buttons - show on hover when not streaming */}
            {!isStreaming && showActions && (
              <div className='animate-in fade-in-0 mt-4 flex items-center space-x-2 pt-2 opacity-0 duration-200'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                  onClick={handleCopy}
                  title='Copy message'
                >
                  <Copy className='h-4 w-4' />
                </Button>
                {onThumbsUp && (
                  <Button
                    size='icon'
                    variant='ghost'
                    className='animate-button-press h-8 w-8 text-gray-400 transition-all duration-200 hover:bg-[#404040] hover:text-white'
                    onClick={() => onThumbsUp(id)}
                    title='Good response'
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
                    title='Poor response'
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
                    title='Regenerate response'
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
                    title='Share message'
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
                    title='Download message'
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
