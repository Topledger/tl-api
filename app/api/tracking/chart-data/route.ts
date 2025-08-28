import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('apiKeyId') || undefined;
    const timeRange = searchParams.get('timeRange') || 'daily'; // daily, weekly, monthly
    const daysBack = parseInt(searchParams.get('daysBack') || '30');
    
    // Get user from session email
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const where: any = {
      userId: dbUser.id,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    if (apiKeyId) where.apiKeyId = apiKeyId;

    // Get raw logs with necessary data
    const rawLogs = await prisma.apiLog.findMany({
      where,
      select: {
        timestamp: true,
        apiKeyId: true,
        statusCode: true,
        responseTime: true,
        apiKey: {
          select: {
            name: true
          }
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Function to group data by time period
    const getTimeKey = (date: Date, range: string) => {
      const d = new Date(date);
      switch (range) {
        case 'daily':
          return d.toISOString().split('T')[0];
        case 'weekly':
          // Use UTC to avoid timezone issues
          const utcDate = new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
          const dayOfWeek = utcDate.getUTCDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; otherwise go back (dayOfWeek - 1) days
          const weekStart = new Date(utcDate);
          weekStart.setUTCDate(utcDate.getUTCDate() - daysToSubtract);
          return weekStart.toISOString().split('T')[0];
        case 'monthly':
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        case 'quarterly':
          const quarter = Math.floor(d.getMonth() / 3) + 1;
          return `${d.getFullYear()}-Q${quarter}`;
        default:
          return d.toISOString().split('T')[0];
      }
    };

    // Group data by time and API key
    const usageByTime = new Map();
    const usageByApiKey = new Map();
    const creditsByApiKey = new Map();
    
    rawLogs.forEach(log => {
      const timeKey = getTimeKey(log.timestamp, timeRange);
      const apiKeyName = log.apiKey.name;
      
      // Time-based aggregation
      if (!usageByTime.has(timeKey)) {
        usageByTime.set(timeKey, {
          date: timeKey,
          hits: 0,
          credits: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
          responseTimeCount: 0,
          successfulCalls: 0
        });
      }
      
      const timeData = usageByTime.get(timeKey);
      timeData.hits++;
      timeData.credits++; // 1 credit per API call
      
      if (log.responseTime) {
        timeData.totalResponseTime += log.responseTime;
        timeData.responseTimeCount++;
        timeData.avgResponseTime = timeData.totalResponseTime / timeData.responseTimeCount;
      }
      
      if (log.statusCode >= 200 && log.statusCode < 400) {
        timeData.successfulCalls++;
      }

      // API Key-based aggregation
      if (!usageByApiKey.has(apiKeyName)) {
        usageByApiKey.set(apiKeyName, {
          name: apiKeyName,
          hits: 0,
          credits: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
          responseTimeCount: 0,
          successRate: 0,
          successfulCalls: 0,
          totalCalls: 0
        });
      }
      
      const apiKeyData = usageByApiKey.get(apiKeyName);
      apiKeyData.hits++;
      apiKeyData.credits++;
      apiKeyData.totalCalls++;
      
      if (log.responseTime) {
        apiKeyData.totalResponseTime += log.responseTime;
        apiKeyData.responseTimeCount++;
        apiKeyData.avgResponseTime = apiKeyData.totalResponseTime / apiKeyData.responseTimeCount;
      }
      
      if (log.statusCode >= 200 && log.statusCode < 400) {
        apiKeyData.successfulCalls++;
      }
      
      apiKeyData.successRate = (apiKeyData.successfulCalls / apiKeyData.totalCalls) * 100;

      // Credits by API key for time series
      const creditKey = `${timeKey}-${apiKeyName}`;
      if (!creditsByApiKey.has(creditKey)) {
        creditsByApiKey.set(creditKey, {
          date: timeKey,
          apiKey: apiKeyName,
          credits: 0,
          hits: 0
        });
      }
      creditsByApiKey.get(creditKey).credits++;
      creditsByApiKey.get(creditKey).hits++;
    });

    // Convert maps to arrays and sort
    const timeSeriesData = Array.from(usageByTime.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    
    const apiKeyData = Array.from(usageByApiKey.values()).sort((a, b) => 
      b.hits - a.hits
    );

    const creditsTimeSeriesData = Array.from(creditsByApiKey.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    return NextResponse.json({
      timeSeriesData,
      apiKeyData,
      creditsTimeSeriesData,
      totalLogs: rawLogs.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
