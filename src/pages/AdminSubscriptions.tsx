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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Store, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, addMonths } from "date-fns";
import { es } from "date-fns/locale";

interface StoreWithSubscription {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  fecha_vencimiento: string | null;
}

export default function AdminSubscriptions() {
  const { isAdmin, isSupervisor, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithSubscription | null>(null);
  const [paymentData, setPaymentData] = useState({
    monto: '',
    meses: '1',
    notas: ''
  });

  const canAccess = isAdmin || isSupervisor;

  // Fetch all stores with subscription info
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('puntos_venta')
        .select('id, nombre, email, telefono, fecha_vencimiento')
        .order('nombre');

      if (error) throw error;
      return data as StoreWithSubscription[];
    },
    enabled: !roleLoading && canAccess,
  });

  // Fetch payment history
  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['payment-history', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];
      const { data, error } = await supabase
        .from('pagos_suscripcion')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('fecha_pago', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStore?.id,
  });

  // Register payment mutation - using direct insert until RPC is created
  const registerPaymentMutation = useMutation({
    mutationFn: async (data: { storeId: string; monto: number; meses: number; notas: string }) => {
      // First get current expiration date
      const { data: store } = await supabase
        .from('puntos_venta')
        .select('fecha_vencimiento')
        .eq('id', data.storeId)
        .maybeSingle();
      
      // Calculate new expiration date
      const storeData = store as { fecha_vencimiento: string | null } | null;
      const baseDate = storeData?.fecha_vencimiento 
        ? new Date(Math.max(new Date(storeData.fecha_vencimiento).getTime(), new Date().getTime()))
        : new Date();
      const newExpDate = addMonths(baseDate, data.meses);
      const newExpDateStr = format(newExpDate, 'yyyy-MM-dd');
      
      // Insert payment record using raw query to avoid type issues
      const { error: insertError } = await (supabase as any)
        .from('pagos_suscripcion')
        .insert({
          store_id: data.storeId,
          monto: data.monto,
          meses_pagados: data.meses,
          fecha_vencimiento: newExpDateStr,
          notas: data.notas || null
        });

      if (insertError) throw insertError;
      
      // Update store expiration date
      const { error: updateError } = await (supabase as any)
        .from('puntos_venta')
        .update({ fecha_vencimiento: newExpDateStr })
        .eq('id', data.storeId);

      if (updateError) throw updateError;
      
      return true;
    },
    onSuccess: () => {
      toast.success('Pago registrado exitosamente');
      setIsPaymentDialogOpen(false);
      setSelectedStore(null);
      setPaymentData({ monto: '', meses: '1', notas: '' });
      queryClient.invalidateQueries({ queryKey: ['stores-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['payment-history'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleRegisterPayment = () => {
    if (!selectedStore || !paymentData.monto) {
      toast.error('El monto es requerido');
      return;
    }
    
    const monto = parseFloat(paymentData.monto);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    registerPaymentMutation.mutate({
      storeId: selectedStore.id,
      monto,
      meses: parseInt(paymentData.meses),
      notas: paymentData.notas
    });
  };

  const getSubscriptionStatus = (fechaVencimiento: string | null) => {
    if (!fechaVencimiento) {
      return { status: 'sin_suscripcion', days: 0, label: 'Sin suscripción', color: 'bg-muted text-muted-foreground' };
    }
    
    const today = new Date();
    const expDate = parseISO(fechaVencimiento);
    const days = differenceInDays(expDate, today);
    
    if (days < 0) {
      return { status: 'vencido', days: Math.abs(days), label: `Vencido hace ${Math.abs(days)} días`, color: 'bg-destructive text-destructive-foreground' };
    } else if (days <= 7) {
      return { status: 'por_vencer', days, label: `Vence en ${days} días`, color: 'bg-warning text-warning-foreground' };
    } else {
      return { status: 'activo', days, label: `${days} días restantes`, color: 'bg-success text-success-foreground' };
    }
  };

  const openPaymentDialog = (store: StoreWithSubscription) => {
    setSelectedStore(store);
    setIsPaymentDialogOpen(true);
  };

  const getExpectedNewDate = () => {
    if (!selectedStore) return '';
    const baseDate = selectedStore.fecha_vencimiento 
      ? new Date(Math.max(parseISO(selectedStore.fecha_vencimiento).getTime(), new Date().getTime()))
      : new Date();
    const newDate = addMonths(baseDate, parseInt(paymentData.meses));
    return format(newDate, "d 'de' MMMM, yyyy", { locale: es });
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <Skeleton className="h-96 w-full" />
      </AppLayout>
    );
  }

  if (!canAccess) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo administradores y supervisores pueden acceder.</p>
        </div>
      </AppLayout>
    );
  }

  // Sort stores: expired first, then by expiration date
  const sortedStores = [...stores].sort((a, b) => {
    const statusA = getSubscriptionStatus(a.fecha_vencimiento);
    const statusB = getSubscriptionStatus(b.fecha_vencimiento);
    
    // Vencidos primero
    if (statusA.status === 'vencido' && statusB.status !== 'vencido') return -1;
    if (statusB.status === 'vencido' && statusA.status !== 'vencido') return 1;
    
    // Por vencer segundo
    if (statusA.status === 'por_vencer' && statusB.status === 'activo') return -1;
    if (statusB.status === 'por_vencer' && statusA.status === 'activo') return 1;
    
    // Sin suscripción al final
    if (statusA.status === 'sin_suscripcion') return 1;
    if (statusB.status === 'sin_suscripcion') return -1;
    
    return 0;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Suscripciones</h1>
          <p className="text-muted-foreground">Administra los pagos y vencimientos de las tiendas</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stores.length}</p>
                  <p className="text-sm text-muted-foreground">Total Tiendas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stores.filter(s => getSubscriptionStatus(s.fecha_vencimiento).status === 'activo').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Al Día</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stores.filter(s => getSubscriptionStatus(s.fecha_vencimiento).status === 'por_vencer').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Por Vencer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stores.filter(s => getSubscriptionStatus(s.fecha_vencimiento).status === 'vencido').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stores Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Estado de Suscripciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay tiendas registradas
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tienda</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStores.map((store) => {
                    const status = getSubscriptionStatus(store.fecha_vencimiento);
                    return (
                      <TableRow key={store.id} className={status.status === 'vencido' ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                              status.status === 'vencido' ? 'bg-destructive/10' : 
                              status.status === 'activo' ? 'bg-success/10' : 'bg-muted'
                            }`}>
                              <Store className={`h-5 w-5 ${
                                status.status === 'vencido' ? 'text-destructive' : 
                                status.status === 'activo' ? 'text-success' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <span className="font-medium">{store.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {store.email && <div>{store.email}</div>}
                            {store.telefono && <div className="text-muted-foreground">{store.telefono}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {store.fecha_vencimiento ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(parseISO(store.fecha_vencimiento), "d MMM yyyy", { locale: es })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No definida</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => openPaymentDialog(store)}
                            className="gradient-primary"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Registrar Pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pago - {selectedStore?.nombre}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Current Status */}
              {selectedStore && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Estado actual:</p>
                  <p className="font-medium">
                    {selectedStore.fecha_vencimiento 
                      ? `Vence: ${format(parseISO(selectedStore.fecha_vencimiento), "d 'de' MMMM, yyyy", { locale: es })}`
                      : 'Sin fecha de vencimiento'
                    }
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Monto Pagado *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentData.monto}
                  onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Meses a Agregar</Label>
                <Select
                  value={paymentData.meses}
                  onValueChange={(value) => setPaymentData({ ...paymentData, meses: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mes</SelectItem>
                    <SelectItem value="3">3 meses</SelectItem>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  placeholder="Ej: Pago con transferencia"
                  value={paymentData.notas}
                  onChange={(e) => setPaymentData({ ...paymentData, notas: e.target.value })}
                />
              </div>

              {/* New expiration preview */}
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground">Nueva fecha de vencimiento:</p>
                <p className="font-medium text-success">{getExpectedNewDate()}</p>
              </div>

              {/* Recent payments */}
              {paymentHistory.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Últimos pagos:</Label>
                  <div className="space-y-1 text-sm">
                    {paymentHistory.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between text-muted-foreground">
                        <span>{format(parseISO(payment.fecha_pago), "d MMM yyyy", { locale: es })}</span>
                        <span>${payment.monto} ({payment.meses_pagados} mes{payment.meses_pagados > 1 ? 'es' : ''})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                className="w-full gradient-primary" 
                onClick={handleRegisterPayment}
                disabled={registerPaymentMutation.isPending}
              >
                {registerPaymentMutation.isPending ? 'Registrando...' : 'Confirmar Pago'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
