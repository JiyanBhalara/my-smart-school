import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions'; // Adjust if needed
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { otherUserId, conversationId } = await request.json();

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // === CASE 1: Fetching by conversationId ===
    if (conversationId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { teacherId: currentUser.id },
            { studentId: currentUser.id }
          ]
        },
        include: {
          teacher: true,
          student: true
        }
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
      }

      return NextResponse.json({ conversation });
    }

    // === CASE 2: First time chat — create/fetch by otherUserId ===
    if (!otherUserId) {
      return NextResponse.json({ error: 'Either otherUserId or conversationId is required' }, { status: 400 });
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, role: true }
    });

    if (!otherUser) {
      return NextResponse.json({ error: 'Other user not found' }, { status: 404 });
    }

    const isValidConversation = 
      (currentUser.role === 'TEACHER' && otherUser.role === 'STUDENT') ||
      (currentUser.role === 'STUDENT' && otherUser.role === 'TEACHER');

    if (!isValidConversation) {
      return NextResponse.json({ error: 'Invalid conversation participants' }, { status: 400 });
    }

    const teacherId = currentUser.role === 'TEACHER' ? currentUser.id : otherUser.id;
    const studentId = currentUser.role === 'STUDENT' ? currentUser.id : otherUser.id;

    let conversation = await prisma.conversation.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
      include: { teacher: true, student: true }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { teacherId, studentId },
        include: { teacher: true, student: true }
      });
    }

    return NextResponse.json({ conversation });

  } catch (error) {
    console.error('Error creating/finding conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
