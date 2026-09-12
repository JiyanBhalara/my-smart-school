import { NextRequest, NextResponse } from 'next/server';
import {
  requireRole,
  requireLessonAuthor,
  toErrorResponse,
} from '@/lib/auth-guard';
import prisma from '@/lib/prisma';
import { parseBody, quizSchema } from '@/lib/validation';

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
    const { id } = await params; // Await params

    // Require TEACHER role *and* authorship of this lesson, so a teacher cannot
    // attach a quiz to another teacher's lesson.
    const session = await requireRole('TEACHER');
    await requireLessonAuthor(id, session.id);

    const parsed = parseBody(quizSchema, await request.json());
    if (!parsed.ok) return parsed.response;
    const { title, description, timeLimit, maxAttempts, questions } = parsed.data;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit,
        maxAttempts,
        lessonId: id, // Use awaited id
        authorId: session.id,
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
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;

    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}