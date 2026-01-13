export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'done';

export interface TodoClinic {
  id: string;
  name: {
    en: string;
    th: string;
  };
}

export interface Todo {
  id: string;
  name: string;
  description?: string;
  priority: TodoPriority;
  status: TodoStatus;
  clinic: TodoClinic;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
}

export interface CreateTodoPayload {
  name: string;
  description?: string;
  clinicId: string;
  priority: TodoPriority;
}

export interface UpdateTodoPayload {
  name?: string;
  description?: string;
  clinicId?: string;
  priority?: TodoPriority;
  status?: TodoStatus;
}

export interface TodoListParams {
  status?: TodoStatus;
  priority?: TodoPriority;
  clinicId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TeamTodoParams {
  status?: TodoStatus;
  priority?: TodoPriority;
  clinicId?: string;
  userId?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export interface TodoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TodoListResponse {
  status: string;
  results: number;
  pagination: TodoPagination;
  data: {
    todos: Todo[];
  };
}

export interface TodoStatsResponse {
  status: string;
  data: {
    stats: TodoStats;
  };
}