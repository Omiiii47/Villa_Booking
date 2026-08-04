import api from './api';
import userApi from './userApi';

export const getVillaReviews = async (villaId) => {
  const { data } = await api.get(`/reviews/villa/${villaId}`);
  return data;
};

export const createReview = async (villaId, reviewData) => {
  const { data } = await userApi.post(`/reviews/villa/${villaId}`, reviewData);
  return data;
};
