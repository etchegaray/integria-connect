import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar, SidebarTrigger } from '@/components/AppSidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuthContext();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="lg:pl-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="h-full flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <SidebarTrigger onClick={() => setSidebarOpen(!sidebarOpen)} />
              <div>
                <p className="text-sm text-muted-foreground">Bienvenido/a,</p>
                <h1 className="text-lg font-semibold">{profile?.name || 'Usuario'}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
