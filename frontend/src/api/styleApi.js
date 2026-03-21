import axios from 'axios';

const API = axios.create({ baseURL: 'https://styleguru-api.onrender.com' });

// Auto-attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('tonefit_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const getHistory = () => API.get('/auth/history');

// Analysis
export const analyzeImage = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    timeout: 30000,
  });
};

export const testTone = (tone) => API.get(`/api/test/${tone}`);

// Auth helpers
export const saveAuth = (data) => {
  localStorage.setItem('tonefit_token', data.access_token);
  localStorage.setItem('tonefit_user', JSON.stringify({ name: data.user_name, email: data.email }));
};

export const getUser = () => {
  const u = localStorage.getItem('tonefit_user');
  return u ? JSON.parse(u) : null;
};

export const logout = () => {
  localStorage.removeItem('tonefit_token');
  localStorage.removeItem('tonefit_user');
};

export const isLoggedIn = () => !!localStorage.getItem('tonefit_token');