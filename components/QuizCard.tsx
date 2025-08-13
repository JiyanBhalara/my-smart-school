// components/QuizCard.tsx
import Link from "next/link";
import { Calendar, Play, Trophy, Clock, RotateCcw, CheckCircle, XCircle, Award } from "lucide-react";

interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean | null;
  completedAt: Date | null;
  isCompleted: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  maxAttempts: number | null;
  passingScore: number | null;
  timeLimit: number | null;
  createdAt: Date;
  attempts: QuizAttempt[];
}

interface QuizCardProps {
  quiz: Quiz;
  lessonId: string;
  index: number;
  userId?: string;
}

export default function QuizCard({ quiz, lessonId, index, userId }: QuizCardProps) {
  const completedAttempts = quiz.attempts.filter(attempt => attempt.isCompleted);
  const latestAttempt = completedAttempts.length > 0 
    ? completedAttempts.reduce((latest, current) => 
        current.completedAt && (!latest.completedAt || current.completedAt > latest.completedAt) 
          ? current 
          : latest
      )
    : null;

  const attemptCount = completedAttempts.length;
  const maxAttempts = quiz.maxAttempts || Infinity;
  const attemptsLeft = maxAttempts === Infinity ? Infinity : maxAttempts - attemptCount;
  const canTakeQuiz = attemptsLeft > 0;
  const hasPassingScore = quiz.passingScore !== null;

  const getScoreColor = (percentage: number, passed?: boolean | null) => {
    if (hasPassingScore && passed !== null) {
      return passed ? "text-green-600" : "text-red-600";
    }
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number, passed?: boolean | null) => {
    if (hasPassingScore && passed !== null) {
      return passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
    }
    if (percentage >= 90) return "bg-green-50 border-green-200";
    if (percentage >= 70) return "bg-blue-50 border-blue-200";
    if (percentage >= 50) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#219EBC]/40 transition-all duration-300 transform hover:-translate-y-1">
      {/* Quiz Number Badge */}
      <div className="absolute top-6 left-6 z-10">
        <div className="w-12 h-12 bg-gradient-to-r from-[#219EBC] to-[#0077B6] text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
          {index + 1}
        </div>
      </div>

      {/* Status Badge */}
      {latestAttempt && (
        <div className="absolute top-6 right-6 z-10">
          {hasPassingScore && latestAttempt.passed !== null ? (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
              latestAttempt.passed 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-red-100 text-red-700 border border-red-200"
            }`}>
              {latestAttempt.passed ? (
                <>
                  <CheckCircle size={14} />
                  Passed
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  Failed
                </>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200">
              <Trophy size={14} />
              Completed
            </div>
          )}
        </div>
      )}

      <div className="p-8">
        {/* Header */}
        <div className="ml-16 mr-20 mb-6">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#023047] transition-colors leading-tight mb-2">
            {quiz.title}
          </h3>
          {quiz.description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Quiz Info */}
        <div className="ml-16 mb-6">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>
                Created {quiz.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {quiz.timeLimit && (
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{quiz.timeLimit} min</span>
              </div>
            )}
            {maxAttempts !== Infinity && (
              <div className="flex items-center gap-2">
                <RotateCcw size={16} />
                <span>{maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''} max</span>
              </div>
            )}
          </div>
        </div>

        {/* Score Section */}
        {latestAttempt && (
          <div className={`ml-16 mb-6 p-4 rounded-xl border-2 ${getScoreBgColor(latestAttempt.percentage, latestAttempt.passed)}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award size={18} className={getScoreColor(latestAttempt.percentage, latestAttempt.passed)} />
                Latest Score
              </h4>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(latestAttempt.percentage, latestAttempt.passed)}`}>
                  {Math.round(latestAttempt.percentage)}%
                </div>
                <div className="text-sm text-gray-600">
                  {latestAttempt.score}/{latestAttempt.totalPoints} points
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  hasPassingScore && latestAttempt.passed !== null
                    ? latestAttempt.passed ? "bg-green-500" : "bg-red-500"
                    : latestAttempt.percentage >= 90 ? "bg-green-500"
                    : latestAttempt.percentage >= 70 ? "bg-blue-500"
                    : latestAttempt.percentage >= 50 ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${latestAttempt.percentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Attempt {attemptCount} of {maxAttempts === Infinity ? '∞' : maxAttempts}</span>
              {latestAttempt.completedAt && (
                <span>
                  {latestAttempt.completedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Attempts Info */}
        {!latestAttempt && maxAttempts !== Infinity && (
          <div className="ml-16 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <RotateCcw size={16} />
              <span className="text-sm">
                {maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="ml-16 flex flex-col sm:flex-row gap-3">
          {canTakeQuiz ? (
            <Link
              href={`/lessons/${lessonId}/quizzes/${quiz.id}`}
              className="cursor-pointer inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#023047] to-[#0077B6] text-white font-semibold rounded-xl hover:from-[#219EBC] hover:to-[#0077B6] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#219EBC]/50"
            >
              <Play size={18} />
              <span>
                {latestAttempt ? 'Take Another Attempt' : 'Start Quiz'}
              </span>
            </Link>
          ) : (
            <div className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gray-100 text-gray-500 font-semibold rounded-xl cursor-not-allowed">
              <XCircle size={18} />
              <span>No Attempts Left</span>
            </div>
          )}

          {latestAttempt && attemptsLeft > 0 && (
            <div className="text-sm text-gray-600 self-center px-4">
              {attemptsLeft === Infinity ? '∞' : attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
