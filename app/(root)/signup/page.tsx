"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(checkPasswordStrength(value));
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/onboarding" });
    } catch {
      setError("Google sign-up failed. Please try again.");
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Signup failed");
      }

      // auto-login with credentials
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.ok) router.push("/onboarding");
      else throw new Error("Account created successfully! Please sign in.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="ruled-page mx-auto min-h-[34rem] max-w-md py-12 lg:py-20">
      <header className="ruled pb-6">
        <div className="margin" aria-hidden />
        <div className="column">
          <h1 className="text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-ink">
            Create an account
          </h1>
          <p className="mt-1 text-[14px] text-graphite">My Smart School</p>
        </div>
      </header>

      <div className="border-t-2 border-ink" />

      <div className="ruled pt-8">
        <div className="margin" aria-hidden />
        <div className="column">
          {error && (
            <div
              role="alert"
              className="mb-6 border-l-2 border-mark bg-sheet px-4 py-3"
            >
              <p className="text-[15px] text-ink">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-ink">
                Your name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="mt-1.5 h-10 w-full rounded-[4px] border border-rule bg-sheet px-3 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-ink">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1.5 h-10 w-full rounded-[4px] border border-rule bg-sheet px-3 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 h-10 w-full rounded-[4px] border border-rule bg-sheet px-3 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
              />
              {/* Strength as four ruled segments, described in words as well as
                  filled, since the bar alone tells a screen reader nothing. */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`h-[3px] flex-1 ${ i < passwordStrength ? "bg-ink" : "bg-rule" }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[12px] text-graphite">
                    {["Too short", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                    {passwordStrength < 2 &&
                      " — add a capital, a number or a symbol"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[13px] font-medium text-ink"
              >
                Password again
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 h-10 w-full rounded-[4px] border border-rule bg-sheet px-3 text-[15px] text-ink placeholder:text-graphite/70 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-ink"
              />
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1.5 text-[12px] text-mark">
                  The two passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-[4px] bg-ink px-4 text-[15px] font-medium text-white transition-colors hover:bg-[#01243a] disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-rule" />
            <span className="text-[12px] text-graphite">or</span>
            <span className="h-px flex-1 bg-rule" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
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
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-ink underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
