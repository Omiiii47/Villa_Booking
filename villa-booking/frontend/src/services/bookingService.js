import api from './api';

export const createBooking = async (bookingData) => {
  const { data } = await api.post('/bookings', bookingData);
  return data;
};

export const getUserBookings = async () => {
  const { data } = await api.get('/bookings');
  return data;
};

export const getBookingById = async (id) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
};

export const cancelBooking = async (id) => {
  const { data } = await api.put(`/bookings/${id}/cancel`);
  return data;
};
