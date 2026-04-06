import { useLocation, Link } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useUser } from '@/hooks/useUser';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Home,
    Settings,
    LogOut,
    ChevronsLeft,
    ChevronsRight,
    ListChecks,
    Hospital,
    Shield,
    ClipboardList,
    CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const { user: authUser, logout } = useAuthStore();
    const { user } = useUser();
    const location = useLocation();
    
    // 🔔 ดึง pending counts จาก store
    const pendingCounts = useNotificationStore((state) => state.pendingCounts);

    if (!authUser) return null;

    const isActive = (path: string) => {
        if (path === '/home') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path) && path !== '#';
    };

    // Check if user is admin or manager
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const canApprove = isAdmin || isManager;

    // Nav items with pending counts
    const navItems = [
        { path: '/home', icon: Home, label: 'หน้าแรก' },
        { path: '/task', icon: ListChecks, label: 'งาน', pendingCount: pendingCounts.task },
        { path: '/todo', icon: ClipboardList, label: 'งานประจำวัน' },
        { path: '/clinic', icon: Hospital, label: 'คลินิก', pendingCount: pendingCounts.clinic },
        { 
            path: '/leave', 
            icon: CalendarDays, 
            label: 'ลางาน', 
            // แสดง pending count เฉพาะ manager/admin
            pendingCount: canApprove ? pendingCounts.leave : undefined,
            pendingLabel: 'รออนุมัติ',
        },
        { path: '#', icon: Settings, label: 'ตั้งค่า' },
    ];

    return (
        <aside
            className={cn(
                'fixed left-0 top-16 bottom-0 border-r bg-white transition-all duration-300 z-20 hidden lg:flex flex-col',
                isCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Toggle Button - Floating Style */}
            <div className="relative">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        'absolute -right-3 top-6 z-30',
                        'h-6 w-6 rounded-full',
                        'bg-gradient-to-br from-purple-500 to-purple-600',
                        'border-2 border-white',
                        'shadow-lg hover:shadow-xl',
                        'flex items-center justify-center',
                        'transition-all duration-300',
                        'hover:scale-110 active:scale-95',
                        'group'
                    )}
                >
                    {isCollapsed ? (
                        <ChevronsRight className="h-3 w-3 text-white group-hover:translate-x-0.5 transition-transform" />
                    ) : (
                        <ChevronsLeft className="h-3 w-3 text-white group-hover:-translate-x-0.5 transition-transform" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2 pt-8">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        // const showBadge = item.pendingCount && item.pendingCount > 0;
                        const showBadge = (item.pendingCount ?? 0) > 0;

                        return (
                            <li key={item.path + item.label}>
                                <Link
                                    to={item.path}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                                        isCollapsed && 'justify-center px-2',
                                        active
                                            ? 'bg-purple-50 text-purple-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                    title={isCollapsed ? `${item.label}${showBadge ? ` (${item.pendingCount} ${item.pendingLabel || 'รายการ'})` : ''}` : undefined}
                                >
                                    <div className="relative">
                                        <Icon
                                            className={cn(
                                                'h-5 w-5 flex-shrink-0',
                                                active ? 'text-purple-600' : 'text-gray-500'
                                            )}
                                        />
                                        {/* Badge for collapsed state */}
                                        {isCollapsed && showBadge && (
                                            <Badge 
                                                className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px] bg-red-500 hover:bg-red-500 border-2 border-white"
                                            >
                                                {item.pendingCount! > 99 ? '99+' : item.pendingCount}
                                            </Badge>
                                        )}
                                    </div>
                                    {!isCollapsed && (
                                        <>
                                            <span className="flex-1">{item.label}</span>
                                            {/* Badge for expanded state */}
                                            {showBadge && (
                                                <Badge 
                                                    variant="secondary"
                                                    className={cn(
                                                        'h-5 min-w-[20px] px-1.5 text-xs',
                                                        'bg-red-100 text-red-600 hover:bg-red-100'
                                                    )}
                                                >
                                                    {item.pendingCount! > 99 ? '99+' : item.pendingCount}
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </Link>
                            </li>
                        );
                    })}

                    {/* Admin Link - Only for admin users */}
                    {isAdmin && (
                        <li className="pt-4 mt-4 border-t">
                            <Link
                                to="/admin"
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    isCollapsed && 'justify-center px-2',
                                    location.pathname.startsWith('/admin')
                                        ? 'bg-red-50 text-red-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                                title={isCollapsed ? 'Admin Panel' : undefined}
                            >
                                <Shield
                                    className={cn(
                                        'h-5 w-5 flex-shrink-0',
                                        location.pathname.startsWith('/admin')
                                            ? 'text-red-600'
                                            : 'text-gray-500'
                                    )}
                                />
                                {!isCollapsed && <span>Admin Panel</span>}
                            </Link>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Footer: Logout */}
            <div className="border-t p-2">
                <Button
                    variant="ghost"
                    className={cn(
                        'w-full text-red-600 hover:text-red-700 hover:bg-red-50',
                        isCollapsed ? 'justify-center px-0' : 'justify-start'
                    )}
                    onClick={logout}
                >
                    <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                    {!isCollapsed && 'ออกจากระบบ'}
                </Button>
            </div>
        </aside>
    );
}