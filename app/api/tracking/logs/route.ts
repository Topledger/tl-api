import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getApiLogs, prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const endpoint = searchParams.get('endpoint') || undefined;
    const apiKeyId = searchParams.get('apiKeyId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    // Get user from session email and find the corresponding database user
    const sessionEmail = session.user.email;
    
    // Find the user in the database by email
    const dbUser = await prisma.user.findUnique({
      where: { email: sessionEmail }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = await getApiLogs({
      userId: dbUser.id,
      apiKeyId,
      endpoint,
      startDate,
      endDate,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching API logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
