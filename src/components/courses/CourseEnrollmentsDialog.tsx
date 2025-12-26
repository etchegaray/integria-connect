import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Users, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  is_cancelled: boolean;
}

interface Attendance {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
}

interface CourseEnrollmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    title: string;
    enrolled_count: number;
    min_capacity: number;
    max_capacity: number;
  } | null;
}

export function CourseEnrollmentsDialog({ open, onOpenChange, course }: CourseEnrollmentsDialogProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
        .select('id, session_date, start_time, is_cancelled')
        .eq('course_id', course.id)
        .order('session_date', { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      if (sessionsData && sessionsData.length > 0) {
        setSelectedSession(sessionsData[0].id);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedSession) {
      fetchAttendances();
    }
  }, [selectedSession]);

  async function fetchAttendances() {
    if (!selectedSession) return;
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('session_id', selectedSession);

      if (error) throw error;
      setAttendances(data || []);
    } catch (error: any) {
      console.error('Error fetching attendances:', error);
    }
  }

  async function updateAttendance(userId: string, status: string) {
    if (!selectedSession) return;
    setIsSaving(true);
    try {
      const existingAttendance = attendances.find(
        a => a.session_id === selectedSession && a.user_id === userId
      );

      if (existingAttendance) {
        const { error } = await supabase
          .from('attendance')
          .update({ status })
          .eq('id', existingAttendance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert({
            session_id: selectedSession,
            user_id: userId,
            status,
          });
        if (error) throw error;
      }

      await fetchAttendances();
      toast({ title: 'Asistencia actualizada' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  function getAttendanceStatus(userId: string): string {
    const attendance = attendances.find(
      a => a.session_id === selectedSession && a.user_id === userId
    );
    return attendance?.status || 'pending';
  }

  const selectedSessionData = sessions.find(s => s.id === selectedSession);

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inscritos en: {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {enrollments.length} / {course.max_capacity} inscritos
          </Badge>
          {enrollments.length < course.min_capacity && (
            <Badge variant="destructive">
              Mínimo requerido: {course.min_capacity}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="enrollments">
            <TabsList>
              <TabsTrigger value="enrollments">Inscritos ({enrollments.length})</TabsTrigger>
              <TabsTrigger value="attendance">Control de asistencia</TabsTrigger>
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

            <TabsContent value="attendance" className="mt-4">
              {sessions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No hay sesiones programadas para este curso.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Sesión:</label>
                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                      <SelectTrigger className="w-[300px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {format(parseISO(session.session_date), "EEEE d 'de' MMMM", { locale: es })} - {session.start_time.slice(0, 5)}
                            {session.is_cancelled && ' (Cancelada)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedSessionData?.is_cancelled && (
                    <Badge variant="destructive">Esta sesión está cancelada</Badge>
                  )}

                  {enrollments.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No hay inscritos para registrar asistencia.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrollments.map((enrollment) => {
                          const status = getAttendanceStatus(enrollment.user_id);
                          return (
                            <TableRow key={enrollment.id}>
                              <TableCell className="font-medium">
                                {enrollment.profile?.name || 'Sin nombre'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    status === 'present' ? 'default' :
                                    status === 'absent' ? 'destructive' :
                                    status === 'excused' ? 'secondary' : 'outline'
                                  }
                                  className="gap-1"
                                >
                                  {status === 'present' && <Check className="h-3 w-3" />}
                                  {status === 'absent' && <X className="h-3 w-3" />}
                                  {status === 'pending' && <Clock className="h-3 w-3" />}
                                  {status === 'present' ? 'Presente' :
                                   status === 'absent' ? 'Ausente' :
                                   status === 'excused' ? 'Justificado' : 'Pendiente'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant={status === 'present' ? 'default' : 'outline'}
                                    onClick={() => updateAttendance(enrollment.user_id, 'present')}
                                    disabled={isSaving}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={status === 'absent' ? 'destructive' : 'outline'}
                                    onClick={() => updateAttendance(enrollment.user_id, 'absent')}
                                    disabled={isSaving}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={status === 'excused' ? 'secondary' : 'outline'}
                                    onClick={() => updateAttendance(enrollment.user_id, 'excused')}
                                    disabled={isSaving}
                                  >
                                    J
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}