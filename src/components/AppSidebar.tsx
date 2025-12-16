import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Users, 
  Calendar, 
  Settings, 
  GraduationCap,
  ClipboardList,
  UserCog,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Home, roles: ['socio', 'monitor', 'professor', 'gestor'] },
  { label: 'Cursos', href: '/courses', icon: BookOpen, roles: ['socio', 'monitor', 'professor', 'gestor'] },
  { label: 'Mis Inscripciones', href: '/enrollments', icon: GraduationCap, roles: ['socio'] },
  { label: 'Entrevistas', href: '/interviews', icon: ClipboardList, roles: ['monitor', 'socio'] },
  { label: 'Mis Estudiantes', href: '/students', icon: Users, roles: ['professor', 'monitor'] },
  { label: 'Calendario', href: '/calendar', icon: Calendar, roles: ['monitor', 'professor', 'gestor'] },
  { label: 'Gestión Usuarios', href: '/users', icon: UserCog, roles: ['gestor'] },
  { label: 'Configuración', href: '/settings', icon: Settings, roles: ['gestor'] },
];

const roleLabels: Record<UserRole, string> = {
  socio: 'Socio',
  monitor: 'Monitor',
  professor: 'Profesor',
  gestor: 'Gestor',
};

const roleColors: Record<UserRole, string> = {
  socio: 'bg-role-socio',
  monitor: 'bg-role-monitor',
  professor: 'bg-role-professor',
  gestor: 'bg-role-gestor',
};

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { user, switchRole } = useUser();

  const filteredNavItems = navigationItems.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out",
          "w-[280px] flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">IA</span>
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">IntegrIA Pro</span>
          </Link>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            
            {/* Role Switcher (Demo) */}
            <Select value={user.role} onValueChange={(value: UserRole) => switchRole(value)}>
              <SelectTrigger className="w-full h-9 text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", roleColors[user.role])} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(roleLabels) as UserRole[]).map(role => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", roleColors[role])} />
                      {roleLabels[role]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024) onToggle();
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            IntegrIA Pro v1.0
          </p>
        </div>
      </aside>
    </>
  );
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="lg:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  );
}
