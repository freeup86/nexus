import axios from '../config/api';

const API_URL = '/habits';

// Interfaces
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  frequencyType: 'daily' | 'weekly' | 'custom';
  frequencyDetails?: any;
  microHabits: string[];
  targetTime?: string;
  reminderEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: HabitStats;
  logs?: HabitLog[];
  predictions?: HabitPrediction[];
}

export interface HabitStats {
  currentStreak: number;
  completionRate: number;
  totalCompletions: number;
  recentAvgQuality: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string;
  completionStatus: 'completed' | 'skipped' | 'partial';
  qualityRating?: number;
  mood?: string;
  energyLevel?: string;
  location?: string;
  contextNotes?: string;
  skipReason?: string;
  duration?: number;
  createdAt: string;
}

export interface HabitPrediction {
  id: string;
  habitId: string;
  habitName?: string;
  predictionDate: string;
  skipRiskScore: number;
  recommendedTimes: string[];
  riskFactors: any;
  confidence: number;
  actualOutcome?: string;
  suggestion?: string;
  aiInsights?: any;
}

export interface JournalEntry {
  id: string;
  userId: string;
  habitId?: string;
  promptType: string;
  promptText: string;
  userResponse: string;
  aiAnalysis?: any;
  isVoiceEntry: boolean;
  createdAt: string;
  habit?: {
    id: string;
    name: string;
    category: string;
  };
}

export interface JournalPrompt {
  type: string;
  habitId?: string;
  promptText: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyInsights {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalHabits: number;
    totalLogs: number;
    completedHabits: number;
    skippedHabits: number;
    averageQuality: number;
    journalEntries: number;
  };
  habitBreakdown: {
    habitId: string;
    habitName: string;
    completionRate: number;
    totalLogs: number;
    averageQuality: number;
  }[];
  aiInsights?: any;
  recommendations: string[];
}

export const HABIT_CATEGORIES = [
  { value: 'health', label: 'Health & Fitness', icon: '💪', color: '#10B981' },
  { value: 'productivity', label: 'Productivity', icon: '⚡', color: '#3B82F6' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘', color: '#8B5CF6' },
  { value: 'learning', label: 'Learning', icon: '📚', color: '#F59E0B' },
  { value: 'social', label: 'Social', icon: '👥', color: '#EF4444' },
  { value: 'creative', label: 'Creative', icon: '🎨', color: '#EC4899' },
  { value: 'financial', label: 'Financial', icon: '💰', color: '#06B6D4' },
  { value: 'personal_care', label: 'Personal Care', icon: '✨', color: '#84CC16' },
  { value: 'environment', label: 'Environment', icon: '🌱', color: '#14B8A6' },
  { value: 'other', label: 'Other', icon: '📋', color: '#64748B' }
];

export const MOOD_OPTIONS = [
  { value: 'happy', label: 'Happy', icon: '😊', color: '#10B981' },
  { value: 'neutral', label: 'Neutral', icon: '😐', color: '#6B7280' },
  { value: 'stressed', label: 'Stressed', icon: '😰', color: '#F59E0B' },
  { value: 'tired', label: 'Tired', icon: '😴', color: '#8B5CF6' },
  { value: 'energetic', label: 'Energetic', icon: '⚡', color: '#EF4444' }
];

export const ENERGY_LEVELS = [
  { value: 'low', label: 'Low', color: '#EF4444' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#10B981' }
];

class HabitService {
  // ============== HABITS ==============
  
  async createHabit(habitData: Partial<Habit>): Promise<{ habit: Habit }> {
    const response = await axios.post(`${API_URL}`, habitData);
    return response.data;
  }

  async getHabits(params?: {
    category?: string;
    isActive?: boolean;
  }): Promise<{ habits: Habit[] }> {
    const response = await axios.get(`${API_URL}`, { params });
    return response.data;
  }

  async getHabit(id: string): Promise<{ habit: Habit }> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  }

  async updateHabit(id: string, updates: Partial<Habit>): Promise<{ habit: Habit }> {
    const response = await axios.put(`${API_URL}/${id}`, updates);
    return response.data;
  }

  async deleteHabit(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  }

  // ============== HABIT LOGGING ==============

  async logHabit(habitId: string, logData: Partial<HabitLog>): Promise<{ log: HabitLog }> {
    const response = await axios.post(`${API_URL}/${habitId}/log`, logData);
    return response.data;
  }

  async getHabitLogs(habitId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ logs: HabitLog[] }> {
    const response = await axios.get(`${API_URL}/${habitId}/logs`, { params });
    return response.data;
  }

  async updateHabitLog(logId: string, updates: Partial<HabitLog>): Promise<{ log: HabitLog }> {
    const response = await axios.put(`${API_URL}/log/${logId}`, updates);
    return response.data;
  }

  async deleteHabitLog(logId: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/log/${logId}`);
    return response.data;
  }

  async getTodayLogs(): Promise<{ logs: (HabitLog & { habit: Habit })[] }> {
    const response = await axios.get(`${API_URL}/today`);
    return response.data;
  }

  // ============== PREDICTIONS ==============

  async getTodayPredictions(): Promise<{ predictions: HabitPrediction[] }> {
    const response = await axios.get(`${API_URL}/predictions/today`);
    return response.data;
  }

  async getOptimalTimes(habitId: string): Promise<{
    habitId: string;
    optimalTimes: string[];
    recommendation: {
      primaryTime: string;
      alternativeTimes: string[];
      reasoning: string;
    };
  }> {
    const response = await axios.get(`${API_URL}/${habitId}/optimal-times`);
    return response.data;
  }

  async getPredictionHistory(habitId: string, days?: number): Promise<{
    predictions: HabitPrediction[];
    accuracy: number;
    totalPredictions: number;
    evaluatedPredictions: number;
  }> {
    const response = await axios.get(`${API_URL}/${habitId}/history`, { 
      params: days ? { days } : {} 
    });
    return response.data;
  }

  // ============== JOURNAL ==============

  async createJournalEntry(entryData: {
    habitId?: string;
    promptType: string;
    promptText: string;
    userResponse: string;
    isVoiceEntry?: boolean;
  }): Promise<{ entry: JournalEntry }> {
    const response = await axios.post(`${API_URL}/journal/entry`, entryData);
    return response.data;
  }

  async getJournalEntries(params?: {
    habitId?: string;
    promptType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ entries: JournalEntry[] }> {
    const response = await axios.get(`${API_URL}/journal/entries`, { params });
    return response.data;
  }

  async getTodayPrompts(): Promise<{ prompts: JournalPrompt[] }> {
    const response = await axios.get(`${API_URL}/journal/prompts/today`);
    return response.data;
  }

  async analyzeText(text: string, context?: any): Promise<{ analysis: any }> {
    const response = await axios.post(`${API_URL}/journal/analyze`, { text, context });
    return response.data;
  }

  async getWeeklyInsights(week?: string): Promise<{ insights: WeeklyInsights }> {
    const response = await axios.get(`${API_URL}/journal/insights/weekly`, {
      params: week ? { week } : {}
    });
    return response.data;
  }

  // ============== HELPER FUNCTIONS ==============

  getCategoryInfo(category: string) {
    return HABIT_CATEGORIES.find(cat => cat.value === category) || HABIT_CATEGORIES[9];
  }

  getMoodInfo(mood: string) {
    return MOOD_OPTIONS.find(m => m.value === mood);
  }

  getEnergyInfo(energy: string) {
    return ENERGY_LEVELS.find(e => e.value === energy);
  }

  formatTime(timeString: string): string {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return timeString;
    }
  }

  formatStreak(days: number): string {
    if (days === 0) return 'Start today!';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  getStreakColor(days: number): string {
    if (days === 0) return '#6B7280';
    if (days < 7) return '#F59E0B';
    if (days < 30) return '#10B981';
    return '#8B5CF6';
  }

  getRiskColor(score: number): string {
    if (score < 0.3) return '#10B981'; // Green - low risk
    if (score < 0.6) return '#F59E0B'; // Yellow - medium risk
    return '#EF4444'; // Red - high risk
  }

  getRiskLabel(score: number): string {
    if (score < 0.3) return 'Low Risk';
    if (score < 0.6) return 'Medium Risk';
    return 'High Risk';
  }

  calculateCompletionRate(logs: HabitLog[], days: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentLogs = logs.filter(log => new Date(log.completedAt) >= cutoffDate);
    const completedLogs = recentLogs.filter(log => log.completionStatus === 'completed');
    
    return recentLogs.length > 0 ? (completedLogs.length / recentLogs.length) * 100 : 0;
  }

  isHabitDueToday(habit: Habit): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    switch (habit.frequencyType) {
      case 'daily':
        return true;
      case 'weekly':
        // Check if today matches the specified days
        const weekdays = habit.frequencyDetails?.days || [1]; // Default to Monday
        return weekdays.includes(dayOfWeek);
      case 'custom':
        // Custom logic based on frequencyDetails
        const timesPerWeek = habit.frequencyDetails?.times_per_week || 1;
        // Simple heuristic - assume spread evenly across week
        return Math.random() < (timesPerWeek / 7);
      default:
        return true;
    }
  }
}

export const habitService = new HabitService();