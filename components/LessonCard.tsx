import Link from "next/link";
import { Calendar, ExternalLink, BookOpen, Tag, Clock, PlayCircle } from "lucide-react";

type LessonCardProps = {
  id: string;
  title: string;
  subject: string;
  fileUrl: string;
  createdAt: Date;
  tags: { tag: { name: string } }[];
};

export default function LessonCard({
  id,
  title,
  subject,
  createdAt,
  tags,
}: LessonCardProps) {
  return (
    <div className="h-full group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#219EBC]/30 overflow-hidden">
      {/* Decorative Top Border */}
      <div className="h-1 w-full bg-gradient-to-r from-[#219EBC] via-[#0077B6] to-[#023047]"></div>
      
      {/* Main Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[#219EBC]/10 to-[#0077B6]/10 rounded-full border border-[#219EBC]/20">
              <BookOpen size={14} className="text-[#219EBC]" />
              <span className="text-xs font-semibold text-[#023047]">{subject}</span>
            </div>
            <div className="p-2 bg-gradient-to-br from-[#FFB703]/10 to-[#FB8500]/10 rounded-lg border border-[#FFB703]/20 group-hover:scale-110 transition-transform duration-300">
              <PlayCircle size={18} className="text-[#FB8500]" />
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-[#023047] mb-2 line-clamp-2 group-hover:text-[#219EBC] transition-colors duration-300">
            {title}
          </h3>
        </div>

        {/* Tags Section - Always render */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={12} className="text-[#FB8500]" />
            <span className="text-xs font-medium text-gray-600">Topics</span>
          </div>
          
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 2).map(({ tag }) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-[#FFB703] to-[#FB8500] text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  +{tags.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-xs text-gray-400 italic">No tags</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* Date */}
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} className="text-[#219EBC]" />
              <span className="text-xs font-medium">
                {createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* View Lesson Button */}
            <Link
              href={`/lessons/${id}`}
              className="cursor-pointer group/btn inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#023047] to-[#0077B6] text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:from-[#219EBC] hover:to-[#0077B6] hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#219EBC]/50"
              aria-label={`View lesson: ${title}`}
            >
              <span>View</span>
              <ExternalLink size={12} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#219EBC]/5 to-[#0077B6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"></div>
    </div>
  );
}
