'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import {
  AlertCircle,
  Copy,
  Download,
  RotateCcw,
  Share,
  ThumbsDown,
  ThumbsUp,
  Wifi,
  WifiOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
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
  streamingState,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
  onShare,
  onDownload,
  onRetry,
  smoothStreaming = true,
  preserveSelection = true,
  showTypingIndicator = true,
  showStreamingStats = false,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

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

  // Format content - in real app, this would use proper markdown parser
  const formatContent = (text: string) => {
    // Simple formatting for bold text - preserve for non-streaming or use raw text for streaming
    if (isStreaming && preserveSelection) {
      return text; // Don't process markdown during streaming to preserve selection
    }
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const formattedContent = formatContent(content);
  const hasStreamingError = streamingState?.error;

  if (role === 'user') {
    return (
      <div
        className='animate-message-appear mb-6 flex justify-end'
        ref={messageRef}
      >
        <div className='message-user'>
          <p className='text-sm text-white'>
            {preserveSelection && isStreaming ? (
              <StreamingText
                text={content}
                isStreaming={isStreaming}
                preserveSelection={preserveSelection}
                smoothStreaming={smoothStreaming}
              />
            ) : (
              <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
            )}
          </p>
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
            {/* Main content */}
            <div>
              {preserveSelection && (isStreaming || smoothStreaming) ? (
                <StreamingText
                  text={content}
                  isStreaming={isStreaming}
                  preserveSelection={preserveSelection}
                  smoothStreaming={smoothStreaming}
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
              )}
            </div>

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
