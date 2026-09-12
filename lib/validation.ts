// lib/validation.ts
//
// Request body schemas for the API routes. Every route that reads
// `req.json()` validates the result through one of these before using it.
//
// The schemas are deliberately permissive: they mirror what the existing
// frontend already sends, and add type checks plus length bounds rather than
// new business rules. The goal is to stop malformed input reaching Prisma, not
// to change what the endpoints accept.

import { z } from "zod";
import { NextResponse } from "next/server";

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

const id = z.string().min(1).max(64);
const shortText = z.string().max(255);
const longText = z.string().max(20_000);

/** File metadata attached to a chat or group message. */
const fileFields = {
  fileUrl: z.string().url().max(2048).nullish(),
  fileName: shortText.nullish(),
  fileType: shortText.nullish(),
  fileSize: z.number().int().nonnegative().nullish(),
};

/**
 * Parses `body` against `schema`, throwing a 400 response on failure.
 * Returns a discriminated result so routes can early-return without try/catch.
 */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { ok: true; data: z.infer<T> } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body);

  if (!result.success) {
    // Field paths only -- no raw values echoed back to the caller.
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "(root)")
      .filter((value, index, all) => all.indexOf(value) === index);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request body", fields },
        { status: 400 }
      ),
    };
  }

  return { ok: true, data: result.data };
}

/* ------------------------------------------------------------------ *
 * auth / onboarding
 * ------------------------------------------------------------------ */

export const signupSchema = z.object({
  name: shortText.optional(),
  email: z.string().email().max(320),
  // Matches the signup form's own minimum (app/(root)/signup/page.tsx).
  // Worth raising both to 8+ together -- changing only this side would reject
  // passwords the UI accepts.
  password: z.string().min(6).max(200),
});

export const onboardingSchema = z.object({
  // Accepts the ISO string the onboarding form sends; must be a real date.
  birthdate: z.coerce.date(),
  school: z.string().min(1).max(200),
  role: z.enum(["STUDENT", "TEACHER"]),
});

/* ------------------------------------------------------------------ *
 * chat
 * ------------------------------------------------------------------ */

export const createConversationSchema = z
  .object({
    otherUserId: id.optional(),
    conversationId: id.optional(),
  })
  .refine((v) => v.otherUserId || v.conversationId, {
    message: "Either otherUserId or conversationId is required",
  });

export const sendMessageSchema = z
  .object({
    conversationId: id,
    content: longText.nullish(),
    ...fileFields,
  })
  .refine((v) => (v.content && v.content.trim()) || v.fileUrl, {
    message: "Either content or file is required",
  });

/* ------------------------------------------------------------------ *
 * groups
 * ------------------------------------------------------------------ */

export const createGroupSchema = z.object({
  name: z.string().min(1).max(200),
  description: longText.nullish(),
  memberIds: z.array(id).max(500).optional().default([]),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: longText.nullish(),
  pinnedMessageId: id.nullish(),
});

export const addMembersSchema = z.object({
  userIds: z.array(id).min(1).max(500),
});

export const updateMemberRoleSchema = z.object({
  userId: id,
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const pinMessageSchema = z.object({
  messageId: id,
});

export const groupMessageSchema = z
  .object({
    content: longText.nullish(),
    ...fileFields,
  })
  .refine((v) => (v.content && v.content.trim()) || v.fileUrl, {
    message: "Message content or file is required",
  });

/* ------------------------------------------------------------------ *
 * lessons + content
 * ------------------------------------------------------------------ */

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(300),
  subject: z.string().min(1).max(200),
  type: z.string().min(1).max(50),
  tags: z.array(z.string().min(1).max(80)).max(50).optional().default([]),
  published: z.boolean().optional(),
});

const contentType = z.enum([
  "MARKDOWN",
  "PDF",
  "PPT",
  "DOC",
  "IMAGE",
  "OTHER",
]);

export const createContentSchema = z
  .object({
    title: z.string().min(1).max(300),
    type: contentType,
    markdown: longText.nullish(),
    fileUrl: z.string().max(2048).nullish(),
    fileName: shortText.nullish(),
  })
  .refine((v) => (v.type === "MARKDOWN" ? Boolean(v.markdown) : Boolean(v.fileUrl)), {
    message: "MARKDOWN content requires markdown; other types require a file",
  });

export const updateContentSchema = z.object({
  title: z.string().min(1).max(300),
  markdown: longText.nullish(),
});

/* ------------------------------------------------------------------ *
 * videos
 * ------------------------------------------------------------------ */

export const updateVideoSchema = z.object({
  title: z.string().min(1).max(300),
  description: longText.nullish(),
});

/* ------------------------------------------------------------------ *
 * quizzes
 * ------------------------------------------------------------------ */

// Accepts null from the client but normalises it to undefined, which is what
// the quiz route's own QuizQuestion/QuizOption types expect.
const optionalImageUrl = z
  .string()
  .max(2048)
  .nullish()
  .transform((v) => v ?? undefined);

const quizOptionSchema = z.object({
  text: z.string().min(1).max(2000),
  imageUrl: optionalImageUrl,
  isCorrect: z.boolean(),
});

const quizQuestionSchema = z.object({
  text: z.string().min(1).max(5000),
  imageUrl: optionalImageUrl,
  points: z.number().int().min(0).max(1000).optional(),
  options: z.array(quizOptionSchema).min(2).max(20),
});

export const quizSchema = z.object({
  title: z.string().min(1).max(300),
  description: longText.nullish(),
  timeLimit: z.number().int().min(1).max(1440).nullish(),
  maxAttempts: z.number().int().min(1).max(100).nullish(),
  questions: z.array(quizQuestionSchema).min(1).max(200),
});

export const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: id,
        optionId: id,
      })
    )
    .max(200),
});

/* ------------------------------------------------------------------ *
 * reports
 * ------------------------------------------------------------------ */

export const studentNoteSchema = z.object({
  note: z.string().trim().min(1).max(5000),
});
