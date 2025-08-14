// File: app/api/groups/[groupId]/pin/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can pin messages
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: params.groupId,
          userId: user.id
        }
      }
    });
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can pin messages' }, { status: 403 });
    }

    const { messageId } = await request.json();
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Verify the message exists and belongs to this group
    const message = await prisma.groupMessage.findFirst({
      where: {
        id: messageId,
        groupId: params.groupId
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found in this group' }, { status: 404 });
    }

    // Pin the message (this will automatically unpin any previously pinned message)
    const updatedGroup = await prisma.group.update({
      where: { id: params.groupId },
      data: { pinnedMessageId: messageId },
      include: {
        pinnedMessage: {
          include: {
            sender: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      pinnedMessage: updatedGroup.pinnedMessage 
    });

  } catch (error) {
    console.error('Error pinning message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can unpin messages
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: params.groupId,
          userId: user.id
        }
      }
    });
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can unpin messages' }, { status: 403 });
    }

    // Unpin the current pinned message
    await prisma.group.update({
      where: { id: params.groupId },
      data: { pinnedMessageId: null }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error unpinning message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
          groupId: params.groupId,
          userId: user.id
        }
      }
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the pinned message
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      select: {
        pinnedMessage: {
          include: {
            sender: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      pinnedMessage: group?.pinnedMessage || null 
    });

  } catch (error) {
    console.error('Error fetching pinned message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
