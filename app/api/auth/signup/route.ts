// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { parseBody, signupSchema } from '@/lib/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // Fixed: removed escaped underscore
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fixed: removed escaped underscore
);

export async function POST(req: NextRequest) {
  const parsed = parseBody(signupSchema, await req.json());
  if (!parsed.ok) return parsed.response;
  const { name, email, password } = parsed.data;

  try {
    // 1️⃣ Prisma
    const duplicate = await prisma.user.findUnique({ where: { email } });
    if (duplicate) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hash },
    });

    // 2️⃣ Supabase
    const { error: sbError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: null, // Fixed: removed escaped underscore
      });

    if (sbError) console.error("Supabase insert failed:", sbError);

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}
