import api from './api';

export const loginUser = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('villaUser', JSON.stringify(data));
  return data;
};

export const registerUser = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  localStorage.setItem('villaUser', JSON.stringify(data));
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};

export const updateProfile = async (userData) => {
  const { data } = await api.put('/auth/profile', userData);
  localStorage.setItem('villaUser', JSON.stringify(data));
  return data;
};

export const toggleWishlist = async (villaId) => {
  const { data } = await api.post(`/auth/wishlist/${villaId}`);
  return data;
};

export const getWishlist = async () => {
  const { data } = await api.get('/auth/wishlist');
  return data;
};

export const logout = () => {
  localStorage.removeItem('villaUser');
};
