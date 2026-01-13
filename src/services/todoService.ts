import { useAuthStore } from '@/stores/authStore';
import type {
  Todo,
  TodoStats,
  CreateTodoPayload,
  UpdateTodoPayload,
  TodoListParams,
  TeamTodoParams,
  TodoPagination,
} from '@/types/todo';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper: Get access token
const getAccessToken = (): string | null => {
  return useAuthStore.getState().tokens?.accessToken || null;
};

// Helper: Build query string
const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// GET /todo - List user's todos
export const getTodos = async (
  params: TodoListParams = {}
): Promise<ApiResponse<{ todos: Todo[]; pagination: TodoPagination }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const queryString = buildQueryString(params);
    const url = `${API_BASE}/todo${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch todos: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch todos' };
    }

    return {
      success: true,
      data: {
        todos: data.data.todos,
        pagination: data.pagination,
      },
    };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /todo/team - List team todos (admin/manager only)
export const getTeamTodos = async (
  params: TeamTodoParams = {}
): Promise<ApiResponse<{ todos: Todo[]; pagination: TodoPagination }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const queryString = buildQueryString(params);
    const url = `${API_BASE}/todo/team${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch team todos: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch team todos' };
    }

    return {
      success: true,
      data: {
        todos: data.data.todos,
        pagination: data.pagination,
      },
    };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /todo/:id - Get single todo
export const getTodoById = async (id: string): Promise<ApiResponse<{ todo: Todo }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/todo/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch todo: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch todo' };
    }

    return { success: true, data: { todo: data.data.todo } };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// GET /todo/stats/today - Get today's stats
export const getTodayStats = async (): Promise<ApiResponse<{ stats: TodoStats }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/todo/stats/today`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch stats: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: 'Failed to fetch stats' };
    }

    return { success: true, data: { stats: data.data.stats } };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// POST /todo - Create todo
export const createTodo = async (
  payload: CreateTodoPayload
): Promise<ApiResponse<{ id: string; name: string }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/todo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: `Failed to create todo: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: data.message || 'Failed to create todo' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// PUT /todo/:id - Update todo
export const updateTodo = async (
  id: string,
  payload: UpdateTodoPayload
): Promise<ApiResponse<{ id: string; name: string }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/todo/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { success: false, error: `Failed to update todo: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: data.message || 'Failed to update todo' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// PATCH /todo/:id/toggle - Toggle todo status
export const toggleTodo = async (id: string): Promise<ApiResponse<{ todo: Todo }>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/todo/${id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to toggle todo: ${response.statusText}` };
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return { success: false, error: data.message || 'Failed to toggle todo' };
    }

    return { success: true, data: { todo: data.data.todo } };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

// DELETE /todo/:id - Delete todo
export const deleteTodo = async (id: string): Promise<ApiResponse<null>> => {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: 'No access token available' };
  }

  try {
    const response = await fetch(`${API_BASE}/todo/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: `Failed to delete todo: ${response.statusText}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
};

export const todoService = {
  getTodos,
  getTeamTodos,
  getTodoById,
  getTodayStats,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
};