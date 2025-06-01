import { Dream, DreamPattern, DreamStats, PatternAnalysis } from '../types/dream';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

class DreamService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getDreams(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ dreams: Dream[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/api/dreams?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dreams');
    }

    return response.json();
  }

  async getDream(id: string): Promise<Dream> {
    const response = await fetch(`${API_BASE_URL}/api/dreams/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dream');
    }

    return response.json();
  }

  async createDream(dreamData: {
    title: string;
    content: string;
    dreamDate?: string;
    emotions?: string[];
    lucidity?: number;
    clarity?: number;
    mood?: string;
    tags?: string[];
  }): Promise<Dream> {
    const response = await fetch(`${API_BASE_URL}/api/dreams`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(dreamData),
    });

    if (!response.ok) {
      throw new Error('Failed to create dream');
    }

    return response.json();
  }

  async updateDream(id: string, dreamData: Partial<Dream>): Promise<Dream> {
    const response = await fetch(`${API_BASE_URL}/api/dreams/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(dreamData),
    });

    if (!response.ok) {
      throw new Error('Failed to update dream');
    }

    return response.json();
  }

  async deleteDream(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/dreams/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete dream');
    }
  }

  async getDreamPatterns(): Promise<DreamPattern[]> {
    const response = await fetch(`${API_BASE_URL}/api/dreams/patterns/all`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patterns');
    }

    return response.json();
  }

  async analyzePatterns(): Promise<PatternAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/dreams/patterns/analyze`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze patterns');
    }

    return response.json();
  }

  async getDreamStats(): Promise<DreamStats> {
    const response = await fetch(`${API_BASE_URL}/api/dreams/stats/overview`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  }
}

export default new DreamService();