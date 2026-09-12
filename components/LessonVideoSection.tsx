"use client";
import { useEffect, useState, useCallback } from 'react';
import { Plus, Video, Eye } from 'lucide-react';
import VideoCard from './VideoCard';
import VideoUploadModal from './VideoUploadModal';
import DeleteAllVideosButton from './DeleteAllVideosButton';

interface LessonVideoSectionProps {
  lessonId: string;
  isAuthor: boolean;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  blobUrl: string;
  blobPathname: string;
  fileSize: number;
  duration?: number;
  createdAt: string;
  uploadStatus: string;
}

export default function LessonVideoSection({ lessonId, isAuthor }: LessonVideoSectionProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/videos`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  if (loading) {
    return (
      <div className="bg-white rounded-[4px] border border-rule p-8">
        <div className="">
          <div className="h-6 bg-[#edf2f5] rounded w-48 mb-4"></div>
          <div className="h-64 bg-[#edf2f5] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-[4px] border border-rule overflow-hidden">
      {/* Section Header */}
      <div className="bg-sheet border-b border-rule px-6 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#edf2f5] rounded-[4px] border border-ink">
              <Video size={28} className="text-ink" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-ink">Lesson Videos</h2>
              <p className="text-graphite mt-1">
                {videos.length === 0
                  ? "No videos available yet"
                  : `${videos.length} video${videos.length === 1 ? "" : "s"} available`}
              </p>
            </div>
          </div>

          {/* Action Buttons - Only for authors */}
          {isAuthor && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-ink text-white font-semibold rounded-[4px] hover:bg-ink transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Upload Video</span>
                <span className="sm:hidden">Upload</span>
              </button>
              
              {/* Delete All Videos Button - Only show if videos exist */}
              {videos.length > 0 && (
                <DeleteAllVideosButton 
                  lessonId={lessonId} 
                  videoCount={videos.length}
                  onDeleted={fetchVideos} // Refresh videos after deletion
                  variant="compact" // Use compact variant for this context
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8">
        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-sheet rounded-[4px] flex items-center justify-center">
              <Video size={36} className="text-ink" />
            </div>
            <h3 className="text-xl font-bold text-ink mb-3">No Videos Available</h3>
            <p className="text-graphite mb-8 max-w-lg mx-auto leading-relaxed">
              Educational videos for this lesson haven&apos;t been uploaded yet.
              {isAuthor && " You can upload the first video to get started!"}
            </p>
            
            {isAuthor && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-ink text-white font-semibold rounded-[4px] hover:bg-ink transition-colors"
              >
                <Plus size={18} />
                Upload First Video
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Show latest video */}
            <VideoCard
              video={videos[0]}
              lessonId={lessonId}
              isAuthor={isAuthor}
              onUpdate={fetchVideos}
            />

            {/* Show "View All Videos" if more than 1 video */}
            {videos.length > 1 && (
              <div className="text-center pt-4 border-t border-rule">
                <a
                  href={`/lessons/${lessonId}/videos`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-white font-semibold rounded-[4px] hover:bg-ink transition-colors"
                >
                  <Eye size={18} />
                  View All Videos ({videos.length})
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <VideoUploadModal
            lessonId={lessonId}
            onClose={() => setShowUploadModal(false)}
            onUploaded={() => {
              fetchVideos();
              setShowUploadModal(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
