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
  Store, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Users,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminStores() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStore, setNewStore] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    web: '',
  });

  // Fetch all stores
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_venta')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data ?? [];
    },
    enabled: !roleLoading && isAdmin,
  });

  // Create store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (storeData: { nombre: string; direccion: string; telefono: string; email: string; web: string }) => {
      const insertData = {
        nombre: storeData.nombre,
        direccion: storeData.direccion || null,
        telefono: storeData.telefono || null,
        email: storeData.email || null,
        web: storeData.web || null,
      };
      
      const { data, error } = await supabase
        .from('puntos_venta')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Punto de venta creado exitosamente');
      setIsDialogOpen(false);
      setNewStore({ nombre: '', direccion: '', telefono: '', email: '', web: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleCreateStore = () => {
    if (!newStore.nombre) {
      toast.error('El nombre es requerido');
      return;
    }
    createStoreMutation.mutate(newStore);
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
            <h1 className="text-3xl font-bold text-foreground">Puntos de Venta</h1>
            <p className="text-muted-foreground">Administra las tiendas y sucursales</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo PDV
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Crear Punto de Venta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Sucursal Centro"
                    value={newStore.nombre}
                    onChange={(e) => setNewStore({ ...newStore, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input
                    placeholder="Calle Principal #123"
                    value={newStore.direccion}
                    onChange={(e) => setNewStore({ ...newStore, direccion: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      placeholder="+1 234 567 890"
                      value={newStore.telefono}
                      onChange={(e) => setNewStore({ ...newStore, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="tienda@ejemplo.com"
                      value={newStore.email}
                      onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sitio Web</Label>
                  <Input
                    placeholder="https://mitienda.com"
                    value={newStore.web}
                    onChange={(e) => setNewStore({ ...newStore, web: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full gradient-primary" 
                  onClick={handleCreateStore}
                  disabled={createStoreMutation.isPending}
                >
                  {createStoreMutation.isPending ? 'Creando...' : 'Crear Punto de Venta'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : stores?.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Sin Puntos de Venta</h3>
              <p className="text-muted-foreground mb-4">Crea tu primer punto de venta para empezar</p>
              <Button className="gradient-primary" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear PDV
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores?.map((store) => (
              <Card key={store.id} className="glass-card hover:border-primary/50 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{store.nombre}</CardTitle>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20 mt-1">
                          Activo
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {store.direccion && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{store.direccion}</span>
                    </div>
                  )}
                  {store.telefono && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{store.telefono}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{store.email}</span>
                    </div>
                  )}
                  {store.web && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <a href={store.web} target="_blank" rel="noopener noreferrer" className="truncate hover:text-primary">
                        {store.web}
                      </a>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Usuarios</span>
                      </div>
                      <Badge variant="secondary">0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
