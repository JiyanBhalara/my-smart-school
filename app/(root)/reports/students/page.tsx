// app/reports/students/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon, 
  UsersIcon, 
  ChartBarIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  stats: {
    totalQuizzesTaken: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalNotesCount: number;
  };
}

interface ApiResponse {
  students: Student[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function StudentListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Redirect if not teacher
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'TEACHER') {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch students
  const fetchStudents = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(search && { search }),
      });

      const response = await fetch(`/api/reports/students?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data: ApiResponse = await response.json();
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (session?.user?.role === 'TEACHER') {
      fetchStudents(currentPage, searchTerm);
    }
  }, [session, currentPage, searchTerm]);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents(1, searchTerm);
  };

  // Helper functions
  const getStudentInitials = (name: string | null) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
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

  const getScoreBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (percentage >= 60) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl border border-indigo-200">
              <UsersIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Student Reports</h1>
              <p className="text-gray-600 mt-1">
                View and manage all student performance data
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students by name or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{pagination.totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Active Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.stats.totalQuizzesTaken > 0).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {students.length > 0 
                    ? (students.reduce((sum, s) => sum + s.stats.averageScore, 0) / students.length).toFixed(1)
                    : '0.0'
                  }%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Students Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No students match "${searchTerm}". Try a different search term.`
                : 'No students have signed up yet.'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {students.map((student) => (
                <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    {/* Student Info */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex-shrink-0">
                        {student.image ? (
                          <Image
                            src={student.image}
                            alt={student.name || 'Student'}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarBgColor(student.name)} border-2 border-white shadow-sm`}>
                            {getStudentInitials(student.name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {student.name || 'Unnamed Student'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">{student.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quizzes Taken</span>
                        <span className="font-semibold text-gray-900">{student.stats.totalQuizzesTaken}</span>
                      </div>
                      
                      {student.stats.totalQuizzesTaken > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Average Score</span>
                            <span className={`font-bold ${getScoreColor(student.stats.averageScore)}`}>
                              {student.stats.averageScore.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Best Score</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getScoreBadgeColor(student.stats.highestScore)}`}>
                              {student.stats.highestScore.toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Notes</span>
                        <span className="font-semibold text-gray-900">{student.stats.totalNotesCount}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/reports/students/${student.id}`}
                      className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>
                    Showing {((pagination.currentPage - 1) * 25) + 1} to {Math.min(pagination.currentPage * 25, pagination.totalCount)} of {pagination.totalCount} students
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="cursor-pointer flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            page === pagination.currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNextPage}
                    className="cursor-pointer flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
