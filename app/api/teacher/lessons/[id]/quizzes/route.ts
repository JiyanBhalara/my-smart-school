import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

interface QuizOption {
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  text: string;
  imageUrl?: string;
  points?: number;
  options: QuizOption[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Fixed: params should be Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Await params

    const { 
      title, 
      description, 
      timeLimit, 
      maxAttempts, 
      questions 
    }: {
      title: string;
      description?: string;
      timeLimit?: number;
      maxAttempts?: number;
      questions: QuizQuestion[];
    } = await request.json();

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit,
        maxAttempts,
        lessonId: id, // Use awaited id
        authorId: session.user.id,
        questions: {
          create: questions.map((q: QuizQuestion, index: number) => ({
            questionText: q.text,
            questionImage: q.imageUrl,
            points: q.points || 1,
            order: index,
            options: {
              create: q.options.map((opt: QuizOption, optIndex: number) => ({
                optionText: opt.text,
                optionImage: opt.imageUrl,
                isCorrect: opt.isCorrect,
                order: optIndex
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
