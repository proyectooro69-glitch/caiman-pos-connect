import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Minus, Trash2, ChefHat, Users, Package, CreditCard, Check } from "lucide-react";

type MesaStatus = 'libre' | 'ocupada' | 'cerrada';

interface Mesa {
  id: string;
  punto_venta_id: string;
  numero: number;
  capacidad: number;
  estado: MesaStatus;
  posicion_x: number | null;
  posicion_y: number | null;
  created_at: string;
  updated_at: string;
}

interface CuentaMesa {
  id: string;
  mesa_id: string;
  estado: string;
  total: number;
  created_at: string;
  updated_at: string;
}

interface DetalleCuenta {
  id: string;
  cuenta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  agregos: string | null;
  created_at: string;
}

interface ProductoInventario {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
}

export default function MesasPage() {
  const { role, storeId, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isNewMesaOpen, setIsNewMesaOpen] = useState(false);
  const [newMesaData, setNewMesaData] = useState({ numero: "", capacidad: "4" });
  const [searchProducts, setSearchProducts] = useState("");

  // Fetch mesas
  const { data: mesas, isLoading: mesasLoading } = useQuery({
    queryKey: ["mesas", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("mesas")
        .select("*")
        .eq("punto_venta_id", storeId)
        .order("numero", { ascending: true });
      if (error) throw error;
      return data as Mesa[];
    },
    enabled: !roleLoading && !!storeId,
  });

  // Fetch cuenta activa for selected mesa
  const { data: cuentaActiva, isLoading: cuentaLoading } = useQuery({
    queryKey: ["cuenta-mesa", selectedMesa?.id],
    queryFn: async () => {
      if (!selectedMesa) return null;
      const { data, error } = await supabase
        .from("cuentas_mesa")
        .select("*")
        .eq("mesa_id", selectedMesa.id)
        .eq("estado", "abierta")
        .maybeSingle();
      if (error) throw error;
      return data as CuentaMesa | null;
    },
    enabled: !!selectedMesa,
  });

  // Fetch detalles de la cuenta
  const { data: detallesCuenta } = useQuery({
    queryKey: ["detalle-cuenta", cuentaActiva?.id],
    queryFn: async () => {
      if (!cuentaActiva) return [];
      const { data, error } = await supabase
        .from("detalle_cuenta")
        .select("*")
        .eq("cuenta_id", cuentaActiva.id);
      if (error) throw error;
      return data as DetalleCuenta[];
    },
    enabled: !!cuentaActiva,
  });

  // Fetch productos
  const { data: productos } = useQuery({
    queryKey: ["productos-mesa", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("inventario")
        .select("id, nombre, precio, stock")
        .eq("punto_venta_id", storeId)
        .eq("tipo", "producto_final")
        .gt("stock", 0)
        .order("nombre");
      if (error) throw error;
      return data as ProductoInventario[];
    },
    enabled: !roleLoading && !!storeId,
  });

  // Get product names for detalles
  const { data: productosMap } = useQuery({
    queryKey: ["productos-map", detallesCuenta?.map(d => d.producto_id)],
    queryFn: async () => {
      if (!detallesCuenta || detallesCuenta.length === 0) return {};
      const productIds = detallesCuenta.map(d => d.producto_id);
      const { data } = await supabase
        .from("inventario")
        .select("id, nombre")
        .in("id", productIds);
      return (data || []).reduce((acc, p) => {
        acc[p.id] = p.nombre;
        return acc;
      }, {} as Record<string, string>);
    },
    enabled: !!detallesCuenta && detallesCuenta.length > 0,
  });

  // Create mesa mutation
  const createMesaMutation = useMutation({
    mutationFn: async () => {
      if (!storeId) throw new Error("No store");
      const { error } = await supabase
        .from("mesas")
        .insert({
          punto_venta_id: storeId,
          numero: parseInt(newMesaData.numero),
          capacidad: parseInt(newMesaData.capacidad),
          estado: 'libre' as MesaStatus,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      toast.success("Mesa creada");
      setIsNewMesaOpen(false);
      setNewMesaData({ numero: "", capacidad: "4" });
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Abrir cuenta mutation
  const abrirCuentaMutation = useMutation({
    mutationFn: async (mesaId: string) => {
      // Create cuenta
      const { data: cuenta, error: cuentaError } = await supabase
        .from("cuentas_mesa")
        .insert({
          mesa_id: mesaId,
          estado: "abierta",
          total: 0,
        })
        .select()
        .single();
      if (cuentaError) throw cuentaError;

      // Update mesa status
      const { error: mesaError } = await supabase
        .from("mesas")
        .update({ estado: 'ocupada' as MesaStatus })
        .eq("id", mesaId);
      if (mesaError) throw mesaError;

      return cuenta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      queryClient.invalidateQueries({ queryKey: ["cuenta-mesa"] });
      toast.success("Cuenta abierta");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Add producto to cuenta mutation
  const addProductoMutation = useMutation({
    mutationFn: async (producto: ProductoInventario) => {
      if (!cuentaActiva) throw new Error("No cuenta");

      // Check if product already exists in cuenta
      const existingDetalle = detallesCuenta?.find(d => d.producto_id === producto.id);

      if (existingDetalle) {
        // Update quantity
        const newCantidad = existingDetalle.cantidad + 1;
        const newSubtotal = newCantidad * existingDetalle.precio_unitario;
        const { error } = await supabase
          .from("detalle_cuenta")
          .update({ cantidad: newCantidad, subtotal: newSubtotal })
          .eq("id", existingDetalle.id);
        if (error) throw error;
      } else {
        // Insert new detalle
        const { error } = await supabase
          .from("detalle_cuenta")
          .insert({
            cuenta_id: cuentaActiva.id,
            producto_id: producto.id,
            cantidad: 1,
            precio_unitario: producto.precio,
            subtotal: producto.precio,
          });
        if (error) throw error;
      }

      // Update cuenta total
      const newTotal = (cuentaActiva.total || 0) + producto.precio;
      const { error: totalError } = await supabase
        .from("cuentas_mesa")
        .update({ total: newTotal })
        .eq("id", cuentaActiva.id);
      if (totalError) throw totalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuenta-mesa"] });
      queryClient.invalidateQueries({ queryKey: ["detalle-cuenta"] });
      toast.success("Producto añadido");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Remove producto mutation
  const removeProductoMutation = useMutation({
    mutationFn: async (detalle: DetalleCuenta) => {
      if (!cuentaActiva) throw new Error("No cuenta");

      if (detalle.cantidad > 1) {
        const newCantidad = detalle.cantidad - 1;
        const newSubtotal = newCantidad * detalle.precio_unitario;
        const { error } = await supabase
          .from("detalle_cuenta")
          .update({ cantidad: newCantidad, subtotal: newSubtotal })
          .eq("id", detalle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("detalle_cuenta")
          .delete()
          .eq("id", detalle.id);
        if (error) throw error;
      }

      // Update cuenta total
      const newTotal = Math.max(0, (cuentaActiva.total || 0) - detalle.precio_unitario);
      const { error: totalError } = await supabase
        .from("cuentas_mesa")
        .update({ total: newTotal })
        .eq("id", cuentaActiva.id);
      if (totalError) throw totalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cuenta-mesa"] });
      queryClient.invalidateQueries({ queryKey: ["detalle-cuenta"] });
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Cerrar cuenta mutation
  const cerrarCuentaMutation = useMutation({
    mutationFn: async (metodoPago: string) => {
      if (!cuentaActiva || !selectedMesa || !storeId || !user) throw new Error("Missing data");

      const impuesto = (cuentaActiva.total || 0) * 0.16;
      const total = (cuentaActiva.total || 0) + impuesto;

      // Create venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert({
          punto_venta_id: storeId,
          vendedor_id: user.id,
          mesa_id: selectedMesa.id,
          subtotal: cuentaActiva.total || 0,
          impuesto,
          total,
          metodo_pago: metodoPago,
          estado: "completada",
        })
        .select()
        .single();
      if (ventaError) throw ventaError;

      // Create venta_items from detalles
      if (detallesCuenta && detallesCuenta.length > 0) {
        const ventaItems = detallesCuenta.map(d => ({
          venta_id: venta.id,
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          subtotal: d.subtotal,
          agregos: d.agregos,
        }));
        const { error: itemsError } = await supabase
          .from("venta_items")
          .insert(ventaItems);
        if (itemsError) throw itemsError;

        // Deduct stock for each product (handle recetas)
        for (const detalle of detallesCuenta) {
          // Check if product has receta
          const { data: recetas } = await supabase
            .from("recetas")
            .select("insumo_id, cantidad")
            .eq("producto_final_id", detalle.producto_id);

          if (recetas && recetas.length > 0) {
            // Deduct insumos
            for (const receta of recetas) {
              const cantidadDescontar = receta.cantidad * detalle.cantidad;
              // Manual update for stock
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
              .eq("id", detalle.producto_id)
              .single();
            
            if (producto) {
              await supabase
                .from("inventario")
                .update({ stock: Math.max(0, producto.stock - detalle.cantidad) })
                .eq("id", detalle.producto_id);
            }
          }
        }
      }

      // Close cuenta
      const { error: cuentaError } = await supabase
        .from("cuentas_mesa")
        .update({ estado: "cerrada" })
        .eq("id", cuentaActiva.id);
      if (cuentaError) throw cuentaError;

      // Update mesa status
      const { error: mesaError } = await supabase
        .from("mesas")
        .update({ estado: 'libre' as MesaStatus })
        .eq("id", selectedMesa.id);
      if (mesaError) throw mesaError;

      return total;
    },
    onSuccess: (total) => {
      queryClient.invalidateQueries({ queryKey: ["mesas"] });
      queryClient.invalidateQueries({ queryKey: ["cuenta-mesa"] });
      queryClient.invalidateQueries({ queryKey: ["detalle-cuenta"] });
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast.success(`Cuenta cerrada - Total: $${total.toFixed(2)}`);
      setIsOrderOpen(false);
      setSelectedMesa(null);
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleMesaClick = (mesa: Mesa) => {
    setSelectedMesa(mesa);
    setIsOrderOpen(true);
  };

  const handleAbrirCuenta = () => {
    if (selectedMesa) {
      abrirCuentaMutation.mutate(selectedMesa.id);
    }
  };

  const filteredProductos = productos?.filter(p => 
    p.nombre.toLowerCase().includes(searchProducts.toLowerCase())
  ) || [];

  const getStatusColor = (estado: MesaStatus) => {
    switch (estado) {
      case 'libre': return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'ocupada': return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      case 'cerrada': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (estado: MesaStatus) => {
    switch (estado) {
      case 'libre': return 'Libre';
      case 'ocupada': return 'Ocupada';
      case 'cerrada': return 'Cuenta Cerrada';
      default: return estado;
    }
  };

  const subtotalCuenta = cuentaActiva?.total || 0;
  const impuestoCuenta = subtotalCuenta * 0.16;
  const totalCuenta = subtotalCuenta + impuestoCuenta;

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mesas</h1>
            <p className="text-muted-foreground">Gestiona las órdenes de tu restaurante</p>
          </div>
          
          <Dialog open={isNewMesaOpen} onOpenChange={setIsNewMesaOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva Mesa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Mesa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Número de Mesa</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newMesaData.numero}
                    onChange={(e) => setNewMesaData({ ...newMesaData, numero: e.target.value })}
                    placeholder="Ej: 1, 2, 3..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newMesaData.capacidad}
                    onChange={(e) => setNewMesaData({ ...newMesaData, capacidad: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsNewMesaOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createMesaMutation.mutate()} 
                    className="flex-1"
                    disabled={!newMesaData.numero || createMesaMutation.isPending}
                  >
                    {createMesaMutation.isPending ? "Creando..." : "Crear Mesa"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Libres</p>
                  <p className="text-2xl font-bold">{mesas?.filter(m => m.estado === 'libre').length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                  <p className="text-2xl font-bold">{mesas?.filter(m => m.estado === 'ocupada').length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <ChefHat className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Mesas</p>
                  <p className="text-2xl font-bold">{mesas?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mesa Grid */}
        {mesasLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : mesas?.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No hay mesas configuradas</p>
              <p className="text-sm text-muted-foreground mt-1">Crea tu primera mesa para empezar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mesas?.map((mesa) => (
              <Card
                key={mesa.id}
                className={`cursor-pointer transition-all hover:scale-105 border-2 ${getStatusColor(mesa.estado)}`}
                onClick={() => handleMesaClick(mesa)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold mb-2">{mesa.numero}</div>
                  <Badge variant="outline" className={getStatusColor(mesa.estado)}>
                    {getStatusLabel(mesa.estado)}
                  </Badge>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    {mesa.capacidad} personas
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Sheet */}
        <Sheet open={isOrderOpen} onOpenChange={(open) => {
          setIsOrderOpen(open);
          if (!open) setSelectedMesa(null);
        }}>
          <SheetContent className="sm:max-w-xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Mesa {selectedMesa?.numero}
              </SheetTitle>
            </SheetHeader>

            {cuentaLoading ? (
              <div className="mt-6 space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-20" />
              </div>
            ) : !cuentaActiva ? (
              <div className="mt-6 text-center py-12">
                <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Mesa Libre</p>
                <p className="text-muted-foreground mb-6">Abre una cuenta para empezar a tomar órdenes</p>
                <Button onClick={handleAbrirCuenta} disabled={abrirCuentaMutation.isPending}>
                  {abrirCuentaMutation.isPending ? "Abriendo..." : "Abrir Cuenta"}
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Products to add */}
                <div>
                  <Label className="mb-2 block">Añadir productos</Label>
                  <Input
                    placeholder="Buscar productos..."
                    value={searchProducts}
                    onChange={(e) => setSearchProducts(e.target.value)}
                    className="mb-3"
                  />
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
                    {filteredProductos.map((producto) => (
                      <Button
                        key={producto.id}
                        variant="outline"
                        className="h-auto py-2 px-3 justify-start"
                        onClick={() => addProductoMutation.mutate(producto)}
                        disabled={addProductoMutation.isPending}
                      >
                        <div className="text-left">
                          <p className="font-medium truncate text-sm">{producto.nombre}</p>
                          <p className="text-xs text-muted-foreground">${producto.precio.toFixed(2)}</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Current order */}
                <div>
                  <Label className="mb-2 block">Orden actual</Label>
                  {detallesCuenta?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin productos añadidos</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-auto">
                      {detallesCuenta?.map((detalle) => (
                        <div key={detalle.id} className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{productosMap?.[detalle.producto_id] || "Producto"}</p>
                            <p className="text-sm text-muted-foreground">
                              ${detalle.precio_unitario.toFixed(2)} x {detalle.cantidad}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => removeProductoMutation.mutate(detalle)}
                              disabled={removeProductoMutation.isPending}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-medium">{detalle.cantidad}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => {
                                const producto = productos?.find(p => p.id === detalle.producto_id);
                                if (producto) addProductoMutation.mutate(producto);
                              }}
                              disabled={addProductoMutation.isPending}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold">${detalle.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Totals and payment */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotalCuenta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span>${impuestoCuenta.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${totalCuenta.toFixed(2)}</span>
                  </div>

                  {detallesCuenta && detallesCuenta.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        onClick={() => cerrarCuentaMutation.mutate("Efectivo")}
                        disabled={cerrarCuentaMutation.isPending}
                        className="gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Efectivo
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => cerrarCuentaMutation.mutate("Tarjeta")}
                        disabled={cerrarCuentaMutation.isPending}
                        className="gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Tarjeta
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
