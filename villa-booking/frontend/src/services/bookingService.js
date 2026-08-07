import userApi from './userApi';

export const createBooking = async (bookingData) => {
  const { data } = await userApi.post('/bookings', bookingData);
  return data;
};

export const getUserBookings = async () => {
  const { data } = await userApi.get('/bookings');
  return data;
};

export const getBookingById = async (id) => {
  const { data } = await userApi.get(`/bookings/${id}`);
  return data;
};

export const cancelBooking = async (id, reason = '') => {
  const { data } = await userApi.put(`/bookings/${id}/cancel`, { reason });
  return data;
};

export const getNotifications = async () => {
  const { data } = await userApi.get('/notifications');
  return data;
};

export const markNotificationsRead = async (payload = { all: true }) => {
  const { data } = await userApi.put('/notifications/read', payload);
  return data;
};

export const syncBookingPayment = async (id) => {
  const { data } = await userApi.post(`/payments/bookings/${id}/sync`);
  return data;
};