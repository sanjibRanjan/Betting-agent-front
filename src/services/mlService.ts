import axios from 'axios';

const ML_BASE_URL = 'http://localhost:5001';

export interface MLPredictionRequest {
  target: 'wicket_occurrence' | 'runs_per_over' | 'boundary_probability' | 'run_rate_change';
  data: any;
}

export interface MLPredictionResponse {
  success: boolean;
  prediction: number;
  confidence: number;
  target: string;
  timestamp: string;
  metadata?: any;
}

export interface MLModelInfo {
  success: boolean;
  models: {
    [key: string]: {
      name: string;
      version: string;
      status: string;
      accuracy?: number;
      last_trained?: string;
    };
  };
  total_models: number;
  available_targets: string[];
}

export interface MLHealthStatus {
  status: string;
  service: string;
  timestamp: string;
  uptime_seconds: number;
  models_loaded: number;
  available_targets: string[];
}

class MLService {
  private api = axios.create({
    baseURL: ML_BASE_URL,
    timeout: 15000,
  });

  constructor() {
    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`ML API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('ML API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`ML API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('ML API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Get ML model information
  async getModelInfo(): Promise<MLModelInfo> {
    try {
      const response = await this.api.get('/model_info');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ML model info:', error);
      throw error;
    }
  }

  // Get ML service health status
  async getHealthStatus(): Promise<MLHealthStatus> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch ML health status:', error);
      throw error;
    }
  }

  // Make a prediction
  async predict(target: string, data: any): Promise<MLPredictionResponse> {
    try {
      const response = await this.api.post(`/predict/${target}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to make prediction for ${target}:`, error);
      throw error;
    }
  }

  // Make batch predictions
  async predictBatch(predictions: Array<{ target: string; data: any }>): Promise<MLPredictionResponse[]> {
    try {
      const response = await this.api.post('/predict_batch', { predictions });
      return response.data;
    } catch (error) {
      console.error('Failed to make batch predictions:', error);
      throw error;
    }
  }

  // Predict wicket occurrence in next over
  async predictWicketOccurrence(matchData: any): Promise<MLPredictionResponse> {
    return this.predict('wicket_occurrence', matchData);
  }

  // Predict runs scored in next over
  async predictRunsPerOver(matchData: any): Promise<MLPredictionResponse> {
    return this.predict('runs_per_over', matchData);
  }

  // Predict boundary probability in next over
  async predictBoundaryProbability(matchData: any): Promise<MLPredictionResponse> {
    return this.predict('boundary_probability', matchData);
  }

  // Predict run rate change in next over
  async predictRunRateChange(matchData: any): Promise<MLPredictionResponse> {
    return this.predict('run_rate_change', matchData);
  }

  // Test ML service connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.get('/health');
      
      if (response.data && response.data.status === 'healthy') {
        return {
          success: true,
          message: 'ML service is healthy and ready'
        };
      } else {
        return {
          success: false,
          message: 'ML service is not healthy'
        };
      }
    } catch (error: any) {
      console.error('Failed to test ML service connection:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'ML service connection failed'
      };
    }
  }
}

export const mlService = new MLService();
