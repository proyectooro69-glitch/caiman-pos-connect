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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Store, 
  CreditCard, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  History
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, addMonths } from "date-fns";
import { es } from "date-fns/locale";

interface StoreWithSubscription {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  suscripcion: {
    id: string;
    fecha_vencimiento: string | null;
    estado: string;
    monto_pagado: number;
  } | null;
}

interface HistorialPago {
  id: string;
  monto: number;
  meses_pagados: number;
  fecha_pago: string;
  fecha_vencimiento_anterior: string | null;
  fecha_vencimiento_nueva: string;
  notas: string | null;
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
      // Get stores
      const { data: storesData, error: storesError } = await supabase
        .from('puntos_venta')
        .select('id, nombre, email, telefono')
        .order('nombre');

      if (storesError) throw storesError;

      // Get subscriptions
      const { data: suscripciones } = await supabase
        .from('suscripciones')
        .select('*');

      const suscripcionMap = new Map();
      (suscripciones || []).forEach((s: any) => {
        suscripcionMap.set(s.store_id, s);
      });

      // Also check puntos_venta.fecha_vencimiento as fallback
      const result: StoreWithSubscription[] = storesData.map((store: any) => {
        const sub = suscripcionMap.get(store.id);
        return {
          id: store.id,
          nombre: store.nombre,
          email: store.email,
          telefono: store.telefono,
          suscripcion: sub ? {
            id: sub.id,
            fecha_vencimiento: sub.fecha_vencimiento,
            estado: sub.estado,
            monto_pagado: sub.monto_pagado
          } : null
        };
      });

      return result;
    },
    enabled: !roleLoading && canAccess,
  });

  // Fetch payment history for a store
  const { data: paymentHistory = [] } = useQuery({
    queryKey: ['payment-history', selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore?.id) return [];
      
      const { data, error } = await supabase
        .from('historial_pagos')
        .select('*')
        .eq('store_id', selectedStore.id)
        .order('fecha_pago', { ascending: false })
        .limit(10);

      if (error) {
        // Fallback to pagos_suscripcion if historial_pagos doesn't exist
        const { data: fallbackData } = await supabase
          .from('pagos_suscripcion')
          .select('*')
          .eq('store_id', selectedStore.id)
          .order('fecha_pago', { ascending: false })
          .limit(10);
        
        return (fallbackData || []).map((p: any) => ({
          id: p.id,
          monto: p.monto,
          meses_pagados: p.meses_pagados,
          fecha_pago: p.fecha_pago,
          fecha_vencimiento_anterior: null,
          fecha_vencimiento_nueva: p.fecha_vencimiento,
          notas: p.notas
        }));
      }
      
      return data as HistorialPago[];
    },
    enabled: !!selectedStore?.id,
  });

  // Register payment mutation
  const registerPaymentMutation = useMutation({
    mutationFn: async (data: { storeId: string; monto: number; meses: number; notas: string }) => {
      const hoy = new Date();
      
      // Get or check existing subscription
      const { data: existingSub } = await (supabase as any)
        .from('suscripciones')
        .select('*')
        .eq('store_id', data.storeId)
        .maybeSingle();

      let fechaAnterior: string | null = null;
      let nuevaFecha: Date;

      if (existingSub) {
        fechaAnterior = existingSub.fecha_vencimiento;
        const baseDate = existingSub.fecha_vencimiento && new Date(existingSub.fecha_vencimiento) > hoy
          ? new Date(existingSub.fecha_vencimiento)
          : hoy;
        nuevaFecha = addMonths(baseDate, data.meses);

        // Update subscription
        await (supabase as any)
          .from('suscripciones')
          .update({
            monto_pagado: existingSub.monto_pagado + data.monto,
            fecha_vencimiento: format(nuevaFecha, 'yyyy-MM-dd'),
            estado: 'activo'
          })
          .eq('id', existingSub.id);
      } else {
        nuevaFecha = addMonths(hoy, data.meses);
        
        // Create new subscription
        await (supabase as any)
          .from('suscripciones')
          .insert({
            store_id: data.storeId,
            monto_pagado: data.monto,
            fecha_inicio: format(hoy, 'yyyy-MM-dd'),
            fecha_vencimiento: format(nuevaFecha, 'yyyy-MM-dd'),
            estado: 'activo'
          });
      }

      // Also update puntos_venta for backwards compatibility
      await (supabase as any)
        .from('puntos_venta')
        .update({ fecha_vencimiento: format(nuevaFecha, 'yyyy-MM-dd') })
        .eq('id', data.storeId);

      // Record in historial_pagos
      const { data: subForHistory } = await (supabase as any)
        .from('suscripciones')
        .select('id')
        .eq('store_id', data.storeId)
        .single();

      if (subForHistory) {
        await (supabase as any)
          .from('historial_pagos')
          .insert({
            suscripcion_id: subForHistory.id,
            store_id: data.storeId,
            monto: data.monto,
            meses_pagados: data.meses,
            fecha_vencimiento_anterior: fechaAnterior,
            fecha_vencimiento_nueva: format(nuevaFecha, 'yyyy-MM-dd'),
            notas: data.notas || null
          });
      }

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

  const getSubscriptionStatus = (store: StoreWithSubscription) => {
    const fechaVencimiento = store.suscripcion?.fecha_vencimiento;
    
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
    const fechaVenc = selectedStore.suscripcion?.fecha_vencimiento;
    const baseDate = fechaVenc 
      ? new Date(Math.max(parseISO(fechaVenc).getTime(), new Date().getTime()))
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
    const statusA = getSubscriptionStatus(a);
    const statusB = getSubscriptionStatus(b);
    
    if (statusA.status === 'vencido' && statusB.status !== 'vencido') return -1;
    if (statusB.status === 'vencido' && statusA.status !== 'vencido') return 1;
    if (statusA.status === 'por_vencer' && statusB.status === 'activo') return -1;
    if (statusB.status === 'por_vencer' && statusA.status === 'activo') return 1;
    if (statusA.status === 'sin_suscripcion') return 1;
    if (statusB.status === 'sin_suscripcion') return -1;
    
    return 0;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Cobros</h1>
          <p className="text-muted-foreground">Administra los pagos y suscripciones de las tiendas</p>
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
                    {stores.filter(s => getSubscriptionStatus(s).status === 'activo').length}
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
                    {stores.filter(s => getSubscriptionStatus(s).status === 'por_vencer').length}
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
                    {stores.filter(s => getSubscriptionStatus(s).status === 'vencido').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stores with Accordion for History */}
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
              <Accordion type="single" collapsible className="space-y-2">
                {sortedStores.map((store) => {
                  const status = getSubscriptionStatus(store);
                  return (
                    <AccordionItem 
                      key={store.id} 
                      value={store.id}
                      className={`border rounded-lg px-4 ${status.status === 'vencido' ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center justify-between w-full pr-4">
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
                            <div className="text-left">
                              <p className="font-medium">{store.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                                {store.suscripcion?.fecha_vencimiento 
                                  ? `Vence: ${format(parseISO(store.suscripcion.fecha_vencimiento), "d MMM yyyy", { locale: es })}`
                                  : 'Sin fecha de vencimiento'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentDialog(store);
                              }}
                              className="gradient-primary"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Registrar Pago
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <StorePaymentHistory storeId={store.id} />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
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
                    {selectedStore.suscripcion?.fecha_vencimiento 
                      ? `Vence: ${format(parseISO(selectedStore.suscripcion.fecha_vencimiento), "d 'de' MMMM, yyyy", { locale: es })}`
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
                    <SelectItem value="2">2 meses</SelectItem>
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

// Component to show payment history for a store
function StorePaymentHistory({ storeId }: { storeId: string }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['store-payment-history', storeId],
    queryFn: async () => {
      // Try historial_pagos first
      const { data, error } = await supabase
        .from('historial_pagos')
        .select('*')
        .eq('store_id', storeId)
        .order('fecha_pago', { ascending: false })
        .limit(5);

      if (error) {
        // Fallback to pagos_suscripcion
        const { data: fallbackData } = await supabase
          .from('pagos_suscripcion')
          .select('*')
          .eq('store_id', storeId)
          .order('fecha_pago', { ascending: false })
          .limit(5);
        
        return (fallbackData || []).map((p: any) => ({
          id: p.id,
          monto: p.monto,
          meses_pagados: p.meses_pagados,
          fecha_pago: p.fecha_pago,
          fecha_vencimiento_nueva: p.fecha_vencimiento,
          notas: p.notas
        }));
      }
      
      return data || [];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (history.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No hay historial de pagos</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <History className="h-4 w-4" />
        Historial de Pagos
      </h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Meses</TableHead>
            <TableHead>Nueva Fecha</TableHead>
            <TableHead>Notas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((pago: any) => (
            <TableRow key={pago.id}>
              <TableCell>
                {format(parseISO(pago.fecha_pago), "d MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="font-medium">${pago.monto}</TableCell>
              <TableCell>{pago.meses_pagados} mes{pago.meses_pagados > 1 ? 'es' : ''}</TableCell>
              <TableCell>
                {format(parseISO(pago.fecha_vencimiento_nueva), "d MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {pago.notas || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
