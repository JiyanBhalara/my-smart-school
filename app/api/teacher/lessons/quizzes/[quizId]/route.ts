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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Fixed: params should be Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Await params

    // Check if the teacher owns this quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: id }, // Use awaited id
      select: { authorId: true }
    });

    if (!existingQuiz || existingQuiz.authorId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Quiz not found or unauthorized' 
      }, { status: 404 });
    }

    const { title, description, timeLimit, maxAttempts, questions }: {
      title: string;
      description?: string;
      timeLimit?: number;
      maxAttempts?: number;
      questions: QuizQuestion[];
    } = await request.json();

    // Delete existing questions and options
    await prisma.question.deleteMany({
      where: { quizId: id } // Use awaited id
    });

    // Update quiz with new data
    const updatedQuiz = await prisma.quiz.update({
      where: { id: id }, // Use awaited id
      data: {
        title,
        description,
        timeLimit,
        maxAttempts,
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

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest, // Added request parameter
  { params }: { params: Promise<{ id: string }> } // Fixed: params should be Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Await params

    // Check if the teacher owns this quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: id }, // Use awaited id
      select: { authorId: true }
    });

    if (!existingQuiz || existingQuiz.authorId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Quiz not found or unauthorized' 
      }, { status: 404 });
    }

    await prisma.quiz.delete({
      where: { id: id } // Use awaited id
    });

    return NextResponse.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
