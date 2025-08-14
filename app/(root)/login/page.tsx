"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    try {
      const result = await signIn("credentials", { 
        email, 
        password, 
        callbackUrl: "/",
        redirect: true 
      });
      
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" 
          style={{ backgroundColor: '#8ECAE6' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-40 h-40 rounded-full opacity-10 animate-pulse"
             style={{ backgroundColor: '#023047' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-32 h-32 rounded-full opacity-10 animate-pulse delay-1000"
             style={{ backgroundColor: '#FFB703' }}></div>
        <div className="absolute top-2/3 right-1/4 w-24 h-24 rounded-full opacity-10 animate-pulse delay-500"
             style={{ backgroundColor: '#FB8500' }}></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Header section */}
        <div className="text-center mb-8 animate-fadeIn">
          <Link suppressHydrationWarning={true} href="/" className="cursor-pointer inline-block group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-200"
                 style={{ backgroundColor: '#023047' }}>
              <svg className="w-8 h-8" style={{ color: '#8ECAE6' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform duration-200" 
                style={{ color: '#023047' }}>
              My Smart Digital School
            </h1>
          </Link>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#023047' }}>
            Welcome back!
          </h2>
          <p className="text-lg opacity-80" style={{ color: '#023047' }}>
            Sign in to your account to continue learning
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform hover:shadow-3xl transition-shadow duration-300 animate-slideUp">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl text-sm animate-shake"
                   style={{ backgroundColor: '#FB8500', color: 'white' }}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleCredentialsLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold" style={{ color: '#023047' }}>
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  className="w-full rounded-xl border-2 p-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:border-opacity-70 placeholder-gray-400"
                  style={{ 
                    borderColor: '#219EBC',
                    color: '#023047',
                    backgroundColor: '#f8fafc'
                  }}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#023047' }}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="w-full rounded-xl border-2 p-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 hover:border-opacity-70 placeholder-gray-400"
                  style={{ 
                    borderColor: '#219EBC',
                    color: '#023047',
                    backgroundColor: '#f8fafc'
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-2 focus:ring-2 focus:ring-opacity-50 transition-colors duration-200"
                    style={{ 
                      accentColor: '#219EBC',
                      borderColor: '#219EBC'
                    }}
                  />
                  <label htmlFor="remember-me" className="ml-2 cursor-pointer font-medium" style={{ color: '#023047' }}>
                    Remember me
                  </label>
                </div>

                <a href="#" className="font-semibold hover:opacity-80 transition-opacity duration-200" 
                   style={{ color: '#219EBC' }}>
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full py-4 px-6 rounded-xl font-semibold text-white text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-opacity-50"
                style={{ 
                  backgroundColor: '#023047',
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div suppressHydrationWarning={true} className="flex items-center justify-center space-x-2">
                    <span>Sign in to account</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            </form>
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#e2e8f0' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white font-medium" style={{ color: '#64748b' }}>
                  Or continue with Google
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
            suppressHydrationWarning={true}
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="cursor-pointer w-full flex items-center justify-center px-4 py-4 border-2 rounded-xl bg-white font-medium text-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-4 focus:ring-opacity-50"
              style={{ 
                borderColor: '#e2e8f0',
                color: '#023047',
              }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLoading && (
                <div suppressHydrationWarning={true} className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-3"></div>
              )}
              Continue with Google
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-6 animate-fadeIn delay-300">
          <p style={{ color: '#023047' }} className="opacity-80">
            Don&apos;t have an account?{" "}
            <Link 
              href="/signup" 
              className="cursor-pointer cursor-pointer font-semibold hover:opacity-80 transition-opacity duration-200"
              style={{ color: '#023047' }}
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4 animate-fadeIn delay-500">
          <Link 
            href="/" 
            className="cursor-pointer inline-flex items-center font-medium hover:opacity-80 transition-opacity duration-200"
            style={{ color: '#023047' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to homepage
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        input:focus {
          background-color: white !important;
        }
      `}</style>
    </main>
  );
}
