import salesApi from './salesApi';

export const getBookings = async (params = {}) => {
  const { data } = await salesApi.get('/sales/bookings', { params });
  return data;
};

export const getBooking = async (id) => {
  const { data } = await salesApi.get(`/sales/bookings/${id}`);
  return data;
};

export const updateBooking = async (id, payload) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}`, payload);
  return data;
};

export const reviewBooking = async (id, payload) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}/review`, payload);
  return data;
};

export const createCustomBooking = async (payload) => {
  const { data } = await salesApi.post('/sales/bookings', payload);
  return data;
};