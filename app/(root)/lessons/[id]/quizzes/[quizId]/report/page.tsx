// app/quizzes/[quizId]/report/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import Link from "next/link";
import { ArrowLeft, Users, TrendingUp, Trophy, Target } from "lucide-react";
import ScoreDistributionChart from "@/components/ScoreDistributionChart";
import StudentAvatar from "@/components/StudentAvatar";

type Props = {
  params: Promise<{ quizId: string }>;
};

interface QuizAttempt {
  id: string;
  studentId: string;
  score: number;
  percentage: number;
  totalPoints: number;
  completedAt: Date | null;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
}

export default async function QuizReportPage({ params }: Props) {
  const { quizId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.role !== "TEACHER") {
    notFound();
  }

  // Fetch quiz with all attempts - FIXED: Include user role to filter out teachers
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      attempts: {
        include: { 
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true // ADDED: Include role to filter teachers
            }
          }
        },
        orderBy: { completedAt: "desc" }
      },
      author: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      lesson: {
        select: {
          id: true,
          title: true
        }
      }
    },
  });

  if (!quiz || quiz.authorId !== session.user.id) {
    notFound();
  }

  // FIXED: Filter out teacher attempts - only include student attempts
  const studentOnlyAttempts = quiz.attempts.filter(attempt => 
    attempt.student.role === "STUDENT"
  );

  // Group attempts by student and get latest attempt for each
  const studentMap = new Map<string, QuizAttempt>();
  const allAttempts = new Map<string, QuizAttempt[]>();
  
  studentOnlyAttempts.forEach((attempt) => {
    const studentId = attempt.studentId;
    
    // Track all attempts per student
    if (!allAttempts.has(studentId)) {
      allAttempts.set(studentId, []);
    }
    allAttempts.get(studentId)!.push(attempt);
    
    // Keep latest attempt per student
    const existing = studentMap.get(studentId);
    if (!existing || (attempt.completedAt && (!existing.completedAt || attempt.completedAt > existing.completedAt))) {
      studentMap.set(studentId, attempt);
    }
  });

  const studentResults = Array.from(studentMap.values());
  
  // Calculate statistics - FIXED: Include actual scores
  const scores = studentResults.map(result => result.percentage);
  const actualScores = studentResults.map(result => result.score);
  const totalStudents = studentResults.length;
  
  // Overall statistics
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const averageActualScore = actualScores.length > 0 ? actualScores.reduce((a, b) => a + b, 0) / actualScores.length : 0;
  
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const minActualScore = actualScores.length > 0 ? Math.min(...actualScores) : 0;
  
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const maxActualScore = actualScores.length > 0 ? Math.max(...actualScores) : 0;
  
  // Get total points for the quiz (from any attempt since they should all be the same)
  const totalPossiblePoints = studentResults.length > 0 ? studentResults[0].totalPoints : 0;
  
  // Score distribution for chart
  const scoreDistribution = {
    failing: scores.filter(s => s < 60).length,
    passing: scores.filter(s => s >= 60 && s < 80).length,
    good: scores.filter(s => s >= 80 && s < 90).length,
    excellent: scores.filter(s => s >= 90).length
  };

  return (
    <main className="sheet-page mx-auto w-full max-w-5xl py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/lessons/${quiz.lesson.id}/quizzes`}
            className="cursor-pointer inline-flex items-center gap-2 text-ink hover:text-ink font-medium mb-6 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-colors" />
            Back to All Quizzes
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#edf2f5] rounded-[4px] border border-ink">
              <Trophy size={28} className="text-ink" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-ink">{quiz.title}</h1>
              <p className="text-graphite mt-1">
                Quiz Report • {quiz.lesson.title}
              </p>
              {/* ADDED: Show total possible points */}
              <p className="text-sm text-graphite mt-1">
                Total Points: {totalPossiblePoints} • Students Only (Teachers Excluded)
              </p>
            </div>
          </div>
        </div>

        {/* Overall Statistics Cards - FIXED: Show both actual scores and percentages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                <TrendingUp size={20} className="text-ink" />
              </div>
              <span className="text-sm font-medium text-graphite">Average Score</span>
            </div>
            <p className="text-2xl font-bold text-ink">{averageScore.toFixed(1)}%</p>
            <p className="text-sm text-graphite mt-1">
              {averageActualScore.toFixed(1)}/{totalPossiblePoints} points
            </p>
          </div>

          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                <Trophy size={20} className="text-ink" />
              </div>
              <span className="text-sm font-medium text-graphite">Highest Score</span>
            </div>
            <p className="text-2xl font-bold text-ink">{maxScore.toFixed(1)}%</p>
            <p className="text-sm text-graphite mt-1">
              {maxActualScore}/{totalPossiblePoints} points
            </p>
          </div>

          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#fdf3f2] rounded-[4px]">
                <Target size={20} className="text-mark" />
              </div>
              <span className="text-sm font-medium text-graphite">Lowest Score</span>
            </div>
            <p className="text-2xl font-bold text-mark">{minScore.toFixed(1)}%</p>
            <p className="text-sm text-graphite mt-1">
              {minActualScore}/{totalPossiblePoints} points
            </p>
          </div>

          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                <Users size={20} className="text-ink" />
              </div>
              <span className="text-sm font-medium text-graphite">Students</span>
            </div>
            <p className="text-2xl font-bold text-ink">{totalStudents}</p>
            <p className="text-sm text-graphite mt-1">
              {quiz.attempts.length - studentOnlyAttempts.length} teacher attempts excluded
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Score Distribution Chart */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-[4px] border border-rule">
              <h3 className="text-lg font-semibold text-ink mb-4">Score Distribution</h3>
              <ScoreDistributionChart data={scoreDistribution} />
            </div>
          </div>

          {/* Student Results Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[4px] border border-rule overflow-hidden">
              <div className="px-6 py-4 border-b border-rule">
                <h3 className="text-lg font-semibold text-ink">Student Performance</h3>
                <p className="text-sm text-graphite mt-1">
                  Showing latest attempt per student • Teachers excluded from results
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#edf2f5]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graphite tracking-[0.02em]">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graphite tracking-[0.02em]">
                        Attempts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graphite tracking-[0.02em]">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graphite tracking-[0.02em]">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-graphite tracking-[0.02em]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentResults.map((result) => {
                      const attemptCount = allAttempts.get(result.studentId)?.length || 0;
                      const isPassing = result.percentage >= 60;
                      
                      return (
                        <tr key={result.studentId} className="hover:bg-[#edf2f5]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StudentAvatar student={result.student} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                            {attemptCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                            <div className="font-medium">{result.score}/{result.totalPoints}</div>
                            <div className="text-xs text-graphite">points</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${ result.percentage >= 90 ? 'text-ink' : result.percentage >= 80 ? 'text-ink' : result.percentage >= 60 ? 'text-mark' : 'text-mark' }`}>
                              {result.percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ isPassing ? 'bg-[#edf2f5] text-ink' : 'bg-[#fdf3f2] text-mark' }`}>
                              {isPassing ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {studentResults.length === 0 && (
                <div className="text-center py-12">
                  <Users size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-graphite">No students have taken this quiz yet.</p>
                  {quiz.attempts.length > 0 && (
                    <p className="text-sm text-graphite mt-2">
                      ({quiz.attempts.length} teacher attempt{quiz.attempts.length === 1 ? '' : 's'} excluded)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

