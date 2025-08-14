// File: app/api/groups/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
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

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: user.id }
        }
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: { id: true, name: true } } }
        },
        pinnedMessage: {
          include: { sender: { select: { id: true, name: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      select: { id: true, role: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can create groups' }, { status: 403 });
    }

    const { name, description, memberIds } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Filter out duplicates and ensure creator is not in memberIds
    const uniqueMemberIds = Array.isArray(memberIds) 
      ? [...new Set(memberIds)].filter(id => id !== user.id)
      : [];

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        createdById: user.id,
        members: {
          create: [
            { userId: user.id, role: 'ADMIN' },
            ...uniqueMemberIds.map((id: string) => ({ userId: id, role: 'MEMBER' as const }))
          ]
        }
      },
      include: {
        createdBy: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, role: true } }
          }
        }
      }
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
