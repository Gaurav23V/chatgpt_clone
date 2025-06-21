/**
 * User Conversations API Route
 *
 * GET /api/conversations - Returns a paginated list of conversations that belong
 * to the currently authenticated Clerk user. The conversations are ordered by
 * recent activity (lastMessageAt desc).
 *
 * Query parameters:
 *  - limit  (optional)  Maximum number of conversations to return (default 20, max 100)
 *  - cursor (optional)  ISO date string to paginate "before" a given lastMessageAt
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getUserConversations } from '@/lib/db/services/conversation.service';

// GET /api/conversations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const cursor = searchParams.get('cursor') ?? undefined;

    let limit = 20;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed)) {
        limit = Math.min(Math.max(parsed, 1), 100); // clamp 1-100
      }
    }

    const serviceResult = await getUserConversations(userId, limit, cursor);

    if (!serviceResult.success) {
      return NextResponse.json(
        {
          error: serviceResult.error?.code || 'UNKNOWN_ERROR',
          message: serviceResult.error?.message || 'An error occurred',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: serviceResult.data });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// We use Node.js runtime as we rely on Mongoose.
// export const runtime = 'edge';
