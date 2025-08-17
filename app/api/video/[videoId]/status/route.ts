import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = await params;
    const updates = await req.json();
    
    // Convert archiveIdentifier, archiveUrl, directVideoUrl, uploadStatus
    const updateData: any = {};
    
    if (updates.archiveIdentifier) updateData.archiveIdentifier = updates.archiveIdentifier;
    if (updates.archiveUrl) updateData.archiveUrl = updates.archiveUrl;
    if (updates.directVideoUrl) updateData.directVideoUrl = updates.directVideoUrl;
    if (updates.uploadStatus) updateData.uploadStatus = updates.uploadStatus;
    
    const video = await prisma.lessonVideo.update({
      where: { id: videoId },
      data: updateData,
    });
  
    
    // Convert BigInt to string for JSON serialization
    const serializedVideo = {
      ...video,
      fileSize: video.fileSize.toString()
    };
    
    return NextResponse.json({ success: true, video: serializedVideo });
    
  } catch (error) {
    console.error('Error updating video status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
