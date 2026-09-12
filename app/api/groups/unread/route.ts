// File: app/api/groups/unread/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma'; // Fixed import - remove destructuring

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

    // One aggregate query for every group at once, instead of a count() per
    // membership. Each group has its own lastReadAt cutoff, which groupBy
    // cannot express, so the cutoff is joined in from group_members and the
    // counting happens in the database.
    const counts = await prisma.$queryRaw<
      { groupId: string; unreadCount: number }[]
    >`
      SELECT gm."groupId"       AS "groupId",
             COUNT(*)::int      AS "unreadCount"
      FROM "group_messages" gm
      JOIN "group_members" mem
        ON mem."groupId" = gm."groupId"
       AND mem."userId"  = ${user.id}
      WHERE gm."senderId" <> ${user.id}
        AND gm."createdAt" > COALESCE(mem."lastReadAt", TIMESTAMP 'epoch')
      GROUP BY gm."groupId"
    `;

    const countByGroup = new Map(counts.map((r) => [r.groupId, r.unreadCount]));

    let totalUnread = 0;
    const groupsWithUnread = [];

    for (const membership of userGroups) {
      const unreadCount = countByGroup.get(membership.groupId) ?? 0;

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
