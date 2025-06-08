// Test script to check and fix the Consistency achievement issue
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function testConsistencyAchievement() {
  try {
    console.log('🔍 Testing Consistency Achievement Fix...\n');
    
    // 1. Check if achievements exist in database
    console.log('1. Checking achievements in database...');
    const achievements = await prisma.achievement.findMany({
      where: {
        code: {
          in: ['habit_streak_3', 'habit_streak_7', 'habit_streak_30']
        }
      },
      orderBy: { code: 'asc' }
    });
    
    console.log(`Found ${achievements.length} streak achievements:`);
    achievements.forEach(ach => {
      console.log(`   - ${ach.code}: "${ach.name}" (${ach.xpReward} XP)`);
    });
    console.log();
    
    // 2. Check for users with habit streaks
    console.log('2. Checking users with active habit streaks...');
    const streaks = await prisma.streak.findMany({
      where: {
        type: 'habit_specific',
        isActive: true,
        currentStreak: {
          gte: 3
        }
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      },
      orderBy: { currentStreak: 'desc' }
    });
    
    console.log(`Found ${streaks.length} users with 3+ day streaks:`);
    for (const streak of streaks) {
      console.log(`   - ${streak.user.username || streak.user.email}: ${streak.currentStreak} days (Target: ${streak.targetId || 'general'})`);
    }
    console.log();
    
    // 3. Check existing user achievements for streak-related achievements
    console.log('3. Checking existing streak achievements...');
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        achievement: {
          code: {
            in: ['habit_streak_3', 'habit_streak_7', 'habit_streak_30']
          }
        }
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        achievement: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${userAchievements.length} existing streak achievements:`);
    userAchievements.forEach(ua => {
      console.log(`   - ${ua.user.username || ua.user.email}: ${ua.achievement.code} (${ua.achievement.name})`);
    });
    console.log();
    
    // 4. Find users who should have the Consistency achievement but don't
    console.log('4. Finding users who deserve the Consistency achievement...');
    const usersWithoutConsistency = [];
    
    for (const streak of streaks) {
      if (streak.currentStreak >= 3) {
        // Check if user already has habit_streak_3 achievement
        const hasConsistencyAchievement = userAchievements.some(
          ua => ua.userId === streak.userId && ua.achievement.code === 'habit_streak_3'
        );
        
        if (!hasConsistencyAchievement) {
          usersWithoutConsistency.push({
            userId: streak.userId,
            username: streak.user.username || streak.user.email,
            currentStreak: streak.currentStreak
          });
        }
      }
    }
    
    console.log(`Found ${usersWithoutConsistency.length} users who should get the Consistency achievement:`);
    usersWithoutConsistency.forEach(user => {
      console.log(`   - ${user.username}: ${user.currentStreak} day streak`);
    });
    console.log();
    
    // 5. Manual trigger for checking achievements
    console.log('5. You can now manually trigger achievement checks by calling:');
    console.log('   POST /api/gamification/check-achievements');
    console.log('   (This endpoint already exists in gamificationRoutes.ts)');
    console.log();
    
    console.log('✅ Test completed! The fix should now work for the Consistency achievement.');
    
  } catch (error) {
    console.error('❌ Error testing consistency achievement:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConsistencyAchievement();