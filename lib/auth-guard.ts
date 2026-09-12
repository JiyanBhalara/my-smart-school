// lib/auth-guard.ts
//
// Shared authentication / authorization helpers for the API routes.
//
// The guards throw `HttpError`. Because every route handler wraps its body in a
// try/catch that returns a generic 500, each catch block must give
// `toErrorResponse` first refusal so guard failures surface as 401/403/404
// instead of being swallowed into a 500:
//
//   } catch (error) {
//     const guardResponse = toErrorResponse(error);
//     if (guardResponse) return guardResponse;
//     console.error("...", error);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import prisma from "@/lib/prisma";
import type { Role } from "@prisma/client";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type AuthedUser = {
  id: string;
  role: Role;
};

/**
 * Resolves the NextAuth session. Throws 401 if there is no authenticated user.
 */
export async function requireSession(): Promise<AuthedUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  return {
    id: session.user.id,
    role: session.user.role as Role,
  };
}

/**
 * Requires an authenticated user holding one of `roles`.
 * Throws 401 when unauthenticated, 403 when the role does not match.
 */
export async function requireRole(roles: Role | Role[]): Promise<AuthedUser> {
  const user = await requireSession();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!allowed.includes(user.role)) {
    throw new HttpError(403, "Forbidden");
  }

  return user;
}

type LessonAccess = {
  id: string;
  title: string;
  authorId: string;
  published: boolean;
  fileUrl: string;
};

/**
 * Read access to a lesson.
 *
 * The schema has no enrolment relation — the only signals available are
 * authorship and the `published` flag — so access is granted when the user
 * authored the lesson, or the lesson is published. Any published lesson is
 * therefore readable by any authenticated user (an open catalogue). Revisit
 * this if a real enrolment model is added.
 *
 * Throws 404 when the lesson does not exist, 403 when it is an unpublished
 * lesson belonging to someone else.
 */
export async function requireLessonAccess(
  lessonId: string,
  userId: string
): Promise<LessonAccess> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      authorId: true,
      published: true,
      fileUrl: true,
    },
  });

  if (!lesson) {
    throw new HttpError(404, "Lesson not found");
  }

  if (lesson.authorId === userId) {
    return lesson;
  }

  if (!lesson.published) {
    throw new HttpError(403, "Forbidden");
  }

  return lesson;
}

/**
 * Write access to a lesson: the caller must be the lesson's author.
 * Throws 404 when the lesson does not exist, 403 when authored by someone else.
 */
export async function requireLessonAuthor(
  lessonId: string,
  userId: string
): Promise<LessonAccess> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      authorId: true,
      published: true,
      fileUrl: true,
    },
  });

  if (!lesson) {
    throw new HttpError(404, "Lesson not found");
  }

  if (lesson.authorId !== userId) {
    throw new HttpError(403, "Forbidden");
  }

  return lesson;
}

/**
 * Converts an `HttpError` into a JSON response. Returns null for anything else
 * so the caller can fall through to its own 500 handling.
 */
export function toErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
