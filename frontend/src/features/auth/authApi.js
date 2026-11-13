import { apiRequest } from '../../lib/apiClient';

export const register = (credentials) => apiRequest('/auth/register', { method: 'POST', body: credentials });
export const login = (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials });
export const getCurrentUser = (token) => apiRequest('/auth/me', { token });
