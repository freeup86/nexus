export interface Dream {
  id: string;
  userId: string;
  title: string;
  content: string;
  dreamDate: string;
  emotions?: string[];
  themes?: string[];
  symbols?: Array<{
    symbol: string;
    meaning: string;
  }>;
  lucidity?: number;
  clarity?: number;
  mood?: string;
  analysis?: string;
  createdAt: string;
  updatedAt: string;
  tags?: DreamTag[];
  insights?: DreamInsight[];
}

export interface DreamTag {
  id: string;
  dreamId: string;
  tag: string;
  createdAt: string;
}

export interface DreamInsight {
  id: string;
  dreamId: string;
  type: 'pattern' | 'symbol' | 'emotion' | 'theme';
  insight: string;
  confidence?: number;
  createdAt: string;
}

export interface DreamPattern {
  id: string;
  userId: string;
  patternType: 'recurring_theme' | 'emotional_trend' | 'symbol_frequency';
  pattern: any;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface DreamStats {
  totalDreams: number;
  recentDreams: number;
  avgLucidity: number;
  avgClarity: number;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}

export interface PatternAnalysis {
  message: string;
  patterns: DreamPattern[];
  summary: {
    totalDreams: number;
    recurringThemes: Array<{
      theme: string;
      count: number;
    }>;
    frequentSymbols: Array<{
      symbol: string;
      count: number;
    }>;
    emotionalTrends: Array<{
      emotion: string;
      count: number;
      percentage: number;
    }>;
  };
}