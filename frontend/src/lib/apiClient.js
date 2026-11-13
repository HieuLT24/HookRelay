import { API_URL } from '../config/env';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message ?? 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return payload;
}
