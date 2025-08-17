import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  ExternalLink,
  FileText,
  BookOpen,
  Tag,
  Play,
  X,
  AlertTriangle,
  Plus
} from "lucide-react";
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      {/* FIXED: No Materials Modal with scrollable container */}
      {noMaterial === "1" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 my-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Materials Available</h3>
              </div>
              <Link
                href={`/lessons/${lesson.id}`}
                className="cursor-pointer p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X size={20} className="text-gray-500" />
              </Link>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6">
                This lesson currently doesn&apos;t have any downloadable materials available. The instructor may add
                them later, or you can contact them directly for more information.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#219EBC] to-[#0077B6] text-white font-medium rounded-lg hover:from-[#0077B6] hover:to-[#023047] transition-all duration-300"
                >
                  <span>Continue with Lesson</span>
                </Link>
                <Link
                  href="/lessons"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-300"
                >
                  <BookOpen size={16} />
                  <span>Browse Lessons</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#219EBC] via-[#0077B6] to-[#023047] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          <nav className="mb-8">
            <Link
              href="/lessons"
              className="cursor-pointer text-white/80 hover:text-white transition-colors duration-200 text-sm font-medium flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Lessons
            </Link>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 leading-tight">{lesson.title}</h1>

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <span className="text-xl lg:text-2xl font-semibold text-white/95">{lesson.subject}</span>
                </div>
              </div>

              {lesson.tags.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={18} className="text-white/90" />
                    <span className="text-sm font-semibold text-white/90 uppercase tracking-wide">Course Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {lesson.tags.map(({ tag }) => (
                      <span
                        key={tag.name}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-white/80 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wide">Created On</p>
                  <p className="text-sm font-semibold">
                    {lesson.createdAt.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Materials + Actions */}
            <div className="lg:col-span-1 flex lg:justify-end">
              <div className="w-full lg:w-auto space-y-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Lesson Materials</h3>
                  <Link
                    href={`/api/lessons/${lesson.id}/download`}
                    target="_blank"
                    className="cursor-pointer w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-white text-[#023047] font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <FileText size={22} />
                    <div className="text-left">
                      <div className="font-semibold">View Materials</div>
                      <div className="text-xs text-gray-600">Download PDF</div>
                    </div>
                    <ExternalLink size={16} />
                  </Link>
                </div>

                {/* Edit/Delete Actions - Only for lesson author */}
                <LessonActionsClient
                  lessonId={lesson.id}
                  isAuthor={isAuthor}
                  lessonTitle={lesson.title}
                  quizCount={lesson.quizzes.length}
                />

                {/* UPDATED: Add Quiz Button - Only for lesson author (not all teachers) */}
                {isAuthor && (
                  <Link
                    href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                    className="cursor-pointer w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#00A884] to-[#007F66] text-white font-semibold rounded-xl hover:from-[#00c197] hover:to-[#009178] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus size={18} />
                    <span>Add Quiz</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Lesson Content Section */}
        <LessonContentSection
          lessonId={lesson.id}
          isAuthor={isAuthor}
          isTeacher={isTeacher}
        />

        {/* NEW: Video Section */}
        <LessonVideoSection
          lessonId={lesson.id}
          isAuthor={isAuthor}
        />

        {/* FIXED: Responsive Quizzes Section */}
        <div className="space-y-8">
          {/* Main Content - Quizzes */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Section Header with optional Add button and Delete All button (lesson authors only) */}
            <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-[#219EBC]/10 rounded-xl border border-[#219EBC]/20">
                    <Play size={24} className="text-[#219EBC] sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Interactive Quizzes</h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      {lesson.quizzes.length === 0
                        ? "No quizzes available yet"
                        : `${lesson.quizzes.length} quiz${lesson.quizzes.length === 1 ? "" : "es"} available`}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Responsive Stack */}
                {isAuthor && (
                  <div className="cursor-pointer flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    {/* Delete All Quizzes Button - Only for lesson author */}
                    <QuizDeleteActions
                      lessonId={lesson.id}
                      isAuthor={isAuthor}
                      variant="all"
                      quizCount={lesson.quizzes.length}
                    />

                    {/* Add Quiz Button - Only for lesson author */}
                    <Link
                      href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#023047] text-white font-semibold rounded-lg hover:bg-[#034569] transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">Add Quiz</span>
                      <span className="sm:hidden">Add</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quiz Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              {recentQuizzes.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                    <Play size={28} className="text-gray-400 sm:w-9 sm:h-9" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">No Quizzes Available</h3>
                  <p className="text-gray-600 mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed text-sm sm:text-base px-4">
                    Interactive quizzes for this lesson haven&apos;t been created yet. 
                    {isAuthor && " You can add the first quiz to get started!"}
                    {!isAuthor && " Check back later or explore other lessons while you wait."}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                    <Link
                      href="/lessons"
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-[#219EBC] hover:text-white bg-[#219EBC]/10 hover:bg-[#219EBC] font-semibold rounded-xl transition-all duration-300 border border-[#219EBC]/20 hover:border-[#219EBC] text-sm sm:text-base"
                    >
                      <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
                      <span>Browse Other Lessons</span>
                      <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                    </Link>
                    
                    {/* Add Quiz Button in empty state - Only for lesson author */}
                    {isAuthor && (
                      <Link
                        href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                        className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#00A884] text-white font-semibold rounded-xl hover:bg-[#007F66] transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
                      >
                        <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>Create First Quiz</span>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {recentQuizzes.map((quiz, index) => (
                    <div key={quiz.id} className="relative">
                      <QuizCard
                        quiz={quiz}
                        lessonId={lesson.id}
                        index={index}
                        userId={userId}
                        userRole={userRole}
                      />
                    </div>
                  ))}
                  
                  {/* Add "View All Quizzes" button when there are more */}
                  {hasMoreQuizzes && (
                    <div className="text-center pt-4">
                      <Link
                        href={`/lessons/${lesson.id}/quizzes`}
                        className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#219EBC] text-white font-semibold rounded-xl hover:bg-[#0077B6] transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
                      >
                        <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span>View All Quizzes ({lesson.quizzes.length})</span>
                        <ExternalLink size={14} className="sm:w-4 sm:h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Sidebar - Now Below Main Content on Mobile */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <Link
                  href="/lessons"
                  className="cursor-pointer w-full inline-flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-all duration-300 group text-sm sm:text-base"
                >
                  <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>All Lessons</span>
                  <ExternalLink size={12} className="ml-auto group-hover:translate-x-1 transition-transform sm:w-[14px] sm:h-[14px]" />
                </Link>

                <Link
                  href={`/api/lessons/${lesson.id}/download`}
                  target="_blank"
                  className="cursor-pointer w-full inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-white font-medium rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-105 group text-sm sm:text-base"
                >
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Download</span>
                  <ExternalLink size={12} className="ml-auto group-hover:translate-x-1 transition-transform sm:w-[14px] sm:h-[14px]" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#219EBC]/5 to-[#0077B6]/5 rounded-2xl border border-[#219EBC]/10 p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Lesson Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row lg:flex-row justify-between items-start sm:items-center">
                  <span className="text-gray-600 text-sm">Available Content</span>
                  <span className="font-semibold text-[#219EBC] text-sm sm:text-base">{lesson.lessonContents.length}</span>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-row justify-between items-start sm:items-center">
                  <span className="text-gray-600 text-sm">Available Videos</span>
                  <span className="font-semibold text-[#219EBC] text-sm sm:text-base">{lesson.videos.length}</span>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-row justify-between items-start sm:items-center">
                  <span className="text-gray-600 text-sm">Available Quizzes</span>
                  <span className="font-semibold text-[#219EBC] text-sm sm:text-base">{lesson.quizzes.length}</span>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-row justify-between items-start sm:items-center">
                  <span className="text-gray-600 text-sm">Course Tags</span>
                  <span className="font-semibold text-[#219EBC] text-sm sm:text-base">{lesson.tags.length}</span>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-row justify-between items-start sm:items-center lg:col-span-1">
                  <span className="text-gray-600 text-sm">Subject</span>
                  <span className="font-semibold text-[#219EBC] text-sm truncate max-w-full lg:max-w-24" title={lesson.subject}>
                    {lesson.subject}
                  </span>
                </div>
              </div>
            </div>

            {/* Add Quiz Button in sidebar - Only for lesson author */}
            {isAuthor && (
              <Link
                href={`/teacher/lessons/${lesson.id}/quizzes/new`}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-3 px-4 py-3 bg-[#00A884] hover:bg-[#019972] text-white font-semibold rounded-xl transition-all duration-200 text-sm sm:text-base"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>Add Quiz</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
