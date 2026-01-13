// import type { UserMeResponse, User } from '@/types/user';
// import { useAuthStore } from '@/stores/authStore';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// // Helper: Get access token from localStorage (จาก authStore persist)
// // const getAccessToken = (): string | null => {
// //     try {
// //         const authStorage = localStorage.getItem('auth-storage');
// //         if (authStorage) {
// //             const parsed = JSON.parse(authStorage);
// //             return parsed.state?.tokens?.accessToken || null;
// //         }
// //         return null;
// //     } catch {
// //         return null;
// //     }
// // };

// const getAccessToken = (): string | null => {
//     return useAuthStore.getState().tokens?.accessToken || null;
//   };


// interface ApiResponse<T> {
//     success: boolean;
//     data?: T;
//     error?: string;
// }

// // GET /synergy/api/user/me - Fetch current user
// export const getMe = async (): Promise<ApiResponse<UserMeResponse['data']>> => {
//     const token = getAccessToken();
//     if (!token) {
//         return { success: false, error: 'No access token available' };
//     }

//     const response = await fetch(`${API_BASE}/user/me`, {
//         method: 'GET',
//         headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${token}`,
//         },
//     });

//     if (!response.ok) {
//         return { success: false, error: `Failed to fetch user: ${response.statusText}` };
//     }

//     const data: UserMeResponse = await response.json();
//     if (data.status !== 'success') {
//         return { success: false, error: 'Failed to fetch user' };
//     }

//     // Parse dates จาก ISO strings
//     const user: User = {
//         ...data.data.user,
//         birthDate: new Date(data.data.user.birthDate),
//         contractDateStart: new Date(data.data.user.contractDateStart),
//         contractDateEnd: new Date(data.data.user.contractDateEnd),
//         employeeDateStart: new Date(data.data.user.employeeDateStart),
//         lastLogin: new Date(data.data.user.lastLogin),
//     };

//     return { success: true, data: { user } };
// };

// export const userService = {
//     getMe,
// };

// src/services/userService.ts

import type { User, UserSummary } from '@/types/user';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// Helper: Get access token
const getAccessToken = (): string | null => {
  return useAuthStore.getState().tokens?.accessToken || null;
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface UserMeResponse {
  status: 'success';
  data: {
    user: User;
  };
}

// Raw user from API (with _id)
interface RawUser {
  _id: string;
  username: string;
  profile?: string;
  firstname: string;
  lastname: string;
  nickname: string;
  position?: string;
  role: 'admin' | 'manager' | 'employee';
  isActive?: boolean;
}

interface UserListResponse {
  status: 'success';
  results: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: {
    users: RawUser[];
  };
}

// GET /synergy/api/user/me - Fetch current user
export const getMe = async (): Promise<ApiResponse<{ user: User }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch user: ${response.statusText}` };
    }

    const data: UserMeResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch user' };
    }

    // Parse dates from ISO strings
    const user: User = {
      ...data.data.user,
      birthDate: new Date(data.data.user.birthDate),
      contractDateStart: new Date(data.data.user.contractDateStart),
      contractDateEnd: new Date(data.data.user.contractDateEnd),
      employeeDateStart: new Date(data.data.user.employeeDateStart),
      lastLogin: new Date(data.data.user.lastLogin),
    };

    return { success: true, data: { user } };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /synergy/api/user - Fetch all users (for employee selection)
export const getAllUsers = async (params?: { 
  isActive?: boolean; 
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<{ users: UserSummary[] }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const queryParams = new URLSearchParams();
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
  if (params?.role) queryParams.append('role', params.role);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE}/user${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch users: ${response.statusText}` };
    }

    const data: UserListResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch users' };
    }

    // Convert to UserSummary (map _id to id)
    const users: UserSummary[] = data.data.users.map(user => ({
      id: user._id,
      name: `${user.firstname} ${user.lastname}`.trim() || user.nickname || user.username,
      role: user.role,
      position: user.position || '',
      isActive: user.isActive ?? true,
    }));

    return { success: true, data: { users } };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /synergy/api/user/active - Fetch active users only
export const getActiveUsers = async (): Promise<ApiResponse<{ users: UserSummary[] }>> => {
  return getAllUsers({ isActive: true, limit: 20 });
};

export const userService = {
  getMe,
  getAllUsers,
  getActiveUsers,
};