import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { journalService, journalHelpers } from '../../services/journalService';

interface MoodCalendarProps {
  className?: string;
}

const MoodCalendar: React.FC<MoodCalendarProps> = ({ className }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    loadMonthlyData();
  }, [currentDate]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const data = await journalService.getMonthlyMoodData(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setMonthlyData(data);
    } catch (error) {
      console.error('Failed to load monthly mood data:', error);
      toast.error('Failed to load mood calendar');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getDayMoodData = (day: number) => {
    if (!monthlyData || !day) return null;
    
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthlyData.dailyMoods[dateKey] || null;
  };

  const getMoodColor = (moodData: any) => {
    if (!moodData) return 'bg-gray-100 dark:bg-gray-700';
    
    const mood = moodData.dominantMood;
    const intensity = moodData.avgIntensity;
    
    const baseColors: { [key: string]: string } = {
      'very_happy': 'bg-green-500',
      'happy': 'bg-green-400',
      'content': 'bg-green-300',
      'neutral': 'bg-gray-400',
      'tired': 'bg-blue-400',
      'stressed': 'bg-orange-400',
      'anxious': 'bg-red-400',
      'sad': 'bg-blue-500',
      'angry': 'bg-red-500',
      'overwhelmed': 'bg-red-600'
    };

    let color = baseColors[mood] || 'bg-gray-400';
    
    // Adjust opacity based on intensity
    if (intensity <= 3) {
      color = color.replace('500', '200').replace('400', '200').replace('300', '100');
    } else if (intensity <= 6) {
      color = color.replace('500', '400').replace('400', '300');
    }
    
    return color;
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day;
  };

  const selectedDayData = selectedDay ? getDayMoodData(parseInt(selectedDay)) : null;

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalendarDaysIcon className="w-6 h-6 text-indigo-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mood Calendar
          </h3>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium text-gray-900 dark:text-white min-w-[150px] text-center">
            {formatMonthYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Month Stats */}
      {monthlyData && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthlyData.monthStats.totalDays}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Days Tracked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthlyData.monthStats.avgMoodIntensity.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Intensity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl">
              {journalHelpers.getMoodEmoji(monthlyData.monthStats.mostCommonMood)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Most Common</p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {getDaysInMonth().map((day, index) => {
          if (!day) {
            return <div key={index} className="p-2 h-10"></div>;
          }

          const moodData = getDayMoodData(day);
          const isSelected = selectedDay === day.toString();
          const todayClass = isToday(day) ? 'ring-2 ring-indigo-500' : '';

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day.toString())}
              className={`
                relative h-10 p-1 rounded-lg text-sm font-medium transition-all duration-200
                ${getMoodColor(moodData)}
                ${isSelected ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'}
                ${todayClass}
                ${moodData ? 'text-white shadow-sm' : 'text-gray-900 dark:text-white'}
              `}
            >
              <span className="relative z-10">{day}</span>
              {moodData && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full opacity-80">
                  <span className="sr-only">{moodData.count} entries</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDayData && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            {currentDate.toLocaleDateString('en-US', { month: 'long' })} {selectedDay}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mood:</span>
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {journalHelpers.getMoodEmoji(selectedDayData.dominantMood)}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {selectedDayData.dominantMood?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Intensity:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedDayData.avgIntensity.toFixed(1)}/10
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Entries:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedDayData.count}
              </span>
            </div>
            {selectedDayData.entries.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Entry Types:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {Array.from(new Set(selectedDayData.entries.map((e: any) => e.type))).map((type: unknown) => {
                    const typeString = String(type);
                    return (
                      <span key={typeString} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                        {typeString.replace('_', ' ')}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Legend:</p>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">No data</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-200 rounded mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">Low intensity</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span className="text-gray-600 dark:text-gray-400">High intensity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodCalendar;