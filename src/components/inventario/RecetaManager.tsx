import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ChefHat } from "lucide-react";

interface ProductoFinal {
  id: string;
  nombre: string;
  precio: number;
}

interface Insumo {
  id: string;
  nombre: string;
  stock: number;
}

interface Receta {
  id: string;
  producto_final_id: string;
  insumo_id: string;
  cantidad: number;
  created_at: string;
}

export interface RecetaManagerProps {
  productosFinal: ProductoFinal[];
  insumos: Insumo[];
  storeId: string | null;
}

export function RecetaManager({ productosFinal, insumos, storeId }: RecetaManagerProps) {
  const queryClient = useQueryClient();
  const [selectedProducto, setSelectedProducto] = useState<string>("");
  const [selectedInsumo, setSelectedInsumo] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("1");

  // Fetch all recetas
  const { data: allRecetas, isLoading: recetasLoading } = useQuery({
    queryKey: ["recetas-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recetas")
        .select("*");
      if (error) throw error;
      return data as Receta[];
    },
  });

  // Group recetas by producto
  const recetasByProducto = allRecetas?.reduce((acc, receta) => {
    if (!acc[receta.producto_final_id]) {
      acc[receta.producto_final_id] = [];
    }
    acc[receta.producto_final_id].push(receta);
    return acc;
  }, {} as Record<string, Receta[]>) || {};

  // Create insumos map for names
  const insumosMap = insumos.reduce((acc, i) => {
    acc[i.id] = i;
    return acc;
  }, {} as Record<string, Insumo>);

  // Add receta mutation
  const addRecetaMutation = useMutation({
    mutationFn: async ({ productoId, insumoId, cant }: { productoId: string; insumoId: string; cant: number }) => {
      const { error } = await supabase
        .from("recetas")
        .insert({
          producto_final_id: productoId,
          insumo_id: insumoId,
          cantidad: cant,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recetas-all"] });
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
      queryClient.invalidateQueries({ queryKey: ["recetas-all"] });
      toast.success("Insumo eliminado de la receta");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const handleAddInsumo = (productoId: string) => {
    if (!selectedInsumo || !cantidad) {
      toast.error("Selecciona un insumo y cantidad");
      return;
    }
    addRecetaMutation.mutate({
      productoId,
      insumoId: selectedInsumo,
      cant: parseFloat(cantidad),
    });
  };

  // Get available insumos for a producto (not already in receta)
  const getAvailableInsumos = (productoId: string) => {
    const recetas = recetasByProducto[productoId] || [];
    const usedInsumoIds = recetas.map(r => r.insumo_id);
    return insumos.filter(i => !usedInsumoIds.includes(i.id));
  };

  if (recetasLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando recetas...</div>;
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {productosFinal.map((producto) => {
          const recetas = recetasByProducto[producto.id] || [];
          const availableInsumos = getAvailableInsumos(producto.id);
          
          return (
            <AccordionItem key={producto.id} value={producto.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <ChefHat className="h-4 w-4 text-primary" />
                  <span className="font-medium">{producto.nombre}</span>
                  <Badge variant="secondary" className="ml-2">
                    {recetas.length} insumos
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Add insumo form */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        value={selectedProducto === producto.id ? selectedInsumo : ""} 
                        onValueChange={(v) => {
                          setSelectedProducto(producto.id);
                          setSelectedInsumo(v);
                        }}
                      >
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
                              No hay más insumos disponibles
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
                        value={selectedProducto === producto.id ? cantidad : "1"}
                        onChange={(e) => {
                          setSelectedProducto(producto.id);
                          setCantidad(e.target.value);
                        }}
                        placeholder="Cant."
                      />
                    </div>
                    <Button
                      size="icon"
                      onClick={() => handleAddInsumo(producto.id)}
                      disabled={
                        selectedProducto !== producto.id || 
                        !selectedInsumo || 
                        !cantidad || 
                        addRecetaMutation.isPending
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Recetas list */}
                  {recetas.length === 0 ? (
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
                          <TableHead className="text-center">Stock Actual</TableHead>
                          <TableHead className="text-right">Cantidad por unidad</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recetas.map((receta) => {
                          const insumo = insumosMap[receta.insumo_id];
                          return (
                            <TableRow key={receta.id}>
                              <TableCell className="font-medium">
                                {insumo?.nombre || "Insumo eliminado"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={insumo?.stock > 0 ? "outline" : "destructive"}>
                                  {insumo?.stock || 0}
                                </Badge>
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}