import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';
import { parseBody, submitQuizSchema } from '@/lib/validation';

interface AnswerResult {
  questionId: string;
  selectedOptionId?: string;
  isCorrect: boolean;
  pointsEarned: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string; quizId: string }> } // Fixed: params should be Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params; // Await params
    const parsed = parseBody(submitQuizSchema, await request.json());
    if (!parsed.ok) return parsed.response;
    const { answers } = parsed.data;

    // Get quiz with questions and correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }, // Use awaited quizId
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Check if student has exceeded max attempts
    const completedAttempts = await prisma.quizAttempt.count({
      where: {
        quizId: quizId, // Use awaited quizId
        studentId: session.user.id,
        isCompleted: true
      }
    });

    if (quiz.maxAttempts && completedAttempts >= quiz.maxAttempts) {
      return NextResponse.json({ error: 'Maximum attempts exceeded' }, { status: 403 });
    }

    // Calculate score
    let totalScore = 0;
    let totalPossible = 0;
    const answerResults: AnswerResult[] = [];

    for (const question of quiz.questions) {
      totalPossible += question.points;
      const userAnswer = answers.find(a => a.questionId === question.id);
      const selectedOption = question.options.find(o => o.id === userAnswer?.optionId);
      
      const isCorrect = selectedOption?.isCorrect || false;
      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      answerResults.push({
        questionId: question.id,
        selectedOptionId: userAnswer?.optionId,
        isCorrect,
        pointsEarned
      });
    }

    const percentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
    const passed = quiz.passingScore ? percentage >= quiz.passingScore : null;

    // Create quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        studentId: session.user.id,
        quizId: quizId, // Use awaited quizId
        score: totalScore,
        totalPoints: totalPossible,
        percentage,
        passed,
        isCompleted: true,
        completedAt: new Date(),
        answers: {
          create: answerResults.map(result => ({
            questionId: result.questionId,
            selectedOptionId: result.selectedOptionId,
            isCorrect: result.isCorrect,
            pointsEarned: result.pointsEarned
          }))
        }
      }
    });

    return NextResponse.json({
      attemptId: quizAttempt.id,
      score: totalScore,
      totalPoints: totalPossible,
      percentage: Math.round(percentage),
      passed,
      results: quiz.showResults ? answerResults : null
    });

  } catch (error) {
    console.error('Error submitting quiz:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
