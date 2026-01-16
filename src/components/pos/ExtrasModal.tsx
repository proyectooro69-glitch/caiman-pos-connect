import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Package, Plus } from "lucide-react";

interface Agrego {
  id: string;
  nombre: string;
  precio_adicional: number;
  insumo_id: string;
}

interface SelectedAgrego extends Agrego {
  selected: boolean;
}

interface ExtrasModalProps {
  open: boolean;
  onClose: () => void;
  producto: {
    id: string;
    nombre: string;
    precio: number;
  } | null;
  onConfirm: (producto: {
    id: string;
    nombre: string;
    precio: number;
    agregos: SelectedAgrego[];
    precioFinal: number;
  }) => void;
}

export function ExtrasModal({ open, onClose, producto, onConfirm }: ExtrasModalProps) {
  const [selectedAgregos, setSelectedAgregos] = useState<Record<string, boolean>>({});

  // Fetch agregos for this product
  const { data: agregos, isLoading } = useQuery({
    queryKey: ["agregos-producto", producto?.id],
    queryFn: async () => {
      if (!producto) return [];
      
      // First get producto_agregos links
      const { data: links } = await supabase
        .from("producto_agregos")
        .select("agrego_id")
        .eq("producto_id", producto.id);

      if (!links || links.length === 0) return [];

      // Then get the agregos
      const agregoIds = links.map(l => l.agrego_id);
      const { data: agregosData } = await supabase
        .from("agregos")
        .select("*")
        .in("id", agregoIds);

      return (agregosData || []) as Agrego[];
    },
    enabled: !!producto && open,
  });

  const handleToggleAgrego = (agregoId: string) => {
    setSelectedAgregos(prev => ({
      ...prev,
      [agregoId]: !prev[agregoId],
    }));
  };

  const handleConfirm = () => {
    if (!producto) return;

    const selected = (agregos || [])
      .filter(a => selectedAgregos[a.id])
      .map(a => ({ ...a, selected: true }));

    const extraPrice = selected.reduce((sum, a) => sum + a.precio_adicional, 0);
    const precioFinal = producto.precio + extraPrice;

    onConfirm({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      agregos: selected,
      precioFinal,
    });

    setSelectedAgregos({});
  };

  const handleClose = () => {
    setSelectedAgregos({});
    onClose();
  };

  const extraPrice = (agregos || [])
    .filter(a => selectedAgregos[a.id])
    .reduce((sum, a) => sum + a.precio_adicional, 0);

  const precioFinal = (producto?.precio || 0) + extraPrice;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {producto?.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Precio base: <span className="font-bold text-foreground">${producto?.precio.toFixed(2)}</span>
          </p>

          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Cargando extras...</div>
          ) : !agregos || agregos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Este producto no tiene extras disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Agregos / Extras disponibles:</Label>
              {agregos.map((agrego) => (
                <div
                  key={agrego.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={agrego.id}
                      checked={selectedAgregos[agrego.id] || false}
                      onCheckedChange={() => handleToggleAgrego(agrego.id)}
                    />
                    <Label htmlFor={agrego.id} className="cursor-pointer">
                      {agrego.nombre}
                    </Label>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    +${agrego.precio_adicional.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {extraPrice > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extras seleccionados</span>
                <span>+${extraPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex-1 text-left">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">${precioFinal.toFixed(2)}</p>
          </div>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Añadir al Carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
