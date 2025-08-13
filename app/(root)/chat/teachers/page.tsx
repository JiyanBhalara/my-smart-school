'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export default function TeacherListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [conversationsMap, setConversationsMap] = useState<Record<string, string>>({});

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user?.role !== 'STUDENT') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  // Fetch teachers and existing conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all teachers
        const teachersResponse = await fetch('/api/chat/users?role=TEACHER');
        const teachersData = await teachersResponse.json();
        
        if (!teachersResponse.ok) {
          throw new Error(teachersData.error || 'Failed to fetch teachers');
        }
        
        setTeachers(teachersData.users);

        // Fetch existing conversations to check which teachers we already chat with
        const convResponse = await fetch('/api/chat/conversations/list');
        if (convResponse.ok) {
          const convData = await convResponse.json();
          const map: Record<string, string> = {};
          
          convData.conversations.forEach((conv: any) => {
            const otherUserId = conv.teacher.id === session?.user?.id ? conv.student.id : conv.teacher.id;
            map[otherUserId] = conv.id;
          });
          setConversationsMap(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'STUDENT') {
      fetchData();
    }
  }, [session]);

  // Search functionality with debouncing
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`/api/chat/search?query=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        // Filter only teachers from search results
        const teacherResults = data.users.filter((user: User) => user.role === 'TEACHER');
        setSearchResults(teacherResults);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleStartChat = async (teacherId: string) => {
    const existingConversation = conversationsMap[teacherId];
    
    if (existingConversation) {
      // Navigate to existing conversation
      router.push(`/chat/${existingConversation}`);
      return;
    }

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otherUserId: teacherId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      router.push(`/chat/${data.conversation.id}`);
    } catch (err) {
      console.error('Error starting chat:', err);
      alert('Failed to start chat. Please try again.');
    }
  };

  const displayedTeachers = showSearchResults ? searchResults : teachers;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
            <span className="ml-2 text-gray-600">Loading teachers...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Teacher Directory</h1>
          <p className="text-gray-600">Connect and chat with your teachers</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teachers by name..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-colors duration-200"
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-teal-600"></div>
              </div>
            )}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <p className="text-gray-600">
            {showSearchResults 
              ? `Search results for "${searchQuery}" (${displayedTeachers.length} found)`
              : `All Teachers (${displayedTeachers.length} total)`
            }
          </p>
        </div>

        {/* Teachers List */}
        {displayedTeachers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showSearchResults ? 'No matching teachers found' : 'No teachers found'}
            </h3>
            <p className="text-gray-500">
              {showSearchResults 
                ? 'Try adjusting your search terms or browse all teachers below.'
                : 'There are currently no teachers registered in the system.'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedTeachers.map((teacher) => {
              const existingConversation = conversationsMap[teacher.id];
              
              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-teal-200"
                >
                  {/* Teacher Avatar */}
                  <div className="flex items-center mb-4">
                    {teacher.image ? (
                      <Image
                        src={teacher.image}
                        alt={teacher.name || 'Teacher'}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full border-2 border-teal-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {teacher.name || 'Unnamed Teacher'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{teacher.email}</p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      Teacher
                    </span>
                  </div>

                  {/* Chat Button */}
                  <button
                    onClick={() => handleStartChat(teacher.id)}
                    className={`cursor-pointer w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      existingConversation
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={existingConversation 
                          ? "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          : "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        }
                      />
                    </svg>

                    <span>{existingConversation ? 'Continue Chat' : 'Start Chat'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
