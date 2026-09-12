import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import prisma from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  try {
    // Verify the lesson belongs to the teacher
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        videos: {
          where: { uploadStatus: 'COMPLETED' }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete videos from this lesson" }, { status: 403 });
    }

    if (lesson.videos.length === 0) {
      return NextResponse.json({ error: "No videos to delete" }, { status: 400 });
    }

    console.log(`🗑️ Starting bulk deletion of ${lesson.videos.length} videos for lesson ${lessonId}`);

    // STEP 1: remove the stored objects. Await these -- unlike the old
    // fire-and-forget Python spawn, a failure here is logged but never blocks
    // the row deletion, since an orphaned blob is recoverable and a row
    // pointing at a missing object is not.
    const blobUrls = lesson.videos
      .map((video) => video.blobUrl)
      .filter((url): url is string => Boolean(url));

    if (blobUrls.length > 0) {
      try {
        await del(blobUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
        console.log(`✅ Deleted ${blobUrls.length} blobs for lesson ${lessonId}`);
      } catch (blobError) {
        console.error(`❌ Failed to delete some blobs for lesson ${lessonId}:`, blobError);
      }
    }

    // STEP 2: Delete from database
    const deleteResult = await prisma.lessonVideo.deleteMany({
      where: {
        lessonId: lessonId,
        uploadStatus: 'COMPLETED'
      }
    });

    console.log(`✅ Deleted ${deleteResult.count} videos from database`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} videos.`
    });

  } catch (error) {
    console.error("Error deleting all videos:", error);
    return NextResponse.json(
      { error: "Failed to delete videos" },
      { status: 500 }
    );
  }
}
