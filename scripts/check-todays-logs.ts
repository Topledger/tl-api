import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

async function checkTodaysLogs() {
  console.log('🔍 Checking today\'s API logs...\n');

  try {
    // Check logs from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysLogs = await prisma.apiLog.findMany({
      where: {
        timestamp: {
          gte: today
        }
      },
      include: {
        user: { select: { name: true, email: true } },
        apiKey: { select: { name: true, key: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    console.log(`📊 Today's API Logs (${todaysLogs.length} found):`);
    if (todaysLogs.length === 0) {
      console.log('  ❌ No API logs found for today!');
    } else {
      todaysLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.timestamp.toISOString()}`);
        console.log(`     ${log.method} ${log.endpoint}`);
        console.log(`     User: ${log.user.email}`);
        console.log(`     API Key: ${log.apiKey.name} (${log.apiKey.key})`);
        console.log(`     Status: ${log.statusCode}, Response Time: ${log.responseTime}ms`);
        console.log('');
      });
    }

    // Check the absolute latest log
    const latestLog = await prisma.apiLog.findFirst({
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        apiKey: { select: { name: true, key: true } }
      }
    });

    console.log(`🕒 Latest log in database:`);
    if (latestLog) {
      console.log(`   ${latestLog.timestamp.toISOString()}`);
      console.log(`   ${latestLog.method} ${latestLog.endpoint}`);
      console.log(`   User: ${latestLog.user.email}`);
      console.log(`   API Key: ${latestLog.apiKey.name}`);
    } else {
      console.log('   No logs found!');
    }

    // Check total logs count
    const totalLogs = await prisma.apiLog.count();
    console.log(`\n📈 Total logs in database: ${totalLogs}`);

  } catch (error) {
    console.error('❌ Error checking logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodaysLogs();
