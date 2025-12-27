import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CourseCard } from '@/components/CourseCard';
import { CourseFormDialog } from '@/components/courses/CourseFormDialog';
import { CourseSessionsDialog } from '@/components/courses/CourseSessionsDialog';
import { CourseEnrollmentsDialog } from '@/components/courses/CourseEnrollmentsDialog';
import { CourseDetailsDialog } from '@/components/courses/CourseDetailsDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, Pencil, Calendar, Users, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string | null;
  instructor_name: string;
  duration: string;
  category: string;
  image_url: string | null;
  enrolled_count: number;
  max_capacity: number;
  min_capacity: number;
  start_date: string;
  end_date: string | null;
  schedule_days: string[] | null;
  schedule_time: string | null;
  status: 'active' | 'upcoming' | 'completed';
}

const CATEGORIES = ['Todos', 'Tecnología', 'Idiomas', 'Arte', 'Música', 'Deportes', 'Cocina', 'Negocios', 'Salud', 'Otro'];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [enrollmentsDialogOpen, setEnrollmentsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { role, user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'Todos' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para inscribirte', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Ya inscrito', description: 'Ya estás inscrito en este curso' });
        } else {
          throw error;
        }
        return;
      }

      const course = courses.find(c => c.id === courseId);
      toast({
        title: '¡Inscripción exitosa!',
        description: `Te has inscrito en "${course?.title}"`,
      });
      fetchCourses();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleView = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    if (role === 'gestor') {
      setSelectedCourse(course);
      setEnrollmentsDialogOpen(true);
    } else if (role === 'professor') {
      setSelectedCourse(course);
      setDetailsDialogOpen(true);
    } else {
      toast({
        title: 'Detalles del curso',
        description: 'Esta funcionalidad estará disponible próximamente.',
      });
    }
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormDialogOpen(true);
  };

  const handleManageSessions = (course: Course) => {
    setSelectedCourse(course);
    setSessionsDialogOpen(true);
  };

  const handleManageEnrollments = (course: Course) => {
    setSelectedCourse(course);
    setEnrollmentsDialogOpen(true);
  };

  const handleNewCourse = () => {
    setSelectedCourse(null);
    setFormDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catálogo de Cursos</h1>
          <p className="text-muted-foreground mt-1">
            Explora nuestra oferta formativa y encuentra el curso ideal para ti
          </p>
        </div>
        {role === 'gestor' && (
          <Button className="gap-2" onClick={handleNewCourse}>
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer whitespace-nowrap transition-colors",
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
        </p>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <div 
              key={course.id}
              className="animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
            >
              <div className="relative">
                <CourseCard 
                  course={{
                    id: course.id,
                    title: course.title,
                    description: course.description || '',
                    instructor: course.instructor_name,
                    instructorId: course.instructor_id,
                    duration: course.duration,
                    category: course.category,
                    enrolledCount: course.enrolled_count,
                    maxCapacity: course.max_capacity,
                    startDate: new Date(course.start_date),
                    status: course.status,
                    image: course.image_url || undefined,
                  }}
                  onEnroll={handleEnroll}
                  onView={handleView}
                  currentUserId={user?.id}
                />
                {role === 'gestor' && (
                  <div className="absolute top-4 right-4 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleEdit(course)}
                      title="Editar curso"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleManageSessions(course)}
                      title="Gestionar sesiones"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleManageEnrollments(course)}
                      title="Ver inscritos"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron cursos</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            No hay cursos que coincidan con tu búsqueda. Intenta con otros términos o categorías.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CourseFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        course={selectedCourse}
        onSuccess={fetchCourses}
      />

      <CourseSessionsDialog
        open={sessionsDialogOpen}
        onOpenChange={setSessionsDialogOpen}
        course={selectedCourse}
      />

      <CourseEnrollmentsDialog
        open={enrollmentsDialogOpen}
        onOpenChange={setEnrollmentsDialogOpen}
        course={selectedCourse}
      />

      <CourseDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        course={selectedCourse}
      />
    </div>
  );
}