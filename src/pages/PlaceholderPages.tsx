import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Construction className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
      <Button asChild variant="outline">
        <Link to="/">Volver al Dashboard</Link>
      </Button>
    </div>
  );
}

export function EnrollmentsPage() {
  return <PlaceholderPage title="Mis Inscripciones" description="Aquí podrás ver y gestionar tus inscripciones a cursos. Esta funcionalidad estará disponible próximamente." />;
}

export function StudentsPage() {
  return <PlaceholderPage title="Mis Estudiantes" description="Gestiona y haz seguimiento de tus estudiantes asignados. Esta funcionalidad estará disponible próximamente." />;
}


export function SettingsPage() {
  return <PlaceholderPage title="Configuración" description="Personaliza la configuración del sistema según tus necesidades. Esta funcionalidad estará disponible próximamente." />;
}
