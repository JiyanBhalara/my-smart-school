// app/api/uploads/quiz-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Ensure Node runtime (Buffer support)
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL; // Fixed: removed escaped underscore
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY; // Fixed: removed escaped underscores
const BUCKET = process.env.SUPABASE_BUCKET || "quiz-assets"; // Fixed: removed escaped underscore

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars"); // Fixed: removed escaped underscores
}

// Create supabase client with custom fetch configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
  global: {
    fetch: ((url: string | URL | Request, options: RequestInit = {}) => {
      // Add timeout and retry configuration
      return fetch(url, {
        ...options,
        // Increase timeout to 60 seconds
        signal: AbortSignal.timeout(60000),
      });
    }) as typeof fetch,
  },
});

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-");
}

async function uploadWithRetry(
  bucket: string,
  filePath: string,
  buffer: Buffer,
  contentType: string,
  maxRetries = 3
): Promise<{ data: unknown; error: Error | null }> {
  let lastError: Error = new Error("Unknown upload error");
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for file: ${filePath}`); // Fixed: removed escaped backticks
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      console.log(`Upload successful on attempt ${attempt}`); // Fixed: removed escaped backticks
      return { data, error: null };
    } catch (error: unknown) {
      lastError = error as Error;
      console.error(`Upload attempt ${attempt} failed:`, error); // Fixed: removed escaped backticks
      
      // If it's a network error and we have retries left, wait and try again
      if (attempt < maxRetries && (
        (error as { code?: string }).code === 'UND_ERR_SOCKET' ||  // Fixed: removed escaped underscore
        (error as { message?: string }).message?.includes('fetch failed') ||
        (error as { message?: string }).message?.includes('network') ||
        (error as { message?: string }).message?.includes('timeout')
      )) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Fixed: removed escaped backslash
        console.log(`Waiting ${delay}ms before retry...`); // Fixed: removed escaped backticks
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's not a retryable error or we're out of retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const lessonId = (formData.get("lessonId") as string) || "unknown";
    const scope = (formData.get("scope") as string) || "question";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Reduce max file size to 3MB to prevent network timeouts
    const MAX_MB = 3; // Fixed: removed escaped underscore
    const MAX_BYTES = MAX_MB * 1024 * 1024; // Fixed: removed escaped backslash
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_MB}MB to prevent upload timeouts` }, // Fixed: removed escaped backticks
        { status: 413 }
      );
    }

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }

    // Read file (Node Buffer)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Processing upload: ${file.name} (${file.size} bytes, ${file.type})`); // Fixed: removed escaped backticks

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const rnd = crypto.randomBytes(6).toString("hex");
    const baseName = safeName(file.name.replace(/\.[^.]+$/, "")) || "image";
    const filePath = `quizzes/${session.user.id}/${lessonId}/${scope}-${Date.now()}-${rnd}-${baseName}.${ext}`; // Fixed: removed escaped backticks

    // Upload the file with retry logic
    const { error: uploadError } = await uploadWithRetry(
      BUCKET,
      filePath,
      buffer,
      file.type,
      3 // 3 retry attempts
    );

    if (uploadError) {
      console.error("Upload error after retries:", uploadError);
      return NextResponse.json(
        {
          error: `Upload failed after retries: ${uploadError.message}`, // Fixed: removed escaped backticks
          details: uploadError,
        },
        { status: 500 }
      );
    }

    // Create signed URL with retry logic
    let signedUrlData;
    let signedUrlError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(filePath, 31536000); // 1 year expiry
        
        signedUrlData = result.data;
        signedUrlError = result.error;
        break;
      } catch (error: unknown) {
        console.error(`Signed URL attempt ${attempt} failed:`, error); // Fixed: removed escaped backticks
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          signedUrlError = error as Error;
        }
      }
    }

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        {
          error: `Failed to create signed URL: ${signedUrlError.message}`, // Fixed: removed escaped backticks
          details: signedUrlError,
        },
        { status: 500 }
      );
    }

    if (!signedUrlData || !signedUrlData.signedUrl) {
      console.error("createSignedUrl error: No signed URL returned");
      return NextResponse.json(
        { error: "Failed to get signed URL" },
        { status: 500 }
      );
    }

    const signedUrl = signedUrlData.signedUrl;
    
    console.log(`Upload completed successfully: ${filePath}`); // Fixed: removed escaped backticks
    
    return NextResponse.json({ 
      url: signedUrl, 
      path: filePath,
      expiresAt: new Date(Date.now() + 31536000 * 1000).toISOString() // Fixed: removed escaped backslash
    });
    
  } catch (e: unknown) {
    console.error("Upload failed:", e);
    
    // Provide more specific error messages based on error type
    let errorMessage = "Internal server error";
    if ((e as { code?: string }).code === 'UND_ERR_SOCKET') { // Fixed: removed escaped underscore
      errorMessage = "Network connection error. Please try again with a smaller file.";
    } else if ((e as { message?: string }).message?.includes('fetch failed')) {
      errorMessage = "Network error during upload. Please check your connection and try again.";
    } else if ((e as { message?: string }).message?.includes('timeout')) {
      errorMessage = "Upload timed out. Please try with a smaller file.";
    }
    
    return NextResponse.json(
      { error: errorMessage, details: (e as { message?: string }).message },
      { status: 500 }
    );
  }
}
