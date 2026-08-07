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

export const approveBooking = async (id, payload) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}/approve`, payload);
  return data;
};

export const rejectBooking = async (id, payload) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}/reject`, payload);
  return data;
};

export const confirmPayment = async (id, payload = {}) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}/confirm-payment`, payload);
  return data;
};

export const cancelBooking = async (id, payload = {}) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}/cancel`, payload);
  return data;
};

export const completeBooking = async (id, payload = {}) => {
  const { data } = await salesApi.put(`/sales/bookings/${id}/complete`, payload);
  return data;
};

export const createCustomBooking = async (payload) => {
  const { data } = await salesApi.post('/sales/bookings', payload);
  return data;
};

export const getDashboardStats = async () => {
  const { data } = await salesApi.get('/sales/stats');
  return data;
};

export const getNotifications = async () => {
  const { data } = await salesApi.get('/sales/notifications');
  return data;
};

export const markNotificationsRead = async (payload = { all: true }) => {
  const { data } = await salesApi.put('/sales/notifications/read', payload);
  return data;
};

export const createPaymentLink = async (id, payload = {}) => {
  const { data } = await salesApi.post(`/sales/bookings/${id}/payment-link`, payload);
  return data;
};

export const getPaymentDetails = async (id) => {
  const { data } = await salesApi.get(`/sales/bookings/${id}/payment-details`);
  return data;
};

export const getPaymentHistory = async (id) => {
  const { data } = await salesApi.get(`/sales/bookings/${id}/payment-history`);
  return data;
};

export const clearPaymentLink = async (id) => {
  const { data } = await salesApi.delete(`/sales/bookings/${id}/payment-link`);
  return data;
};