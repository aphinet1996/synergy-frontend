// import { useState } from 'react';
// import { Link, useLocation, Outlet } from 'react-router';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from '@/components/ui/collapsible';
// import {
//   LayoutDashboard,
//   Users,
//   Building2,
//   Settings,
//   Shield,
//   FileText,
//   Bell,
//   ChevronLeft,
//   ChevronRight,
//   ChevronDown,
//   LogOut,
//   User,
//   Menu,
//   X,
//   CalendarCheck,
//   TrendingUp,
// } from 'lucide-react';
// import { useUserStore } from '@/stores/userStore';
// import { useAuthStore } from '@/stores/authStore';

// // ==================== Types ====================

// interface NavItemChild {
//   title: string;
//   href: string;
// }

// interface NavItemBase {
//   title: string;
//   icon: React.ReactNode;
//   badge?: number;
// }

// interface NavItemLink extends NavItemBase {
//   href: string;
//   children?: never;
// }

// interface NavItemGroup extends NavItemBase {
//   href?: never;
//   children: NavItemChild[];
// }

// type NavItem = NavItemLink | NavItemGroup;

// // ==================== Navigation Config ====================

// const navItems: NavItem[] = [
//   {
//     title: 'ภาพรวม',
//     href: '/admin',
//     icon: <LayoutDashboard className="h-5 w-5" />,
//   },
//   {
//     title: 'จัดการผู้ใช้',
//     href: '/admin/users',
//     icon: <Users className="h-5 w-5" />,
//   },
//   {
//     title: 'จัดการคลินิก',
//     href: '/admin/clinics',
//     icon: <Building2 className="h-5 w-5" />,
//   },
//   // {
//   //   title: 'สิทธิ์และบทบาท',
//   //   href: '/admin/roles',
//   //   icon: <Shield className="h-5 w-5" />,
//   // },
//   {
//     title: 'ประวัติการใช้งาน',
//     href: '/admin/logs',
//     icon: <FileText className="h-5 w-5" />,
//   },
//   {
//     title: 'งานประจำวัน',
//     href: '/admin/todo-report',
//     icon: <CalendarCheck className="h-5 w-5" />,
//   },
//   {
//     title: 'จัดการวันลา',
//     href: '/admin/leave',
//     icon: <CalendarCheck className="h-5 w-5" />,
//   },
//   // {
//   //   title: 'ตั้งค่าระบบ',
//   //   href: '/admin/settings',
//   //   icon: <Settings className="h-5 w-5" />,
//   // },
//   // External Leads Management (nested)
//   {
//     title: 'Leads',
//     icon: <TrendingUp className="h-5 w-5" />,
//     children: [
//       { title: 'สถิติ', href: '/admin/leads/stats' },
//       { title: 'รายการ', href: '/admin/leads/lists' },
//       { title: 'จัดการคนไข้', href: '/admin/leads/patients' },
//       { title: 'จัดการคลินิก', href: '/admin/leads/clinics' },
//       { title: 'จัดการคอมมิชชัน 1', href: '/admin/leads/commissions1' },
//       { title: 'จัดการคอมมิชชัน 2', href: '/admin/leads/commissions2' },
//     ],
//   },
// ];

// // ==================== Component ====================

// export function AdminLayout() {
//   const [collapsed, setCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [openGroups, setOpenGroups] = useState<string[]>(['Leads Management']); // Default open
//   const location = useLocation();
//   const { user } = useUserStore();
//   const { logout } = useAuthStore();

//   const isActive = (href: string) => {
//     if (href === '/admin') {
//       return location.pathname === '/admin';
//     }
//     return location.pathname.startsWith(href);
//   };

//   const isGroupActive = (children: NavItemChild[]) => {
//     return children.some((child) => isActive(child.href));
//   };

//   const toggleGroup = (title: string) => {
//     setOpenGroups((prev) =>
//       prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
//     );
//   };

//   const handleLogout = () => {
//     logout();
//     window.location.href = '/login';
//   };

//   // Get current page title
//   const getCurrentTitle = (): string => {
//     for (const item of navItems) {
//       if ('href' in item && item.href && isActive(item.href)) {
//         return item.title;
//       }
//       if ('children' in item && item.children) {
//         const activeChild = item.children.find((child) => isActive(child.href));
//         if (activeChild) {
//           return `${item.title} - ${activeChild.title}`;
//         }
//       }
//     }
//     return 'Admin';
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Mobile Header */}
//       <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4">
//         <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
//           <Menu className="h-6 w-6" />
//         </Button>
//         <div className="flex-1 flex items-center justify-center">
//           <span className="font-bold text-purple-600">Admin Panel</span>
//         </div>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" size="icon">
//               <Avatar className="h-8 w-8">
//                 <AvatarImage src={user?.profile || ''} />
//                 <AvatarFallback>{user?.firstname?.[0] || 'A'}</AvatarFallback>
//               </Avatar>
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuLabel>
//               {user?.firstname} {user?.lastname}
//             </DropdownMenuLabel>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem asChild>
//               <Link to="/home">กลับหน้าหลัก</Link>
//             </DropdownMenuItem>
//             <DropdownMenuItem onClick={handleLogout} className="text-red-600">
//               <LogOut className="h-4 w-4 mr-2" />
//               ออกจากระบบ
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </header>

//       {/* Mobile Sidebar Overlay */}
//       {mobileOpen && (
//         <div
//           className="lg:hidden fixed inset-0 bg-black/50 z-50"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={cn(
//           'fixed top-0 left-0 h-full bg-white border-r z-50 transition-all duration-300 flex flex-col',
//           collapsed ? 'w-20' : 'w-64',
//           'lg:translate-x-0',
//           mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
//         )}
//       >
//         {/* Logo */}
//         <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0">
//           {!collapsed && (
//             <Link to="/admin" className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
//                 <Shield className="h-5 w-5 text-white" />
//               </div>
//               <span className="font-bold text-gray-900">Admin Panel</span>
//             </Link>
//           )}
//           {collapsed && (
//             <div className="w-full flex justify-center">
//               <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
//                 <Shield className="h-5 w-5 text-white" />
//               </div>
//             </div>
//           )}
//           <Button
//             variant="ghost"
//             size="icon"
//             className="lg:hidden"
//             onClick={() => setMobileOpen(false)}
//           >
//             <X className="h-5 w-5" />
//           </Button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//           {navItems.map((item) => {
//             // Nested navigation (with children)
//             if ('children' in item && item.children) {
//               const groupActive = isGroupActive(item.children);
//               const isOpen = openGroups.includes(item.title);

//               if (collapsed) {
//                 // Collapsed: show dropdown on hover
//                 return (
//                   <DropdownMenu key={item.title}>
//                     <DropdownMenuTrigger asChild>
//                       <button
//                         className={cn(
//                           'flex items-center justify-center w-full px-2 py-2.5 rounded-lg transition-colors',
//                           groupActive
//                             ? 'bg-purple-100 text-purple-700'
//                             : 'text-gray-600 hover:bg-gray-100'
//                         )}
//                       >
//                         {item.icon}
//                       </button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent side="right" align="start">
//                       <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
//                       <DropdownMenuSeparator />
//                       {item.children.map((child) => (
//                         <DropdownMenuItem key={child.href} asChild>
//                           <Link
//                             to={child.href}
//                             onClick={() => setMobileOpen(false)}
//                             className={cn(isActive(child.href) && 'bg-purple-50 text-purple-700')}
//                           >
//                             {child.title}
//                           </Link>
//                         </DropdownMenuItem>
//                       ))}
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 );
//               }

//               // Expanded: show collapsible
//               return (
//                 <Collapsible
//                   key={item.title}
//                   open={isOpen}
//                   onOpenChange={() => toggleGroup(item.title)}
//                 >
//                   <CollapsibleTrigger asChild>
//                     <button
//                       className={cn(
//                         'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors',
//                         groupActive
//                           ? 'bg-purple-100 text-purple-700'
//                           : 'text-gray-600 hover:bg-gray-100'
//                       )}
//                     >
//                       {item.icon}
//                       <span className="font-medium flex-1 text-left">{item.title}</span>
//                       <ChevronDown
//                         className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
//                       />
//                     </button>
//                   </CollapsibleTrigger>
//                   <CollapsibleContent className="pl-8 mt-1 space-y-1">
//                     {item.children.map((child) => (
//                       <Link
//                         key={child.href}
//                         to={child.href}
//                         onClick={() => setMobileOpen(false)}
//                         className={cn(
//                           'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
//                           isActive(child.href)
//                             ? 'bg-purple-100 text-purple-700 font-medium'
//                             : 'text-gray-600 hover:bg-gray-100'
//                         )}
//                       >
//                         {child.title}
//                       </Link>
//                     ))}
//                   </CollapsibleContent>
//                 </Collapsible>
//               );
//             }

//             // Regular link navigation
//             return (
//               <Link
//                 key={item.href}
//                 to={item.href}
//                 onClick={() => setMobileOpen(false)}
//                 className={cn(
//                   'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
//                   isActive(item.href)
//                     ? 'bg-purple-100 text-purple-700'
//                     : 'text-gray-600 hover:bg-gray-100',
//                   collapsed && 'justify-center px-2'
//                 )}
//               >
//                 {item.icon}
//                 {!collapsed && <span className="font-medium">{item.title}</span>}
//                 {!collapsed && item.badge && (
//                   <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
//                     {item.badge}
//                   </span>
//                 )}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* User Info (Desktop) */}
//         {!collapsed && (
//           <div className="hidden lg:block p-4 border-t">
//             <div className="p-3 bg-gray-50 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <Avatar className="h-10 w-10">
//                   <AvatarImage src={user?.profile || ''} />
//                   <AvatarFallback>{user?.firstname?.[0] || 'A'}</AvatarFallback>
//                 </Avatar>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-medium text-sm truncate">
//                     {user?.firstname} {user?.lastname}
//                   </p>
//                   <p className="text-xs text-gray-500 truncate">{user?.role}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Collapse Button (Desktop only) */}
//         <div className="hidden lg:block p-4 border-t">
//           <Button
//             variant="ghost"
//             className="w-full justify-center"
//             onClick={() => setCollapsed(!collapsed)}
//           >
//             {collapsed ? (
//               <ChevronRight className="h-5 w-5" />
//             ) : (
//               <>
//                 <ChevronLeft className="h-5 w-5 mr-2" />
//                 <span>ย่อเมนู</span>
//               </>
//             )}
//           </Button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main
//         className={cn(
//           'transition-all duration-300 pt-16 lg:pt-0',
//           collapsed ? 'lg:ml-20' : 'lg:ml-64'
//         )}
//       >
//         {/* Desktop Header */}
//         <header className="hidden lg:flex h-16 bg-white border-b items-center justify-between px-6">
//           <div>
//             <h1 className="text-lg font-semibold text-gray-900">{getCurrentTitle()}</h1>
//           </div>
//           <div className="flex items-center gap-4">
//             <Button variant="ghost" size="icon" className="relative">
//               <Bell className="h-5 w-5" />
//               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
//             </Button>

//             <Link to="/home">
//               <Button variant="outline" size="sm">
//                 กลับหน้าหลัก
//               </Button>
//             </Link>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" className="flex items-center gap-2">
//                   <Avatar className="h-8 w-8">
//                     <AvatarImage src={user?.profile || ''} />
//                     <AvatarFallback>{user?.firstname?.[0] || 'A'}</AvatarFallback>
//                   </Avatar>
//                   <span className="font-medium">{user?.firstname}</span>
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48">
//                 <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem asChild>
//                   <Link to="/profile">
//                     <User className="h-4 w-4 mr-2" />
//                     โปรไฟล์
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem asChild>
//                   <Link to="/admin/settings">
//                     <Settings className="h-4 w-4 mr-2" />
//                     ตั้งค่า
//                   </Link>
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem onClick={handleLogout} className="text-red-600">
//                   <LogOut className="h-4 w-4 mr-2" />
//                   ออกจากระบบ
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </header>

//         {/* Page Content */}
//         <div className="p-6">
//           <Outlet />
//         </div>
//       </main>
//     </div>
//   );
// }

// export default AdminLayout;

import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Shield,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useAuthStore } from '@/stores/authStore';

interface NavItemChild {
  title: string;
  href: string;
}

interface NavItemBase {
  title: string;
  icon: React.ReactNode;
  badge?: number;
  disabled?: boolean;
}

interface NavItemLink extends NavItemBase {
  href: string;
  children?: never;
}

interface NavItemGroup extends NavItemBase {
  href?: never;
  children: NavItemChild[];
}

type NavItem = NavItemLink | NavItemGroup;

const navItems: NavItem[] = [
  {
    title: 'ภาพรวม',
    href: '/admin',
    icon: <LayoutDashboard className="h-5 w-5" />,
    disabled: true,
  },
  {
    title: 'จัดการผู้ใช้',
    href: '/admin/users',
    icon: <Users className="h-5 w-5" />,
    disabled: true,
  },
  {
    title: 'สิทธิ์และบทบาท',
    href: '/admin/roles',
    icon: <Shield className="h-5 w-5" />,
    disabled: true,
  },
  {
    title: 'จัดการคลินิก',
    href: '/admin/clinics',
    icon: <Building2 className="h-5 w-5" />,
    disabled: true,
  },
  {
    title: 'ประวัติการใช้งาน',
    href: '/admin/logs',
    icon: <FileText className="h-5 w-5" />,
    disabled: true,
  },
  {
    title: 'งานประจำวัน',
    href: '/admin/todo-report',
    icon: <CalendarCheck className="h-5 w-5" />,
    disabled: true,
  },
  {
    title: 'จัดการวันลา',
    href: '/admin/leave',
    icon: <CalendarCheck className="h-5 w-5" />,
    disabled: true,
  },
  // External Leads Management (nested)
  {
    title: 'Leads',
    icon: <TrendingUp className="h-5 w-5" />,
    children: [
      { title: 'สถิติ', href: '/admin/leads/stats' },
      { title: 'รายการ', href: '/admin/leads/lists' },
      { title: 'จัดการคนไข้', href: '/admin/leads/patients' },
      { title: 'จัดการคลินิก', href: '/admin/leads/clinics' },
      { title: 'จัดการคอมมิชชัน 1', href: '/admin/leads/commissions1' },
      { title: 'จัดการคอมมิชชัน 2', href: '/admin/leads/commissions2' },
    ],
  },
];

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useUserStore();
  const { logout } = useAuthStore();

  // Auto-open groups that contain the active route — persistent across refreshes
  const getActiveGroups = () =>
    navItems
      .filter((item): item is NavItemGroup => 'children' in item && !!item.children)
      .filter((item) => item.children.some((child) => location.pathname.startsWith(child.href)))
      .map((item) => item.title);

  const [openGroups, setOpenGroups] = useState<string[]>(() => getActiveGroups());

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const isGroupActive = (children: NavItemChild[]) => {
    return children.some((child) => isActive(child.href));
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Get current page title
  const getCurrentTitle = (): string => {
    for (const item of navItems) {
      if ('href' in item && item.href && isActive(item.href)) {
        return item.title;
      }
      if ('children' in item && item.children) {
        const activeChild = item.children.find((child) => isActive(child.href));
        if (activeChild) {
          return `${item.title} - ${activeChild.title}`;
        }
      }
    }
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex-1 flex items-center justify-center">
          <span className="font-bold text-purple-600">Admin Panel</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile || ''} />
                <AvatarFallback>{user?.firstname?.[0] || 'A'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.firstname} {user?.lastname}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/home">กลับหน้าหลัก</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r z-50 transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin Panel</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Nested navigation (with children)
            if ('children' in item && item.children) {
              const groupActive = isGroupActive(item.children);
              const isOpen = openGroups.includes(item.title);

              if (collapsed) {
                // Collapsed: show dropdown on hover
                return (
                  <DropdownMenu key={item.title}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center justify-center w-full px-2 py-2.5 rounded-lg transition-colors',
                          groupActive
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {item.icon}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link
                            to={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(isActive(child.href) && 'bg-purple-50 text-purple-700')}
                          >
                            {child.title}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              // Expanded: show collapsible
              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors',
                        groupActive
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {item.icon}
                      <span className="font-medium flex-1 text-left">{item.title}</span>
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                          isActive(child.href)
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            // Regular link navigation
            return (
              item.disabled ? (
                <div
                  key={item.title}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed opacity-40 select-none',
                    collapsed && 'justify-center px-2'
                  )}
                  title="เร็วๆ นี้"
                >
                  {item.icon}
                  {!collapsed && (
                    <>
                      <span className="font-medium text-gray-400">{item.title}</span>
                      <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 leading-tight">เร็วๆ นี้</span>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  key={item.title}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive(item.href)
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            );
          })}
        </nav>

        {/* User Info (Desktop) */}
        {!collapsed && (
          <div className="hidden lg:block p-4 border-t">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profile || ''} />
                  <AvatarFallback>{user?.firstname?.[0] || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user?.firstname} {user?.lastname}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Button (Desktop only) */}
        <div className="hidden lg:block p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span>ย่อเมนู</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300 pt-16 lg:pt-0',
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{getCurrentTitle()}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <Link to="/home">
              <Button variant="outline" size="sm">
                กลับหน้าหลัก
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile || ''} />
                    <AvatarFallback>{user?.firstname?.[0] || 'A'}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user?.firstname}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4 mr-2" />
                    โปรไฟล์
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    ตั้งค่า
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  ออกจากระบบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;