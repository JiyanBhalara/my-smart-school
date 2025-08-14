// File: app/api/groups/[groupId]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma'; // Fixed import - remove destructuring

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> } // Fixed: params should be Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params; // Await params

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's lastReadAt timestamp for this group
    await prisma.groupMember.update({
      where: {
        groupId_userId: { // Fixed: single underscore
          groupId: groupId,
          userId: user.id
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking group messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
