import api from './api';
import { LoginCredentials, RegisterData, RegisterResponse, TokenResponse, User } from '@/types/auth';

export const authService = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/api/auth/register', data);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/auth/login', credentials);
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/api/auth/logout', { refresh_token: refreshToken });
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/api/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
