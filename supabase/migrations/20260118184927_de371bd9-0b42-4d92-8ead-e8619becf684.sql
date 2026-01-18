-- =============================================
-- PASO 1: Crear tablas base del sistema
-- =============================================

-- TABLA: puntos_venta (tiendas)
CREATE TABLE IF NOT EXISTS public.puntos_venta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT,
  email TEXT,
  telefono TEXT,
  movil TEXT,
  logo_url TEXT,
  web TEXT,
  imagen_url TEXT,
  fecha_vencimiento DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: profiles (usuarios)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  nombre TEXT,
  apellido TEXT,
  avatar_url TEXT,
  punto_venta_id UUID REFERENCES public.puntos_venta(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: user_roles (roles de usuarios)
CREATE TYPE public.app_role AS ENUM ('administrador', 'supervisor', 'vendedor');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  store_id UUID REFERENCES public.puntos_venta(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- TABLA: inventario (productos e insumos)
CREATE TABLE IF NOT EXISTS public.inventario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT DEFAULT 'otros',
  tipo TEXT DEFAULT 'producto_final' CHECK (tipo IN ('insumo', 'producto_final')),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER DEFAULT 5,
  punto_venta_id UUID NOT NULL REFERENCES public.puntos_venta(id),
  imagen_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  punto_venta_id UUID NOT NULL REFERENCES public.puntos_venta(id),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  tipo TEXT DEFAULT 'presencial',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: mesas
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  punto_venta_id UUID NOT NULL REFERENCES public.puntos_venta(id),
  numero INTEGER NOT NULL,
  capacidad INTEGER DEFAULT 4,
  estado TEXT DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'cerrada')),
  posicion_x INTEGER DEFAULT 0,
  posicion_y INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: cuentas_mesa (órdenes abiertas en una mesa)
CREATE TABLE IF NOT EXISTS public.cuentas_mesa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa_id UUID NOT NULL REFERENCES public.mesas(id) ON DELETE CASCADE,
  estado TEXT DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'cancelada')),
  total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: detalle_cuenta (items en una cuenta de mesa)
CREATE TABLE IF NOT EXISTS public.detalle_cuenta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cuenta_id UUID NOT NULL REFERENCES public.cuentas_mesa(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.inventario(id),
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: recetas (relación producto_final -> insumos)
CREATE TABLE IF NOT EXISTS public.recetas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_final_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  insumo_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  cantidad NUMERIC(10,3) NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(producto_final_id, insumo_id)
);

-- TABLA: agregos (extras disponibles)
CREATE TABLE IF NOT EXISTS public.agregos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  punto_venta_id UUID NOT NULL REFERENCES public.puntos_venta(id),
  nombre TEXT NOT NULL,
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: producto_agregos (relación producto -> agregos disponibles)
CREATE TABLE IF NOT EXISTS public.producto_agregos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
  agrego_id UUID NOT NULL REFERENCES public.agregos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(producto_id, agrego_id)
);

-- TABLA: ventas
CREATE TABLE IF NOT EXISTS public.ventas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  punto_venta_id UUID NOT NULL REFERENCES public.puntos_venta(id),
  vendedor_id UUID NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id),
  mesa_id UUID REFERENCES public.mesas(id),
  subtotal NUMERIC(10,2) NOT NULL,
  impuesto NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  metodo_pago TEXT DEFAULT 'Efectivo',
  estado TEXT DEFAULT 'completada',
  es_externa BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: venta_items
CREATE TABLE IF NOT EXISTS public.venta_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.inventario(id),
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  agregos TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- TABLA: configuracion_tienda (settings de cada tienda)
CREATE TABLE IF NOT EXISTS public.configuracion_tienda (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  punto_venta_id UUID NOT NULL UNIQUE REFERENCES public.puntos_venta(id),
  nombre_negocio TEXT,
  whatsapp TEXT,
  direccion TEXT,
  pdf_tarjeta_url TEXT,
  logo_url TEXT,
  descripcion TEXT,
  horario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PASO 2: Habilitar RLS en todas las tablas
-- =============================================
ALTER TABLE public.puntos_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_mesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_cuenta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agregos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producto_agregos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_tienda ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 3: Función helper para roles
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- PASO 4: Políticas RLS
-- =============================================

-- Puntos de venta
CREATE POLICY "Puntos venta visibles autenticados" ON public.puntos_venta FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear puntos venta admin" ON public.puntos_venta FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar puntos venta admin" ON public.puntos_venta FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Profiles
CREATE POLICY "Profiles visibles autenticados" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear profile propio" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Actualizar profile propio" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- User roles
CREATE POLICY "Roles visibles autenticados" ON public.user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear roles admin" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar roles admin" ON public.user_roles FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Inventario
CREATE POLICY "Inventario visible autenticados" ON public.inventario FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Inventario público catálogo" ON public.inventario FOR SELECT USING (true);
CREATE POLICY "Crear inventario autenticados" ON public.inventario FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar inventario autenticados" ON public.inventario FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar inventario autenticados" ON public.inventario FOR DELETE USING (auth.uid() IS NOT NULL);

-- Clientes
CREATE POLICY "Clientes visibles autenticados" ON public.clientes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear clientes autenticados" ON public.clientes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar clientes autenticados" ON public.clientes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar clientes autenticados" ON public.clientes FOR DELETE USING (auth.uid() IS NOT NULL);

-- Mesas
CREATE POLICY "Mesas visibles autenticados" ON public.mesas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear mesas autenticados" ON public.mesas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar mesas autenticados" ON public.mesas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar mesas autenticados" ON public.mesas FOR DELETE USING (auth.uid() IS NOT NULL);

-- Cuentas mesa
CREATE POLICY "Cuentas mesa visibles autenticados" ON public.cuentas_mesa FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear cuentas mesa autenticados" ON public.cuentas_mesa FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar cuentas mesa autenticados" ON public.cuentas_mesa FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar cuentas mesa autenticados" ON public.cuentas_mesa FOR DELETE USING (auth.uid() IS NOT NULL);

-- Detalle cuenta
CREATE POLICY "Detalle cuenta visible autenticados" ON public.detalle_cuenta FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear detalle cuenta autenticados" ON public.detalle_cuenta FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar detalle cuenta autenticados" ON public.detalle_cuenta FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar detalle cuenta autenticados" ON public.detalle_cuenta FOR DELETE USING (auth.uid() IS NOT NULL);

-- Recetas
CREATE POLICY "Recetas visibles autenticados" ON public.recetas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear recetas autenticados" ON public.recetas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar recetas autenticados" ON public.recetas FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar recetas autenticados" ON public.recetas FOR DELETE USING (auth.uid() IS NOT NULL);

-- Agregos
CREATE POLICY "Agregos visibles autenticados" ON public.agregos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear agregos autenticados" ON public.agregos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar agregos autenticados" ON public.agregos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar agregos autenticados" ON public.agregos FOR DELETE USING (auth.uid() IS NOT NULL);

-- Producto agregos
CREATE POLICY "Producto agregos visibles autenticados" ON public.producto_agregos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear producto agregos autenticados" ON public.producto_agregos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Eliminar producto agregos autenticados" ON public.producto_agregos FOR DELETE USING (auth.uid() IS NOT NULL);

-- Ventas
CREATE POLICY "Ventas visibles autenticados" ON public.ventas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear ventas autenticados" ON public.ventas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar ventas autenticados" ON public.ventas FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Venta items
CREATE POLICY "Venta items visibles autenticados" ON public.venta_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Crear venta items autenticados" ON public.venta_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Configuracion tienda
CREATE POLICY "Config tienda visible autenticados" ON public.configuracion_tienda FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Config tienda público lectura" ON public.configuracion_tienda FOR SELECT USING (true);
CREATE POLICY "Crear config tienda autenticados" ON public.configuracion_tienda FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar config tienda autenticados" ON public.configuracion_tienda FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =============================================
-- PASO 5: Storage bucket para PDFs
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('tarjetas-digitales', 'tarjetas-digitales', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "PDFs públicos lectura" ON storage.objects FOR SELECT USING (bucket_id = 'tarjetas-digitales');
CREATE POLICY "Upload PDFs autenticados" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tarjetas-digitales' AND auth.uid() IS NOT NULL);
CREATE POLICY "Delete PDFs autenticados" ON storage.objects FOR DELETE USING (bucket_id = 'tarjetas-digitales' AND auth.uid() IS NOT NULL);