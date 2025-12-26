import { useState, useEffect } from 'react';
import { format, addDays, getDay, parseISO, differenceInWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CourseSession {
  id: string;
  course_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  is_cancelled: boolean;
}

interface CourseSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    schedule_days: string[] | null;
    schedule_time: string | null;
    duration: string;
  } | null;
}

const DAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_NAMES: Record<string, string> = {
  sunday: 'Domingo',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
};

export function CourseSessionsDialog({ open, onOpenChange, course }: CourseSessionsDialogProps) {
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSession, setEditingSession] = useState<CourseSession | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState<Date | undefined>();
  const [newSessionTime, setNewSessionTime] = useState('10:00');
  const [newSessionEndTime, setNewSessionEndTime] = useState('12:00');
  const { toast } = useToast();

  useEffect(() => {
    if (open && course) {
      fetchSessions();
    }
  }, [open, course]);

  async function fetchSessions() {
    if (!course) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', course.id)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function generateSessions() {
    if (!course || !course.schedule_days || !course.end_date) {
      toast({ title: 'Error', description: 'El curso debe tener días de clase y fecha de fin', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const startDate = parseISO(course.start_date);
      const endDate = parseISO(course.end_date);
      const scheduleDays = course.schedule_days.map(d => DAY_MAP[d]);
      const startTime = course.schedule_time || '10:00';
      
      // Parse duration to calculate end time
      const durationMatch = course.duration.match(/(\d+)/);
      const durationHours = durationMatch ? parseInt(durationMatch[1]) : 2;
      const [hours, minutes] = startTime.split(':').map(Number);
      const endTimeHours = hours + durationHours;
      const endTime = `${endTimeHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      const sessionsToCreate: Omit<CourseSession, 'id'>[] = [];
      let currentDate = startDate;

      while (currentDate <= endDate) {
        const dayOfWeek = getDay(currentDate);
        if (scheduleDays.includes(dayOfWeek)) {
          sessionsToCreate.push({
            course_id: course.id,
            session_date: format(currentDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            location: null,
            notes: null,
            is_cancelled: false,
          });
        }
        currentDate = addDays(currentDate, 1);
      }

      if (sessionsToCreate.length === 0) {
        toast({ title: 'Sin sesiones', description: 'No se encontraron fechas válidas para generar sesiones' });
        return;
      }

      const { error } = await supabase
        .from('course_sessions')
        .insert(sessionsToCreate);

      if (error) throw error;

      toast({ title: 'Sesiones generadas', description: `Se crearon ${sessionsToCreate.length} sesiones` });
      fetchSessions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  }

  async function addSession() {
    if (!course || !newSessionDate) return;

    try {
      const { error } = await supabase
        .from('course_sessions')
        .insert({
          course_id: course.id,
          session_date: format(newSessionDate, 'yyyy-MM-dd'),
          start_time: newSessionTime,
          end_time: newSessionEndTime,
        });

      if (error) throw error;

      toast({ title: 'Sesión añadida' });
      setShowAddForm(false);
      setNewSessionDate(undefined);
      fetchSessions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function updateSession() {
    if (!editingSession) return;

    try {
      const { error } = await supabase
        .from('course_sessions')
        .update({
          session_date: editingSession.session_date,
          start_time: editingSession.start_time,
          end_time: editingSession.end_time,
          is_cancelled: editingSession.is_cancelled,
          notes: editingSession.notes,
        })
        .eq('id', editingSession.id);

      if (error) throw error;

      toast({ title: 'Sesión actualizada' });
      setEditingSession(null);
      fetchSessions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function deleteSession() {
    if (!deleteSessionId) return;

    try {
      const { error } = await supabase
        .from('course_sessions')
        .delete()
        .eq('id', deleteSessionId);

      if (error) throw error;

      toast({ title: 'Sesión eliminada' });
      setDeleteSessionId(null);
      fetchSessions();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  if (!course) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sesiones de: {course.title}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            {sessions.length === 0 && (
              <Button onClick={generateSessions} disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generar sesiones automáticamente
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir sesión
            </Button>
          </div>

          {showAddForm && (
            <div className="border border-border rounded-lg p-4 mb-4 space-y-4">
              <h4 className="font-medium">Nueva sesión</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !newSessionDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newSessionDate ? format(newSessionDate, 'PPP', { locale: es }) : 'Seleccionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newSessionDate}
                        onSelect={setNewSessionDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Hora inicio</Label>
                  <Input
                    type="time"
                    value={newSessionTime}
                    onChange={(e) => setNewSessionTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Input
                    type="time"
                    value={newSessionEndTime}
                    onChange={(e) => setNewSessionEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addSession} disabled={!newSessionDate}>Añadir</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay sesiones. Genera las sesiones automáticamente o añádelas manualmente.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    session.is_cancelled ? 'bg-destructive/10 border-destructive/20' : 'bg-card border-border'
                  )}
                >
                  {editingSession?.id === session.id ? (
                    <div className="flex-1 grid grid-cols-4 gap-2 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            {format(parseISO(editingSession.session_date), 'dd/MM/yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseISO(editingSession.session_date)}
                            onSelect={(date) => date && setEditingSession({
                              ...editingSession,
                              session_date: format(date, 'yyyy-MM-dd')
                            })}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="time"
                        value={editingSession.start_time}
                        onChange={(e) => setEditingSession({
                          ...editingSession,
                          start_time: e.target.value
                        })}
                      />
                      <Input
                        type="time"
                        value={editingSession.end_time}
                        onChange={(e) => setEditingSession({
                          ...editingSession,
                          end_time: e.target.value
                        })}
                      />
                      <div className="flex gap-1">
                        <Button size="sm" onClick={updateSession}>Guardar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingSession(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {format(parseISO(session.session_date), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                          </p>
                        </div>
                        {session.is_cancelled && (
                          <Badge variant="destructive">Cancelada</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingSession(session)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteSessionId(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSession}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}