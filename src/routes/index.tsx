import { createBrowserRouter, RouterProvider } from 'react-router';
import { Login } from '@/pages/Login';

import Home from '@/pages/Home';
import Clinic from '@/pages/clinic/Clinic';
import ClinicDetail from '@/pages/clinic/ClinicDetail';
import Task from '@/pages/Task';
import Todo from '@/pages/Todo';
import Profile from '@/pages/Profile';
import Leave from '@/pages/Leave';
import Notifications from '@/pages/Notification';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import ClinicManagement from '@/pages/admin/ClinicManagement';
import RolesManagement from '@/pages/admin/RolesManagement';
import ActivityLogs from '@/pages/admin/ActivityLogs';
import SystemSettings from '@/pages/admin/SystemSettings';
import TeamTodoReport from '@/pages/admin/TeamTodoReport';
import LeaveManagement from '@/admin/pages/LeaveManagement';
import UserManagement from '@/admin/pages/UserManagement';

// External Leads pages
import LeadsManagement from '@/admin/pages/leads/LeadsManagement';
import PatientManagement from '@/admin/pages/leads/PatientManagement';
import ClinicUsersManagement from '@/admin/pages/leads/ClinicManagement';
import LeadsStats from '@/admin/pages/leads/StatsManagement';
import CommissionManagement from '@/admin/pages/leads/CommissionManagement';
import CommissionManagement2 from '@/admin/pages/leads/CommissionManagement2';

// Loading component
// const PageLoader = () => (
//     <div className="flex items-center justify-center min-h-[400px]">
//         <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
//     </div>
// );

// Wrap component with Suspense
// const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType<unknown>>) => (
//     <Suspense fallback={<PageLoader />}>
//         <Component />
//     </Suspense>
// );

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
            { path: '/profile', element: <Profile /> },
            { path: '/leave', element: <Leave /> },
            { path: '/notifications', element: <Notifications /> },
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
            { index: true, element: <AdminDashboard /> },
            { path: 'users', element: <UserManagement /> },
            { path: 'clinics', element: <ClinicManagement /> },
            { path: 'roles', element: <RolesManagement /> },
            { path: 'logs', element: <ActivityLogs /> },
            { path: 'settings', element: <SystemSettings /> },
            { path: 'todo-report', element: <TeamTodoReport /> },
            { path: 'leave', element: <LeaveManagement /> },

            // External Leads Management
            { path: 'leads/lists', element: <LeadsManagement /> },
            { path: 'leads/patients', element: <PatientManagement /> },
            { path: 'leads/stats', element: <LeadsStats /> },
            { path: 'leads/clinics', element: <ClinicUsersManagement /> },
            { path: 'leads/commissions1', element: <CommissionManagement /> },
            { path: 'leads/commissions2', element: <CommissionManagement2 /> },
        ],
    },
]);

export function AppRoutes() {
    return <RouterProvider router={router} />;
}