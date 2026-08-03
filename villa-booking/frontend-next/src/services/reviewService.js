import api from './api';

export const getVillaReviews = async (villaId) => {
  const { data } = await api.get(`/reviews/villa/${villaId}`);
  return data;
};

export const createReview = async (villaId, reviewData) => {
  const { data } = await api.post(`/reviews/villa/${villaId}`, reviewData);
  return data;
};
