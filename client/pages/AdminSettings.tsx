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
  Link2
} from "lucide-react";

interface StoreConfig {
  id?: string;
  punto_venta_id: string;
  nombre_negocio: string;
  whatsapp: string;
  direccion: string;
  pdf_tarjeta_url: string;
  logo_url: string;
  descripcion: string;
  horario: string;
}

export default function AdminSettings() {
  const { storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<StoreConfig>>({
    nombre_negocio: "",
    whatsapp: "",
    direccion: "",
    pdf_tarjeta_url: "",
    logo_url: "",
    descripcion: "",
    horario: "",
  });
  const [uploading, setUploading] = useState(false);

  // Fetch existing config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["store-config", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from("configuracion_tienda")
        .select("*")
        .eq("punto_venta_id", storeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !roleLoading && !!storeId,
  });

  // Populate form when config loads
  useEffect(() => {
    if (config) {
      setFormData({
        nombre_negocio: config.nombre_negocio || "",
        whatsapp: config.whatsapp || "",
        direccion: config.direccion || "",
        pdf_tarjeta_url: config.pdf_tarjeta_url || "",
        logo_url: config.logo_url || "",
        descripcion: config.descripcion || "",
        horario: config.horario || "",
      });
    }
  }, [config]);

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<StoreConfig>) => {
      if (!storeId) throw new Error("No store ID");
      
      if (config?.id) {
        // Update existing
        const { error } = await supabase
          .from("configuracion_tienda")
          .update({
            nombre_negocio: data.nombre_negocio,
            whatsapp: data.whatsapp,
            direccion: data.direccion,
            pdf_tarjeta_url: data.pdf_tarjeta_url,
            logo_url: data.logo_url,
            descripcion: data.descripcion,
            horario: data.horario,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("configuracion_tienda")
          .insert({
            punto_venta_id: storeId,
            nombre_negocio: data.nombre_negocio,
            whatsapp: data.whatsapp,
            direccion: data.direccion,
            pdf_tarjeta_url: data.pdf_tarjeta_url,
            logo_url: data.logo_url,
            descripcion: data.descripcion,
            horario: data.horario,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-config"] });
      toast.success("Configuración guardada");
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  // Upload PDF/Image handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'qr') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (type === 'pdf' && file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }
    
    if (type === 'qr' && !file.type.startsWith('image/')) {
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

      const { data: { publicUrl } } = supabase.storage
        .from("tarjetas-digitales")
        .getPublicUrl(fileName);

      if (type === 'pdf') {
        setFormData(prev => ({ ...prev, pdf_tarjeta_url: publicUrl }));
        toast.success("Menú PDF subido correctamente");
      } else {
        setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        toast.success("Imagen de QR subida correctamente");
      }
    } catch (error: any) {
      toast.error("Error al subir archivo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const catalogUrl = storeId 
    ? `${window.location.origin}/catalogo/${storeId}` 
    : "";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (roleLoading || configLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin && !isSupervisor) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Settings className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-2">
            Solo administradores pueden acceder a la configuración.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Administra los datos de tu negocio y enlaces públicos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Info Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Datos del Negocio
              </CardTitle>
              <CardDescription>
                Información que aparecerá en tu catálogo público
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_negocio">Nombre del Negocio</Label>
                  <Input
                    id="nombre_negocio"
                    value={formData.nombre_negocio}
                    onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
                    placeholder="Mi Restaurante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Breve descripción de tu negocio..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="+52 555 123 4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horario" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horario
                    </Label>
                    <Input
                      id="horario"
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      placeholder="Lun-Vie 9am-9pm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, Número, Colonia, Ciudad"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL del Logo</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Catalog & PDF Section */}
          <div className="space-y-6">
            {/* Catalog Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Vitrina Online
                </CardTitle>
                <CardDescription>
                  Comparte este enlace para que tus clientes vean tu catálogo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input value={catalogUrl} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(catalogUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a href={catalogUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCode value={catalogUrl} size={150} />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Escanea para ver el catálogo
                </p>
              </CardContent>
            </Card>

            {/* PDF & QR Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Archivos del Negocio
                </CardTitle>
                <CardDescription>
                  Sube tu menú en PDF y la imagen de tu código QR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF Upload */}
                <div className="space-y-2">
                  <Label>Menú Digital (PDF)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleUpload(e, 'pdf')}
                      className="hidden"
                      id="pdf-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs font-medium">
                        {uploading ? "Subiendo..." : "Subir Menú PDF"}
                      </span>
                    </label>
                  </div>
                  {formData.pdf_tarjeta_url && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={formData.pdf_tarjeta_url} target="_blank" rel="noopener noreferrer">Ver Menú</a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* QR Image Upload */}
                <div className="space-y-2">
                  <Label>Imagen Código QR</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, 'qr')}
                      className="hidden"
                      id="qr-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="qr-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs font-medium">
                        {uploading ? "Subiendo..." : "Subir Imagen QR"}
                      </span>
                    </label>
                  </div>
                  {formData.logo_url && (
                    <div className="mt-2">
                      <img src={formData.logo_url} alt="QR" className="h-20 w-20 mx-auto object-contain" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
