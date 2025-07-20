'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full top-0 z-50 px-4 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <a href="/"  className="text-2xl font-bold text-navy">
          My Smart Digital School
        </a>
        
        {/* Desktop Navigation */}
        <div className="hidden md   :flex items-center space-x-8">
          <a 
            href="#features" 
            className="text-gray-600 hover:text-teal transition-colors duration-300 font-medium"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="text-gray-600 hover:text-teal transition-colors duration-300 font-medium"
          >
            How It Works
          </a>
          <a 
            href="#who-its-for" 
            className="text-gray-600 hover:text-teal transition-colors duration-300 font-medium"
          >
            Who It's For
          </a>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {!isLoggedIn ? (
            <>
              {/* Login Button */}
              <a
                href="/api/auth/signin"
                className="flex items-center space-x-2 text-gray-600 hover:text-teal transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-teal-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </a>
              
              {/* Sign Up Button */}
              <a
                href="/signup"
                className="flex items-center space-x-2 bg-teal text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 hover-lift transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Sign Up</span>
              </a>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-8 h-8 rounded-full border-2 border-sky-light"
                  />
                ) : (
                  <div className="w-8 h-8 bg-sky-light rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-navy" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                <div className="hidden lg:block">
                  <p className="text-gray-700 font-medium text-sm">
                    Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors duration-300"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
          <div className="flex flex-col space-y-4 pt-4">
            {/* Mobile Navigation Links */}
            <a 
              href="#features" 
              className="text-gray-600 hover:text-teal transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-50" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-gray-600 hover:text-teal transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-50" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#who-its-for" 
              className="text-gray-600 hover:text-teal transition-colors duration-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-50" 
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Who It's For
            </a>

            {/* Mobile Auth Section */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {!isLoggedIn ? (
                <>
                  {/* Mobile Login */}
                  <a
                    href="/api/auth/signin"
                    className="flex items-center space-x-3 text-gray-600 hover:text-teal transition-colors duration-300 font-medium px-4 py-3 rounded-lg hover:bg-gray-50 w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Login to Your Account</span>
                  </a>
                  
                  {/* Mobile Sign Up */}
                  <a
                    href="/signup"
                    className="flex items-center justify-center space-x-3 bg-teal text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Create New Account</span>
                  </a>
                </>
              ) : (
                <div className="space-y-3">
                  {/* Mobile User Profile */}
                  <div className="flex items-center space-x-3 px-4 py-3 bg-sky-light-10 rounded-lg">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'} 
                        className="w-10 h-10 rounded-full border-2 border-sky-light"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-sky-light rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-navy" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="text-navy font-medium">
                        {session?.user?.name ? `Welcome, ${session.user.name.split(' ')[0]}!` : 'Welcome back!'}
                      </p>
                      <p className="text-gray-600 text-sm">Manage your account</p>
                    </div>
                  </div>
                  
                  {/* Mobile Logout */}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' });
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors duration-300 font-medium px-4 py-3 rounded-lg hover:bg-red-50 w-full"
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
        </div>
      )}
    </nav>
  );
}