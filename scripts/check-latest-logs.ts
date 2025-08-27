import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkLatestLogs() {
  console.log('🔍 Checking the latest 5 logs in the database...\n');

  try {
    const latestLogs = await prisma.apiLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        user: { select: { email: true } },
        apiKey: { select: { name: true, key: true } }
      }
    });

    console.log(`📊 Latest 5 logs:`);
    latestLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp.toISOString()}`);
      console.log(`     ${log.method} ${log.endpoint}`);
      console.log(`     User: ${log.user.email}`);
      console.log(`     API Key: ${log.apiKey.name} (${log.apiKey.key})`);
      console.log(`     Status: ${log.statusCode}, Response Time: ${log.responseTime}ms`);
      console.log('');
    });

    // Check current time
    console.log(`🕒 Current time: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestLogs();
