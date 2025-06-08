import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  Lightbulb, 
  Activity,
  CheckCircle,
  RefreshCw,
  Target
} from 'lucide-react';
import { personalInsightsService, PersonalInsight, CoachingSuggestion } from '../../services/personalInsightsService';

interface PersonalInsightsDashboardProps {}

const PersonalInsightsDashboard: React.FC<PersonalInsightsDashboardProps> = () => {
  const [dashboardData, setDashboardData] = useState<{
    insights: PersonalInsight[];
    suggestions: CoachingSuggestion[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
};

export default PersonalInsightsDashboard;