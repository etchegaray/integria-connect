import { mockInterviews, mockUsers } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusConfig = {
  scheduled: { label: 'Programada', className: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
  completed: { label: 'Completada', className: 'bg-accent/10 text-accent border-accent/20', icon: CheckCircle },
  cancelled: { label: 'Cancelada', className: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

export default function Interviews() {
  const { toast } = useToast();

  const getUserById = (id: string) => mockUsers.find(u => u.id === id);

  const handleNewInterview = () => {
    toast({
      title: "Nueva entrevista",
      description: "Funcionalidad próximamente disponible",
    });
  };

  const scheduledInterviews = mockInterviews.filter(i => i.status === 'scheduled');
  const completedInterviews = mockInterviews.filter(i => i.status === 'completed');

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
        <Button className="gap-2" onClick={handleNewInterview}>
          <Plus className="w-4 h-4" />
          Nueva Entrevista
        </Button>
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
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockInterviews.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Próximas Entrevistas</h2>
        <div className="grid gap-4">
          {scheduledInterviews.length > 0 ? (
            scheduledInterviews.map((interview, index) => {
              const socio = getUserById(interview.socioId);
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
                          <Badge variant="outline" className={cn("flex-shrink-0", status.className)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(interview.date, "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
                          <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground">{interview.notes}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">No hay entrevistas programadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Programa una nueva entrevista con un socio
                </p>
                <Button onClick={handleNewInterview}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Entrevista
                </Button>
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
              const socio = getUserById(interview.socioId);
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
                          {format(interview.date, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
