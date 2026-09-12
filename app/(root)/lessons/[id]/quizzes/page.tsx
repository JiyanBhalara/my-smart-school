// app/lessons/[id]/quizzes/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import QuizCard from "@/components/QuizCard";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import { ArrowLeft, Plus } from "lucide-react";
import QuizDeleteActions from "@/components/lessons/QuizDeleteActions";

export default async function AllQuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isTeacher = session?.user?.role === "TEACHER";

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

  const isAuthor = isTeacher && session.user?.id === lesson.authorId;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-rule overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#219EBC] via-[#0077B6] to-[#023047] text-white px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <Link
                  href={`/lessons/${id}`}
                  className="inline-flex items-center gap-2 text-graphite hover:text-white transition-colors duration-200 text-sm font-medium group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                  Back to Lesson
                </Link>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2">All Quizzes</h1>
                  <p className="text-xl text-graphite font-medium">&quot;{lesson.title}&quot;</p>
                  <p className="text-graphite mt-2">
                    {lesson.quizzes.length === 0
                      ? "No quizzes available yet"
                      : `${lesson.quizzes.length} quiz${lesson.quizzes.length === 1 ? "" : "es"} available`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Delete All Quizzes Button - Only for lesson author */}
                <QuizDeleteActions
                  lessonId={lesson.id}
                  isAuthor={isAuthor}
                  variant="all"
                  quizCount={lesson.quizzes.length}
                  className="sm:order-1"
                />

                {/* Add Quiz Button - For all teachers */}
                {isTeacher && (
                  <Link
                    href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#023047] font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 sm:order-2"
                  >
                    <Plus size={18} />
                    <span>Add New Quiz</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quizzes Grid */}
        {lesson.quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-rule p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Quizzes Created Yet</h3>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
              Interactive quizzes for this lesson haven&apos;t been created yet. 
              {isTeacher ? " Create your first quiz to get started!" : " Check back later or explore other lessons while you wait."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/lessons/${id}`}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
              >
                <ArrowLeft size={18} />
                Back to Lesson
              </Link>
              {isTeacher && (
                <Link
                  href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                  className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#219EBC] text-white font-semibold rounded-xl hover:bg-[#0077B6] transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <Plus size={18} />
                  Create First Quiz
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
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

        {/* Bottom Navigation */}
        <div className="mt-12 flex justify-center">
          <Link
            href={`/lessons/${id}`}
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-rule hover:bg-gray-50 hover:border-rule transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={18} />
            Return to Lesson Overview
          </Link>
        </div>
      </div>
    </main>
  );
}
