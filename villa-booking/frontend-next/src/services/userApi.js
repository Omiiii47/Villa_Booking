import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const userApi = axios.create({ baseURL: API_URL });

userApi.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('solscapeUser') || '{}');
  if (user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem('solscapeUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default userApi;
