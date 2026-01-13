// import { Link, useNavigate } from 'react-router';
// import { useAuthStore } from '@/stores/authStore';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
// import { MobileSidebar } from './MobileSidebar';
// import { useState } from 'react';

// interface NavbarProps {
//     isPublic?: boolean;
// }

// export function Navbar({ isPublic = false }: NavbarProps) {
//     const { user, logout } = useAuthStore();
//     const navigate = useNavigate();
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//     const handleLogout = () => {
//         logout();
//         navigate('/login');
//     };

//     // Public Navbar
//     if (isPublic || !user) {
//         return (
//             <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
//                 <div className="flex items-center justify-between h-full px-4 lg:px-6">
//                     {/* Logo */}
//                     <Link to="/" className="flex items-center gap-2">
//                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
//                             <span className="text-white font-bold text-lg">L</span>
//                         </div>
//                         <span className="font-semibold text-xl hidden sm:block">Logo</span>
//                     </Link>

//                     {/* Desktop Menu */}
//                     <nav className="hidden md:flex space-x-6">
//                         <Link
//                             to="/how-it-works"
//                             className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
//                         >
//                             วิธีการใช้งาน
//                         </Link>
//                         <Link
//                             to="/pricing"
//                             className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
//                         >
//                             ราคา
//                         </Link>
//                     </nav>

//                     {/* Auth Buttons */}
//                     <div className="flex items-center gap-2">
//                         <Button variant="outline" asChild size="sm">
//                             <Link to="/login">เข้าสู่ระบบ</Link>
//                         </Button>
//                         <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
//                             <Link to="/register">สมัครสมาชิก</Link>
//                         </Button>
//                     </div>
//                 </div>
//             </header>
//         );
//     }

//     // Protected Navbar
//     return (
//         <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
//             <div className="flex items-center justify-between h-full px-4 lg:px-6">
//                 {/* Left: Mobile Menu + Logo */}
//                 <div className="flex items-center gap-4">
//                     {/* Mobile Menu Button */}
//                     <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
//                         <SheetTrigger asChild>
//                             <Button variant="ghost" size="icon" className="lg:hidden">
//                                 <Menu className="h-5 w-5" />
//                             </Button>
//                         </SheetTrigger>
//                         <SheetContent side="left" className="w-64 p-0">
//                             <MobileSidebar onClose={() => setMobileMenuOpen(false)} />
//                         </SheetContent>
//                     </Sheet>

//                     {/* Logo */}
//                     <Link to="/home" className="flex items-center gap-2">
//                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
//                             <span className="text-white font-bold text-lg">L</span>
//                         </div>
//                         <span className="font-semibold text-xl hidden sm:block">Logo</span>
//                     </Link>
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Notification */}
//                     <Button variant="ghost" size="icon" className="relative">
//                         <Bell className="h-5 w-5" />
//                         <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
//                     </Button>

//                     {/* Profile */}
//                     <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
//                                 <Avatar className="h-10 w-10 ring-2 ring-purple-500">
//                                     {/* <AvatarImage
//                                         src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
//                                         alt={user.username}
//                                     /> */}
//                                     <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
//                                         {user.username.charAt(0) || 'U'}
//                                     </AvatarFallback>
//                                 </Avatar>
//                             </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end" className="w-56">
//                             <DropdownMenuLabel>
//                                 <div className="flex flex-col space-y-1">
//                                     <p className="text-sm font-medium">{user.username}</p>
//                                     <p className="text-xs text-gray-500">{user.position}</p>
//                                 </div>
//                             </DropdownMenuLabel>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem onClick={() => navigate('/profile')}>
//                                 <User className="mr-2 h-4 w-4" />
//                                 โปรไฟล์
//                             </DropdownMenuItem>
//                             <DropdownMenuItem onClick={() => navigate('/settings')}>
//                                 <Settings className="mr-2 h-4 w-4" />
//                                 ตั้งค่า
//                             </DropdownMenuItem>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem onClick={handleLogout} className="text-red-600">
//                                 <LogOut className="mr-2 h-4 w-4" />
//                                 ออกจากระบบ
//                             </DropdownMenuItem>
//                         </DropdownMenuContent>
//                     </DropdownMenu>
//                 </div>
//             </div>
//         </header>
//     );
// }

// 2
// import { Link, useNavigate } from 'react-router';
// import { useAuthStore } from '@/stores/authStore';
// import { Button } from '@/components/ui/button';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
// import { MobileSidebar } from './MobileSidebar';
// import { useState } from 'react';

// interface NavbarProps {
//     isPublic?: boolean;
// }

// export function Navbar({ isPublic = false }: NavbarProps) {
//     const { user, logout } = useAuthStore();
//     const navigate = useNavigate();
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//     const handleLogout = () => {
//         logout();
//         navigate('/login');
//     };

//     // Public Navbar
//     if (isPublic || !user) {
//         return (
//             <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
//                 <div className="flex items-center justify-between h-full px-4 lg:px-6">
//                     {/* Logo */}
//                     <Link to="/" className="flex items-center">
//                         <img
//                             src="/synergy-navbar.svg"
//                             alt="Synergy"
//                             className="h-10 w-auto"
//                         />
//                     </Link>

//                     {/* Desktop Menu */}
//                     <nav className="hidden md:flex space-x-6">
//                         <Link
//                             to="/how-it-works"
//                             className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
//                         >
//                             วิธีการใช้งาน
//                         </Link>
//                         <Link
//                             to="/pricing"
//                             className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
//                         >
//                             ราคา
//                         </Link>
//                     </nav>

//                     {/* Auth Buttons */}
//                     <div className="flex items-center gap-2">
//                         <Button variant="outline" asChild size="sm">
//                             <Link to="/login">เข้าสู่ระบบ</Link>
//                         </Button>
//                         <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
//                             <Link to="/register">สมัครสมาชิก</Link>
//                         </Button>
//                     </div>
//                 </div>
//             </header>
//         );
//     }

//     // Protected Navbar
//     return (
//         <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
//             <div className="flex items-center justify-between h-full px-4 lg:px-6">
//                 {/* Left: Mobile Menu + Logo */}
//                 <div className="flex items-center gap-4">
//                     {/* Mobile Menu Button */}
//                     <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
//                         <SheetTrigger asChild>
//                             <Button variant="ghost" size="icon" className="lg:hidden">
//                                 <Menu className="h-5 w-5" />
//                             </Button>
//                         </SheetTrigger>
//                         <SheetContent side="left" className="w-64 p-0">
//                             <MobileSidebar onClose={() => setMobileMenuOpen(false)} />
//                         </SheetContent>
//                     </Sheet>

//                     {/* Logo */}
//                     <Link to="/home" className="flex items-center">
//                         <img
//                             src="/synergy-navbar.svg"
//                             alt="Synergy"
//                             className="h-10 w-auto"
//                         />
//                     </Link>
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Notification */}
//                     <Button variant="ghost" size="icon" className="relative">
//                         <Bell className="h-5 w-5" />
//                         <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
//                     </Button>

//                     {/* Profile */}
//                     <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
//                                 <Avatar className="h-10 w-10 ring-2 ring-purple-500">
//                                     <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
//                                         {user.username.charAt(0) || 'U'}
//                                     </AvatarFallback>
//                                 </Avatar>
//                             </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end" className="w-56">
//                             <DropdownMenuLabel>
//                                 <div className="flex flex-col space-y-1">
//                                     <p className="text-sm font-medium">{user.username}</p>
//                                     <p className="text-xs text-gray-500">{user.position}</p>
//                                 </div>
//                             </DropdownMenuLabel>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem onClick={() => navigate('/profile')}>
//                                 <User className="mr-2 h-4 w-4" />
//                                 โปรไฟล์
//                             </DropdownMenuItem>
//                             <DropdownMenuItem onClick={() => navigate('/settings')}>
//                                 <Settings className="mr-2 h-4 w-4" />
//                                 ตั้งค่า
//                             </DropdownMenuItem>
//                             <DropdownMenuSeparator />
//                             <DropdownMenuItem onClick={handleLogout} className="text-red-600">
//                                 <LogOut className="mr-2 h-4 w-4" />
//                                 ออกจากระบบ
//                             </DropdownMenuItem>
//                         </DropdownMenuContent>
//                     </DropdownMenu>
//                 </div>
//             </div>
//         </header>
//     );
// }

// src/components/layout/Navbar.tsx

import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Settings, LogOut, User, Menu, Shield } from 'lucide-react';
import { MobileSidebar } from './MobileSidebar';
import { useState } from 'react';

interface NavbarProps {
    isPublic?: boolean;
}

export function Navbar({ isPublic = false }: NavbarProps) {
    const { user: authUser, logout } = useAuthStore();
    const { user } = useUserStore();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Check if user is admin
    const isAdmin = user?.role === 'admin';

    // Public Navbar
    if (isPublic || !authUser) {
        return (
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
                <div className="flex items-center justify-between h-full px-4 lg:px-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <img
                            src="/synergy-navbar.svg"
                            alt="Synergy"
                            className="h-10 w-auto"
                        />
                    </Link>

                    {/* Desktop Menu */}
                    <nav className="hidden md:flex space-x-6">
                        <Link
                            to="/how-it-works"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            วิธีการใช้งาน
                        </Link>
                        <Link
                            to="/pricing"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ราคา
                        </Link>
                    </nav>

                    {/* Auth Buttons */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild size="sm">
                            <Link to="/login">เข้าสู่ระบบ</Link>
                        </Button>
                        <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Link to="/register">สมัครสมาชิก</Link>
                        </Button>
                    </div>
                </div>
            </header>
        );
    }

    // Protected Navbar
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left: Mobile Menu + Logo */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <MobileSidebar onClose={() => setMobileMenuOpen(false)} />
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link to="/home" className="flex items-center">
                        <img
                            src="/synergy-navbar.svg"
                            alt="Synergy"
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    {/* Admin Quick Access Button (Desktop) */}
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => navigate('/admin')}
                        >
                            <Shield className="h-4 w-4" />
                            Admin
                        </Button>
                    )}

                    {/* Notification */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    </Button>

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10 ring-2 ring-purple-500">
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                                        {authUser.username.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">{authUser.username}</p>
                                        {isAdmin && (
                                            <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                                Admin
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{user?.position || 'ผู้ใช้งาน'}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate('/profile')}>
                                <User className="mr-2 h-4 w-4" />
                                โปรไฟล์
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                ตั้งค่า
                            </DropdownMenuItem>

                            {/* Admin Panel Link - Only for admin */}
                            {isAdmin && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/admin')} className="text-red-600">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin Panel
                                    </DropdownMenuItem>
                                </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                ออกจากระบบ
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}