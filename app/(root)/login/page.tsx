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
    <div className="ruled-page mx-auto min-h-[calc(100vh-8rem)] max-w-md px-5 py-12 sm:px-8 lg:py-20">
      <header className="ruled pb-6">
        <div className="margin" aria-hidden />
        <div className="column">
          <h1 className="text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-[14px] text-graphite">
            My Smart School
          </p>
        </div>
      </header>

      <div className="border-t-2 border-ink" />

      <div className="ruled pt-8">
        <div className="margin" aria-hidden />
        <div className="column">
          {/* Says what happened and what to do about it. */}
          {error && (
            <div
              role="alert"
              className="mb-6 border-l-2 border-mark bg-sheet px-4 py-3"
            >
              <p className="text-[15px] text-ink">{error}</p>
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-ink"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1.5 h-10 w-full rounded-[4px] border border-field bg-sheet px-3 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
              />
            </div>

            <div>
              <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-ink"
                >
                  Password
                </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1.5 h-10 w-full rounded-[4px] border border-field bg-sheet px-3 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-ink px-4 text-[15px] font-medium text-white transition-colors hover:bg-[#01243a] disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-rule" />
            <span className="text-[12px] text-graphite">or</span>
            <span className="h-px flex-1 bg-rule" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center gap-2.5 rounded-[4px] border border-rule bg-sheet px-4 text-[15px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.64 6.16-4.64z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-[14px] text-graphite">
            No account yet?{" "}
            <Link
              href="/signup"
              className="text-ink underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
