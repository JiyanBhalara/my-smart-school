import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  requireSession,
  requireLessonAccess,
  toErrorResponse,
} from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1️⃣ authenticate, then authorize against this specific lesson
    const user = await requireSession();
    const lesson = await requireLessonAccess(id, user.id);

    // 2️⃣ check if there is any file to download
    if (!lesson.fileUrl) {
      // no file key saved → back to detail with a flag
      return NextResponse.redirect(
        new URL(`/lessons/${id}?noMaterial=1`, request.url)
      );
    }

    // 3️⃣ generate a signed URL (expires in 60s)
    const { data, error } = await supabaseAdmin.storage
      .from("lessons")
      .createSignedUrl(lesson.fileUrl, 60);

    if (error || !data?.signedUrl) {
      // treat storage errors (e.g. bucket or file missing) as "no material"
      return NextResponse.redirect(
        new URL(`/lessons/${id}?noMaterial=1`, request.url)
      );
    }

    // 4️⃣ redirect the browser to the signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;

    console.error("Error generating lesson download URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
