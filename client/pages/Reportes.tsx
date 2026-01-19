import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  Users,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Mock data for charts
const salesData = [
  { name: 'Lun', ventas: 4200 },
  { name: 'Mar', ventas: 3800 },
  { name: 'Mié', ventas: 5100 },
  { name: 'Jue', ventas: 4600 },
  { name: 'Vie', ventas: 6200 },
  { name: 'Sáb', ventas: 7800 },
  { name: 'Dom', ventas: 5400 },
];

const topProducts = [
  { nombre: 'Hamburguesa Clásica', cantidad: 156, ingresos: 4680 },
  { nombre: 'Papas Fritas Grande', cantidad: 142, ingresos: 2130 },
  { nombre: 'Refresco 500ml', cantidad: 128, ingresos: 1920 },
  { nombre: 'Pizza Margherita', cantidad: 89, ingresos: 5340 },
  { nombre: 'Ensalada César', cantidad: 67, ingresos: 2680 },
];

export default function Reportes() {
  const { role, storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();

  // Fetch sales summary
  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-summary', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ventas')
        .select('total, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const salesData = data ?? [];
      const today = new Date().toDateString();
      const ventasHoy = salesData.filter(v => new Date(v.created_at).toDateString() === today);
      const totalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
      const totalGeneral = salesData.reduce((sum, v) => sum + v.total, 0);
      
      return {
        ventasHoy: ventasHoy.length,
        totalHoy,
        totalGeneral,
        totalVentas: salesData.length,
      };
    },
    enabled: !roleLoading && (isAdmin || isSupervisor),
  });

  // Fetch inventory stats
  const { data: inventoryStats, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-stats', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventario')
        .select('stock, stock_minimo, precio');

      if (error) throw error;
      
      const inventoryData = data ?? [];
      const lowStock = inventoryData.filter(p => p.stock <= p.stock_minimo).length;
      const totalProducts = inventoryData.length;
      const inventoryValue = inventoryData.reduce((sum, p) => sum + (p.stock * p.precio), 0);
      
      return { lowStock, totalProducts, inventoryValue };
    },
    enabled: !roleLoading && (isAdmin || isSupervisor),
  });

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Access denied for vendedores
  if (role === 'vendedor') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground text-center max-w-md">
            No tienes permisos para ver los reportes. Esta sección está disponible solo para supervisores y administradores.
          </p>
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
            <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Vista global de todos los puntos de venta' : 'Reportes de tu punto de venta'}
            </p>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Calendar className="h-4 w-4 mr-2" />
            Última semana
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                  {salesLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{salesSummary?.ventasHoy || 0}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-success" />
                <span className="text-success">+12%</span>
                <span className="text-muted-foreground">vs ayer</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos Hoy</p>
                  {salesLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      ${salesSummary?.totalHoy.toFixed(2) || '0.00'}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <ArrowUpRight className="h-4 w-4 text-success" />
                <span className="text-success">+8%</span>
                <span className="text-muted-foreground">vs ayer</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Productos</p>
                  {inventoryLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{inventoryStats?.totalProducts || 0}</p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <span className="text-warning">{inventoryStats?.lowStock || 0} con stock bajo</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Inventario</p>
                  {inventoryLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      ${inventoryStats?.inventoryValue.toFixed(2) || '0.00'}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  <span className="text-muted-foreground">Todos los PDV</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Ventas de la Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${value}`, 'Ventas']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.nombre} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product.nombre}</p>
                      <p className="text-sm text-muted-foreground">{product.cantidad} unidades</p>
                    </div>
                    <p className="font-bold text-primary">${product.ingresos.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Only: Store Comparison */}
        {isAdmin && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Comparativa por Punto de Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { nombre: 'PDV Centro', ventas: 45000 },
                  { nombre: 'PDV Norte', ventas: 38000 },
                  { nombre: 'PDV Sur', ventas: 52000 },
                  { nombre: 'PDV Este', ventas: 29000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="nombre" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Ventas']}
                  />
                  <Bar 
                    dataKey="ventas" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
