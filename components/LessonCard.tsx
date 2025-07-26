// components/LessonCard.tsx
import Link from "next/link";
import { Calendar, ExternalLink, BookOpen, Tag } from "lucide-react";

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
    <div className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* ---------- Header ---------- */}
      <div className="bg-gradient-to-r from-[#219EBC] to-[#0077B6] p-5 rounded-t-xl">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 line-clamp-2">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-white/90">
          <BookOpen size={16} />
          <span className="text-sm font-medium">{subject}</span>
        </div>
      </div>

      {/* ---------- Content ---------- */}
      <div className="p-5 sm:p-6">
        {tags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-[#FB8500]" />
              <span className="text-sm font-semibold text-gray-700">Tags</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map(({ tag }) => (
                <Link
                  key={tag.name}
                  href="#"
                  className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-[#FFB703] to-[#FB8500] transition-transform duration-200 hover:scale-105"
                >
                  {tag.name}
                </Link>
              ))}

              {tags.length > 3 && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* ---------- Footer ---------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
          {/* Date */}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} className="text-[#219EBC]" />
            <span className="text-sm">
              {new Date(createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* View Lesson */}
          <Link
            href={`/lessons/${id}`}
            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#023047] to-[#0077B6] text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:from-[#219EBC] hover:to-[#0077B6] focus:outline-none focus:ring-2 focus:ring-[#219EBC]/50"
            aria-label={`View lesson: ${title}`}
          >
            <span>View Lesson</span>
            <ExternalLink size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
