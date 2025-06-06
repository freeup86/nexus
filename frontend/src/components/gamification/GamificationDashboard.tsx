import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Award, 
  Target,
  Calendar,
  Zap,
  Crown,
  Gift,
  ChevronRight,
  Medal
} from 'lucide-react';
import { 
  gamificationService, 
  GamificationStatus, 
  Achievement,
  getRarityColor, 
  getLevelColor, 
  getStreakColor 
} from '../../services/gamificationService';

interface GamificationDashboardProps {}

const GamificationDashboard: React.FC<GamificationDashboardProps> = () => {
  const [status, setStatus] = useState<GamificationStatus | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'streaks' | 'rewards'>('overview');

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const [statusData, achievementsData] = await Promise.all([
        gamificationService.getStatus(),
        gamificationService.getAchievements()
      ]);
      setStatus(statusData);
      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async () => {
    if (!status?.todayChallenge || status.isCompletedToday) return;
    
    try {
      await gamificationService.completeChallenge(status.todayChallenge.id);
      await loadGamificationData(); // Reload to show updated status
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      await gamificationService.checkAchievements();
      await loadGamificationData(); // Reload to show updated achievements
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading your progress...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Unable to load gamification data</p>
      </div>
    );
  }

  const xpProgress = (status.level.currentXP / status.level.xpToNextLevel) * 100;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
            Your Progress
          </h1>
          <p className="text-gray-600 mt-1">
            Track your achievements, streaks, and personal growth
          </p>
        </div>
      </div>

      {/* Level and XP Overview */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getLevelColor(status.level.level)} text-white`}>
              <Crown className="h-4 w-4 mr-1" />
              Level {status.level.level} - {status.level.title}
            </div>
            <h2 className="text-2xl font-bold mt-2">{status.level.totalXP.toLocaleString()} Total XP</h2>
            <p className="opacity-90">
              {status.level.currentXP} / {status.level.xpToNextLevel} XP to next level
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{status.level.level}</div>
            <div className="text-sm opacity-90">Current Level</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
            <div 
              className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'achievements', label: 'Achievements', icon: Award },
            { id: 'streaks', label: 'Streaks', icon: Zap },
            { id: 'rewards', label: 'Rewards', icon: Gift }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Challenge */}
          {status.todayChallenge && (
            <div className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Daily Challenge
                </h3>
                {status.isCompletedToday && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    Completed ✓
                  </span>
                )}
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{status.todayChallenge.icon}</div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{status.todayChallenge.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Reward: {status.todayChallenge.xpReward} XP
                  </p>
                  
                  {!status.isCompletedToday && (
                    <button
                      onClick={completeChallenge}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Complete Challenge
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Achievements */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Medal className="h-5 w-5 mr-2 text-yellow-500" />
              Recent Achievements
            </h3>
            
            <div className="space-y-3">
              {achievements
                .filter(a => a.isEarned)
                .slice(0, 3)
                .map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3">
                    <div className="text-xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{achievement.name}</p>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </span>
                  </div>
                ))}
              
              {achievements.filter(a => a.isEarned).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No achievements yet. Keep using Nexus to earn your first!
                </p>
              )}
            </div>
          </div>

          {/* Active Streaks */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-orange-500" />
              Active Streaks
            </h3>
            
            <div className="space-y-3">
              {status.streaks.slice(0, 3).map((streak) => (
                <div key={streak.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {streak.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Longest: {streak.longestStreak} days
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${getStreakColor(streak.currentStreak)}`}>
                    {streak.currentStreak}
                  </div>
                </div>
              ))}
              
              {status.streaks.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No active streaks. Start building consistency!
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-500" />
              Quick Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {achievements.filter(a => a.isEarned).length}
                </div>
                <div className="text-sm text-gray-500">Achievements</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.max(...status.streaks.map(s => s.longestStreak), 0)}
                </div>
                <div className="text-sm text-gray-500">Best Streak</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {status.rewards.length}
                </div>
                <div className="text-sm text-gray-500">Rewards</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {status.level.level}
                </div>
                <div className="text-sm text-gray-500">Level</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">All Achievements</h3>
            <button
              onClick={checkAchievements}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Check for New Achievements
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`bg-white rounded-lg shadow border p-4 ${
                achievement.isEarned ? 'ring-2 ring-yellow-200' : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-2xl">{achievement.icon}</div>
                <span className={`px-2 py-1 text-xs rounded-full ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </span>
              </div>
              
              <h4 className="font-semibold text-gray-900 mb-1">{achievement.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
              
              {achievement.isEarned ? (
                <div className="flex items-center text-green-600 text-sm">
                  <Award className="h-4 w-4 mr-1" />
                  Earned!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-700">{Math.round(achievement.progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${achievement.progress * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <span>{achievement.xpReward} XP</span>
                <span className="capitalize">{achievement.category}</span>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {activeTab === 'streaks' && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Streaks</h3>
          
          <div className="space-y-4">
            {status.streaks.map((streak) => (
              <div key={streak.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {streak.type.replace('_', ' ')}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Started: {streak.streakStartDate ? new Date(streak.streakStartDate).toLocaleDateString() : 'Not started'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Last activity: {streak.lastActivityDate ? new Date(streak.lastActivityDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getStreakColor(streak.currentStreak)}`}>
                    {streak.currentStreak}
                  </div>
                  <div className="text-sm text-gray-500">Current</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {streak.longestStreak}
                  </div>
                  <div className="text-xs text-gray-500">Best</div>
                </div>
              </div>
            ))}
            
            {status.streaks.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No streaks yet. Start by completing habits regularly!
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rewards</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {status.rewards.map((userReward) => (
              <div key={userReward.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{userReward.reward.icon}</div>
                  {userReward.isEquipped && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      Equipped
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-1">{userReward.reward.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{userReward.reward.description}</p>
                
                <div className="text-sm text-gray-500">
                  Unlocked: {new Date(userReward.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {status.rewards.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rewards unlocked yet. Keep leveling up!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamificationDashboard;