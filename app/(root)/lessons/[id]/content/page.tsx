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
        return <FileText className="h-6 w-6 text-ink" />;
      case "PDF":
        return <FileText className="h-6 w-6 text-mark" />;
      case "DOC":
        return <FileIcon className="h-6 w-6 text-ink" />;
      case "PPT":
        return <Presentation className="h-6 w-6 text-mark" />;
      case "IMAGE":
        return <ImageIcon className="h-6 w-6 text-ink" />;
      default:
        return <FileIcon className="h-6 w-6 text-graphite" />;
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
      <main className="min-h-screen bg-[#edf2f5] pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="">
            <div className="h-8 bg-[#edf2f5] rounded w-32 mb-6"></div>
            <div className="bg-white rounded-[4px] border border-rule p-8">
              <div className="h-12 bg-[#edf2f5] rounded w-64 mb-4"></div>
              <div className="h-4 bg-[#edf2f5] rounded w-96"></div>
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
    <main className="min-h-screen bg-[#edf2f5] pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/lessons/${lessonId}`}
            className="cursor-pointer inline-flex items-center gap-2 text-ink hover:text-ink font-medium mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-colors duration-200" />
            Back to Lesson
          </Link>

          <div className="bg-white rounded-[4px] border border-rule p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[#edf2f5] rounded-[4px]">
                <BookOpen className="h-8 w-8 text-ink" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-ink">All Content</h1>
                <p className="text-graphite mt-1">
                  Content from: <Link href={`/lessons/${lessonId}`} className="cursor-pointer text-ink hover:text-ink font-medium">{lesson.title}</Link>
                </p>
              </div>
            </div>

            {/* Lesson Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-graphite">
              <span className="font-medium text-ink">Subject: {lesson.subject}</span>
              <span>{lesson.lessonContents.length} content items</span>
              <span>Created {formatDate(lesson.createdAt)}</span>
            </div>

            {/* Tags */}
            {lesson.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {lesson.tags.map((tagObj: { tag: { name: string } }) => (
                  <span
                    key={tagObj.tag.name}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sheet text-ink"
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
          <div className="bg-white rounded-[4px] border border-rule p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-sheet rounded-[4px] flex items-center justify-center">
              <BookOpen size={36} className="text-graphite" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-3">No Content Available</h3>
            <p className="text-graphite mb-8 max-w-lg mx-auto leading-relaxed">
              This lesson doesn&apos;t have any additional content yet. Check back later for materials and resources.
            </p>
            <Link
              href={`/lessons/${lessonId}`}
              className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-ink hover:text-white bg-[#edf2f5] hover:bg-ink font-semibold rounded-[4px] transition-colors border border-ink hover:border-ink"
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
                className="bg-white rounded-[4px] border border-rule p-6 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-[#edf2f5] rounded-[4px] border border-rule">
                      {getContentIcon(content.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-ink mb-2">
                        {content.title}
                      </h3>
                      
                      {content.type === "MARKDOWN" && content.markdown ? (
                        <div className="text-ink mb-4">
                          <p className="line-clamp-3">
                            {content.markdown.replace(/[#*`_]/g, '').substring(0, 200)}
                            {content.markdown.length > 200 ? '...' : ''}
                          </p>
                        </div>
                      ) : content.fileName ? (
                        <p className="text-graphite mb-4">
                          📎 {content.fileName}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-4 text-sm text-graphite mb-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{content.author.name || "Unknown"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(content.createdAt)}</span>
                        </div>
                        <span className="px-2 py-1 bg-[#edf2f5] text-ink rounded text-xs font-medium">
                          {content.type}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3">
                        {content.type === "MARKDOWN" ? (
                          <Link
                            href={`/lessons/${lessonId}/content/${content.id}`}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-ink text-white font-medium rounded-[4px] hover:bg-ink transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View Content
                          </Link>
                        ) : content.fileUrl ? (
                          <button
                            onClick={() => handleDownload(content.fileUrl!)}
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-ink text-white font-medium rounded-[4px] hover:bg-ink transition-colors"
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
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#edf2f5] text-ink font-medium rounded-[4px] hover:bg-[#edf2f5] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lesson
          </Link>
        </div>
      </div>
    </main>
  );
}
