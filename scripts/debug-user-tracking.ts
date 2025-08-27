import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function debugUserTracking() {
  console.log('🔍 Debugging user tracking for ur.lucky.turtle@gmail.com...')
  
  try {
    const email = 'ur.lucky.turtle@gmail.com'
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        apiKeys: true,
        apiLogs: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: {
            apiKey: true
          }
        }
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log(`\n✅ User found:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   API Keys: ${user.apiKeys.length}`)
    console.log(`   API Logs: ${user.apiLogs.length}`)
    
    console.log(`\n🔑 API Keys:`)
    user.apiKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key.name} (${key.key.substring(0, 8)}...) - Active: ${key.isActive}`)
    })
    
    console.log(`\n📝 Recent API Logs:`)
    user.apiLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.endpoint}`)
      console.log(`      Time: ${log.timestamp}`)
      console.log(`      Method: ${log.method}`)
      console.log(`      Status: ${log.statusCode}`)
      console.log(`      User ID: ${log.userId}`)
      console.log(`      API Key ID: ${log.apiKeyId}`)
      console.log(`      API Key Name: ${log.apiKey?.name || 'Unknown'}`)
      console.log('')
    })
    
    // Test the getApiLogs function
    console.log(`\n🧪 Testing getApiLogs function:`)
    const { getApiLogs } = await import('../lib/db')
    
    const logs = await getApiLogs({
      userId: user.id,
      page: 1,
      limit: 10
    })
    
    console.log(`   Result: ${logs.logs.length} logs found`)
    console.log(`   Total: ${logs.total}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUserTracking()
