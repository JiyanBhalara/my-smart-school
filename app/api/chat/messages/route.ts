import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions'; // Adjust path as needed
import { prisma } from '@/lib/prisma'; // Adjust path as needed
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Add this import, adjust path as needed

// GET messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { teacherId: currentUser.id },
          { studentId: currentUser.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read for the current user
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content, fileUrl, fileName, fileType, fileSize } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    if (!content && !fileUrl) {
      return NextResponse.json({ error: 'Either content or file is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { teacherId: currentUser.id },
          { studentId: currentUser.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: currentUser.id,
        content: content || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true }
        }
      }
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE method - Add this to your existing app/api/chat/messages/route.ts file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is part of this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { teacherId: currentUser.id },
          { studentId: currentUser.id }
        ]
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    // Get all messages with files in this conversation
    const messagesWithFiles = await prisma.message.findMany({
      where: {
        conversationId,
        fileUrl: { not: null }
      },
      select: { fileUrl: true }
    });

    // Delete files from Supabase Storage
    for (const message of messagesWithFiles) {
      if (message.fileUrl) {
        try {
          // Extract file path from URL
          const urlPath = new URL(message.fileUrl).pathname;
          const storagePath = urlPath.split('/').slice(-2).join('/'); // userId/filename
          
          await supabaseAdmin.storage
            .from('chat-files')
            .remove([storagePath]);
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continue deleting other files even if one fails
        }
      }
    }

    // Delete all messages in the conversation
    await prisma.message.deleteMany({
      where: { conversationId }
    });

    return NextResponse.json({ success: true, message: 'Chat history cleared successfully' });

  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
