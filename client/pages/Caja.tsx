import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Lock, Unlock } from "lucide-react";

export default function Caja() {
  const { storeId, userId } = useUserRole();
  const queryClient = useQueryClient();
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const { data: movimientos = [] } = useQuery({
    queryKey: ["movimientos-caja", storeId],
    queryFn: async () => {
      const response = await fetch(`/api/caja/${storeId}`);
      return response.json();
    },
    enabled: !!storeId
  });

  const mutation = useMutation({
    mutationFn: async (tipo: string) => {
      const response = await fetch("/api/caja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          puntoVentaId: storeId,
          tipo,
          monto: monto,
          observaciones
        })
      });
      if (!response.ok) throw new Error("Error al registrar movimiento");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimientos-caja"] });
      toast.success("Movimiento registrado");
      setMonto("");
      setObservaciones("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Control de Caja</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Apertura / Cierre</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button className="gap-2" onClick={() => mutation.mutate("apertura")} disabled={mutation.isPending}>
                  <Unlock className="h-4 w-4"/> Abrir Caja
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => mutation.mutate("cierre")} disabled={mutation.isPending}>
                  <Lock className="h-4 w-4"/> Cerrar Caja
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {movimientos.map((m: any) => (
                  <div key={m.id} className="flex justify-between items-center p-2 bg-secondary/30 rounded">
                    <div>
                      <Badge variant={m.tipo === 'apertura' ? 'default' : 'outline'}>{m.tipo}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(m.fecha).toLocaleString()}</p>
                    </div>
                    <span className="font-bold">${m.monto}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
