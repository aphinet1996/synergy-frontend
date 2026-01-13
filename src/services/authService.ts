import type { LoginPayload, RefreshPayload, LoginResponseData } from '@/types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const login = async (payload: LoginPayload): Promise<LoginResponseData> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Login failed');
  }

  return data.data;
};

export const refreshToken = async (payload: RefreshPayload): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Refresh failed');
  }

  // สมมติ response มี data.tokens (ถ้าไม่มี refreshToken ใหม่ สามารถปรับ return { accessToken: data.data.accessToken } ได้)
  return data.data;
};