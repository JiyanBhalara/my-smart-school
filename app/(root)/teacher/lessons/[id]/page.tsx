// app/teacher/lessons/[id]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type LessonDetailProps = {
  params: { id: string };
};

export default async function LessonDetail({ params }: LessonDetailProps) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      quizzes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lesson) {
    // show 404 if invalid id
    notFound();
  }

  return (
    <main className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <p className="text-gray-600">{lesson.subject} — {lesson.type.toUpperCase()}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {lesson.tags.map(({ tag }) => (
            <span
              key={tag.name}
              className="bg-[#FFB703] text-[#023047] px-2 py-1 rounded-full text-sm"
            >
              {tag.name}
            </span>
          ))}
        </div>
        <Link
          href={lesson.fileUrl}
          target="_blank"
          className="inline-block mt-4 text-sm underline text-[#219EBC]"
        >
          Download / View File
        </Link>
      </header>

      <section className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quizzes</h2>
          <Link
            href={`/teacher/lessons/${lesson.id}/quizzes/new`}
            className="bg-[#219EBC] text-white px-4 py-2 rounded"
          >
            + New Quiz
          </Link>
        </div>

        {lesson.quizzes.length === 0 ? (
          <p className="mt-4 text-gray-500">No quizzes created for this lesson.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {lesson.quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className="p-4 border rounded hover:shadow transition"
              >
                <Link
                  href={`/teacher/lessons/${lesson.id}/quizzes/${quiz.id}`}
                  className="text-xl font-medium text-[#023047] hover:underline"
                >
                  {quiz.title}
                </Link>
                <p className="text-sm text-gray-600">
                  Created on {quiz.createdAt.toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
