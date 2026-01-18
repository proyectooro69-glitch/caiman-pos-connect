import { useQuery } from "@tanstack/react-query";
import { supabaseUntyped } from "@/lib/supabase-untyped";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Store,
  CalendarDays
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
  monto: {
    label: "Recaudado",
    color: "hsl(var(--primary))",
  },
};

interface MonthlyDataPoint {
  month: string;
  monthFull: string;
  monto: number;
}

interface PendingStore {
  id: string;
  nombre: string;
  fecha_vencimiento: string | null;
}

export function IncomeDashboard() {
  // Fetch monthly income data from historial_pagos (last 6 months)
  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery<MonthlyDataPoint[]>({
    queryKey: ["monthly-income"],
    queryFn: async () => {
      const months: MonthlyDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data, error } = await supabaseUntyped
          .from("historial_pagos")
          .select("monto")
          .gte("fecha_pago", start.toISOString())
          .lte("fecha_pago", end.toISOString());

        if (error) throw error;

        const payments = (data || []) as { monto: number }[];
        const total = payments.reduce((sum, payment) => sum + Number(payment.monto), 0);
        
        months.push({
          month: format(date, "MMM", { locale: es }),
          monthFull: format(date, "MMMM yyyy", { locale: es }),
          monto: total,
        });
      }
      return months;
    },
  });

  // Fetch total collected (all time)
  const { data: totalCollected, isLoading: isLoadingTotal } = useQuery<number>({
    queryKey: ["total-collected"],
    queryFn: async () => {
      const { data, error } = await supabaseUntyped
        .from("historial_pagos")
        .select("monto");

      if (error) throw error;

      const payments = (data || []) as { monto: number }[];
      return payments.reduce((sum, payment) => sum + Number(payment.monto), 0);
    },
  });

  // Fetch current month collected
  const { data: currentMonthCollected, isLoading: isLoadingCurrentMonth } = useQuery<number>({
    queryKey: ["current-month-collected"],
    queryFn: async () => {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());

      const { data, error } = await supabaseUntyped
        .from("historial_pagos")
        .select("monto")
        .gte("fecha_pago", start.toISOString())
        .lte("fecha_pago", end.toISOString());

      if (error) throw error;

      const payments = (data || []) as { monto: number }[];
      return payments.reduce((sum, payment) => sum + Number(payment.monto), 0);
    },
  });

  // Fetch stores with expired subscriptions (pending payments)
  const { data: pendingStores, isLoading: isLoadingPending } = useQuery<PendingStore[]>({
    queryKey: ["pending-payments"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];

      // Check suscripciones table for expired
      const { data: expiredSubs, error: subsError } = await supabaseUntyped
        .from("suscripciones")
        .select(`
          id,
          store_id,
          fecha_vencimiento,
          estado,
          puntos_venta:store_id (
            id,
            nombre
          )
        `)
        .eq("estado", "vencido");

      if (subsError) throw subsError;

      // Also check puntos_venta for stores without subscriptions or with past fecha_vencimiento
      const { data: allStores, error: storesError } = await supabaseUntyped
        .from("puntos_venta")
        .select("id, nombre, fecha_vencimiento");

      if (storesError) throw storesError;

      const typedExpiredSubs = (expiredSubs || []) as unknown as Array<{
        id: string;
        store_id: string;
        fecha_vencimiento: string | null;
        estado: string;
        puntos_venta: { id: string; nombre: string } | null;
      }>;

      const typedAllStores = (allStores || []) as Array<{
        id: string;
        nombre: string;
        fecha_vencimiento: string | null;
      }>;

      // Get store IDs that have subscriptions
      const storesWithSubs = new Set(typedExpiredSubs.map(s => s.store_id));
      
      // Find stores without subs or with expired fecha_vencimiento
      const storesNeedingPayment = typedAllStores.filter(store => {
        if (storesWithSubs.has(store.id)) return false;
        if (!store.fecha_vencimiento) return true;
        return store.fecha_vencimiento < today;
      });

      const expiredList: PendingStore[] = typedExpiredSubs.map(s => ({
        id: s.store_id,
        nombre: s.puntos_venta?.nombre || "Tienda desconocida",
        fecha_vencimiento: s.fecha_vencimiento,
      }));

      const pendingList: PendingStore[] = storesNeedingPayment.map(s => ({
        id: s.id,
        nombre: s.nombre,
        fecha_vencimiento: s.fecha_vencimiento,
      }));

      // Combine and deduplicate
      const combined = [...expiredList, ...pendingList];
      const uniqueStores = combined.filter((store, index, self) => 
        index === self.findIndex(s => s.id === store.id)
      );

      return uniqueStores;
    },
  });

  const isLoading = isLoadingMonthly || isLoadingTotal || isLoadingCurrentMonth || isLoadingPending;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-secondary rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-secondary rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass-card animate-pulse">
          <CardHeader>
            <div className="h-5 bg-secondary rounded w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-secondary rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Collected */}
        <Card className="glass-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recaudado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${(totalCollected || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Histórico total de cobros
            </p>
          </CardContent>
        </Card>

        {/* Current Month */}
        <Card className="glass-card border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Este Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${(currentMonthCollected || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(), "MMMM yyyy", { locale: es })}
            </p>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="glass-card border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Pendientes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {pendingStores?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tiendas con suscripción vencida
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Ingresos Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={monthlyData || []} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                tickLine={false}
                axisLine={false}
                className="text-xs fill-muted-foreground"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                className="text-xs fill-muted-foreground"
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`$${value.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Recaudado"]}
              />
              <Bar 
                dataKey="monto" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pending Stores List */}
      {pendingStores && pendingStores.length > 0 && (
        <Card className="glass-card border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Tiendas con Pago Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingStores.map((store) => (
                <div 
                  key={store.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <Store className="h-4 w-4 text-destructive" />
                    <span className="font-medium">{store.nombre}</span>
                  </div>
                  <Badge variant="destructive">
                    {store.fecha_vencimiento 
                      ? `Vencido: ${format(new Date(store.fecha_vencimiento), "dd/MM/yyyy")}`
                      : "Sin suscripción"
                    }
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
