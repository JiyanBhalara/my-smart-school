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

  const fileTypes = [
    {
      id: "word",
      name: "Word Document",
      icon: <FileText className="w-8 h-8" />,
      description: ".doc, .docx",
      color: "from-blue-500 to-blue-600"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8ECAE6] via-[#219EBC] to-[#023047]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#023047] via-[#219EBC] to-[#8ECAE6] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="mt-5 cursor-pointer flex items-center gap-2 text-white hover:text-[#FFB703] transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Lessons</span>
        </button>
        
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FFB703] to-[#FB8500] rounded-2xl shadow-xl mb-6">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Upload New Lesson
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Share your educational content with students and enhance their learning experience
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#023047] to-[#219EBC] p-6">
            <h2 className="text-xl font-semibold text-white">Lesson Details</h2>
            <p className="text-white/80 text-sm mt-1">Fill in the information about your lesson</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-[#023047]">
                <BookOpen className="w-5 h-5 text-[#219EBC]" />
                Lesson Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#219EBC] focus:border-[#219EBC] transition-all duration-200 bg-white text-[#023047] placeholder-gray-500 text-base"
                placeholder="Enter a descriptive title for your lesson"
              />
            </div>

            {/* Subject Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-[#023047]">
                <BookOpen className="w-5 h-5 text-[#219EBC]" />
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#219EBC] focus:border-[#219EBC] transition-all duration-200 bg-white text-[#023047] placeholder-gray-500 text-base"
                placeholder="e.g., Mathematics, Science, History"
              />
            </div>

            {/* File Type Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-base font-semibold text-[#023047]">
                <FileText className="w-5 h-5 text-[#219EBC]" />
                File Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {fileTypes.map((fileType) => (
                  <button
                    key={fileType.id}
                    type="button"
                    onClick={() => setType(fileType.id)}
                    className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 ${
                      type === fileType.id
                        ? 'border-[#219EBC] bg-gradient-to-br from-[#8ECAE6]/20 to-[#219EBC]/20 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-[#8ECAE6] hover:shadow-md'
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${fileType.color} mb-4 text-white shadow-lg`}>
                      {fileType.icon}
                    </div>
                    <h3 className="font-semibold text-[#023047] text-lg mb-1">{fileType.name}</h3>
                    <p className="text-gray-600 text-sm">{fileType.description}</p>
                    {type === fileType.id && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#219EBC] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-[#023047]">
                <Tag className="w-5 h-5 text-[#219EBC]" />
                Tags
                <span className="text-gray-500 font-normal text-sm">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#219EBC] focus:border-[#219EBC] transition-all duration-200 bg-white text-[#023047] placeholder-gray-500 text-base"
                placeholder="photosynthesis, ecosystem, biology, grade-8"
              />
              <p className="text-sm text-gray-600">
                Add relevant keywords to help students find your lesson
              </p>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-base font-semibold text-[#023047]">
                <Upload className="w-5 h-5 text-[#219EBC]" />
                Upload File
              </label>
              <div className="relative">
                <div className={`border-3 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  file 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-[#219EBC] hover:bg-[#8ECAE6]/10'
                }`}>
                  {!file ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#8ECAE6] to-[#219EBC] rounded-xl flex items-center justify-center">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-[#023047] font-medium text-lg mb-2">Choose your lesson file</p>
                        <p className="text-gray-600 text-sm">Drag and drop or click to browse</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#023047]">{file.name}</p>
                        <p className="text-gray-600 text-sm">
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
                className="cursor-pointer w-full bg-gradient-to-r from-[#FFB703] to-[#FB8500] hover:from-[#FB8500] hover:to-[#FFB703] text-white font-bold py-5 px-8 rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
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
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-white text-sm font-medium">
              Supported formats: Word, PDF, PowerPoint files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}