import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RecetaManager } from "@/components/inventario/RecetaManager";
import { toast } from "sonner";
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, ChefHat, Layers } from "lucide-react";

type ProductCategory = 'bebidas' | 'alimentos' | 'productos_limpieza' | 'vestuario' | 'calzados' | 'ferreteria' | 'otros';
type ProductType = 'insumo' | 'producto_final';

interface InventarioItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: ProductCategory;
  tipo: ProductType;
  precio: number;
  stock: number;
  stock_minimo: number;
  punto_venta_id: string;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

// Create untyped supabase client for tables not in types
const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "bebidas", label: "Bebidas" },
  { value: "alimentos", label: "Alimentos" },
  { value: "productos_limpieza", label: "Productos de Limpieza" },
  { value: "vestuario", label: "Vestuario" },
  { value: "calzados", label: "Calzados" },
  { value: "ferreteria", label: "Ferretería" },
  { value: "otros", label: "Otros" },
];

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "insumo", label: "Insumo" },
  { value: "producto_final", label: "Producto Final" },
];

interface ProductForm {
  nombre: string;
  descripcion: string;
  categoria: ProductCategory;
  tipo: ProductType;
  precio: string;
  stock: string;
  stock_minimo: string;
}

const initialFormState: ProductForm = {
  nombre: "",
  descripcion: "",
  categoria: "otros",
  tipo: "producto_final",
  precio: "",
  stock: "0",
  stock_minimo: "5",
};

export default function InventarioPage() {
  const { role, storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("productos");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventarioItem | null>(null);
  const [formData, setFormData] = useState<ProductForm>(initialFormState);

  // Fetch inventory
  const { data: productos, isLoading: productosLoading } = useQuery({
    queryKey: ["inventario", storeId],
    queryFn: async () => {
      let query = supabaseUntyped
        .from("inventario")
        .select("*")
        .order("nombre", { ascending: true });

      // Non-admin users can only see their store's inventory
      if (!isAdmin && storeId) {
        query = query.eq("punto_venta_id", storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventarioItem[];
    },
    enabled: !roleLoading,
  });

  // Fetch stores for admin
  const { data: stores } = useQuery({
    queryKey: ["stores-for-inventory"],
    queryFn: async () => {
      const { data, error } = await supabaseUntyped
        .from("puntos_venta")
        .select("id, nombre")
        .order("nombre");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm & { id?: string; punto_venta_id: string }) => {
      const productData = {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion.trim() || null,
        categoria: data.categoria as ProductCategory,
        tipo: data.tipo as ProductType,
        precio: parseFloat(data.precio),
        stock: parseInt(data.stock),
        stock_minimo: parseInt(data.stock_minimo),
        punto_venta_id: data.punto_venta_id,
      };

      if (data.id) {
        const { error } = await supabaseUntyped
          .from("inventario")
          .update(productData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabaseUntyped
          .from("inventario")
          .insert(productData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseUntyped
        .from("inventario")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      toast.success("Producto eliminado");
    },
    onError: (error) => {
      toast.error("Error al eliminar: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingProduct(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (product: InventarioItem) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion || "",
      categoria: product.categoria,
      tipo: product.tipo,
      precio: product.precio.toString(),
      stock: product.stock.toString(),
      stock_minimo: product.stock_minimo.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.precio || parseFloat(formData.precio) < 0) {
      toast.error("El precio debe ser válido");
      return;
    }

    const targetStoreId = editingProduct?.punto_venta_id || storeId;
    if (!targetStoreId) {
      toast.error("No se pudo determinar el punto de venta");
      return;
    }

    saveMutation.mutate({
      ...formData,
      id: editingProduct?.id,
      punto_venta_id: targetStoreId,
    });
  };

  // Filter products
  const filteredProducts = productos?.filter((product) => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === "all" || product.categoria === filterCategory;
    const matchesType = filterType === "all" || product.tipo === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Get productos finales for recetas tab
  const productosFinal = productos?.filter(p => p.tipo === 'producto_final') || [];
  const insumos = productos?.filter(p => p.tipo === 'insumo') || [];

  // Stats
  const totalProducts = productos?.length || 0;
  const lowStockProducts = productos?.filter(p => p.stock <= p.stock_minimo).length || 0;
  const totalValue = productos?.reduce((sum, p) => sum + (p.precio * p.stock), 0) || 0;

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin && !isSupervisor) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-2">
            Solo administradores y supervisores pueden acceder al inventario.
          </p>
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
            <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
            <p className="text-muted-foreground">Gestiona tus productos, insumos y recetas</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional"
                    maxLength={255}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value as ProductCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value as ProductType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio *</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock_minimo">Stock Mín.</Label>
                    <Input
                      id="stock_minimo"
                      type="number"
                      min="0"
                      value={formData.stock_minimo}
                      onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
            </CardContent>
          </Card>

          <Card className={lowStockProducts > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {lowStockProducts > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockProducts > 0 ? "text-destructive" : ""}`}>
                {lowStockProducts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalValue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="productos" className="gap-2">
              <Layers className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="recetas" className="gap-2">
              <ChefHat className="h-4 w-4" />
              Recetas
            </TabsTrigger>
          </TabsList>

          {/* Productos Tab */}
          <TabsContent value="productos" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                {productosLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : filteredProducts && filteredProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.nombre}</p>
                              {product.descripcion && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {product.descripcion}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {CATEGORIES.find(c => c.value === product.categoria)?.label || product.categoria}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.tipo === "insumo" ? "secondary" : "default"}>
                              {product.tipo === "insumo" ? "Insumo" : "Final"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${product.precio.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={product.stock <= product.stock_minimo ? "text-destructive font-medium" : ""}>
                              {product.stock}
                            </span>
                            {product.stock <= product.stock_minimo && (
                              <AlertTriangle className="inline-block ml-1 h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará permanentemente
                                      "{product.nombre}" del inventario.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(product.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No hay productos</h3>
                    <p className="text-muted-foreground mt-1">
                      {searchTerm || filterCategory !== "all" || filterType !== "all"
                        ? "No se encontraron productos con los filtros aplicados"
                        : "Comienza agregando tu primer producto"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recetas Tab */}
          <TabsContent value="recetas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  Gestión de Recetas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Define qué insumos componen cada producto final. Al vender un producto, se descontará automáticamente el stock de los insumos.
                </p>
              </CardHeader>
              <CardContent>
                {productosFinal.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No hay productos finales</h3>
                    <p className="text-muted-foreground mt-1">
                      Crea productos de tipo "Producto Final" para poder asignarles recetas.
                    </p>
                  </div>
                ) : insumos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No hay insumos</h3>
                    <p className="text-muted-foreground mt-1">
                      Crea productos de tipo "Insumo" para poder usarlos en las recetas.
                    </p>
                  </div>
                ) : (
                  <RecetaManager 
                    productosFinal={productosFinal}
                    insumos={insumos}
                    storeId={storeId}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}