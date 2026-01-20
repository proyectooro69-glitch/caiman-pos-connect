import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp,
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote,
  Package,
  Store,
  Settings,
  BarChart3,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  DollarSign
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncomeDashboard } from "@/components/admin/IncomeDashboard";
import type { Tables } from "@/integrations/supabase/types";

const weeklySalesData = [
  { name: 'Lun', sales: 4000 },
  { name: 'Mar', sales: 3000 },
  { name: 'Mie', sales: 2000 },
  { name: 'Jue', sales: 2780 },
  { name: 'Vie', sales: 1890 },
  { name: 'Sab', sales: 2390 },
  { name: 'Dom', sales: 3490 },
];

const topProductsData = [
  { name: 'Producto A', value: 400 },
  { name: 'Producto B', value: 300 },
  { name: 'Producto C', value: 300 },
  { name: 'Producto D', value: 200 },
  { name: 'Producto E', value: 100 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

type InventarioRow = Tables<"inventario">;

// Categories from database
const categoryLabels: Record<string, string> = {
  bebidas: "Bebidas",
  alimentos: "Alimentos",
  productos_limpieza: "Limpieza",
  vestuario: "Vestuario",
  calzados: "Calzados",
  ferreteria: "Ferretería",
  otros: "Otros",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Dashboard = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [products, setProducts] = useState<InventarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [storesCount, setStoresCount] = useState<number | null>(null);
  const [storesCountLoading, setStoresCountLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { role, isAdmin, isSupervisor, isVendedor } = useUserRole();

  // Fetch products via proxy
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/proxy/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data || []);
      } catch (error: any) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  // Admin: check if there is at least one store
  useEffect(() => {
    const fetchStoresCount = async () => {
      if (!isAdmin) return;
      try {
        const response = await fetch('/api/puntos-venta');
        if (!response.ok) throw new Error('Failed to fetch stores');
        const data = await response.json();
        setStoresCount(data?.length || 0);
      } catch (error: any) {
        console.error('Error fetching stores count:', error);
      }
    };

    fetchStoresCount();
  }, [isAdmin]);

  // Get unique categories from products
  const categories = ["Todos", ...Object.values(categoryLabels)];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryLabel = product.categoria ? categoryLabels[product.categoria] : null;
    const matchesCategory = selectedCategory === "Todos" || categoryLabel === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: InventarioRow) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.nombre, price: product.precio, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const clearCart = () => {
    setCart([]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              ¡Bienvenido, {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}!
            </h1>
            <p className="text-muted-foreground">
              {isAdmin && 'Tienes acceso completo al sistema'}
              {isSupervisor && 'Gestiona tu punto de venta'}
              {isVendedor && 'Registra ventas y atiende clientes'}
              {!role && 'Contacta al administrador para asignar tu rol'}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Badge>
        </div>

        {/* Admin initial setup */}
        {isAdmin && !storesCountLoading && storesCount === 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configuración Inicial
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Aún no tienes ningún punto de venta creado. Crea el primero para habilitar la operación.
              </div>
              <Button className="gradient-primary" asChild>
                <Link to="/admin/stores?setup=1">
                  <Store className="h-4 w-4 mr-2" />
                  Crear mi primera tienda
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Admin Dashboard with Tabs */}
        {isAdmin ? (
          <Tabs defaultValue="ingresos" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="ingresos" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard de Ingresos
              </TabsTrigger>
              <TabsTrigger value="pos" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Punto de Venta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingresos" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$1,284.50</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3 text-green-500" /> +12% vs ayer
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Estado Caja</CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Abierta</div>
                    <p className="text-xs text-muted-foreground">Iniciada 08:00 AM</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">8 Items</div>
                    <p className="text-xs text-muted-foreground">Requieren atención</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Actividad</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">128</div>
                    <p className="text-xs text-muted-foreground">Ventas totales mes</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
                <Card className="lg:col-span-4 glass-card">
                  <CardHeader>
                    <CardTitle>Ventas Semanales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklySalesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-3 glass-card">
                  <CardHeader>
                    <CardTitle>Top 5 Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topProductsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {topProductsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3 glass-card">
                  <CardHeader>
                    <CardTitle>Accesos Directos</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/ventas"><ShoppingCart className="mr-2 h-4 w-4"/> Módulo Ventas</Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/inventario"><Package className="mr-2 h-4 w-4"/> Módulo Logística</Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link to="/admin/settings"><Settings className="mr-2 h-4 w-4"/> Módulo Administración</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <IncomeDashboard />
            </TabsContent>

            <TabsContent value="pos">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Access Grid for Supervisor */}
            {isSupervisor && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
                  <Link to="/ventas">
                    <ShoppingCart className="h-6 w-6" />
                    <span>Ventas</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col gap-2" asChild>
                  <Link to="/inventario">
                    <Package className="h-6 w-6" />
                    <span>Logística</span>
                  </Link>
                </Button>
              </div>
            )}
            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                    <div className="w-full aspect-square rounded-lg bg-secondary mb-3" />
                    <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No hay productos disponibles</p>
                  <p className="text-muted-foreground/60 text-sm">Agrega productos desde el inventario</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="glass-card rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-glow transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-full aspect-square rounded-lg bg-secondary mb-3 flex items-center justify-center overflow-hidden">
                      {product.imagen_url ? (
                        <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      )}
                    </div>
                    <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                      {product.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">{product.categoria ? categoryLabels[product.categoria] : 'Otros'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${product.precio.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Section */}
          <Card className="glass-card h-fit sticky top-20">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <span>Carrito</span>
                  <Badge variant="secondary">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Vaciar
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">El carrito está vacío</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                          <p className="text-primary font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1.5 rounded-md bg-secondary hover:bg-border transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1.5 rounded-md bg-secondary hover:bg-border transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors ml-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
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
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full">
                      <Banknote className="h-4 w-4 mr-2" />
                      Efectivo
                    </Button>
                    <Button className="gradient-primary w-full">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Tarjeta
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Non-admin users see the POS directly */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search & Categories */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                      <div className="w-full aspect-square rounded-lg bg-secondary mb-3" />
                      <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No hay productos disponibles</p>
                    <p className="text-muted-foreground/60 text-sm">Agrega productos desde el inventario</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((product, index) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="glass-card rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-glow transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-full aspect-square rounded-lg bg-secondary mb-3 flex items-center justify-center overflow-hidden">
                        {product.imagen_url ? (
                          <img src={product.imagen_url} alt={product.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                        )}
                      </div>
                      <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                        {product.nombre}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">{product.categoria ? categoryLabels[product.categoria] : 'Otros'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ${product.precio.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Stock: {product.stock}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Section */}
            <Card className="glass-card h-fit sticky top-20">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span>Carrito</span>
                    <Badge variant="secondary">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>
                  </div>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Vaciar
                    </button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">El carrito está vacío</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-64 overflow-auto">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                            <p className="text-primary font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 rounded-md bg-secondary hover:bg-border transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 rounded-md bg-secondary hover:bg-border transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors ml-1"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
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
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="w-full">
                        <Banknote className="h-4 w-4 mr-2" />
                        Efectivo
                      </Button>
                      <Button className="gradient-primary w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Tarjeta
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
