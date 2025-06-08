const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5002/api';

async function fix3DayStreak() {
  try {
    console.log('🔧 Fixing 3-day streak achievement...\n');

    // Login with test user
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: 'testhxp', 
        password: 'test123456' 
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;

    if (!token) {
      throw new Error('Login failed');
    }

    console.log('✅ Logged in successfully');

    // Get current achievements
    console.log('\n📋 Current achievements...');
    const achievementsResponse = await fetch(`${API_BASE}/gamification/achievements`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const achievements = await achievementsResponse.json();
    
    const streak3Achievement = achievements.find(a => a.code === 'habit_streak_3');
    if (streak3Achievement) {
      console.log(`3-day streak achievement: ${streak3Achievement.progress * 100}% complete`);
      console.log(`Is earned: ${streak3Achievement.isEarned}`);
    } else {
      console.log('3-day streak achievement not found');
    }

    // Get current gamification status
    console.log('\n🎮 Current gamification status...');
    const statusResponse = await fetch(`${API_BASE}/gamification/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const status = await statusResponse.json();
    
    console.log(`Level: ${status.level?.level || 0}, XP: ${status.level?.currentXP || 0}, Total XP: ${status.level?.totalXP || 0}`);
    console.log('Streaks:');
    status.streaks?.forEach(streak => {
      console.log(`  - ${streak.type}: ${streak.currentStreak} days (Longest: ${streak.longestStreak})`);
    });

    // Manually update a streak to have 3+ days for testing
    console.log('\n🔄 Manually creating 3-day streak for testing...');
    
    // Use the Prisma client directly in a more manual way
    const { PrismaClient } = require('./src/generated/prisma');
    const prisma = new PrismaClient();
    
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: 'testhxp' }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Find a habit-specific streak and update it
    const streaks = await prisma.streak.findMany({
      where: { 
        userId: user.id,
        type: 'habit_specific'
      }
    });

    if (streaks.length > 0) {
      const streakToUpdate = streaks[0];
      console.log(`Updating streak ${streakToUpdate.id} to 3 days...`);
      
      await prisma.streak.update({
        where: { id: streakToUpdate.id },
        data: {
          currentStreak: 3,
          longestStreak: Math.max(3, streakToUpdate.longestStreak)
        }
      });
      
      console.log('✅ Streak updated to 3 days');
    }

    // Force check achievements again
    console.log('\n🔄 Force checking achievements...');
    const checkResponse = await fetch(`${API_BASE}/gamification/check-achievements`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (checkResponse.ok) {
      console.log('✅ Achievements check completed');
    }

    // Check final status
    console.log('\n📊 Final status...');
    const finalStatusResponse = await fetch(`${API_BASE}/gamification/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalStatus = await finalStatusResponse.json();
    
    console.log(`Level: ${finalStatus.level?.level || 0}, XP: ${finalStatus.level?.currentXP || 0}, Total XP: ${finalStatus.level?.totalXP || 0}`);
    console.log(`Achievements earned: ${finalStatus.achievements?.length || 0}`);
    
    if (finalStatus.achievements?.length > 0) {
      console.log('🏆 Achievements:');
      finalStatus.achievements.forEach(ach => {
        console.log(`  - ${ach.achievement.name}: ${ach.achievement.description}`);
      });
    }

    await prisma.$disconnect();
    console.log('\n✨ 3-day streak test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

fix3DayStreak();