// Script to manually trigger achievement checks for all users
// This will catch any users who should have received achievements but didn't due to the bug

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

// Import the achievement checking function from the helper
async function checkAndAwardAchievements(userId: string) {
  try {
    console.log(`Checking achievements for user: ${userId}`);
    
    const achievements = await prisma.achievement.findMany();
    let awardedCount = 0;
    
    for (const achievement of achievements) {
      // Check if user already has this achievement
      const existing = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id
          }
        }
      });

      if (!existing) {
        const progress = await calculateAchievementProgress(userId, achievement);
        
        if (progress >= 1) {
          // Award achievement
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              progress: 1
            }
          });

          // Award XP
          await awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`);
          
          console.log(`   ✅ Awarded: ${achievement.name} (+${achievement.xpReward} XP)`);
          awardedCount++;
        }
      }
    }
    
    if (awardedCount === 0) {
      console.log(`   ℹ️  No new achievements to award`);
    }
    
    return awardedCount;
  } catch (error) {
    console.error(`Error checking achievements for user ${userId}:`, error);
    return 0;
  }
}

// Helper function to award XP
async function awardXP(userId: string, amount: number, reason?: string) {
  try {
    // Get or create user level
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    if (!userLevel) {
      userLevel = await prisma.userLevel.create({
        data: { userId }
      });
    }

    let newCurrentXP = userLevel.currentXP + amount;
    const newTotalXP = userLevel.totalXP + amount;
    
    let newLevel = userLevel.level;
    let leveledUp = false;
    
    // Check for level up(s)
    while (newCurrentXP >= userLevel.xpToNextLevel) {
      newCurrentXP -= userLevel.xpToNextLevel;
      newLevel += 1;
      leveledUp = true;
      userLevel.xpToNextLevel = calculateXPToNextLevel(newLevel);
    }
    
    const newXPToNext = calculateXPToNextLevel(newLevel);

    // Update user level
    await prisma.userLevel.update({
      where: { userId },
      data: {
        level: newLevel,
        currentXP: newCurrentXP,
        totalXP: newTotalXP,
        xpToNextLevel: newXPToNext,
        title: getLevelTitle(newLevel)
      }
    });

    return { xpAwarded: amount, leveledUp, reason };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return null;
  }
}

// Helper function to calculate achievement progress
async function calculateAchievementProgress(userId: string, achievement: any): Promise<number> {
  try {
    switch (achievement.code) {
      case 'first_habit':
        const habitCount = await prisma.habit.count({ where: { userId } });
        return habitCount >= 1 ? 1 : 0;
        
      case 'habit_streak_3':
      case 'habit_streak_7':
      case 'habit_streak_30':
        const targetStreak = parseInt(achievement.code.split('_')[2]);
        const streaks = await prisma.streak.findMany({
          where: { userId, type: 'habit_specific' }
        });
        const maxStreak = Math.max(...streaks.map(s => s.currentStreak), 0);
        return Math.min(maxStreak / targetStreak, 1);
        
      case 'mood_logger_1':
      case 'mood_logger_30':
        const targetMoodCount = parseInt(achievement.code.split('_')[2]);
        const moodCount = await prisma.moodEntry.count({ where: { userId } });
        return Math.min(moodCount / targetMoodCount, 1);
        
      case 'dream_journal_1':
      case 'dream_journal_10':
        const targetDreamCount = parseInt(achievement.code.split('_')[2]);
        const dreamCount = await prisma.dream.count({ where: { userId } });
        return Math.min(dreamCount / targetDreamCount, 1);
        
      case 'decision_maker':
        const decisionCount = await prisma.decision.count({ where: { userId } });
        return decisionCount >= 1 ? 1 : 0;
        
      case 'insight_seeker':
        const insightCount = await prisma.personalInsight.count({ where: { userId } });
        return insightCount >= 1 ? 1 : 0;
        
      case 'early_adopter':
        const user = await prisma.user.findUnique({ 
          where: { id: userId },
          select: { createdAt: true }
        });
        if (!user) return 0;
        
        const cutoffDate = new Date('2025-12-31');
        return user.createdAt <= cutoffDate ? 1 : 0;
        
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error calculating achievement progress:', error);
    return 0;
  }
}

// Helper functions
function calculateXPToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

function getLevelTitle(level: number): string {
  if (level < 5) return 'Beginner';
  if (level < 10) return 'Explorer';
  if (level < 20) return 'Achiever';
  if (level < 35) return 'Expert';
  if (level < 50) return 'Master';
  return 'Grandmaster';
}

async function fixMissingAchievements() {
  try {
    console.log('🔄 Checking and fixing missing achievements for all users...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true
      }
    });
    
    console.log(`Found ${users.length} users to check\n`);
    
    let totalAchievementsAwarded = 0;
    
    for (const user of users) {
      const username = user.username || user.email;
      const awarded = await checkAndAwardAchievements(user.id);
      totalAchievementsAwarded += awarded;
      
      if (awarded > 0) {
        console.log(`   👤 ${username}: ${awarded} new achievements\n`);
      }
    }
    
    console.log(`✅ Complete! Awarded ${totalAchievementsAwarded} total achievements.\n`);
    
    if (totalAchievementsAwarded === 0) {
      console.log('ℹ️  All users already have their deserved achievements - the system is working correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingAchievements();