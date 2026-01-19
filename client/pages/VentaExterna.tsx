import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Package,
  Check,
  ExternalLink
} from "lucide-react";

interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function VentaExterna() {
  const { storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");

  // Fetch products
  const { data: productos = [], isLoading: productosLoading } = useQuery({
    queryKey: ["productos-externa", storeId],
    queryFn: async () => {
      if (!storeId) return [];
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
    enabled: !roleLoading && !!storeId,
  });

  // Fetch clients
  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-externa", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("punto_venta_id", storeId)
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !roleLoading && !!storeId,
  });

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (producto: { id: string; nombre: string; precio: number }) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === producto.id);
      if (existing) {
        return prev.map(item => 
          item.id === producto.id 
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        return newQty > 0 ? { ...item, cantidad: newQty } : item;
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const impuesto = subtotal * 0.16;
  const total = subtotal + impuesto;

  // Process external sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async () => {
      if (!storeId || !user) throw new Error("Missing store or user");
      if (cart.length === 0) throw new Error("El carrito está vacío");

      // Create venta as external
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert({
          punto_venta_id: storeId,
          vendedor_id: user.id,
          cliente_id: selectedCliente || null,
          subtotal,
          impuesto,
          total,
          metodo_pago: metodoPago,
          estado: "completada",
          es_externa: true,
        })
        .select()
        .single();
      if (ventaError) throw ventaError;

      // Create venta_items
      const ventaItems = cart.map(item => ({
        venta_id: venta.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: item.precio * item.cantidad,
      }));
      
      const { error: itemsError } = await supabase
        .from("venta_items")
        .insert(ventaItems);
      if (itemsError) throw itemsError;

      // Deduct stock (including insumos from recipes)
      for (const item of cart) {
        // Check if product has receta
        const { data: recetas } = await supabase
          .from("recetas")
          .select("insumo_id, cantidad")
          .eq("producto_final_id", item.id);

        if (recetas && recetas.length > 0) {
          // Deduct insumos based on receta
          for (const receta of recetas) {
            const cantidadDescontar = Number(receta.cantidad) * item.cantidad;
            const { data: insumo } = await supabase
              .from("inventario")
              .select("stock")
              .eq("id", receta.insumo_id)
              .single();
            if (insumo) {
              await supabase
                .from("inventario")
                .update({ stock: Math.max(0, insumo.stock - cantidadDescontar) })
                .eq("id", receta.insumo_id);
            }
          }
        }
        
        // Also deduct the product itself
        const { data: producto } = await supabase
          .from("inventario")
          .select("stock")
          .eq("id", item.id)
          .single();
        
        if (producto) {
          await supabase
            .from("inventario")
            .update({ stock: Math.max(0, producto.stock - item.cantidad) })
            .eq("id", item.id);
        }
      }

      return total;
    },
    onSuccess: (total) => {
      queryClient.invalidateQueries({ queryKey: ["productos-externa"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast.success(`Venta externa registrada: $${total.toFixed(2)}`);
      setCart([]);
      setSelectedCliente("");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  if (roleLoading) {
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
          <ExternalLink className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-2">
            Solo administradores pueden registrar ventas externas.
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Registrar Pedido Externo
          </h1>
          <p className="text-muted-foreground">
            Registra ventas de pedidos por WhatsApp, catálogo online o tarjeta digital
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Products Grid */}
            {productosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay productos disponibles</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((producto) => {
                  const inCart = cart.find(item => item.id === producto.id);
                  return (
                    <Card 
                      key={producto.id} 
                      className={`cursor-pointer transition-all duration-200 ${
                        inCart ? 'ring-2 ring-primary' : 'hover:border-primary/50'
                      }`}
                      onClick={() => addToCart(producto)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-video bg-secondary/30 rounded-lg mb-3 flex items-center justify-center relative">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          {inCart && (
                            <Badge className="absolute -top-2 -right-2 bg-primary">
                              {inCart.cantidad}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground truncate">{producto.nombre}</h3>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-lg font-bold text-primary">
                            ${producto.precio.toFixed(2)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            Stock: {producto.stock}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <Card className="h-fit sticky top-20">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Pedido Externo
              </CardTitle>
              <CardDescription>
                Productos del pedido recibido
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cliente (opcional)</label>
                <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin cliente</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pago</label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Efectivo">Efectivo</SelectItem>
                    <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="Transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Selecciona los productos del pedido</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.precio.toFixed(2)} x {item.cantidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">{item.cantidad}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (16%)</span>
                      <span>${impuesto.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <Button 
                    className="w-full gap-2"
                    onClick={() => processSaleMutation.mutate()}
                    disabled={processSaleMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                    {processSaleMutation.isPending ? "Procesando..." : "Confirmar Venta Externa"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
