'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const isTeacher = session?.user?.role === 'TEACHER';
  const isStudent = session?.user?.role === 'STUDENT';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only flip after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();
  const handleProtectedAction = (href: string) => {
    if (!isLoggedIn) {
      router.push('/signup');
      return;
    }
    router.push(href);
  };

  return (
    <nav
      suppressHydrationWarning={true}
      className="fixed w-full top-0 z-50 px-4 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo (static) */}
        <Link href="/" className="cursor-pointer text-2xl font-bold text-navy">
          My Smart Digital School
        </Link>

        {/* Desktop UI (session/window-dependent) */}
        {!mounted ? null : (
          <div className="hidden lg:flex items-center space-x-6">
            {/* Action Buttons */}
            <div className="flex items-center space-x-3 border-l border-gray-200 pl-6">
              <button
                onClick={() => handleProtectedAction('/lessons')}
                className="cursor-pointer flex items-center space-x-2 bg-teal text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>All Courses</span>
              </button>

              {/* Chat Navigation - Teachers see Student List */}
              {isLoggedIn && isTeacher && (
                <button
                  onClick={() => handleProtectedAction('/chat/students')}
                  className="cursor-pointer flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                    />
                  </svg>
                  <span>Student List</span>
                </button>
              )}

              {/* Chat Navigation - Students see Teacher List */}
              {isLoggedIn && isStudent && (
                <button
                  onClick={() => handleProtectedAction('/chat/teachers')}
                  className="cursor-pointer flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                    />
                  </svg>
                  <span>Teacher List</span>
                </button>
              )}

              {isLoggedIn && isTeacher && (
                <button
                  onClick={() => handleProtectedAction('/teacher/lessons/new')}
                  className="cursor-pointer flex items-center space-x-2 bg-navy text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Lesson</span>
                </button>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4 border-l border-gray-200 pl-6">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/login"
                    className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-teal transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-teal-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="cursor-pointer flex items-center space-x-2 bg-teal text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    <span>Sign Up</span>
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  {/* Profile */}
                  <div className="flex items-center space-x-3">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-sky-light"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-sky-light rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-navy" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                    <div className="hidden xl:block">
                      <p className="text-gray-700 font-medium text-sm">
                        Welcome back
                        {session.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
                      </p>
                      {isTeacher && <p className="text-xs text-teal font-medium">Teacher</p>}
                    </div>
                  </div>
                  {/* Logout */}
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile menu button (static) */}
        <button
          onClick={() => setIsMobileMenuOpen((o) => !o)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-300"
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

      {/* Mobile menu (session/window-dependent) */}
      {!mounted
        ? null
        : isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-100">
              <div className="flex flex-col space-y-4 pt-4">
                {/* Mobile Action Buttons */}
                <div className="px-4 space-y-3 border-b border-gray-100 pb-4">
                  <button
                    onClick={() => {
                      handleProtectedAction('/lessons');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-3 bg-teal text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 w-full"
                  >
                    All Courses Dashboard
                  </button>

                  {/* Mobile Chat Navigation */}
                  {isLoggedIn && isTeacher && (
                    <button
                      onClick={() => {
                        handleProtectedAction('/chat/students');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-3 bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                        />
                      </svg>
                      Student List & Chat
                    </button>
                  )}

                  {isLoggedIn && isStudent && (
                    <button
                      onClick={() => {
                        handleProtectedAction('/chat/teachers');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-3 bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z"
                        />
                      </svg>
                      Teacher List & Chat
                    </button>
                  )}

                  {isLoggedIn && isTeacher && (
                    <button
                      onClick={() => {
                        handleProtectedAction('/teacher/lessons/new');
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center space-x-3 bg-navy text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 w-full"
                    >
                      Create New Lesson
                    </button>
                  )}
                </div>

                {/* Mobile Navigation Links */}
                <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 font-medium hover:text-teal">
                  Features
                </Link>
                <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 font-medium hover:text-teal">
                  How It Works
                </Link>
                <Link href="#who-its-for" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 font-medium hover:text-teal">
                  Who It&apos;s For
                </Link>

                {/* Mobile Auth Section */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {!isLoggedIn ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 font-medium hover:text-teal"
                      >
                        Login to Your Account
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block bg-teal text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90"
                      >
                        Create New Account
                      </Link>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 px-4 py-3 bg-sky-light-10 rounded-lg">
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full border-2 border-sky-light"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-sky-light rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="text-navy font-medium">
                            {session.user?.name
                              ? `Welcome, ${session.user.name.split(' ')[0]}!`
                              : 'Welcome back!'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {isTeacher ? 'Teacher Account' : 'Manage your account'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setIsMobileMenuOpen(false);
                        }}
                        className="block px-4 py-3 font-medium text-red-600 hover:text-red-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
    </nav>
  );
}
