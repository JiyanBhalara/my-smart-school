// app/teacher/lessons/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewLessonPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect non-teachers back home
  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "TEACHER") {
      console.log(session.user);
      router.replace("/");
    }
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, session, router]);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("ppt");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!file) {
      setError("Please select a file.");
      setLoading(false);
      return;
    }

    const meta = {
      title:   title.trim(),
      subject: subject.trim(),
      type,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("meta", JSON.stringify(meta));

    const res = await fetch("/api/teacher/lessons", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Upload failed");
      setLoading(false);
      return;
    }

    router.push("/lessons");
  }

  // While session is loading, don’t flash the form
  if (status === "loading") return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded shadow p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">
          Upload New Lesson
        </h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <label className="block">
          <span className="text-sm font-medium">Title</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Subject</span>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded border p-2"
          >
            <option value="ppt">PowerPoint</option>
            <option value="video">Video</option>
            <option value="scratch">Scratch</option>
            <option value="canva">Canva</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">
            Tags <span className="text-gray-500">(comma-separated)</span>
          </span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="mt-1 w-full rounded border p-2"
            placeholder="e.g. photosynthesis, ecosystem"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Lesson File</span>
          <input
            type="file"
            accept="*/*"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#219EBC] text-white rounded p-2 font-medium disabled:opacity-50"
        >
          {loading ? "Uploading…" : "Upload Lesson"}
        </button>
      </form>
    </main>
  );
}
