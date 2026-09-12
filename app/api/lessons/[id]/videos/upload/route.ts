// app/api/lessons/[id]/videos/upload/route.ts
//
// Token route for client-side direct uploads to Vercel Blob.
//
// The browser sends the file straight to Blob storage; this route only issues a
// short-lived upload token and then records the result. Nothing streams through
// the serverless function, so the 4.5MB request body cap, the function memory
// ceiling and the execution timeout all stop applying.
//
// Authorization lives in onBeforeGenerateToken: no token is issued unless the
// caller is a TEACHER who authored this lesson. The LessonVideo row is created
// in onUploadCompleted, which Vercel Blob calls with a signed payload -- the
// client has no endpoint it can call to mark a video complete.

import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import prisma from "@/lib/prisma";
import {
  requireRole,
  requireLessonAuthor,
  toErrorResponse,
  HttpError,
} from "@/lib/auth-guard";

const MAX_SIZE = 750 * 1024 * 1024; // 750MB

type VideoTokenPayload = {
  lessonId: string;
  authorId: string;
  title: string;
  description: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: lessonId } = await params;
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,

      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // Authorize before handing out an upload token.
        const teacher = await requireRole("TEACHER");
        await requireLessonAuthor(lessonId, teacher.id);

        let parsed: { title?: unknown; description?: unknown };
        try {
          parsed = JSON.parse(clientPayload ?? "{}");
        } catch {
          throw new HttpError(400, "Invalid clientPayload");
        }

        const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
        const description =
          typeof parsed.description === "string" ? parsed.description.trim() : "";

        if (!title) {
          throw new HttpError(400, "Title required.");
        }

        const tokenPayload: VideoTokenPayload = {
          lessonId,
          authorId: teacher.id,
          title,
          description,
        };

        return {
          // Enforced by Blob storage itself, not just by the browser.
          allowedContentTypes: ["video/mp4"],
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(tokenPayload),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called by Vercel Blob once the object is stored. The payload is the
        // one we signed above, so the title/lesson/author cannot be forged.
        if (!tokenPayload) {
          throw new Error("Missing token payload on completed upload");
        }

        const payload = JSON.parse(tokenPayload) as VideoTokenPayload;

        await prisma.lessonVideo.create({
          data: {
            lessonId: payload.lessonId,
            authorId: payload.authorId,
            title: payload.title,
            description: payload.description,
            blobUrl: blob.url,
            blobPathname: blob.pathname,
            // `blob` carries no size, so read it back from the stored object.
            fileSize: BigInt(await contentLengthOf(blob.url)),
            uploadStatus: "COMPLETED",
          },
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;

    console.error("Video upload token error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}

/** Reads the stored object's size without downloading it. */
async function contentLengthOf(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return Number(res.headers.get("content-length") ?? 0);
  } catch {
    return 0;
  }
}
