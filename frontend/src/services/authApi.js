import { api, tokenStore } from './api';

export const authApi = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.accessToken);
    return data.user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenStore.clear();
    }
  },

  async refresh() {
    const { data } = await api.post('/auth/refresh');
    tokenStore.set(data.accessToken);
    return data.user;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data;
  },

  async updateProfile(fullName, email) {
    const { data } = await api.put('/auth/profile', { fullName, email });
    return data;
  },

  async changePassword(currentPassword, newPassword) {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async forgotPassword(email) {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  async exchangeHandoff(token) {
    const { data } = await api.post('/auth/handoff', { token });
    tokenStore.set(data.accessToken);
    return data;
  },
};
