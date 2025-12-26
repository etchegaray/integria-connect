-- Añadir campos faltantes a la tabla courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS min_capacity integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS schedule_days text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS schedule_time time DEFAULT '10:00';

-- Crear tabla para sesiones/clases individuales de cada curso
CREATE TABLE public.course_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  notes text,
  is_cancelled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla para control de asistencias
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('present', 'absent', 'excused', 'pending')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para course_sessions
CREATE POLICY "Todos pueden ver las sesiones de cursos"
ON public.course_sessions
FOR SELECT
USING (true);

CREATE POLICY "Los gestores pueden crear sesiones"
ON public.course_sessions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden actualizar sesiones"
ON public.course_sessions
FOR UPDATE
USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden eliminar sesiones"
ON public.course_sessions
FOR DELETE
USING (has_role(auth.uid(), 'gestor'));

-- Políticas RLS para attendance
CREATE POLICY "Los gestores pueden ver todas las asistencias"
ON public.attendance
FOR SELECT
USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los profesores pueden ver asistencias de sus cursos"
ON public.attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.course_sessions cs
    JOIN public.courses c ON cs.course_id = c.id
    WHERE cs.id = attendance.session_id
    AND c.instructor_id = auth.uid()
  )
);

CREATE POLICY "Los usuarios pueden ver su propia asistencia"
ON public.attendance
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Los gestores pueden crear asistencias"
ON public.attendance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden actualizar asistencias"
ON public.attendance
FOR UPDATE
USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los profesores pueden actualizar asistencias de sus cursos"
ON public.attendance
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.course_sessions cs
    JOIN public.courses c ON cs.course_id = c.id
    WHERE cs.id = attendance.session_id
    AND c.instructor_id = auth.uid()
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_course_sessions_updated_at
BEFORE UPDATE ON public.course_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();