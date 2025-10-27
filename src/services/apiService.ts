import axios from 'axios';

// API Server and React both run on port 3000
// React proxies API requests via public/index.html
const API_BASE_URL = 'http://localhost:3000';

export interface Match {
  id: number;
  title: string;
  status: string;
  localteam: {
    id: number;
    name: string;
    code: string;
  };
  visitorteam: {
    id: number;
    name: string;
    code: string;
  };
  venue: {
    id: number;
    name: string;
    city: string;
  };
  starting_at: string;
  live_score?: string;
}

export interface Question {
  questionId: string;
  question: string;
  questionText?: string; // Backend may use this field instead of 'question'
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mlEnhanced: boolean;
  matchId?: string;
  timestamp?: string;
  options?: string[];
  eventType?: string;
  mlTarget?: string;
  predictionWeight?: number;
  templateId?: string;
  context?: string;
  confidence?: number;
  metadata?: {
    originalEvent?: any;
    template?: any;
    mlPredictions?: any;
    generatedAt?: string;
    version?: string;
    format?: string;
    teams?: {
      home: string;
      away: string;
    };
  };
  interactionMetrics?: {
    questionId: string;
    totalInteractions: number;
    interactionTypes: any;
    lastInteraction: any;
  };
}

export interface HealthStatus {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: any;
}

export interface MonitoringStatus {
  success: boolean;
  data: {
    system: any;
    api: any;
    cache: any;
    database: any;
  };
}

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  constructor() {
    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Live Matches API
  async getLiveMatches(): Promise<{ success: boolean; data: { matches: Match[]; count: number; source: string } }> {
    try {
      const response = await this.api.get('/api/live-matches');
      console.log('Live matches response:', response.data);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Server returned unsuccessful response');
      }
      
      if (!response.data.data || !Array.isArray(response.data.data.matches)) {
        console.warn('No matches found in response, returning empty array');
        return {
          success: true,
          data: {
            matches: [],
            count: 0,
            source: 'api'
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch live matches:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        data: {
          matches: [],
          count: 0,
          source: 'error'
        }
      };
    }
  }

  async refreshLiveMatches(): Promise<{ success: boolean; data: { matches: Match[]; count: number } }> {
    try {
      const response = await this.api.get('/api/live-matches/refresh');
      console.log('Refresh matches response:', response.data);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Server returned unsuccessful response');
      }
      
      if (!response.data.data || !Array.isArray(response.data.data.matches)) {
        console.warn('No matches found in refresh response, returning empty array');
        return {
          success: true,
          data: {
            matches: [],
            count: 0
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to refresh live matches:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        data: {
          matches: [],
          count: 0
        }
      };
    }
  }

  // Get all available questions (for debugging)
  async getAllQuestions(): Promise<{ success: boolean; data: { questions: Question[]; stats: any } }> {
    try {
      const response = await this.api.get('/api/questions');
      console.log('All questions response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch all questions:', error);
      return {
        success: false,
        data: {
          questions: [],
          stats: {}
        }
      };
    }
  }

  // Questions API
  async getQuestions(matchId: string, limit: number = 50): Promise<{ success: boolean; data: { questions: Question[]; stats: any } }> {
    try {
      const response = await this.api.get(`/api/questions/match/${matchId}/questions`, {
        params: { limit }
      });
      console.log('Questions API response:', response.data);
      console.log('Match ID requested:', matchId);
      console.log('Questions count:', response.data?.data?.count);
      console.log('Questions array length:', response.data?.data?.questions?.length);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      if (!response.data.success) {
        console.error('Unsuccessful response:', response.data.message);
        throw new Error(response.data.message || 'Server returned unsuccessful response');
      }
      
      // Check if data exists
      if (!response.data.data) {
        console.warn('No data field in response:', response.data);
        return {
          success: true,
          data: {
            questions: [],
            stats: {}
          }
        };
      }
      
      // Check if questions array exists
      if (!Array.isArray(response.data.data.questions)) {
        console.warn('Questions field is not an array:', response.data.data);
        // Check for alternative field names
        if (response.data.data.count > 0 && response.data.data.questions.length === 0) {
          console.warn('Count is', response.data.data.count, 'but questions array is empty');
        }
        return {
          success: true,
          data: {
            questions: [],
            stats: response.data.data.stats || {}
          }
        };
      }
      
      console.log(`Successfully parsed ${response.data.data.questions.length} questions`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch questions:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        data: {
          questions: [],
          stats: {}
        }
      };
    }
  }

  // Fixture Details API
  async getFixtureDetails(fixtureId: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await this.api.get(`/api/fixture/${fixtureId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch fixture details:', error);
      throw error;
    }
  }

  // Player Stats API
  async getPlayerStats(playerId: string): Promise<{ success: boolean; data: any }> {
    try {
      const response = await this.api.get(`/api/player/${playerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
      throw error;
    }
  }

  // Health Check API
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch health status:', error);
      throw error;
    }
  }

  // Monitoring API
  async getMonitoringStatus(): Promise<MonitoringStatus> {
    try {
      const response = await this.api.get('/monitoring/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch monitoring status:', error);
      throw error;
    }
  }

  // Test Connection API
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.get('/api/test-connection');
      console.log('Test connection response:', response.data);
      
      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        return {
          success: false,
          message: 'Invalid response format from server'
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to test connection:', error);
      
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Connection failed'
      };
    }
  }
}

export const apiService = new ApiService();
