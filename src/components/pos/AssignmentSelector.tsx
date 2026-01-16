import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, ChefHat } from "lucide-react";

interface AssignmentSelectorProps {
  storeId: string | null;
  assignmentType: 'none' | 'mesa' | 'cliente';
  assignmentId: string | null;
  onTypeChange: (type: 'none' | 'mesa' | 'cliente') => void;
  onIdChange: (id: string | null) => void;
}

export function AssignmentSelector({
  storeId,
  assignmentType,
  assignmentId,
  onTypeChange,
  onIdChange,
}: AssignmentSelectorProps) {
  // Fetch mesas
  const { data: mesas } = useQuery({
    queryKey: ["mesas-selector", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase
        .from("mesas")
        .select("id, numero, estado")
        .eq("punto_venta_id", storeId)
        .order("numero");
      return data || [];
    },
    enabled: !!storeId && assignmentType === 'mesa',
  });

  // Fetch clientes
  const { data: clientes } = useQuery({
    queryKey: ["clientes-selector", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data } = await supabase
        .from("clientes")
        .select("id, nombre")
        .eq("punto_venta_id", storeId)
        .order("nombre");
      return data || [];
    },
    enabled: !!storeId && assignmentType === 'cliente',
  });

  const handleTypeChange = (value: string) => {
    onTypeChange(value as 'none' | 'mesa' | 'cliente');
    onIdChange(null);
  };

  return (
    <div className="space-y-3 p-3 bg-secondary/30 rounded-lg">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Asignar venta a
      </Label>
      
      <Select value={assignmentType} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sin asignar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="flex items-center gap-2">
              Sin asignar
            </span>
          </SelectItem>
          <SelectItem value="mesa">
            <span className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Mesa
            </span>
          </SelectItem>
          <SelectItem value="cliente">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cliente
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {assignmentType === 'mesa' && (
        <Select value={assignmentId || ""} onValueChange={(v) => onIdChange(v || null)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar mesa..." />
          </SelectTrigger>
          <SelectContent>
            {mesas?.map((mesa) => (
              <SelectItem key={mesa.id} value={mesa.id}>
                Mesa {mesa.numero} 
                <span className={`ml-2 text-xs ${mesa.estado === 'libre' ? 'text-green-500' : 'text-amber-500'}`}>
                  ({mesa.estado})
                </span>
              </SelectItem>
            ))}
            {(!mesas || mesas.length === 0) && (
              <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                No hay mesas disponibles
              </div>
            )}
          </SelectContent>
        </Select>
      )}

      {assignmentType === 'cliente' && (
        <Select value={assignmentId || ""} onValueChange={(v) => onIdChange(v || null)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clientes?.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </SelectItem>
            ))}
            {(!clientes || clientes.length === 0) && (
              <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                No hay clientes registrados
              </div>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
