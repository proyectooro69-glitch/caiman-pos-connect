import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Package, Phone, MapPin, Clock, Store } from "lucide-react";

export default function Catalogo() {
  const { storeId } = useParams<{ storeId: string }>();

  // Fetch store config (public access)
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["store-config-public", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracion_tienda")
        .select("*")
        .eq("punto_venta_id", storeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // Fetch store info
  const { data: store } = useQuery({
    queryKey: ["store-public", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("puntos_venta")
        .select("*")
        .eq("id", storeId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // Fetch products (public access - only producto_final with stock)
  const { data: productos = [], isLoading: productosLoading } = useQuery({
    queryKey: ["catalogo-productos", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario")
        .select("*")
        .eq("punto_venta_id", storeId)
        .eq("tipo", "producto_final")
        .gt("stock", 0)
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });

  const handleWhatsAppOrder = (producto: { nombre: string; precio: number }) => {
    const whatsappNumber = config?.whatsapp?.replace(/\D/g, "") || "";
    const message = encodeURIComponent(
      `¡Hola! Me interesa pedir:\n\n*${producto.nombre}*\nPrecio: $${producto.precio.toFixed(2)}\n\n¿Está disponible?`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  if (!storeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">Tienda no encontrada</h1>
          <p className="text-muted-foreground mt-2">
            El enlace del catálogo no es válido.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = configLoading || productosLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {config?.logo_url ? (
              <img 
                src={config.logo_url} 
                alt={config.nombre_negocio || "Logo"} 
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {config?.nombre_negocio || store?.nombre || "Catálogo"}
              </h1>
              {config?.descripcion && (
                <p className="text-sm text-muted-foreground">{config.descripcion}</p>
              )}
            </div>
          </div>
          
          {/* Contact info */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
            {config?.direccion && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{config.direccion}</span>
              </div>
            )}
            {config?.horario && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{config.horario}</span>
              </div>
            )}
            {config?.whatsapp && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{config.whatsapp}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Nuestros Productos</h2>
          <Badge variant="secondary">{productos.length} productos</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No hay productos disponibles</h3>
            <p className="text-muted-foreground mt-2">
              El catálogo de esta tienda está vacío o los productos están agotados.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <Card 
                key={producto.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Product Image */}
                <div className="aspect-square bg-secondary/30 relative">
                  {producto.imagen_url ? (
                    <img 
                      src={producto.imagen_url} 
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <Badge 
                    className="absolute top-2 right-2"
                    variant={producto.stock > 10 ? "default" : "secondary"}
                  >
                    {producto.stock > 10 ? "Disponible" : `${producto.stock} disponibles`}
                  </Badge>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground truncate">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {producto.descripcion}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-2xl font-bold text-primary">
                      ${producto.precio.toFixed(2)}
                    </span>
                    
                    {config?.whatsapp && (
                      <Button 
                        size="sm"
                        className="gap-2"
                        onClick={() => handleWhatsAppOrder(producto)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Pedir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Caiman POS</p>
          {config?.whatsapp && (
            <Button
              variant="link"
              className="mt-2 gap-2"
              onClick={() => {
                const whatsappNumber = config.whatsapp?.replace(/\D/g, "") || "";
                window.open(`https://wa.me/${whatsappNumber}`, "_blank");
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Contáctanos por WhatsApp
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
