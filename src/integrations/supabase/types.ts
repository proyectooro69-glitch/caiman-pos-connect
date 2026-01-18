export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agregos: {
        Row: {
          activo: boolean | null
          created_at: string
          id: string
          nombre: string
          precio: number
          punto_venta_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          id?: string
          nombre: string
          precio?: number
          punto_venta_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          id?: string
          nombre?: string
          precio?: number
          punto_venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agregos_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nombre: string
          notas: string | null
          punto_venta_id: string
          telefono: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          punto_venta_id: string
          telefono?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          punto_venta_id?: string
          telefono?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_tienda: {
        Row: {
          created_at: string
          descripcion: string | null
          direccion: string | null
          horario: string | null
          id: string
          logo_url: string | null
          nombre_negocio: string | null
          pdf_tarjeta_url: string | null
          punto_venta_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          horario?: string | null
          id?: string
          logo_url?: string | null
          nombre_negocio?: string | null
          pdf_tarjeta_url?: string | null
          punto_venta_id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          direccion?: string | null
          horario?: string | null
          id?: string
          logo_url?: string | null
          nombre_negocio?: string | null
          pdf_tarjeta_url?: string | null
          punto_venta_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_tienda_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: true
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      cuentas_mesa: {
        Row: {
          created_at: string
          estado: string | null
          id: string
          mesa_id: string
          total: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: string | null
          id?: string
          mesa_id: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string | null
          id?: string
          mesa_id?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_mesa_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_cuenta: {
        Row: {
          cantidad: number
          created_at: string
          cuenta_id: string
          id: string
          notas: string | null
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Insert: {
          cantidad?: number
          created_at?: string
          cuenta_id: string
          id?: string
          notas?: string | null
          precio_unitario: number
          producto_id: string
          subtotal: number
        }
        Update: {
          cantidad?: number
          created_at?: string
          cuenta_id?: string
          id?: string
          notas?: string | null
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "detalle_cuenta_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas_mesa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_cuenta_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario: {
        Row: {
          categoria: string | null
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          precio: number
          punto_venta_id: string
          stock: number
          stock_minimo: number | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio?: number
          punto_venta_id: string
          stock?: number
          stock_minimo?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio?: number
          punto_venta_id?: string
          stock?: number
          stock_minimo?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          capacidad: number | null
          created_at: string
          estado: string | null
          id: string
          numero: number
          posicion_x: number | null
          posicion_y: number | null
          punto_venta_id: string
          updated_at: string
        }
        Insert: {
          capacidad?: number | null
          created_at?: string
          estado?: string | null
          id?: string
          numero: number
          posicion_x?: number | null
          posicion_y?: number | null
          punto_venta_id: string
          updated_at?: string
        }
        Update: {
          capacidad?: number | null
          created_at?: string
          estado?: string | null
          id?: string
          numero?: number
          posicion_x?: number | null
          posicion_y?: number | null
          punto_venta_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesas_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_agregos: {
        Row: {
          agrego_id: string
          created_at: string
          id: string
          producto_id: string
        }
        Insert: {
          agrego_id: string
          created_at?: string
          id?: string
          producto_id: string
        }
        Update: {
          agrego_id?: string
          created_at?: string
          id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_agregos_agrego_id_fkey"
            columns: ["agrego_id"]
            isOneToOne: false
            referencedRelation: "agregos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_agregos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nombre: string | null
          punto_venta_id: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nombre?: string | null
          punto_venta_id?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          punto_venta_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      puntos_venta: {
        Row: {
          created_at: string
          direccion: string | null
          email: string | null
          fecha_vencimiento: string | null
          id: string
          imagen_url: string | null
          logo_url: string | null
          movil: string | null
          nombre: string
          telefono: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_vencimiento?: string | null
          id?: string
          imagen_url?: string | null
          logo_url?: string | null
          movil?: string | null
          nombre: string
          telefono?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string | null
          email?: string | null
          fecha_vencimiento?: string | null
          id?: string
          imagen_url?: string | null
          logo_url?: string | null
          movil?: string | null
          nombre?: string
          telefono?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: []
      }
      recetas: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          insumo_id: string
          producto_final_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          insumo_id: string
          producto_final_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          insumo_id?: string
          producto_final_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recetas_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_producto_final_id_fkey"
            columns: ["producto_final_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_items: {
        Row: {
          agregos: string | null
          cantidad: number
          created_at: string
          id: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Insert: {
          agregos?: string | null
          cantidad: number
          created_at?: string
          id?: string
          precio_unitario: number
          producto_id: string
          subtotal: number
          venta_id: string
        }
        Update: {
          agregos?: string | null
          cantidad?: number
          created_at?: string
          id?: string
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cliente_id: string | null
          created_at: string
          es_externa: boolean | null
          estado: string | null
          id: string
          impuesto: number
          mesa_id: string | null
          metodo_pago: string | null
          punto_venta_id: string
          subtotal: number
          total: number
          vendedor_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          es_externa?: boolean | null
          estado?: string | null
          id?: string
          impuesto: number
          mesa_id?: string | null
          metodo_pago?: string | null
          punto_venta_id: string
          subtotal: number
          total: number
          vendedor_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          es_externa?: boolean | null
          estado?: string | null
          id?: string
          impuesto?: number
          mesa_id?: string | null
          metodo_pago?: string | null
          punto_venta_id?: string
          subtotal?: number
          total?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_punto_venta_id_fkey"
            columns: ["punto_venta_id"]
            isOneToOne: false
            referencedRelation: "puntos_venta"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrador" | "supervisor" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrador", "supervisor", "vendedor"],
    },
  },
} as const
