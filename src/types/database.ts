// Tipos basados en tu estructura de Supabase
// Estos tipos deben coincidir exactamente con tus tablas

export type AppRole = 'admin' | 'supervisor' | 'vendedor'

export type ProductCategory = 
  | 'bebidas' 
  | 'alimentos' 
  | 'productos_limpieza' 
  | 'vestuario' 
  | 'calzados' 
  | 'ferreteria' 
  | 'otros'

export type ProductType = 'insumo' | 'producto_final'

export type MesaStatus = 'libre' | 'ocupada' | 'cerrada'

export type ClienteType = 'presencial' | 'online'

export interface Database {
  public: {
    Tables: {
      puntos_venta: {
        Row: {
          id: string
          nombre: string
          direccion: string | null
          email: string | null
          telefono: string | null
          movil: string | null
          logo_url: string | null
          web: string | null
          imagen_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          direccion?: string | null
          email?: string | null
          telefono?: string | null
          movil?: string | null
          logo_url?: string | null
          web?: string | null
          imagen_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          direccion?: string | null
          email?: string | null
          telefono?: string | null
          movil?: string | null
          logo_url?: string | null
          web?: string | null
          imagen_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          nombre: string | null
          apellido: string | null
          avatar_url: string | null
          punto_venta_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nombre?: string | null
          apellido?: string | null
          avatar_url?: string | null
          punto_venta_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nombre?: string | null
          apellido?: string | null
          avatar_url?: string | null
          punto_venta_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: AppRole
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: AppRole
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: AppRole
          created_at?: string
        }
      }
      inventario: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          categoria: ProductCategory
          tipo: ProductType
          precio: number
          stock: number
          stock_minimo: number
          punto_venta_id: string
          imagen_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          categoria: ProductCategory
          tipo: ProductType
          precio: number
          stock?: number
          stock_minimo?: number
          punto_venta_id: string
          imagen_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          categoria?: ProductCategory
          tipo?: ProductType
          precio?: number
          stock?: number
          stock_minimo?: number
          punto_venta_id?: string
          imagen_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recetas: {
        Row: {
          id: string
          producto_final_id: string
          insumo_id: string
          cantidad: number
          created_at: string
        }
        Insert: {
          id?: string
          producto_final_id: string
          insumo_id: string
          cantidad: number
          created_at?: string
        }
        Update: {
          id?: string
          producto_final_id?: string
          insumo_id?: string
          cantidad?: number
          created_at?: string
        }
      }
      agregos: {
        Row: {
          id: string
          nombre: string
          insumo_id: string
          precio_adicional: number
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          insumo_id: string
          precio_adicional: number
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          insumo_id?: string
          precio_adicional?: number
          created_at?: string
        }
      }
      producto_agregos: {
        Row: {
          id: string
          producto_id: string
          agrego_id: string
          created_at: string
        }
        Insert: {
          id?: string
          producto_id: string
          agrego_id: string
          created_at?: string
        }
        Update: {
          id?: string
          producto_id?: string
          agrego_id?: string
          created_at?: string
        }
      }
      ventas: {
        Row: {
          id: string
          punto_venta_id: string
          vendedor_id: string
          cliente_id: string | null
          mesa_id: string | null
          subtotal: number
          impuesto: number
          total: number
          metodo_pago: string
          estado: string
          created_at: string
        }
        Insert: {
          id?: string
          punto_venta_id: string
          vendedor_id: string
          cliente_id?: string | null
          mesa_id?: string | null
          subtotal: number
          impuesto: number
          total: number
          metodo_pago?: string
          estado?: string
          created_at?: string
        }
        Update: {
          id?: string
          punto_venta_id?: string
          vendedor_id?: string
          cliente_id?: string | null
          mesa_id?: string | null
          subtotal?: number
          impuesto?: number
          total?: number
          metodo_pago?: string
          estado?: string
          created_at?: string
        }
      }
      venta_items: {
        Row: {
          id: string
          venta_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
          agregos: string | null
          created_at: string
        }
        Insert: {
          id?: string
          venta_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
          agregos?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          venta_id?: string
          producto_id?: string
          cantidad?: number
          precio_unitario?: number
          subtotal?: number
          agregos?: string | null
          created_at?: string
        }
      }
      mesas: {
        Row: {
          id: string
          punto_venta_id: string
          numero: number
          capacidad: number
          estado: MesaStatus
          posicion_x: number | null
          posicion_y: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          punto_venta_id: string
          numero: number
          capacidad?: number
          estado?: MesaStatus
          posicion_x?: number | null
          posicion_y?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          punto_venta_id?: string
          numero?: number
          capacidad?: number
          estado?: MesaStatus
          posicion_x?: number | null
          posicion_y?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      cuentas_mesa: {
        Row: {
          id: string
          mesa_id: string
          estado: string
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mesa_id: string
          estado?: string
          total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mesa_id?: string
          estado?: string
          total?: number
          created_at?: string
          updated_at?: string
        }
      }
      detalle_cuenta: {
        Row: {
          id: string
          cuenta_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
          agregos: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cuenta_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          subtotal: number
          agregos?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cuenta_id?: string
          producto_id?: string
          cantidad?: number
          precio_unitario?: number
          subtotal?: number
          agregos?: string | null
          created_at?: string
        }
      }
      clientes: {
        Row: {
          id: string
          nombre: string
          email: string | null
          telefono: string | null
          direccion: string | null
          tipo: ClienteType
          punto_venta_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          tipo?: ClienteType
          punto_venta_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string | null
          telefono?: string | null
          direccion?: string | null
          tipo?: ClienteType
          punto_venta_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: AppRole
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: AppRole
      product_category: ProductCategory
      product_type: ProductType
      mesa_status: MesaStatus
      cliente_type: ClienteType
    }
  }
}

// Helper types for easier usage
export type PuntoVenta = Database['public']['Tables']['puntos_venta']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type Inventario = Database['public']['Tables']['inventario']['Row']
export type Receta = Database['public']['Tables']['recetas']['Row']
export type Agrego = Database['public']['Tables']['agregos']['Row']
export type ProductoAgrego = Database['public']['Tables']['producto_agregos']['Row']
export type Venta = Database['public']['Tables']['ventas']['Row']
export type VentaItem = Database['public']['Tables']['venta_items']['Row']
export type Mesa = Database['public']['Tables']['mesas']['Row']
export type CuentaMesa = Database['public']['Tables']['cuentas_mesa']['Row']
export type DetalleCuenta = Database['public']['Tables']['detalle_cuenta']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
