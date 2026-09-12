// components/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface UnreadData {
  totalUnread: number;
  conversationsWithUnread: Array<{
    conversationId: string;
    unreadCount: number;
    otherUser: { id: string; name: string | null; image: string | null };
    lastMessageAt: Date | undefined;
  }>;
  usersWithUnread: string[];
}

interface GroupUnreadData {
  totalUnread: number;
  groupsWithUnread: Array<{
    groupId: string;
    groupName: string;
    groupImage: string | null;
    unreadCount: number;
  }>;
  groupIds: string[];
}

export default function Header() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const isTeacher = session?.user?.role === 'TEACHER';
  const isStudent = session?.user?.role === 'STUDENT';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showChatDropdown, setShowChatDropdown] = useState(false);
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [unreadData, setUnreadData] = useState<UnreadData>({
    totalUnread: 0,
    conversationsWithUnread: [],
    usersWithUnread: []
  });
  const [groupUnreadData, setGroupUnreadData] = useState<GroupUnreadData>({
    totalUnread: 0,
    groupsWithUnread: [],
    groupIds: []
  });

  // Refs for dropdown containers
  const chatDropdownRef = useRef<HTMLDivElement>(null);
  const coursesDropdownRef = useRef<HTMLDivElement>(null);

  // Only flip after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread messages data (individual chat)
  useEffect(() => {
    const fetchUnreadData = async () => {
      if (!isLoggedIn) return;
      
      try {
        const response = await fetch('/api/chat/unread');
        if (response.ok) {
          const data = await response.json();
          setUnreadData(data);
        }
      } catch (error) {
        console.error('Error fetching unread data:', error);
      }
    };

    fetchUnreadData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchUnreadData, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Fetch group unread messages data
  useEffect(() => {
    const fetchGroupUnreadData = async () => {
      if (!isLoggedIn) return;
      
      try {
        const response = await fetch('/api/groups/unread');
        if (response.ok) {
          const data = await response.json();
          setGroupUnreadData(data);
        }
      } catch (error) {
        console.error('Error fetching group unread data:', error);
      }
    };

    fetchGroupUnreadData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchGroupUnreadData, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const router = useRouter();

  // Notification Badge Component
  const NotificationBadge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    
    return (
      <div className="absolute -top-1 -right-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[10px] font-semibold text-white tabular">
        {count > 9 ? '9+' : count}
      </div>
    );
  };

  // Close dropdowns when clicking outside - FIXED
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(event.target as Node)) {
        setShowChatDropdown(false);
      }
      if (coursesDropdownRef.current && !coursesDropdownRef.current.contains(event.target as Node)) {
        setShowCoursesDropdown(false);
      }
    };

    if (showChatDropdown || showCoursesDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatDropdown, showCoursesDropdown]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  const totalChatNotifications = unreadData.totalUnread + groupUnreadData.totalUnread;

  return (
    <nav
      suppressHydrationWarning={true}
      className="fixed top-0 z-50 w-full border-b border-rule bg-paper"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="cursor-pointer flex items-center space-x-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-ink">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73V16z"/>
              </svg>
            </div>
            <span className="hidden sm:block text-[17px] font-bold tracking-[-0.01em] text-ink">
              My Smart School
            </span>
          </Link>

          {/* Center Navigation */}
          {!mounted ? null : isLoggedIn && (
            <div className="hidden lg:flex items-center space-x-3">
              
              {/* Chat Dropdown - FIXED */}
              <div className="relative" ref={chatDropdownRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowChatDropdown(!showChatDropdown);
                    setShowCoursesDropdown(false);
                  }}
                  className="cursor-pointer relative flex items-center gap-2 px-2 py-2 text-[14px] font-medium text-ink transition-colors hover:text-ink hover:underline hover:decoration-rule hover:underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Chat</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showChatDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <NotificationBadge count={totalChatNotifications} />
                </button>

                {/* Chat Dropdown Menu - FIXED positioning and z-index */}
                {showChatDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60] animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Communication</h3>
                      <p className="text-xs text-gray-500">Stay connected with your peers</p>
                    </div>
                    
                    {isTeacher && (
                      <Link
                        href="/chat/students"
                        onClick={() => setShowChatDropdown(false)}
                        className="cursor-pointer relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#edf2f5] group"
                      >
                        <div className="text-graphite">
                          <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Student List</p>
                          <p className="text-xs text-gray-500">Chat with students</p>
                        </div>
                        {unreadData.totalUnread > 0 && (
                          <div className="flex-shrink-0">
                            <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[10px] font-semibold text-white tabular">
                              {unreadData.totalUnread > 9 ? '9+' : unreadData.totalUnread}
                            </div>
                          </div>
                        )}
                      </Link>
                    )}

                    {isStudent && (
                      <Link
                        href="/chat/teachers"
                        onClick={() => setShowChatDropdown(false)}
                        className="cursor-pointer relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#edf2f5] group"
                      >
                        <div className="text-graphite">
                          <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Teacher List</p>
                          <p className="text-xs text-gray-500">Chat with teachers</p>
                        </div>
                        {unreadData.totalUnread > 0 && (
                          <div className="flex-shrink-0">
                            <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[10px] font-semibold text-white tabular">
                              {unreadData.totalUnread > 9 ? '9+' : unreadData.totalUnread}
                            </div>
                          </div>
                        )}
                      </Link>
                    )}

                    <Link
                      href="/groups"
                      onClick={() => setShowChatDropdown(false)}
                      className="cursor-pointer relative flex items-center space-x-3 px-4 py-3 hover:bg-[#edf2f5] transition-colors duration-200 group"
                    >
                      <div className="text-graphite">
                        <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Groups</p>
                        <p className="text-xs text-gray-500">Join group discussions</p>
                      </div>
                      {groupUnreadData.totalUnread > 0 && (
                        <div className="flex-shrink-0">
                          <div className="flex h-4 min-w-4 items-center justify-center rounded-full bg-mark px-1 text-[10px] font-semibold text-white tabular">
                            {groupUnreadData.totalUnread > 9 ? '9+' : groupUnreadData.totalUnread}
                          </div>
                        </div>
                      )}
                    </Link>
                  </div>
                )}
              </div>

              {/* Courses Dropdown - FIXED */}
              <div className="relative" ref={coursesDropdownRef}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCoursesDropdown(!showCoursesDropdown);
                    setShowChatDropdown(false);
                  }}
                  className="cursor-pointer relative flex items-center gap-2 px-2 py-2 text-[14px] font-medium text-ink transition-colors hover:text-ink hover:underline hover:decoration-rule hover:underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Courses</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showCoursesDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Courses Dropdown Menu - FIXED */}
                {showCoursesDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60] animate-in slide-in-from-top-5 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Learning</h3>
                      <p className="text-xs text-gray-500">Explore and manage courses</p>
                    </div>
                    
                    <Link
                      href="/lessons"
                      onClick={() => setShowCoursesDropdown(false)}
                      className="cursor-pointer flex items-center space-x-3 px-4 py-3 hover:bg-[#edf2f5] transition-colors duration-200 group"
                    >
                      <div className="text-graphite">
                        <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">All Courses</p>
                        <p className="text-xs text-gray-500">Browse available courses</p>
                      </div>
                    </Link>

                    {isTeacher && (
                      <Link
                        href="/teacher/lessons/new"
                        onClick={() => setShowCoursesDropdown(false)}
                        className="cursor-pointer flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#edf2f5] group"
                      >
                        <div className="text-graphite">
                          <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Create Course</p>
                          <p className="text-xs text-gray-500">Add new lesson content</p>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Student Reports */}
              <Link
                href={isTeacher ? '/reports/students' : '/reports/my-report'}
                className="cursor-pointer relative flex items-center gap-2 px-2 py-2 text-[14px] font-medium text-ink transition-colors hover:text-ink hover:underline hover:decoration-rule hover:underline-offset-[6px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden xl:inline">{isTeacher ? 'Student Reports' : 'My Report'}</span>
                <span className="xl:hidden">Reports</span>
              </Link>

            </div>
          )}

          {/* Right Side - Auth Section */}
          <div className="flex items-center space-x-4">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="cursor-pointer inline-flex h-9 items-center rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Profile */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 relative">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="w-full h-full rounded-full border-2 border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                        {session.user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-sm font-medium text-gray-900">
                      {session.user?.name ? `${session.user.name.split(' ')[0]}` : 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isTeacher ? 'Teacher' : 'Student'}
                    </p>
                  </div>
                </div>
                
                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-300 font-medium px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="cursor-pointer lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - IMPROVED */}
      {!mounted ? null : isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white animate-in slide-in-from-top duration-300">
          <div className="px-4 py-6 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
            
            {isLoggedIn && (
              <>
                {/* Mobile Chat Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                    <svg className="w-4 h-4 mr-2 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                  </h3>
                  
                  {isTeacher && (
                    <Link
                      href="/chat/students"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="cursor-pointer relative flex items-center gap-3 border-t border-rule p-4 transition-colors hover:bg-[#edf2f5] group"
                    >
                      <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Student List</span>
                        <p className="text-xs text-gray-500">Chat with your students</p>
                      </div>
                      {unreadData.totalUnread > 0 && (
                        <NotificationBadge count={unreadData.totalUnread} />
                      )}
                    </Link>
                  )}
                  
                  {isStudent && (
                    <Link
                      href="/chat/teachers"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="cursor-pointer relative flex items-center gap-3 border-t border-rule p-4 transition-colors hover:bg-[#edf2f5] group"
                    >
                      <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Teacher List</span>
                        <p className="text-xs text-gray-500">Chat with your teachers</p>
                      </div>
                      {unreadData.totalUnread > 0 && (
                        <NotificationBadge count={unreadData.totalUnread} />
                      )}
                    </Link>
                  )}
                  
                  <Link
                    href="/groups"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="cursor-pointer relative flex items-center space-x-3 p-4 bg-[#edf2f5] rounded-xl hover:bg-[#edf2f5] transition-colors group"
                  >
                    <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Groups</span>
                      <p className="text-xs text-gray-500">Join group discussions</p>
                    </div>
                    {groupUnreadData.totalUnread > 0 && (
                      <NotificationBadge count={groupUnreadData.totalUnread} />
                    )}
                  </Link>
                </div>

                {/* Mobile Courses Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                    <svg className="w-4 h-4 mr-2 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Courses
                  </h3>
                  
                  <Link
                    href="/lessons"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="cursor-pointer flex items-center gap-3 border-t border-rule p-4 transition-colors hover:bg-[#edf2f5] group"
                  >
                    <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">All Courses</span>
                      <p className="text-xs text-gray-500">Browse available courses</p>
                    </div>
                  </Link>
                  
                  {isTeacher && (
                    <Link
                      href="/teacher/lessons/new"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="cursor-pointer flex items-center gap-3 border-t border-rule p-4 transition-colors hover:bg-[#edf2f5] group"
                    >
                      <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Create Course</span>
                        <p className="text-xs text-gray-500">Add new lesson content</p>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Mobile Reports Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center">
                    <svg className="w-4 h-4 mr-2 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Reports
                  </h3>
                  
                  <Link
                    href={isTeacher ? '/reports/students' : '/reports/my-report'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="cursor-pointer flex items-center gap-3 border-t border-rule p-4 transition-colors hover:bg-[#edf2f5] group"
                  >
                    <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{isTeacher ? 'Student Reports' : 'My Report'}</span>
                      <p className="text-xs text-gray-500">View performance analytics</p>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {/* Mobile Auth Section */}
            {!isLoggedIn ? (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="cursor-pointer block w-full text-center py-3 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Login to Your Account
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="cursor-pointer inline-flex h-9 items-center rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink w-full justify-center"
                >
                  Create New Account
                </Link>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4 border-y border-rule p-4">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-[17px] font-semibold text-white">
                      {session.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {session.user?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {isTeacher ? 'Teacher Account' : 'Student Account'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: '/' });
                    setIsMobileMenuOpen(false);
                  }}
                  className="cursor-pointer w-full flex items-center justify-center space-x-2 py-3 text-red-600 hover:text-red-700 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}