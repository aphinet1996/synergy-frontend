// import { createBrowserRouter, RouterProvider } from 'react-router';
// import { Login } from '@/pages/Login';
// import Home from '@/pages/Home';
// import Clinic from '@/pages/clinic/Clinic';
// import ClinicDetail from '@/pages/clinic/ClinicDetail';
// import Task from '@/pages/Task'
// import Todo from '@/pages/Todo'
// import { ProtectedRoute } from '@/components/ProtectedRoute';

// export const router = createBrowserRouter([
//     { path: '/login', element: <Login /> },
//     {
//         path: '/',
//         element: <ProtectedRoute />,
//         children: [
//             { path: '/home', element: <Home /> },
//             { path: '/clinic', element: <Clinic /> },
//             { path: '/clinic/:id', element: <ClinicDetail /> },
//             { path: '/task', element: <Task /> },
//             { path: '/todo', element: <Todo /> },
//         ],
//     },

// ]);

// export function AppRoutes() {
//     return <RouterProvider router={router} />;
// }

// src/routes/index.tsx

import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Login } from '@/pages/Login';
import Home from '@/pages/Home';
import Clinic from '@/pages/clinic/Clinic';
import ClinicDetail from '@/pages/clinic/ClinicDetail';
import Task from '@/pages/Task';
import Todo from '@/pages/Todo';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Lazy load admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const ClinicManagement = lazy(() => import('@/pages/admin/ClinicManagement'));
const RolesManagement = lazy(() => import('@/pages/admin/RolesManagement'));
const ActivityLogs = lazy(() => import('@/pages/admin/ActivityLogs'));
const SystemSettings = lazy(() => import('@/pages/admin/SystemSettings'));

// Loading component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
);

// Wrap component with Suspense
const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<unknown>>) => (
    <Suspense fallback={<PageLoader />}>
        <Component />
    </Suspense>
);

export const router = createBrowserRouter([
    // Public Routes
    { path: '/login', element: <Login /> },

    // Main App Routes (Protected)
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            { path: '/home', element: <Home /> },
            { path: '/clinic', element: <Clinic /> },
            { path: '/clinic/:id', element: <ClinicDetail /> },
            { path: '/task', element: <Task /> },
            { path: '/todo', element: <Todo /> },
        ],
    },

    // Admin Routes (Protected + Admin Only)
    {
        path: '/admin',
        element: (
            <AdminGuard allowedRoles={['admin']}>
                <AdminLayout />
            </AdminGuard>
        ),
        children: [
            { index: true, element: withSuspense(AdminDashboard) },
            { path: 'users', element: withSuspense(UserManagement) },
            { path: 'clinics', element: withSuspense(ClinicManagement) },
            { path: 'roles', element: withSuspense(RolesManagement) },
            { path: 'logs', element: withSuspense(ActivityLogs) },
            { path: 'settings', element: withSuspense(SystemSettings) },
        ],
    },
]);

export function AppRoutes() {
    return <RouterProvider router={router} />;
}