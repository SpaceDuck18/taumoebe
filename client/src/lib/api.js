import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('taumoeba_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('taumoeba_token');
      localStorage.removeItem('taumoeba_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// ── Batch API ─────────────────────────────────────────────
export const batchAPI = {
  create: (formData) =>
    api.post('/batches', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => api.get('/batches'),
  getById: (batchId) => api.get(`/batches/${batchId}`),
  getReport: (batchId) => api.get(`/batches/${batchId}/report`),
  getReportPDF: (batchId) =>
    api.get(`/batches/${batchId}/report?format=pdf`, { responseType: 'blob' }),
  getStats: () => api.get('/batches/stats'),
};

export default api;
