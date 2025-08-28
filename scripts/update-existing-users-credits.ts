#!/usr/bin/env ts-node

/**
 * Script to update existing users in the database to have 5000 credits
 * Run this script with: npx ts-node scripts/update-existing-users-credits.ts
 */

const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function updateExistingUsers() {
  try {
    console.log('🔄 Starting to update existing users with credits...');

    // Get all users that have 0 credits (new users will have 5000 by default)
    const usersToUpdate = await prisma.user.findMany({
      where: {
        credits: {
          lte: 0 // Less than or equal to 0
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true
      }
    });

    console.log(`📊 Found ${usersToUpdate.length} users with 0 or negative credits`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need credit updates. All users already have credits.');
      return;
    }

    // Update all users to have 5000 credits
    const updateResult = await prisma.user.updateMany({
      where: {
        credits: {
          lte: 0
        }
      },
      data: {
        credits: 5000
      }
    });

    console.log(`✅ Successfully updated ${updateResult.count} users with 5000 credits`);

    // Verify the updates
    const updatedUsers = await prisma.user.findMany({
              where: {
          id: {
            in: usersToUpdate.map((u: any) => u.id)
          }
        },
      select: {
        id: true,
        email: true,
        credits: true
      }
    });

    console.log('📋 Updated users:');
    updatedUsers.forEach((user: any) => {
      console.log(`  - ${user.email}: ${user.credits} credits`);
    });

  } catch (error) {
    console.error('❌ Error updating user credits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Alternative function to update ALL users regardless of current credits
async function updateAllUsers() {
  try {
    console.log('🔄 Updating ALL users to have 5000 credits...');

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        credits: true
      }
    });

    console.log(`📊 Found ${allUsers.length} total users`);

    if (allUsers.length === 0) {
      console.log('ℹ️ No users found in database.');
      return;
    }

    const updateResult = await prisma.user.updateMany({
      data: {
        credits: 5000
      }
    });

    console.log(`✅ Successfully updated ${updateResult.count} users with 5000 credits`);

    // Show final state
    const finalUsers = await prisma.user.findMany({
      select: {
        email: true,
        credits: true
      }
    });

    console.log('📋 All users after update:');
    finalUsers.forEach((user: any) => {
      console.log(`  - ${user.email}: ${user.credits} credits`);
    });

  } catch (error) {
    console.error('❌ Error updating all user credits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const updateAll = args.includes('--all');

if (updateAll) {
  console.log('🎯 Running in --all mode: updating ALL users');
  updateAllUsers().catch(console.error);
} else {
  console.log('🎯 Running in default mode: updating only users with 0 or negative credits');
  console.log('💡 Use --all flag to update ALL users regardless of current credits');
  updateExistingUsers().catch(console.error);
}
