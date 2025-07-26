// app/lessons/[id]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ExternalLink, FileText, BookOpen, Tag, Play, X, AlertTriangle } from "lucide-react";

type Props = {
  params: { id: string };
  searchParams: { noMaterial?: string };
};

export default async function LessonDetailPage({
  params,
  searchParams,
}: Props) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    include: {
      quizzes: { orderBy: { createdAt: "desc" } },
      tags:    { include: { tag: true } },
    },
  });

  if (!lesson) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      {/* No Material Popup Modal */}
      {searchParams.noMaterial === "1" && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* Modal */}
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 animate-in fade-in duration-300">
              {/* Header */}
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

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  This lesson currently doesn't have any downloadable materials available. 
                  The instructor may add them later, or you can contact them directly for more information.
                </p>

                {/* Actions */}
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
        </>
      )}

      {/* Hero Section - Enhanced Organization */}
      <div className="bg-gradient-to-r from-[#219EBC] via-[#0077B6] to-[#023047] text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
          {/* Breadcrumb Navigation */}
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

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Subject */}
              <div>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                  {lesson.title}
                </h1>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <span className="text-xl lg:text-2xl font-semibold text-white/95">{lesson.subject}</span>
                </div>
              </div>

              {/* Tags Section */}
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

              {/* Creation Date */}
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

            {/* Right Column - Action Button */}
            <div className="lg:col-span-1 flex lg:justify-end">
              <div className="w-full lg:w-auto">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Better Organization */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content - Quizzes */}
          <div className="lg:col-span-3">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Section Header */}
              <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 px-8 py-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#219EBC]/10 rounded-xl border border-[#219EBC]/20">
                    <Play size={28} className="text-[#219EBC]" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Interactive Quizzes</h2>
                    <p className="text-gray-600 mt-1">
                      {lesson.quizzes.length === 0 
                        ? "No quizzes available yet" 
                        : `${lesson.quizzes.length} quiz${lesson.quizzes.length === 1 ? '' : 'es'} ready to take`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Quiz Content */}
              <div className="p-8">
                {lesson.quizzes.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                      <Play size={36} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">No Quizzes Available</h3>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                      Interactive quizzes for this lesson haven't been created yet. Check back later or explore other lessons while you wait.
                    </p>
                    <Link 
                      href="/lessons"
                      className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 text-[#219EBC] hover:text-white bg-[#219EBC]/10 hover:bg-[#219EBC] font-semibold rounded-xl transition-all duration-300 border border-[#219EBC]/20 hover:border-[#219EBC]"
                    >
                      <BookOpen size={18} />
                      Browse Other Lessons
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {lesson.quizzes.map((quiz, index) => (
                      <div 
                        key={quiz.id} 
                        className="group relative bg-gradient-to-r from-white via-gray-50/50 to-white border border-gray-200 rounded-xl p-8 hover:shadow-lg hover:border-[#219EBC]/40 transition-all duration-300 transform hover:-translate-y-1"
                      >
                        {/* Quiz Number Badge */}
                        <div className="absolute top-6 left-6 w-10 h-10 bg-gradient-to-r from-[#219EBC] to-[#0077B6] text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                          {index + 1}
                        </div>

                        <div className="ml-16 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                          <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#023047] transition-colors leading-tight">
                              {quiz.title}
                            </h3>
                            <div className="flex items-center gap-3 text-gray-600">
                              <div className="p-1.5 bg-gray-100 rounded-lg">
                                <Calendar size={16} />
                              </div>
                              <span className="text-sm font-medium">
                                Created {quiz.createdAt.toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Take Quiz Button */}
                          <Link
                            href={`/lessons/${lesson.id}/quiz`}
                            className="cursor-pointer inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#023047] to-[#0077B6] text-white font-semibold rounded-xl hover:from-[#219EBC] hover:to-[#0077B6] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#219EBC]/50"
                          >
                            <Play size={18} />
                            <span>Start Quiz</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/lessons"
                    className="cursor-pointer w-full inline-flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-all duration-300 group"
                  >
                    <BookOpen size={18} />
                    <span>All Lessons</span>
                    <ExternalLink size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <Link
                    href={`/api/lessons/${lesson.id}/download`}
                    target="_blank"
                    className="cursor-pointer w-full inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-white font-medium rounded-xl hover:shadow-md transition-all duration-300 transform hover:scale-105 group"
                  >
                    <FileText size={18} />
                    <span>Download</span>
                    <ExternalLink size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-br from-[#219EBC]/5 to-[#0077B6]/5 rounded-2xl border border-[#219EBC]/10 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Lesson Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Available Quizzes</span>
                    <span className="font-semibold text-[#219EBC]">{lesson.quizzes.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Course Tags</span>
                    <span className="font-semibold text-[#219EBC]">{lesson.tags.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subject</span>
                    <span className="font-semibold text-[#219EBC] text-sm truncate max-w-24" title={lesson.subject}>
                      {lesson.subject}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
