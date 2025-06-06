import axios from '../config/api';

const API_URL = '/document-organizer';

export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  processedDate?: string;
  status: 'processing' | 'completed' | 'failed';
  extractedText?: string;
  ocrConfidence?: number;
  categories?: DocumentCategory[];
  tags?: DocumentTag[];
  extractedData?: DocumentData[];
  reminders?: DocumentReminder[];
}

export interface DocumentCategory {
  id: string;
  category: Category;
  confidence: number;
  isManual: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
}

export interface DocumentTag {
  id: string;
  tag: Tag;
}

export interface Tag {
  id: string;
  name: string;
}

export interface DocumentData {
  id: string;
  fieldName: string;
  fieldValue: string;
  fieldType: string;
  confidence: number;
}

export interface DocumentReminder {
  id: string;
  reminderDate: string;
  reminderType: 'expiration' | 'renewal' | 'payment_due' | 'custom';
  description: string;
  completed: boolean;
  completedAt?: string;
  document: {
    id: string;
    originalName: string;
  };
}

export interface DocumentsResponse {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchParams {
  keywords?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  amount?: {
    min?: number;
    max?: number;
  };
  categories?: string[];
  documentType?: string;
}

export interface Analytics {
  totalDocuments: number;
  categoryCounts: { category: string; count: number }[];
  recentDocuments: { id: string; originalName: string; uploadDate: string }[];
  upcomingReminders: DocumentReminder[];
  documentsByMonth: { month: string; count: number }[];
}

export interface QuestionResponse {
  question: string;
  answer: string;
  relevantDocuments: string[];
  calculations?: string;
  suggestions?: string;
  totalDocuments: number;
}

export interface UploadResponse {
  message: string;
  documents: { id: string; filename: string; status: string }[];
  duplicates?: { filename: string; message: string; existingId?: string }[];
  failed?: { filename: string; message: string }[];
  summary?: {
    total: number;
    successful: number;
    duplicates: number;
    failed: number;
  };
}

class DocumentOrganizerService {
  async uploadDocuments(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('documents', file);
    });

    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocuments(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  }): Promise<DocumentsResponse> {
    const response = await axios.get(`${API_URL}/documents`, { params });
    return response.data;
  }

  async getDocument(id: string): Promise<{ document: Document }> {
    const response = await axios.get(`${API_URL}/documents/${id}`);
    return response.data;
  }

  async updateDocument(
    id: string,
    data: {
      categories?: string[];
      tags?: string[];
      customData?: Record<string, any>;
    }
  ): Promise<{ document: Document }> {
    const response = await axios.put(`${API_URL}/documents/${id}`, data);
    return response.data;
  }

  async deleteDocument(id: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/documents/${id}`);
    return response.data;
  }

  async searchDocuments(query: string): Promise<{
    documents: Document[];
    searchParams: SearchParams;
    query: string;
  }> {
    const response = await axios.post(`${API_URL}/documents/search`, { query });
    return response.data;
  }

  async askQuestion(question: string): Promise<QuestionResponse> {
    const response = await axios.post(`${API_URL}/documents/ask`, { question });
    return response.data;
  }

  async getAnalytics(): Promise<Analytics> {
    const response = await axios.get(`${API_URL}/analytics`);
    return response.data;
  }

  async addReminder(
    documentId: string,
    reminder: {
      reminderDate: string;
      reminderType: 'expiration' | 'renewal' | 'payment_due' | 'custom';
      description: string;
    }
  ): Promise<{ reminder: DocumentReminder }> {
    const response = await axios.post(`${API_URL}/documents/${documentId}/reminders`, reminder);
    return response.data;
  }

  // Helper function to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper function to get category color
  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      Receipt: '#10B981',
      Invoice: '#3B82F6',
      Contract: '#8B5CF6',
      Warranty: '#F59E0B',
      Medical: '#EF4444',
      Tax: '#6366F1',
      Insurance: '#14B8A6',
      Identity: '#EC4899',
      Education: '#84CC16',
      Financial: '#F97316',
      'Real Estate': '#06B6D4',
      Vehicle: '#0EA5E9',
      Travel: '#D946EF',
      Utility: '#64748B',
      Other: '#94A3B8',
    };
    return colors[category] || '#94A3B8';
  }

  // Helper function to get document icon based on type
  getDocumentIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel')) return '📊';
    if (fileType.includes('text')) return '📋';
    return '📎';
  }
}

export const documentOrganizerService = new DocumentOrganizerService();