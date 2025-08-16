// app/api/lessons/[lessonId]/quizzes/[quizId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIXED: Await params first, then destructure
    const { lessonId, quizId } = await params;

    // Add validation to catch undefined values early
    if (!lessonId || !quizId) {
      return NextResponse.json({ error: 'Missing lessonId or quizId' }, { status: 400 });
    }

    // Check if user has already reached max attempts
    const completedAttempts = await prisma.quizAttempt.count({
      where: {
        quizId: quizId,
        studentId: session.user.id,
        isCompleted: true
      }
    });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                optionText: true,
                optionImage: true,
                order: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (quiz.maxAttempts && completedAttempts >= quiz.maxAttempts) {
      return NextResponse.json({ 
        error: 'Maximum attempts reached',
        attemptsLeft: 0 
      }, { status: 403 });
    }

    return NextResponse.json({
      ...quiz,
      attemptsLeft: quiz.maxAttempts ? quiz.maxAttempts - completedAttempts : null
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // FIXED: Await params first, then destructure
    const { id, quizId } = await params;
    const lessonId = id;
    // Add validation to catch undefined values early
    if (!lessonId || !quizId) {
      console.error('Missing parameters:', { lessonId, quizId });
      return NextResponse.json({ error: 'Missing lessonId or quizId' }, { status: 400 });
    }

    // Log for debugging
    console.log('Delete quiz request:', { lessonId, quizId, userId });

    // Verify lesson ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { authorId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden - You can only delete quizzes from your own lessons' }, { status: 403 });
    }

    // Verify quiz belongs to this lesson and user
    const quiz = await prisma.quiz.findFirst({
      where: { 
        id: quizId, 
        lessonId: lessonId,
        authorId: userId 
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found or access denied' }, { status: 404 });
    }

    // Delete the quiz (CASCADE will handle related records)
    await prisma.quiz.delete({ 
      where: { id: quizId } 
    });

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
