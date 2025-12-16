import { useUser } from '@/contexts/UserContext';
import { StatCard } from '@/components/StatCard';
import { CourseCard } from '@/components/CourseCard';
import { mockCourses, mockUsers, mockInterviews } from '@/data/mockData';
import { BookOpen, Users, Calendar, TrendingUp, ClipboardList, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useUser();

  const getStatsForRole = () => {
    switch (user?.role) {
      case 'gestor':
        return [
          { title: 'Total Socios', value: mockUsers.filter(u => u.role === 'socio').length, icon: <Users className="w-6 h-6" />, trend: { value: 12, isPositive: true } },
          { title: 'Cursos Activos', value: mockCourses.filter(c => c.status === 'active').length, icon: <BookOpen className="w-6 h-6" /> },
          { title: 'Entrevistas Pendientes', value: mockInterviews.filter(i => i.status === 'scheduled').length, icon: <ClipboardList className="w-6 h-6" /> },
          { title: 'Tasa de Completación', value: '78%', icon: <TrendingUp className="w-6 h-6" />, trend: { value: 5, isPositive: true } },
        ];
      case 'monitor':
        return [
          { title: 'Socios Asignados', value: 8, icon: <Users className="w-6 h-6" /> },
          { title: 'Entrevistas Hoy', value: 3, icon: <ClipboardList className="w-6 h-6" /> },
          { title: 'Entrevistas Pendientes', value: mockInterviews.filter(i => i.status === 'scheduled').length, icon: <Calendar className="w-6 h-6" /> },
          { title: 'Progreso General', value: '85%', icon: <TrendingUp className="w-6 h-6" /> },
        ];
      case 'professor':
        return [
          { title: 'Cursos Impartidos', value: 2, icon: <BookOpen className="w-6 h-6" /> },
          { title: 'Total Estudiantes', value: 38, icon: <Users className="w-6 h-6" /> },
          { title: 'Próximas Clases', value: 5, icon: <Calendar className="w-6 h-6" /> },
          { title: 'Satisfacción', value: '4.8', icon: <TrendingUp className="w-6 h-6" />, subtitle: 'de 5 estrellas' },
        ];
      case 'socio':
      default:
        return [
          { title: 'Cursos Inscritos', value: 2, icon: <GraduationCap className="w-6 h-6" /> },
          { title: 'Horas Completadas', value: 45, icon: <BookOpen className="w-6 h-6" /> },
          { title: 'Próxima Entrevista', value: '15 Feb', icon: <Calendar className="w-6 h-6" /> },
          { title: 'Progreso General', value: '65%', icon: <TrendingUp className="w-6 h-6" /> },
        ];
    }
  };

  const stats = getStatsForRole();
  const recentCourses = mockCourses.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {user?.role === 'gestor' && 'Visión general del sistema de integración'}
          {user?.role === 'monitor' && 'Gestiona el seguimiento de tus socios asignados'}
          {user?.role === 'professor' && 'Administra tus cursos y estudiantes'}
          {user?.role === 'socio' && 'Tu progreso en el programa de integración'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard 
            key={index} 
            {...stat} 
            className="animate-slide-in"
            style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {user?.role === 'socio' ? 'Cursos Disponibles' : 'Cursos Recientes'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'socio' ? 'Explora y inscríbete en nuevos cursos' : 'Últimas actualizaciones en el catálogo'}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/courses">Ver todos</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentCourses.map((course, index) => (
            <div 
              key={course.id} 
              className="animate-slide-in"
              style={{ animationDelay: `${(index + 4) * 50}ms` } as React.CSSProperties}
            >
              <CourseCard course={course} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {user?.role === 'gestor' && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/users">Gestionar Usuarios</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/courses">Administrar Cursos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/calendar">Ver Calendario</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
