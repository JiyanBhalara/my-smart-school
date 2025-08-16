// app/api/lessons/[lessonId]/quizzes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await params; // Await params

    const quizzes = await prisma.quiz.findMany({
      where: { 
        lessonId: lessonId,
        published: true 
      },
      include: {
        author: {
          select: { name: true, email: true }
        },
        _count: {
          select: { questions: true }
        },
        attempts: {
          where: { studentId: session.user.id },
          select: {
            id: true,
            score: true,
            totalPoints: true,
            percentage: true,
            isCompleted: true,
            completedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await params; // Await params
    const lessonId = id; 
    // Verify lesson ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { authorId: true, _count: { select: { quizzes: true } } },
    });

    if (!lesson || lesson.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden - You can only delete quizzes from your own lessons' }, { status: 403 });
    }

    // Delete all quizzes for this lesson
    const deleteResult = await prisma.quiz.deleteMany({ 
      where: { 
        lessonId: lessonId,
        authorId: userId 
      } 
    });

    return NextResponse.json({ 
      success: true, 
      message: `${deleteResult.count} quiz(es) deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting all quizzes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
