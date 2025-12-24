-- Crear tabla para asignar socios a monitores
CREATE TABLE public.monitor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid NOT NULL,
  socio_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(monitor_id, socio_id)
);

-- Habilitar RLS
ALTER TABLE public.monitor_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los gestores pueden ver todas las asignaciones"
ON public.monitor_assignments
FOR SELECT
USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden crear asignaciones"
ON public.monitor_assignments
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden eliminar asignaciones"
ON public.monitor_assignments
FOR DELETE
USING (has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los monitores pueden ver sus asignaciones"
ON public.monitor_assignments
FOR SELECT
USING (auth.uid() = monitor_id);

CREATE POLICY "Los socios pueden ver su asignación"
ON public.monitor_assignments
FOR SELECT
USING (auth.uid() = socio_id);