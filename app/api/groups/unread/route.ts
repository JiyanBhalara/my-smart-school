// File: app/api/groups/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all groups the user is a member of
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: user.id },
      select: { 
        groupId: true,
        lastReadAt: true,
        group: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    });

    let totalUnread = 0;
    const groupsWithUnread = [];

    for (const membership of userGroups) {
      const lastReadAt = membership.lastReadAt || new Date(0); // If never read, use epoch
      
      // Count messages in this group that came after user's last read
      const unreadCount = await prisma.groupMessage.count({
        where: {
          groupId: membership.groupId,
          createdAt: {
            gt: lastReadAt
          },
          senderId: {
            not: user.id // Don't count own messages as unread
          }
        }
      });

      if (unreadCount > 0) {
        totalUnread += unreadCount;
        groupsWithUnread.push({
          groupId: membership.groupId,
          groupName: membership.group.name,
          groupImage: membership.group.imageUrl,
          unreadCount
        });
      }
    }

    return NextResponse.json({
      totalUnread,
      groupsWithUnread,
      groupIds: groupsWithUnread.map(g => g.groupId)
    });

  } catch (error) {
    console.error('Error fetching group unread data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
