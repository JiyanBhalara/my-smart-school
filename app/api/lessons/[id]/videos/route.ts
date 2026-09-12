import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import {
  requireSession,
  requireLessonAccess,
  toErrorResponse,
} from '@/lib/auth-guard';
import { serializeVideos } from '@/lib/serialize';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: lessonId } = await params;

    // Authenticate, then authorize against this specific lesson
    const user = await requireSession();
    await requireLessonAccess(lessonId, user.id);

    const videos = await prisma.lessonVideo.findMany({
      where: {
        lessonId: lessonId,
        uploadStatus: {
          not: 'FAILED' // Exclude videos with FAILED status
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        blobUrl: true,
        blobPathname: true,
        fileSize: true,
        duration: true,
        uploadStatus: true,
        createdAt: true
      }
    });

    return NextResponse.json({ videos: serializeVideos(videos) });
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;

    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
