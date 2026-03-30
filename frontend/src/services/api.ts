import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

type RetriableRequest = {
  _retry?: boolean;
  url?: string;
  headers?: Record<string, string>;
};

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок и обновления токена
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = (error.config || {}) as RetriableRequest;
    const status = error.response?.status;
    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint));

    // Если получили 401 и это не повторный запрос
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${access_token}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        // Если обновление токена не удалось, очищаем storage
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (status === 403) {
      return Promise.reject(new Error('Доступ запрещен для этого действия'));
    }

    return Promise.reject(error);
  }
);

export default api;
