import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/hooks/useUser';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'manager' | 'developer')[];
}

export function AdminGuard({ children, allowedRoles = ['admin'] }: AdminGuardProps) {
  const location = useLocation();
  const tokens = useAuthStore((state) => state.tokens);

  const { user, loading, isAuthenticated } = useUser();

  if (tokens?.accessToken && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has allowed role
  const hasPermission = allowedRoles.includes(user!.role as any);

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-500 mb-4">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminGuard;