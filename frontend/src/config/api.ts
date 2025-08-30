// API Configuration for QB Pharma Frontend
// This file configures the API base URL for different environments

const API_CONFIG = {
  // For development and production on the same server
  baseURL: 'http://localhost:3001',
  
  // API endpoints
  endpoints: {
    auth: '/api/auth',
    users: '/api/users',
    transactions: '/api/transactions',
    stakeholders: '/api/stakeholders',
    doctors: '/api/doctors',
    businessPartners: '/api/business-partners',
    distributors: '/api/distributors',
    employees: '/api/employees',
    patients: '/api/patients',
    departments: '/api/departments',
    settlements: '/api/settlements',
    health: '/health'
  },
  
  // Request timeout (30 seconds)
  timeout: 30000,
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: keyof typeof API_CONFIG.endpoints): string => {
  return `${API_CONFIG.baseURL}${API_CONFIG.endpoints[endpoint]}`;
};

// Helper function to build custom API URLs
export const buildCustomApiUrl = (path: string): string => {
  return `${API_CONFIG.baseURL}${path}`;
};

export default API_CONFIG;