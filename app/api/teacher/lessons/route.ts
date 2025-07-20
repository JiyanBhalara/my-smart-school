// app/api/teacher/lessons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  // 1️⃣ Authenticate via JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ Parse the incoming multipart form
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const meta = formData.get("meta") as string | null;

  if (!file || !meta) {
    return NextResponse.json({ error: "Missing file or metadata" }, { status: 400 });
  }

  // 3️⃣ Upload file to Supabase Storage
  const path = `${token.id}/${Date.now()}-${file.name}`;
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
    authorId: token.id as string,
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
