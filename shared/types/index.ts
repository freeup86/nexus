// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'ADMIN' | 'PREMIUM';
  profilePicture?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tweet {
  id: string;
  userId: string;
  content: string;
  topic?: string;
  tone?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  scheduledFor?: Date;
  publishedAt?: Date;
  twitterId?: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextExtraction {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  extractedText: string;
  metadata?: any;
  processingTime: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  originalText: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
  analysis?: ContractAnalysis;
}

export interface ContractAnalysis {
  id: string;
  contractId: string;
  summary: string;
  keyTerms: string[];
  risks: string[];
  obligations: Record<string, string[]>;
  importantDates: Array<{ date: string; description: string }>;
  plainEnglish: string;
  aiModel: string;
  processingTime: number;
  createdAt: Date;
}