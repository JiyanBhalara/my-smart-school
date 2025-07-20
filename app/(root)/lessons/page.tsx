// app/lessons/page.tsx
import prisma from "@/lib/prisma";
import LessonCard from "@/components/LessonCard";
import { GraduationCap, BookOpen, Search, Filter, Users, Clock } from "lucide-react";

type LessonWithTags = {
  id: string;
  title: string;
  subject: string;
  fileUrl: string;
  createdAt: Date;
  tags: { tag: { name: string } }[];
};

export default async function LessonsPage() {
  // 1️⃣ load lessons with tags
  const lessons = (await prisma.lesson.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
    },
  })) as LessonWithTags[];

  const totalLessons = lessons.length;
  const subjects = Array.from(new Set(lessons.map(lesson => lesson.subject)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-[#023047] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-[#8ECAE6] rounded-full">
                <GraduationCap size={48} className="text-[#023047]" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Lesson Library
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Discover and access our comprehensive collection of educational resources
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <BookOpen className="text-[#8ECAE6]" size={32} />
                </div>
                <div className="text-3xl font-bold text-[#FFB703] mb-1">{totalLessons}</div>
                <div className="text-sm text-gray-300">Total Lessons</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Users className="text-[#8ECAE6]" size={32} />
                </div>
                <div className="text-3xl font-bold text-[#FFB703] mb-1">{subjects.length}</div>
                <div className="text-sm text-gray-300">Subjects</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="text-[#8ECAE6]" size={32} />
                </div>
                <div className="text-3xl font-bold text-[#FFB703] mb-1">24/7</div>
                <div className="text-sm text-gray-300">Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#8ECAE6] rounded-lg">
                  <BookOpen className="text-[#023047]" size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#023047]">
                    Browse Lessons
                  </h2>
                  <p className="text-gray-600 text-sm">{totalLessons} lessons available</p>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="flex gap-3">
                <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#219EBC] text-[#219EBC] rounded-lg hover:bg-[#219EBC] hover:text-white transition-colors">
                  <Search size={16} />
                  <span>Search</span>
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#FFB703] text-[#FFB703] rounded-lg hover:bg-[#FFB703] hover:text-white transition-colors">
                  <Filter size={16} />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Subject Filter Tags */}
            {subjects.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    Filter by subject:
                  </span>
                  <button className="px-3 py-1 rounded-full text-xs font-medium bg-[#023047] text-white">
                    All
                  </button>
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-[#8ECAE6] hover:text-[#023047] transition-colors"
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lessons Grid */}
        {lessons.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-[#8ECAE6] rounded-full flex items-center justify-center mb-6">
              <BookOpen size={40} className="text-[#023047]" />
            </div>
            <h3 className="text-2xl font-bold text-[#023047] mb-3">No lessons published yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start building your lesson library. Your educational content will be displayed here once you create your first lesson.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFB703] text-white font-medium rounded-lg hover:bg-[#FB8500] transition-colors">
              <GraduationCap size={20} />
              Create Your First Lesson
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                id={lesson.id}
                title={lesson.title}
                subject={lesson.subject}
                fileUrl={lesson.fileUrl}
                createdAt={lesson.createdAt}
                tags={lesson.tags}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}