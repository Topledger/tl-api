import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getApiUsageStats, prisma } from '@/lib/db';
import { 
  parsePaginationParams, 
  validatePaginationParams, 
  createPaginatedResponse 
} from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
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

    const stats = await getApiUsageStats({
      userId: dbUser.id,
      apiKeyId,
      startDate,
      endDate
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching API usage stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
