import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  BoltIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { habitService, Habit, HabitPrediction } from '../services/habitService';
import HabitList from '../components/habits/HabitList';
import TodayView from '../components/habits/TodayView';
import AnalyticsDashboard from '../components/habits/AnalyticsDashboard';
import CreateHabitModal from '../components/habits/CreateHabitModal';
import CommunityHub from '../components/habits/CommunityHub';

type ActiveTab = 'today' | 'habits' | 'analytics' | 'community';

const SmartHabitsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [predictions, setPredictions] = useState<HabitPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [habitsResponse, predictionsResponse] = await Promise.all([
        habitService.getHabits({ isActive: true }),
        habitService.getTodayPredictions()
      ]);
      
      setHabits(habitsResponse.habits);
      setPredictions(predictionsResponse.predictions);
    } catch (error) {
      console.error('Failed to load habits data:', error);
      toast.error('Failed to load habits data');
    } finally {
      setLoading(false);
    }
  };

  const handleHabitCreated = (newHabit: Habit) => {
    setHabits(prev => [...prev, newHabit]);
    toast.success('Habit created successfully!');
    setShowCreateModal(false);
  };

  const handleHabitUpdated = (updatedHabit: Habit) => {
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const handleHabitDeleted = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    toast.success('Habit deleted successfully');
  };

  const getTotalStreak = () => {
    return habits.reduce((total, habit) => total + (habit.stats?.currentStreak || 0), 0);
  };

  const getOverallCompletionRate = () => {
    const rates = habits.map(h => h.stats?.completionRate || 0);
    return rates.length > 0 ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length) : 0;
  };

  const getActiveHabitsCount = () => {
    return habits.filter(h => h.isActive).length;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Smart Habits
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Build lasting habits with AI-powered insights and predictions
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6 bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-1">
                  <CalendarDaysIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getActiveHabitsCount()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active Habits</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full mb-1">
                  <TrophyIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getTotalStreak()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Streak</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-1">
                  <BoltIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{getOverallCompletionRate()}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Success Rate</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Habit
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'today'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CalendarDaysIcon className="w-5 h-5 inline-block mr-2" />
            Today
          </button>
          
          <button
            onClick={() => setActiveTab('habits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'habits'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <BoltIcon className="w-5 h-5 inline-block mr-2" />
            All Habits
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ChartBarIcon className="w-5 h-5 inline-block mr-2" />
            Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('community')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'community'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <UsersIcon className="w-5 h-5 inline-block mr-2" />
            Community
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'today' && (
          <TodayView 
            habits={habits}
            predictions={predictions}
            onHabitLogged={loadData}
            onHabitUpdated={handleHabitUpdated}
          />
        )}
        
        {activeTab === 'habits' && (
          <HabitList
            habits={habits}
            onHabitUpdated={handleHabitUpdated}
            onHabitDeleted={handleHabitDeleted}
            onCreateNew={() => setShowCreateModal(true)}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsDashboard habits={habits} />
        )}
        
        {activeTab === 'community' && (
          <CommunityHub habits={habits} />
        )}
      </div>

      {/* Create Habit Modal */}
      {showCreateModal && (
        <CreateHabitModal
          onClose={() => setShowCreateModal(false)}
          onHabitCreated={handleHabitCreated}
        />
      )}
    </div>
  );
};

export default SmartHabitsPage;