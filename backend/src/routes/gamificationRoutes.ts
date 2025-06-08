import express from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's gamification status
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get or create user level
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId }
    });

    if (!userLevel) {
      userLevel = await prisma.userLevel.create({
        data: { userId }
      });
    }

    // Get user's achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' }
    });

    // Get user's active streaks
    const streaks = await prisma.streak.findMany({
      where: { userId, isActive: true },
      orderBy: { currentStreak: 'desc' }
    });

    // Get user's rewards
    const userRewards = await prisma.userReward.findMany({
      where: { userId },
      include: { reward: true },
      orderBy: { unlockedAt: 'desc' }
    });

    // Get today's challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayChallenge = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      include: {
        completions: {
          where: { userId }
        }
      }
    });

    res.json({
      level: userLevel,
      achievements: userAchievements,
      streaks,
      rewards: userRewards,
      todayChallenge,
      isCompletedToday: todayChallenge?.completions.length > 0
    });
  } catch (error) {
    console.error('Error fetching gamification status:', error);
    res.status(500).json({ error: 'Failed to fetch gamification status' });
  }
});

// Get available achievements
router.get('/achievements', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const achievements = await prisma.achievement.findMany({
      include: {
        userAchievements: {
          where: { userId }
        }
      },
      orderBy: [
        { rarity: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    // Calculate progress for each achievement
    const achievementsWithProgress = await Promise.all(
      achievements.map(async (achievement) => {
        const userAchievement = achievement.userAchievements[0];
        let progress = 0;

        if (!userAchievement) {
          // Calculate current progress based on achievement requirements
          progress = await calculateAchievementProgress(userId, achievement);
        } else {
          progress = 1; // Already earned
        }

        return {
          ...achievement,
          userAchievements: undefined,
          progress,
          isEarned: !!userAchievement,
          earnedAt: userAchievement?.earnedAt
        };
      })
    );

    res.json(achievementsWithProgress);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Award XP to user
router.post('/award-xp', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { amount, reason } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid XP amount' });
      return;
    }

    const result = await awardXP(userId, amount, reason);
    res.json(result);
  } catch (error) {
    console.error('Error awarding XP:', error);
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

// Update streak
router.post('/update-streak', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { type, targetId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const result = await updateStreak(userId, type, targetId);
    res.json(result);
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({ error: 'Failed to update streak' });
  }
});

// Complete daily challenge
router.post('/complete-challenge', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { challengeId } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Check if already completed
    const existing = await prisma.dailyChallengeCompletion.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Challenge already completed' });
      return;
    }

    // Get challenge details
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    // Mark as completed
    const completion = await prisma.dailyChallengeCompletion.create({
      data: {
        userId,
        challengeId
      }
    });

    // Award XP
    await awardXP(userId, challenge.xpReward, `Daily Challenge: ${challenge.description}`);

    res.json({
      completion,
      xpAwarded: challenge.xpReward
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

// Helper function to award XP and handle level ups
async function awardXP(userId: string, amount: number, reason?: string) {
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
}

// Helper function to update streaks
async function updateStreak(userId: string, type: string, targetId?: string) {
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
}

// Helper function to calculate achievement progress
async function calculateAchievementProgress(userId: string, achievement: any): Promise<number> {
  const requirement = achievement.requirement;
  
  switch (achievement.code) {
    case 'first_habit':
      const habitCount = await prisma.habit.count({
        where: { userId }
      });
      return Math.min(habitCount / 1, 1);
      
    case 'habit_streak_3':
      const streaks3 = await prisma.streak.findMany({
        where: { userId, type: 'habit_specific' }
      });
      const maxStreak3 = Math.max(...streaks3.map(s => s.currentStreak), 0);
      return Math.min(maxStreak3 / 3, 1);
      
    case 'habit_streak_7':
      const streaks = await prisma.streak.findMany({
        where: { userId, type: 'habit_specific' }
      });
      const maxStreak = Math.max(...streaks.map(s => s.currentStreak), 0);
      return Math.min(maxStreak / 7, 1);
      
    case 'habit_streak_30':
      const streaks30 = await prisma.streak.findMany({
        where: { userId, type: 'habit_specific' }
      });
      const maxStreak30 = Math.max(...streaks30.map(s => s.currentStreak), 0);
      return Math.min(maxStreak30 / 30, 1);
      
    case 'mood_logger_1':
      const moodCount1 = await prisma.moodEntry.count({
        where: { userId }
      });
      return Math.min(moodCount1 / 1, 1);
      
    case 'mood_logger_30':
      const moodCount = await prisma.moodEntry.count({
        where: { userId }
      });
      return Math.min(moodCount / 30, 1);
      
    case 'dream_journal_1':
      const dreamCount1 = await prisma.dream.count({
        where: { userId }
      });
      return Math.min(dreamCount1 / 1, 1);
      
    case 'dream_journal_10':
      const dreamCount = await prisma.dream.count({
        where: { userId }
      });
      return Math.min(dreamCount / 10, 1);
      
    case 'decision_maker':
      const decisionCount = await prisma.decision.count({
        where: { userId }
      });
      return Math.min(decisionCount / 1, 1);
      
    case 'insight_seeker':
      const insightCount = await prisma.personalInsight.count({
        where: { userId }
      });
      return Math.min(insightCount / 1, 1);
      
    case 'early_adopter':
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { createdAt: true }
      });
      if (!user) return 0;
      
      const cutoffDate = new Date('2025-12-31');
      return user.createdAt <= cutoffDate ? 1 : 0;
      
    // AI Journal achievements
    case 'journal_sessions_10':
      const sessionCount = await prisma.journalEntry.count({
        where: { 
          userId,
          isConversational: true
        }
      });
      return Math.min(sessionCount / 10, 1);
      
    case 'journal_sessions_50':
      const sessionCount50 = await prisma.journalEntry.count({
        where: { 
          userId,
          isConversational: true
        }
      });
      return Math.min(sessionCount50 / 50, 1);
      
    case 'morning_checkins_7':
      const morningCount = await prisma.checkInSession.count({
        where: {
          userId,
          sessionType: 'morning'
        }
      });
      return Math.min(morningCount / 7, 1);
      
    case 'journal_streak_14':
      const journalStreaks = await prisma.journalStreak.findMany({
        where: { userId }
      });
      const maxJournalStreak = Math.max(...journalStreaks.map(s => s.currentStreak), 0);
      return Math.min(maxJournalStreak / 14, 1);
      
    case 'mood_tracker_expert':
      const weeklyMoodData = await prisma.moodEntry.count({
        where: {
          userId,
          recordedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });
      return weeklyMoodData >= 7 ? 1 : Math.min(weeklyMoodData / 7, 1);
      
    case 'thoughtful_journaler':
      const longEntries = await prisma.journalEntry.count({
        where: {
          userId,
          wordCount: { gte: 250 }
        }
      });
      return Math.min(longEntries / 5, 1);
      
    default:
      return 0;
  }
}

// Helper function to check and award achievements
async function checkAndAwardAchievements(userId: string) {
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
}

// Helper functions
function calculateXPToNextLevel(level: number): number {
  return 100 * Math.pow(1.2, level - 1);
}

function getLevelTitle(level: number): string {
  if (level < 5) return 'Beginner';
  if (level < 10) return 'Explorer';
  if (level < 20) return 'Achiever';
  if (level < 35) return 'Expert';
  if (level < 50) return 'Master';
  return 'Grandmaster';
}

// Force check achievements (for debugging/fixing)
router.post('/check-achievements', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await checkAndAwardAchievements(userId);
    
    res.json({ message: 'Achievements checked and updated' });
  } catch (error) {
    console.error('Error checking achievements:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

export default router;