import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, UserPlus, Trash2, UserCheck } from "lucide-react";

interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: string;
  monitor_id: string;
  socio_id: string;
  assigned_at: string;
  notes: string | null;
  monitor?: UserWithRole;
  socio?: UserWithRole;
}

const MonitorAssignments = () => {
  const { role, loading } = useAuthContext();
  const [monitors, setMonitors] = useState<UserWithRole[]>([]);
  const [socios, setSocios] = useState<UserWithRole[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedMonitor, setSelectedMonitor] = useState<string>("");
  const [selectedSocio, setSelectedSocio] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; assignment: Assignment | null }>({
    open: false,
    assignment: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (role === "gestor") {
      fetchData();
    }
  }, [role]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los usuarios con sus roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.id)?.role || "socio",
      })) || [];

      setMonitors(usersWithRoles.filter((u) => u.role === "monitor"));
      setSocios(usersWithRoles.filter((u) => u.role === "socio"));

      // Obtener asignaciones
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("monitor_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Enriquecer con datos de usuarios
      const enrichedAssignments = (assignmentsData || []).map((a) => ({
        ...a,
        monitor: usersWithRoles.find((u) => u.id === a.monitor_id),
        socio: usersWithRoles.find((u) => u.id === a.socio_id),
      }));

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMonitor || !selectedSocio) {
      toast.error("Selecciona un monitor y un socio");
      return;
    }

    setIsAssigning(true);
    try {
      const { error } = await supabase.from("monitor_assignments").insert({
        monitor_id: selectedMonitor,
        socio_id: selectedSocio,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Este socio ya está asignado a este monitor");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Socio asignado correctamente");
      setSelectedMonitor("");
      setSelectedSocio("");
      fetchData();
    } catch (error) {
      console.error("Error assigning:", error);
      toast.error("Error al asignar el socio");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.assignment) return;

    try {
      const { error } = await supabase
        .from("monitor_assignments")
        .delete()
        .eq("id", deleteDialog.assignment.id);

      if (error) throw error;

      toast.success("Asignación eliminada");
      setDeleteDialog({ open: false, assignment: null });
      fetchData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Error al eliminar la asignación");
    }
  };

  // Socios disponibles (no asignados al monitor seleccionado)
  const availableSocios = socios.filter(
    (s) => !assignments.some((a) => a.socio_id === s.id && a.monitor_id === selectedMonitor)
  );

  // Agrupar asignaciones por monitor
  const assignmentsByMonitor = monitors.map((monitor) => ({
    monitor,
    socios: assignments
      .filter((a) => a.monitor_id === monitor.id)
      .map((a) => a.socio)
      .filter(Boolean) as UserWithRole[],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== "gestor") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asignación de Socios a Monitores</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona qué socios están asignados a cada monitor
        </p>
      </div>

      {/* Panel de asignación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nueva Asignación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Monitor</label>
              <Select value={selectedMonitor} onValueChange={setSelectedMonitor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un monitor" />
                </SelectTrigger>
                <SelectContent>
                  {monitors.map((monitor) => (
                    <SelectItem key={monitor.id} value={monitor.id}>
                      {monitor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Socio</label>
              <Select
                value={selectedSocio}
                onValueChange={setSelectedSocio}
                disabled={!selectedMonitor}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedMonitor ? "Selecciona un socio" : "Primero selecciona un monitor"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSocios.map((socio) => (
                    <SelectItem key={socio.id} value={socio.id}>
                      {socio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssign}
                disabled={!selectedMonitor || !selectedSocio || isAssigning}
              >
                {isAssigning ? "Asignando..." : "Asignar"}
              </Button>
            </div>
          </div>

          {monitors.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              No hay monitores registrados. Primero asigna el rol de monitor a algún usuario.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vista por monitor */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignmentsByMonitor.map(({ monitor, socios: assignedSocios }) => (
          <Card key={monitor.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-primary" />
                {monitor.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{monitor.email}</p>
            </CardHeader>
            <CardContent>
              {assignedSocios.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sin socios asignados</p>
              ) : (
                <div className="space-y-2">
                  {assignedSocios.map((socio) => {
                    const assignment = assignments.find(
                      (a) => a.monitor_id === monitor.id && a.socio_id === socio.id
                    );
                    return (
                      <div
                        key={socio.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div>
                          <p className="text-sm font-medium">{socio.name}</p>
                          <p className="text-xs text-muted-foreground">{socio.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteDialog({ open: true, assignment: assignment || null })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <Badge variant="secondary" className="mt-3">
                {assignedSocios.length} socio{assignedSocios.length !== 1 ? "s" : ""}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla completa de asignaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Todas las Asignaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay asignaciones registradas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Socio</TableHead>
                  <TableHead>Fecha de Asignación</TableHead>
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.monitor?.name || "Desconocido"}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.monitor?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assignment.socio?.name || "Desconocido"}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.socio?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.assigned_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, assignment })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, assignment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Asignación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la asignación de{" "}
              <strong>{deleteDialog.assignment?.socio?.name}</strong> al monitor{" "}
              <strong>{deleteDialog.assignment?.monitor?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, assignment: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonitorAssignments;
