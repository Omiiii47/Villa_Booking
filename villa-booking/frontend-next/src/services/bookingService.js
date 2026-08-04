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

export const cancelBooking = async (id) => {
  const { data } = await userApi.put(`/bookings/${id}/cancel`);
  return data;
};
