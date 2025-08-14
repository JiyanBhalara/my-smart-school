// app/api/reports/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a teacher
    if (!session || session.user?.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit; // Fixed: removed escaped backslash

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get students with their quiz attempts and notes
    const [students, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: 'STUDENT',
          ...searchFilter,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          quizAttempts: {
            select: {
              id: true,
              score: true,
              totalPoints: true,
              percentage: true,
              passed: true,
              completedAt: true,
              isCompleted: true,
              quiz: {
                select: {
                  id: true,
                  title: true,
                  lesson: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
            where: {
              isCompleted: true,
            },
            orderBy: {
              completedAt: 'desc',
            },
          },
          studentNotes: {
            select: {
              id: true,
              note: true,
              createdAt: true,
              teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.user.count({
        where: {
          role: 'STUDENT',
          ...searchFilter,
        },
      }),
    ]);

    // Calculate statistics for each student
    const studentsWithStats = students.map((student) => {
      const completedAttempts = student.quizAttempts.filter(attempt => attempt.isCompleted);
      const scores = completedAttempts.map(attempt => attempt.percentage);
      
      return {
        ...student,
        stats: {
          totalQuizzesTaken: completedAttempts.length,
          averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          highestScore: scores.length > 0 ? Math.max(...scores) : 0,
          lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
          totalNotesCount: student.studentNotes.length,
        },
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      students: studentsWithStats,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
