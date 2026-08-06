import salesApi from './salesApi';

export const loginSales = async (email, password) => {
  const { data } = await salesApi.post('/sales/auth/login', { email, password });
  localStorage.setItem('solscapeSales', JSON.stringify(data));
  return data;
};

export const getSalesProfile = async () => {
  const { data } = await salesApi.get('/sales/auth/me');
  return data;
};

export const logout = () => {
  localStorage.removeItem('solscapeSales');
};