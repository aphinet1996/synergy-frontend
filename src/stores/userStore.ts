import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, UserListItem, UserListParams, CreateUserDTO, UpdateUserDTO } from '@/types/user';
import { userService } from '@/services/userService';

// Current User Store (for /me)

interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;

    fetchUser: () => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const useUserStore = create<UserState>()(
    devtools(
        (set, get) => ({
            user: null,
            loading: false,
            error: null,

            fetchUser: async () => {
                // Guard: ถ้ากำลัง fetch อยู่แล้ว ไม่ต้องเรียกซ้ำ
                // ป้องกัน multiple useUser instances (Layout, Navbar, etc.) เรียกพร้อมกัน
                if (get().loading) return;

                set({ loading: true, error: null });
                const response = await userService.getMe();

                if (response.success && response.data) {
                    set({ user: response.data.user, loading: false });
                } else {
                    set({ error: response.error || 'Failed to fetch user', loading: false });
                }
            },

            logout: () => set({ user: null, error: null }),

            clearError: () => set({ error: null }),
        }),
        { name: 'UserStore' }
    )
);

// Selectors
export const selectUser = (state: UserState) => state.user;
export const selectLoading = (state: UserState) => state.loading;
export const selectError = (state: UserState) => state.error;

// Admin User Management Store

interface UserManagementState {
    users: UserListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    } | null;
    selectedUser: User | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Fetch
    fetchUsers: (params?: UserListParams) => Promise<void>;
    fetchUserDetail: (id: string) => Promise<User | null>;

    // CRUD
    createUser: (dto: CreateUserDTO) => Promise<boolean>;
    updateUser: (id: string, dto: UpdateUserDTO) => Promise<boolean>;
    deleteUser: (id: string) => Promise<boolean>;

    // State management
    setSelectedUser: (user: User | null) => void;
    clearError: () => void;
}

export const useUserManagementStore = create<UserManagementState>()(
    devtools(
        (set, get) => ({
            users: [],
            pagination: null,
            selectedUser: null,
            isLoading: false,
            isSubmitting: false,
            error: null,

            fetchUsers: async (params?: UserListParams) => {
                set({ isLoading: true, error: null });
                const response = await userService.getUsers(params);

                if (response.success && response.data) {
                    set({
                        users: response.data.users,
                        pagination: response.data.pagination || null,
                        isLoading: false,
                    });
                } else {
                    set({
                        error: response.error || 'Failed to fetch users',
                        isLoading: false,
                    });
                }
            },

            fetchUserDetail: async (id: string) => {
                const response = await userService.getUserById(id);
                if (response.success && response.data) {
                    set({ selectedUser: response.data.user });
                    return response.data.user;
                }
                set({ error: response.error || 'Failed to fetch user detail' });
                return null;
            },

            createUser: async (dto: CreateUserDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await userService.createUser(dto);

                if (response.success) {
                    // Refresh user list
                    const { pagination } = get();
                    await get().fetchUsers({
                        page: pagination?.page || 1,
                        limit: pagination?.limit || 10,
                    });
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error || 'Failed to create user',
                    isSubmitting: false,
                });
                return false;
            },

            updateUser: async (id: string, dto: UpdateUserDTO) => {
                set({ isSubmitting: true, error: null });
                const response = await userService.updateUser(id, dto);

                if (response.success) {
                    // Refresh user list
                    const { pagination } = get();
                    await get().fetchUsers({
                        page: pagination?.page || 1,
                        limit: pagination?.limit || 10,
                    });
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error || 'Failed to update user',
                    isSubmitting: false,
                });
                return false;
            },

            deleteUser: async (id: string) => {
                set({ isSubmitting: true, error: null });
                const response = await userService.deleteUser(id);

                if (response.success) {
                    // Refresh user list
                    const { pagination } = get();
                    await get().fetchUsers({
                        page: pagination?.page || 1,
                        limit: pagination?.limit || 10,
                    });
                    set({ isSubmitting: false });
                    return true;
                }

                set({
                    error: response.error || 'Failed to delete user',
                    isSubmitting: false,
                });
                return false;
            },

            setSelectedUser: (user) => set({ selectedUser: user }),
            clearError: () => set({ error: null }),
        }),
        { name: 'UserManagementStore' }
    )
);