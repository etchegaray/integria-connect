import { useState } from 'react';
import { mockCourses, categories } from '@/data/mockData';
import { CourseCard } from '@/components/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const { role } = useAuthContext();
  const { toast } = useToast();

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEnroll = (courseId: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    toast({
      title: "¡Inscripción exitosa!",
      description: `Te has inscrito en "${course?.title}"`,
    });
  };

  const handleView = (courseId: string) => {
    toast({
      title: "Detalles del curso",
      description: "Esta funcionalidad estará disponible próximamente.",
    });
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
        {(role === 'gestor' || role === 'professor') && (
          <Button className="gap-2">
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
            {categories.map(category => (
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
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <div 
              key={course.id}
              className="animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
            >
              <CourseCard 
                course={course} 
                onEnroll={handleEnroll}
                onView={handleView}
              />
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
    </div>
  );
}
