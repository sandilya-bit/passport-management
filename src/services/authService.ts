import { api, unwrap } from '@/api/client';
import { isMockMode, mockLogin, mockRegister, mockForgotPassword, mockResetPassword } from '@/api/mockApi';
import type { AuthSession } from '@/types';

export const authService = {
  async login(payload: { email: string; password: string }): Promise<AuthSession> {
    if (isMockMode) return mockLogin(payload);
    return unwrap(api.post<AuthSession>('/auth/login', payload));
  },
  async register(payload: { fullName: string; email: string; phone: string; password: string }): Promise<AuthSession> {
    if (isMockMode) return { accessToken: '', refreshToken: '', user: await mockRegister(payload) } as AuthSession;
    return unwrap(api.post<AuthSession>('/auth/register', payload));
  },
  async forgotPassword(email: string): Promise<string> {
    if (isMockMode) return mockForgotPassword(email).then((r) => r.message);
    return unwrap(api.post<{ message: string }>('/auth/forgot-password', { email })).then((r) => r.message);
  },
  async resetPassword(token: string, password: string): Promise<string> {
    if (isMockMode) return mockResetPassword(token, password).then((r) => r.message);
    return unwrap(api.post<{ message: string }>('/auth/reset-password', { token, password })).then((r) => r.message);
  },
  async refresh(refreshToken: string): Promise<AuthSession> {
    return unwrap(api.post<AuthSession>('/auth/refresh', { refreshToken }));
  },
  me(): Promise<AuthSession['user']> {
    return unwrap(api.get('/auth/me'));
  },
};
