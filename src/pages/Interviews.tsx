import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Calendar as CalendarIcon, Clock, FileText, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type InterviewStatus = Database['public']['Enums']['interview_status'];

interface Interview {
  id: string;
  socio_id: string;
  monitor_id: string;
  scheduled_date: string;
  status: InterviewStatus;
  notes: string | null;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

const statusConfig = {
  scheduled: {
    label: 'Programada',
    className: 'bg-primary/10 text-primary border-primary/20',
    icon: Clock
  },
  completed: {
    label: 'Completada',
    className: 'bg-accent/10 text-accent border-accent/20',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle
  }
};

export default function Interviews() {
  const { toast } = useToast();
  const { user, role } = useAuth();
  
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [socios, setSocios] = useState<Profile[]>([]);
  const [monitors, setMonitors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [selectedSocio, setSelectedSocio] = useState('');
  const [selectedMonitor, setSelectedMonitor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<InterviewStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      fetchData();
    }
  }, [role, user?.id]);

  const fetchData = async () => {
    try {
      // Fetch interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (interviewsError) throw interviewsError;

      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email');

      if (profilesError) throw profilesError;

      // Fetch user roles to identify socios and monitors
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const monitorIds = rolesData.filter(r => r.role === 'monitor').map(r => r.user_id);

      setInterviews(interviewsData || []);
      setProfiles(profilesData || []);
      setMonitors((profilesData || []).filter(p => monitorIds.includes(p.id)));

      // Si es monitor, obtener solo los socios asignados a él
      if (role === 'monitor' && user?.id) {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('monitor_assignments')
          .select('socio_id')
          .eq('monitor_id', user.id);

        if (assignmentsError) throw assignmentsError;

        const assignedSocioIds = (assignmentsData || []).map(a => a.socio_id);
        setSocios((profilesData || []).filter(p => assignedSocioIds.includes(p.id)));
      } else {
        // Si es gestor, mostrar todos los socios
        const socioIds = rolesData.filter(r => r.role === 'socio').map(r => r.user_id);
        setSocios((profilesData || []).filter(p => socioIds.includes(p.id)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProfileById = (id: string) => profiles.find(p => p.id === id);

  const handleNewInterview = () => {
    setEditingInterview(null);
    setSelectedSocio('');
    setSelectedMonitor(user?.id || '');
    setSelectedDate(undefined);
    setSelectedStatus('scheduled');
    setNotes('');
    setDialogOpen(true);
  };

  const handleEditInterview = (interview: Interview) => {
    setEditingInterview(interview);
    setSelectedSocio(interview.socio_id);
    setSelectedMonitor(interview.monitor_id);
    setSelectedDate(new Date(interview.scheduled_date));
    setSelectedStatus(interview.status);
    setNotes(interview.notes || '');
    setDialogOpen(true);
  };

  const handleSaveInterview = async () => {
    if (!selectedSocio || !selectedMonitor || !selectedDate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (editingInterview) {
        // Update existing interview
        const { error } = await supabase
          .from('interviews')
          .update({
            socio_id: selectedSocio,
            monitor_id: selectedMonitor,
            scheduled_date: selectedDate.toISOString(),
            status: selectedStatus,
            notes: notes || null
          })
          .eq('id', editingInterview.id);

        if (error) throw error;

        toast({
          title: "Entrevista actualizada",
          description: "Los datos se han guardado correctamente"
        });
      } else {
        // Create new interview
        const { error } = await supabase
          .from('interviews')
          .insert({
            socio_id: selectedSocio,
            monitor_id: selectedMonitor,
            scheduled_date: selectedDate.toISOString(),
            status: selectedStatus,
            notes: notes || null
          });

        if (error) throw error;

        toast({
          title: "Entrevista creada",
          description: "La entrevista ha sido programada correctamente"
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving interview:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la entrevista",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const scheduledInterviews = interviews.filter(i => i.status === 'scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'completed');

  const canEdit = role === 'gestor' || role === 'monitor';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Entrevistas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las entrevistas de seguimiento con los socios
          </p>
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={handleNewInterview}>
            <Plus className="w-4 h-4" />
            Nueva Entrevista
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledInterviews.length}</p>
                <p className="text-sm text-muted-foreground">Programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedInterviews.length}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{interviews.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Próximas Entrevistas previstas</h2>
        <div className="grid gap-4">
          {scheduledInterviews.length > 0 ? (
            scheduledInterviews.map((interview, index) => {
              const socio = getProfileById(interview.socio_id);
              const status = statusConfig[interview.status];
              const StatusIcon = status.icon;
              
              return (
                <Card 
                  key={interview.id} 
                  className="animate-slide-in hover:shadow-medium transition-shadow"
                  style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {socio?.name.split(' ').map(n => n[0]).join('') || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-foreground">{socio?.name || 'Socio'}</h3>
                            <p className="text-sm text-muted-foreground">{socio?.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("flex-shrink-0", status.className)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditInterview(interview)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {format(new Date(interview.scheduled_date), "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </div>
                        {interview.notes && (
                          <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
                            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-muted-foreground">{interview.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No hay entrevistas programadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Programa una nueva entrevista con un socio
                </p>
                {canEdit && (
                  <Button onClick={handleNewInterview}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Entrevista
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Completed Interviews */}
      {completedInterviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Entrevistas Completadas</h2>
          <div className="grid gap-4">
            {completedInterviews.map((interview, index) => {
              const socio = getProfileById(interview.socio_id);
              const status = statusConfig[interview.status];
              
              return (
                <Card 
                  key={interview.id} 
                  className="bg-muted/30 animate-slide-in"
                  style={{ animationDelay: `${(index + scheduledInterviews.length) * 50}ms` } as React.CSSProperties}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-accent/10 text-accent font-medium">
                          {socio?.name.split(' ').map(n => n[0]).join('') || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{socio?.name || 'Socio'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(interview.scheduled_date), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditInterview(interview)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Interview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingInterview ? 'Editar Entrevista' : 'Nueva Entrevista'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Socio *</Label>
              <Select value={selectedSocio} onValueChange={setSelectedSocio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un socio" />
                </SelectTrigger>
                <SelectContent>
                  {socios.map(socio => (
                    <SelectItem key={socio.id} value={socio.id}>
                      {socio.name} ({socio.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Monitor *</Label>
              <Select value={selectedMonitor} onValueChange={setSelectedMonitor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un monitor" />
                </SelectTrigger>
                <SelectContent>
                  {monitors.map(monitor => (
                    <SelectItem key={monitor.id} value={monitor.id}>
                      {monitor.name} ({monitor.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha y hora *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {editingInterview && (
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as InterviewStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Añade notas sobre la entrevista..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInterview} disabled={saving}>
              {saving ? 'Guardando...' : editingInterview ? 'Guardar cambios' : 'Crear entrevista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
