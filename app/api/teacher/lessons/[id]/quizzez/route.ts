// app/api/teacher/lessons/[id]/quizzes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1️⃣ Authenticate + role check
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id || token.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lessonId = params.id;

  // 2️⃣ Parse & validate payload
  const { title, questions } = await req.json() as {
    title: string;
    questions: {
      text: string;
      options: { text: string; isCorrect: boolean }[];
    }[];
  };
  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 3️⃣ Create the quiz with nested questions & options
  try {
    await prisma.quiz.create({
      data: {
        lessonId,
        title: title.trim(),
        questions: {
          create: questions.map((q, idx) => ({
            text: q.text.trim(),
            order: idx,
            options: {
              create: q.options.map((o) => ({
                text: o.text.trim(),
                isCorrect: o.isCorrect,
              })),
            },
          })),
        },
      },
    });
  } catch (e) {
    console.error("Error creating quiz:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
