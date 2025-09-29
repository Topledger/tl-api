import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// API Logging function
export async function logApiCall({
  userId,
  apiKeyId,
  endpoint,
  method,
  statusCode,
  responseTime,
  userAgent,
  ipAddress,
  requestSize,
  responseSize,
  errorMessage
}: {
  userId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime?: number;
  userAgent?: string;
  ipAddress?: string;
  requestSize?: number;
  responseSize?: number;
  errorMessage?: string;
}) {
  try {
    // Log the API call
    const log = await prisma.apiLog.create({
      data: {
        userId,
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTime,
        userAgent,
        ipAddress,
        requestSize,
        responseSize,
        errorMessage,
        timestamp: new Date() // Explicitly set current timestamp
      }
    });

    // Update API key usage
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        totalHits: { increment: 1 },
        lastUsed: new Date()
      }
    });

    return log;
  } catch (error) {
    console.error('Error logging API call:', error);
    throw error;
  }
}

// Get API logs with filtering and pagination
export async function getApiLogs({
  userId,
  apiKeyId,
  endpoint,
  startDate,
  endDate,
  page = 1,
  limit = 50
}: {
  userId?: string;
  apiKeyId?: string;
  endpoint?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  
  if (userId) where.userId = userId;
  if (apiKeyId) where.apiKeyId = apiKeyId;
  if (endpoint) where.endpoint = { contains: endpoint, mode: 'insensitive' };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.apiLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        apiKey: { select: { name: true } }
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.apiLog.count({ where })
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

// Deduct credits from user account
export async function deductUserCredits(userId: string, amount: number = 1): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return false;
    }

    if (user.credits < amount) {
      // Insufficient credits for user
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: { decrement: amount }
      }
    });

    // Credits deducted successfully
    return true;
  } catch (error) {
    console.error('Error deducting user credits:', error);
    return false;
  }
}

// Check if user has sufficient credits
export async function checkUserCredits(userId: string, requiredAmount: number = 1): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user) {
      console.error(`User not found: ${userId}`);
      return false;
    }

    return user.credits >= requiredAmount;
  } catch (error) {
    console.error('Error checking user credits:', error);
    return false;
  }
}

// Get user's current credit balance
export async function getUserCredits(userId: string): Promise<number | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    return user?.credits || null;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return null;
  }
}

// Get API usage statistics
export async function getApiUsageStats({
  userId,
  apiKeyId,
  startDate,
  endDate
}: {
  userId?: string;
  apiKeyId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  
  if (userId) where.userId = userId;
  if (apiKeyId) where.apiKeyId = apiKeyId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  // Total API calls
  const totalCalls = await prisma.apiLog.count({ where });

  // Success rate
  const successfulCalls = await prisma.apiLog.count({
    where: { ...where, statusCode: { gte: 200, lt: 400 } }
  });

  // Most used endpoints
  const topEndpoints = await prisma.apiLog.groupBy({
    by: ['endpoint'],
    where,
    _count: { endpoint: true },
    orderBy: { _count: { endpoint: 'desc' } },
    take: 10
  });

  // Daily usage for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const dailyUsageWhere: any = {
    timestamp: { gte: thirtyDaysAgo }
  };
  
  if (userId) dailyUsageWhere.userId = userId;
  if (apiKeyId) dailyUsageWhere.apiKeyId = apiKeyId;

  // Get raw data and group by date in JavaScript (SQLite doesn't have great date functions)
  const rawLogs = await prisma.apiLog.findMany({
    where: dailyUsageWhere,
    select: {
      timestamp: true,
      responseTime: true
    },
    orderBy: { timestamp: 'desc' }
  });

  // Group by date
  const dailyUsageMap = new Map();
  rawLogs.forEach(log => {
    const date = log.timestamp.toISOString().split('T')[0];
    if (!dailyUsageMap.has(date)) {
      dailyUsageMap.set(date, { hits: 0, totalResponseTime: 0, count: 0 });
    }
    const dayData = dailyUsageMap.get(date);
    dayData.hits++;
    if (log.responseTime) {
      dayData.totalResponseTime += log.responseTime;
      dayData.count++;
    }
  });

  const dailyUsage = Array.from(dailyUsageMap.entries()).map(([date, data]) => ({
    date,
    hits: data.hits,
    avg_response_time: data.count > 0 ? data.totalResponseTime / data.count : null
  })).sort((a, b) => b.date.localeCompare(a.date));

  // Calculate monthly statistics (last 30 days)
  const monthlyWhere: any = {
    timestamp: { 
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  };
  
  if (userId) monthlyWhere.userId = userId;
  if (apiKeyId) monthlyWhere.apiKeyId = apiKeyId;

  const monthlyCalls = await prisma.apiLog.count({ where: monthlyWhere });
  const monthlyCredits = monthlyCalls; // 1 credit per call
  const avgCallsPerDay = monthlyCalls / 30;
  const avgCreditsPerDay = monthlyCredits / 30;

  // Calculate average response time for the month
  const monthlyResponseTimeData = await prisma.apiLog.aggregate({
    where: {
      ...monthlyWhere,
      responseTime: { not: null }
    },
    _avg: {
      responseTime: true
    }
  });
  
  const avgResponseTime = monthlyResponseTimeData._avg.responseTime || 0;

  return {
    totalCalls,
    successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
    topEndpoints: topEndpoints.map(item => ({
      endpoint: item.endpoint,
      count: item._count.endpoint
    })),
    dailyUsage,
    monthlyStats: {
      totalCalls: monthlyCalls,
      totalCredits: monthlyCredits,
      avgCallsPerDay,
      avgCreditsPerDay,
      avgResponseTime
    }
  };
}
