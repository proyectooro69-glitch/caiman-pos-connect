import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, ChefHat } from "lucide-react";

interface RecetaManagerProps {
  productoFinalId: string;
  storeId: string;
}

interface Receta {
  id: string;
  producto_final_id: string;
  insumo_id: string;
  cantidad: number;
  created_at: string;
}

interface Insumo {
  id: string;
  nombre: string;
  stock: number;
}

export function RecetaManager({ productoFinalId, storeId }: RecetaManagerProps) {
  const queryClient = useQueryClient();
  const [selectedInsumo, setSelectedInsumo] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("1");

  // Fetch recetas for this product
  const { data: recetas, isLoading: recetasLoading } = useQuery({
    queryKey: ["recetas", productoFinalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recetas")
        .select("*")
        .eq("producto_final_id", productoFinalId);
      if (error) throw error;
      return data as Receta[];
    },
  });

  // Fetch all insumos for the store
  const { data: insumos } = useQuery({
    queryKey: ["insumos", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario")
        .select("id, nombre, stock")
        .eq("punto_venta_id", storeId)
        .eq("tipo", "insumo")
        .order("nombre");
      if (error) throw error;
      return data as Insumo[];
    },
    enabled: !!storeId,
  });

  // Get insumo names map
  const insumosMap = insumos?.reduce((acc, i) => {
    acc[i.id] = i.nombre;
    return acc;
  }, {} as Record<string, string>) || {};

  // Add receta mutation
  const addRecetaMutation = useMutation({
    mutationFn: async () => {
      if (!selectedInsumo || !cantidad) throw new Error("Datos incompletos");
      
      const { error } = await supabase
        .from("recetas")
        .insert({
          producto_final_id: productoFinalId,
          insumo_id: selectedInsumo,
          cantidad: parseFloat(cantidad),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recetas", productoFinalId] });
      toast.success("Insumo añadido a la receta");
      setSelectedInsumo("");
      setCantidad("1");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Delete receta mutation
  const deleteRecetaMutation = useMutation({
    mutationFn: async (recetaId: string) => {
      const { error } = await supabase
        .from("recetas")
        .delete()
        .eq("id", recetaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recetas", productoFinalId] });
      toast.success("Insumo eliminado de la receta");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  // Filter out insumos already in receta
  const availableInsumos = insumos?.filter(
    i => !recetas?.some(r => r.insumo_id === i.id)
  ) || [];

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          Receta (Insumos necesarios)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add insumo form */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={selectedInsumo} onValueChange={setSelectedInsumo}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar insumo..." />
              </SelectTrigger>
              <SelectContent>
                {availableInsumos.map((insumo) => (
                  <SelectItem key={insumo.id} value={insumo.id}>
                    {insumo.nombre} (Stock: {insumo.stock})
                  </SelectItem>
                ))}
                {availableInsumos.length === 0 && (
                  <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                    No hay insumos disponibles
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cant."
            />
          </div>
          <Button
            size="icon"
            onClick={() => addRecetaMutation.mutate()}
            disabled={!selectedInsumo || !cantidad || addRecetaMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Recetas list */}
        {recetasLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : recetas?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground bg-secondary/30 rounded-lg">
            <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin insumos en la receta</p>
            <p className="text-xs">Añade los insumos necesarios para producir este producto</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recetas?.map((receta) => (
                <TableRow key={receta.id}>
                  <TableCell className="font-medium">
                    {insumosMap[receta.insumo_id] || "Insumo eliminado"}
                  </TableCell>
                  <TableCell className="text-right">{receta.cantidad}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteRecetaMutation.mutate(receta.id)}
                      disabled={deleteRecetaMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
