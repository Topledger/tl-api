/**
 * Script to update all users in the database to have 1000 credits (Basic plan)
 * This ensures consistency after changing the default credit amount
 */

import { prisma } from '../lib/db.js';

async function updateUsersTo1000Credits() {
  try {
    console.log('🔄 Starting user credits update to 1000...');

    // Update all users to have 1000 credits (new Basic plan amount)
    const updateResult = await prisma.user.updateMany({
      data: {
        credits: 1000
      }
    });

    console.log(`✅ Successfully updated ${updateResult.count} users to 1000 credits`);
    
    // Verify the update
    const userCount = await prisma.user.count();
    const usersWithCorrectCredits = await prisma.user.count({
      where: {
        credits: 1000
      }
    });

    console.log(`📊 Total users: ${userCount}`);
    console.log(`📊 Users with 1000 credits: ${usersWithCorrectCredits}`);
    
    if (userCount === usersWithCorrectCredits) {
      console.log('🎉 All users successfully updated to 1000 credits!');
    } else {
      console.log('⚠️  Some users may not have been updated correctly');
    }

  } catch (error) {
    console.error('❌ Error updating user credits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 User Credits Update Script');
  console.log('============================');
  console.log('This script will update ALL users to have 1000 credits (new Basic plan amount)');
  console.log('');

  try {
    // Get current user count and credit distribution
    const totalUsers = await prisma.user.count();
    const creditStats = await prisma.user.groupBy({
      by: ['credits'],
      _count: {
        credits: true
      },
      orderBy: {
        credits: 'asc'
      }
    });

    console.log(`📊 Current Database Status:`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Credit distribution:`);
    creditStats.forEach((stat: any) => {
      console.log(`  ${stat.credits} credits: ${stat._count.credits} users`);
    });
    console.log('');

    console.log('🔄 Updating ALL users to have 1000 credits...');
    
    await updateUsersTo1000Credits();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();