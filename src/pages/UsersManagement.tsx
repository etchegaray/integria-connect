import { mockUsers } from '@/data/mockData';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, UserCog, Mail, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  socio: { label: 'Socio', className: 'bg-role-socio/10 text-role-socio border-role-socio/20' },
  monitor: { label: 'Monitor', className: 'bg-role-monitor/10 text-role-monitor border-role-monitor/20' },
  professor: { label: 'Profesor', className: 'bg-role-professor/10 text-role-professor border-role-professor/20' },
  gestor: { label: 'Gestor', className: 'bg-role-gestor/10 text-role-gestor border-role-gestor/20' },
};

export default function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = (action: string, userName: string) => {
    toast({
      title: `Acción: ${action}`,
      description: `${action} para ${userName} - Funcionalidad próximamente disponible`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios y sus roles en el sistema
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(roleConfig) as UserRole[]).map(role => {
          const count = mockUsers.filter(u => u.role === role).length;
          const config = roleConfig[role];
          return (
            <div key={role} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn("w-3 h-3 rounded-full", `bg-role-${role}`)} />
                <span className="text-sm font-medium text-muted-foreground">{config.label}s</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <TableRow 
                key={user.id}
                className="animate-slide-in"
                style={{ animationDelay: `${index * 30}ms` } as React.CSSProperties}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleConfig[user.role].className}>
                    {roleConfig[user.role].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction('Editar rol', user.name)}>
                        <UserCog className="w-4 h-4 mr-2" />
                        Editar rol
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction('Enviar email', user.name)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar email
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleAction('Eliminar', user.name)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
