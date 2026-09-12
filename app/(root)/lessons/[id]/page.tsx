import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { subjectCode, subjectTint } from "@/lib/subject";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import QuizCard from "@/components/QuizCard";
import LessonActionsClient from "@/components/lessons/LessonActionsClient";
import LessonContentSection from "@/components/lessons/LessonContentSection";
import LessonVideoSection from "@/components/LessonVideoSection";
import QuizDeleteActions from "@/components/lessons/QuizDeleteActions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ noMaterial?: string }>;
};

export default async function LessonDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { noMaterial } = await searchParams;

  const session = await getServerSession(authOptions);
  const isTeacher = !!session && session.user?.role === "TEACHER";
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  // Updated query to include lesson content and videos
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      quizzes: {
        orderBy: { createdAt: "desc" },
        include: {
          attempts: userId
            ? {
                where: { studentId: userId },
                orderBy: { completedAt: "desc" }
              }
            : false
        }
      },
      tags: { include: { tag: true } },
      lessonContents: {
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true, role: true }
          }
        }
      },
      videos: {
        where: { uploadStatus: 'COMPLETED' },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!lesson) notFound();

  const recentQuizzes = lesson.quizzes.slice(0, 2);
  const hasMoreQuizzes = lesson.quizzes.length > 2;
  
  // UPDATED: Only lesson author can add/delete quizzes (must be both TEACHER and lesson author)
  const isAuthor = isTeacher && session.user?.id === lesson.authorId;

  return (
    <main className="ruled-page mx-auto min-h-[34rem] max-w-4xl py-10 lg:py-14">
      {/* Raised only when the download had nothing to give. Stated plainly,
          with the next step, rather than an apology. */}
      {noMaterial === "1" && (
        <div className="ruled mb-8">
          <div className="margin" aria-hidden />
          <div className="column border-l-2 border-mark bg-sheet px-4 py-3">
            <p className="text-[15px] font-medium text-ink">
              This lesson has no material attached
            </p>
            <p className="mt-1 text-[14px] text-graphite">
              Nothing has been uploaded for it yet. The videos and quizzes below
              are unaffected.
            </p>
          </div>
        </div>
      )}

      {/* Masthead. Subject lives in the margin, as it does on every row of the
          index, so the same object reads the same way in both places. */}
      <header className="ruled pb-6">
        <div className="margin flex flex-row-reverse items-center justify-end gap-2 sm:flex-row sm:items-start sm:justify-end sm:pt-[10px]">
          <span className="text-[11px] font-semibold text-graphite">
            {subjectCode(lesson.subject)}
          </span>
          <span
            aria-hidden
            className="subject-tab h-4 self-start"
            style={{ background: subjectTint(lesson.subject) }}
          />
        </div>
        <div className="column">
          <h1 className="text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-ink">
            {lesson.title}
          </h1>
          <p className="mt-1.5 text-[14px] text-graphite">
            {lesson.subject}
            {lesson.tags.length > 0 && (
              <span className="ml-5">
                {lesson.tags.map((t) => t.tag.name).join(", ")}
              </span>
            )}
          </p>
          <p className="mt-1 text-[13px] text-graphite tabular">
            Added{" "}
            {lesson.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/api/lessons/${lesson.id}/download`}
              target="_blank"
              className="inline-flex h-9 items-center gap-2 rounded-[4px] border border-ink px-4 text-[14px] font-medium text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <FileText size={15} />
              Open material
            </Link>

            {isAuthor && (
              <Link
                href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Plus size={15} />
                Write a quiz
              </Link>
            )}
          </div>

          {isAuthor && (
            <div className="mt-4">
              <LessonActionsClient
                lessonId={lesson.id}
                isAuthor={isAuthor}
                lessonTitle={lesson.title}
                quizCount={lesson.quizzes.length}
              />
            </div>
          )}
        </div>
      </header>

      <div className="border-t-2 border-ink" />

      <section className="ruled pt-8">
        <div className="margin" aria-hidden />
        <div className="column">
          <LessonContentSection
            lessonId={lesson.id}
            isAuthor={isAuthor}
            isTeacher={isTeacher}
          />
        </div>
      </section>

      <section className="ruled pt-10">
        <div className="margin" aria-hidden />
        <div className="column">
          <LessonVideoSection lessonId={lesson.id} isAuthor={isAuthor} />
        </div>
      </section>

      <section className="ruled pt-10">
        <div className="margin" aria-hidden />
        <div className="column">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
            <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
              Quizzes
            </h2>
            <p className="text-[13px] text-graphite tabular">
              {lesson.quizzes.length === 0
                ? "None yet"
                : `${lesson.quizzes.length} ${lesson.quizzes.length === 1 ? "quiz" : "quizzes"}`}
            </p>
          </div>

          {isAuthor && lesson.quizzes.length > 0 && (
            <div className="flex justify-end pt-3">
              <QuizDeleteActions
                lessonId={lesson.id}
                isAuthor={isAuthor}
                variant="all"
                quizCount={lesson.quizzes.length}
              />
            </div>
          )}

          {recentQuizzes.length === 0 ? (
            <div className="max-w-md py-8">
              <p className="text-[15px] leading-relaxed text-graphite">
                {isAuthor
                  ? "No quizzes on this lesson yet. A quiz is a set of multiple-choice questions; students get a mark as soon as they submit."
                  : "No quizzes on this lesson yet. When your teacher adds one it will appear here."}
              </p>
              {isAuthor && (
                <Link
                  href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                  className="mt-4 inline-flex h-9 items-center rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Write a quiz
                </Link>
              )}
            </div>
          ) : (
            <div>
              {recentQuizzes.map((quiz, index) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  lessonId={lesson.id}
                  index={index}
                  userId={userId}
                  userRole={userRole}
                />
              ))}

              {hasMoreQuizzes && (
                <Link
                  href={`/lessons/${lesson.id}/quizzes`}
                  className="mt-4 inline-block text-[14px] text-ink underline decoration-rule underline-offset-[3px] transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  See all {lesson.quizzes.length} quizzes
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
