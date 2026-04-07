import { useEffect, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';

export function useUser() {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  const error = useUserStore((s) => s.error);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const clearUser = useUserStore((s) => s.logout);

  const accessToken = useAuthStore((s) => s.tokens?.accessToken);
  const prevTokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // กรณี logout หรือไม่มี token
    if (!accessToken) {
      if (prevTokenRef.current) {
        clearUser();
      }
      prevTokenRef.current = undefined;
      return;
    }

    // ป้องกันการ fetch ซ้ำถ้ามีข้อมูล user อยู่แล้ว และไม่ได้ loading
    if (user !== null && !loading) {
      prevTokenRef.current = accessToken;
      return;
    }

    // มี token ใหม่ หรือ token เปลี่ยน → fetch
    if (accessToken !== prevTokenRef.current) {
      prevTokenRef.current = accessToken;
      fetchUser();
    }

  }, [accessToken, user, loading, fetchUser, clearUser]);
  // ^ ใส่ deps ให้ครบเพื่อความปลอดภัย (Zustand selector เป็น stable)

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    isAuthenticated: !!user && !!accessToken,
  };
}

export function useUserSummary() {
  const { user } = useUser();
  if (!user) return null;

  return {
    id: user.id,
    name: `${user.firstname} ${user.lastname}`,
    role: user.role,
    position: user.position?.name || '',
    isActive: user.isActive,
  };
}