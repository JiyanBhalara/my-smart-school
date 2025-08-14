// File: app/api/groups/upload/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma'; // Fixed import - remove destructuring
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Ensure Node runtime (Buffer support)
export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'group-attachments';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

// Create supabase client with custom fetch configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        signal: AbortSignal.timeout(60000), // 60 second timeout
      });
    },
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
  let lastError: Error | undefined = undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for file: ${filePath}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      console.log(`Upload successful on attempt ${attempt}`);
      return { data, error: null };
    } catch (error: unknown) {
      lastError = error as Error;
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries && (
        (error as { code?: string }).code === 'UND_ERR_SOCKET' || 
        (error as { message?: string }).message?.includes('fetch failed') ||
        (error as { message?: string }).message?.includes('network') ||
        (error as { message?: string }).message?.includes('timeout')
      )) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  if (lastError) {
    throw lastError;
  } else {
    throw new Error('Unknown upload error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { // Fixed: single underscore
          groupId,
          userId: user.id
        }
      }
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate file type and size
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed. Supported: images, PDF, Word documents, text files' 
      }, { status: 400 });
    }

    // Reduce to 5MB to prevent timeouts
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size: 5MB' 
      }, { status: 400 });
    }

    // Generate unique filename
    const rnd = crypto.randomBytes(6).toString("hex");
    const ext = file.name.split('.').pop() || 'bin';
    const baseName = safeName(file.name.replace(/\.[^.]+$/, "")) || "file";
    const filePath = `group-${groupId}/${Date.now()}-${rnd}-${baseName}.${ext}`;

    console.log(`Processing upload: ${file.name} (${file.size} bytes, ${file.type})`);

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage with retry logic
    const { error: uploadError } = await uploadWithRetry(
      BUCKET,
      filePath,
      buffer,
      file.type,
      3
    );

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }

    // Create signed URL with long expiry (1 year) with retry logic
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
        console.error(`Signed URL attempt ${attempt} failed:`, error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          signedUrlError = error as Error;
        }
      }
    }

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return NextResponse.json({ 
        error: `Failed to create signed URL: ${signedUrlError.message}` 
      }, { status: 500 });
    }

    if (!signedUrlData || !signedUrlData.signedUrl) {
      console.error('createSignedUrl error: No signed URL returned');
      return NextResponse.json({ 
        error: 'Failed to get signed URL' 
      }, { status: 500 });
    }

    const signedUrl = signedUrlData.signedUrl;

    console.log(`Upload completed successfully: ${filePath}`);

    return NextResponse.json({
      fileUrl: signedUrl,           // Return signed URL instead of public URL
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadPath: filePath,
      expiresAt: new Date(Date.now() + 31536000 * 1000).toISOString()
    });

  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    
    // Provide more specific error messages
    let errorMessage = "Internal server error";
    if ((error as { code?: string }).code === 'UND_ERR_SOCKET') {
      errorMessage = "Network connection error. Please try again with a smaller file.";
    } else if ((error as { message?: string }).message?.includes('fetch failed')) {
      errorMessage = "Network error during upload. Please check your connection and try again.";
    } else if ((error as { message?: string }).message?.includes('timeout')) {
      errorMessage = "Upload timed out. Please try with a smaller file.";
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: (error as { message?: string }).message 
    }, { status: 500 });
  }
}

// Enhanced download endpoint for accessing private files
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const groupId = searchParams.get('groupId');

    if (!filePath || !groupId) {
      return NextResponse.json({ 
        error: 'File path and group ID required' 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { // Fixed: single underscore
          groupId,
          userId: user.id
        }
      }
    });
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create signed URL for download with retry logic
    let signedUrlData;
    let signedUrlError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(filePath, 3600); // 1 hour expiry for downloads
        
        signedUrlData = result.data;
        signedUrlError = result.error;
        break;
      } catch (error: unknown) {
        console.error(`Download signed URL attempt ${attempt} failed:`, error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          signedUrlError = error as Error;
        }
      }
    }

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json({ 
        error: 'Failed to generate download link' 
      }, { status: 500 });
    }

    if (!signedUrlData || !signedUrlData.signedUrl) {
      console.error('createSignedUrl error: No signed URL returned');
      return NextResponse.json({ 
        error: 'Failed to get signed URL' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      downloadUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Error generating download link:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
