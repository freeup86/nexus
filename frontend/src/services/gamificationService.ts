import api from '../config/api';

export interface UserLevel {
  id: string;
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  title: string;
  unlockedFeatures: string[];
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  xpReward: number;
  rarity: string;
  requirement: any;
  isSecret: boolean;
  progress: number;
  isEarned: boolean;
  earnedAt?: Date;
}

export interface Streak {
  id: string;
  type: string;
  targetId?: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  streakStartDate?: Date;
  isActive: boolean;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  value: string;
  cost?: number;
  requiredLevel?: number;
  icon: string;
  category: string;
  isActive: boolean;
}

export interface UserReward {
  id: string;
  reward: Reward;
  unlockedAt: Date;
  isEquipped: boolean;
}

export interface DailyChallenge {
  id: string;
  date: Date;
  type: string;
  description: string;
  requirement: any;
  xpReward: number;
  bonusXP?: number;
  icon: string;
}

export interface GamificationStatus {
  level: UserLevel;
  achievements: Achievement[];
  streaks: Streak[];
  rewards: UserReward[];
  todayChallenge?: DailyChallenge;
  isCompletedToday: boolean;
}

export const gamificationService = {
  // Get user's gamification status
  getStatus: async (): Promise<GamificationStatus> => {
    const response = await api.get('/gamification/status');
    return response.data;
  },

  // Get available achievements
  getAchievements: async (): Promise<Achievement[]> => {
    const response = await api.get('/gamification/achievements');
    return response.data;
  },

  // Award XP to user
  awardXP: async (amount: number, reason?: string): Promise<{
    xpAwarded: number;
    newLevel: UserLevel;
    leveledUp: boolean;
    reason?: string;
  }> => {
    const response = await api.post('/gamification/award-xp', {
      amount,
      reason
    });
    return response.data;
  },

  // Update streak
  updateStreak: async (type: string, targetId?: string): Promise<Streak> => {
    const response = await api.post('/gamification/update-streak', {
      type,
      targetId
    });
    return response.data;
  },

  // Complete daily challenge
  completeChallenge: async (challengeId: string): Promise<{
    completion: any;
    xpAwarded: number;
  }> => {
    const response = await api.post('/gamification/complete-challenge', {
      challengeId
    });
    return response.data;
  },

  // Force check achievements (for debugging/fixing)
  checkAchievements: async (): Promise<{ message: string }> => {
    const response = await api.post('/gamification/check-achievements');
    return response.data;
  }
};

// Helper functions for UI
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'text-gray-600 bg-gray-100 border-gray-300';
    case 'rare': return 'text-blue-600 bg-blue-100 border-blue-300';
    case 'epic': return 'text-purple-600 bg-purple-100 border-purple-300';
    case 'legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    default: return 'text-gray-600 bg-gray-100 border-gray-300';
  }
};

export const getLevelColor = (level: number): string => {
  if (level < 5) return 'text-green-600 bg-green-100';
  if (level < 10) return 'text-blue-600 bg-blue-100';
  if (level < 20) return 'text-purple-600 bg-purple-100';
  if (level < 35) return 'text-orange-600 bg-orange-100';
  if (level < 50) return 'text-red-600 bg-red-100';
  return 'text-yellow-600 bg-yellow-100';
};

export const getStreakColor = (streak: number): string => {
  if (streak < 3) return 'text-gray-600';
  if (streak < 7) return 'text-green-600';
  if (streak < 30) return 'text-blue-600';
  if (streak < 100) return 'text-purple-600';
  return 'text-yellow-600';
};