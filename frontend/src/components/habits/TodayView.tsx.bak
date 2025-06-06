import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Habit, HabitPrediction, HabitLog, habitService } from '../../services/habitService';
import QuickLogModal from './QuickLogModal';

interface TodayViewProps {
  habits: Habit[];
  predictions: HabitPrediction[];
  onHabitLogged: () => void;
  onHabitUpdated: (habit: Habit) => void;
}

const TodayView: React.FC<TodayViewProps> = ({
  habits,
  predictions,
  onHabitLogged,
  onHabitUpdated
}) => {
  const [todayLogs, setTodayLogs] = useState<(HabitLog & { habit: Habit })[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayLogs();
  }, []);

  const loadTodayLogs = async () => {
    try {
      const response = await habitService.getTodayLogs();
      setTodayLogs(response.logs);
    } catch (error) {
      console.error('Failed to load today logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayHabits = habits.filter(habit => {
    return habit.isActive && habitService.isHabitDueToday(habit);
  });

  const getHabitLog = (habitId: string) => {
    return todayLogs.find(log => log.habitId === habitId);
  };

  const getHabitPrediction = (habitId: string) => {
    return predictions.find(p => p.habitId === habitId);
  };

  const handleQuickLog = (habit: Habit, status: 'completed' | 'skipped') => {
    if (status === 'completed') {
      // For completed habits, open modal for quality rating
      setSelectedHabit(habit);
      setShowLogModal(true);
    } else {
      // For skipped habits, log immediately
      logHabit(habit, { completionStatus: 'skipped' });
    }
  };

  const logHabit = async (habit: Habit, logData: Partial<HabitLog>) => {
    try {
      await habitService.logHabit(habit.id, logData);
      await loadTodayLogs();
      onHabitLogged();
      toast.success(`${habit.name} logged successfully!`);
    } catch (error: any) {
      console.error('Failed to log habit:', error);
      toast.error(error.response?.data?.error || 'Failed to log habit');
    }
  };

  const handleLogSubmitted = async (logData: Partial<HabitLog>) => {
    if (!selectedHabit) return;
    
    await logHabit(selectedHabit, logData);
    setShowLogModal(false);
    setSelectedHabit(null);
  };

  const getRiskColorClass = (score: number) => {
    if (score < 0.3) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (score < 0.6) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  const getOptimalTimes = () => {
    const times = new Set<string>();
    predictions.forEach(p => {
      p.recommendedTimes.forEach(time => times.add(time));
    });
    return Array.from(times).sort();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const completedCount = todayLogs.filter(log => log.completionStatus === 'completed').length;
  const totalHabitsToday = todayHabits.length;
  const completionPercentage = totalHabitsToday > 0 ? Math.round((completedCount / totalHabitsToday) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Today's Progress</h2>
            <p className="text-indigo-100">
              {completedCount} of {totalHabitsToday} habits completed
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold mb-1">{completionPercentage}%</div>
            <div className="w-20 h-2 bg-white/20 rounded-full">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
        
        {completionPercentage === 100 && totalHabitsToday > 0 && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <p className="text-sm">🎉 Amazing! You've completed all your habits for today!</p>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {predictions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="w-6 h-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Insights for Today
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Assessment</h4>
              <div className="space-y-2">
                {predictions.slice(0, 3).map(prediction => {
                  const habit = habits.find(h => h.id === prediction.habitId);
                  if (!habit) return null;
                  
                  return (
                    <div key={prediction.habitId} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {habit.name}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColorClass(prediction.skipRiskScore)}`}>
                        {habitService.getRiskLabel(prediction.skipRiskScore)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Optimal Times</h4>
              <div className="flex flex-wrap gap-2">
                {getOptimalTimes().slice(0, 5).map(time => (
                  <span
                    key={time}
                    className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                  >
                    {habitService.formatTime(time)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Habits */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Today's Habits ({todayHabits.length})
        </h3>
        
        {todayHabits.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No habits scheduled for today. Take a well-deserved break!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayHabits.map(habit => {
              const log = getHabitLog(habit.id);
              const prediction = getHabitPrediction(habit.id);
              const categoryInfo = habitService.getCategoryInfo(habit.category);
              
              return (
                <div
                  key={habit.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200 ${
                    log
                      ? log.completionStatus === 'completed'
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-3"
                          style={{ backgroundColor: categoryInfo.color }}
                        >
                          {categoryInfo.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {habit.name}
                          </h4>
                          {habit.targetTime && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Target: {habitService.formatTime(habit.targetTime)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {log && (
                        <div className={`p-1 rounded-full ${
                          log.completionStatus === 'completed'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {log.completionStatus === 'completed' ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                            <XMarkIcon className="w-5 h-5" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Prediction Info */}
                    {prediction && !log && (
                      <div className="mb-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${getRiskColorClass(prediction.skipRiskScore)}`}>
                          {prediction.skipRiskScore > 0.6 && (
                            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                          )}
                          {habitService.getRiskLabel(prediction.skipRiskScore)}
                        </div>
                        
                        {prediction.suggestion && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                            {prediction.suggestion}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Completed Log Info */}
                    {log && (
                      <div className="mb-3 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Logged at {new Date(log.completedAt).toLocaleTimeString([], { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </p>
                        
                        {log.qualityRating && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Quality:</span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <div
                                  key={star}
                                  className={`w-3 h-3 rounded-full ${
                                    star <= log.qualityRating!
                                      ? 'bg-yellow-400'
                                      : 'bg-gray-200 dark:bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {log.mood && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Mood: {habitService.getMoodInfo(log.mood)?.label}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!log && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleQuickLog(habit, 'completed')}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleQuickLog(habit, 'skipped')}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Skip
                        </button>
                      </div>
                    )}

                    {/* Journal Prompt */}
                    {log && (log.completionStatus === 'completed' || log.completionStatus === 'skipped') && (
                      <button
                        onClick={() => {
                          // TODO: Open journal modal
                          toast.success('Journal feature coming soon!');
                        }}
                        className="w-full mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4 inline mr-1" />
                        Reflect on this habit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Log Modal */}
      {showLogModal && selectedHabit && (
        <QuickLogModal
          habit={selectedHabit}
          onClose={() => {
            setShowLogModal(false);
            setSelectedHabit(null);
          }}
          onSubmit={handleLogSubmitted}
        />
      )}
    </div>
  );
};

export default TodayView;