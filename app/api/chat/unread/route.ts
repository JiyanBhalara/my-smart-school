import { NextResponse } from 'next/server';
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
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get conversations where user is participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { teacherId: currentUser.id },
          { studentId: currentUser.id }
        ]
      },
      include: {
        messages: {
          where: {
            senderId: { not: currentUser.id }, // Messages not sent by current user
            isRead: false // Unread messages
          },
          select: {
            id: true,
            senderId: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        teacher: {
          select: { id: true, name: true, image: true }
        },
        student: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // Build response with unread counts and user info
    const unreadData: {
      totalUnread: number;
      conversationsWithUnread: Array<{
        conversationId: string;
        unreadCount: number;
        otherUser: { id: string; name: string | null; image: string | null };
        lastMessageAt: Date | undefined;
      }>;
      usersWithUnread: Set<string>;
    } = {
      totalUnread: 0,
      conversationsWithUnread: [],
      usersWithUnread: new Set(),
    };

    conversations.forEach(conv => {
      const unreadCount = conv.messages.length;
      
      if (unreadCount > 0) {
        unreadData.totalUnread += unreadCount;
        
        // Determine the other participant
        const otherUser = currentUser.id === conv.teacherId ? conv.student : conv.teacher;
        
        unreadData.conversationsWithUnread.push({
          conversationId: conv.id,
          unreadCount,
          otherUser,
          lastMessageAt: conv.messages[0]?.createdAt
        });
        
        unreadData.usersWithUnread.add(otherUser.id);
      }
    });

    return NextResponse.json({
      totalUnread: unreadData.totalUnread,
      conversationsWithUnread: unreadData.conversationsWithUnread,
      usersWithUnread: Array.from(unreadData.usersWithUnread)
    });

  } catch (error) {
    console.error('Error fetching unread messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
