const { PrismaClient } = require('./src/generated/prisma');

async function debugAchievement() {
  const prisma = new PrismaClient();
  
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { username: 'testhxp' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User ID:', user.id);

    // Check streaks
    const streaks = await prisma.streak.findMany({
      where: { userId: user.id, type: 'habit_specific' }
    });

    console.log('\nHabit-specific streaks:');
    streaks.forEach(streak => {
      console.log(`- ID: ${streak.id}, Current: ${streak.currentStreak}, Longest: ${streak.longestStreak}, Target: ${streak.targetId}`);
    });

    // Check the achievement manually
    const achievement = await prisma.achievement.findUnique({
      where: { code: 'habit_streak_3' }
    });

    if (achievement) {
      console.log('\nAchievement found:');
      console.log('- Code:', achievement.code);
      console.log('- Name:', achievement.name);
      console.log('- Requirement:', achievement.requirement);
    }

    // Check if user already has the achievement
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: user.id,
          achievementId: achievement.id
        }
      }
    });

    console.log('\nUser achievement status:');
    console.log('- Already earned:', !!userAchievement);

    // Manual calculation
    const maxStreak = Math.max(...streaks.map(s => s.currentStreak), 0);
    console.log('\nManual calculation:');
    console.log('- Max streak:', maxStreak);
    console.log('- Progress:', Math.min(maxStreak / 3, 1));
    console.log('- Should be awarded:', maxStreak >= 3);

    // Try to award it manually
    if (maxStreak >= 3 && !userAchievement) {
      console.log('\n🏆 Manually awarding 3-day streak achievement...');
      
      const newAchievement = await prisma.userAchievement.create({
        data: {
          userId: user.id,
          achievementId: achievement.id,
          progress: 1
        }
      });

      console.log('✅ Achievement awarded!', newAchievement.id);

      // Award XP
      const userLevel = await prisma.userLevel.findUnique({
        where: { userId: user.id }
      });

      if (userLevel) {
        const newTotalXP = userLevel.totalXP + achievement.xpReward;
        const newCurrentXP = userLevel.currentXP + achievement.xpReward;
        
        await prisma.userLevel.update({
          where: { userId: user.id },
          data: {
            totalXP: newTotalXP,
            currentXP: newCurrentXP
          }
        });

        console.log(`✅ Awarded ${achievement.xpReward} XP for achievement`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAchievement();