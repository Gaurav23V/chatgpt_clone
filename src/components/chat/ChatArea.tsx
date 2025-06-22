'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { useModel } from '@/contexts/model-context';
import { useGoogleChat } from '@/hooks/useGoogleChat';

import type { ChatAttachment } from './FileUploadButton';
import { InputArea } from './InputArea';
import { MessageBubble } from './MessageBubble';
import { WelcomeScreen } from './WelcomeScreen';

interface ChatAreaProps {
  conversationId?: string;
  initialMessages?: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: Date;
    isEdited?: boolean;
  }>;
  onConversationCreated?: (conversationId: string) => void;
}

export function ChatArea({
  conversationId,
  initialMessages = [],
  onConversationCreated,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Transform initial messages to match useChat format
  const formattedInitialMessages = initialMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt || new Date(),
  }));

  const { selectedModel } = useModel();

  const { messages, append, reload, isLoading, error, setMessages } =
    useGoogleChat({
      api: '/api/chat',
      initialMessages: formattedInitialMessages,
      model: selectedModel,
      conversationId,
      headers: {
        'X-Conversation-ID': conversationId || '',
      },
      onResponse: async (response) => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        const newConversationId = response.headers.get('X-Conversation-ID');
        if (newConversationId && !conversationId && onConversationCreated) {
          console.log('New conversation created:', newConversationId);
          onConversationCreated(newConversationId);
        }
      },
      onStreamEnd: () => {},
      onStreamStart: () => {},
      onError: (error) => {
        console.error('Chat error:', error);
      },
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message with optional attachments
  const sendMessage = async (
    content: string,
    attachments: ChatAttachment[] = []
  ) => {
    console.log('Sending message:', content, 'with attachments:', attachments);

    try {
      // If there are image attachments, format the message for Google Generative AI
      if (attachments.some((att) => att.mimeType.startsWith('image/'))) {
        const messageContent: any[] = [
          {
            type: 'text',
            text: content,
          },
        ];

        // Add image attachments in the format expected by Google Generative AI
        attachments.forEach((attachment) => {
          if (attachment.mimeType.startsWith('image/')) {
            messageContent.push({
              type: 'image',
              image: attachment.url,
            });
          }
        });

        await append({
          role: 'user',
          content: messageContent as any,
        });
      } else {
        // For text-only messages, use the original format
        await append({
          role: 'user',
          content,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Step 1: Get current messages array
    const currentMessages = [...messages];

    // Step 2: Find the index of edited message
    const editIndex = currentMessages.findIndex((m) => m.id === messageId);

    if (editIndex === -1) {
      console.error('Message not found for editing');
      return;
    }

    // Step 3: CRITICAL - Keep messages from start to edited message
    const messagesToKeep = currentMessages.slice(0, editIndex + 1);

    // Step 4: Update the content of the edited message
    messagesToKeep[editIndex] = {
      ...messagesToKeep[editIndex],
      content: newContent,
      isEdited: true,
    } as any;

    // Step 5: Update state with kept messages only
    setMessages(messagesToKeep);

    // Step 6: Save to database
    if (conversationId) {
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: messagesToKeep.map((msg) => ({
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
                isEdited: (msg as any).isEdited,
              })),
            }),
          }
        );

        if (!response.ok) {
          console.error('Failed to update messages in database');
        }
      } catch (error) {
        console.error('Error updating messages:', error);
      }
    }

    // Step 7: Trigger new AI response
    // The AI will see all messages up to and including the edited one
    append({
      role: 'user',
      content: newContent,
    });
  };

  // Handle copying message content
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Handle message reactions
  const handleThumbsUp = (messageId: string) => {
    console.log('Thumbs up:', messageId);
  };

  const handleThumbsDown = (messageId: string) => {
    console.log('Thumbs down:', messageId);
  };

  const handleRegenerate = (messageId: string) => {
    console.log('Regenerate:', messageId);
    reload();
  };

  const handleShare = (messageId: string) => {
    console.log('Share:', messageId);
  };

  const handleDownload = (messageId: string) => {
    console.log('Download:', messageId);
  };

  // Check if this is a new conversation (no messages and no specific ID)
  const isNewConversation = !conversationId && messages.length === 0;

  // Error handling helper
  const handleRetry = (error: any) => {
    const errorMessage = error?.message || 'Something went wrong';
    console.error('Error details:', error);
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='rounded-lg bg-red-50 p-4 text-center'>
          <p className='text-red-700'>{errorMessage}</p>
          <Button onClick={() => reload()} className='mt-2' variant='outline'>
            Try again
          </Button>
        </div>
      </div>
    );
  };

  if (error) {
    return handleRetry(error);
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Main content area */}
      <div className='flex-1 overflow-hidden'>
        {isNewConversation ? (
          // Show welcome screen for new conversations
          <WelcomeScreen onSubmit={sendMessage} />
        ) : (
          // Show chat messages
          <div className='h-full overflow-y-auto scroll-smooth px-4 py-6'>
            <div className='mx-auto max-w-3xl space-y-6'>
              {messages.map((message, _index) => (
                <MessageBubble
                  key={message.id}
                  id={message.id}
                  role={message.role as 'user' | 'assistant' | 'system'}
                  content={message.content}
                  isStreaming={isLoading && _index === messages.length - 1}
                  isLoading={isLoading}
                  isEdited={(message as any).isEdited}
                  onCopy={handleCopy}
                  onThumbsUp={handleThumbsUp}
                  onThumbsDown={handleThumbsDown}
                  onRegenerate={handleRegenerate}
                  onShare={handleShare}
                  onDownload={handleDownload}
                  onEdit={
                    message.role === 'user' ? handleEditMessage : undefined
                  }
                />
              ))}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} className='h-1' />
            </div>
          </div>
        )}
      </div>

      {/* Input area - always visible */}
      {!isNewConversation && (
        <div className='bg-[#212121] p-4'>
          <InputArea
            onSubmit={sendMessage}
            disabled={isLoading}
            isLoading={isLoading}
            placeholder={
              isLoading ? 'Google AI is thinking...' : 'Message Google AI...'
            }
          />
        </div>
      )}
    </div>
  );
}
