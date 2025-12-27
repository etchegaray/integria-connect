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
  UsersRound,
  Menu,
  LogOut
} from 'lucide-react';
import logoIrati from '@/assets/logo-irati.jpg';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppRole[];
}

const navigationItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: Home, roles: ['socio', 'monitor', 'professor', 'gestor'] },
  { label: 'Cursos', href: '/courses', icon: BookOpen, roles: ['socio', 'monitor', 'professor', 'gestor'] },
  { label: 'Mis Inscripciones', href: '/enrollments', icon: GraduationCap, roles: ['socio'] },
  { label: 'Entrevistas', href: '/interviews', icon: ClipboardList, roles: ['monitor', 'socio'] },
  { label: 'Mis Estudiantes', href: '/students', icon: Users, roles: ['professor', 'monitor'] },
  { label: 'Calendario', href: '/calendar', icon: Calendar, roles: ['monitor', 'professor', 'gestor'] },
  { label: 'Gestión Usuarios', href: '/users', icon: UserCog, roles: ['gestor'] },
  { label: 'Asignación Monitores', href: '/monitor-assignments', icon: UsersRound, roles: ['gestor'] },
  { label: 'Configuración', href: '/settings', icon: Settings, roles: ['gestor'] },
];

const roleLabels: Record<AppRole, string> = {
  socio: 'Socio',
  monitor: 'Monitor',
  professor: 'Profesor',
  gestor: 'Gestor',
};

const roleColors: Record<AppRole, string> = {
  socio: 'bg-blue-500',
  monitor: 'bg-green-500',
  professor: 'bg-purple-500',
  gestor: 'bg-orange-500',
};

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AppSidebar({ isOpen, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { profile, role, signOut, loading } = useAuthContext();
  const { toast } = useToast();

  const filteredNavItems = navigationItems.filter(
    item => role && item.roles.includes(role)
  );

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar sesión',
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center">
            <img 
              src={logoIrati} 
              alt="Irati Asociación" 
              className="h-14 w-auto object-contain"
            />
          </Link>
        </div>

        {/* User Info */}
        {profile && !loading && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
            
            {/* Role Badge */}
            {role && (
              <Badge variant="secondary" className="w-full justify-center">
                <span className={cn("w-2 h-2 rounded-full mr-2", roleColors[role])} />
                {roleLabels[role]}
              </Badge>
            )}
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

        {/* Footer with Logout */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Irati Asociación v1.0
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
