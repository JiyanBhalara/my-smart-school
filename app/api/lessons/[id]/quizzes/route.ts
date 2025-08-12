import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { 
        lessonId: params.id,
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
