import { Suspense } from "react";
import prisma from "@/lib/prisma";
import LessonRow from "@/components/LessonRow";
import SearchAndFilter from "@/components/lessons/SearchAndFilter";
import Link from "next/link";

type LessonWithTags = {
  id: string;
  title: string;
  subject: string;
  fileUrl: string;
  createdAt: Date;
  tags: { tag: { name: string } }[];
};

interface LessonsPageProps {
  searchParams: Promise<{ search?: string; subject?: string }>;
}

async function getLessons(searchTerm?: string, subjectFilter?: string) {
  const where = {
    AND: [
      searchTerm ? {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' as const } },
          { subject: { contains: searchTerm, mode: 'insensitive' as const } },
          { 
            tags: { 
              some: { 
                tag: { 
                  name: { contains: searchTerm, mode: 'insensitive' as const } 
                } 
              } 
            } 
          }
        ]
      } : {},
      subjectFilter ? { subject: { equals: subjectFilter } } : {}
    ].filter(condition => Object.keys(condition).length > 0)
  };

  return await prisma.lesson.findMany({
    where: Object.keys(where.AND).length > 0 ? where : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
    },
  }) as LessonWithTags[];
}

async function LessonsContent({ searchParams }: LessonsPageProps) {
  const params = await searchParams;
  const lessons = await getLessons(params.search, params.subject);
  const allLessons = await prisma.lesson.findMany({
    select: { subject: true },
    orderBy: { subject: "asc" }
  });

  const totalLessons = await prisma.lesson.count();
  const subjects = Array.from(new Set(allLessons.map(lesson => lesson.subject)));
  const filteredCount = lessons.length;
  const filtering = Boolean(params.search || params.subject);

  return (
    <div className="ruled-page mx-auto min-h-[calc(100vh-8rem)] max-w-4xl px-5 py-10 sm:px-8 lg:py-14">
      {/* Masthead. The count is the only number here, so it carries no
          decoration -- three stat cards would have been three boxes. */}
      <header className="ruled pb-6">
        <div className="margin" aria-hidden />
        <div className="column">
          <h1 className="text-[30px] font-bold leading-[34px] tracking-[-0.02em] text-ink">
            Lessons
          </h1>
          <p className="mt-1 text-[14px] text-graphite tabular">
            {filtering
              ? `${filteredCount} of ${totalLessons} lessons`
              : `${totalLessons} ${totalLessons === 1 ? "lesson" : "lessons"} across ${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}`}
          </p>
        </div>
      </header>

      <div className="ruled border-t-2 border-ink pt-5">
        <div className="margin" aria-hidden />
        <div className="column">
          <SearchAndFilter
            subjects={subjects}
            currentSearch={params.search || ""}
            currentSubject={params.subject || ""}
          />
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="ruled mt-8 border-t border-rule pt-10">
          <div className="margin" aria-hidden />
          <div className="column max-w-md">
            {filtering ? (
              <>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
                  Nothing matched that
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-graphite">
                  No lesson matches{" "}
                  {params.search ? <>the search &ldquo;{params.search}&rdquo;</> : null}
                  {params.search && params.subject ? " in " : null}
                  {params.subject ? <>{params.subject}</> : null}. Clear the
                  filters to see everything.
                </p>
                <Link
                  href="/lessons"
                  className="mt-5 inline-flex h-9 items-center rounded-[4px] border border-ink px-4 text-[14px] font-medium text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Clear filters
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">
                  No lessons yet
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-graphite">
                  Lessons you publish will be listed here, newest first. Start
                  with a title and a subject; you can add materials, videos and
                  quizzes afterwards.
                </p>
                <Link
                  href="/teacher/lessons/new"
                  className="mt-5 inline-flex h-9 items-center rounded-[4px] bg-ink px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#01243a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Write a lesson
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          {filtering && (
            <div className="ruled pb-3">
              <div className="margin" aria-hidden />
              <div className="column flex flex-wrap items-center gap-3 text-[13px] text-graphite">
                {params.search && <span>Search &ldquo;{params.search}&rdquo;</span>}
                {params.subject && <span>Subject {params.subject}</span>}
                <Link
                  href="/lessons"
                  className="text-ink underline decoration-rule underline-offset-[3px] hover:decoration-ink"
                >
                  Clear
                </Link>
              </div>
            </div>
          )}

          <div className="border-b border-rule">
            {lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                id={lesson.id}
                title={lesson.title}
                subject={lesson.subject}
                createdAt={lesson.createdAt}
                tags={lesson.tags}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
          <p className="text-[14px] text-graphite">Loading lessons</p>
        </div>
      }
    >
      <LessonsContent searchParams={searchParams} />
    </Suspense>
  );
}
