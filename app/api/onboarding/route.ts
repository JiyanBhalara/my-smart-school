// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { onboardingSchema, parseBody } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET // Fixed: removed escaped underscore
  });
  
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseBody(onboardingSchema, await req.json());
  if (!parsed.ok) return parsed.response;
  const { birthdate, school, role } = parsed.data;

  // create the profile
  await prisma.profile.create({
    data: {
      userId: token.id as string,
      birthdate: new Date(birthdate),
      school,
    },
  });

  // set the User.role (STUDENT by default, override if teacher)
  if (role === "TEACHER") {
    await prisma.user.update({
      where: { id: token.id as string },
      data: { role: "TEACHER" },
    });
  }

  return NextResponse.json({ ok: true });
}
