import { apiFetch } from './client';

export interface ApiUser {
  id: string;
  role: 'student' | 'admin';
  name: string;
  email: string;
  student_id: string | null;
  college: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: ApiUser;
}

export const studentRegister = (data: {
  name: string;
  email: string;
  password: string;
  student_id: string;
  college?: string;
}) => apiFetch<{ message: string }>('/api/auth/student/register', { method: 'POST', body: JSON.stringify(data) });

export const studentLogin = (email: string, password: string) =>
  apiFetch<TokenResponse>('/api/auth/student/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const adminLogin = (email: string, password: string) =>
  apiFetch<TokenResponse>('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const fetchMe = () => apiFetch<ApiUser>('/api/auth/me');

export const logoutApi = () => apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
