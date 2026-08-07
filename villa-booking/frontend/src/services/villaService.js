import api from './api';

export const getVillas = async (params = {}) => {
  const { data } = await api.get('/villas', { params });
  return data;
};

export const getFeaturedVillas = async () => {
  const { data } = await api.get('/villas/featured');
  return data;
};

export const getVillaBySlug = async (slug) => {
  const { data } = await api.get(`/villas/slug/${slug}`);
  return data;
};

export const getVillaById = async (id) => {
  const { data } = await api.get(`/villas/${id}`);
  return data;
};

export const getVillaAvailability = async (id, days = 60) => {
  const { data } = await api.get(`/villas/${id}/availability`, { params: { days } });
  return data;
};
