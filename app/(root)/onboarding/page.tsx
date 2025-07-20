// app/(root)/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Role = "STUDENT" | "TEACHER";

export default function Onboarding() {
  const router = useRouter();
  const { update } = useSession();

  const [form, setForm] = useState<{
    birthdate: string;
    school: string;
    role: Role;
  }>({
    birthdate: "",
    school: "",
    role: "STUDENT",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Failed to save onboarding data");
      setLoading(false);
      return;
    }

    // mark onboarding complete in the session so middleware stops redirecting
    await update({ profileComplete: true });

    // navigate to selfie step if teacher, otherwise home
    if (form.role === "TEACHER") {
      router.push("/onboarding/teacher-selfie");
    } else {
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded shadow p-6 space-y-5"
      >
        <h1 className="text-2xl font-semibold text-center">
          Tell us about you
        </h1>

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <label className="block text-sm">
          Birth-date
          <input
            type="date"
            required
            className="mt-1 w-full rounded border p-2"
            value={form.birthdate}
            onChange={(e) =>
              setForm((f) => ({ ...f, birthdate: e.target.value }))
            }
          />
        </label>

        <label className="block text-sm">
          School
          <input
            type="text"
            required
            className="mt-1 w-full rounded border p-2"
            value={form.school}
            onChange={(e) =>
              setForm((f) => ({ ...f, school: e.target.value }))
            }
          />
        </label>

        <fieldset className="flex gap-4 text-sm">
          <legend className="sr-only">Role</legend>
          {[
            { label: "Student", value: "STUDENT" },
            { label: "Teacher", value: "TEACHER" },
          ].map(({ label, value }) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value={value}
                checked={form.role === value}
                onChange={() =>
                  setForm((f) => ({ ...f, role: value as Role }))
                }
                className="h-4 w-4"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#219EBC] text-white rounded p-2 font-medium disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
