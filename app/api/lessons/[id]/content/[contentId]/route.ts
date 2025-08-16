// app/api/lessons/[id]/content/[contentId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT - Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { id, contentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, markdown } = await request.json();

    // Find existing content
    const existingContent = await prisma.lessonContent.findUnique({
      where: { id: contentId },
      include: { lesson: true }
    });

    if (!existingContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check authorization (user must be lesson author)
    if (existingContent.lesson.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Only allow editing markdown content
    if (existingContent.type !== "MARKDOWN") {
      return NextResponse.json(
        { error: "Only markdown content can be edited" },
        { status: 400 }
      );
    }

    // Update content
    const updatedContent = await prisma.lessonContent.update({
      where: { id: contentId },
      data: {
        title: title || existingContent.title,
        markdown: markdown || existingContent.markdown,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({ content: updatedContent });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove content
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { id, contentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find existing content
    const existingContent = await prisma.lessonContent.findUnique({
      where: { id: contentId },
      include: { lesson: true }
    });

    if (!existingContent) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check authorization (user must be lesson author)
    if (existingContent.lesson.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete file from Supabase if it exists
    if (existingContent.fileUrl && existingContent.type !== "MARKDOWN") {
      try {
        // Extract file path from URL or reconstruct it
        const url = new URL(existingContent.fileUrl);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Get lesson-id/filename
        
        const { error: deleteError } = await supabase.storage
          .from('lesson-content')
          .remove([filePath]);
        
        if (deleteError) {
          console.error("Error deleting file from storage:", deleteError);
        }
      } catch (storageError) {
        console.error("Error processing file deletion:", storageError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete content from database
    await prisma.lessonContent.delete({
      where: { id: contentId }
    });

    return NextResponse.json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
