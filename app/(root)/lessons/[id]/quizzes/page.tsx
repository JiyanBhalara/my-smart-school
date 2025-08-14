// app/lessons/[id]/quizzes/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuizCard from "@/components/QuizCard";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";

export default async function AllQuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isTeacher = !!session && session.user?.role === "TEACHER";
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      quizzes: {
        orderBy: { createdAt: "desc" },
        include: {
          attempts: userId
            ? {
                where: { studentId: userId },
                orderBy: { completedAt: "desc" },
              }
            : false,
        },
      },
    },
  });
  if (!lesson) notFound();

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">All Quizzes for “{lesson.title}”</h1>
          <Link
            href={`/lessons/${id}`}
            className="text-blue-600 hover:underline"
          >
            Back to Lesson
          </Link>
        </div>
        {lesson.quizzes.length === 0 ? (
          <p className="text-gray-600">No quizzes created yet.</p>
        ) : (
          <div className="space-y-8">
            {lesson.quizzes.map((quiz, idx) => (
              <div key={quiz.id} className="relative">
                <QuizCard
                  quiz={quiz}
                  lessonId={id}
                  index={idx}
                  userId={userId || undefined}
                  userRole={userRole || undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
