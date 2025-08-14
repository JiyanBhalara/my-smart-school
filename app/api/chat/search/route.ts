// File: app/api/chat/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    let users;
    
    if (query.trim() === '') {
      // Return all users when no query (for group creation)
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true, // FIXED: Added email field
          image: true,
          role: true,
        },
        orderBy: [
          { role: 'desc' }, // Teachers first
          { name: 'asc' }
        ]
      });
    } else {
      // Search users by name or email
      users = await prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true, // FIXED: Added email field
          image: true,
          role: true,
        },
        take: 20,
        orderBy: [
          { role: 'desc' }, // Teachers first
          { name: 'asc' }
        ]
      });
    }

    console.log(`Search API: Found ${users.length} users`); // DEBUG
    console.log('First user sample:', users[0]); // DEBUG

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
