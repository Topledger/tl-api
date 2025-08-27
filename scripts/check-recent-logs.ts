import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkRecentLogs() {
  console.log('🔍 Checking recent API logs...\n');

  try {
    // Check the most recent 10 logs
    const recentLogs = await prisma.apiLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        apiKey: { select: { name: true, key: true } }
      }
    });

    console.log(`📊 Recent API Logs (last 10):`);
    if (recentLogs.length === 0) {
      console.log('  ❌ No API logs found!');
    } else {
      recentLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.timestamp.toISOString()}`);
        console.log(`     ${log.method} ${log.endpoint}`);
        console.log(`     User: ${log.user.email}`);
        console.log(`     API Key: ${log.apiKey.name} (${log.apiKey.key})`);
        console.log(`     Status: ${log.statusCode}, Response Time: ${log.responseTime}ms`);
        console.log('');
      });
    }

    // Check logs from the last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentCount = await prisma.apiLog.count({
      where: {
        timestamp: {
          gte: oneHourAgo
        }
      }
    });

    console.log(`📈 API calls in the last hour: ${recentCount}`);

    // Check which API keys have been used recently
    const activeKeys = await prisma.apiKey.findMany({
      where: {
        lastUsed: {
          gte: oneHourAgo
        }
      },
      include: {
        user: { select: { email: true } }
      }
    });

    console.log(`🔑 Active API keys in the last hour: ${activeKeys.length}`);
    activeKeys.forEach(key => {
      console.log(`  ${key.name} (${key.key}) - User: ${key.user.email}`);
    });

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentLogs();
