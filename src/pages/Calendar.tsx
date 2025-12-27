import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, BookOpen, Users, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  schedule_days: string[] | null;
  schedule_time: string | null;
  instructor_id: string | null;
  instructor_name: string;
  category: string;
  status: string;
}

interface CourseSession {
  id: string;
  course_id: string;
  session_date: string;
  start_time: string;
  is_cancelled: boolean;
}

interface Enrollment {
  course_id: string;
  user_id: string;
}

interface Interview {
  id: string;
  scheduled_date: string;
  socio_id: string;
  monitor_id: string;
  status: string;
}

interface Profile {
  id: string;
  name: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'course' | 'interview';
  isHighlighted: boolean;
  details?: string;
}

export default function CalendarPage() {
  const { user, role } = useAuthContext();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    if (role && user?.id) {
      fetchData();
    }
  }, [role, user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Fetch all course sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('id, course_id, session_date, start_time, is_cancelled')
        .eq('is_cancelled', false);

      if (sessionsError) throw sessionsError;
      setCourseSessions(sessionsData || []);

      // Fetch enrollments based on role
      if (role === 'socio' && user?.id) {
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select('course_id, user_id')
          .eq('user_id', user.id);

        if (enrollmentsError) throw enrollmentsError;
        setEnrollments(enrollmentsData || []);
      }

      // Fetch interviews for gestor and monitor
      if (role === 'gestor' || role === 'monitor') {
        let interviewsQuery = supabase.from('interviews').select('*');
        
        if (role === 'monitor' && user?.id) {
          interviewsQuery = interviewsQuery.eq('monitor_id', user.id);
        }

        const { data: interviewsData, error: interviewsError } = await interviewsQuery;
        if (interviewsError) throw interviewsError;
        setInterviews(interviewsData || []);

        // Fetch profiles for interview names
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name');

        if (profilesError) throw profilesError;
        setProfiles(profilesData || []);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfileName = (id: string) => {
    return profiles.find(p => p.id === id)?.name || 'Desconocido';
  };

  const calendarEvents = useMemo((): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // For professors, add all session dates for their courses
    if (role === 'professor') {
      courseSessions.forEach(session => {
        const course = courses.find(c => c.id === session.course_id);
        if (course && course.instructor_id === user?.id) {
          events.push({
            id: `${session.id}`,
            title: course.title,
            date: parseISO(session.session_date),
            type: 'course',
            isHighlighted: true,
            details: `${course.category} - ${session.start_time.slice(0, 5)}`,
          });
        }
      });
    } else {
      // For other roles, add course start dates
      courses.forEach(course => {
        const isHighlighted = role === 'socio' 
          ? enrollments.some(e => e.course_id === course.id)
          : false;

        events.push({
          id: course.id,
          title: course.title,
          date: parseISO(course.start_date),
          type: 'course',
          isHighlighted,
          details: `${course.category} - ${course.instructor_name}`,
        });
      });
    }

    // Add interview events for gestor and monitor
    if (role === 'gestor' || role === 'monitor') {
      interviews.forEach(interview => {
        events.push({
          id: interview.id,
          title: `Entrevista: ${getProfileName(interview.socio_id)}`,
          date: parseISO(interview.scheduled_date),
          type: 'interview',
          isHighlighted: true,
          details: `Monitor: ${getProfileName(interview.monitor_id)}`,
        });
      });
    }

    return events;
  }, [courses, courseSessions, enrollments, interviews, profiles, role, user?.id]);

  const eventsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [calendarEvents, selectedDate]);

  const daysWithEvents = useMemo(() => {
    const days: { [key: string]: { courses: number; interviews: number; hasHighlighted: boolean } } = {};
    
    calendarEvents.forEach(event => {
      const key = format(event.date, 'yyyy-MM-dd');
      if (!days[key]) {
        days[key] = { courses: 0, interviews: 0, hasHighlighted: false };
      }
      if (event.type === 'course') {
        days[key].courses++;
      } else {
        days[key].interviews++;
      }
      if (event.isHighlighted) {
        days[key].hasHighlighted = true;
      }
    });

    return days;
  }, [calendarEvents]);

  const modifiers = useMemo(() => {
    const hasEvent: Date[] = [];
    const hasHighlighted: Date[] = [];

    Object.entries(daysWithEvents).forEach(([dateStr, data]) => {
      const date = parseISO(dateStr);
      hasEvent.push(date);
      if (data.hasHighlighted) {
        hasHighlighted.push(date);
      }
    });

    return { hasEvent, hasHighlighted };
  }, [daysWithEvents]);

  const modifiersStyles = {
    hasEvent: {
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      borderRadius: '50%',
    },
    hasHighlighted: {
      backgroundColor: 'hsl(var(--primary) / 0.3)',
      fontWeight: 'bold',
      borderRadius: '50%',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground mt-1">
          {role === 'socio' && 'Visualiza las clases de los cursos. Los cursos en los que estás inscrito aparecen destacados.'}
          {role === 'gestor' && 'Visualiza las clases de los cursos y las entrevistas programadas.'}
          {role === 'professor' && 'Visualiza las clases de los cursos. Los cursos que impartes aparecen destacados.'}
          {role === 'monitor' && 'Visualiza las clases y las entrevistas que tienes programadas.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Vista mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={es}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border pointer-events-auto"
            />
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/10" />
                <span className="text-muted-foreground">Eventos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/30" />
                <span className="text-muted-foreground">
                  {role === 'socio' && 'Inscrito'}
                  {role === 'professor' && 'Impartes'}
                  {(role === 'gestor' || role === 'monitor') && 'Entrevistas'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events for selected date */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate 
                ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                : 'Selecciona una fecha'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay eventos para esta fecha
              </p>
            ) : (
              <div className="space-y-3">
                {eventsForSelectedDate.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      event.isHighlighted
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/50 border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        event.type === 'course' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      )}>
                        {event.type === 'course' ? (
                          <BookOpen className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground truncate">
                            {event.title}
                          </p>
                          <Badge variant={event.type === 'course' ? 'secondary' : 'default'} className="text-xs">
                            {event.type === 'course' ? 'Curso' : 'Entrevista'}
                          </Badge>
                          {event.isHighlighted && (
                            <Badge variant="outline" className="text-xs border-primary text-primary">
                              {role === 'socio' && 'Inscrito'}
                              {role === 'professor' && 'Tu curso'}
                              {(role === 'gestor' || role === 'monitor') && event.type === 'interview' && 'Programada'}
                            </Badge>
                          )}
                        </div>
                        {event.details && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.details}
                          </p>
                        )}
                        {event.type === 'interview' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(event.date, "HH:mm", { locale: es })} hrs
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
