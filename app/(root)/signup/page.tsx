// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

      if (signInRes?.ok) router.push("/");
      else throw new Error("Autologin failed");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border p-6 shadow"
      >
        <h1 className="text-center text-2xl font-semibold">Create account</h1>

        {/* --- Google signup / login --- */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded border p-2 hover:bg-gray-50"
        >
          {/* simple G icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.66 1.22 9.13 3.59l6.83-6.83C35.36 2.34 29.97 0 24 0 14.66 0 6.63 5.17 2.69 12.77l7.95 6.2C13.05 12.96 18.17 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.1 24.46c0-1.57-.14-3.08-.39-4.54H24v8.59h12.34c-.53 2.71-2.13 5.02-4.54 6.58l7.3 5.66C43.84 36.8 46.1 30.96 46.1 24.46z"
            />
            <path
              fill="#FBBC05"
              d="M10.64 28.97a14.63 14.63 0 0 1-.81-4.51c0-1.57.29-3.09.81-4.51l-7.95-6.2A23.923 23.923 0 0 0 0 24.46c0 3.79.9 7.37 2.69 10.52l7.95-6.01z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.91-2.14 15.88-5.79l-7.3-5.66c-2.03 1.36-4.64 2.15-8.58 2.15-5.83 0-10.95-3.46-13.36-8.47l-7.95 6.01C6.63 42.83 14.66 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          <span>Sign up with Google</span>
        </button>

        <div className="relative">
          <hr className="border-t" />
          <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
            or
          </span>
        </div>

        {error && (
          <p className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-600 p-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full text-center text-sm text-blue-600 underline"
        >
          Already have an account? Log in
        </button>
      </form>
    </main>
  );
}
