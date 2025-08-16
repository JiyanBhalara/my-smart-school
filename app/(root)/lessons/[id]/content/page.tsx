"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Image as ImageIcon,
  FileIcon,
  Presentation,
  Download,
  Eye,
  BookOpen,
  User
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

interface LessonContent {
  id: string;
  title: string;
  type: string;
  markdown?: string;
  fileName?: string;
  fileUrl?: string;
  createdAt: string;
  author: {
    name: string | null;
  };
}

interface Lesson {
  id: string;
  title: string;
  subject?: string;
  createdAt: string;
  tags: { tag: { name: string } }[];
  lessonContents: LessonContent[];
}

export default function AllContentPage({ params }: Props) {
  const [lessonId, setLessonId] = useState<string>("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setLessonId(id);
      
      // Fetch lesson data
      try {
        const response = await fetch(`/api/lessons/${id}/content`);
        if (!response.ok) {
          throw new Error('Failed to fetch lesson');
        }
        const lessonData = await response.json();
        setLesson(lessonData);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    getParams();
  }, [params]);

  const getContentIcon = (type: string) => {
    switch (type) {
      case "MARKDOWN":
        return <FileText className="h-6 w-6 text-blue-600" />;
      case "PDF":
        return <FileText className="h-6 w-6 text-red-600" />;
      case "DOC":
        return <FileIcon className="h-6 w-6 text-blue-700" />;
      case "PPT":
        return <Presentation className="h-6 w-6 text-orange-600" />;
      case "IMAGE":
        return <ImageIcon className="h-6 w-6 text-green-600" />;
      default:
        return <FileIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="h-12 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!lesson) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/lessons/${lessonId}`}
            className="cursor-pointer inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Lesson
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">All Content</h1>
                <p className="text-gray-600 mt-1">
                  Content from: <Link href={`/lessons/${lessonId}`} className="cursor-pointer text-indigo-600 hover:text-indigo-700 font-medium">{lesson.title}</Link>
                </p>
              </div>
            </div>

            {/* Lesson Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Subject: {lesson.subject}</span>
              <span>{lesson.lessonContents.length} content items</span>
              <span>Created {formatDate(lesson.createdAt)}</span>
            </div>

            {/* Tags */}
            {lesson.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {lesson.tags.map((tagObj: { tag: { name: string } }) => (
                  <span
                    key={tagObj.tag.name}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700"
                  >
                    {tagObj.tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {lesson.lessonContents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <BookOpen size={36} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Content Available</h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
              This lesson doesn&apos;t have any additional content yet. Check back later for materials and resources.
            </p>
            <Link
              href={`/lessons/${lessonId}`}
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 font-semibold rounded-xl transition-all duration-300 border border-indigo-200 hover:border-indigo-600"
            >
              <BookOpen size={18} />
              Back to Lesson
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {lesson.lessonContents.map((content: LessonContent) => (
              <div
                key={content.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {getContentIcon(content.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {content.title}
                      </h3>
                      
                      {content.type === "MARKDOWN" && content.markdown ? (
                        <div className="text-gray-700 mb-4">
                          <p className="line-clamp-3">
                            {content.markdown.replace(/[#*`_]/g, '').substring(0, 200)}
                            {content.markdown.length > 200 ? '...' : ''}
                          </p>
                        </div>
                      ) : content.fileName ? (
                        <p className="text-gray-600 mb-4">
                          📎 {content.fileName}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{content.author.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(content.createdAt)}</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {content.type}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        {content.type === "MARKDOWN" ? (
                          <Link
                            href={`/lessons/${lessonId}/content/${content.id}`}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Content
                          </Link>
                        ) : content.fileUrl ? (
                          <button
                            onClick={() => handleDownload(content.fileUrl!)}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download File
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href={`/lessons/${lessonId}`}
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson
          </Link>
        </div>
      </div>
    </main>
  );
}
