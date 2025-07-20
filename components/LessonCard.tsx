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
  fileUrl,
  createdAt,
  tags,
}: LessonCardProps) {
  return (
    <div className="group bg-gray-800 border border-gray-700 rounded-lg shadow-lg hover:shadow-xl hover:border-[#219EBC] transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-[#219EBC] p-4 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-gray-100">
              <BookOpen size={16} />
              <span className="text-sm font-medium">{subject}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-gray-800">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-[#FB8500]" />
              <span className="text-sm font-medium text-gray-300">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(({ tag }) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FFB703] text-gray-900"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={16} />
            <span className="text-sm">
              {new Date(createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          
          <Link
            href={fileUrl}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#023047] text-white text-sm font-medium rounded-lg hover:bg-[#219EBC] transition-colors group/link border border-gray-600"
          >
            <span>View</span>
            <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}