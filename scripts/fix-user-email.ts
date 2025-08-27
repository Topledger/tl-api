import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function fixUserEmail() {
  console.log('🔧 Fixing user email inconsistency...')
  
  try {
    // Find the user with the incorrect email format
    const wrongUser = await prisma.user.findUnique({
      where: { email: 'ur@lucky.turtle.gmail.com' },
      include: {
        apiKeys: true,
        apiLogs: true
      }
    })
    
    if (!wrongUser) {
      console.log('❌ User with wrong email not found')
      return
    }
    
    console.log(`📊 Found user with wrong email:`)
    console.log(`   Email: ${wrongUser.email}`)
    console.log(`   ID: ${wrongUser.id}`)
    console.log(`   API Keys: ${wrongUser.apiKeys.length}`)
    console.log(`   API Logs: ${wrongUser.apiLogs.length}`)
    
    // Check if the correct user already exists
    const correctUser = await prisma.user.findUnique({
      where: { email: 'ur.lucky.turtle@gmail.com' }
    })
    
    if (correctUser) {
      console.log(`\n✅ Correct user exists, merging data...`)
      console.log(`   Correct user ID: ${correctUser.id}`)
      
      // Update API keys to point to correct user
      const updatedKeys = await prisma.apiKey.updateMany({
        where: { userId: wrongUser.id },
        data: { userId: correctUser.id }
      })
      console.log(`   ✅ Updated ${updatedKeys.count} API keys`)
      
      // Update API logs to point to correct user
      const updatedLogs = await prisma.apiLog.updateMany({
        where: { userId: wrongUser.id },
        data: { userId: correctUser.id }
      })
      console.log(`   ✅ Updated ${updatedLogs.count} API logs`)
      
      // Delete the wrong user
      await prisma.user.delete({
        where: { id: wrongUser.id }
      })
      console.log(`   ✅ Deleted wrong user`)
      
    } else {
      console.log(`\n🔄 Updating user email directly...`)
      
      // Just update the email to the correct format
      const updatedUser = await prisma.user.update({
        where: { id: wrongUser.id },
        data: { email: 'ur.lucky.turtle@gmail.com' }
      })
      console.log(`   ✅ Updated email: ${updatedUser.email}`)
    }
    
    console.log(`\n🎉 Email fix completed!`)
    
    // Verify the fix
    const finalUser = await prisma.user.findUnique({
      where: { email: 'ur.lucky.turtle@gmail.com' },
      include: {
        apiKeys: true,
        apiLogs: true
      }
    })
    
    if (finalUser) {
      console.log(`\n✅ Verification:`)
      console.log(`   Email: ${finalUser.email}`)
      console.log(`   API Keys: ${finalUser.apiKeys.length}`)
      console.log(`   API Logs: ${finalUser.apiLogs.length}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserEmail()
