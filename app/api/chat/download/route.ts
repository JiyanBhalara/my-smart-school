import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions'; // Adjust path as needed
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { prisma } from '@/lib/prisma'; // Adjust path as needed

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get message and verify access
    const message = await prisma.message.findFirst({
      where: { id: messageId },
      include: {
        conversation: {
          select: {
            teacherId: true,
            studentId: true
          }
        }
      }
    });

    if (!message || !message.fileUrl) {
      return NextResponse.json({ error: 'Message or file not found' }, { status: 404 });
    }

    // Verify user is part of this conversation
    const isAuthorized = 
      message.conversation.teacherId === currentUser.id ||
      message.conversation.studentId === currentUser.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Extract storage path from the original file URL or reconstruct it
    // You might need to store the storage path in your message model
    // For now, we'll extract it from the file URL pattern
    const urlPath = new URL(message.fileUrl).pathname;
    const storagePath = urlPath.split('/').slice(-2).join('/'); // Get last two parts: userId/filename

    // Generate new signed URL (valid for 1 hour)
    const { data: urlData } = await supabaseAdmin.storage
      .from('chat-files')
      .createSignedUrl(storagePath, 3600);

    if (!urlData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.json({ 
      downloadUrl: urlData.signedUrl,
      fileName: message.fileName,
      fileType: message.fileType
    });

  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
