import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  TrendingUp,
  Zap,
  Cloud,
  Sun
} from 'lucide-react';
import { personalInsightsService, MoodEntry } from '../../services/personalInsightsService';

interface MoodCalendarProps {
  onDateSelect?: (date: Date, moodEntry?: MoodEntry) => void;
}

const MoodCalendar: React.FC<MoodCalendarProps> = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadMoodData();
  }, [currentDate]);

  const loadMoodData = async () => {
    try {
      setLoading(true);
      // Get mood data for the current month view
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // We'll use the 30d analytics endpoint for now since it covers most monthly views
      const analytics = await personalInsightsService.getMoodAnalytics('30d');
      setMoodEntries(analytics.moodEntries || []);
    } catch (error) {
      console.error('Error loading mood data:', error);
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
  };

  const getMoodForDate = (date: Date): MoodEntry | undefined => {
    return moodEntries.find(entry => {
      if (!entry.recordedAt) return false;
      const entryDate = new Date(entry.recordedAt);
      return entryDate.toDateString() === date.toDateString();
    });
  };

  const getMoodColor = (mood: string, intensity: number): string => {
    const baseColors: { [key: string]: string } = {
      'very_happy': 'bg-green-500',
      'happy': 'bg-green-400',
      'neutral': 'bg-yellow-400',
      'sad': 'bg-orange-400',
      'very_sad': 'bg-red-400',
      'anxious': 'bg-purple-400',
      'excited': 'bg-blue-400',
      'calm': 'bg-teal-400',
      'angry': 'bg-red-500',
      'content': 'bg-green-300'
    };

    const color = baseColors[mood] || 'bg-gray-400';
    
    // Adjust opacity based on intensity
    if (intensity <= 3) return color.replace('500', '300').replace('400', '200');
    if (intensity <= 7) return color;
    return color.replace('400', '500').replace('300', '400');
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'very_happy':
      case 'happy':
      case 'excited':
        return '😊';
      case 'calm':
      case 'content':
        return '😌';
      case 'neutral':
        return '😐';
      case 'sad':
      case 'very_sad':
        return '😢';
      case 'anxious':
        return '😰';
      case 'angry':
        return '😠';
      default:
        return '😐';
    }
  };

  const getEnergyIcon = (energyLevel: string) => {
    switch (energyLevel) {
      case 'very_high':
      case 'high':
        return <Zap className="h-3 w-3 text-yellow-500" />;
      case 'medium':
        return <TrendingUp className="h-3 w-3 text-blue-500" />;
      case 'low':
      case 'very_low':
        return <Cloud className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const moodEntry = getMoodForDate(date);
    onDateSelect?.(date, moodEntry);
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-100"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const moodEntry = getMoodForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-24 border border-gray-100 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
            isToday ? 'ring-2 ring-blue-400' : ''
          } ${isSelected ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {day}
            </span>
            {moodEntry && getEnergyIcon(moodEntry.energyLevel)}
          </div>
          
          {moodEntry && (
            <div className="space-y-1">
              <div
                className={`w-full h-6 rounded flex items-center justify-center text-white text-xs font-medium ${getMoodColor(moodEntry.mood, moodEntry.intensity)}`}
              >
                {getMoodIcon(moodEntry.mood)}
              </div>
              <div className="text-xs text-gray-600 truncate">
                {moodEntry.intensity}/10
              </div>
            </div>
          )}
          
          {!moodEntry && (
            <div className="flex items-center justify-center h-16 text-gray-300">
              <div className="text-xs">No entry</div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading mood calendar...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Mood Calendar</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b">
        {weekdays.map(weekday => (
          <div key={weekday} className="py-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {weekday}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Mood Legend</h4>
            <div className="flex space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Very Happy</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>Happy</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                <span>Neutral</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-400 rounded"></div>
                <span>Sad</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded"></div>
                <span>Very Sad</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Energy Level</h4>
            <div className="flex space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span>High</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-3 w-3 text-blue-500" />
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <Cloud className="h-3 w-3 text-gray-500" />
                <span>Low</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodCalendar;