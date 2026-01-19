import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
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
  AlertTriangle,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

const getSubscriptionStatus = (fechaVencimiento: string | null) => {
  if (!fechaVencimiento) {
    return { status: 'sin_suscripcion', label: 'Sin suscripción', badgeClass: 'bg-muted text-muted-foreground' };
  }
  
  const today = new Date();
  const expDate = parseISO(fechaVencimiento);
  const days = differenceInDays(expDate, today);
  
  if (days < 0) {
    return { status: 'vencido', label: 'Vencido', badgeClass: 'bg-destructive text-destructive-foreground' };
  } else if (days <= 7) {
    return { status: 'por_vencer', label: `Vence en ${days}d`, badgeClass: 'bg-warning text-warning-foreground' };
  } else {
    return { status: 'activo', label: 'Activo', badgeClass: 'bg-success text-success-foreground' };
  }
};

export default function AdminStores() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [searchParams] = useSearchParams();
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

  // If coming from setup CTA and there are no stores yet, open the create dialog automatically
  useEffect(() => {
    const shouldAutoOpen = searchParams.get('setup') === '1';
    if (!roleLoading && isAdmin && !isLoading && stores.length === 0 && shouldAutoOpen) {
      setIsDialogOpen(true);
    }
  }, [searchParams, roleLoading, isAdmin, isLoading, stores.length]);

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
            {stores?.map((store) => {
              const storeData = store as any;
              const subscriptionStatus = getSubscriptionStatus(storeData.fecha_vencimiento);
              const isExpired = subscriptionStatus.status === 'vencido';
              
              return (
                <Card 
                  key={store.id} 
                  className={`glass-card hover:border-primary/50 transition-all duration-200 ${
                    isExpired ? 'border-destructive/50 bg-destructive/5' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          isExpired ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}>
                          <Store className={`h-6 w-6 ${isExpired ? 'text-destructive' : 'text-primary'}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{store.nombre}</CardTitle>
                          <Badge className={subscriptionStatus.badgeClass + ' mt-1'}>
                            {subscriptionStatus.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {storeData.fecha_vencimiento && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>Vence: {format(parseISO(storeData.fecha_vencimiento), "d MMM yyyy", { locale: es })}</span>
                      </div>
                    )}
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
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
