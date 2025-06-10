import React, { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  HeartIcon,
  MoonIcon,
  SunIcon,
  BoltIcon,
  PlusIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  FaceSmileIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { 
  journalService, 
  journalHelpers,
  JournalSession,
  JournalResponse,
  CheckInData,
  WeeklyInsights,
  JournalGoal 
} from '../../services/journalService';
import MoodCalendar from './MoodCalendar';

interface InteractiveJournalProps {
  className?: string;
}

const InteractiveJournal: React.FC<InteractiveJournalProps> = ({ className }) => {
  const [activeSession, setActiveSession] = useState<JournalSession | null>(null);
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    mood?: string;
    moodIntensity?: number;
  }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [showSessionStart, setShowSessionStart] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const [showMoodCalendar, setShowMoodCalendar] = useState(false);
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsights | null>(null);
  const [goals, setGoals] = useState<JournalGoal[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [entriesFilter, setEntriesFilter] = useState<'all' | 'week'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check-in form state
  const [checkInData, setCheckInData] = useState<CheckInData>({
    mood: '',
    energyLevel: '',
    gratitudeItems: ['', '', ''],
    intentions: ['']
  });

  // Current mood for session
  const [currentMood, setCurrentMood] = useState<string>('');
  const [currentMoodIntensity, setCurrentMoodIntensity] = useState<number>(5);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    if (showEntries) {
      loadJournalEntries(entriesFilter);
    }
  }, [entriesFilter, showEntries]);

  const loadInitialData = async () => {
    try {
      setIsInitialLoading(true);
      const [insightsResponse, goalsResponse, entriesResponse] = await Promise.all([
        journalService.getWeeklyInsights().catch(() => null),
        journalService.getGoals().catch(() => []),
        journalService.getJournalEntries({ limit: 10 }).catch(async (error) => {
          console.error('Failed to load journal entries:', error);
          // Try legacy habit journal entries as fallback
          try {
            const legacyEntries = await journalService.getHabitJournalEntries({ limit: 10 });
            console.log('Using legacy habit journal entries:', legacyEntries);
            return { entries: legacyEntries || [], totalCount: legacyEntries?.length || 0, hasMore: false };
          } catch (legacyError) {
            console.error('Failed to load legacy entries too:', legacyError);
            return { entries: [], totalCount: 0, hasMore: false };
          }
        })
      ]);
      
      console.log('Loaded journal data:', {
        insights: insightsResponse,
        goals: goalsResponse,
        entries: entriesResponse
      });
      
      setWeeklyInsights(insightsResponse);
      setGoals(Array.isArray(goalsResponse) ? goalsResponse : []);
      
      // Ensure we have the correct structure for entries
      if (entriesResponse && entriesResponse.entries) {
        setJournalEntries(entriesResponse.entries);
      } else if (Array.isArray(entriesResponse)) {
        // Handle if API returns array directly
        setJournalEntries(entriesResponse);
      } else {
        setJournalEntries([]);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load journal data');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const refreshWeeklyInsights = async () => {
    try {
      const insightsResponse = await journalService.getWeeklyInsights();
      setWeeklyInsights(insightsResponse);
    } catch (error) {
      console.error('Failed to refresh weekly insights:', error);
      // Don't show error toast for insights refresh as it's not critical
    }
  };

  const loadJournalEntries = async (filter: 'all' | 'week' = 'all') => {
    try {
      let entriesResponse;
      if (filter === 'week') {
        // For weekly filter, we'll filter client-side for now
        // In a production app, you'd want to add a date filter to the API
        const allEntries = await journalService.getJournalEntries({ limit: 50 });
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        
        if (allEntries && allEntries.entries) {
          const weeklyEntries = allEntries.entries.filter(entry => 
            new Date(entry.createdAt) >= weekStart
          );
          entriesResponse = { entries: weeklyEntries, totalCount: weeklyEntries.length, hasMore: false };
        } else {
          entriesResponse = { entries: [], totalCount: 0, hasMore: false };
        }
      } else {
        entriesResponse = await journalService.getJournalEntries({ limit: 10 });
      }

      if (entriesResponse && entriesResponse.entries) {
        setJournalEntries(entriesResponse.entries);
      } else if (Array.isArray(entriesResponse)) {
        setJournalEntries(entriesResponse);
      } else {
        setJournalEntries([]);
      }
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      // Fallback to legacy entries
      try {
        const legacyEntries = await journalService.getHabitJournalEntries({ limit: 10 });
        setJournalEntries(legacyEntries || []);
      } catch (legacyError) {
        setJournalEntries([]);
      }
    }
  };

  const deleteJournalEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingEntryId(entryId);
      await journalService.deleteJournalEntry(entryId);
      
      // Remove the deleted entry from the local state
      setJournalEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      // Refresh weekly insights and reload entries with current filter
      await Promise.all([
        refreshWeeklyInsights(),
        loadJournalEntries(entriesFilter)
      ]);
      
      toast.success('Journal entry deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete journal entry:', error);
      toast.error(error.response?.data?.error || 'Failed to delete journal entry');
    } finally {
      setDeletingEntryId(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startSession = async (sessionType: string, framework?: string) => {
    try {
      setIsStartingSession(true);
      
      const session = await journalService.startSession({
        sessionType: sessionType as 'morning' | 'evening' | 'mood_check' | 'weekly_review',
        framework: framework as 'gratitude' | 'cbt' | 'dream' | 'morning_pages' | 'reflection',
        context: {
          currentMood: currentMood || undefined,
          energyLevel: checkInData.energyLevel || undefined
        }
      });

      setActiveSession(session);
      setConversation([{
        role: 'assistant',
        content: session.prompt,
        timestamp: new Date()
      }]);
      setShowSessionStart(false);
    } catch (error: any) {
      console.error('Failed to start session:', error);
      toast.error(error.response?.data?.error || 'Failed to start journal session');
    } finally {
      setIsStartingSession(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !activeSession || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');

    // Add user message to conversation
    const newConversation = [...conversation, {
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date(),
      mood: currentMood || undefined,
      moodIntensity: currentMood ? currentMoodIntensity : undefined
    }];
    setConversation(newConversation);

    try {
      setIsLoading(true);

      const response = await journalService.respondToSession(activeSession.sessionId, {
        response: userMessage,
        mood: currentMood || undefined,
        moodIntensity: currentMood ? currentMoodIntensity : undefined
      });

      // Add AI response to conversation
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      }]);

      // Show insights if available
      if (response.insights && response.insights.length > 0) {
        toast.success('New insights discovered!');
      }

    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      setIsLoading(true);

      const result = await journalService.endSession(activeSession.sessionId);
      
      // Show session summary
      toast.success('Session completed! Summary saved.');
      
      if (result.summary) {
        setConversation(prev => [...prev, {
          role: 'assistant',
          content: `Session Summary: ${result.summary.summary}\n\nKey insights: ${result.summary.actionableInsights?.join(', ')}`,
          timestamp: new Date()
        }]);
      }

      // Reset session
      setActiveSession(null);
      setConversation([]);
      setCurrentMood('');
      setCurrentMoodIntensity(5);

      // Reload data
      loadInitialData();
    } catch (error: any) {
      console.error('Failed to end session:', error);
      toast.error(error.response?.data?.error || 'Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMorningCheckIn = async () => {
    if (!checkInData.mood || !checkInData.energyLevel) {
      toast.error('Please fill in your mood and energy level');
      return;
    }

    try {
      setIsLoading(true);

      const response = await journalService.morningCheckIn({
        ...checkInData,
        gratitudeItems: checkInData.gratitudeItems?.filter(item => item.trim()) || [],
        intentions: checkInData.intentions?.filter(item => item.trim()) || []
      });

      toast.success('Morning check-in completed!');
      setShowCheckIn(false);
      
      // Reset check-in data
      setCheckInData({
        mood: '',
        energyLevel: '',
        gratitudeItems: ['', '', ''],
        intentions: ['']
      });

      // Show affirmation
      if (response.affirmation) {
        toast.success(`✨ ${response.affirmation}`, {
          duration: 5000
        });
      }

      // Refresh insights since we added a new entry
      await refreshWeeklyInsights();

    } catch (error: any) {
      console.error('Failed to complete check-in:', error);
      toast.error(error.response?.data?.error || 'Failed to complete check-in');
    } finally {
      setIsLoading(false);
    }
  };

  const QuickMoodSelector = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      {journalHelpers.moodOptions.slice(0, 6).map((mood) => (
        <button
          key={mood.value}
          onClick={() => setCurrentMood(mood.value)}
          className={`flex items-center px-3 py-2 rounded-full text-sm transition-colors ${
            currentMood === mood.value
              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 border-2 border-indigo-500'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300'
          }`}
        >
          <span className="text-lg mr-1">{mood.emoji}</span>
          {mood.label.split(' ')[1]}
        </button>
      ))}
    </div>
  );

  if (showSessionStart) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative">
          {/* Loading Overlay */}
          {isStartingSession && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">Starting your journal session...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Preparing personalized prompts</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <SparklesIcon className="w-6 h-6 text-indigo-500 mr-2" />
              Start Your Journal Session
            </h2>
            <button
              onClick={() => setShowSessionStart(false)}
              disabled={isStartingSession}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Mood Check */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                How are you feeling right now?
              </label>
              <QuickMoodSelector />
              {currentMood && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Intensity (1-10)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentMoodIntensity}
                    onChange={(e) => setCurrentMoodIntensity(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Mild</span>
                    <span className="font-medium">{currentMoodIntensity}</span>
                    <span>Intense</span>
                  </div>
                </div>
              )}
            </div>

            {/* Session Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What kind of session would you like?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {journalHelpers.sessionTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => startSession(type.value)}
                    disabled={isStartingSession}
                    className="flex items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl mr-3">{type.label.split(' ')[0]}</span>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {type.label.substring(type.label.indexOf(' ') + 1)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Therapeutic Frameworks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Or choose a guided framework:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {journalHelpers.frameworks.map((framework) => (
                  <button
                    key={framework.value}
                    onClick={() => startSession('free_form', framework.value)}
                    disabled={isStartingSession}
                    className="flex items-start p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-800/30 dark:hover:to-indigo-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl mr-3">{framework.label.split(' ')[0]}</span>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {framework.label.substring(framework.label.indexOf(' ') + 1)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {framework.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-indigo-500 mr-2" />
            AI Journal Companion
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your personal space for reflection and growth
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCheckIn(true)}
            className="flex items-center px-3 py-2 text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800/30"
          >
            <SunIcon className="w-4 h-4 mr-1" />
            Check-in
          </button>
          
          
          <button
            onClick={() => setShowEntries(true)}
            className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/30"
          >
            <SparklesIcon className="w-4 h-4 mr-1" />
            Entries ({journalEntries.length})
          </button>
          
          <button
            onClick={() => setShowMoodCalendar(true)}
            className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/30"
          >
            <CalendarDaysIcon className="w-4 h-4 mr-1" />
            Mood Calendar
          </button>

          {!activeSession && (
            <button
              onClick={() => setShowSessionStart(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Start Session
            </button>
          )}
        </div>
      </div>

      {/* Weekly Insights */}
      {weeklyInsights && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center mb-4">
            <BoltIcon className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Weekly Insights</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-purple-100 text-sm">Entries (7 days)</p>
              <p className="text-2xl font-bold">{weeklyInsights.weekSummary.totalEntries}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Avg Mood</p>
              <p className="text-2xl font-bold">{weeklyInsights.weekSummary.avgMoodIntensity.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Consistency</p>
              <p className="text-2xl font-bold">{weeklyInsights.weekSummary.consistencyScore.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-purple-100 text-sm">Growth</p>
              <p className="text-2xl font-bold">{weeklyInsights.moodAnalysis.trend === 'improving' ? '📈' : '📊'}</p>
            </div>
          </div>
          {weeklyInsights.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">AI Recommendations</h4>
              <ul className="space-y-1">
                {weeklyInsights.recommendations.slice(0, 2).map((rec, index) => (
                  <li key={index} className="text-sm text-purple-100">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Active Session */}
      {activeSession && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Session Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Active Session
              </span>
            </div>
            <button
              onClick={endSession}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              End Session
            </button>
          </div>

          {/* Conversation */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.mood && (
                    <div className="flex items-center mt-2 text-xs opacity-75">
                      <span className="mr-1">
                        {journalHelpers.getMoodEmoji(message.mood)}
                      </span>
                      <span>
                        {journalHelpers.formatMoodIntensity(message.moodIntensity || 5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Share your thoughts..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Active Session */}
      {!activeSession && !showSessionStart && !isInitialLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <SparklesIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Ready to start journaling?
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {journalEntries.length > 0 
              ? `You have ${journalEntries.length} journal entries. Continue your journey with a new session.`
              : 'Begin an AI-guided conversation to explore your thoughts and feelings'
            }
          </p>
          <button
            onClick={() => setShowSessionStart(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {journalEntries.length > 0 ? 'Start New Session' : 'Start Your First Session'}
          </button>
        </div>
      )}

      {/* Loading State */}
      {!activeSession && !showSessionStart && isInitialLoading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-pulse">
            <div className="mx-auto h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <SunIcon className="w-6 h-6 text-orange-500 mr-2" />
                  Morning Check-in
                </h3>
                <button
                  onClick={() => setShowCheckIn(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Mood */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    How are you feeling this morning?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {journalHelpers.moodOptions.map((mood) => (
                      <button
                        key={mood.value}
                        onClick={() => setCheckInData(prev => ({ ...prev, mood: mood.value }))}
                        className={`flex items-center p-3 rounded-lg text-sm transition-colors ${
                          checkInData.mood === mood.value
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 border-2 border-indigo-500'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mr-2">{mood.emoji}</span>
                        <span>{mood.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Energy Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What's your energy level?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {journalHelpers.energyOptions.map((energy) => (
                      <button
                        key={energy.value}
                        onClick={() => setCheckInData(prev => ({ ...prev, energyLevel: energy.value }))}
                        className={`flex items-center p-3 rounded-lg text-sm transition-colors ${
                          checkInData.energyLevel === energy.value
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 border-2 border-indigo-500'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mr-2">{energy.emoji}</span>
                        <span>{energy.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gratitude */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What are you grateful for today? (Optional)
                  </label>
                  {checkInData.gratitudeItems?.map((item, index) => (
                    <input
                      key={index}
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...(checkInData.gratitudeItems || [])];
                        newItems[index] = e.target.value;
                        setCheckInData(prev => ({ ...prev, gratitudeItems: newItems }));
                      }}
                      placeholder={`Gratitude item ${index + 1}`}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  ))}
                </div>

                {/* Intentions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    What's your intention for today? (Optional)
                  </label>
                  {checkInData.intentions?.map((intention, index) => (
                    <input
                      key={index}
                      type="text"
                      value={intention}
                      onChange={(e) => {
                        const newIntentions = [...(checkInData.intentions || [])];
                        newIntentions[index] = e.target.value;
                        setCheckInData(prev => ({ ...prev, intentions: newIntentions }));
                      }}
                      placeholder="Today I intend to..."
                      className="w-full px-3 py-2 mb-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowCheckIn(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMorningCheckIn}
                    disabled={!checkInData.mood || !checkInData.energyLevel || isLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SunIcon className="w-5 h-5 inline mr-2" />
                    Complete Check-in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Journal Entries Modal */}
      {showEntries && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <SparklesIcon className="w-6 h-6 text-blue-500 mr-2" />
                  Journal Entries
                </h3>
                <button
                  onClick={() => setShowEntries(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</span>
                <button
                  onClick={() => setEntriesFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    entriesFilter === 'all'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  All Entries
                </button>
                <button
                  onClick={() => setEntriesFilter('week')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    entriesFilter === 'week'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  This Week ({weeklyInsights?.weekSummary.totalEntries || 0})
                </button>
              </div>

              <div className="space-y-4">
                {journalEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No journal entries yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Start your first session to create entries</p>
                  </div>
                ) : (
                  journalEntries.map((entry, index) => (
                    <div key={entry.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.entryType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Journal Entry'}
                          </span>
                          {entry.framework && (
                            <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded">
                              {entry.framework}
                            </span>
                          )}
                          {entry.mood && (
                            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                              {journalHelpers.getMoodEmoji(entry.mood)} {entry.mood}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {entry.promptText && entry.promptText !== 'Morning Check-in' && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt:</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{entry.promptText}"</p>
                        </div>
                      )}
                      
                      {entry.userResponse && entry.userResponse.trim() && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Response:</h4>
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {entry.userResponse.length > 300 
                              ? `${entry.userResponse.substring(0, 300)}...` 
                              : entry.userResponse}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          {entry.wordCount && (
                            <span>{entry.wordCount} words</span>
                          )}
                          {entry.sessionDuration && (
                            <span>{Math.floor(entry.sessionDuration / 60)} min</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteJournalEntry(entry.id)}
                          disabled={deletingEntryId === entry.id}
                          className="flex items-center space-x-1 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded transition-colors"
                          title="Delete entry"
                        >
                          {deletingEntryId === entry.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-500"></div>
                          ) : (
                            <TrashIcon className="h-3 w-3" />
                          )}
                          <span className="text-xs">Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goals Modal */}
      {showGoals && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2" />
                  Journal Goals
                </h3>
                <button
                  onClick={() => setShowGoals(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No goals set yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Create goals to track your journal progress</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <div key={goal.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {goal.title}
                          </h4>
                          {goal.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {goal.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded">
                          {goal.category}
                        </span>
                      </div>
                      
                      {goal.progress !== undefined && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(goal.progress || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className="capitalize">{goal.status}</span>
                        {goal.targetDate && (
                          <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood Calendar Modal */}
      {showMoodCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <CalendarDaysIcon className="w-6 h-6 text-purple-500 mr-2" />
                  Monthly Mood Calendar
                </h3>
                <button
                  onClick={() => setShowMoodCalendar(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <MoodCalendar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveJournal;