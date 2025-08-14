// app/api/reports/student/[studentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

type Props = {
  params: Promise<{ studentId: string }>;
};

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    const { studentId } = await params;

    // Check authentication and authorization
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Teachers can view any student's report, students can only view their own
    const isTeacher = session.user?.role === 'TEACHER';
    const isOwnReport = session.user?.id === studentId;

    if (!isTeacher && !isOwnReport) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get detailed student data
    const student = await prisma.user.findUnique({
      where: {
        id: studentId,
        role: 'STUDENT',
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
            timeSpent: true,
            quiz: {
              select: {
                id: true,
                title: true,
                description: true,
                passingScore: true,
                maxAttempts: true,
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    subject: true,
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
            updatedAt: true,
            teacher: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Group quiz attempts by quiz (show all attempts but highlight latest)
    const quizMap = new Map();
    student.quizAttempts.forEach((attempt) => {
      const quizId = attempt.quiz.id;
      if (!quizMap.has(quizId)) {
        quizMap.set(quizId, {
          quiz: attempt.quiz,
          attempts: [],
          latestAttempt: null,
        });
      }
      
      const quizData = quizMap.get(quizId);
      quizData.attempts.push(attempt);
      
      // Update latest attempt if this one is more recent
      if (!quizData.latestAttempt || 
          (attempt.completedAt && quizData.latestAttempt.completedAt && 
           attempt.completedAt > quizData.latestAttempt.completedAt)) {
        quizData.latestAttempt = attempt;
      }
    });

    interface QuizLesson {
        id: string;
        title: string;
        subject: string;
    }

    interface Quiz {
        id: string;
        title: string;
        description: string;
        passingScore: number;
        maxAttempts: number;
        lesson: QuizLesson;
    }

    interface QuizAttempt {
        id: string;
        score: number;
        totalPoints: number;
        percentage: number;
        passed: boolean;
        completedAt: Date;
        isCompleted: boolean;
        timeSpent: number;
        quiz: Quiz;
    }

    interface QuizData {
        quiz: Quiz;
        attempts: QuizAttempt[];
        latestAttempt: QuizAttempt | null;
    }

    interface QuizResult {
        quiz: Quiz;
        totalAttempts: number;
        attempts: QuizAttempt[];
        latestAttempt: QuizAttempt | null;
        bestScore: number;
        averageScore: number;
    }

    const quizResults: QuizResult[] = Array.from(quizMap.values()).map((quizData: QuizData) => ({
        quiz: quizData.quiz,
        totalAttempts: quizData.attempts.length,
        attempts: quizData.attempts,
        latestAttempt: quizData.latestAttempt,
        bestScore: Math.max(...quizData.attempts.map((a: QuizAttempt) => a.percentage)),
        averageScore: quizData.attempts.reduce((sum: number, a: QuizAttempt) => sum + a.percentage, 0) / quizData.attempts.length,
    }));

    // Calculate overall statistics
    const allScores = student.quizAttempts.map(attempt => attempt.percentage);
    const totalPossiblePoints = student.quizAttempts.reduce((sum, attempt) => sum + attempt.totalPoints, 0);
    const totalEarnedPoints = student.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);

    const overallStats = {
      totalQuizzesTaken: quizResults.length,
      totalAttempts: student.quizAttempts.length,
      averageScore: allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0,
      highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
      totalPointsEarned: totalEarnedPoints,
      totalPossiblePoints: totalPossiblePoints,
      overallPercentage: totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0,
      passCount: student.quizAttempts.filter(attempt => attempt.passed === true).length,
      failCount: student.quizAttempts.filter(attempt => attempt.passed === false).length,
    };

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        image: student.image,
        createdAt: student.createdAt,
      },
      overallStats,
      quizResults,
      notes: student.studentNotes,
    });
  } catch (error) {
    console.error('Error fetching student report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student report' },
      { status: 500 }
    );
  }
}

