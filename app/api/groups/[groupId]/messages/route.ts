// File: app/api/groups/[groupId]/messages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: user.id
        }
      }
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query with cursor pagination
    const queryOptions: {
      where: { groupId: string };
      include: {
        sender: {
          select: { id: true; name: true; image: true; role: true };
        };
      };
      orderBy: { createdAt: 'desc' };
      take: number;
      cursor?: { id: string };
      skip?: number;
    } = {
      where: { groupId: groupId },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1 // Take one extra to determine if there are more
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor itself
    }

    const messages = await prisma.groupMessage.findMany(queryOptions);

    // Check if there are more messages
    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    const nextCursor = hasMore ? messages[messages.length - 1]?.id : null;

    return NextResponse.json({ 
      messages: messages.reverse(), // Reverse to show oldest first
      nextCursor,
      hasMore
    });

  } catch (error) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: user.id
        }
      }
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { content, fileUrl, fileName, fileType, fileSize } = await request.json();

    // Validate that either content or file is provided
    if (!content?.trim() && !fileUrl) {
      return NextResponse.json({ error: 'Message content or file is required' }, { status: 400 });
    }

    // Create the message
    const message = await prisma.groupMessage.create({
      data: {
        groupId: groupId,
        senderId: user.id,
        content: content?.trim() || null,
        fileUrl,
        fileName,
        fileType,
        fileSize
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        }
      }
    });

    // Update group's updatedAt timestamp to show recent activity
    await prisma.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error sending group message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: user.id
        }
      }
    });
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can clear chat history' }, { status: 403 });
    }

    // Delete all messages in the group
    await prisma.groupMessage.deleteMany({
      where: { groupId: groupId }
    });

    // Also clear pinned message if any
    await prisma.group.update({
      where: { id: groupId },
      data: { pinnedMessageId: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error clearing group messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
