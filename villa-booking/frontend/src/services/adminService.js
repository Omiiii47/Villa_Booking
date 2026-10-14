import adminApi from './adminApi';

export const getVillas = async (params = {}) => {
  const { data } = await adminApi.get('/villas', { params });
  return data;
};

export const createVilla = async (villaData) => {
  const { data } = await adminApi.post('/villas', villaData);
  return data;
};

export const updateVilla = async (id, villaData) => {
  const { data } = await adminApi.put(`/villas/${id}`, villaData);
  return data;
};

export const deleteVilla = async (id) => {
  const { data } = await adminApi.delete(`/villas/${id}`);
  return data;
};

export const uploadImages = async (formData) => {
  const { data } = await adminApi.post('/villas/upload-images', formData);
  return data;
};

export const getSalesTeam = async (params = {}) => {
  const { data } = await adminApi.get('/admin/sales-team', { params });
  return data;
};

export const createSalesTeam = async (memberData) => {
  const { data } = await adminApi.post('/admin/sales-team', memberData);
  return data;
};

export const deleteSalesTeam = async (id) => {
  const { data } = await adminApi.delete(`/admin/sales-team/${id}`);
  return data;
};

export const getContactMessages = async (params = {}) => {
  const { data } = await adminApi.get('/admin/contacts', { params });
  return data;
};

export const markContactMessageRead = async (id) => {
  const { data } = await adminApi.put(`/admin/contacts/${id}/read`);
  return data;
};

export const deleteContactMessage = async (id) => {
  const { data } = await adminApi.delete(`/admin/contacts/${id}`);
  return data;
};

export const getUsers = async (params = {}) => {
  const { data } = await adminApi.get('/users', { params });
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await adminApi.delete(`/users/${id}`);
  return data;
};

export const getCmsLanding = async () => {
  const { data } = await adminApi.get('/admin/cms');
  return data;
};

export const updateCmsLanding = async (payload) => {
  const { data } = await adminApi.put('/admin/cms', payload);
  return data;
};

export const uploadCmsImage = async (file) => {
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await adminApi.post('/admin/cms/upload', fd);
  return data;
};

export const deleteCmsImage = async (publicId) => {
  const { data } = await adminApi.delete('/admin/cms/image', { data: { publicId } });
  return data;
};
