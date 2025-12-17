-- Crear tipos ENUM para la aplicación
CREATE TYPE public.app_role AS ENUM ('socio', 'monitor', 'professor', 'gestor');
CREATE TYPE public.course_status AS ENUM ('active', 'upcoming', 'completed');
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Crear tabla de perfiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Los usuarios pueden ver todos los perfiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Crear tabla de roles de usuario (separada por seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS en user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función SECURITY DEFINER para verificar roles (evita recursión en RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para obtener el rol principal de un usuario
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Políticas RLS para user_roles
CREATE POLICY "Los usuarios pueden ver sus propios roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Los gestores pueden ver todos los roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden asignar roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden eliminar roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

-- Crear tabla de cursos
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES auth.users(id),
  instructor_name TEXT NOT NULL,
  duration TEXT NOT NULL,
  category TEXT NOT NULL,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  max_capacity INTEGER NOT NULL DEFAULT 25,
  start_date DATE NOT NULL,
  status course_status NOT NULL DEFAULT 'upcoming',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para courses
CREATE POLICY "Todos pueden ver los cursos"
ON public.courses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Los gestores pueden crear cursos"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden actualizar cursos"
ON public.courses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los profesores pueden actualizar sus cursos"
ON public.courses FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Los gestores pueden eliminar cursos"
ON public.courses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

-- Crear tabla de inscripciones
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, course_id)
);

-- Habilitar RLS en enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para enrollments
CREATE POLICY "Los usuarios pueden ver sus propias inscripciones"
ON public.enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Los gestores pueden ver todas las inscripciones"
ON public.enrollments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los usuarios pueden inscribirse en cursos"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los gestores pueden crear inscripciones"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los usuarios pueden cancelar sus inscripciones"
ON public.enrollments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Crear tabla de entrevistas
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  monitor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status interview_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en interviews
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para interviews
CREATE POLICY "Los socios pueden ver sus propias entrevistas"
ON public.interviews FOR SELECT
TO authenticated
USING (auth.uid() = socio_id);

CREATE POLICY "Los monitores pueden ver sus entrevistas asignadas"
ON public.interviews FOR SELECT
TO authenticated
USING (auth.uid() = monitor_id);

CREATE POLICY "Los gestores pueden ver todas las entrevistas"
ON public.interviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los monitores pueden crear entrevistas"
ON public.interviews FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'monitor') OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los monitores pueden actualizar sus entrevistas"
ON public.interviews FOR UPDATE
TO authenticated
USING (auth.uid() = monitor_id OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Los gestores pueden eliminar entrevistas"
ON public.interviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'gestor'));

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Asignar rol de socio por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'socio');
  
  RETURN NEW;
END;
$$;

-- Crear trigger para nuevos usuarios
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();