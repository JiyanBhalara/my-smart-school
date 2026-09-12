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
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">Videos</h2>
        <p className="text-[13px] text-graphite tabular">
          {videos.length === 0
            ? "None yet"
            : `${videos.length} ${videos.length === 1 ? "video" : "videos"}`}
        </p>
      </div>

      {isAuthor && (
        <div className="flex flex-wrap justify-end gap-3 pt-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-rule bg-sheet px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Plus size={14} />
            Upload a video
          </button>
          {videos.length > 0 && (
            <DeleteAllVideosButton
              lessonId={lessonId}
              videoCount={videos.length}
              onDeleted={fetchVideos}
              variant="compact"
            />
          )}
        </div>
      )}

      {/* Content */}
      <div>
        {videos.length === 0 ? (
          <div className="max-w-md py-8">
            <p className="text-[15px] leading-relaxed text-graphite">
              {isAuthor
                ? "No videos on this lesson yet. MP4 up to 750MB; the upload goes straight from your browser to storage."
                : "No videos on this lesson yet. When your teacher uploads one it will appear here."}
            </p>
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
