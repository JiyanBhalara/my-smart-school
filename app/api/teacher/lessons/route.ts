// app/api/teacher/lessons/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireRole, toErrorResponse } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  // 1️⃣ Authenticate and require the TEACHER role
  let teacher;
  try {
    teacher = await requireRole("TEACHER");
  } catch (error) {
    const guardResponse = toErrorResponse(error);
    if (guardResponse) return guardResponse;
    throw error;
  }

  // 2️⃣ Parse the incoming multipart form
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const meta = formData.get("meta") as string | null;

  if (!file || !meta) {
    return NextResponse.json({ error: "Missing file or metadata" }, { status: 400 });
  }

  // 3️⃣ Upload file to Supabase Storage
  const path = `${teacher.id}/${Date.now()}-${file.name}`; // Fixed: removed escaped backtick
  const { error: uploadError } = await supabaseAdmin
    .storage
    .from("lessons")
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: true });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }

  // 4️⃣ Create Lesson + Tags in the database
  const { title, subject, type, tags } = JSON.parse(meta) as {
    title: string;
    subject: string;
    type: string;
    tags: string[];
  };

  await prisma.lesson.create({
    data: {
      title,
      subject,
      type,
      fileUrl: path,
      authorId: teacher.id,
      tags: {
        create: tags.map((tagName) => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName },
            },
          },
        })),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
