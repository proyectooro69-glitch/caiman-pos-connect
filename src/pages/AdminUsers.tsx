import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  UserCog, 
  Plus, 
  Shield, 
  Store,
  Mail,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/types/database";

export default function AdminUsers() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nombre: '',
    role: 'vendedor' as AppRole,
    store_id: '',
  });

  // Fetch all users with roles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      
      // Fetch roles separately to avoid type issues
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role, store_id');
      
      const rolesData = (roles ?? []) as { user_id: string; role: AppRole; store_id: string | null }[];
      
      return (profiles ?? []).map(profile => ({
        ...profile,
        user_roles: rolesData.filter(r => r.user_id === profile.id),
      }));
    },
    enabled: !roleLoading && isAdmin,
  });

  // Fetch stores for assignment
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_venta')
        .select('id, nombre')
        .order('nombre');

      if (error) throw error;
      return data ?? [];
    },
    enabled: !roleLoading && isAdmin,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; nombre: string; role: AppRole; store_id: string }) => {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { nombre: userData.nombre },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Insert role using direct insert with type assertion
      const roleInsert = {
        user_id: authData.user.id,
        role: userData.role,
        store_id: userData.store_id || null,
      };
      
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(roleInsert as any);

      if (insertError) throw insertError;

      return authData.user;
    },
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      setIsDialogOpen(false);
      setNewUser({ email: '', password: '', nombre: '', role: 'vendedor', store_id: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password || !newUser.nombre) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    if (newUser.role !== 'administrador' && !newUser.store_id) {
      toast.error('Selecciona un punto de venta para el usuario');
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const getRoleBadge = (role: AppRole | undefined) => {
    const config = {
      administrador: { label: 'Admin', className: 'bg-primary/20 text-primary' },
      supervisor: { label: 'Supervisor', className: 'bg-warning/20 text-warning' },
      vendedor: { label: 'Vendedor', className: 'bg-accent/20 text-accent' },
    };
    const roleConfig = role ? config[role] : { label: 'Sin rol', className: 'bg-muted text-muted-foreground' };
    return <Badge className={roleConfig.className}>{roleConfig.label}</Badge>;
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Crea y administra usuarios del sistema</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    placeholder="Juan Pérez"
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contraseña Inicial</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: AppRole) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.role !== 'administrador' && (
                  <div className="space-y-2">
                    <Label>Punto de Venta</Label>
                    <Select
                      value={newUser.store_id}
                      onValueChange={(value) => setNewUser({ ...newUser, store_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un PDV" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores?.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button 
                  className="w-full gradient-primary" 
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Usuarios del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Punto de Venta</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => {
                    const userRole = user.user_roles?.[0];
                    const store = stores?.find(s => s.id === userRole?.store_id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {(user.nombre || user.email)?.[0]?.toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{user.nombre || 'Sin nombre'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(userRole?.role)}
                        </TableCell>
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
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
