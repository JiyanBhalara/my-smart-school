// components/QuizCard.tsx
import Link from "next/link";
import { Calendar, Play, Trophy, Clock, RotateCcw, CheckCircle, XCircle, Award, Star, Target, BarChart3 } from "lucide-react";

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
  authorId: string; // Added this for checking quiz ownership
  attempts: QuizAttempt[];
}

interface QuizCardProps {
  quiz: Quiz;
  lessonId: string;
  index: number;
  userId?: string;
  userRole?: string; // Added this to check if user is a teacher
}

export default function QuizCard({ quiz, lessonId, index, userId, userRole }: QuizCardProps) {
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
  
  // Check if current user is the teacher who created this quiz
  const isQuizAuthor = userRole === "TEACHER" && userId === quiz.authorId;
  const getScoreColor = (percentage: number, passed?: boolean | null) => {
    if (hasPassingScore && passed !== null) {
      return passed ? "text-emerald-600" : "text-red-500";
    }
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-amber-600";
    if (percentage >= 60) return "text-orange-600";
    return "text-red-500";
  };

  const getScoreBgColor = (percentage: number, passed?: boolean | null) => {
    if (hasPassingScore && passed !== null) {
      return passed 
        ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200" 
        : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200";
    }
    if (percentage >= 90) return "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200";
    if (percentage >= 80) return "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200";
    if (percentage >= 70) return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200";
    if (percentage >= 60) return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
    return "bg-gradient-to-r from-red-50 to-rose-50 border-red-200";
  };

  const getProgressBarColor = (percentage: number, passed?: boolean | null) => {
    if (hasPassingScore && passed !== null) {
      return passed ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-red-500 to-rose-500";
    }
    if (percentage >= 90) return "bg-gradient-to-r from-emerald-500 to-green-500";
    if (percentage >= 80) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (percentage >= 70) return "bg-gradient-to-r from-amber-500 to-yellow-500";
    if (percentage >= 60) return "bg-gradient-to-r from-orange-500 to-amber-500";
    return "bg-gradient-to-r from-red-500 to-rose-500";
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-[#219EBC]/50 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#219EBC] via-[#0077B6] to-[#023047] opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Quiz Number Badge - Enhanced */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <div className="relative">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#219EBC] via-[#0077B6] to-[#023047] text-white rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
            {index + 1}
          </div>
          <div className="absolute -inset-2 bg-gradient-to-br from-[#219EBC]/20 to-[#023047]/20 rounded-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
        </div>
      </div>

      {/* Status Badge - Enhanced */}
      {latestAttempt && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
          {hasPassingScore && latestAttempt.passed !== null ? (
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold shadow-md transition-all duration-300 group-hover:shadow-lg ${
              latestAttempt.passed 
                ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300" 
                : "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-300"
            }`}>
              {latestAttempt.passed ? (
                <>
                  <CheckCircle size={16} />
                  <span className="hidden sm:inline">Passed</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  <span className="hidden sm:inline">Failed</span>
                  <span className="sm:hidden">✗</span>
                </>
              )}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-300 shadow-md transition-all duration-300 group-hover:shadow-lg">
              <Trophy size={16} />
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">✓</span>
            </div>
          )}
        </div>
      )}

      {/* View Report Button - Only for Quiz Authors (Teachers) */}
      {isQuizAuthor && (
        <div className="absolute top-16 right-4 sm:top-20 sm:right-6 z-20">
          <Link
            href={`/lessons/${lessonId}/quizzes/${quiz.id}/report`}
            className="group/report inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <BarChart3 size={16} className="group-hover/report:scale-110 transition-transform duration-300" />
            <span className="hidden sm:inline">View Report</span>
            <span className="sm:hidden">📊</span>
          </Link>
        </div>
      )}

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header - Responsive spacing */}
        <div className={`ml-12 sm:ml-16 mb-4 sm:mb-6 ${isQuizAuthor ? 'mr-20 sm:mr-32' : 'mr-16 sm:mr-20'}`}>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-[#023047] transition-colors leading-tight mb-2 sm:mb-3">
            {quiz.title}
          </h3>
          {quiz.description && (
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-2 group-hover:text-gray-700 transition-colors">
              {quiz.description}
            </p>
          )}
        </div>

        {/* Quiz Info - Enhanced icons and responsive layout */}
        <div className="ml-12 sm:ml-16 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Calendar size={16} className="text-[#219EBC]" />
              <span className="font-medium">
                {quiz.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            
            {quiz.timeLimit && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Clock size={16} className="text-amber-600" />
                <span className="font-medium">{quiz.timeLimit} min</span>
              </div>
            )}
            
            {quiz.passingScore && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <Target size={16} className="text-green-600" />
                <span className="font-medium">{quiz.passingScore}% to pass</span>
              </div>
            )}
            
            {maxAttempts !== Infinity && (
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <RotateCcw size={16} className="text-purple-600" />
                <span className="font-medium">{maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''} max</span>
              </div>
            )}
          </div>
        </div>

        {/* Score Section - Enhanced styling */}
        {latestAttempt && (
          <div className={`ml-12 sm:ml-16 mb-4 sm:mb-6 p-4 sm:p-6 rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-300 ${getScoreBgColor(latestAttempt.percentage, latestAttempt.passed)}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  hasPassingScore && latestAttempt.passed !== null
                    ? latestAttempt.passed ? "bg-emerald-100" : "bg-red-100"
                    : "bg-blue-100"
                }`}>
                  <Award size={20} className={getScoreColor(latestAttempt.percentage, latestAttempt.passed)} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">Latest Score</h4>
                  <p className="text-sm text-gray-600">
                    Attempt {attemptCount} of {maxAttempts === Infinity ? '∞' : maxAttempts}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-3xl sm:text-4xl font-bold ${getScoreColor(latestAttempt.percentage, latestAttempt.passed)}`}>
                  {Math.round(latestAttempt.percentage)}%
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {latestAttempt.score}/{latestAttempt.totalPoints} points
                </div>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="relative w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(latestAttempt.percentage, latestAttempt.passed)} shadow-sm`}
                style={{ width: `${latestAttempt.percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-500" />
                <span className="font-medium">Performance: {
                  latestAttempt.percentage >= 90 ? "Excellent" :
                  latestAttempt.percentage >= 80 ? "Great" :
                  latestAttempt.percentage >= 70 ? "Good" :
                  latestAttempt.percentage >= 60 ? "Fair" : "Needs Improvement"
                }</span>
              </div>
              {latestAttempt.completedAt && (
                <span className="font-medium">
                  Completed {latestAttempt.completedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Attempts Info for new quizzes */}
        {!latestAttempt && maxAttempts !== Infinity && (
          <div className="ml-12 sm:ml-16 mb-4 sm:mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <RotateCcw size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ready to Start</p>
                <p className="text-sm text-gray-600">
                  {maxAttempts} attempt{maxAttempts !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Section - Enhanced buttons */}
        <div className="ml-12 sm:ml-16 flex flex-col gap-3">
          {canTakeQuiz ? (
            <Link
              href={`/lessons/${lessonId}/quizzes/${quiz.id}`}
              className="group/btn cursor-pointer inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#023047] via-[#0077B6] to-[#219EBC] text-white font-bold rounded-2xl hover:from-[#219EBC] hover:via-[#0077B6] hover:to-[#023047] transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#219EBC]/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
              <Play size={20} className="group-hover/btn:scale-110 transition-transform duration-300" />
              <span className="relative z-10 text-lg">
                {latestAttempt ? 'Take Another Attempt' : 'Start Quiz'}
              </span>
            </Link>
          ) : (
            <div className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-500 font-bold rounded-2xl cursor-not-allowed border-2 border-gray-300">
              <XCircle size={20} />
              <span className="text-lg">No Attempts Left</span>
            </div>
          )}

          {/* Attempts remaining info */}
          {latestAttempt && attemptsLeft > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <RotateCcw size={16} className="text-[#219EBC]" />
              <span className="font-medium">
                {attemptsLeft === Infinity ? 'Unlimited' : attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#219EBC]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
}
