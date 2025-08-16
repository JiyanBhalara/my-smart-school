// app/reports/student/[studentId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  TrophyIcon, 
  ChartBarIcon,
  ClockIcon,
  AcademicCapIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

export default function StudentReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const isTeacher = session?.user?.role === 'TEACHER';
  const isOwnReport = session?.user?.id === studentId;

  // Authorization check
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (!isTeacher && !isOwnReport)) {
      router.push('/');
    }
  }, [session, status, router, isTeacher, isOwnReport]);

  // Fetch student report
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/students/${studentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch student report');
        }
        const data: ReportData = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (studentId && (isTeacher || isOwnReport)) {
      fetchReport();
    }
  }, [studentId, isTeacher, isOwnReport]);

  // Add note function
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !isTeacher) return;

    try {
      setAddingNote(true);
      const response = await fetch(`/api/reports/students/${studentId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const { note } = await response.json();
      
      // Update local state
      setReportData(prev => prev ? {
        ...prev,
        notes: [note, ...prev.notes]
      } : null);
      
      setNewNote('');
      setShowNoteForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  // Helper functions
  const getStudentInitials = (name: string | null) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].toUpperCase();
    }
    return (names + names[names.length - 1]).toUpperCase();
  };

  const getAvatarBgColor = (name: string | null) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-emerald-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Chart data
  const performanceChartData = reportData ? {
    labels: ['Excellent (90-100%)', 'Good (80-89%)', 'Fair (70-79%)', 'Poor (60-69%)', 'Failing (<60%)'],
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
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  } : null;

  const progressChartData = reportData ? {
    labels: reportData.quizResults
      .sort((a, b) => new Date(a.latestAttempt.completedAt).getTime() - new Date(b.latestAttempt.completedAt).getTime())
      .slice(-10) // Last 10 quizzes
      .map((result, index) => `Quiz ${index + 1}`),
    datasets: [{
      label: 'Score %',
      data: reportData.quizResults
        .sort((a, b) => new Date(a.latestAttempt.completedAt).getTime() - new Date(b.latestAttempt.completedAt).getTime())
        .slice(-10)
        .map(result => result.latestAttempt.percentage),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
    }],
  } : null;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Student report could not be loaded.'}</p>
          <Link
            href="/reports/students"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Students
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href={isTeacher ? "/reports/students" : "/reports/my-report"}
            className="cursor-pointer inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4 sm:mb-6 group"
          >
            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base">
              {isTeacher ? 'Back to All Students' : 'Back to My Report'}
            </span>
          </Link>

          {/* Student Info Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-shrink-0 self-center sm:self-auto">
                {reportData.student.image ? (
                  <Image
                    src={reportData.student.image}
                    alt={reportData.student.name || 'Student'}
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-200 object-cover"
                  />
                ) : (
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-2xl ${getAvatarBgColor(reportData.student.name)} border-4 border-white shadow-lg`}>
                    {getStudentInitials(reportData.student.name)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {reportData.student.name || 'Unnamed Student'}
                </h1>
                <p className="text-gray-600 mb-1 text-sm sm:text-base break-all sm:break-normal">
                  {reportData.student.email}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Student since {new Date(reportData.student.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              {isTeacher && (
                <div className="flex justify-center sm:justify-start">
                  <button
                    onClick={() => setShowNoteForm(!showNoteForm)}
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-sm sm:text-base"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    <span className="hidden xs:inline">Add Note</span>
                    <span className="xs:hidden">Note</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Note Form */}
        {isTeacher && showNoteForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Teacher Note</h3>
            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this student's performance, behavior, or progress..."
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-sm sm:text-base"
                rows={4}
                required
              />
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteForm(false);
                    setNewNote('');
                  }}
                  className="cursor-pointer px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingNote || !newNote.trim()}
                  className="cursor-pointer px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <AcademicCapIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500">Quizzes</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-blue-600">{reportData.overallStats.totalQuizzesTaken}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{reportData.overallStats.totalAttempts} attempts</p>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500">Average</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{reportData.overallStats.averageScore.toFixed(1)}%</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {reportData.overallStats.totalPointsEarned}/{reportData.overallStats.totalPossiblePoints} points
            </p>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <TrophyIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500">Best</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-purple-600">{reportData.overallStats.highestScore.toFixed(1)}%</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Highest</p>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-500">Pass Rate</span>
            </div>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">
              {reportData.overallStats.totalQuizzesTaken > 0 
                ? ((reportData.overallStats.passCount / reportData.overallStats.totalQuizzesTaken) * 100).toFixed(1)
                : '0.0'
              }%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {reportData.overallStats.passCount} passed
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            
            {/* Performance Distribution Chart */}
            {performanceChartData && reportData.overallStats.totalQuizzesTaken > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
                <div className="h-48 sm:h-64">
                  <Doughnut 
                    data={performanceChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                              size: window.innerWidth < 640 ? 10 : 12,
                            },
                          },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const percentage = total > 0 ? ((context.raw as number / total) * 100).toFixed(1) : '0.0';
                              return `${context.label}: ${context.raw} quizzes (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Progress Over Time Chart */}
            {progressChartData && reportData.overallStats.totalQuizzesTaken > 1 && (
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h3>
                <div className="h-48 sm:h-64">
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
                            },
                            font: {
                              size: window.innerWidth < 640 ? 10 : 12,
                            },
                          }
                        },
                        x: {
                          ticks: {
                            font: {
                              size: window.innerWidth < 640 ? 10 : 12,
                            },
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Quiz Results Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Quiz History</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Detailed breakdown of all quiz attempts
                </p>
              </div>
              
              {reportData.quizResults.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <AcademicCapIcon className="h-8 sm:h-12 w-8 sm:w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No quizzes taken yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quiz & Lesson
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attempts
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Latest
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Best
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.quizResults.map((result) => (
                        <tr key={result.quiz.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4">
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                                {result.quiz.title}
                              </div>
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {result.quiz.lesson.title}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {result.totalAttempts}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {result.latestAttempt.score}/{result.latestAttempt.totalPoints}
                            </div>
                            <div className={`text-xs sm:text-sm font-semibold ${getScoreColor(result.latestAttempt.percentage)}`}>
                              {result.latestAttempt.percentage.toFixed(1)}%
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`text-xs sm:text-sm font-semibold ${getScoreColor(result.bestScore)}`}>
                              {result.bestScore.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            {result.latestAttempt.passed !== null ? (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.latestAttempt.passed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.latestAttempt.passed ? 'Pass' : 'Fail'}
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Done
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                            {new Date(result.latestAttempt.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Teacher Notes Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Teacher Notes</h3>
              
              {reportData.notes.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <PencilSquareIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-xs sm:text-sm">No teacher notes yet</p>
                  {isTeacher && (
                    <p className="text-xs text-gray-400 mt-1">Click "Add Note" to get started</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {reportData.notes.map((note) => (
                    <div key={note.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        {note.teacher.image ? (
                          <Image
                            src={note.teacher.image}
                            alt={note.teacher.name || 'Teacher'}
                            width={32}
                            height={32}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {note.teacher.name?.[0]?.toUpperCase() || 'T'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                            {note.teacher.name || 'Teacher'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
