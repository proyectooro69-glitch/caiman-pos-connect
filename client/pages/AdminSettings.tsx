import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import QRCode from "@/components/QRCode";
import { 
  Settings, 
  Upload, 
  FileText, 
  Store, 
  Phone, 
  MapPin, 
  Clock,
  ExternalLink,
  Copy,
  Link2,
  Globe,
  Receipt,
  CreditCard as PaymentIcon,
  Mail
} from "lucide-react";

interface GlobalSettings {
  id?: string;
  puntoVentaId: string;
  nombreNegocio: string;
  logoUrl: string;
  direccion: string;
  telefono: string;
  correo: string;
  moneda: string;
  zonaHoraria: string;
  porcentajeIva: string;
  mensajeLegal: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  paypalClientId: string;
  transfermovilPhone: string;
  transfermovilCardCup: string;
  walletAddressUsdt: string;
  cryptoNetwork: string;
  currencyCode: string;
}

export default function AdminSettings() {
  const { storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<GlobalSettings>>({
    nombreNegocio: "",
    logoUrl: "",
    direccion: "",
    telefono: "",
    correo: "",
    moneda: "USD",
    zonaHoraria: "UTC",
    porcentajeIva: "16.00",
    mensajeLegal: "",
    stripePublicKey: "",
    stripeSecretKey: "",
    paypalClientId: "",
    transfermovilPhone: "",
    transfermovilCardCup: "",
    walletAddressUsdt: "",
    cryptoNetwork: "",
    currencyCode: "USD",
  });
  const [uploading, setUploading] = useState(false);

  // Fetch existing global settings via proxy
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["global-settings", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const response = await fetch(`/api/settings/${storeId}`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    enabled: !roleLoading && !!storeId,
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<GlobalSettings>) => {
      if (!storeId) throw new Error("No store ID");
      
      const method = settings?.id ? "PATCH" : "POST";
      const url = settings?.id 
        ? `/api/settings/${storeId}`
        : `/api/settings`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, puntoVentaId: storeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-settings"] });
      toast.success("Configuración global guardada");
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Solo se permiten imágenes");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}-${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("tarjetas-digitales")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("tarjetas-digitales").getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success("Logo subido correctamente");
    } catch (error: any) {
      toast.error("Error al subir: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (roleLoading || settingsLoading) {
    return <AppLayout><div className="p-6"><Skeleton className="h-96 w-full" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración Global</h1>
          <p className="text-muted-foreground">Gestiona todos los parámetros de tu POS</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="negocio" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:max-w-2xl">
              <TabsTrigger value="negocio" className="gap-2"><Store className="h-4 w-4"/> Negocio</TabsTrigger>
              <TabsTrigger value="localizacion" className="gap-2"><Globe className="h-4 w-4"/> Localización</TabsTrigger>
              <TabsTrigger value="facturacion" className="gap-2"><Receipt className="h-4 w-4"/> Facturación</TabsTrigger>
              <TabsTrigger value="pagos" className="gap-2"><PaymentIcon className="h-4 w-4"/> Pagos y Moneda</TabsTrigger>
            </TabsList>

            <TabsContent value="negocio">
              <Card>
                <CardHeader><CardTitle>Datos del Negocio</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre del Negocio</Label>
                      <Input value={formData.nombreNegocio} onChange={e => setFormData({...formData, nombreNegocio: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo de Contacto</Label>
                      <Input type="email" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.logoUrl && <img src={formData.logoUrl} className="h-12 w-12 rounded object-cover" />}
                      <Input type="file" accept="image/*" onChange={e => handleUpload(e, 'logo')} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="localizacion">
              <Card>
                <CardHeader><CardTitle>Moneda y Horario</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Moneda Principal</Label>
                      <Select value={formData.moneda} onValueChange={v => setFormData({...formData, moneda: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">Dólar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="PYG">Guaraní (PYG)</SelectItem>
                          <SelectItem value="CUP">Peso Cubano (CUP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Zona Horaria</Label>
                      <Select value={formData.zonaHoraria} onValueChange={v => setFormData({...formData, zonaHoraria: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/Mexico_City">Mexico City</SelectItem>
                          <SelectItem value="America/Asuncion">Asunción</SelectItem>
                          <SelectItem value="America/Havana">Havana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="facturacion">
              <Card>
                <CardHeader><CardTitle>Parámetros Fiscales</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 w-1/2">
                    <Label>% de IVA</Label>
                    <Input type="number" step="0.01" value={formData.porcentajeIva} onChange={e => setFormData({...formData, porcentajeIva: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje Legal en Recibos</Label>
                    <Textarea rows={4} value={formData.mensajeLegal} onChange={e => setFormData({...formData, mensajeLegal: e.target.value})} placeholder="Gracias por su compra..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pagos">
              <Card>
                <CardHeader><CardTitle>Pasarelas de Pago y Moneda Regional</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Moneda de Transacción (Código)</Label>
                      <Select value={formData.currencyCode} onValueChange={v => setFormData({...formData, currencyCode: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">Dólar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          <SelectItem value="PYG">Guaraní (PYG)</SelectItem>
                          <SelectItem value="CUP">Peso Cubano (CUP)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">PYG aplicará formato sin decimales y separador de miles.</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Pasarelas Digitales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stripe Public Key</Label>
                        <Input value={formData.stripePublicKey} onChange={e => setFormData({...formData, stripePublicKey: e.target.value})} placeholder="pk_live_..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Stripe Secret Key</Label>
                        <Input type="password" value={formData.stripeSecretKey ? "********" : ""} onChange={e => setFormData({...formData, stripeSecretKey: e.target.value})} placeholder="sk_live_..." />
                      </div>
                      <div className="space-y-2">
                        <Label>PayPal Client ID</Label>
                        <Input value={formData.paypalClientId} onChange={e => setFormData({...formData, paypalClientId: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Transferencia Local (CUP)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Teléfono Transfermóvil</Label>
                        <Input value={formData.transfermovilPhone} onChange={e => setFormData({...formData, transfermovilPhone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tarjeta CUP</Label>
                        <Input value={formData.transfermovilCardCup} onChange={e => setFormData({...formData, transfermovilCardCup: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Criptomonedas (USDT)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Billetera USDT Address</Label>
                        <Input value={formData.walletAddressUsdt} onChange={e => setFormData({...formData, walletAddressUsdt: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Red (Network)</Label>
                        <Select value={formData.cryptoNetwork} onValueChange={v => setFormData({...formData, cryptoNetwork: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRC20">TRON (TRC20)</SelectItem>
                            <SelectItem value="ERC20">Ethereum (ERC20)</SelectItem>
                            <SelectItem value="BEP20">BSC (BEP20)</SelectItem>
                            <SelectItem value="POLYGON">Polygon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button type="submit" className="w-full lg:w-auto px-12" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Guardando..." : "Guardar Todos los Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
