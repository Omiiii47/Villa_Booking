import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const salesApi = axios.create({ baseURL: API_URL });

salesApi.interceptors.request.use((config) => {
  try {
    const sales = JSON.parse(localStorage.getItem('solscapeSales') || '{}');
    if (sales.token) {
      config.headers.Authorization = `Bearer ${sales.token}`;
    }
  } catch {
    localStorage.removeItem('solscapeSales');
  }
  return config;
});

salesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem('solscapeSales');
      window.location.href = '/sales';
    }
    return Promise.reject(error);
  }
);

export default salesApi;