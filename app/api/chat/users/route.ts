import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/authOptions'; // Adjust path as needed
import { prisma } from '@/lib/prisma'; // Adjust path as needed

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'TEACHER' or 'STUDENT'

    if (!role || (role !== 'TEACHER' && role !== 'STUDENT')) {
      return NextResponse.json({ error: 'Invalid role parameter' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Role-based access control
    if (currentUser.role === 'TEACHER' && role !== 'STUDENT') {
      return NextResponse.json({ error: 'Teachers can only view students' }, { status: 403 });
    }
    
    if (currentUser.role === 'STUDENT' && role !== 'TEACHER') {
      return NextResponse.json({ error: 'Students can only view teachers' }, { status: 403 });
    }

    // Fetch users of the requested role, sorted by last name
    const users = await prisma.user.findMany({
      where: {
        role: role,
        id: { not: currentUser.id }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: [
        {
          name: 'asc' // This will sort by full name, but we'll handle last name sorting in the frontend
        }
      ]
    });

    // Sort by last name (assuming name format is "First Last")
    const sortedUsers = users.sort((a, b) => {
      const aLastName = a.name?.split(' ').pop() || '';
      const bLastName = b.name?.split(' ').pop() || '';
      return aLastName.localeCompare(bLastName);
    });

    return NextResponse.json({ users: sortedUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
