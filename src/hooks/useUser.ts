import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';

export function useUser() {
  const { user, loading, error, fetchUser, logout: clearUser } = useUserStore();
  const tokens = useAuthStore((state) => state.tokens);
  const prevTokenRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const currentToken = tokens?.accessToken;

    // ถ้าไม่มี token (logout แล้ว) → clear user
    if (!currentToken) {
      if (user) {
        // console.log('[useUser] No token, clearing user');
        clearUser();
      }
      prevTokenRef.current = undefined;
      isFetchingRef.current = false;
      return;
    }

    // ถ้า token เปลี่ยน (login ใหม่) → fetch user ใหม่
    if (currentToken !== prevTokenRef.current && !isFetchingRef.current) {
      // console.log('[useUser] Token changed, fetching new user');
      isFetchingRef.current = true;
      prevTokenRef.current = currentToken;
      
      fetchUser().finally(() => {
        isFetchingRef.current = false;
      });
    }
  }, [tokens?.accessToken, user, fetchUser, clearUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    isAuthenticated: !!user && !!tokens?.accessToken,
  };
}

export function useUserSummary() {
  const { user } = useUser();
  if (!user) return null;

  return {
    id: user.id,
    name: `${user.firstname} ${user.lastname}`,
    role: user.role,
    position: user.position,
    isActive: user.isActive,
  };
}