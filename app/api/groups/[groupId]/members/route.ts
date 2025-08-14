// File: app/api/groups/[groupId]/members/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    // Ensure membership
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

    const members = await prisma.groupMember.findMany({
      where: { groupId: groupId },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true, email: true }
        }
      },
      orderBy: [
        { role: 'desc' }, // ADMINs first
        { joinedAt: 'asc' }
      ]
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
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

    // Only admins can add members
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: user.id
        }
      }
    });
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    const { userIds } = await request.json();
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
    }

    // Check if users exist
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true }
    });
    
    if (users.length !== userIds.length) {
      return NextResponse.json({ error: 'Some users not found' }, { status: 400 });
    }

    // Check for existing memberships
    const existingMembers = await prisma.groupMember.findMany({
      where: {
        groupId: groupId,
        userId: { in: userIds }
      }
    });

    const alreadyMemberIds = existingMembers.map(m => m.userId);
    const newUserIds = userIds.filter(id => !alreadyMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({ error: 'All users are already members' }, { status: 400 });
    }

    // Add new members
    const newMembers = await prisma.groupMember.createMany({
      data: newUserIds.map(userId => ({
        groupId: groupId,
        userId,
        role: 'MEMBER'
      }))
    });

    // Update group timestamp
    await prisma.group.update({
      where: { id: groupId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ 
      success: true, 
      addedCount: newMembers.count,
      alreadyMembers: alreadyMemberIds.length 
    });
  } catch (error) {
    console.error('Error adding group members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    // Only admins can change member roles
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: user.id
        }
      }
    });
    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can change member roles' }, { status: 403 });
    }

    const { userId, role } = await request.json();
    if (!userId || !role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Valid userId and role required' }, { status: 400 });
    }

    // Cannot change creator's role or your own role
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group?.createdById === userId) {
      return NextResponse.json({ error: 'Cannot change group creator role' }, { status: 400 });
    }
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const updatedMember = await prisma.groupMember.update({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId
        }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true }
        }
      }
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating member role:', error);
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

    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');
    
    if (!userIdToRemove) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 });
    }

    // Check permissions
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: user.id
        }
      }
    });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    
    // Users can remove themselves, or admins can remove others (but not the creator)
    const canRemove = userIdToRemove === user.id || 
                     (membership?.role === 'ADMIN' && userIdToRemove !== group?.createdById);
    
    if (!canRemove) {
      return NextResponse.json({ error: 'Cannot remove this member' }, { status: 403 });
    }

    // Cannot remove group creator
    if (group?.createdById === userIdToRemove) {
      return NextResponse.json({ error: 'Cannot remove group creator' }, { status: 400 });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: groupId,
          userId: userIdToRemove
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
