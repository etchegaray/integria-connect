import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Users, BookOpen, Calendar, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface Enrollment {
  id: string;
  user_id: string;
  enrolled_at: string;
  status: string;
  profile: {
    name: string;
    email: string;
  } | null;
}

interface CourseSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_cancelled: boolean;
  notes: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  duration: string;
  category: string;
  enrolled_count: number;
  max_capacity: number;
  min_capacity: number;
  start_date: string;
  end_date: string | null;
  schedule_days: string[] | null;
  schedule_time: string | null;
  status: 'active' | 'upcoming' | 'completed';
}

interface CourseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
}

const DAY_NAMES: { [key: string]: string } = {
  'lunes': 'Lunes',
  'martes': 'Martes',
  'miercoles': 'Miércoles',
  'jueves': 'Jueves',
  'viernes': 'Viernes',
  'sabado': 'Sábado',
  'domingo': 'Domingo',
};

const statusConfig = {
  active: { label: 'Activo', className: 'bg-accent/10 text-accent border-accent/20' },
  upcoming: { label: 'Próximo', className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Completado', className: 'bg-muted text-muted-foreground border-border' },
};

export function CourseDetailsDialog({ open, onOpenChange, course }: CourseDetailsDialogProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && course) {
      fetchData();
    }
  }, [open, course]);

  async function fetchData() {
    if (!course) return;
    setIsLoading(true);
    try {
      // Fetch enrollments with profiles
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          user_id,
          enrolled_at,
          status
        `)
        .eq('course_id', course.id);

      if (enrollmentsError) throw enrollmentsError;

      // Fetch profiles for enrolled users
      if (enrollmentsData && enrollmentsData.length > 0) {
        const userIds = enrollmentsData.map(e => e.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        const enrollmentsWithProfiles = enrollmentsData.map(e => ({
          ...e,
          profile: profiles?.find(p => p.id === e.user_id) || null,
        }));
        setEnrollments(enrollmentsWithProfiles);
      } else {
        setEnrollments([]);
      }

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', course.id)
        .order('session_date', { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  if (!course) return null;

  const status = statusConfig[course.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {course.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                  <Badge variant="secondary">{course.category}</Badge>
                </div>
                
                {course.description && (
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Instructor: <strong>{course.instructor_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Duración: <strong>{course.duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Inicio: <strong>{format(parseISO(course.start_date), "d 'de' MMMM, yyyy", { locale: es })}</strong>
                    </span>
                  </div>
                  {course.end_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Fin: <strong>{format(parseISO(course.end_date), "d 'de' MMMM, yyyy", { locale: es })}</strong>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Capacidad: <strong>{course.enrolled_count} / {course.max_capacity}</strong>
                      {course.min_capacity > 0 && <span className="text-muted-foreground"> (mín. {course.min_capacity})</span>}
                    </span>
                  </div>
                  {course.schedule_days && course.schedule_days.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Días: <strong>{course.schedule_days.map(d => DAY_NAMES[d] || d).join(', ')}</strong>
                        {course.schedule_time && <span> a las {course.schedule_time.slice(0, 5)}</span>}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="enrollments">
              <TabsList>
                <TabsTrigger value="enrollments">Inscritos ({enrollments.length})</TabsTrigger>
                <TabsTrigger value="sessions">Sesiones ({sessions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="enrollments" className="mt-4">
                {enrollments.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No hay inscritos en este curso.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Fecha inscripción</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollments.map((enrollment) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.profile?.name || 'Sin nombre'}
                          </TableCell>
                          <TableCell>{enrollment.profile?.email || '-'}</TableCell>
                          <TableCell>
                            {format(parseISO(enrollment.enrolled_at), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={enrollment.status === 'enrolled' ? 'default' : 'secondary'}>
                              {enrollment.status === 'enrolled' ? 'Inscrito' : enrollment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="sessions" className="mt-4">
                {sessions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No hay sesiones programadas para este curso.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(session.session_date), "EEEE d 'de' MMMM", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                          </TableCell>
                          <TableCell>
                            {session.location || '-'}
                          </TableCell>
                          <TableCell>
                            {session.is_cancelled ? (
                              <Badge variant="destructive">Cancelada</Badge>
                            ) : (
                              <Badge variant="secondary">Programada</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
