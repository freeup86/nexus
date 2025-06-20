import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Helper function to award XP and handle level ups
export async function awardXP(userId: string, amount: number, reason?: string) {
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
    
    // Check for level up(s) - handle multiple level ups
    while (newCurrentXP >= userLevel.xpToNextLevel) {
      newCurrentXP -= userLevel.xpToNextLevel; // Reset current XP for new level
      newLevel += 1;
      leveledUp = true;
      userLevel.xpToNextLevel = calculateXPToNextLevel(newLevel); // Update for next check
    }
    
    const newXPToNext = calculateXPToNextLevel(newLevel);

    // Update user level
    const updatedLevel = await prisma.userLevel.update({
      where: { userId },
      data: {
        level: newLevel,
        currentXP: newCurrentXP,
        totalXP: newTotalXP,
        xpToNextLevel: newXPToNext,
        title: getLevelTitle(newLevel)
      }
    });

    // Check for new achievements
    await checkAndAwardAchievements(userId);

    return {
      xpAwarded: amount,
      newLevel: updatedLevel,
      leveledUp,
      reason
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return null;
  }
}

// Helper function to update streaks
export async function updateStreak(userId: string, type: string, targetId?: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing streak
    let streak = await prisma.streak.findUnique({
      where: {
        userId_type_targetId: {
          userId,
          type,
          targetId: targetId || null
        }
      }
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.streak.create({
        data: {
          userId,
          type,
          targetId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          streakStartDate: today
        }
      });
    } else {
      const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActivity && lastActivity.getTime() === yesterday.getTime()) {
        // Continue streak
        const newStreak = streak.currentStreak + 1;
        streak = await prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(streak.longestStreak, newStreak),
            lastActivityDate: today
          }
        });
      } else if (!lastActivity || lastActivity.getTime() < yesterday.getTime()) {
        // Reset streak
        streak = await prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentStreak: 1,
            lastActivityDate: today,
            streakStartDate: today
          }
        });
      }
      // If lastActivity is today, do nothing (already logged today)
    }

    return streak;
  } catch (error) {
    console.error('Error updating streak:', error);
    return null;
  }
}

// Gamification triggers for different actions
export const GamificationTriggers = {
  // Habit-related actions
  habitCompleted: (userId: string, habitId: string) => {
    Promise.all([
      awardXP(userId, 10, 'Habit completed'),
      updateStreak(userId, 'habit_specific', habitId),
      updateStreak(userId, 'overall_habits')
    ]);
  },

  // Mood logging
  moodLogged: (userId: string) => {
    Promise.all([
      awardXP(userId, 5, 'Mood logged'),
      updateStreak(userId, 'mood_logging')
    ]);
  },

  // Dream journaling
  dreamRecorded: (userId: string) => {
    Promise.all([
      awardXP(userId, 15, 'Dream recorded'),
      updateStreak(userId, 'dream_journaling')
    ]);
  },

  // Decision making
  decisionAnalyzed: (userId: string) => {
    awardXP(userId, 20, 'Decision analyzed');
  },

  // AI insights generated
  insightsGenerated: (userId: string) => {
    awardXP(userId, 25, 'AI insights generated');
  },

  // First time actions (bigger rewards)
  firstHabitCreated: (userId: string) => {
    awardXP(userId, 50, 'First habit created');
  },

  firstDreamRecorded: (userId: string) => {
    awardXP(userId, 30, 'First dream recorded');
  }
};

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
        
      // Additional habit achievements that might be added
      case 'habit_perfectionist':
        // Check if user has completed habits with 5-star rating 10 times
        const perfectHabits = await prisma.habitLog.count({
          where: { userId, completionStatus: 'completed', qualityRating: 5 }
        });
        return Math.min(perfectHabits / 10, 1);
        
      case 'habit_consistent':
        // Check if user has overall habit streak of 14 days
        const overallStreaks = await prisma.streak.findMany({
          where: { userId, type: 'overall_habits' }
        });
        const maxOverallStreak = Math.max(...overallStreaks.map(s => s.currentStreak), 0);
        return Math.min(maxOverallStreak / 14, 1);
        
      case 'habit_diversity':
        // Check if user has created habits in 5 different categories
        const categories = await prisma.habit.findMany({
          where: { userId },
          select: { category: true },
          distinct: ['category']
        });
        return Math.min(categories.length / 5, 1);
        
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error calculating achievement progress:', error);
    return 0;
  }
}

// Helper function to check and award achievements
async function checkAndAwardAchievements(userId: string) {
  try {
    const achievements = await prisma.achievement.findMany();
    
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
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
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