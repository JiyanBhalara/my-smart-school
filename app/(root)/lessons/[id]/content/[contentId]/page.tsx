// app/lessons/[id]/content/[contentId]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  BookOpen,
  Tag as TagIcon
} from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import EditableMarkdownWrapper from "@/components/EditableMarkdownWrapper";

type Props = {
  params: Promise<{ id: string; contentId: string }>;
};

export default async function ContentDetailPage({ params }: Props) {
  const { id, contentId } = await params;

  const session = await getServerSession(authOptions);

  // Fetch content and lesson details
  const content = await prisma.lessonContent.findUnique({
    where: { id: contentId },
    include: {
      lesson: {
        include: {
          tags: { include: { tag: true } }
        }
      },
      author: {
        select: { id: true, name: true, role: true }
      }
    }
  });

  if (!content || content.lessonId !== id) {
    notFound();
  }

  // Only allow viewing markdown content
  if (content.type !== "MARKDOWN") {
    notFound();
  }

  const isTeacher = session?.user?.role === "TEACHER";
  const isAuthor = isTeacher && session.user?.id === content.lesson.authorId;

  return (
    <main className="sheet-page mx-auto w-full max-w-5xl py-10 bg-[#edf2f5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/lessons/${id}`}
            className="cursor-pointer inline-flex items-center gap-2 text-ink hover:text-ink font-medium mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-colors duration-200" />
            Back to Lesson
          </Link>

          <div className="bg-white rounded-[4px] border border-rule p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#edf2f5] rounded-[4px]">
                    <FileText className="h-6 w-6 text-ink" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-ink">{content.title}</h1>
                    <p className="text-graphite mt-1">
                      From lesson: <Link href={`/lessons/${id}`} className="cursor-pointer text-ink hover:text-ink font-medium">{content.lesson.title}</Link>
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-graphite">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>By {content.author.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {content.createdAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    <span className="px-2 py-1 bg-[#edf2f5] text-ink rounded text-xs font-medium">
                      MARKDOWN
                    </span>
                  </div>
                </div>

                {/* Lesson Tags */}
                {content.lesson.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {content.lesson.tags.map(({ tag }) => (
                      <span
                        key={tag.name}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sheet text-ink"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content with EditableMarkdownWrapper */}
        <div className="bg-white rounded-[4px] border border-rule overflow-hidden">
          <div className="bg-sheet border-b border-rule px-8 py-6">
            <h2 className="text-xl font-semibold text-ink">Content</h2>
          </div>
          
          <div className="p-0">
            <EditableMarkdownWrapper
              initialContent={content.markdown || ""}
              lessonId={id}
              contentId={content.id}
              title={content.title}
              canEdit={isAuthor}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href={`/lessons/${id}`}
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#edf2f5] text-ink font-medium rounded-[4px] hover:bg-[#edf2f5] transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Back to Lesson
          </Link>
          
          <Link
            href={`/lessons/${id}/content`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-white font-medium rounded-[4px] hover:bg-ink transition-colors"
          >
            View All Content
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>
    </main>
  );
}
