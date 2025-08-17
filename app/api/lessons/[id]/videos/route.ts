import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { lessonId: string } }) {
  try {
    const videos = await prisma.lessonVideo.findMany({
      where: { 
        lessonId: params.lessonId,
        uploadStatus: {
          not: 'FAILED' // Exclude videos with FAILED status
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        archiveIdentifier: true,
        archiveUrl: true,
        directVideoUrl: true,
        fileSize: true,
        duration: true,
        uploadStatus: true,
        createdAt: true
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedVideos = videos.map(video => ({
      ...video,
      fileSize: video.fileSize.toString()
    }));

    return NextResponse.json({ videos: serializedVideos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
