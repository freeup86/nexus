import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  Lightbulb, 
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react';
import { personalInsightsService, PersonalInsight, CoachingSuggestion, MoodEntry } from '../../services/personalInsightsService';
import MoodCalendar from './MoodCalendar';

interface PersonalInsightsDashboardProps {}

const PersonalInsightsDashboard: React.FC<PersonalInsightsDashboardProps> = () => {
  const [dashboardData, setDashboardData] = useState<{
    insights: PersonalInsight[];
    suggestions: CoachingSuggestion[];
    moodTrends: MoodEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('overview');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedMoodEntry, setSelectedMoodEntry] = useState<MoodEntry | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await personalInsightsService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);
      await personalInsightsService.generateInsights();
      await loadDashboard(); // Reload to show new insights
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateSuggestionStatus = async (id: string, status: string) => {
    try {
      await personalInsightsService.updateSuggestionStatus(id, status);
      await loadDashboard();
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  const acknowledgeInsight = async (id: string) => {
    try {
      await personalInsightsService.acknowledgeInsight(id);
      await loadDashboard();
    } catch (error) {
      console.error('Error acknowledging insight:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'life_pattern': return <Activity className="h-5 w-5" />;
      case 'mood_trend': return <Heart className="h-5 w-5" />;
      case 'energy_pattern': return <TrendingUp className="h-5 w-5" />;
      case 'cross_domain': return <Brain className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const handleCalendarDateSelect = (date: Date, moodEntry?: MoodEntry) => {
    setSelectedCalendarDate(date);
    setSelectedMoodEntry(moodEntry || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading insights...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="h-8 w-8 mr-3 text-blue-600" />
            Personal Insights
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered analysis of your life patterns, mood, and habits
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowMoodForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Mood
          </button>
          <button
            onClick={generateInsights}
            disabled={generating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            {generating ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'calendar', label: 'Mood Calendar', icon: Calendar }
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
        <>
          {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Brain className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Insights</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.insights.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.suggestions.filter(s => s.status === 'pending').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-pink-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mood Entries</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.moodTrends.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Mood Intensity</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.moodTrends.length 
                  ? (dashboardData.moodTrends.reduce((sum, entry) => sum + entry.intensity, 0) / dashboardData.moodTrends.length).toFixed(1)
                  : '—'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Insights */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Insights</h2>
          </div>
          <div className="p-6">
            {dashboardData?.insights.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No insights yet. Generate your first analysis!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.insights.slice(0, 5).map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getInsightIcon(insight.insightType)}
                        <div className="flex-1">
                          <h3 className="font-medium">{insight.title}</h3>
                          <p className="text-sm mt-1 opacity-80">{insight.description}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs">
                            <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                            <span>Categories: {insight.categories.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      {insight.status === 'active' && (
                        <button
                          onClick={() => acknowledgeInsight(insight.id)}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coaching Suggestions */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Coaching Suggestions</h2>
          </div>
          <div className="p-6">
            {dashboardData?.suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No suggestions yet. Generate insights to get personalized coaching!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData?.suggestions.slice(0, 5).map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{suggestion.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            suggestion.priority >= 8 ? 'bg-red-100 text-red-700' :
                            suggestion.priority >= 6 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            Priority {suggestion.priority}/10
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{suggestion.suggestion}</p>
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                          <span>Difficulty: {suggestion.difficulty}</span>
                          <span>Timeframe: {suggestion.timeframe}</span>
                          <span>Category: {suggestion.category}</span>
                        </div>
                      </div>
                    </div>
                    {suggestion.status === 'pending' && (
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => updateSuggestionStatus(suggestion.id, 'accepted')}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateSuggestionStatus(suggestion.id, 'dismissed')}
                          className="px-3 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <MoodCalendar onDateSelect={handleCalendarDateSelect} />
            </div>
            
            {/* Selected Date Details */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                {selectedCalendarDate ? 
                  `Details for ${selectedCalendarDate.toLocaleDateString()}` : 
                  'Select a Date'
                }
              </h3>
              
              {selectedCalendarDate && selectedMoodEntry ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Mood Entry</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Mood:</span>
                        <span className="font-medium capitalize">{selectedMoodEntry.mood}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Mood Intensity:</span>
                        <span className="font-medium">{selectedMoodEntry.intensity}/10</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Energy:</span>
                        <span className="font-medium capitalize">{selectedMoodEntry.energyLevel.replace('_', ' ')}</span>
                      </div>
                      {selectedMoodEntry.notes && (
                        <div>
                          <span className="text-sm text-gray-600">Notes:</span>
                          <p className="text-sm mt-1">{selectedMoodEntry.notes}</p>
                        </div>
                      )}
                      {selectedMoodEntry.triggers && selectedMoodEntry.triggers.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Triggers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedMoodEntry.triggers.map((trigger, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedMoodEntry.activities && selectedMoodEntry.activities.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Activities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedMoodEntry.activities.map((activity, index) => (
                              <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Recorded at: {selectedMoodEntry.recordedAt ? new Date(selectedMoodEntry.recordedAt).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedCalendarDate ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No mood entry for this date</p>
                  <button
                    onClick={() => setShowMoodForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Log Mood for This Day
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Click on a date in the calendar to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mood Quick Log Modal */}
      {showMoodForm && (
        <MoodLogModal 
          onClose={() => setShowMoodForm(false)}
          onSubmit={async (moodData) => {
            await personalInsightsService.logMood(moodData);
            setShowMoodForm(false);
            await loadDashboard();
          }}
        />
      )}
    </div>
  );
};

// Simple Mood Log Modal Component
interface MoodLogModalProps {
  onClose: () => void;
  onSubmit: (moodData: any) => Promise<void>;
}

const MoodLogModal: React.FC<MoodLogModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    mood: '',
    intensity: 5,
    energyLevel: 'medium',
    notes: '',
    triggers: [] as string[],
    activities: [] as string[]
  });

  const moods = ['happy', 'sad', 'anxious', 'excited', 'calm', 'stressed', 'angry', 'content', 'tired', 'energetic'];
  const energyLevels = ['very_low', 'low', 'medium', 'high', 'very_high'];
  const commonTriggers = ['work', 'family', 'health', 'weather', 'exercise', 'sleep', 'social'];
  const commonActivities = ['working', 'exercising', 'socializing', 'resting', 'studying', 'hobbies'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Log Your Current Mood</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({...formData, mood: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select mood...</option>
              {moods.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mood Intensity: {formData.intensity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.intensity}
              onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
            <select
              value={formData.energyLevel}
              onChange={(e) => setFormData({...formData, energyLevel: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {energyLevels.map(level => (
                <option key={level} value={level}>{level.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="What's affecting your mood?"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Mood
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInsightsDashboard;