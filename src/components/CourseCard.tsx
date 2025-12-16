import { cn } from '@/lib/utils';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CourseCardProps {
  course: Course;
  showActions?: boolean;
  onEnroll?: (courseId: string) => void;
  onView?: (courseId: string) => void;
}

const statusConfig = {
  active: { label: 'Activo', className: 'bg-accent/10 text-accent border-accent/20' },
  upcoming: { label: 'Próximo', className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Completado', className: 'bg-muted text-muted-foreground border-border' },
};

export function CourseCard({ course, showActions = true, onEnroll, onView }: CourseCardProps) {
  const status = statusConfig[course.status];
  const availableSpots = course.maxCapacity - course.enrolledCount;
  const isFull = availableSpots <= 0;

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden transition-all hover:shadow-medium hover:border-primary/20">
      {/* Category Header */}
      <div className="h-2 bg-primary" />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className={cn("mb-2", status.className)}>
              {status.label}
            </Badge>
            <h3 className="font-semibold text-lg text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {course.description}
        </p>

        {/* Meta Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(course.startDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{course.enrolledCount}/{course.maxCapacity} inscritos</span>
            {isFull && <Badge variant="secondary" className="text-xs">Completo</Badge>}
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {course.instructor.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-card-foreground truncate">{course.instructor}</p>
            <p className="text-xs text-muted-foreground">{course.category}</p>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onView?.(course.id)}
            >
              Ver detalles
            </Button>
            {course.status !== 'completed' && !isFull && (
              <Button 
                className="flex-1 gap-2"
                onClick={() => onEnroll?.(course.id)}
              >
                Inscribirse
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
