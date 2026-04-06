import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const apiHost = configuredApiUrl.replace(/\/api$/, '');
const API_BASE = apiHost ? `${apiHost}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🔴 API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      code: error.code
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Improve error message for network issues
    if (!error.response) {
      // Network error or no response
      error.message = `Network Error: ${error.message}. Check VITE_API_URL or backend availability.`;
    }
    
    return Promise.reject(error);
  }
);

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.post('/settings', data)
};

export const cronAPI = {
  start: () => api.post('/cron/start'),
  stop: () => api.post('/cron/stop'),
  status: () => api.get('/cron/status'),
  runNow: () => api.post('/cron/run-now')
};

export const logsAPI = {
  get: (limit = 100) => api.get('/logs', { params: { limit } }),
  clear: () => api.delete('/logs')
};

export const profileAPI = {
  get: () => api.get('/auth/profile'),
  update: (data) => api.put('/auth/profile', data)
};

export default api;
