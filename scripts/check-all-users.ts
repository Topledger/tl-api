import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function checkAllUsers() {
  console.log('🔍 Checking all users in database...')
  
  try {
    const users = await prisma.user.findMany({
      include: {
        apiKeys: true,
        apiLogs: {
          take: 3,
          orderBy: { timestamp: 'desc' }
        }
      }
    })
    
    console.log(`📊 Found ${users.length} users:`)
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Name: ${user.name}`)
      console.log(`   - API Keys: ${user.apiKeys.length}`)
      console.log(`   - Recent API Logs: ${user.apiLogs.length}`)
      
      if (user.apiKeys.length > 0) {
        console.log(`   - API Key Names: ${user.apiKeys.map(k => k.name).join(', ')}`)
      }
      
      if (user.apiLogs.length > 0) {
        console.log(`   - Latest Log: ${user.apiLogs[0].endpoint} (${user.apiLogs[0].timestamp})`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllUsers()
