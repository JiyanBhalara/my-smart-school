import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/utils/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch conversations where user is participant
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { teacherId: user.id },
        { studentId: user.id }
      ]
    },
    include: {
      teacher: {
        select: { id: true, name: true, email: true, image: true, role: true }
      },
      student: {
        select: { id: true, name: true, email: true, image: true, role: true }
      }
    }
  });

  return NextResponse.json({ conversations });
}
