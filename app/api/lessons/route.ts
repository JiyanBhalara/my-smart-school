import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/utils/authOptions';
import prisma from '@/lib/prisma';

export async function GET() { // Removed unused request parameter
  try {
    // Pass the request object to getServerSession for proper session handling
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lessons = await prisma.lesson.findMany({
      where: { published: true },
      include: {
        _count: { // Fixed: single underscore
          select: { quizzes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Lessons found:', lessons.length); // Debug log
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
