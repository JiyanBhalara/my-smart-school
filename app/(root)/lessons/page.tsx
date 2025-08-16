import { Suspense } from "react";
import prisma from "@/lib/prisma";
import LessonCard from "@/components/LessonCard";
import SearchAndFilter from "@/components/lessons/SearchAndFilter";
import { GraduationCap, BookOpen, Users, Clock, Loader } from "lucide-react";

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

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 lg:mt-12 max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-[#8ECAE6] rounded-full">
              <BookOpen className="text-[#023047]" size={24} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#FFB703] mb-1">{totalLessons}</div>
          <div className="text-xs sm:text-sm text-gray-300">Total Lessons</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-[#8ECAE6] rounded-full">
              <Users className="text-[#023047]" size={24} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#FFB703] mb-1">{subjects.length}</div>
          <div className="text-xs sm:text-sm text-gray-300">Subjects</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-center mb-3">
            <div className="p-2 bg-[#8ECAE6] rounded-full">
              <Clock className="text-[#023047]" size={24} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#FFB703] mb-1">24/7</div>
          <div className="text-xs sm:text-sm text-gray-300">Access</div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Enhanced Search and Filter Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#8ECAE6] to-[#219EBC] rounded-xl shadow-md">
                  <BookOpen className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-[#023047] mb-1">
                    Lesson Library
                  </h2>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {params.search || params.subject ? (
                      <>Showing {filteredCount} of {totalLessons} lessons</>
                    ) : (
                      <>{totalLessons} lessons available across {subjects.length} subjects</>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Search and Filter Component */}
            <SearchAndFilter 
              subjects={subjects} 
              currentSearch={params.search || ""}
              currentSubject={params.subject || ""}
            />
          </div>
        </div>

        {/* Results Section */}
        {lessons.length === 0 ? (
          <div className="text-center py-12 lg:py-20">
            <div className="mx-auto w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-[#8ECAE6] to-[#219EBC] rounded-full flex items-center justify-center mb-6 shadow-lg">
              <BookOpen size={32} className="text-white lg:w-10 lg:h-10" />
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-[#023047] mb-3">
              {params.search || params.subject ? "No lessons found" : "No lessons published yet"}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm lg:text-base px-4">
              {params.search || params.subject ? (
                <>Try adjusting your search terms or filters to find what you&apos;re looking for.</>
              ) : (
                <>Start building your lesson library. Your educational content will be displayed here once you create your first lesson.</>
              )}
            </p>
            {(!params.search && !params.subject) && (
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-white font-medium rounded-lg hover:from-[#FB8500] hover:to-[#FFB703] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <GraduationCap size={20} />
                Create Your First Lesson
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Active Filters Display */}
            {(params.search || params.subject) && (
              <div className="mb-6 flex flex-wrap gap-2">
                {params.search && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#8ECAE6] text-[#023047] rounded-full text-sm font-medium">
                    Search: &quot;{params.search}&quot;
                  </span>
                )}
                {params.subject && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFB703] text-white rounded-full text-sm font-medium">
                    Subject: {params.subject}
                  </span>
                )}
              </div>
            )}

            {/* Lessons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {lessons.map((lesson, index) => (
                <div 
                  key={lesson.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <LessonCard
                    id={lesson.id}
                    title={lesson.title}
                    subject={lesson.subject}
                    fileUrl={lesson.fileUrl}
                    createdAt={lesson.createdAt}
                    tags={lesson.tags}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-[#023047] via-[#025066] to-[#219EBC] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-[#8ECAE6] to-[#219EBC] rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <GraduationCap size={48} className="text-white sm:w-12 sm:h-12 lg:w-16 lg:h-16" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 lg:mb-6 bg-gradient-to-r from-white to-[#8ECAE6] bg-clip-text text-transparent">
              Discover Knowledge
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-200 mb-6 lg:mb-8 max-w-3xl mx-auto px-4 leading-relaxed">
              Explore our comprehensive collection of educational resources designed to enhance your learning journey
            </p>
            
            <Suspense 
              fallback={
                <div className="flex justify-center items-center py-8">
                  <Loader className="animate-spin text-[#8ECAE6]" size={32} />
                </div>
              }
            >
              <LessonsContent searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
