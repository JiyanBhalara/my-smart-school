// app/api/reports/my-report/route.ts
import { NextResponse } from 'next/server'; // Removed unused NextRequest
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET() { // Removed unused request parameter
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is a student
    if (!session || session.user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect to the individual student report endpoint
    const studentId = session.user.id;
    
    // We can reuse the logic from the individual student report
    // by making an internal call or duplicating the logic
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

    // Group quiz attempts by quiz
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
      
      if (!quizData.latestAttempt || 
          (attempt.completedAt && quizData.latestAttempt.completedAt && 
           attempt.completedAt > quizData.latestAttempt.completedAt)) {
        quizData.latestAttempt = attempt;
      }
    });

    interface Quiz {
        id: string;
        title: string;
        description: string;
        passingScore: number;
        maxAttempts: number;
        lesson: {
            id: string;
            title: string;
            subject: string;
        };
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

    const quizResults: QuizResult[] = Array.from(quizMap.values()).map((quizData: QuizData): QuizResult => ({
        quiz: quizData.quiz,
        totalAttempts: quizData.attempts.length,
        attempts: quizData.attempts,
        latestAttempt: quizData.latestAttempt,
        bestScore: Math.max(...quizData.attempts.map(a => a.percentage)),
        averageScore: quizData.attempts.reduce((sum, a) => sum + a.percentage, 0) / quizData.attempts.length,
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
      overallPercentage: totalPossiblePoints > 0 ? (totalEarnedPoints / totalPossiblePoints) * 100 : 0, // Fixed: removed escaped backslash
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
    console.error('Error fetching my report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch your report' },
      { status: 500 }
    );
  }
}
