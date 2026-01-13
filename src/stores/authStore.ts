import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, refreshToken } from '@/services/authService';
import { useUserStore } from '@/stores/userStore';
import type { User, Tokens } from '@/types/auth';

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // 1. เรียก login API
          const { user, tokens } = await login({ username, password });
          
          // 2. Set tokens ก่อน (สำคัญ!)
          set({ user, tokens, isLoading: false });
          
          // 3. หลังจาก tokens ถูก set แล้ว ค่อยเรียก fetchUser
          // เพื่อดึง full user data จาก /user/me
          await useUserStore.getState().fetchUser();
          
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      refresh: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }
        set({ isLoading: true, error: null });
        try {
          const { tokens: newTokens } = await refreshToken({ refreshToken: tokens.refreshToken });
          set({ tokens: newTokens, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
          // ถ้า refresh ล้มเหลว ให้ logout
          get().logout();
        }
      },

      logout: () => {
        // Clear user store ก่อน
        useUserStore.getState().logout();
        
        // Clear auth state
        set({ user: null, tokens: null, error: null });
      },
    }),
    { name: 'auth-storage' }
  )
);