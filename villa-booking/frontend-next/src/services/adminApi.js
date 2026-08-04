import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use((config) => {
  const admin = JSON.parse(localStorage.getItem('solscapeAdmin') || '{}');
  if (admin.token) {
    config.headers.Authorization = `Bearer ${admin.token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem('solscapeAdmin');
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
