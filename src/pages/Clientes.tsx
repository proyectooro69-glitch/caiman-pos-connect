import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://mkofteflphrmdkmzcpxw.supabase.co';
const supabaseAnonKey = 'sb_publishable_BcOFivZl7dFD_WSUUjfc4g_rZRdBDHN';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { useUserRole } from "@/hooks/useUserRole";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Search, Users, Phone, Mail, MapPin, History, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ClienteType = 'presencial' | 'online';

interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo: ClienteType;
  punto_venta_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ClienteForm {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo: ClienteType;
}

interface HistorialVenta {
  id: string;
  total: number;
  metodo_pago: string;
  created_at: string;
  items: Array<{
    id: string;
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

const initialFormState: ClienteForm = {
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  tipo: "presencial",
};

export default function ClientesPage() {
  const { role, storeId, loading: roleLoading, isAdmin, isSupervisor } = useUserRole();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteForm>(initialFormState);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);

  // Fetch clientes
  const { data: clientes, isLoading: clientesLoading } = useQuery({
    queryKey: ["clientes", storeId],
    queryFn: async () => {
      let query = supabase
        .from("clientes")
        .select("*")
        .order("nombre", { ascending: true });

      if (!isAdmin && storeId) {
        query = query.eq("punto_venta_id", storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Cliente[];
    },
    enabled: !roleLoading,
  });

  // Fetch historial for selected cliente
  const { data: historial, isLoading: historialLoading } = useQuery({
    queryKey: ["historial-cliente", selectedCliente?.id],
    queryFn: async () => {
      if (!selectedCliente) return [];
      
      const { data: ventas, error } = await supabase
        .from("ventas")
        .select(`
          id,
          total,
          metodo_pago,
          created_at,
          venta_items (
            id,
            cantidad,
            precio_unitario,
            subtotal,
            producto_id
          )
        `)
        .eq("cliente_id", selectedCliente.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get product names
      const productIds = ventas?.flatMap(v => 
        (v.venta_items as any[])?.map((item: any) => item.producto_id) || []
      ) || [];

      let productosMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: productos } = await supabase
          .from("inventario")
          .select("id, nombre")
          .in("id", productIds);
        
        productosMap = (productos || []).reduce((acc, p) => {
          acc[p.id] = p.nombre;
          return acc;
        }, {} as Record<string, string>);
      }

      return (ventas || []).map(v => ({
        id: v.id,
        total: v.total,
        metodo_pago: v.metodo_pago,
        created_at: v.created_at,
        items: ((v.venta_items as any[]) || []).map((item: any) => ({
          id: item.id,
          producto_nombre: productosMap[item.producto_id] || "Producto eliminado",
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
        })),
      })) as HistorialVenta[];
    },
    enabled: !!selectedCliente,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ClienteForm & { id?: string }) => {
      const clienteData = {
        nombre: data.nombre.trim(),
        email: data.email.trim() || null,
        telefono: data.telefono.trim() || null,
        direccion: data.direccion.trim() || null,
        tipo: data.tipo,
        punto_venta_id: storeId,
      };

      if (data.id) {
        const { error } = await supabase
          .from("clientes")
          .update(clienteData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clientes")
          .insert(clienteData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success(editingCliente ? "Cliente actualizado" : "Cliente registrado");
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingCliente(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
      tipo: cliente.tipo,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    saveMutation.mutate({
      ...formData,
      id: editingCliente?.id,
    });
  };

  const handleViewHistorial = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsHistorialOpen(true);
  };

  // Filter clientes
  const filteredClientes = clientes?.filter((cliente) => {
    const matchesSearch = 
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.includes(searchTerm);
    const matchesType = filterType === "all" || cliente.tipo === filterType;
    return matchesSearch && matchesType;
  });

  // Stats
  const totalClientes = clientes?.length || 0;
  const clientesPresencial = clientes?.filter(c => c.tipo === 'presencial').length || 0;
  const clientesOnline = clientes?.filter(c => c.tipo === 'online').length || 0;

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
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground mt-2">
            Solo administradores y supervisores pueden acceder a clientes.
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
            <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gestiona tu cartera de clientes</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del cliente"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+52 999 123 4567"
                    maxLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección completa"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Cliente</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value as ClienteType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
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
                Total Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClientes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Presenciales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesPresencial}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clientesOnline}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clientes Table */}
        <Card>
          <CardContent className="p-0">
            {clientesLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredClientes?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay clientes registrados</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes?.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nombre}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {cliente.telefono && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" /> {cliente.telefono}
                            </span>
                          )}
                          {cliente.email && (
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" /> {cliente.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cliente.tipo === 'presencial' ? 'default' : 'secondary'}>
                          {cliente.tipo === 'presencial' ? 'Presencial' : 'Online'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(cliente.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistorial(cliente)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            Historial
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(cliente)}
                          >
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Historial Sheet */}
        <Sheet open={isHistorialOpen} onOpenChange={setIsHistorialOpen}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>
                Historial de {selectedCliente?.nombre}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {historialLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : historial?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Este cliente no tiene compras registradas</p>
                </div>
              ) : (
                historial?.map((venta) => (
                  <Card key={venta.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">
                            {format(new Date(venta.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {venta.metodo_pago}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ${venta.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {venta.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                            <span>{item.cantidad}x {item.producto_nombre}</span>
                            <span>${item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
