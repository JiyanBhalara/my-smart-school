// app/api/reports/student/[studentId]/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';
import { parseBody, studentNoteSchema } from '@/lib/validation';

type Props = {
  params: Promise<{ studentId: string }>;
};

// GET existing notes
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    const { studentId } = await params;

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await prisma.studentNote.findMany({
      where: {
        studentId,
        teacherId: session.user.id,
      },
      select: {
        id: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST new note
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    const { studentId } = await params;

    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = parseBody(studentNoteSchema, await request.json());
    if (!parsed.ok) return parsed.response;
    const { note } = parsed.data;

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        role: 'STUDENT',
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const newNote = await prisma.studentNote.create({
      data: {
        studentId,
        teacherId: session.user.id,
        note: note.trim(),
      },
      select: {
        id: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        teacher: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
