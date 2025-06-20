/**
 * Chat API Route - Vercel AI SDK 4.0+ with Google Generative AI Integration
 *
 * This API route handles streaming chat requests using the latest Vercel AI SDK patterns:
 * - Uses streamText with Google Generative AI provider for reliable inference
 * - Implements proper error handling and streaming
 * - Includes authentication with Clerk
 * - Provides comprehensive validation and rate limiting
 * - Supports conversation context and tool usage
 * - Follows 2025 best practices for AI SDK integration
 *
 * Endpoints:
 * - POST /api/chat - Send messages and receive streaming AI responses
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { auth } from '@clerk/nextjs/server';
import { streamText } from 'ai';
import { Types } from 'mongoose';
import { z } from 'zod';

import { GOOGLE_MODELS, googleErrorHandling } from '@/lib/ai/google-config';
import { connectToDatabase } from '@/lib/db/connection';
import ConversationModel from '@/lib/db/models/conversation.model';
import MessageModel from '@/lib/db/models/message.model';
import UserModel from '@/lib/db/models/user.model';

// Constants
const MAX_DURATION = 30; // seconds
const MAX_MESSAGE_LENGTH = 10000; // Increased for Google Generative AI
const MAX_MESSAGES_PER_REQUEST = 50;
const RATE_LIMIT_REQUESTS_PER_MINUTE = 30;

// Request validation schema
const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
        id: z.string().optional(),
      })
    )
    .min(1)
    .max(MAX_MESSAGES_PER_REQUEST),
  model: z.string().optional(),
  conversationId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  stream: z.boolean().optional().default(true),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Rate limiting helper (simplified implementation)
 * In production, use Redis or a proper rate limiting service
 */
const userRequestCounts = new Map<
  string,
  { count: number; resetTime: number }
>();

async function checkRateLimit(userId: string): Promise<boolean> {
  const now = Date.now();
  const resetInterval = 60 * 1000; // 1 minute

  const userLimits = userRequestCounts.get(userId);

  if (!userLimits || now > userLimits.resetTime) {
    // Reset or initialize rate limit
    userRequestCounts.set(userId, {
      count: 1,
      resetTime: now + resetInterval,
    });
    return false;
  }

  if (userLimits.count >= RATE_LIMIT_REQUESTS_PER_MINUTE) {
    return true; // Rate limited
  }

  userLimits.count++;
  return false;
}

/**
 * Validate Google Generative AI model selection
 */
function validateGoogleModel(model: string): string {
  const googleModel = Object.values(GOOGLE_MODELS).find((m) => m.id === model);

  if (googleModel) {
    return model;
  }

  // Default to fastest model if invalid model provided
  return GOOGLE_MODELS.GEMINI_1_5_FLASH_8B.id;
}

/**
 * Generate conversation ID for new conversations using MongoDB ObjectId
 */
function generateConversationId(): string {
  return new Types.ObjectId().toString();
}

/**
 * Create a new conversation record immediately (before streaming)
 * This prevents race conditions when frontend redirects
 */
async function createNewConversation({
  conversationId,
  userId,
  userMessage,
  model,
}: {
  conversationId: string;
  userId: string;
  userMessage: any;
  model: string;
}) {
  // Ensure database connection
  await connectToDatabase();

  // Resolve MongoDB ObjectId for the Clerk user (required by schema)
  const existingUser = await UserModel.findOne({ clerkId: userId }).select(
    '_id'
  );
  let mongoUserId: Types.ObjectId;

  if (existingUser) {
    mongoUserId = existingUser._id as Types.ObjectId;
  } else {
    const newUser = await UserModel.create({
      clerkId: userId,
      email: 'unknown@example.com', // placeholder – can be updated later
    });
    mongoUserId = newUser._id as Types.ObjectId;
  }

  // Create new conversation
  const conversation = new ConversationModel({
    _id: new Types.ObjectId(conversationId),
    clerkId: userId,
    userId: mongoUserId,
    title:
      userMessage.content.slice(0, 50) +
      (userMessage.content.length > 50 ? '...' : ''),
    messageCount: 1, // Just user message initially
    lastMessageAt: new Date(),
    totalTokens: 0, // Will be updated later
    settings: {
      aiModel: model,
    },
    status: 'active',
  });

  await conversation.save();

  // Save user message immediately
  const userMessageDoc = new MessageModel({
    conversationId: new Types.ObjectId(conversationId),
    userId: mongoUserId,
    clerkId: userId,
    role: 'user',
    content: userMessage.content,
    status: 'completed',
  });

  await userMessageDoc.save();

  console.log(`Created conversation and saved user message: ${conversationId}`);
}

/**
 * Save assistant message and update conversation (after streaming)
 */
async function saveMessagesAndUpdateConversation({
  conversationId,
  userId,
  userMessage,
  assistantResponse,
  model,
  usage,
  isNewConversation,
}: {
  conversationId: string;
  userId: string;
  userMessage: any;
  assistantResponse: string;
  model: string;
  usage: any;
  isNewConversation: boolean;
}) {
  // Ensure database connection
  await connectToDatabase();

  // Resolve MongoDB ObjectId for the Clerk user (required by schema)
  const existingUser = await UserModel.findOne({ clerkId: userId }).select(
    '_id'
  );
  let mongoUserId: Types.ObjectId;

  if (existingUser) {
    mongoUserId = existingUser._id as Types.ObjectId;
  } else {
    const newUser = await UserModel.create({
      clerkId: userId,
      email: 'unknown@example.com', // placeholder – can be updated later
    });
    mongoUserId = newUser._id as Types.ObjectId;
  }

  // Update conversation with final stats
  let conversation;

  if (isNewConversation) {
    // Update the existing conversation (created earlier) with final message count and tokens
    conversation = await ConversationModel.findByIdAndUpdate(
      new Types.ObjectId(conversationId),
      {
        messageCount: 2, // User message + assistant response
        lastMessageAt: new Date(),
        totalTokens: usage?.totalTokens || 0,
      },
      { new: true }
    );

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found for update`);
    }

    console.log(`Updated new conversation with final stats: ${conversationId}`);
  } else {
    // Update existing conversation
    conversation = await ConversationModel.incrementMessageCount(
      conversationId,
      usage?.totalTokens || 0
    );

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    console.log(`Updated existing conversation: ${conversationId}`);
  }

  // For existing conversations, save the user message (new conversations already have it)
  if (!isNewConversation) {
    const userMessageDoc = new MessageModel({
      conversationId: new Types.ObjectId(conversationId),
      userId: mongoUserId,
      clerkId: userId,
      role: 'user',
      content: userMessage.content,
      status: 'completed',
    });

    await userMessageDoc.save();
  }

  // Save assistant message (always needed)
  const assistantMessageDoc = new MessageModel({
    conversationId: new Types.ObjectId(conversationId),
    userId: mongoUserId,
    clerkId: userId,
    role: 'assistant',
    content: assistantResponse,
    status: 'completed',
    metadata: {
      model,
      usage,
    },
  });

  await assistantMessageDoc.save();

  console.log(`Saved assistant message for conversation: ${conversationId}`);
}

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-Conversation-ID',
    },
  });
}

/**
 * Main chat API handler
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('Chat API request received');

    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      console.log('Unauthorized request - no user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limiting
    const isRateLimited = await checkRateLimit(userId);
    if (isRateLimited) {
      console.log(`Rate limited user: ${userId}`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'Too many requests. Please wait before sending another message.',
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    let body: ChatRequest;
    try {
      const rawBody = await request.json();
      body = ChatRequestSchema.parse(rawBody);
    } catch (error) {
      console.error('Request validation failed:', error);
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request body validation failed',
          details: error instanceof z.ZodError ? error.errors : undefined,
        },
        { status: 400 }
      );
    }

    const {
      messages,
      model = GOOGLE_MODELS.GEMINI_1_5_FLASH.id,
      conversationId,
      temperature = 0.7,
      maxTokens = 2048,
    } = body;

    console.log('Processing chat request:', {
      userId,
      model,
      conversationId,
      messageCount: messages.length,
    });

    // Validate and normalize the model
    const selectedModel = validateGoogleModel(model);
    const modelConfig = Object.values(GOOGLE_MODELS).find(
      (m) => m.id === selectedModel
    );

    // Determine if this is a new conversation
    const isNewConversation = !conversationId;
    const finalConversationId = conversationId || generateConversationId();

    // For new conversations, create the conversation record immediately
    // This prevents race conditions when the frontend redirects before streaming completes
    if (isNewConversation) {
      try {
        await createNewConversation({
          conversationId: finalConversationId,
          userId,
          userMessage: messages[messages.length - 1],
          model: selectedModel,
        });
        console.log(`Pre-created conversation: ${finalConversationId}`);
      } catch (dbError) {
        console.error('Failed to create conversation:', dbError);
        return NextResponse.json(
          {
            error: 'Database Error',
            message: 'Failed to create conversation',
          },
          { status: 500 }
        );
      }
    }

    // Prepare messages with system message
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant powered by Google Generative AI. You provide clear, accurate, and helpful responses while being conversational and engaging. You can process complex requests, analyze images, and work with various file formats efficiently.`,
    };

    const processedMessages = [systemMessage, ...messages];

    // Create Google Generative AI client
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    });

    // Create streaming response using Vercel AI SDK
    const result = await streamText({
      model: google(selectedModel),
      messages: processedMessages,
      temperature,
      maxTokens,
      // Add streaming configuration
      onFinish: async (completion) => {
        const responseTime = Date.now() - startTime;
        console.log(`Chat completion finished in ${responseTime}ms:`, {
          conversationId: finalConversationId,
          model: selectedModel,
          userId,
          messageCount: processedMessages.length,
          finishReason: completion.finishReason,
          usage: completion.usage,
        });

        try {
          // Save messages and update conversation (conversation already exists for new ones)
          await saveMessagesAndUpdateConversation({
            conversationId: finalConversationId,
            userId,
            userMessage: messages[messages.length - 1], // Last user message
            assistantResponse: completion.text,
            model: selectedModel,
            usage: completion.usage,
            isNewConversation,
          });
        } catch (dbError) {
          console.error('Failed to save messages to database:', dbError);
          // Don't fail the API response if database save fails
        }
      },
      // Add provider-specific options for Google Generative AI
      ...((modelConfig as any)?.special === 'thinking' && {
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 2048,
            },
          },
        },
      }),
    });

    // Add conversation ID to response headers - using DataStreamResponse for useChat compatibility
    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-ID', finalConversationId);

    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Conversation-ID'
    );

    return response;
  } catch (error: any) {
    console.error('Chat API error:', error);

    // Handle specific Google Generative AI errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        {
          error: 'Authentication Error',
          message: 'Invalid or missing Google Generative AI API key',
        },
        { status: 401 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return NextResponse.json(
        {
          error: 'Rate Limit Error',
          message:
            'Google Generative AI rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('content')) {
      return NextResponse.json(
        {
          error: 'Content Error',
          message:
            'Content was filtered by Google Generative AI safety systems.',
        },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred while processing your request.',
      },
      { status: 500 }
    );
  }
}

/**
 * Use Node.js runtime for MongoDB/Mongoose compatibility
 * Edge Runtime doesn't support Mongoose operations properly
 */
// export const runtime = 'edge'; // Commented out - using Node.js runtime for MongoDB
export const maxDuration = 30;
