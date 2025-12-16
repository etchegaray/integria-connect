export type UserRole = 'socio' | 'monitor' | 'professor' | 'gestor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  category: string;
  enrolledCount: number;
  maxCapacity: number;
  startDate: Date;
  status: 'active' | 'upcoming' | 'completed';
  image?: string;
}

export interface Interview {
  id: string;
  socioId: string;
  monitorId: string;
  date: Date;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}
