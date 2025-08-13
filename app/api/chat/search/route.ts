import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/utils/authOptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  if (query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Get current user to exclude from results
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Search users case-insensitive, name contains query
  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          id: {
            not: currentUser.id // Exclude current user
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    },
    take: 10
  });

  return NextResponse.json({ users });
}
