// app/reports/my-report/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  TrophyIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  CalendarIcon,
  EyeIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

interface QuizAttempt {
  id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean | null;
  completedAt: string;
  timeSpent: number | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passingScore: number | null;
  maxAttempts: number | null;
  lesson: {
    id: string;
    title: string;
    subject: string;
  };
}

interface QuizResult {
  quiz: Quiz;
  totalAttempts: number;
  attempts: QuizAttempt[];
  latestAttempt: QuizAttempt;
  bestScore: number;
  averageScore: number;
}

interface StudentNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  teacher: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
}

interface OverallStats {
  totalQuizzesTaken: number;
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalPointsEarned: number;
  totalPossiblePoints: number;
  overallPercentage: number;
  passCount: number;
  failCount: number;
}

interface ReportData {
  student: Student;
  overallStats: OverallStats;
  quizResults: QuizResult[];
  notes: StudentNote[];
}

export default function MyReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not student
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'STUDENT') {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch student's own report
  useEffect(() => {
    const fetchMyReport = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/my-report');
        if (!response.ok) {
          throw new Error('Failed to fetch your report');
        }
        const data: ReportData = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'STUDENT') {
      fetchMyReport();
    }
  }, [session]);

  // Helper functions
  const getStudentInitials = (name: string | null) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', icon: '🏆' };
    if (percentage >= 80) return { level: 'Great', color: 'text-blue-600', icon: '⭐' };
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600', icon: '👍' };
    if (percentage >= 60) return { level: 'Fair', color: 'text-orange-600', icon: '📈' };
    return { level: 'Needs Improvement', color: 'text-red-600', icon: '💪' };
  };

  // Chart data
  const performanceChartData = reportData ? {
    labels: ['Excellent', 'Great', 'Good', 'Fair', 'Needs Work'],
    datasets: [{
      data: [
        reportData.quizResults.filter(q => q.latestAttempt.percentage >= 90).length,
        reportData.quizResults.filter(q => q.latestAttempt.percentage >= 80 && q.latestAttempt.percentage < 90).length,
        reportData.quizResults.filter(q => q.latestAttempt.percentage >= 70 && q.latestAttempt.percentage < 80).length,
        reportData.quizResults.filter(q => q.latestAttempt.percentage >= 60 && q.latestAttempt.percentage < 70).length,
        reportData.quizResults.filter(q => q.latestAttempt.percentage < 60).length,
      ],
      backgroundColor: [
        '#10B981', // green
        '#3B82F6', // blue
        '#F59E0B', // yellow
        '#F97316', // orange
        '#EF4444', // red
      ],
      borderWidth: 0,
    }],
  } : null;

  const progressChartData = reportData && reportData.quizResults.length > 1 ? {
    labels: reportData.quizResults
      .sort((a, b) => new Date(a.latestAttempt.completedAt).getTime() - new Date(b.latestAttempt.completedAt).getTime())
      .map((result, index) => `Quiz ${index + 1}`),
    datasets: [{
      label: 'Your Score',
      data: reportData.quizResults
        .sort((a, b) => new Date(a.latestAttempt.completedAt).getTime() - new Date(b.latestAttempt.completedAt).getTime())
        .map(result => result.latestAttempt.percentage),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#3B82F6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
    }],
  } : null;

  // Subject performance chart
  const subjectData = reportData ? reportData.quizResults.reduce((acc, result) => {
    const subject = result.quiz.lesson.subject;
    if (!acc[subject]) {
      acc[subject] = { scores: [], count: 0 };
    }
    acc[subject].scores.push(result.latestAttempt.percentage);
    acc[subject].count++;
    return acc;
  }, {} as Record<string, { scores: number[], count: number }>) : {};

  const subjectChartData = Object.keys(subjectData).length > 0 ? {
    labels: Object.keys(subjectData),
    datasets: [{
      label: 'Average Score by Subject',
      data: Object.values(subjectData).map(data => 
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(236, 72, 153, 1)',
      ],
      borderWidth: 2,
    }],
  } : null;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your performance report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Available</h2>
          <p className="text-gray-600 mb-6">{error || 'Your report could not be loaded.'}</p>
          <Link
            href="/lessons"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go to Courses
          </Link>
        </div>
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel(reportData.overallStats.averageScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/lessons"
            className="cursor-pointer inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6 group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </Link>

          {/* Welcome Section */}
          <div className="bg-white rounded-3xl shadow-lg border border-white/50 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-shrink-0">
                  {reportData.student.image ? (
                    <Image
                      src={reportData.student.image}
                      alt={reportData.student.name || 'Student'}
                      width={100}
                      height={100}
                      className="w-24 h-24 rounded-full border-4 border-white/20 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl bg-white/20 border-4 border-white/20 shadow-xl">
                      {getStudentInitials(reportData.student.name)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-white">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                    Welcome back, {reportData.student.name?.split(' ')[0] || 'Student'}! 👋
                  </h1>
                  <p className="text-indigo-100 text-lg mb-4">Here&apos;s how you&apos;re performing across all your courses</p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                      <span className="text-2xl">{performanceLevel.icon}</span>
                      <span className="font-semibold">{performanceLevel.level}</span>
                    </div>
                    <div className="text-indigo-100">
                      Overall Average: <span className="font-bold text-white text-xl">
                        {reportData.overallStats.averageScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Quizzes Completed</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.overallStats.totalQuizzesTaken}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg">
                <TrophyIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.overallStats.highestScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-lg">
                <StarIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData.overallStats.totalQuizzesTaken > 0 
                    ? ((reportData.overallStats.passCount / reportData.overallStats.totalQuizzesTaken) * 100).toFixed(0)
                    : '0'
                  }%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl shadow-lg">
                <FireIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points</p>
                <p className="text-3xl font-bold text-gray-900">{reportData.overallStats.totalPointsEarned}</p>
                <p className="text-xs text-gray-500">out of {reportData.overallStats.totalPossiblePoints}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Performance Distribution */}
            {performanceChartData && reportData.overallStats.totalQuizzesTaken > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg">
                    <ChartBarIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Performance Breakdown</h3>
                </div>
                <div className="h-64">
                  <Doughnut 
                    data={performanceChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                              size: 12
                            }
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const percentage = total > 0 ? ((context.raw as number / total) * 100).toFixed(1) : '0.0';
                              return `${context.label}: ${context.raw} quiz${context.raw !== 1 ? 'es' : ''} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Progress Over Time */}
            {progressChartData && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg">
                    <TrophyIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Progress Journey</h3>
                </div>
                <div className="h-64">
                  <Line 
                    data={progressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            }
                          },
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          }
                        },
                        x: {
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Subject Performance */}
            {subjectChartData && (
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-white/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-lg">
                    <AcademicCapIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance by Subject</h3>
                </div>
                <div className="h-64">
                  <Bar 
                    data={subjectChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            }
                          },
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                          }
                        },
                        x: {
                          grid: {
                            display: false,
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Recent Quiz Results */}
            <div className="bg-white rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Quiz Results</h3>
                <p className="text-sm text-gray-600 mt-1">Your latest quiz performances</p>
              </div>
              
              {reportData.quizResults.length === 0 ? (
                <div className="text-center py-16">
                  <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes taken yet</h3>
                  <p className="text-gray-500 mb-6">Start taking quizzes to see your performance here!</p>
                  <Link
                    href="/lessons"
                    className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Browse Courses
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reportData.quizResults.slice(0, 5).map((result) => (
                    <div key={result.quiz.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{result.quiz.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {result.quiz.lesson.title} • {result.quiz.lesson.subject}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{result.totalAttempts} attempt{result.totalAttempts !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>
                              {new Date(result.latestAttempt.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(result.latestAttempt.percentage)}`}>
                              {result.latestAttempt.percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.latestAttempt.score}/{result.latestAttempt.totalPoints}
                            </div>
                          </div>
                          
                          {result.latestAttempt.passed !== null && (
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              result.latestAttempt.passed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {result.latestAttempt.passed ? '✓ Passed' : '✗ Failed'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {reportData.quizResults.length > 5 && (
                    <div className="p-4 bg-gray-50 text-center">
                      <p className="text-sm text-gray-600">
                        Showing 5 of {reportData.quizResults.length} quizzes
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Teacher Notes & Achievements Section */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Achievements/Milestones */}
            <div className="bg-white rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-lg">
                  <TrophyIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              </div>
              
              <div className="space-y-3">
                {reportData.overallStats.totalQuizzesTaken >= 10 && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <p className="font-semibold text-gray-900">Quiz Master</p>
                      <p className="text-xs text-gray-600">Completed 10+ quizzes</p>
                    </div>
                  </div>
                )}
                
                {reportData.overallStats.highestScore >= 95 && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="font-semibold text-gray-900">Perfect Score</p>
                      <p className="text-xs text-gray-600">Achieved 95%+ score</p>
                    </div>
                  </div>
                )}
                
                {reportData.overallStats.averageScore >= 85 && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-semibold text-gray-900">Consistent Performer</p>
                      <p className="text-xs text-gray-600">85%+ average score</p>
                    </div>
                  </div>
                )}
                
                {reportData.overallStats.passCount > 0 && reportData.overallStats.failCount === 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="font-semibold text-gray-900">Perfect Record</p>
                      <p className="text-xs text-gray-600">No failed attempts</p>
                    </div>
                  </div>
                )}
                
                {(reportData.overallStats.totalQuizzesTaken < 10 && 
                  reportData.overallStats.highestScore < 95 && 
                  reportData.overallStats.averageScore < 85) && (
                  <div className="text-center py-6">
                    <span className="text-4xl mb-2 block">🌟</span>
                    <p className="text-sm text-gray-600">Complete more quizzes to unlock achievements!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Notes */}
            <div className="bg-white rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Teacher Notes</h3>
              </div>
              
              {reportData.notes.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl mb-3 block">📝</span>
                  <p className="text-gray-500 text-sm">No teacher notes yet</p>
                  <p className="text-xs text-gray-400 mt-1">Your teachers will add notes about your progress here</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {reportData.notes.map((note) => (
                    <div key={note.id} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-100">
                      <div className="flex items-start gap-3 mb-2">
                        {note.teacher.image ? (
                          <Image
                            src={note.teacher.image}
                            alt={note.teacher.name || 'Teacher'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {note.teacher.name?.[0]?.toUpperCase() || 'T'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {note.teacher.name || 'Teacher'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed pl-11">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-white/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/lessons"
                  className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  <EyeIcon className="h-4 w-4" />
                  Browse All Courses
                </Link>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
