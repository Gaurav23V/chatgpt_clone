/**
 * Conversation Messages API Route
 *
 * GET /api/conversations/[id]/messages - Fetch messages for a conversation
 * PUT /api/conversations/[id]/messages - Update messages for a conversation
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { Types } from 'mongoose';

import { connectToDatabase } from '@/lib/db/connection';
import ConversationModel from '@/lib/db/models/conversation.model';
import MessageModel from '@/lib/db/models/message.model';
import UserModel from '@/lib/db/models/user.model';

/**
 * GET /api/conversations/[id]/messages
 * Fetch all messages for a specific conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database connection first
    await connectToDatabase();

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;

    console.log(
      `Fetching messages for conversation: ${conversationId} by user: ${userId}`
    );

    // Validate conversation ID format
    if (!Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const conversation = await ConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      clerkId: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch messages for this conversation, sorted chronologically
    const messages = await MessageModel.find({
      conversationId: new Types.ObjectId(conversationId),
      clerkId: userId,
      deletedAt: { $exists: false }, // Exclude soft-deleted messages
    })
      .sort({ createdAt: 1 }) // Oldest first
      .select('role content createdAt aiMetadata status')
      .lean();

    // Transform messages to match frontend format
    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      metadata: msg.aiMetadata,
    }));

    console.log(
      `Found ${formattedMessages.length} messages for conversation: ${conversationId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        conversationId,
        messages: formattedMessages,
        conversation: {
          id: conversation._id.toString(),
          title: conversation.title,
          messageCount: conversation.messageCount,
          lastMessageAt: conversation.lastMessageAt,
          model: conversation.settings?.aiModel,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/conversations/[id]/messages
 * Update all messages for a specific conversation (used for message editing)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure database connection first
    await connectToDatabase();

    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { messages } = body;

    console.log(
      `Updating messages for conversation: ${conversationId} by user: ${userId}`
    );

    // Validate conversation ID format
    if (!Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages array' },
        { status: 400 }
      );
    }

    // Verify user has access to this conversation
    const conversation = await ConversationModel.findOne({
      _id: new Types.ObjectId(conversationId),
      clerkId: userId,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Get user's MongoDB ID
    const user = await UserModel.findOne({ clerkId: userId }).select('_id');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Start a MongoDB session for transactional operations
    const session = await ConversationModel.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete all existing messages for this conversation
        await MessageModel.deleteMany({
          conversationId: new Types.ObjectId(conversationId),
          clerkId: userId,
        }).session(session);

        // Import utility function for content conversion
        const { convertMultimodalContentToString } = await import(
          '@/lib/utils'
        );

        // Create new messages
        const newMessages = messages.map((msg: any, index: number) => ({
          conversationId: new Types.ObjectId(conversationId),
          userId: user._id,
          clerkId: userId,
          role: msg.role,
          content: convertMultimodalContentToString(msg.content),
          status: 'completed',
          createdAt: msg.createdAt || new Date(Date.now() + index), // Ensure ordering
          metadata: {
            ...(msg.isEdited && { isEdited: true }),
          },
        }));

        await MessageModel.insertMany(newMessages, { session });

        // Update conversation metadata
        await ConversationModel.findByIdAndUpdate(
          conversationId,
          {
            messageCount: messages.length,
            lastMessageAt: new Date(),
          },
          { session }
        );
      });

      console.log(
        `Successfully updated ${messages.length} messages for conversation: ${conversationId}`
      );

      return NextResponse.json({
        success: true,
        data: {
          conversationId,
          messageCount: messages.length,
        },
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Error updating conversation messages:', error);

    return NextResponse.json(
      {
        error: 'Failed to update messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Use Node.js runtime for MongoDB/Mongoose compatibility
 */
// export const runtime = 'edge'; // Commented out - using Node.js runtime for MongoDB
