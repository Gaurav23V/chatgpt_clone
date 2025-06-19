/**
 * Chat API Route
 *
 * This API route handles chat requests and provides responses using AI models.
 * It demonstrates the use of database utilities for:
 * - Performance monitoring
 * - Error handling
 * - Safe database operations
 * - Query sanitization
 * - Connection management
 *
 * Updated to work with Vercel AI SDK streaming responses and handle new conversation creation.
 *
 * Endpoints:
 * - POST /api/chat - Send a message and get AI response (streaming)
 * - GET /api/chat?chatId=xxx - Get chat history (optional)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

import { CHAT_CONFIG, DEFAULT_MODEL } from '@/lib/ai/config';
import { withTiming } from '@/lib/db/middleware';
// TODO: Import auth from Clerk when authentication is enabled
// import { auth } from '@clerk/nextjs/server';
import {
  MongoErrorType,
  parseMongoError,
  safeDbOperation,
  sanitizeQuery,
  withPerformanceMonitoring,
  withRetry,
} from '@/lib/db/utils';

export async function POST(request: NextRequest) {
  try {
    // TODO: Check authentication when Clerk is enabled
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    const _userId = 'mock-user-id'; // Temporary for development

    // Parse request body
    const body = await request.json();
    const { messages, conversationId, model = DEFAULT_MODEL } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // TODO: Implement rate limiting
    // const isRateLimited = await checkRateLimit(userId);
    // if (isRateLimited) {
    //   return NextResponse.json(
    //     { error: 'Rate limit exceeded' },
    //     { status: 429 }
    //   );
    // }

    // TODO: Validate user permissions for model
    // const userRole = await getUserRole(userId);
    // const allowedModels = ROLE_PERMISSIONS[userRole].models;
    // if (!allowedModels.includes(model)) {
    //   return NextResponse.json(
    //     { error: 'Model not available for your plan' },
    //     { status: 403 }
    //   );
    // }

    // Generate conversation ID for new conversations
    const isNewConversation = !conversationId;
    const finalConversationId =
      conversationId ||
      `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Demonstrate safe database operations with utilities
    // Example: Get or create chat conversation with error handling
    const chatOperation = await safeDbOperation(async () => {
      // Simulate database operation with performance monitoring
      return await withPerformanceMonitoring(
        async () => {
          // In a real implementation, this would be:
          // if (conversationId) {
          //   return await Chat.findOne(sanitizeQuery({ _id: conversationId, userId }));
          // } else {
          //   const firstMessage = messages[0]?.content || 'New Chat';
          //   return await Chat.create({
          //     _id: finalConversationId,
          //     userId,
          //     clerkId: _userId,
          //     title: firstMessage.substring(0, 50),
          //     settings: { aiModel: model }
          //   });
          // }

          // Mock delay to simulate database operation
          await new Promise((resolve) => setTimeout(resolve, 100));

          const firstMessage = messages[0]?.content || 'New Chat';
          return {
            id: finalConversationId,
            userId: _userId,
            title: firstMessage.substring(0, 50),
            isNew: isNewConversation,
          };
        },
        { query: 'findOrCreateChat', collection: 'chats' }
      );
    }, 'Get or create chat conversation');

    if (!chatOperation.success) {
      console.error('Chat operation failed:', chatOperation.error);
      return NextResponse.json(
        {
          error: chatOperation.error.userMessage,
          code: chatOperation.error.type,
        },
        {
          status:
            chatOperation.error.type === MongoErrorType.CONNECTION_ERROR
              ? 503
              : 500,
        }
      );
    }

    const chat = chatOperation.data;

    // Create streaming response using Vercel AI SDK
    const result = await streamText({
      model: openai(model),
      messages: [
        {
          role: 'system',
          content: CHAT_CONFIG.SYSTEM_MESSAGE,
        },
        ...messages,
      ],
      ...CHAT_CONFIG.MODEL_PARAMS.default,
      onFinish: async (result) => {
        // TODO: Save conversation and messages to database
        console.log('Conversation finished:', {
          conversationId: chat.id,
          messageCount: messages.length + 1,
          tokens: result.usage?.totalTokens,
          finishReason: result.finishReason,
          isNewConversation: chat.isNew,
        });

        // In a real implementation, this would save the messages:
        // await saveMessages([
        //   {
        //     conversationId: chat.id,
        //     role: 'user',
        //     content: messages[messages.length - 1].content,
        //     userId: _userId,
        //   },
        //   {
        //     conversationId: chat.id,
        //     role: 'assistant',
        //     content: result.text,
        //     userId: _userId,
        //     aiMetadata: {
        //       model,
        //       temperature: CHAT_CONFIG.MODEL_PARAMS.default.temperature,
        //       maxTokens: CHAT_CONFIG.MODEL_PARAMS.default.maxTokens,
        //       tokenCount: result.usage?.totalTokens || 0,
        //       finishReason: result.finishReason || 'stop',
        //       responseTime: Date.now() - startTime,
        //     },
        //   },
        // ]);
      },
    });

    // Convert to response with custom headers
    const response = result.toDataStreamResponse();

    // Add conversation ID to headers for frontend to handle redirect
    if (chat.isNew) {
      response.headers.set('X-Conversation-ID', chat.id);
      response.headers.set('X-Is-New-Conversation', 'true');
    }

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Check authentication when Clerk is enabled
    // const { userId } = auth();
    // if (!userId) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
    const _userId = 'mock-user-id'; // Temporary for development

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    // Demonstrate pagination utilities
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder =
      (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Demonstrate safe database operations with pagination
    const chatResult = await safeDbOperation(async () => {
      return await withTiming(async () => {
        // In real implementation, this would use our pagination helpers:
        // const filter = sanitizeQuery({ chatId, userId });
        // const options = { page, limit, sortBy, sortOrder };
        // return await executePaginatedQuery(Message, filter, options,
        //   projectFields(['content', 'role', 'timestamp', 'metadata']));

        // Mock paginated response
        await new Promise((resolve) => setTimeout(resolve, 50));

        const mockMessages = Array.from(
          { length: Math.min(limit, 5) },
          (_, i) => ({
            id: `msg_${i + 1}`,
            content: `Mock message ${i + 1} for chat ${chatId}`,
            role: i % 2 === 0 ? 'user' : 'assistant',
            timestamp: new Date(Date.now() - i * 1000000).toISOString(),
          })
        );

        return {
          data: mockMessages,
          pagination: {
            page,
            limit,
            total: 25, // Mock total
            totalPages: Math.ceil(25 / limit),
            hasNextPage: page < Math.ceil(25 / limit),
            hasPrevPage: page > 1,
          },
        };
      }, 'Get paginated chat messages');
    }, 'Get chat messages with pagination');

    if (!chatResult.success) {
      const mongoError = chatResult.error;
      return NextResponse.json(
        {
          error: mongoError.userMessage,
          code: mongoError.type,
        },
        {
          status:
            mongoError.type === MongoErrorType.CONNECTION_ERROR ? 503 : 500,
        }
      );
    }

    const { result: paginatedResult, duration } = chatResult.data;

    const response = {
      id: chatId,
      title: `Chat ${chatId}`,
      messages: paginatedResult.data,
      pagination: paginatedResult.pagination,
      metadata: {
        queryDuration: duration,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, {
      headers: {
        'X-Query-Duration': String(duration),
        'X-Total-Messages': String(paginatedResult.pagination.total),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const mongoError = parseMongoError(
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      {
        error: mongoError.userMessage,
        code: mongoError.type,
      },
      { status: 500 }
    );
  }
}

// TODO: Add streaming support
// export async function POST(request: NextRequest) {
//   // Implementation for streaming responses
//   // Use ReadableStream for real-time AI responses
// }
