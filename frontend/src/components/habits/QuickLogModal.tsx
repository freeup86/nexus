import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Habit, HabitLog, habitService, MOOD_OPTIONS, ENERGY_LEVELS } from '../../services/habitService';

interface QuickLogModalProps {
  habit: Habit;
  onClose: () => void;
  onSubmit: (logData: Partial<HabitLog>) => void;
}

const QuickLogModal: React.FC<QuickLogModalProps> = ({
  habit,
  onClose,
  onSubmit
}) => {
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [mood, setMood] = useState<string>('neutral');
  const [energyLevel, setEnergyLevel] = useState<string>('medium');
  const [location, setLocation] = useState<string>('');
  const [contextNotes, setContextNotes] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const logData: Partial<HabitLog> = {
      completionStatus: 'completed',
      qualityRating,
      mood,
      energyLevel,
      location: location.trim() || undefined,
      contextNotes: contextNotes.trim() || undefined,
      duration: duration > 0 ? duration : undefined
    };

    onSubmit(logData);
  };

  const categoryInfo = habitService.getCategoryInfo(habit.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold mr-3"
                style={{ backgroundColor: categoryInfo.color }}
              >
                {categoryInfo.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Log Completion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {habit.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quality Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How well did you complete this habit?
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setQualityRating(rating)}
                    className={`p-2 rounded-full transition-colors ${
                      rating <= qualityRating
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    <StarIcon className="w-6 h-6 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {qualityRating}/5
                </span>
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How are you feeling?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((moodOption) => (
                  <button
                    key={moodOption.value}
                    type="button"
                    onClick={() => setMood(moodOption.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      mood === moodOption.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{moodOption.icon}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {moodOption.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Energy Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ENERGY_LEVELS.map((energy) => (
                  <button
                    key={energy.value}
                    type="button"
                    onClick={() => setEnergyLevel(energy.value)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      energyLevel === energy.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {energy.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration (optional) */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes) - Optional
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  id="duration"
                  value={duration || ''}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="How long did it take?"
                  min="0"
                />
              </div>
            </div>

            {/* Location (optional) */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location - Optional
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Where did you do this?"
                />
              </div>
            </div>

            {/* Context Notes (optional) */}
            <div>
              <label htmlFor="contextNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes - Optional
              </label>
              <textarea
                id="contextNotes"
                value={contextNotes}
                onChange={(e) => setContextNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any additional thoughts or context..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                Log Completion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;