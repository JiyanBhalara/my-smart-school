// app/api/lessons/[id]/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import prisma from "@/lib/prisma";
import {
  requireSession,
  requireLessonAccess,
  toErrorResponse,
} from "@/lib/auth-guard";

// GET all content for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate, then authorize against this lesson (author, or published)
    const user = await requireSession();
    await requireLessonAccess(id, user.id);

    // Fetch lesson with content
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        lessonContents: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        tags: { include: { tag: true } }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;

    console.error("Error fetching lesson content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST new content to a lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, markdown, type, fileUrl, fileName } = await request.json();

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    // Validate content based on type
    if (type === "MARKDOWN" && !markdown) {
      return NextResponse.json(
        { error: "Markdown content is required for MARKDOWN type" },
        { status: 400 }
      );
    }

    if (type !== "MARKDOWN" && !fileUrl) {
      return NextResponse.json(
        { error: "File URL is required for file types" },
        { status: 400 }
      );
    }

    // Verify lesson exists and user is author
    const lesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only lesson author can add content" },
        { status: 403 }
      );
    }

    // Create content
    const content = await prisma.lessonContent.create({
      data: {
        lessonId: id,
        authorId: session.user.id,
        title,
        type,
        markdown: type === "MARKDOWN" ? markdown : null,
        fileUrl: type !== "MARKDOWN" ? fileUrl : null,
        fileName: type !== "MARKDOWN" ? fileName : null
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
