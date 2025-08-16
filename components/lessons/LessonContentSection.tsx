// components/LessonContentSection.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Image as ImageIcon, 
  FileIcon, 
  Presentation,
  Download,
  Edit,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  BookOpen,
  X,
  Save,
  Eye,
  ExternalLink
} from "lucide-react";

interface LessonContent {
  id: string;
  title: string;
  type: "MARKDOWN" | "PDF" | "DOC" | "PPT" | "IMAGE" | "OTHER";
  markdown?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    role: string;
  };
}

interface LessonContentSectionProps {
  lessonId: string;
  isAuthor: boolean;
  isTeacher: boolean;
}

export default function LessonContentSection({ 
  lessonId, 
  isAuthor, 
  isTeacher 
}: LessonContentSectionProps) {
  const [contents, setContents] = useState<LessonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMarkdown, setEditMarkdown] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}/content`);
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        console.log(data);
        setContents(data.lessonContents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [lessonId]);

  const handleDelete = async (contentId: string) => {
    if (!window.confirm("Are you sure you want to delete this content?")) {
      return;
    }

    setDeletingId(contentId);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/content/${contentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete content");
      }

      setContents(contents.filter(content => content.id !== contentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (content: LessonContent) => {
    setEditingId(content.id);
    setEditTitle(content.title);
    setEditMarkdown(content.markdown || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/content/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          markdown: editMarkdown.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update content");
      }

      const data = await response.json();
      setContents(contents.map(content => 
        content.id === editingId ? data.content : content
      ));
      
      setEditingId(null);
      setEditTitle("");
      setEditMarkdown("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update content");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMarkdown("");
  };

  const handleDownload = async (content: LessonContent) => {
    if (!content.fileUrl) return;

    try {
      // For files stored in Supabase, we might need to generate a fresh download URL
      window.open(content.fileUrl, '_blank');
    } catch (err) {
      alert("Failed to download file");
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case "MARKDOWN":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "PDF":
        return <FileText className="h-5 w-5 text-red-600" />;
      case "DOC":
        return <FileIcon className="h-5 w-5 text-blue-700" />;
      case "PPT":
        return <Presentation className="h-5 w-5 text-orange-600" />;
      case "IMAGE":
        return <ImageIcon className="h-5 w-5 text-green-600" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <BookOpen size={28} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Lesson Content</h2>
              <p className="text-gray-600 mt-1">Loading content...</p>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading content...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 px-8 py-8">
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl border border-indigo-200">
              <BookOpen size={28} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Lesson Content</h2>
              <p className="text-gray-600 mt-1">
                {contents.length === 0
                  ? "No content available yet"
                  : `${contents.length} content item${contents.length === 1 ? "" : "s"} available`}
              </p>
            </div>
          </div>

          {/* Add Content Button - Only for lesson author and teacher */}
          {isAuthor && isTeacher && (
            <Link
              href={`/lessons/${lessonId}/add-content`}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              <Plus size={16} />
              <span>Add Content</span>
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {contents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <BookOpen size={36} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Content Available</h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
              Additional lesson content hasn't been added yet. {isAuthor && isTeacher ? "Click the 'Add Content' button above to get started." : "Check back later for materials and resources."}
            </p>
            {!isAuthor || !isTeacher ? (
              <Link
                href="/lessons"
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 font-semibold rounded-xl transition-all duration-300 border border-indigo-200 hover:border-indigo-600"
              >
                <BookOpen size={18} />
                Browse Other Lessons
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6">
              {contents.slice(0, 3).map((content) => (
                <div
                  key={content.id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200 group"
                >
                  {editingId === content.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Content title"
                      />
                      <textarea
                        value={editMarkdown}
                        onChange={(e) => setEditMarkdown(e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Content markdown"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="cursor-pointer px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          {getContentIcon(content.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {content.title}
                          </h3>
                          
                          {content.type === "MARKDOWN" && content.markdown ? (
                            <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                              {content.markdown.split('\n').slice(0, 3).map((line, i) => (
                                <p key={i} className="mb-1">
                                  {line || '\u00A0'}
                                </p>
                              ))}
                              {content.markdown.split('\n').length > 3 && (
                                <p className="text-gray-500 italic">...</p>
                              )}
                            </div>
                          ) : content.fileName ? (
                            <p className="text-gray-600 mb-3">
                              📎 {content.fileName}
                            </p>
                          ) : null}

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>By {content.author.name || "Unknown"}</span>
                            <span>•</span>
                            <span>{formatDate(content.createdAt)}</span>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                              {content.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* View Content button for markdown */}
                        {content.type === "MARKDOWN" && (
                          <Link
                            href={`/lessons/${lessonId}/content/${content.id}`}
                            className="cursor-pointer p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View content"
                          >
                            <Eye size={16} />
                          </Link>
                        )}
                        
                        {/* Download button for file types */}
                        {content.type !== "MARKDOWN" && content.fileUrl && (
                          <button
                            onClick={() => handleDownload(content)}
                            className="cursor-pointer p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download file"
                          >
                            <Download size={16} />
                          </button>
                        )}

                        {/* Edit/Delete buttons - Only for author and teacher */}
                        {isAuthor && isTeacher && (
                          <>
                            {content.type === "MARKDOWN" && (
                              <button
                                onClick={() => handleEdit(content)}
                                className="cursor-pointer p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit content"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(content.id)}
                              disabled={deletingId === content.id}
                              className="cursor-pointer p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete content"
                            >
                              {deletingId === content.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View All Content Button - Show when more than 3 items */}
            {contents.length > 3 && (
              <div className="text-center pt-6 border-t border-gray-200">
                <Link
                  href={`/lessons/${lessonId}/content`}
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <BookOpen size={18} />
                  View All Content ({contents.length})
                  <ExternalLink size={16} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
