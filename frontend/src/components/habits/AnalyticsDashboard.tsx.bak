import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  TrophyIcon,
  CalendarDaysIcon,
  ClockIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Habit, habitService } from '../../services/habitService';

interface AnalyticsDashboardProps {
  habits: Habit[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ habits }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);

  const activeHabits = habits.filter(h => h.isActive);
  
  const getOverallStats = () => {
    const totalHabits = activeHabits.length;
    const totalCompletions = activeHabits.reduce((sum, habit) => {
      return sum + (habit.stats?.totalCompletions || 0);
    }, 0);
    
    const averageCompletionRate = activeHabits.length > 0 
      ? Math.round(activeHabits.reduce((sum, habit) => {
          return sum + (habit.stats?.completionRate || 0);
        }, 0) / activeHabits.length)
      : 0;
    
    const totalStreak = activeHabits.reduce((sum, habit) => {
      return sum + (habit.stats?.currentStreak || 0);
    }, 0);
    
    const averageQuality = activeHabits.length > 0
      ? activeHabits.reduce((sum, habit) => {
          return sum + (habit.stats?.recentAvgQuality || 0);
        }, 0) / activeHabits.length
      : 0;

    return {
      totalHabits,
      totalCompletions,
      averageCompletionRate,
      totalStreak,
      averageQuality
    };
  };

  const getTopPerformingHabits = () => {
    return [...activeHabits]
      .sort((a, b) => (b.stats?.completionRate || 0) - (a.stats?.completionRate || 0))
      .slice(0, 5);
  };

  const getHabitsNeedingAttention = () => {
    return [...activeHabits]
      .filter(habit => (habit.stats?.completionRate || 0) < 50)
      .sort((a, b) => (a.stats?.completionRate || 0) - (b.stats?.completionRate || 0))
      .slice(0, 5);
  };

  const getCategoryBreakdown = () => {
    const categoryStats: { [key: string]: { count: number; avgCompletion: number; totalStreak: number } } = {};
    
    activeHabits.forEach(habit => {
      const category = habit.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, avgCompletion: 0, totalStreak: 0 };
      }
      
      categoryStats[category].count++;
      categoryStats[category].avgCompletion += habit.stats?.completionRate || 0;
      categoryStats[category].totalStreak += habit.stats?.currentStreak || 0;
    });
    
    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      avgCompletion: Math.round(stats.avgCompletion / stats.count),
      totalStreak: stats.totalStreak,
      categoryInfo: habitService.getCategoryInfo(category)
    }));
  };

  const getStreakHeatmap = () => {
    // Create a simple 7x8 grid representing the last 8 weeks
    const weeks = 8;
    const daysPerWeek = 7;
    const heatmapData = [];
    
    for (let week = 0; week < weeks; week++) {
      const weekData = [];
      for (let day = 0; day < daysPerWeek; day++) {
        // Simulate some data for now - in real implementation this would come from actual logs
        const intensity = Math.random();
        weekData.push({
          date: new Date(Date.now() - (week * 7 + day) * 24 * 60 * 60 * 1000),
          intensity,
          completions: Math.floor(intensity * activeHabits.length)
        });
      }
      heatmapData.push(weekData);
    }
    
    return heatmapData.reverse(); // Reverse to show oldest first
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.25) return 'bg-green-200 dark:bg-green-900/40';
    if (intensity < 0.5) return 'bg-green-300 dark:bg-green-800/60';
    if (intensity < 0.75) return 'bg-green-400 dark:bg-green-700/80';
    return 'bg-green-500 dark:bg-green-600';
  };

  const stats = getOverallStats();
  const topHabits = getTopPerformingHabits();
  const strugglingHabits = getHabitsNeedingAttention();
  const categoryBreakdown = getCategoryBreakdown();
  const heatmapData = getStreakHeatmap();

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Analytics Yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create some habits and start logging to see your analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h2>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeframe === period
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Habits</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalHabits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Completions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCompletions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Completion</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.averageCompletionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <FireIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Streak</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalStreak}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Quality</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.averageQuality > 0 ? stats.averageQuality.toFixed(1) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Activity Heatmap - Last 8 Weeks
        </h3>
        <div className="space-y-1">
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex space-x-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-3 h-3 rounded-sm ${getIntensityColor(day.intensity)}`}
                  title={`${day.date.toLocaleDateString()}: ${day.completions} completions`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(intensity)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Habits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <TrophyIcon className="w-5 h-5 text-green-500 mr-2" />
            Top Performing Habits
          </h3>
          <div className="space-y-3">
            {topHabits.map((habit, index) => {
              const categoryInfo = habitService.getCategoryInfo(habit.category);
              return (
                <div key={habit.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-xs mr-3 ml-2"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.icon}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{habit.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {habit.stats?.completionRate || 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habits Needing Attention */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ArrowTrendingDownIcon className="w-5 h-5 text-red-500 mr-2" />
            Needs Attention
          </h3>
          <div className="space-y-3">
            {strugglingHabits.length > 0 ? (
              strugglingHabits.map((habit, index) => {
                const categoryInfo = habitService.getCategoryInfo(habit.category);
                return (
                  <div key={habit.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs mr-3"
                        style={{ backgroundColor: categoryInfo.color }}
                      >
                        {categoryInfo.icon}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{habit.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {habit.stats?.completionRate || 0}%
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All habits are performing well! 🎉
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Category Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryBreakdown.map(({ category, count, avgCompletion, totalStreak, categoryInfo }) => (
            <div key={category} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-3"
                  style={{ backgroundColor: categoryInfo.color }}
                >
                  {categoryInfo.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{categoryInfo.label}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{count} habit{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Completion</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{avgCompletion}%</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total Streak</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{totalStreak}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;