import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { Layout } from './layouts/Layout';

export function ProtectedRoute() {
  const { user } = useAuthStore();
  return user ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
}