import React, { useState } from 'react';
import {
  PlusIcon,
  FunnelIcon,
  ChevronRightIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { Habit, habitService } from '../../services/habitService';

interface HabitListProps {
  habits: Habit[];
  onHabitUpdated: (habit: Habit) => void;
  onHabitDeleted: (habitId: string) => void;
  onCreateNew: () => void;
}

const HabitList: React.FC<HabitListProps> = ({
  habits,
  onHabitUpdated,
  onHabitDeleted,
  onCreateNew
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredHabits = habits.filter(habit => {
    if (!showInactive && !habit.isActive) return false;
    if (selectedCategory && habit.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(habits.map(h => h.category)));

  const handleToggleActive = async (habit: Habit) => {
    try {
      const response = await habitService.updateHabit(habit.id, {
        isActive: !habit.isActive
      });
      onHabitUpdated(response.habit);
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const handleDeleteHabit = async (habit: Habit) => {
    if (!window.confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await habitService.deleteHabit(habit.id);
      onHabitDeleted(habit.id);
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const getCategoryInfo = (category: string) => {
    return habitService.getCategoryInfo(category);
  };

  const getStreakDisplay = (habit: Habit) => {
    const streak = habit.stats?.currentStreak || 0;
    const color = habitService.getStreakColor(streak);
    return (
      <div className="flex items-center text-sm">
        <FireIcon className="w-4 h-4 mr-1" style={{ color }} />
        <span style={{ color }}>{habitService.formatStreak(streak)}</span>
      </div>
    );
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No habits yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating your first habit.
        </p>
        <div className="mt-6">
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create your first habit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FunnelIcon className="w-5 h-5 text-gray-400 mr-2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => {
                const info = getCategoryInfo(category);
                return (
                  <option key={category} value={category}>
                    {info.icon} {info.label}
                  </option>
                );
              })}
            </select>
          </div>
          
          <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
            />
            Show inactive
          </label>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredHabits.length} habit{filteredHabits.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHabits.map(habit => {
          const categoryInfo = getCategoryInfo(habit.category);
          
          return (
            <div
              key={habit.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md ${
                habit.isActive 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-gray-100 dark:border-gray-800 opacity-60'
              }`}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold mr-3"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {habit.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryInfo.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(habit)}
                      className={`p-1 rounded-full ${
                        habit.isActive 
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title={habit.isActive ? 'Deactivate habit' : 'Activate habit'}
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteHabit(habit)}
                      className="p-1 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete habit"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {habit.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {habit.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Completion Rate
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {habit.stats?.completionRate || 0}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Current Streak
                    </p>
                    <div className="mt-1">
                      {getStreakDisplay(habit)}
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Frequency
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {habit.frequencyType === 'daily' && 'Every day'}
                    {habit.frequencyType === 'weekly' && 'Weekly'}
                    {habit.frequencyType === 'custom' && 'Custom schedule'}
                    {habit.targetTime && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        at {habitService.formatTime(habit.targetTime)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Micro Habits */}
                {habit.microHabits && habit.microHabits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Micro Habits
                    </p>
                    <div className="space-y-1">
                      {habit.microHabits.slice(0, 3).map((microHabit, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                          <ChevronRightIcon className="w-3 h-3 mr-1 text-gray-400" />
                          {microHabit}
                        </div>
                      ))}
                      {habit.microHabits.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          +{habit.microHabits.length - 3} more steps
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Quality Rating */}
                {habit.stats?.recentAvgQuality && habit.stats.recentAvgQuality > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      Average Quality
                    </p>
                    <div className="flex items-center">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <div
                            key={star}
                            className={`w-4 h-4 rounded-full ${
                              star <= habit.stats!.recentAvgQuality
                                ? 'bg-yellow-400'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                        {habit.stats.recentAvgQuality.toFixed(1)}/5
                      </span>
                    </div>
                  </div>
                )}

                {/* Last Activity */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(habit.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HabitList;