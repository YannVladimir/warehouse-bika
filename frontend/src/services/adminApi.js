import { api } from './api';

export const companyApi = {
  async getAll() {
    const { data } = await api.get('/companies');
    return data;
  },

  // Pulls fresh companies from the source DMS, then returns the updated list -- call this once
  // when the Companies management page loads rather than on every plain list fetch.
  async sync() {
    const { data } = await api.post('/companies/sync');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/companies', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/companies/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/companies/${id}`);
  },
};

export const warehouseApi = {
  async getAll() {
    const { data } = await api.get('/warehouses');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/warehouses', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/warehouses/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/warehouses/${id}`);
  },

  async getLocationTree(warehouseId) {
    const { data } = await api.get(`/warehouses/${warehouseId}/locations`);
    return data;
  },
};

export const locationApi = {
  async getById(id) {
    const { data } = await api.get(`/locations/${id}`);
    return data;
  },

  async getPath(id) {
    const { data } = await api.get(`/locations/${id}/path`);
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/locations', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/locations/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/locations/${id}`);
  },
};

export const userApi = {
  async getAll() {
    const { data } = await api.get('/users');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/users', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/users/${id}`);
  },

  async activate(id) {
    const { data } = await api.patch(`/users/${id}/activate`);
    return data;
  },

  async deactivate(id) {
    const { data } = await api.patch(`/users/${id}/deactivate`);
    return data;
  },
};
