// import { useLocation, Link } from 'react-router';
// import { useAuthStore } from '@/stores/authStore';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//     Home,
//     Settings,
//     LogOut,
//     ChevronsLeft,
//     ChevronsRight,
//     ListChecks,
//     Hospital,
// } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface SidebarProps {
//     isCollapsed: boolean;
//     setIsCollapsed: (collapsed: boolean) => void;
// }

// const navItems = [
//     { path: '/home', icon: Home, label: 'หน้าแรก' },
//     { path: '/task', icon: ListChecks, label: 'งาน' },
//     { path: '/clinic', icon: Hospital, label: 'คลินิก' },
//     // { path: '#', icon: FileText, label: 'เอกสาร' },
//     // { path: '#', icon: BarChart3, label: 'รายงาน' },
//     { path: '#', icon: Settings, label: 'ตั้งค่า' },
// ];

// export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
//     const { user, logout } = useAuthStore();
//     const location = useLocation();

//     if (!user) return null;

//     const isActive = (path: string) => {
//         if (path === '/dashboard') {
//             return location.pathname === path;
//         }
//         return location.pathname.startsWith(path);
//     };

//     return (
//         <aside
//             className={cn(
//                 'fixed left-0 top-16 bottom-0 border-r bg-white transition-all duration-300 z-20 hidden lg:flex flex-col',
//                 isCollapsed ? 'w-16' : 'w-64'
//             )}
//         >
//             {/* Toggle Button - Floating Style */}
//             <div className="relative">
//                 <button
//                     onClick={() => setIsCollapsed(!isCollapsed)}
//                     className={cn(
//                         'absolute -right-3 top-6 z-30',
//                         'h-6 w-6 rounded-full',
//                         'bg-gradient-to-br from-purple-500 to-purple-600',
//                         'border-2 border-white',
//                         'shadow-lg hover:shadow-xl',
//                         'flex items-center justify-center',
//                         'transition-all duration-300',
//                         'hover:scale-110 active:scale-95',
//                         'group'
//                     )}
//                 >
//                     {isCollapsed ? (
//                         <ChevronsRight className="h-3 w-3 text-white group-hover:translate-x-0.5 transition-transform" />
//                     ) : (
//                         <ChevronsLeft className="h-3 w-3 text-white group-hover:-translate-x-0.5 transition-transform" />
//                     )}
//                 </button>
//             </div>

//             {/* Navigation */}
//             <nav className="flex-1 overflow-y-auto p-2 pt-8">
//                 <ul className="space-y-1">
//                     {navItems.map((item) => {
//                         const Icon = item.icon;
//                         const active = isActive(item.path);

//                         return (
//                             <li key={item.path}>
//                                 <Link
//                                     to={item.path}
//                                     className={cn(
//                                         'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
//                                         isCollapsed && 'justify-center px-2',
//                                         active
//                                             ? 'bg-purple-50 text-purple-700'
//                                             : 'text-gray-700 hover:bg-gray-100'
//                                     )}
//                                     title={isCollapsed ? item.label : undefined}
//                                 >
//                                     <Icon
//                                         className={cn(
//                                             'h-5 w-5 flex-shrink-0',
//                                             active ? 'text-purple-600' : 'text-gray-500'
//                                         )}
//                                     />
//                                     {!isCollapsed && <span>{item.label}</span>}
//                                 </Link>
//                             </li>
//                         );
//                     })}
//                 </ul>
//             </nav>

//             {/* Footer: User Info & Logout */}
//             <div className="border-t p-2">
//                 {/* {!isCollapsed && (
//                     <div className="flex items-center gap-2 px-3 py-2 mb-2">
//                         <Avatar className="h-8 w-8">
//                             <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
//                             <AvatarFallback className="bg-purple-100 text-purple-700">
//                                 {user.username?.charAt(0) || 'U'}
//                             </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium truncate">{user.nickname}</p>
//                             <p className="text-xs text-gray-500 truncate">{user.position}</p>
//                         </div>
//                     </div>
//                 )} */}

//                 <Button
//                     variant="ghost"
//                     className={cn(
//                         'w-full text-red-600 hover:text-red-700 hover:bg-red-50',
//                         isCollapsed ? 'justify-center px-0' : 'justify-start'
//                     )}
//                     onClick={logout}
//                 >
//                     <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
//                     {!isCollapsed && 'ออกจากระบบ'}
//                 </Button>
//             </div>
//         </aside>
//     );
// }

// src/components/layout/Sidebar.tsx

import { useLocation, Link } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

const navItems = [
    { path: '/home', icon: Home, label: 'หน้าแรก' },
    { path: '/task', icon: ListChecks, label: 'งาน' },
    { path: '/todo', icon: ClipboardList, label: 'งานประจำวัน' },
    { path: '/clinic', icon: Hospital, label: 'คลินิก' },
    { path: '#', icon: Settings, label: 'ตั้งค่า' },
];

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const { user: authUser, logout } = useAuthStore();
    const { user } = useUserStore();
    const location = useLocation();

    if (!authUser) return null;

    const isActive = (path: string) => {
        if (path === '/home') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path) && path !== '#';
    };

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

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

                        return (
                            <li key={item.path + item.label}>
                                <Link
                                    to={item.path}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isCollapsed && 'justify-center px-2',
                                        active
                                            ? 'bg-purple-50 text-purple-700'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon
                                        className={cn(
                                            'h-5 w-5 flex-shrink-0',
                                            active ? 'text-purple-600' : 'text-gray-500'
                                        )}
                                    />
                                    {!isCollapsed && <span>{item.label}</span>}
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