// app/teacher/lessons/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Upload, 
  BookOpen, 
  Tag, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  ArrowLeft,
  Check
} from "lucide-react";

export default function NewLessonPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect non-teachers back home
  useEffect(() => {
    if (status === "authenticated" && session.user.role !== "TEACHER") {
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

  const fileTypes = [
    {
      id: "word",
      name: "Word Document",
      icon: <FileText className="w-8 h-8" />,
      description: ".doc, .docx",
      color: "bg-ink"
    },
    {
      id: "pdf",
      name: "PDF Document",
      icon: <FileSpreadsheet className="w-8 h-8" />,
      description: ".pdf",
      color: "from-red-500 to-red-600"
    },
    {
      id: "ppt",
      name: "PowerPoint",
      icon: <Presentation className="w-8 h-8" />,
      description: ".ppt, .pptx",
      color: "from-orange-500 to-orange-600"
    }
  ];

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
      title: title.trim(),
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

  // While session is loading, don't flash the form
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sheet">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sheet p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="cursor-pointer mt-5 cursor-pointer flex items-center gap-2 text-white hover:text-mark transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Lessons</span>
        </button>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-sheet rounded-[4px] mb-6">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Upload New Lesson
          </h1>
          <p className="text-graphite text-lg max-w-2xl mx-auto">
            Share your educational content with students and enhance their learning experience
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[4px] border border-rule overflow-hidden">
          <div className="bg-sheet p-6">
            <h2 className="text-xl font-semibold text-white">Lesson Details</h2>
            <p className="text-graphite text-sm mt-1">Fill in the information about your lesson</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-[#fdf3f2] border border-mark rounded-[4px] p-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-mark rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-mark text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-ink">
                <BookOpen className="w-5 h-5 text-ink" />
                Lesson Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 border-2 border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-ink transition-colors bg-white text-ink placeholder-gray-500 text-base"
                placeholder="Enter a descriptive title for your lesson"
              />
            </div>

            {/* Subject Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-ink">
                <BookOpen className="w-5 h-5 text-ink" />
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-5 py-4 border-2 border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-ink transition-colors bg-white text-ink placeholder-gray-500 text-base"
                placeholder="e.g., Mathematics, Science, History"
              />
            </div>

            {/* File Type Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-base font-semibold text-ink">
                <FileText className="w-5 h-5 text-ink" />
                File Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {fileTypes.map((fileType) => (
                  <button
                    key={fileType.id}
                    type="button"
                    onClick={() => setType(fileType.id)}
                    className={`cursor-pointer relative p-6 rounded-[4px] border-2 transition-colors ${ type === fileType.id ? 'border-ink bg-sheet ' : 'border-rule bg-white hover:border-ink ' }`}
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-[4px] ${fileType.color} mb-4 text-white`}>
                      {fileType.icon}
                    </div>
                    <h3 className="font-semibold text-ink text-lg mb-1">{fileType.name}</h3>
                    <p className="text-graphite text-sm">{fileType.description}</p>
                    {type === fileType.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-ink rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-ink">
                <Tag className="w-5 h-5 text-ink" />
                Tags
                <span className="text-graphite font-normal text-sm">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-5 py-4 border-2 border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-ink transition-colors bg-white text-ink placeholder-gray-500 text-base"
                placeholder="photosynthesis, ecosystem, biology, grade-8"
              />
              <p className="text-sm text-graphite">
                Add relevant keywords to help students find your lesson
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-ink">
                <Upload className="w-5 h-5 text-ink" />
                Upload File
              </label>
              <div className="relative">
                <div className={`border-3 border-dashed rounded-[4px] p-8 text-center transition-colors ${ file ? 'border-ink bg-[#edf2f5]' : 'border-rule bg-[#edf2f5] hover:border-ink hover:bg-ink' }`}>
                  {!file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-sheet rounded-[4px] flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-ink font-medium text-lg mb-2">Choose your lesson file</p>
                        <p className="text-graphite text-sm">Drag and drop or click to browse</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-ink rounded-[4px] flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-ink">{file.name}</p>
                        <p className="text-graphite text-sm">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="*/*"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-ink text-white font-bold py-5 px-8 rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:] flex items-center justify-center gap-3 text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Uploading Lesson...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span>Upload Lesson</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full">
            <div className="w-2 h-2 bg-ink rounded-full"></div>
            <p className="text-white text-sm font-medium">
              Supported formats: Word, PDF, PowerPoint files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}