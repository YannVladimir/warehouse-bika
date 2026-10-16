import { api } from './api';

export const documentApi = {
  // Returns a PageResponse: { content, page, size, totalElements, totalPages }
  async getAll(page = 0, size = 20) {
    const { data } = await api.get('/documents', { params: { page, size } });
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  // Returns a PageResponse: { content, page, size, totalElements, totalPages }
  async search({ q, status, typeId, page = 0, size = 20 } = {}) {
    const params = { page, size };
    if (q) params.q = q;
    if (status && status !== 'All') params.status = status;
    if (typeId) params.typeId = typeId;
    const { data } = await api.get('/documents/search', { params });
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/documents', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/documents/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/documents/${id}`);
  },

  async updateStatus(id, status) {
    const { data } = await api.patch(`/documents/${id}/status`, { status });
    return data;
  },

  async updateLocation(id, boxLocationId) {
    const { data } = await api.patch(`/documents/${id}/location`, { boxLocationId });
    return data;
  },
};

export const documentTypeApi = {
  async getAll() {
    const { data } = await api.get('/document-types');
    return data;
  },

  async create(payload) {
    const { data } = await api.post('/document-types', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await api.put(`/document-types/${id}`, payload);
    return data;
  },

  async remove(id) {
    await api.delete(`/document-types/${id}`);
  },
};

export const dashboardApi = {
  async getStats() {
    const { data } = await api.get('/dashboard/stats');
    return data;
  },

  async getRecent() {
    const { data } = await api.get('/dashboard/recent');
    return data;
  },
};

export const searchHistoryApi = {
  async getRecent() {
    const { data } = await api.get('/search-history');
    return data;
  },

  // Admin report: every search made by anyone in the company. Returns a PageResponse.
  async getReport(page = 0, size = 20) {
    const { data } = await api.get('/search-history/report', { params: { page, size } });
    return data;
  },
};

export const auditLogApi = {
  // Admin report: full audit trail, optionally filtered by entityType. Returns a PageResponse.
  async getAll({ entityType, page = 0, size = 20 } = {}) {
    const params = { page, size };
    if (entityType) params.entityType = entityType;
    const { data } = await api.get('/audit-logs', { params });
    return data;
  },
};
