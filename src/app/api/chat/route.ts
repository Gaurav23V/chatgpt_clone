/**
 * Chat API Route - Vercel AI SDK 4.0+ with Groq Integration
 *
 * This API route handles streaming chat requests using the latest Vercel AI SDK patterns:
 * - Uses streamText with Groq provider for ultra-fast inference
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

import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { GROQ_MODELS, groqErrorHandling } from '@/lib/ai/groq-config';
import ConversationModel from '@/lib/db/models/conversation.model';
import MessageModel from '@/lib/db/models/message.model';
import { connectToDatabase } from '@/lib/db/connection';
import { Types } from 'mongoose';
import UserModel from '@/lib/db/models/user.model';

// Constants
const MAX_DURATION = 30; // seconds
const MAX_MESSAGE_LENGTH = 8000;
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
const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

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
 * Validate Groq model selection
 */
function validateGroqModel(model: string): string {
  const groqModel = Object.values(GROQ_MODELS).find(
    (m) => m.id === model
  );
  
  if (groqModel) {
    return model;
  }
  
  // Default to fastest model if invalid model provided
  return GROQ_MODELS.LLAMA_3_1_8B.id;
}

/**
 * Generate conversation ID for new conversations using MongoDB ObjectId
 */
function generateConversationId(): string {
  return new Types.ObjectId().toString();
}

/**
 * Save conversation and messages to database
 */
async function saveConversationAndMessages({
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
  // If the user document does not exist yet, create a lightweight record.
  const existingUser = await UserModel.findOne({ clerkId: userId }).select('_id');
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

  // Create or find conversation
  let conversation;
  
  if (isNewConversation) {
    // Create new conversation
    conversation = new ConversationModel({
      _id: new Types.ObjectId(conversationId),
      clerkId: userId,
      userId: mongoUserId,
      title: userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : ''),
      messageCount: 2, // User message + assistant response
      lastMessageAt: new Date(),
      totalTokens: usage?.totalTokens || 0,
      settings: {
        aiModel: model,
      },
      status: 'active',
    });
    
    await conversation.save();
    console.log(`Created new conversation: ${conversationId}`);
  } else {
    // Update existing conversation
    conversation = await ConversationModel.incrementMessageCount(
      conversationId,
      usage?.totalTokens || 0
    );
    
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    console.log(`Updated conversation: ${conversationId}`);
  }

  // Save user message
  const userMessageDoc = new MessageModel({
    conversationId: new Types.ObjectId(conversationId),
    userId: mongoUserId,
    clerkId: userId,
    role: 'user',
    content: userMessage.content,
    status: 'completed',
  });
  
  await userMessageDoc.save();

  // Save assistant message
  const assistantMessageDoc = new MessageModel({
    conversationId: new Types.ObjectId(conversationId),
    userId: mongoUserId,
    clerkId: userId,
    role: 'assistant',
    content: assistantResponse,
    status: 'completed',
    aiMetadata: {
      model,
      temperature: 0.7, // Should come from request
      maxTokens: 2048, // Should come from request
      tokenCount: usage?.completionTokens || 0,
      finishReason: 'stop',
      responseTime: 0, // Could be calculated
    },
  });
  
  await assistantMessageDoc.save();
  
  console.log(`Saved messages for conversation: ${conversationId}`);
  
  return { conversation, userMessage: userMessageDoc, assistantMessage: assistantMessageDoc };
}

/**
 * POST /api/chat - Handle streaming chat requests
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      console.warn('Unauthorized chat request attempt');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log(`Chat request from user: ${userId}`);

    // Validate Groq API key
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Service configuration error',
          message: 'AI service is not properly configured'
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    const validationResult = ChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn('Invalid request format:', validationResult.error.issues);
      return NextResponse.json(
        {
          error: 'Invalid request format',
          details: validationResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { messages, model, conversationId, temperature = 0.7, maxTokens = 2048 } =
      validationResult.data;

    // Also check for conversation ID in headers (sent by frontend)
    const headerConversationId = request.headers.get('X-Conversation-ID');
    const finalConversationIdFromRequest = conversationId || headerConversationId;

    // Rate limiting check
    const isRateLimited = await checkRateLimit(userId);
    if (isRateLimited) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Maximum ${RATE_LIMIT_REQUESTS_PER_MINUTE} requests per minute allowed`,
        },
        { status: 429 }
      );
    }

    // Validate and set model
    const selectedModel = validateGroqModel(model || GROQ_MODELS.LLAMA_3_1_8B.id);
    console.log(`Using model: ${selectedModel} for user: ${userId}`);

    // Generate conversation ID for new conversations
    const finalConversationId = finalConversationIdFromRequest || generateConversationId();
    const isNewConversation = !finalConversationIdFromRequest;

    // Initialize Groq client
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    // Add system message if this is the first message
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant powered by Groq's ultra-fast inference. You provide clear, accurate, and helpful responses while being conversational and engaging. You can process complex requests quickly and efficiently.

Key guidelines:
- Be helpful, accurate, and conversational
- Use markdown formatting for better readability
- Break down complex topics into digestible parts
- Ask clarifying questions when needed
- Admit when you don't know something`,
    };

    // Prepare messages with system message for new conversations
    const processedMessages = isNewConversation 
      ? [systemMessage, ...messages]
      : messages;

    console.log(`Processing ${processedMessages.length} messages for conversation: ${finalConversationId}`);

    // Create streaming response using Vercel AI SDK
    const result = await streamText({
      model: groq(selectedModel),
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
          // Save conversation and messages to database
          await saveConversationAndMessages({
            conversationId: finalConversationId,
            userId,
            userMessage: messages[messages.length - 1], // Last user message
            assistantResponse: completion.text,
            model: selectedModel,
            usage: completion.usage,
            isNewConversation,
          });
        } catch (dbError) {
          console.error('Failed to save to database:', dbError);
          // Don't fail the API response if database save fails
        }
      },
    });

    // Add conversation ID to response headers - using DataStreamResponse for useChat compatibility
    const response = result.toDataStreamResponse();
    response.headers.set('X-Conversation-ID', finalConversationId);
    
    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Conversation-ID');

    return response;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Chat API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      responseTime,
    });

    // Handle specific error types
    if (error instanceof Error) {
      // Groq API errors
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            message: 'Invalid API key configuration'
          },
          { status: 401 }
        );
      }
      
      // Rate limiting errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.'
          },
          { status: 429 }
        );
      }
      
      // Content filtering errors
      if (error.message.includes('content_filter')) {
        return NextResponse.json(
          { 
            error: 'Content not allowed',
            message: 'Your message was filtered due to content policy violations.'
          },
          { status: 400 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/chat - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Conversation-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Use Node.js runtime for MongoDB/Mongoose compatibility
 * Edge Runtime doesn't support Mongoose operations properly
 */
// export const runtime = 'edge'; // Commented out - using Node.js runtime for MongoDB
export const maxDuration = MAX_DURATION;
