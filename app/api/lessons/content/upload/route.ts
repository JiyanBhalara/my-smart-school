 // app/api/lessons/content/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'lesson-content';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types for lesson content
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain'
];

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const lessonId = formData.get('lessonId') as string;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: "Invalid file type. Supported: PDF, DOC, DOCX, PPT, PPTX, Images, TXT" 
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(6).toString('hex');
    const fileExtension = file.name.split('.').pop();
    const sanitizedName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
    const fileName = `${lessonId}/${timestamp}-${randomString}-${sanitizedName}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create signed URL with long expiry (1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(fileName, 31536000); // 1 year expiry

    if (urlError || !urlData?.signedUrl) {
      console.error("Signed URL error:", urlError);
      return NextResponse.json(
        { error: "Failed to create file URL" },
        { status: 500 }
      );
    }

    // Determine content type based on file type
    let contentType = 'OTHER';
    if (file.type.startsWith('image/')) {
      contentType = 'IMAGE';
    } else if (file.type === 'application/pdf') {
      contentType = 'PDF';
    } else if (
      file.type.includes('word') || 
      file.type.includes('document')
    ) {
      contentType = 'DOC';
    } else if (
      file.type.includes('powerpoint') || 
      file.type.includes('presentation')
    ) {
      contentType = 'PPT';
    }

    return NextResponse.json({
      fileUrl: urlData.signedUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      contentType,
      uploadPath: fileName,
      expiresAt: new Date(Date.now() + 31536000 * 1000).toISOString()
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Generate new signed URL for existing file
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Create signed URL for download (1 hour expiry)
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600); // 1 hour for downloads

    if (error || !data?.signedUrl) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      downloadUrl: data.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    });

  } catch (error) {
    console.error("Error generating download link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
