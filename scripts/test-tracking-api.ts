import { getApiLogs } from '../lib/db';

async function testTrackingApi() {
  console.log('🔍 Testing tracking API directly...\n');

  try {
    // Test with user ID that has logs
    const userId = 'cmeug4ovc000ansba7d07vv7z'; // tiwari2010iit@gmail.com
    
    const result = await getApiLogs({
      userId,
      page: 1,
      limit: 5
    });

    console.log(`📊 Found ${result.total} total logs for user`);
    console.log(`📄 Page ${result.page} of ${result.totalPages}`);
    console.log('\n🔍 Sample logs:');
    
    result.logs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp.toISOString()}`);
      console.log(`     Method: ${log.method}`);
      console.log(`     Endpoint: ${log.endpoint}`);
      console.log(`     Status: ${log.statusCode}`);
      console.log(`     User: ${log.user.email || log.user.name || 'Unknown'}`);
      console.log(`     API Key: ${log.apiKey?.name || 'Unknown'}`);
      console.log(`     Response Time: ${log.responseTime}ms`);
      console.log('');
    });

    // Test with date range that should include recent logs
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2); // Last 2 days

    console.log(`\n🗓️ Testing with date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    const dateRangeResult = await getApiLogs({
      userId,
      startDate,
      endDate,
      page: 1,
      limit: 3
    });

    console.log(`📊 Found ${dateRangeResult.total} logs in date range`);
    dateRangeResult.logs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp.toISOString()} - ${log.method} ${log.endpoint.substring(0, 60)}...`);
    });

  } catch (error) {
    console.error('❌ Error testing tracking API:', error);
  }
}

testTrackingApi();
