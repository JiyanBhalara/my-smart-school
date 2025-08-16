// app/api/teacher/lessons/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

// GET lesson for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Check if teacher is the author
    if (lesson.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this lesson' }, { status: 403 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE lesson
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, subject, type, tags, published } = await request.json();

    // Verify lesson exists and user owns it
    const existingLesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!existingLesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (existingLesson.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to edit this lesson' }, { status: 403 });
    }

    // Update lesson with transaction
    const updatedLesson = await prisma.$transaction(async (tx) => {
      // Delete existing tags
      await tx.lessonTag.deleteMany({
        where: { lessonId: id }
      });

      // Update lesson
      const lesson = await tx.lesson.update({
        where: { id },
        data: {
          title,
          subject,
          type,
          published: published ?? existingLesson.published,
          updatedAt: new Date(),
          tags: {
            create: tags?.map((tagName: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName }
                }
              }
            })) || []
          }
        },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      return lesson;
    });

    return NextResponse.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE lesson
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify lesson exists and user owns it
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        quizzes: {
          select: { id: true }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    if (lesson.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this lesson' }, { status: 403 });
    }

    // Check if lesson has quizzes
    if (lesson.quizzes.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete lesson with existing quizzes. Please delete all quizzes first.' 
      }, { status: 400 });
    }

    // Delete lesson (cascades will handle tags)
    await prisma.lesson.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
