// API Client for QB Pharma Frontend
// This provides a centralized HTTP client for all API calls

import API_CONFIG, { buildApiUrl, buildCustomApiUrl } from '../config/api';

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Types for API requests
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
    pharmaUnitId?: string;
  };
}

// HTTP Client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    
    // Load token from localStorage if available
    this.token = localStorage.getItem('qb_pharma_token');
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('qb_pharma_token', token);
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
    localStorage.removeItem('qb_pharma_token');
  }

  // Build headers for requests
  private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      ...API_CONFIG.headers,
      ...customHeaders
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: this.buildHeaders(options.headers as Record<string, string>),
        signal: AbortSignal.timeout(API_CONFIG.timeout)
      });

      // Parse JSON response
      let data;
      try {
        data = await response.json();
      } catch {
        // If response is not JSON, create a generic response
        data = { success: response.ok, message: response.statusText };
      }

      // Handle HTTP errors
      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}: ${response.statusText}`,
          data: data
        };
      }

      return {
        success: true,
        data: data,
        message: data.message
      };
    } catch (error) {
      console.error('API Request failed:', error);
      
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: false,
        error: 'Unknown network error occurred'
      };
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : buildCustomApiUrl(endpoint);
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : buildCustomApiUrl(endpoint);
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : buildCustomApiUrl(endpoint);
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : buildCustomApiUrl(endpoint);
    return this.request<T>(url, { method: 'DELETE' });
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/api/auth/login', credentials);
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    this.clearToken();
    // Optionally call logout endpoint
    await this.post('/api/auth/logout');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }

  // User methods
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.get('/api/users');
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.post('/api/users', userData);
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api/users/${id}`);
  }

  // Transaction methods
  async getTransactions(filters?: any): Promise<ApiResponse<any[]>> {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `/api/transactions?${queryParams}` : '/api/transactions';
    return this.get(endpoint);
  }

  async createTransaction(transactionData: any): Promise<ApiResponse<any>> {
    return this.post('/api/transactions', transactionData);
  }

  async updateTransaction(id: string, transactionData: any): Promise<ApiResponse<any>> {
    return this.put(`/api/transactions/${id}`, transactionData);
  }

  async deleteTransaction(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api/transactions/${id}`);
  }

  // Stakeholder methods
  async getDoctors(): Promise<ApiResponse<any[]>> {
    return this.get('/api/doctors');
  }

  async getBusinessPartners(): Promise<ApiResponse<any[]>> {
    return this.get('/api/business-partners');
  }

  async getDistributors(): Promise<ApiResponse<any[]>> {
    return this.get('/api/distributors');
  }

  async getEmployees(): Promise<ApiResponse<any[]>> {
    return this.get('/api/employees');
  }

  async getPatients(): Promise<ApiResponse<any[]>> {
    return this.get('/api/patients');
  }

  // Generic stakeholder CRUD
  async createStakeholder(type: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/api/${type}`, data);
  }

  async updateStakeholder(type: string, id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/api/${type}/${id}`, data);
  }

  async deleteStakeholder(type: string, id: string): Promise<ApiResponse<any>> {
    return this.delete(`/api/${type}/${id}`);
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };