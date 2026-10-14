import api from './api';

export const submitContact = async (payload) => {
  const { data } = await api.post('/contact', payload);
  return data;
};
