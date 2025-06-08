import api from '../config/api';

// Types for the enhanced journal system
export interface JournalSession {
  sessionId: string;
  prompt: string;
  followUpQuestions: string[];
  suggestedTopics: string[];
}

export interface JournalResponse {
  response: string;
  followUpQuestions: string[];
  insights: string[];
  suggestedActions: string[];
  sessionStats: {
    wordCount: number;
    duration: number;
  };
}

export interface SessionSummary {
  summary: string;
  keyThemes: string[];
  emotionalJourney: string;
  growthIndicators: string[];
  actionableInsights: string[];
  affirmation: string;
}

export interface CheckInData {
  mood: string;
  energyLevel: string;
  gratitudeItems?: string[];
  intentions?: string[];
  accomplishments?: string[];
  challenges?: string[];
  notes?: string;
  overallRating?: number;
  tomorrowFocus?: string;
}

export interface MoodEntry {
  mood: string;
  intensity: number;
  triggers?: string[];
  notes?: string;
}

export interface WeeklyInsights {
  weekSummary: {
    totalEntries: number;
    avgMoodIntensity: number;
    consistencyScore: number;
  };
  moodAnalysis: {
    trend: string;
    dominantMoods: string[];
    triggers: string[];
  };
  themeAnalysis: {
    recurringThemes: string[];
    emergingPatterns: string[];
  };
  progressReport: {
    goalsProgress: Array<{
      goal: string;
      progress: number;
      status: string;
    }>;
    achievements: string[];
  };
  recommendations: string[];
}

export interface JournalGoal {
  id?: string;
  title: string;
  description?: string;
  category: string;
  targetMetric?: string;
  targetValue?: number;
  frequency?: string;
  targetDate?: string;
  progress?: number;
  status?: string;
}

export const journalService = {
  // ============== INTERACTIVE JOURNALING ==============
  
  // Start a new journal session
  startSession: async (options: {
    sessionType?: 'morning' | 'evening' | 'mood_check' | 'weekly_review';
    framework?: 'gratitude' | 'cbt' | 'dream' | 'morning_pages' | 'reflection';
    context?: {
      currentMood?: string;
      energyLevel?: string;
    };
  } = {}): Promise<JournalSession> => {
    const response = await api.post('/journal/session/start', options);
    return response.data;
  },

  // Continue conversation in a session
  respondToSession: async (sessionId: string, data: {
    response: string;
    mood?: string;
    moodIntensity?: number;
  }): Promise<JournalResponse> => {
    const response = await api.post(`/journal/session/${sessionId}/respond`, data);
    return response.data;
  },

  // End journal session
  endSession: async (sessionId: string): Promise<{
    summary: SessionSummary;
    insights: any;
    streakUpdate: any;
  }> => {
    const response = await api.post(`/journal/session/${sessionId}/end`);
    return response.data;
  },

  // ============== CHECK-INS ==============
  
  // Morning check-in
  morningCheckIn: async (data: CheckInData): Promise<{
    checkIn: any;
    insights: any;
    todaysFocus: string;
    affirmation: string;
  }> => {
    const response = await api.post('/journal/checkin/morning', data);
    return response.data;
  },

  // Evening check-in
  eveningCheckIn: async (data: CheckInData): Promise<{
    checkIn: any;
    daySummary: any;
    reflection: string;
    tomorrowSuggestions: string[];
  }> => {
    const response = await api.post('/journal/checkin/evening', data);
    return response.data;
  },

  // ============== MOOD TRACKING ==============
  
  // Quick mood log
  quickMoodLog: async (data: MoodEntry): Promise<{
    moodEntry: any;
    insights: any;
    pattern: string;
    suggestion: string;
  }> => {
    const response = await api.post('/journal/mood/quick', data);
    return response.data;
  },

  // Get monthly mood data for calendar view
  getMonthlyMoodData: async (year?: number, month?: number): Promise<{
    year: number;
    month: number;
    dailyMoods: { [key: string]: any };
    monthStats: {
      totalDays: number;
      avgMoodIntensity: number;
      mostCommonMood: string;
    };
  }> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());
    
    const response = await api.get(`/journal/mood/monthly?${params}`);
    return response.data;
  },

  // ============== INSIGHTS & ANALYTICS ==============
  
  // Get weekly insights
  getWeeklyInsights: async (): Promise<WeeklyInsights> => {
    const response = await api.get('/journal/insights/weekly');
    return response.data;
  },

  // ============== GOALS ==============
  
  // Create a new goal
  createGoal: async (goal: JournalGoal): Promise<{
    goal: JournalGoal;
    prompts: string[];
  }> => {
    const response = await api.post('/journal/goals', goal);
    return response.data;
  },

  // Get all goals
  getGoals: async (): Promise<JournalGoal[]> => {
    const response = await api.get('/journal/goals');
    return response.data.goals || [];
  },

  // Update goal progress
  updateGoalProgress: async (goalId: string, progress: number): Promise<JournalGoal> => {
    const response = await api.patch(`/journal/goals/${goalId}/progress`, { progress });
    return response.data.goal;
  },

  // Get enhanced journal entries
  getJournalEntries: async (options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    entries: any[];
    totalCount: number;
    hasMore: boolean;
  }> => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const response = await api.get(`/journal/entries?${params}`);
    return response.data;
  },

  // ============== LEGACY HABIT JOURNAL ENDPOINTS ==============
  
  // Get today's prompts (from habit journal)
  getTodayPrompts: async (): Promise<any[]> => {
    const response = await api.get('/habits/journal/prompts/today');
    return response.data.prompts || [];
  },

  // Create journal entry (habit-specific)
  createJournalEntry: async (entryData: {
    habitId?: string;
    promptType: string;
    promptText: string;
    userResponse: string;
    isVoiceEntry?: boolean;
  }): Promise<any> => {
    const response = await api.post('/habits/journal/entry', entryData);
    return response.data.entry;
  },

  // Get legacy habit journal entries
  getHabitJournalEntries: async (filters: {
    habitId?: string;
    promptType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<any[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/habits/journal/entries?${params}`);
    return response.data.entries || [];
  },

  // Get habit journal weekly insights
  getHabitWeeklyInsights: async (week?: string): Promise<any> => {
    const params = week ? `?week=${week}` : '';
    const response = await api.get(`/habits/journal/insights/weekly${params}`);
    return response.data.insights;
  },

  // Analyze text with AI
  analyzeText: async (text: string, context?: any): Promise<any> => {
    const response = await api.post('/habits/journal/analyze', { text, context });
    return response.data.analysis;
  }
};

// Helper functions for UI components
export const journalHelpers = {
  // Mood options
  moodOptions: [
    { value: 'very_happy', label: '😄 Very Happy', emoji: '😄' },
    { value: 'happy', label: '😊 Happy', emoji: '😊' },
    { value: 'content', label: '😌 Content', emoji: '😌' },
    { value: 'neutral', label: '😐 Neutral', emoji: '😐' },
    { value: 'tired', label: '😴 Tired', emoji: '😴' },
    { value: 'stressed', label: '😓 Stressed', emoji: '😓' },
    { value: 'anxious', label: '😰 Anxious', emoji: '😰' },
    { value: 'sad', label: '😢 Sad', emoji: '😢' },
    { value: 'angry', label: '😠 Angry', emoji: '😠' },
    { value: 'overwhelmed', label: '😵 Overwhelmed', emoji: '😵' }
  ],

  // Energy level options
  energyOptions: [
    { value: 'very_high', label: '⚡ Very High', emoji: '⚡' },
    { value: 'high', label: '🔋 High', emoji: '🔋' },
    { value: 'medium', label: '🟢 Medium', emoji: '🟢' },
    { value: 'low', label: '🟡 Low', emoji: '🟡' },
    { value: 'very_low', label: '🔴 Very Low', emoji: '🔴' }
  ],

  // Session types
  sessionTypes: [
    { value: 'morning', label: '🌅 Morning Reflection', description: 'Start your day with intention' },
    { value: 'evening', label: '🌙 Evening Review', description: 'Reflect on your day' },
    { value: 'mood_check', label: '💭 Mood Check', description: 'Quick emotional check-in' },
    { value: 'weekly_review', label: '📊 Weekly Review', description: 'Weekly progress and insights' }
  ],

  // Therapeutic frameworks
  frameworks: [
    { value: 'gratitude', label: '🙏 Gratitude', description: 'Focus on appreciation and thankfulness' },
    { value: 'cbt', label: '🧠 CBT', description: 'Cognitive Behavioral Therapy techniques' },
    { value: 'morning_pages', label: '📝 Morning Pages', description: 'Stream of consciousness writing' },
    { value: 'reflection', label: '🤔 Daily Reflection', description: 'End-of-day review and learning' },
    { value: 'dream', label: '💭 Dream Journal', description: 'Record and analyze dreams' }
  ],

  // Goal categories
  goalCategories: [
    { value: 'personal_growth', label: '🌱 Personal Growth', emoji: '🌱' },
    { value: 'mental_health', label: '🧘 Mental Health', emoji: '🧘' },
    { value: 'productivity', label: '⚡ Productivity', emoji: '⚡' },
    { value: 'relationships', label: '❤️ Relationships', emoji: '❤️' },
    { value: 'health_fitness', label: '💪 Health & Fitness', emoji: '💪' },
    { value: 'creativity', label: '🎨 Creativity', emoji: '🎨' },
    { value: 'career', label: '💼 Career', emoji: '💼' },
    { value: 'learning', label: '📚 Learning', emoji: '📚' },
    { value: 'mindfulness', label: '🧘‍♀️ Mindfulness', emoji: '🧘‍♀️' },
    { value: 'habits', label: '🔄 Habits', emoji: '🔄' }
  ],

  // Get mood emoji
  getMoodEmoji: (mood: string): string => {
    const moodOption = journalHelpers.moodOptions.find(option => option.value === mood);
    return moodOption?.emoji || '😐';
  },

  // Get energy emoji
  getEnergyEmoji: (energy: string): string => {
    const energyOption = journalHelpers.energyOptions.find(option => option.value === energy);
    return energyOption?.emoji || '🟢';
  },

  // Format mood intensity
  formatMoodIntensity: (intensity: number): string => {
    if (intensity >= 8) return 'Very Strong';
    if (intensity >= 6) return 'Strong';
    if (intensity >= 4) return 'Moderate';
    if (intensity >= 2) return 'Mild';
    return 'Very Mild';
  },

  // Get mood color for intensity
  getMoodColor: (mood: string, intensity: number): string => {
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
  }
};

export default journalService;