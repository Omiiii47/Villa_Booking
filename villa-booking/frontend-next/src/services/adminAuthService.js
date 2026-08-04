import adminApi from './adminApi';

export const loginAdmin = async (email, password) => {
  const { data } = await adminApi.post('/admin-auth/login', { email, password });
  localStorage.setItem('solscapeAdmin', JSON.stringify(data));
  return data;
};

export const getAdminProfile = async () => {
  const { data } = await adminApi.get('/admin-auth/me');
  return data;
};

export const logout = () => {
  localStorage.removeItem('solscapeAdmin');
};
