import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function debugUserAchievements() {
  try {
    console.log('🔍 Debugging User Achievements and Streaks...\n');

    // Find the user (assuming there's only one user or get the most recent one)
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    // Check each user's achievements and streaks
    for (const user of users) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`User ID: ${user.id}`);

      // Check user's current streaks
      const streaks = await prisma.streak.findMany({
        where: { userId: user.id },
        orderBy: { currentStreak: 'desc' }
      });

      console.log(`\n📊 Current Streaks (${streaks.length}):`);
      if (streaks.length === 0) {
        console.log('  No streaks found');
      } else {
        streaks.forEach(streak => {
          console.log(`  - Type: ${streak.type}, Current: ${streak.currentStreak} days, Longest: ${streak.longestStreak} days`);
          console.log(`    Target: ${streak.targetId || 'general'}, Active: ${streak.isActive}, Last: ${streak.lastActivityDate}`);
        });
      }

      // Check user's achievements
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' }
      });

      console.log(`\n🏆 Earned Achievements (${userAchievements.length}):`);
      if (userAchievements.length === 0) {
        console.log('  No achievements earned yet');
      } else {
        userAchievements.forEach(ua => {
          console.log(`  - ${ua.achievement.name} (${ua.achievement.code}) - ${ua.achievement.xpReward} XP`);
          console.log(`    Earned: ${ua.earnedAt}, Progress: ${ua.progress}`);
        });
      }

      // Check available achievements to see which ones they're missing
      const allAchievements = await prisma.achievement.findMany({
        where: {
          code: {
            in: ['habit_streak_3', 'habit_streak_7', 'habit_streak_30', 'first_habit', 'consistency']
          }
        }
      });

      console.log(`\n📋 Habit-Related Achievements in Database:`);
      for (const achievement of allAchievements) {
        const hasAchievement = userAchievements.some(ua => ua.achievementId === achievement.id);
        console.log(`  - ${achievement.name} (${achievement.code}) - ${hasAchievement ? '✅ EARNED' : '❌ NOT EARNED'}`);
        console.log(`    Description: ${achievement.description}`);
        console.log(`    XP Reward: ${achievement.xpReward}, Category: ${achievement.category}`);
      }

      // Check user level
      const userLevel = await prisma.userLevel.findUnique({
        where: { userId: user.id }
      });

      console.log(`\n⭐ User Level:`);
      if (userLevel) {
        console.log(`  Level: ${userLevel.level} (${userLevel.title})`);
        console.log(`  Current XP: ${userLevel.currentXP}/${userLevel.xpToNextLevel}`);
        console.log(`  Total XP: ${userLevel.totalXP}`);
      } else {
        console.log('  No level data found');
      }

      // Check recent habit logs to verify the 3-day streak
      const recentHabitLogs = await prisma.habitLog.findMany({
        where: { 
          userId: user.id,
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { completedAt: 'desc' },
        include: { habit: true }
      });

      console.log(`\n📝 Recent Habit Logs (Last 7 days):`);
      if (recentHabitLogs.length === 0) {
        console.log('  No habit logs in the last 7 days');
      } else {
        recentHabitLogs.forEach(log => {
          console.log(`  - ${log.habit.name}: ${log.completedAt.toLocaleDateString()} (Status: ${log.completionStatus}, Quality: ${log.qualityRating || 'N/A'})`);
        });

        // Calculate actual streak from habit logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentStreak = 0;
        let checkDate = new Date(today);
        
        while (checkDate >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) { // Check last 30 days
          const dayStart = new Date(checkDate);
          const dayEnd = new Date(checkDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          const hasHabitOnDay = recentHabitLogs.some(log => 
            log.completedAt >= dayStart && log.completedAt <= dayEnd
          );
          
          if (hasHabitOnDay) {
            currentStreak++;
          } else {
            break;
          }
          
          checkDate.setDate(checkDate.getDate() - 1);
        }

        console.log(`\n🔥 Calculated Current Streak: ${currentStreak} days`);
      }

      console.log('\n' + '='.repeat(60));
    }

  } catch (error) {
    console.error('Error debugging user achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserAchievements();