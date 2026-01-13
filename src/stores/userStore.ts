// src/stores/userStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '@/types/user';
import { userService } from '@/services/userService';

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
        (set) => ({
            user: null,
            loading: false,
            error: null,

            // Fetch current user
            fetchUser: async () => {
                set({ loading: true, error: null });
                const response = await userService.getMe();

                if (response.success && response.data) {
                    set({ user: response.data.user, loading: false });
                } else {
                    set({ error: response.error || 'Failed to fetch user', loading: false });
                }
            },

            // Logout: Clear user
            logout: () => set({ user: null, error: null }),

            // Clear error
            clearError: () => set({ error: null }),
        }),
        { name: 'UserStore' }
    )
);

// Selectors
export const selectUser = (state: UserState) => state.user;
export const selectLoading = (state: UserState) => state.loading;
export const selectError = (state: UserState) => state.error;