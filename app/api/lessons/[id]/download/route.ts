import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  request: NextRequest, // Fixed: Added NextRequest type
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1️⃣ fetch the lesson to get its file key
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { fileUrl: true },
  });
  if (!lesson) {
    // lesson id invalid → redirect home
    return NextResponse.redirect(new URL(`/lessons`, request.url));
  }

  // 2️⃣ check if there is any file to download
  if (!lesson.fileUrl) {
    // no file key saved → back to detail with a flag
    return NextResponse.redirect(
      new URL(`/lessons/${id}?noMaterial=1`, request.url)
    );
  }

  // 3️⃣ generate a signed URL (expires in 60s)
  const { data, error } = await supabaseAdmin
    .storage
    .from("lessons")
    .createSignedUrl(lesson.fileUrl, 60);
  if (error || !data?.signedUrl) {
    // treat storage errors (e.g. bucket or file missing) as "no material"
    return NextResponse.redirect(
      new URL(`/lessons/${id}?noMaterial=1`, request.url)
    );
  }
  console.log(data);
  // 4️⃣ redirect the browser to the signed URL
  return NextResponse.redirect(data.signedUrl);
}
