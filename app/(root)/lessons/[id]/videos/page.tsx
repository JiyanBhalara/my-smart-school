import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';
import VideoCard from '@/components/VideoCard';
import VideoUploadButton from '@/components/VideoUploadButton';
import DeleteAllVideosButton from '@/components/DeleteAllVideosButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AllVideosPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isTeacher = !!session && session.user?.role === "TEACHER";

  // Get lesson details and videos
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      videos: {
        where: { uploadStatus: 'COMPLETED' },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!lesson) notFound();

  const isAuthor = isTeacher && session.user?.id === lesson.authorId;

  return (
    <main className="sheet-page mx-auto w-full max-w-5xl py-10">
      {/* Header */}
      <div className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link
              href={`/lessons/${lesson.id}`}
              className="cursor-pointer text-graphite hover:text-ink transition-colors duration-200 text-sm font-medium flex items-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-colors duration-200" />
              Back to Lesson
            </Link>
          </nav>

          {/* Page Title */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">All Videos</h1>
              <p className="text-xl text-ink mb-4">{lesson.title}</p>
              <div className="flex items-center gap-4 text-ink">
                <div className="flex items-center gap-2">
                  <Video size={20} />
                  <span>{lesson.videos.length} video{lesson.videos.length === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Authors */}
            {isAuthor && (
              <div className="flex flex-col sm:flex-row gap-3">
                <VideoUploadButton lessonId={lesson.id} />
                {lesson.videos.length > 0 && (
                  <DeleteAllVideosButton 
                    lessonId={lesson.id} 
                    videoCount={lesson.videos.length}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {lesson.videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-sheet rounded-[4px] flex items-center justify-center">
              <Video size={36} className="text-ink" />
            </div>
            <h2 className="text-2xl font-bold text-ink mb-3">No Videos Yet</h2>
            <p className="text-graphite mb-8 max-w-lg mx-auto">
              This lesson doesn&apos;t have any videos uploaded yet.
              {isAuthor && " Upload the first video to get started!"}
            </p>
            
            {isAuthor && (
              <VideoUploadButton lessonId={lesson.id} variant="primary" />
            )}
          </div>
        ) : (
          <div className="grid gap-8 lg:gap-12">
            {lesson.videos.map((video, index) => (
              <div key={video.id} className="relative">
                {/* Video Number Badge */}
                <div className="absolute -top-4 -left-4 z-10 w-8 h-8 bg-ink text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                <VideoCard
                  video={{
                    id: video.id,
                    title: video.title,
                    description: video.description ?? undefined,
                    blobUrl: video.blobUrl,
                    blobPathname: video.blobPathname,
                    fileSize: typeof video.fileSize === "bigint" ? Number(video.fileSize) : video.fileSize,
                    duration: video.duration ?? undefined,
                    createdAt: video.createdAt.toISOString(),
                    uploadStatus: video.uploadStatus,
                  }}
                  lessonId={lesson.id}
                  isAuthor={isAuthor}
                />
              </div>
            ))}
          </div>
        )}

        {/* Back to Lesson Button */}
        <div className="text-center mt-16">
          <Link
            href={`/lessons/${lesson.id}`}
            className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-[#edf2f5] hover:bg-[#edf2f5] text-ink font-medium rounded-[4px] transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Lesson Overview
          </Link>
        </div>
      </div>
    </main>
  );
}
