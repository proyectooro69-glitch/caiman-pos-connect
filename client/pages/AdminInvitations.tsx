import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseUntyped } from "@/lib/supabase-untyped";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Mail, 
  Send, 
  UserPlus, 
  Store,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/types/database";

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  store_id: string | null;
  invited_by: string | null;
  used_at: string | null;
  created_at: string;
}

export default function AdminInvitations() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'vendedor' as Exclude<AppRole, 'administrador'>,
    store_id: '',
  });

  // Fetch all invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['admin-invitations'],
    queryFn: async () => {
      const { data, error } = await supabaseUntyped
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
    enabled: !roleLoading && isAdmin,
  });

  // Fetch stores for assignment
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabaseUntyped
        .from('puntos_venta')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      return data ?? [];
    },
    enabled: !roleLoading && isAdmin,
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (inviteData: { email: string; role: AppRole; store_id: string }) => {
      const { data, error } = await supabaseUntyped
        .from('invitations')
        .insert({
          email: inviteData.email.toLowerCase().trim(),
          role: inviteData.role,
          store_id: inviteData.store_id || null,
          invited_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este correo ya tiene una invitación pendiente');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Invitación creada exitosamente');
      setNewInvite({ email: '', role: 'vendedor', store_id: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete invitation mutation
  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseUntyped
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invitación eliminada');
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreateInvitation = () => {
    if (!newInvite.email) {
      toast.error('Ingresa un correo electrónico');
      return;
    }
    if (!newInvite.store_id) {
      toast.error('Selecciona un punto de venta');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newInvite.email)) {
      toast.error('Ingresa un correo válido');
      return;
    }

    createInvitationMutation.mutate(newInvite);
  };

  const getRoleBadge = (role: AppRole) => {
    const config = {
      administrador: { label: 'Admin', className: 'bg-primary/20 text-primary' },
      supervisor: { label: 'Supervisor', className: 'bg-amber-500/20 text-amber-500' },
      vendedor: { label: 'Vendedor', className: 'bg-emerald-500/20 text-emerald-500' },
    };
    return <Badge className={config[role].className}>{config[role].label}</Badge>;
  };

  const getStatusBadge = (usedAt: string | null) => {
    if (usedAt) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Usada
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-500">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-96 w-full" />
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel de Invitaciones</h1>
          <p className="text-muted-foreground">Invita usuarios y asígnalos a tiendas antes de que se registren</p>
        </div>

        {/* Create Invitation Form */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nueva Invitación
            </CardTitle>
            <CardDescription>
              Cuando la persona se registre con este correo, automáticamente tendrá el rol y tienda asignados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={newInvite.role}
                  onValueChange={(value: Exclude<AppRole, 'administrador'>) => 
                    setNewInvite({ ...newInvite, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Punto de Venta</Label>
                <Select
                  value={newInvite.store_id}
                  onValueChange={(value) => setNewInvite({ ...newInvite, store_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store: { id: string; nombre: string }) => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {store.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  className="w-full gradient-primary"
                  onClick={handleCreateInvitation}
                  disabled={createInvitationMutation.isPending}
                >
                  {createInvitationMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Crear Invitación</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitations Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Invitaciones ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay invitaciones aún</p>
                <p className="text-sm">Crea una invitación para empezar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Tienda</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const store = stores.find((s: { id: string; nombre: string }) => s.id === inv.store_id);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{inv.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(inv.role)}</TableCell>
                        <TableCell>
                          {store ? (
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              {store.nombre}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(inv.used_at)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {!inv.used_at && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteInvitationMutation.mutate(inv.id)}
                              disabled={deleteInvitationMutation.isPending}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">¿Cómo funciona?</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Crea una invitación con el correo del usuario</li>
                  <li>Comparte el enlace de registro con esa persona</li>
                  <li>Cuando se registre, automáticamente tendrá el rol y tienda asignados</li>
                  <li>No necesitará crear una tienda temporal durante el registro</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
