import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from '@vercel/blob';
import {
  requireRole,
  requireLessonAuthor,
  toErrorResponse,
} from "@/lib/auth-guard";

// 750MB upload limit
const MAX_SIZE = 750 * 1024 * 1024;

// Environment-based logging
const isDevelopment = process.env.NODE_ENV === 'development';

const log = {
  debug: (msg: string) => isDevelopment && console.log(msg),
  info: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg)
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lessonId } = await params;

  // Require TEACHER role *and* authorship of this specific lesson, so a teacher
  // cannot add videos to another teacher's lesson.
  let session;
  try {
    session = await requireRole("TEACHER");
    await requireLessonAuthor(lessonId, session.id);
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;
    throw error;
  }

  const data = await req.formData();
  const file = data.get("file") as File;
  const title = String(data.get("title") || "");
  const description = String(data.get("description") || "");

  // Essential validation logging
  log.info(`📤 Starting video upload: ${file?.name} (${Math.round((file?.size || 0) / 1024 / 1024)}MB)`);

  if (!file || file.type !== "video/mp4") {
    return NextResponse.json({ error: "Only MP4 allowed." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be less than 750MB." },
      { status: 400 }
    );
  }
  if (!title.trim()) {
    return NextResponse.json({ error: "Title required." }, { status: 400 });
  }

  try {
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save DB entry as UPLOADING first
    const video = await prisma.lessonVideo.create({
      data: {
        lessonId,
        authorId: session.id,
        title,
        description,
        fileSize: BigInt(file.size),
        uploadStatus: "UPLOADING",
        archiveIdentifier: `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        archiveUrl: "",
        directVideoUrl: "",
      },
    });

    log.info(`📝 Video record created: ${video.id}`);

    try {
      // Create sanitized filename like your original script
      const sanitizedFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      // Upload file to Vercel Blob for temporary access
      const blob = await put(sanitizedFileName, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      log.debug(`✅ File uploaded to blob: ${blob.url}`);

      const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL}/python/upload-to-ia`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileUrl: blob.url,
    videoid: video.id,
    title: title.trim(),
    description: description.trim(),
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/video/${video.id}/status`
  })
});

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload service failed: ${errorText}`);
      }

      log.info(`🚀 Upload process started for video: ${video.id}`);
      
    } catch (serviceError) {
      log.error(`❌ Error calling upload service: ${serviceError}`);

      // Update video status to FAILED
      await prisma.lessonVideo.update({
        where: { id: video.id },
        data: { uploadStatus: "FAILED" },
      });

      return NextResponse.json(
        { 
          error: "Failed to start upload process.",
          details: serviceError instanceof Error ? serviceError.message : String(serviceError)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, videoId: video.id });
  } catch (error) {
    log.error(`❌ Upload error: ${error}`);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
