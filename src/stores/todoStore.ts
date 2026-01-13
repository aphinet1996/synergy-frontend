import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { todoService } from '@/services/todoService';
import type {
  Todo,
  TodoStats,
  TodoPagination,
  TodoListParams,
  TeamTodoParams,
  CreateTodoPayload,
  UpdateTodoPayload,
} from '@/types/todo';

interface TodoState {
  // User's todos
  todos: Todo[];
  pagination: TodoPagination | null;
  loading: boolean;
  error: string | null;

  // Team todos (for admin/manager)
  teamTodos: Todo[];
  teamPagination: TodoPagination | null;
  teamLoading: boolean;

  // Today's stats
  stats: TodoStats | null;
  statsLoading: boolean;

  // Actions
  fetchTodos: (params?: TodoListParams) => Promise<void>;
  fetchTeamTodos: (params?: TeamTodoParams) => Promise<void>;
  fetchStats: () => Promise<void>;
  createTodo: (payload: CreateTodoPayload) => Promise<boolean>;
  updateTodo: (id: string, payload: UpdateTodoPayload) => Promise<boolean>;
  toggleTodo: (id: string) => Promise<boolean>;
  deleteTodo: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useTodoStore = create<TodoState>()(
  devtools(
    (set, get) => ({
      // Initial state
      todos: [],
      pagination: null,
      loading: false,
      error: null,

      teamTodos: [],
      teamPagination: null,
      teamLoading: false,

      stats: null,
      statsLoading: false,

      // Fetch user's todos
      fetchTodos: async (params = {}) => {
        set({ loading: true, error: null });

        const response = await todoService.getTodos(params);

        if (response.success && response.data) {
          set({
            todos: response.data.todos,
            pagination: response.data.pagination,
            loading: false,
          });
        } else {
          set({ error: response.error || 'Failed to fetch todos', loading: false });
        }
      },

      // Fetch team todos (admin/manager)
      fetchTeamTodos: async (params = {}) => {
        set({ teamLoading: true, error: null });

        const response = await todoService.getTeamTodos(params);

        if (response.success && response.data) {
          set({
            teamTodos: response.data.todos,
            teamPagination: response.data.pagination,
            teamLoading: false,
          });
        } else {
          set({ error: response.error || 'Failed to fetch team todos', teamLoading: false });
        }
      },

      // Fetch today's stats
      fetchStats: async () => {
        set({ statsLoading: true });

        const response = await todoService.getTodayStats();

        if (response.success && response.data) {
          set({ stats: response.data.stats, statsLoading: false });
        } else {
          set({ statsLoading: false });
        }
      },

      // Create todo
      createTodo: async (payload) => {
        set({ error: null });

        const response = await todoService.createTodo(payload);

        if (response.success) {
          // Refresh todos and stats
          await Promise.all([get().fetchTodos(), get().fetchStats()]);
          return true;
        } else {
          set({ error: response.error || 'Failed to create todo' });
          return false;
        }
      },

      // Update todo
      updateTodo: async (id, payload) => {
        set({ error: null });

        const response = await todoService.updateTodo(id, payload);

        if (response.success) {
          // Refresh todos
          await get().fetchTodos();
          return true;
        } else {
          set({ error: response.error || 'Failed to update todo' });
          return false;
        }
      },

      // Toggle todo status
      toggleTodo: async (id) => {
        // Optimistic update
        const prevTodos = get().todos;
        set({
          todos: prevTodos.map((todo) =>
            todo.id === id
              ? { ...todo, status: todo.status === 'pending' ? 'done' : 'pending' }
              : todo
          ) as Todo[],
        });

        const response = await todoService.toggleTodo(id);

        if (response.success) {
          // Refresh stats
          await get().fetchStats();
          return true;
        } else {
          // Revert on failure
          set({ todos: prevTodos, error: response.error || 'Failed to toggle todo' });
          return false;
        }
      },

      // Delete todo
      deleteTodo: async (id) => {
        set({ error: null });

        const response = await todoService.deleteTodo(id);

        if (response.success) {
          // Remove from local state
          set({ todos: get().todos.filter((todo) => todo.id !== id) });
          // Refresh stats
          await get().fetchStats();
          return true;
        } else {
          set({ error: response.error || 'Failed to delete todo' });
          return false;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    { name: 'TodoStore' }
  )
);

// Selectors
export const selectTodos = (state: TodoState) => state.todos;
export const selectStats = (state: TodoState) => state.stats;
export const selectLoading = (state: TodoState) => state.loading;