import api from './api';

export const getLanding = async () => {
  const { data } = await api.get('/cms/landing');
  return data;
};
