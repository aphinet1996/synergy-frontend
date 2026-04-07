import type {
  User,
  UserListItem,
  UserSummary,
  UserListParams,
  // UserMeResponse,
  UserListResponse,
  // UserDetailResponse,
  CreateUserDTO,
  UpdateUserDTO,
} from '@/types/user';
import { useAuthStore } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/synergy/api';

// Helper: Get access token
const getAccessToken = (): string | null => {
  return useAuthStore.getState().tokens?.accessToken || null;
};

// Generic API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generic fetch helper
const apiFetch = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `Request failed: ${response.statusText}`,
      };
    }

    // Handle successful response (any 2xx: 200, 201, 204, etc.)
    const text = await response.text();
    if (!text) {
      return { success: true };
    }
    const data = JSON.parse(text);
    if (data.status === 'success') {
      return { success: true, data: data.data || data };
    }
    return { success: false, error: data.message || 'Request failed' };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /user/me - Fetch current user
export const getMe = async (): Promise<ApiResponse<{ user: User }>> => {
  return apiFetch<{ user: User }>(`${API_BASE}/user/me`);
};

// GET /user - Fetch all users (admin/manager)
export const getUsers = async (
  params?: UserListParams
): Promise<
  ApiResponse<{
    users: UserListItem[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>
> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.positionId) queryParams.append('positionId', params.positionId);
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
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
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.message || `Failed to fetch users: ${response.statusText}`,
      };
    }

    const data: UserListResponse = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch users' };
    }

    return {
      success: true,
      data: {
        users: data.data.users,
        pagination: data.pagination,
      },
    };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /user/:id - Fetch single user
export const getUserById = async (
  id: string
): Promise<ApiResponse<{ user: User }>> => {
  return apiFetch<{ user: User }>(`${API_BASE}/user/${id}`);
};

// POST /user - Create new user (admin/manager)
export const createUser = async (
  dto: CreateUserDTO
): Promise<ApiResponse<{ user: User }>> => {
  return apiFetch<{ user: User }>(`${API_BASE}/user`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
};

// PUT /user/:id - Update user
export const updateUser = async (
  id: string,
  dto: UpdateUserDTO
): Promise<ApiResponse<{ user: User }>> => {
  return apiFetch<{ user: User }>(`${API_BASE}/user/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
};

// DELETE /user/:id - Soft delete user (admin only)
export const deleteUser = async (
  id: string
): Promise<ApiResponse<void>> => {
  return apiFetch<void>(`${API_BASE}/user/${id}`, {
    method: 'DELETE',
  });
};

// Convert UserListItem[] to UserSummary[] for dropdowns
export const getAllUserSummaries = async (
  params?: UserListParams
): Promise<ApiResponse<{ users: UserSummary[] }>> => {
  const result = await getUsers({
    ...params,
    limit: params?.limit || 50,
  });

  if (!result.success || !result.data) {
    return { success: false, error: result.error };
  }

  const users: UserSummary[] = result.data.users.map((user) => ({
    id: user.id,
    name: `${user.firstname} ${user.lastname}`.trim() || user.nickname || user.username,
    role: user.role,
    position: user.position?.name || '',
    isActive: user.isActive,
  }));

  return { success: true, data: { users } };
};

// Get active users only
export const getActiveUsers = async (): Promise<
  ApiResponse<{ users: UserSummary[] }>
> => {
  return getAllUserSummaries({ isActive: true });
};

export const userService = {
  getMe,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUserSummaries,
  getActiveUsers,
};