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

  const getAvatarBgColor = () => 'bg-ink';

  const getScoreColor = () => 'text-mark';

  const getScoreBadgeColor = () => 'border-rule text-ink';

  if (status === 'loading' || !session) {
    return (
      <div className="sheet-page mx-auto w-full max-w-5xl py-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink"></div>
      </div>
    );
  }

  return (
    <div className="sheet-page mx-auto w-full max-w-5xl py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#edf2f5] rounded-[4px] border border-ink">
              <UsersIcon className="h-8 w-8 text-ink" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-ink">Student Reports</h1>
              <p className="text-graphite mt-1">
                View and manage all student performance data
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-[4px] border border-rule p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-graphite" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students by name or email..."
                  className="w-full pl-10 pr-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-ink transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer px-6 py-3 bg-ink text-white font-medium rounded-[4px] hover:bg-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                <UsersIcon className="h-6 w-6 text-ink" />
              </div>
              <div>
                <p className="text-sm font-medium text-graphite">Total Students</p>
                <p className="text-2xl font-bold text-ink">{pagination.totalCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                <ChartBarIcon className="h-6 w-6 text-ink" />
              </div>
              <div>
                <p className="text-sm font-medium text-graphite">Active Students</p>
                <p className="text-2xl font-bold text-ink">
                  {students.filter(s => s.stats.totalQuizzesTaken > 0).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[4px] border border-rule">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                <ChartBarIcon className="h-6 w-6 text-ink" />
              </div>
              <div>
                <p className="text-sm font-medium text-graphite">Average Score</p>
                <p className="text-2xl font-bold text-ink">
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
          <div className="bg-[#fdf3f2] border border-mark text-mark px-4 py-3 rounded-[4px] mb-6">
            {error}
          </div>
        )}

        {/* Students Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[4px] p-6 border border-rule">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-[#edf2f5] rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-[#edf2f5] rounded mb-2"></div>
                    <div className="h-3 bg-[#edf2f5] rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-[#edf2f5] rounded"></div>
                  <div className="h-3 bg-[#edf2f5] rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ink mb-2">No students found</h3>
            <p className="text-graphite">
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
                <div key={student.id} className="bg-white rounded-[4px] border border-rule transition-colors">
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
                            className="w-12 h-12 rounded-full border-2 border-rule object-cover"
                          />
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarBgColor()} border-2 border-white`}>
                            {getStudentInitials(student.name)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-ink truncate">
                          {student.name || 'Unnamed Student'}
                        </h3>
                        <p className="text-sm text-graphite truncate">{student.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-graphite">Quizzes Taken</span>
                        <span className="font-semibold text-ink">{student.stats.totalQuizzesTaken}</span>
                      </div>
                      
                      {student.stats.totalQuizzesTaken > 0 && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-graphite">Average Score</span>
                            <span className={`font-bold ${getScoreColor()}`}>
                              {student.stats.averageScore.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-graphite">Best Score</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getScoreBadgeColor()}`}>
                              {student.stats.highestScore.toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-graphite">Notes</span>
                        <span className="font-semibold text-ink">{student.stats.totalNotesCount}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/reports/students/${student.id}`}
                      className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-ink text-white font-medium rounded-[4px] transition-colors focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
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
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-[4px] border border-rule">
                <div className="flex items-center gap-2 text-sm text-ink">
                  <span>
                    Showing {((pagination.currentPage - 1) * 25) + 1} to {Math.min(pagination.currentPage * 25, pagination.totalCount)} of {pagination.totalCount} students
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="cursor-pointer flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink bg-white border border-rule rounded-[4px] hover:bg-[#edf2f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-[4px] transition-colors ${ page === pagination.currentPage ? 'bg-ink text-white' : 'text-ink hover:bg-[#edf2f5]' }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNextPage}
                    className="cursor-pointer flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink bg-white border border-rule rounded-[4px] hover:bg-[#edf2f5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
