// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // 1️⃣ Authenticate
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ Parse + validate
  const { birthdate, school, role } = await req.json();
  if (!birthdate || !school || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 3️⃣ Create the Profile record
  await prisma.profile.create({
    data: {
      userId:    token.id as string,
      birthdate: new Date(birthdate),
      school,
    },
  });

  // 4️⃣ If they chose Teacher, update their User.role and queue a TeacherStatus
  if (role === "TEACHER") {
    // a) bump their role on the User
    await prisma.user.update({
      where: { id: token.id as string },
      data:  { role: "TEACHER" },
    });
    // b) create a pending teacherStatus
    await prisma.teacherStatus.create({
      data: {
        userId:    token.id as string,
        selfieUrl: "", // will fill later
      },
    });
  }

  return NextResponse.json({ ok: true });
}
