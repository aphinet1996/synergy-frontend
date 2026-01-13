import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileSidebar } from '@/components/shared/MobileSidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isPublic?: boolean; // ถ้า true = public mode (no sidebar)
}

export function Layout({ children, isPublic = false }: LayoutProps) {
  const { user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const showSidebar = !isPublic && !!user; // Show sidebar เฉพาะ protected

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu */}
      {showSidebar && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden absolute top-4 left-4 z-50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileSidebar onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {showSidebar && <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />}

      {/* Main Area: Navbar + Content */}
      <div className={`flex flex-col flex-1 overflow-hidden ${showSidebar && !isCollapsed ? 'lg:ml-64' : showSidebar ? 'lg:ml-16' : ''}`}>
        {/* Navbar */}
        <Navbar isPublic={isPublic} />

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 mt-14 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}