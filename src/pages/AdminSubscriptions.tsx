import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseUntyped } from "@/lib/supabase-untyped";
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
  DialogFooter,
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Download,
  MessageCircle,
  Mail,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { downloadReceiptPDF } from "@/utils/generateReceiptPDF";

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

interface PaymentResult {
  paymentId: string;
  newExpirationDate: string;
  storeName: string;
  storeEmail: string | null;
  storeTelefono: string | null;
  monto: number;
  meses: number;
  notas: string;
}

export default function AdminSubscriptions() {
  const { isAdmin, isSupervisor, loading: roleLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isTestEmailDialogOpen, setIsTestEmailDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingConfirmationEmail, setIsSendingConfirmationEmail] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreWithSubscription | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
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
      const { data: storesData, error: storesError } = await supabaseUntyped
        .from('puntos_venta')
        .select('id, nombre, email, telefono, fecha_vencimiento')
        .order('nombre');

      if (storesError) throw storesError;

      const result: StoreWithSubscription[] = (storesData || []).map((store: any) => ({
        id: store.id,
        nombre: store.nombre,
        email: store.email,
        telefono: store.telefono,
        suscripcion: store.fecha_vencimiento ? {
          id: store.id,
          fecha_vencimiento: store.fecha_vencimiento,
          estado: 'activo',
          monto_pagado: 0
        } : null
      }));

      return result;
    },
    enabled: !roleLoading && canAccess,
  });

  // Register payment mutation
  const registerPaymentMutation = useMutation({
    mutationFn: async (data: { storeId: string; monto: number; meses: number; notas: string }) => {
      const hoy = new Date();
      
      // Get existing store data
      const { data: existingStore } = await supabaseUntyped
        .from('puntos_venta')
        .select('fecha_vencimiento')
        .eq('id', data.storeId)
        .single();

      let nuevaFecha: Date;
      const existingDate = existingStore?.fecha_vencimiento;
      
      if (existingDate && new Date(existingDate) > hoy) {
        nuevaFecha = addMonths(new Date(existingDate), data.meses);
      } else {
        nuevaFecha = addMonths(hoy, data.meses);
      }

      // Update store's fecha_vencimiento
      await supabaseUntyped
        .from('puntos_venta')
        .update({ fecha_vencimiento: format(nuevaFecha, 'yyyy-MM-dd') })
        .eq('id', data.storeId);

      return {
        paymentId: data.storeId,
        newExpirationDate: format(nuevaFecha, 'yyyy-MM-dd')
      };
    },
    onSuccess: (result) => {
      if (selectedStore) {
        setPaymentResult({
          paymentId: result.paymentId,
          newExpirationDate: result.newExpirationDate,
          storeName: selectedStore.nombre,
          storeEmail: selectedStore.email,
          storeTelefono: selectedStore.telefono,
          monto: parseFloat(paymentData.monto),
          meses: parseInt(paymentData.meses),
          notas: paymentData.notas
        });
      }
      setIsPaymentDialogOpen(false);
      setIsSuccessDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: ['stores-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['store-payment-history'] });
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

  const handleDownloadReceipt = () => {
    if (!paymentResult) return;
    
    downloadReceiptPDF({
      paymentId: paymentResult.paymentId,
      storeName: paymentResult.storeName,
      storeEmail: paymentResult.storeEmail,
      amount: paymentResult.monto,
      monthsPaid: paymentResult.meses,
      newExpirationDate: paymentResult.newExpirationDate,
      notes: paymentResult.notas
    });
  };

  const handleSendWhatsApp = () => {
    if (!paymentResult) return;
    
    const phone = paymentResult.storeTelefono?.replace(/\D/g, '') || '';
    const expirationFormatted = format(parseISO(paymentResult.newExpirationDate), "d 'de' MMMM, yyyy", { locale: es });
    
    const message = encodeURIComponent(
      `Hola, adjuntamos el recibo de pago de su suscripción a Caiman POS Connect. Su nuevo vencimiento es el ${expirationFormatted}.`
    );
    
    window.open(`https://wa.me/52${phone}?text=${message}`, '_blank');
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Ingresa un correo electrónico');
      return;
    }

    setIsSendingTestEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-subscription-email', {
        body: {
          type: 'test',
          test_email: testEmail
        }
      });

      if (error) throw error;

      toast.success('Email de prueba enviado correctamente');
      setIsTestEmailDialogOpen(false);
      setTestEmail('');
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error(`Error: ${error.message || 'No se pudo enviar el email'}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSendConfirmationEmail = async () => {
    if (!paymentResult || !paymentResult.storeEmail) {
      toast.error('La tienda no tiene email registrado');
      return;
    }

    setIsSendingConfirmationEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-subscription-email', {
        body: {
          type: 'payment_confirmation',
          store_id: paymentResult.paymentId,
          store_name: paymentResult.storeName,
          store_email: paymentResult.storeEmail,
          new_expiration_date: paymentResult.newExpirationDate,
          payment_amount: paymentResult.monto
        }
      });

      if (error) throw error;

      toast.success('Email de confirmación enviado correctamente');
    } catch (error: any) {
      console.error('Error sending confirmation email:', error);
      toast.error(`Error: ${error.message || 'No se pudo enviar el email'}`);
    } finally {
      setIsSendingConfirmationEmail(false);
    }
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
    setPaymentData({ monto: '', meses: '1', notas: '' });
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

  const closeSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    setPaymentResult(null);
    setSelectedStore(null);
    setPaymentData({ monto: '', meses: '1', notas: '' });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Control de Suscripciones</h1>
            <p className="text-muted-foreground">Gestiona los cobros y pagos de suscripciones</p>
          </div>
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => setIsTestEmailDialogOpen(true)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar email de prueba
            </Button>
          )}
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
                <Label>Monto ($) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentData.monto}
                  onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Meses a Pagar</Label>
                <Select
                  value={paymentData.meses}
                  onValueChange={(value) => setPaymentData({ ...paymentData, meses: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Mes</SelectItem>
                    <SelectItem value="3">3 Meses</SelectItem>
                    <SelectItem value="6">6 Meses</SelectItem>
                    <SelectItem value="12">12 Meses (1 Año)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  placeholder="Ej: Pago con transferencia bancaria"
                  value={paymentData.notas}
                  onChange={(e) => setPaymentData({ ...paymentData, notas: e.target.value })}
                />
              </div>

              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground">Nueva fecha de vencimiento:</p>
                <p className="font-medium text-success">{getExpectedNewDate()}</p>
              </div>

              <Button 
                className="w-full gradient-primary" 
                onClick={handleRegisterPayment}
                disabled={registerPaymentMutation.isPending}
              >
                {registerPaymentMutation.isPending ? 'Registrando...' : 'Guardar Pago'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Dialog with PDF and WhatsApp options */}
        <Dialog open={isSuccessDialogOpen} onOpenChange={closeSuccessDialog}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <DialogTitle className="text-center text-xl">¡Pago Registrado!</DialogTitle>
            </DialogHeader>
            
            {paymentResult && (
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Folio:</span>
                    <span className="font-mono font-medium">{paymentResult.paymentId.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tienda:</span>
                    <span className="font-medium">{paymentResult.storeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-medium">${paymentResult.monto.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">{paymentResult.meses} {paymentResult.meses === 1 ? 'mes' : 'meses'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próximo vencimiento:</span>
                    <span className="font-medium text-success">
                      {format(parseISO(paymentResult.newExpirationDate), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button onClick={handleDownloadReceipt} className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Recibo PDF
                  </Button>
                  
                  {paymentResult.storeTelefono && (
                    <Button variant="outline" onClick={handleSendWhatsApp} className="w-full gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Enviar por WhatsApp
                    </Button>
                  )}

                  {paymentResult.storeEmail && (
                    <Button 
                      variant="outline" 
                      onClick={handleSendConfirmationEmail} 
                      className="w-full gap-2"
                      disabled={isSendingConfirmationEmail}
                    >
                      <Send className="h-4 w-4" />
                      {isSendingConfirmationEmail ? 'Enviando...' : 'Enviar confirmación por Email'}
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="ghost" onClick={closeSuccessDialog} className="w-full">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Email Dialog */}
        <Dialog open={isTestEmailDialogOpen} onOpenChange={setIsTestEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Enviar Email de Prueba
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Ingresa tu correo electrónico para verificar que la configuración de emails está funcionando correctamente.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="test-email">Correo electrónico</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="tu-correo@ejemplo.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsTestEmailDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendTestEmail} 
                disabled={isSendingTestEmail || !testEmail}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSendingTestEmail ? 'Enviando...' : 'Enviar prueba'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// Component to show payment history for a store
function StorePaymentHistory({ storeId }: { storeId: string }) {
  // Since historial_pagos and pagos_suscripcion tables don't exist in the schema,
  // we show a placeholder message
  return (
    <div className="py-4 text-center text-muted-foreground">
      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p>No hay historial de pagos</p>
    </div>
  );
}
