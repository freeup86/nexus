const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5002/api';

// Test data
const testUser = {
  email: 'test-habit-xp@example.com',
  username: 'testhxp',
  password: 'test123456',
  firstName: 'Test',
  lastName: 'HabitXP'
};

async function testHabitXPIntegration() {
  try {
    console.log('🔍 Testing Habit XP Integration...\n');

    // 1. Register test user
    console.log('📝 Registering test user...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!registerResponse.ok) {
      const existingUser = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: testUser.username, 
          password: testUser.password 
        })
      });
      
      if (!existingUser.ok) {
        throw new Error('Failed to register or login user');
      }
      
      const loginData = await existingUser.json();
      var token = loginData.token;
      console.log('✅ Logged in existing user');
      console.log('Token received:', token ? 'Valid' : 'Missing');
    } else {
      const registerData = await registerResponse.json();
      var token = registerData.token;
      console.log('✅ Registered new user');
      console.log('Token received:', token ? 'Valid' : 'Missing');
    }

    // 2. Get initial gamification status
    console.log('\n🎮 Getting initial gamification status...');
    const initialStatusResponse = await fetch(`${API_BASE}/gamification/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const initialStatus = await initialStatusResponse.json();
    console.log(`Initial Level: ${initialStatus.level?.level || 0}, XP: ${initialStatus.level?.currentXP || 0}`);

    // 3. Create a test habit
    console.log('\n📚 Creating test habit...');
    const habitResponse = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        name: 'Test Habit for XP',
        description: 'A test habit to verify XP integration',
        category: 'health',
        frequencyType: 'daily'
      })
    });

    if (!habitResponse.ok) {
      const errorData = await habitResponse.text();
      console.log('Habit creation error:', errorData);
      throw new Error('Failed to create habit');
    }
    
    const habit = await habitResponse.json();
    console.log(`✅ Created habit: ${habit.habit.name}`);

    // 4. Complete the habit multiple times to build a streak
    console.log('\n🔥 Completing habit to build streak...');
    
    for (let day = 0; day < 4; day++) {
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() - (3 - day)); // Complete for last 4 days
      
      console.log(`Day ${day + 1}: Completing habit...`);
      
      const logResponse = await fetch(`${API_BASE}/habits/${habit.habit.id}/log`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          completionStatus: 'completed',
          qualityRating: 5,
          mood: 'happy',
          energyLevel: 'high',
          completedAt: completionDate.toISOString()
        })
      });

      if (logResponse.ok) {
        const logResult = await logResponse.json();
        console.log(`  ✅ Logged completion - XP awarded: ${logResult.gamification?.xp?.xpAwarded || 'N/A'}`);
        console.log(`  🔥 Habit streak: ${logResult.gamification?.habitStreak?.currentStreak || 'N/A'}`);
      } else {
        console.log(`  ⚠️ Failed to log habit (might be duplicate for today)`);
      }
    }

    // 5. Check final gamification status
    console.log('\n🎯 Checking final gamification status...');
    const finalStatusResponse = await fetch(`${API_BASE}/gamification/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalStatus = await finalStatusResponse.json();
    
    console.log(`Final Level: ${finalStatus.level?.level || 0}, XP: ${finalStatus.level?.currentXP || 0}`);
    console.log(`Total XP: ${finalStatus.level?.totalXP || 0}`);
    console.log(`Achievements earned: ${finalStatus.achievements?.length || 0}`);
    
    if (finalStatus.achievements?.length > 0) {
      console.log('🏆 Achievements:');
      finalStatus.achievements.forEach(ach => {
        console.log(`  - ${ach.achievement.name}: ${ach.achievement.description}`);
      });
    }

    // 6. Check streaks
    console.log('\n⚡ Active streaks:');
    if (finalStatus.streaks?.length > 0) {
      finalStatus.streaks.forEach(streak => {
        console.log(`  - ${streak.type}: ${streak.currentStreak} days`);
      });
    } else {
      console.log('  No active streaks found');
    }

    // 7. Force check achievements
    console.log('\n🔄 Force checking achievements...');
    const checkAchievementsResponse = await fetch(`${API_BASE}/gamification/check-achievements`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (checkAchievementsResponse.ok) {
      console.log('✅ Achievements check completed');
    }

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHabitXPIntegration();