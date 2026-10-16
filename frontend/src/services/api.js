import axios from 'axios';

// Access token lives in memory only (never localStorage) -- an XSS payload that can run JS
// can also just call the API directly, so this doesn't fully neutralize XSS, but it does mean
// the token isn't sitting in a place that persists across reloads or that other scripts can read
// off disk. The refresh token is a separate httpOnly cookie the browser holds, never exposed to JS.
let accessToken = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token) => { accessToken = token; },
  clear: () => { accessToken = null; },
};

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Queues concurrent 401s behind a single in-flight refresh instead of firing one refresh per
// failed request, then retries each original request once the new token is in hand.
let refreshPromise = null;

function isAuthEndpoint(url) {
  return typeof url === 'string' && url.startsWith('/auth/');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!response || response.status !== 401 || !config || config._retried || isAuthEndpoint(config.url)) {
      return Promise.reject(error);
    }

    config._retried = true;

    if (!refreshPromise) {
      refreshPromise = api.post('/auth/refresh')
        .then((res) => {
          tokenStore.set(res.data.accessToken);
          return res.data.accessToken;
        })
        .catch((refreshError) => {
          tokenStore.clear();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
