import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  PlusIcon,
  MicrophoneIcon,
  LightBulbIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  PencilIcon,
  SparklesIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Habit, JournalEntry, JournalPrompt, WeeklyInsights, habitService } from '../../services/habitService';
import InteractiveJournal from './InteractiveJournal';

interface JournalSectionProps {
  habits: Habit[];
}

const JournalSection: React.FC<JournalSectionProps> = ({ habits }) => {
  const [useInteractiveJournal, setUseInteractiveJournal] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [entryText, setEntryText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    loadJournalData();
  }, []);

  const loadJournalData = async () => {
    try {
      setLoading(true);
      const [entriesResponse, promptsResponse, insightsResponse] = await Promise.all([
        habitService.getJournalEntries({ limit: 10 }),
        habitService.getTodayPrompts(),
        habitService.getWeeklyInsights().catch(() => ({ insights: null }))
      ]);
      
      setEntries(entriesResponse.entries);
      setPrompts(promptsResponse.prompts);
      setWeeklyInsights(insightsResponse.insights);
    } catch (error) {
      console.error('Failed to load journal data:', error);
      toast.error('Failed to load journal data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!entryText.trim()) {
      toast.error('Please write something in your journal entry');
      return;
    }

    try {
      const promptText = selectedPrompt ? selectedPrompt.promptText : customPrompt || 'Free writing';
      const promptType = selectedPrompt ? selectedPrompt.type : 'free_writing';

      const response = await habitService.createJournalEntry({
        habitId: selectedPrompt?.habitId,
        promptType,
        promptText,
        userResponse: entryText,
        isVoiceEntry: false
      });

      setEntries(prev => [response.entry, ...prev]);
      setEntryText('');
      setCustomPrompt('');
      setSelectedPrompt(null);
      setShowNewEntryForm(false);
      toast.success('Journal entry created successfully!');
    } catch (error: any) {
      console.error('Failed to create journal entry:', error);
      toast.error(error.response?.data?.error || 'Failed to create journal entry');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getPromptTypeIcon = (type: string) => {
    switch (type) {
      case 'reflection':
        return <LightBulbIcon className="w-4 h-4" />;
      case 'planning':
        return <CalendarDaysIcon className="w-4 h-4" />;
      case 'habit_specific':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <PencilIcon className="w-4 h-4" />;
    }
  };

  const getPromptTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'reflection':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'planning':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'habit_specific':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {useInteractiveJournal ? 'AI Journal Companion' : 'Habit Journal'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {useInteractiveJournal 
              ? 'Interactive AI-powered journaling experience' 
              : 'Reflect on your habits and track your journey'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUseInteractiveJournal(!useInteractiveJournal)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowsRightLeftIcon className="w-4 h-4 mr-1" />
            {useInteractiveJournal ? 'Classic View' : 'AI Mode'}
          </button>
          {!useInteractiveJournal && (
            <button
              onClick={() => setShowNewEntryForm(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Entry
            </button>
          )}
        </div>
      </div>

      {/* Interactive Journal Mode */}
      {useInteractiveJournal && (
        <InteractiveJournal />
      )}

      {/* Classic Journal Mode */}
      {!useInteractiveJournal && (
        <div className="space-y-6">

      {/* Weekly Insights */}
      {weeklyInsights && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Weekly Insights</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-purple-100 text-sm">Total Habits</p>
              <p className="text-2xl font-bold">{weeklyInsights.summary.totalHabits}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Completed</p>
              <p className="text-2xl font-bold">{weeklyInsights.summary.completedHabits}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Avg Quality</p>
              <p className="text-2xl font-bold">
                {weeklyInsights.summary.averageQuality > 0 
                  ? weeklyInsights.summary.averageQuality.toFixed(1) 
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Journal Entries</p>
              <p className="text-2xl font-bold">{weeklyInsights.summary.journalEntries}</p>
            </div>
          </div>
          {weeklyInsights.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">AI Recommendations</h4>
              <ul className="space-y-1">
                {weeklyInsights.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="text-sm text-purple-100">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Prompts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-indigo-500 mr-2" />
            AI-Generated Prompts
          </h3>
          
          {prompts.length > 0 ? (
            <div className="space-y-3">
              {prompts.map((prompt, index) => (
                <div 
                  key={index}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setShowNewEntryForm(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPromptTypeBadgeColor(prompt.type)}`}>
                      {getPromptTypeIcon(prompt.type)}
                      <span className="ml-1 capitalize">{prompt.type.replace('_', ' ')}</span>
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prompt.priority === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : prompt.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {prompt.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{prompt.promptText}</p>
                  {prompt.habitId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Related to: {habits.find(h => h.id === prompt.habitId)?.name || 'Unknown habit'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChatBubbleBottomCenterTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No prompts available today. Start by creating a journal entry!
              </p>
            </div>
          )}
        </div>

        {/* Recent Entries */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <BookOpenIcon className="w-5 h-5 text-green-500 mr-2" />
            Recent Entries
          </h3>
          
          {entries.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {entries.map((entry) => (
                <div 
                  key={entry.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPromptTypeBadgeColor(entry.promptType)}`}>
                        {getPromptTypeIcon(entry.promptType)}
                        <span className="ml-1 capitalize">{entry.promptType.replace('_', ' ')}</span>
                      </span>
                      {entry.isVoiceEntry && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          <MicrophoneIcon className="w-3 h-3 mr-1" />
                          Voice
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">
                    "{entry.promptText}"
                  </p>
                  
                  <p className="text-sm text-gray-900 dark:text-white">
                    {entry.userResponse.length > 150 
                      ? `${entry.userResponse.substring(0, 150)}...`
                      : entry.userResponse
                    }
                  </p>
                  
                  {entry.habit && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Related to: {entry.habit.name}
                    </p>
                  )}
                  
                  {entry.aiAnalysis && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-400 mb-1">AI Insights</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {typeof entry.aiAnalysis === 'string' 
                          ? entry.aiAnalysis 
                          : entry.aiAnalysis.summary || 'Analysis available'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No journal entries yet. Start writing your first entry!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {showNewEntryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  New Journal Entry
                </h3>
                <button
                  onClick={() => {
                    setShowNewEntryForm(false);
                    setSelectedPrompt(null);
                    setEntryText('');
                    setCustomPrompt('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt
                  </label>
                  {selectedPrompt ? (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPromptTypeBadgeColor(selectedPrompt.type)}`}>
                          {getPromptTypeIcon(selectedPrompt.type)}
                          <span className="ml-1 capitalize">{selectedPrompt.type.replace('_', ' ')}</span>
                        </span>
                        <button
                          onClick={() => setSelectedPrompt(null)}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPrompt.promptText}</p>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter a custom prompt or question (optional)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  )}
                </div>

                {/* Entry Text */}
                <div>
                  <label htmlFor="entryText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Response
                  </label>
                  <textarea
                    id="entryText"
                    value={entryText}
                    onChange={(e) => setEntryText(e.target.value)}
                    rows={8}
                    placeholder="Start writing your thoughts..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowNewEntryForm(false);
                      setSelectedPrompt(null);
                      setEntryText('');
                      setCustomPrompt('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEntry}
                    disabled={!entryText.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpenIcon className="w-5 h-5 inline mr-2" />
                    Save Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default JournalSection;