import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';
import { spawn } from 'child_process';

// UPDATE video title/description
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify user is the author
    const video = await prisma.lessonVideo.findUnique({
      where: { id: videoId },
      include: { lesson: true }
    });

    if (!video || video.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 });
    }

    const updatedVideo = await prisma.lessonVideo.update({
      where: { id: videoId },
      data: { title: title.trim(), description: description?.trim() || null }
    });

    // Convert BigInt to string for JSON serialization
    const serializedVideo = {
      ...updatedVideo,
      fileSize: updatedVideo.fileSize.toString()
    };

    return NextResponse.json({ video: serializedVideo });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

// DELETE video
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is the author
    const video = await prisma.lessonVideo.findUnique({
      where: { id: videoId },
      include: { lesson: true }
    });

    if (!video || video.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 });
    }

    // Delete from Internet Archive (spawn Python script)
    if (video.archiveIdentifier) {
      spawn('python3', [
        './scripts/delete_from_ia.py',
        '--identifier', video.archiveIdentifier
      ], { detached: true });
    }

    // Delete from database
    await prisma.lessonVideo.delete({
      where: { id: videoId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}
