// app/lessons/[id]/add-content/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Image as ImageIcon,
  FileIcon,
  Presentation,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  authorId: string;
}

type ContentType = "MARKDOWN" | "PDF" | "DOC" | "PPT" | "IMAGE" | "OTHER";

export default function AddContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [contentType, setContentType] = useState<ContentType>("MARKDOWN");
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
    contentType: ContentType;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redirect if not authenticated or not teacher
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user?.role !== "TEACHER") {
      router.push("/");
      return;
    }
  }, [session, status, router]);

  // Fetch lesson data
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/teacher/lessons/${lessonId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch lesson");
        }
        const data = await response.json();
        setLesson(data);

        // Check if user is the author
        if (data.authorId !== session?.user?.id) {
          router.push(`/lessons/${lessonId}`);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    };

    if (lessonId && session?.user?.role === "TEACHER") {
      fetchLesson();
    }
  }, [lessonId, session, router]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [markdown]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lessonId", lessonId);

      const response = await fetch("/api/lessons/content/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const uploadData = await response.json();
      setUploadedFile({
        url: uploadData.fileUrl,
        name: uploadData.fileName,
        type: uploadData.fileType,
        size: uploadData.fileSize,
        contentType: uploadData.contentType as ContentType
      });
      setContentType(uploadData.contentType as ContentType);
      
      // Set default title if empty
      if (!title) {
        setTitle(uploadData.fileName.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Validate form
      if (!title.trim()) {
        throw new Error("Title is required");
      }

      if (contentType === "MARKDOWN" && !markdown.trim()) {
        throw new Error("Content is required for markdown type");
      }

      if (contentType !== "MARKDOWN" && !uploadedFile) {
        throw new Error("File upload is required for file types");
      }

      const response = await fetch(`/api/lessons/${lessonId}/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          type: contentType,
          markdown: contentType === "MARKDOWN" ? markdown.trim() : null,
          fileUrl: uploadedFile?.url || null,
          fileName: uploadedFile?.name || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create content");
      }

      // Redirect back to lesson
      router.push(`/lessons/${lessonId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setSaving(false);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setContentType("MARKDOWN");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
    if (type === "application/pdf") return <FileText className="h-5 w-5" />;
    if (type.includes("presentation")) return <Presentation className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (status === "loading" || loading) {
    return (
      <div className="sheet-page mx-auto w-full max-w-5xl py-10 bg-[#edf2f5] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-ink" />
          <span className="text-graphite">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="sheet-page mx-auto w-full max-w-5xl py-10 bg-[#edf2f5] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-mark mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ink mb-2">Error</h2>
          <p className="text-graphite mb-4">{error}</p>
          <Link
            href="/lessons"
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-[4px] hover:bg-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sheet-page mx-auto w-full max-w-5xl py-10 bg-[#edf2f5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/lessons/${lessonId}`}
            className="cursor-pointer inline-flex items-center gap-2 text-ink hover:text-ink font-medium mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson
          </Link>
          <h1 className="text-3xl font-bold text-ink">Add Content</h1>
          <p className="text-graphite mt-2">
            Add new content to &quot;{lesson?.title}&quot;
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-[#fdf3f2] border border-mark rounded-[4px] p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-mark flex-shrink-0" />
              <p className="text-mark">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[4px] border border-rule overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-rule bg-sheet">
            <h2 className="text-xl font-semibold text-ink">Content Details</h2>
          </div>

          <div className="p-8 space-y-8">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
                Content Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-rule rounded-[4px] focus:ring-2 focus:ring-ink focus:border-ink transition-colors"
                placeholder="Enter content title"
              />
            </div>

            {/* Content Type Selection */}
            <div>
              <label className="block text-sm font-medium text-ink mb-4">
                Content Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Markdown Option */}
                <div
                  className={`relative border-2 rounded-[4px] p-4 cursor-pointer transition-all ${ contentType === "MARKDOWN" && !uploadedFile ? "border-ink bg-[#edf2f5]" : "border-rule hover:border-rule" }`}
                  onClick={() => {
                    setContentType("MARKDOWN");
                    clearUploadedFile();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-ink" />
                    <div>
                      <h3 className="font-medium text-ink">Text Content</h3>
                      <p className="text-sm text-graphite">Write content with markdown support</p>
                    </div>
                  </div>
                  {contentType === "MARKDOWN" && !uploadedFile && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-ink rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload Option */}
                <div
                  className={`relative border-2 rounded-[4px] p-4 cursor-pointer transition-all ${ uploadedFile ? "border-ink bg-[#edf2f5]" : "border-rule hover:border-rule" }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex items-center gap-3">
                    <Upload className="h-6 w-6 text-ink" />
                    <div>
                      <h3 className="font-medium text-ink">File Upload</h3>
                      <p className="text-sm text-graphite">Upload PDF, DOC, PPT, or images</p>
                    </div>
                  </div>
                  {uploadedFile && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-ink rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                className="hidden"
              />
            </div>

            {/* Uploaded File Display */}
            {uploadedFile && (
              <div className="bg-[#edf2f5] rounded-[4px] p-4 border border-rule">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(uploadedFile.type)}
                    <div>
                      <h4 className="font-medium text-ink">{uploadedFile.name}</h4>
                      <p className="text-sm text-graphite">
                        {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearUploadedFile}
                    className="cursor-pointer p-1 hover:bg-[#edf2f5] rounded-[4px] transition-colors"
                  >
                    <X className="h-4 w-4 text-graphite" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-[#edf2f5] rounded-[4px] p-4 border border-ink">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-ink" />
                  <span className="text-ink">Uploading file...</span>
                </div>
              </div>
            )}

            {/* Markdown Editor */}
            {contentType === "MARKDOWN" && !uploadedFile && (
              <div>
                <label htmlFor="markdown" className="block text-sm font-medium text-ink mb-2">
                  Content *
                </label>
                <div className="border border-rule rounded-[4px] overflow-hidden">
                  <div className="bg-[#edf2f5] px-4 py-2 border-b border-rule">
                    <p className="text-xs text-graphite">
                      Supports <strong>**bold**</strong>, <em>*italic*</em>, # headings, - lists, and more
                    </p>
                  </div>
                  <textarea
                    ref={textareaRef}
                    id="markdown"
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    required={contentType === "MARKDOWN"}
                    className="w-full px-4 py-3 border-0 focus:ring-2 focus:ring-ink resize-none"
                    placeholder="Write your content here... You can use markdown formatting"
                    rows={10}
                    style={{ minHeight: "200px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-[#edf2f5] border-t border-rule flex justify-end gap-4">
            <Link
              href={`/lessons/${lessonId}`}
              className="cursor-pointer px-6 py-2 text-ink bg-white border border-rule rounded-[4px] hover:bg-[#edf2f5] font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-2 bg-ink text-white font-medium rounded-[4px] hover:bg-ink disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Content
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
