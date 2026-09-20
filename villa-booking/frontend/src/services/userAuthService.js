import userApi from './userApi';

export const loginUser = async (email, password) => {
  const { data } = await userApi.post('/auth/login', { email, password });
  localStorage.setItem('solscapeUser', JSON.stringify(data));
  return data;
};

export const registerUser = async (name, username, email, phone, password) => {
  const { data } = await userApi.post('/auth/register', { name, username, email, phone, password });
  localStorage.setItem('solscapeUser', JSON.stringify(data));
  return data;
};

export const getProfile = async () => {
  const { data } = await userApi.get('/auth/profile');
  return data;
};

export const updateProfile = async (userData) => {
  const { data } = await userApi.put('/auth/profile', userData);
  localStorage.setItem('solscapeUser', JSON.stringify(data));
  return data;
};

export const toggleWishlist = async (villaId) => {
  const { data } = await userApi.post(`/auth/wishlist/${villaId}`);
  return data;
};

export const getWishlist = async () => {
  const { data } = await userApi.get('/auth/wishlist');
  return data;
};

export const logout = () => {
  localStorage.removeItem('solscapeUser');
};

export const verifyEmail = async (token) => {
  const { data } = await userApi.post('/auth/verify-email', { token });
  return data;
};

export const resendVerification = async (email) => {
  const { data } = await userApi.post('/auth/resend-verification', { email });
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await userApi.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await userApi.post('/auth/reset-password', { token, password });
  return data;
};
