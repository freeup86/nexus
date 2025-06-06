import api from '../config/api';

export interface MoodEntry {
  id?: string;
  mood: string;
  intensity: number;
  energyLevel: string;
  notes?: string;
  triggers?: string[];
  activities?: string[];
  location?: string;
  weather?: string;
  recordedAt?: Date;
  createdAt?: Date;
}

export interface LifeMetric {
  id?: string;
  metricType: string;
  value: number;
  rawValue?: string;
  notes?: string;
  recordedAt?: Date;
  source?: string;
  createdAt?: Date;
}

export interface PersonalInsight {
  id: string;
  insightType: string;
  title: string;
  description: string;
  confidence: number;
  priority: string;
  status: string;
  actionable: boolean;
  categories: string[];
  timeframe?: string;
  createdAt: Date;
  acknowledgedAt?: Date;
}

export interface CoachingSuggestion {
  id: string;
  category: string;
  title: string;
  suggestion: string;
  reasoning: string;
  difficulty: string;
  timeframe: string;
  priority: number;
  status: string;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface DashboardData {
  insights: PersonalInsight[];
  suggestions: CoachingSuggestion[];
  moodTrends: MoodEntry[];
}

export const personalInsightsService = {
  // Get dashboard data
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get('/personal-insights/dashboard');
    return response.data;
  },

  // Log mood entry
  logMood: async (moodData: Omit<MoodEntry, 'id' | 'createdAt'>): Promise<MoodEntry> => {
    const response = await api.post('/personal-insights/mood', moodData);
    return response.data;
  },

  // Log life metric
  logMetric: async (metricData: Omit<LifeMetric, 'id' | 'createdAt'>): Promise<LifeMetric> => {
    const response = await api.post('/personal-insights/metrics', metricData);
    return response.data;
  },

  // Generate AI insights
  generateInsights: async (): Promise<{
    insights: PersonalInsight[];
    suggestions: CoachingSuggestion[];
    analysisComplete: boolean;
  }> => {
    const response = await api.post('/personal-insights/analyze');
    return response.data;
  },

  // Update coaching suggestion status
  updateSuggestionStatus: async (id: string, status: string): Promise<CoachingSuggestion> => {
    const response = await api.patch(`/personal-insights/suggestions/${id}`, { status });
    return response.data;
  },

  // Acknowledge insight
  acknowledgeInsight: async (id: string): Promise<PersonalInsight> => {
    const response = await api.patch(`/personal-insights/insights/${id}/acknowledge`);
    return response.data;
  },

  // Get mood analytics
  getMoodAnalytics: async (timeframe: string = '30d'): Promise<{
    moodEntries: MoodEntry[];
    timeframe: string;
  }> => {
    const response = await api.get(`/personal-insights/mood/analytics?timeframe=${timeframe}`);
    return response.data;
  }
};