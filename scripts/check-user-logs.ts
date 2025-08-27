import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkUserLogs() {
  console.log('🔍 Checking logs for tiwari2010iit@gmail.com...\n');

  try {
    // Get the user ID
    const user = await prisma.user.findUnique({
      where: { email: 'tiwari2010iit@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log(`👤 User ID: ${user.id}`);

    // Get all logs for this user ordered by timestamp
    const allLogs = await prisma.apiLog.findMany({
      where: {
        userId: user.id
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        apiKey: { select: { name: true, key: true } }
      }
    });

    console.log(`\n📊 All logs for this user: ${allLogs.length}`);
    allLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp.toISOString()}`);
      console.log(`     ${log.method} ${log.endpoint}`);
      console.log(`     API Key: ${log.apiKey.name} (${log.apiKey.key})`);
      console.log(`     Status: ${log.statusCode}, Response Time: ${log.responseTime}ms`);
      console.log('');
    });

    // Check logs from today specifically
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysLogs = await prisma.apiLog.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { timestamp: 'desc' },
      include: {
        apiKey: { select: { name: true, key: true } }
      }
    });

    console.log(`📅 Logs from today (${today.toDateString()}): ${todaysLogs.length}`);
    todaysLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp.toISOString()}`);
      console.log(`     ${log.method} ${log.endpoint}`);
      console.log(`     API Key: ${log.apiKey.name} (${log.apiKey.key})`);
    });

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserLogs();
