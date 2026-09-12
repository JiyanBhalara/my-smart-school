import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  requireSession,
  requireLessonAccess,
  toErrorResponse,
} from '@/lib/auth-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Fixed: params should be Promise
) {
  try {
    const { id } = await params; // Await params

    // Authenticate, then authorize against this lesson (author, or published)
    const user = await requireSession();
    await requireLessonAccess(id, user.id);

    const lesson = await prisma.lesson.findUnique({
      where: { id: id },
      include: {
        quizzes: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            description: true,
            maxAttempts: true,
            timeLimit: true,
            _count: { // Fixed: single underscore
              select: { questions: true }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;

    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
