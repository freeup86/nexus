import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function fixUserStreaks() {
  try {
    const userId = 'd77719b9-ad71-4f2b-85ef-6346a42c09a1'; // lcortez86@icloud.com
    
    console.log('🔧 Fixing streak tracking for user...\n');

    // Get all habits for the user
    const habits = await prisma.habit.findMany({
      where: { userId }
    });

    console.log(`Found ${habits.length} habits for user`);

    // Get recent habit logs (last 30 days)
    const recentLogs = await prisma.habitLog.findMany({
      where: {
        userId,
        completedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        completionStatus: 'completed'
      },
      orderBy: { completedAt: 'desc' }
    });

    console.log(`Found ${recentLogs.length} recent completed habit logs`);

    // Calculate streaks for each habit
    const habitStreaks: { [habitId: string]: number } = {};
    let overallStreak = 0;

    for (const habit of habits) {
      const habitLogs = recentLogs.filter(log => log.habitId === habit.id);
      
      if (habitLogs.length === 0) {
        habitStreaks[habit.id] = 0;
        continue;
      }

      // Calculate current streak for this habit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentStreak = 0;
      let checkDate = new Date(today);
      let longestStreak = 0;
      
      // Check backwards from today to find current streak
      for (let i = 0; i < 30; i++) {
        const dayStart = new Date(checkDate);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const hasLogOnDay = habitLogs.some(log => 
          log.completedAt >= dayStart && log.completedAt <= dayEnd
        );
        
        if (hasLogOnDay) {
          currentStreak++;
        } else {
          break;
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
      }

      // Calculate longest streak (simple approximation)
      longestStreak = Math.max(currentStreak, longestStreak);

      habitStreaks[habit.id] = currentStreak;
      
      console.log(`Habit "${habit.name}": ${currentStreak} day streak`);

      // Create or update streak record for this habit
      if (currentStreak > 0) {
        await prisma.streak.upsert({
          where: {
            userId_type_targetId: {
              userId,
              type: 'habit_specific',
              targetId: habit.id
            }
          },
          update: {
            currentStreak,
            longestStreak: Math.max(currentStreak, longestStreak),
            lastActivityDate: new Date(today),
            isActive: true
          },
          create: {
            userId,
            type: 'habit_specific',
            targetId: habit.id,
            currentStreak,
            longestStreak,
            lastActivityDate: new Date(today),
            streakStartDate: new Date(today.getTime() - (currentStreak - 1) * 24 * 60 * 60 * 1000),
            isActive: true
          }
        });

        console.log(`✅ Updated streak record for habit "${habit.name}"`);
      }
    }

    // Calculate overall habit streak (any habit completed each day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let checkDate = new Date(today);
    
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const hasAnyHabitOnDay = recentLogs.some(log => 
        log.completedAt >= dayStart && log.completedAt <= dayEnd
      );
      
      if (hasAnyHabitOnDay) {
        overallStreak++;
      } else {
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }

    console.log(`Overall habit streak: ${overallStreak} days`);

    // Create or update overall streak record
    if (overallStreak > 0) {
      // Check if overall streak exists first
      const existingOverallStreak = await prisma.streak.findFirst({
        where: {
          userId,
          type: 'overall_habits',
          targetId: null
        }
      });

      if (existingOverallStreak) {
        await prisma.streak.update({
          where: { id: existingOverallStreak.id },
          data: {
            currentStreak: overallStreak,
            longestStreak: Math.max(overallStreak, existingOverallStreak.longestStreak),
            lastActivityDate: new Date(today),
            isActive: true
          }
        });
      } else {
        await prisma.streak.create({
          data: {
            userId,
            type: 'overall_habits',
            targetId: null,
            currentStreak: overallStreak,
            longestStreak: overallStreak,
            lastActivityDate: new Date(today),
            streakStartDate: new Date(today.getTime() - (overallStreak - 1) * 24 * 60 * 60 * 1000),
            isActive: true
          }
        });
      }

      console.log(`✅ Updated overall habit streak record`);
    }

    // Now check and award achievements
    console.log('\n🏆 Checking for achievements...');
    
    // Check for habit streak achievements
    const achievementCodes = ['habit_streak_3', 'habit_streak_7', 'habit_streak_30'];
    
    for (const code of achievementCodes) {
      const achievement = await prisma.achievement.findUnique({
        where: { code }
      });
      
      if (!achievement) continue;

      // Check if user already has this achievement
      const existingAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id
          }
        }
      });

      if (existingAchievement) {
        console.log(`✅ Already has achievement: ${achievement.name}`);
        continue;
      }

      // Calculate progress for this achievement
      let progress = 0;
      const maxStreak = Math.max(...Object.values(habitStreaks), overallStreak);
      
      switch (code) {
        case 'habit_streak_3':
          progress = Math.min(maxStreak / 3, 1);
          break;
        case 'habit_streak_7':
          progress = Math.min(maxStreak / 7, 1);
          break;
        case 'habit_streak_30':
          progress = Math.min(maxStreak / 30, 1);
          break;
      }

      console.log(`${achievement.name}: ${(progress * 100).toFixed(1)}% complete (${maxStreak} day streak)`);

      if (progress >= 1) {
        // Award achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: 1
          }
        });

        // Award XP directly
        let userLevel = await prisma.userLevel.findUnique({
          where: { userId }
        });

        if (!userLevel) {
          userLevel = await prisma.userLevel.create({
            data: { userId }
          });
        }

        const newTotalXP = userLevel.totalXP + achievement.xpReward;
        let newCurrentXP = userLevel.currentXP + achievement.xpReward;
        let newLevel = userLevel.level;
        let leveledUp = false;

        // Check for level ups
        while (newCurrentXP >= userLevel.xpToNextLevel) {
          newCurrentXP -= userLevel.xpToNextLevel;
          newLevel += 1;
          leveledUp = true;
          userLevel.xpToNextLevel = Math.floor(100 * Math.pow(1.2, newLevel - 1));
        }

        const newXPToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));

        function getLevelTitle(level: number): string {
          if (level < 5) return 'Beginner';
          if (level < 10) return 'Explorer';
          if (level < 20) return 'Achiever';
          if (level < 35) return 'Expert';
          if (level < 50) return 'Master';
          return 'Grandmaster';
        }

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

        console.log(`🎉 AWARDED: ${achievement.name} (+${achievement.xpReward} XP)`);
        if (leveledUp) {
          console.log(`🌟 LEVEL UP! Now level ${newLevel}`);
        }
      }
    }

    console.log('\n✅ Streak tracking and achievements fixed!');

  } catch (error) {
    console.error('Error fixing user streaks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserStreaks();