import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExtrasModal, Extra } from "@/components/pos/ExtrasModal";
import { AssignmentSelector } from "@/components/pos/AssignmentSelector";
import {
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote,
  Search,
  Package,
  Settings
} from "lucide-react";
import { toast } from "sonner";

const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CartItem {
  id: string;
  cartItemId: string; // Unique ID for each cart entry
  nombre: string;
  precio: number;
  cantidad: number;
  extras: Extra[];
  extrasTotal: number;
}

export default function Ventas() {
  const { role, storeId, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Assignment state
  const [assignmentType, setAssignmentType] = useState<'none' | 'mesa' | 'cliente'>('none');
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  
  // Extras modal state
  const [extrasModalOpen, setExtrasModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; nombre: string; precio: number } | null>(null);

  // Fetch products for the user's store
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ['productos-venta', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('punto_venta_id', storeId)
        .eq('tipo', 'producto_final')
        .gt('stock', 0)
        .order('nombre');

      if (error) throw error;
      return data ?? [];
    },
    enabled: !roleLoading && !!storeId,
  });

  const filteredProducts = productos?.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleProductClick = (product: { id: string; nombre: string; precio: number }) => {
    setSelectedProduct(product);
    setExtrasModalOpen(true);
  };

  const handleAddToCart = (product: { id: string; nombre: string; precio: number }, extras: Extra[]) => {
    const extrasTotal = extras.reduce((sum, e) => sum + e.precio, 0);
    const cartItemId = `${product.id}-${Date.now()}`;
    
    setCart(prev => [...prev, {
      id: product.id,
      cartItemId,
      nombre: product.nombre,
      precio: product.precio,
      cantidad: 1,
      extras,
      extrasTotal,
    }]);
    
    setExtrasModalOpen(false);
    setSelectedProduct(null);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = item.cantidad + delta;
        return newQty > 0 ? { ...item, cantidad: newQty } : item;
      }
      return item;
    }).filter(item => item.cantidad > 0));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + ((item.precio + item.extrasTotal) * item.cantidad), 0);
  const impuesto = subtotal * 0.16;
  const total = subtotal + impuesto;

  // Process sale mutation
  const processSaleMutation = useMutation({
    mutationFn: async (metodoPago: string) => {
      if (!storeId || !user) throw new Error("Missing store or user");
      if (cart.length === 0) throw new Error("El carrito está vacío");

      // Create venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert({
          punto_venta_id: storeId,
          vendedor_id: user.id,
          mesa_id: assignmentType === 'mesa' ? assignmentId : null,
          cliente_id: assignmentType === 'cliente' ? assignmentId : null,
          subtotal,
          impuesto,
          total,
          metodo_pago: metodoPago,
          estado: "completada",
        })
        .select()
        .single();
      if (ventaError) throw ventaError;

      // Create venta_items
      const ventaItems = cart.map(item => ({
        venta_id: venta.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio + item.extrasTotal,
        subtotal: (item.precio + item.extrasTotal) * item.cantidad,
        agregos: item.extras.length > 0 ? JSON.stringify(item.extras) : null,
      }));
      
      const { error: itemsError } = await supabase
        .from("venta_items")
        .insert(ventaItems);
      if (itemsError) throw itemsError;

      // Deduct stock
      for (const item of cart) {
        // Check if product has receta
        const { data: recetas } = await supabase
          .from("recetas")
          .select("insumo_id, cantidad")
          .eq("producto_final_id", item.id);

        if (recetas && recetas.length > 0) {
          // Deduct insumos based on receta
          for (const receta of recetas) {
            const cantidadDescontar = receta.cantidad * item.cantidad;
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
        } else {
          // Deduct the product itself
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
      }

      // Update mesa status if assigned
      if (assignmentType === 'mesa' && assignmentId) {
        await supabase
          .from("mesas")
          .update({ estado: 'libre' })
          .eq("id", assignmentId);
      }

      return total;
    },
    onSuccess: (total) => {
      queryClient.invalidateQueries({ queryKey: ["productos-venta"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast.success(`Venta procesada por $${total.toFixed(2)}`);
      setCart([]);
      setAssignmentType('none');
      setAssignmentId(null);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const processSale = (metodoPago: string) => {
    if (cart.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    processSaleMutation.mutate(metodoPago);
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
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
            <h1 className="text-3xl font-bold text-foreground">Punto de Venta</h1>
            <p className="text-muted-foreground">
              {role === 'vendedor' && 'Registra ventas y gestiona tu caja'}
              {role === 'supervisor' && 'Supervisa y registra ventas'}
              {role === 'administrador' && 'Vista completa del punto de venta'}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <ShoppingCart className="h-4 w-4 mr-2" />
            {cart.length} items
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Grid */}
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

            {/* Products */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No hay productos disponibles</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="glass-card cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-glow"
                    onClick={() => handleProductClick(product)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-secondary/50 rounded-lg mb-3 flex items-center justify-center relative">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <Settings className="absolute top-2 right-2 h-4 w-4 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{product.nombre}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-primary">${product.precio.toFixed(2)}</span>
                        <Badge variant="secondary" className="text-xs">
                          Stock: {product.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <Card className="glass-card h-fit sticky top-20">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Carrito de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Assignment Selector */}
              <AssignmentSelector
                storeId={storeId}
                assignmentType={assignmentType}
                assignmentId={assignmentId}
                onTypeChange={setAssignmentType}
                onIdChange={setAssignmentId}
              />

              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Carrito vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {cart.map((item) => (
                      <div key={item.cartItemId} className="flex items-start gap-3 p-2 bg-secondary/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.nombre}</p>
                          {item.extras.length > 0 && (
                            <p className="text-xs text-primary">
                              + {item.extras.map(e => e.nombre).join(', ')}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            ${(item.precio + item.extrasTotal).toFixed(2)} x {item.cantidad}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">{item.cantidad}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.cartItemId)}
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

                  {/* Payment buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      className="gradient-primary"
                      onClick={() => processSale('Efectivo')}
                      disabled={processSaleMutation.isPending}
                    >
                      <Banknote className="h-4 w-4 mr-2" />
                      Efectivo
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => processSale('Tarjeta')}
                      disabled={processSaleMutation.isPending}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Tarjeta
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Extras Modal */}
      {selectedProduct && (
        <ExtrasModal
          open={extrasModalOpen}
          onOpenChange={setExtrasModalOpen}
          product={selectedProduct}
          storeId={storeId}
          onConfirm={handleAddToCart}
        />
      )}
    </AppLayout>
  );
}