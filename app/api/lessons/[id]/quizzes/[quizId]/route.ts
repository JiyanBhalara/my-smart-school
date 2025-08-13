import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; quizId: string }> } // params is now a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params Promise before accessing its properties
    const { lessonId, quizId } = await params;

    // Check if user has already reached max attempts
    const completedAttempts = await prisma.quizAttempt.count({
      where: {
        quizId: quizId, // Now using the awaited quizId
        studentId: session.user.id,
        isCompleted: true
      }
    });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }, // Now using the awaited quizId
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
