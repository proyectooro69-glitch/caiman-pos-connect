import { pgTable, uuid, text, numeric, integer, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["administrador", "supervisor", "vendedor"]);

export const puntosVenta = pgTable("puntos_venta", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  direccion: text("direccion"),
  email: text("email"),
  telefono: text("telefono"),
  movil: text("movil"),
  logoUrl: text("logo_url"),
  web: text("web"),
  imagenUrl: text("imagen_url"),
  fechaVencimiento: date("fecha_vencimiento"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  nombre: text("nombre"),
  apellido: text("apellido"),
  avatarUrl: text("avatar_url"),
  puntoVentaId: uuid("punto_venta_id").references(() => puntosVenta.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  role: appRoleEnum("role").default("vendedor").notNull(),
  storeId: uuid("store_id").references(() => puntosVenta.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventario = pgTable("inventario", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  categoria: text("categoria").default("otros"),
  tipo: text("tipo").default("producto_final"),
  precio: numeric("precio", { precision: 10, scale: 2 }).notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  stockMinimo: integer("stock_minimo").default(5),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id),
  imagenUrl: text("imagen_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientes = pgTable("clientes", {
  id: uuid("id").defaultRandom().primaryKey(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  email: text("email"),
  tipo: text("tipo").default("presencial"),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mesas = pgTable("mesas", {
  id: uuid("id").defaultRandom().primaryKey(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id),
  numero: integer("numero").notNull(),
  capacidad: integer("capacidad").default(4),
  estado: text("estado").default("libre"),
  posicionX: integer("posicion_x").default(0),
  posicionY: integer("posicion_y").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cuentasMesa = pgTable("cuentas_mesa", {
  id: uuid("id").defaultRandom().primaryKey(),
  mesaId: uuid("mesa_id").notNull().references(() => mesas.id, { onDelete: "cascade" }),
  estado: text("estado").default("abierta"),
  total: numeric("total", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const detalleCuenta = pgTable("detalle_cuenta", {
  id: uuid("id").defaultRandom().primaryKey(),
  cuentaId: uuid("cuenta_id").notNull().references(() => cuentasMesa.id, { onDelete: "cascade" }),
  productoId: uuid("producto_id").notNull().references(() => inventario.id),
  cantidad: integer("cantidad").notNull().default(1),
  precioUnitario: numeric("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const recetas = pgTable("recetas", {
  id: uuid("id").defaultRandom().primaryKey(),
  productoFinalId: uuid("producto_final_id").notNull().references(() => inventario.id, { onDelete: "cascade" }),
  insumoId: uuid("insumo_id").notNull().references(() => inventario.id, { onDelete: "cascade" }),
  cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull().default("1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const agregos = pgTable("agregos", {
  id: uuid("id").defaultRandom().primaryKey(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id),
  nombre: text("nombre").notNull(),
  precio: numeric("precio", { precision: 10, scale: 2 }).notNull().default("0"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productoAgregos = pgTable("producto_agregos", {
  id: uuid("id").defaultRandom().primaryKey(),
  productoId: uuid("producto_id").notNull().references(() => inventario.id, { onDelete: "cascade" }),
  agregoId: uuid("agrego_id").notNull().references(() => agregos.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ventas = pgTable("ventas", {
  id: uuid("id").defaultRandom().primaryKey(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id),
  vendedorId: uuid("vendedor_id").notNull(),
  clienteId: uuid("cliente_id").references(() => clientes.id),
  mesaId: uuid("mesa_id").references(() => mesas.id),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  impuesto: numeric("impuesto", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  metodoPago: text("metodo_pago").default("Efectivo"),
  estado: text("estado").default("completada"),
  esExterna: boolean("es_externa").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ventaItems = pgTable("venta_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  ventaId: uuid("venta_id").notNull().references(() => ventas.id, { onDelete: "cascade" }),
  productoId: uuid("producto_id").notNull().references(() => inventario.id),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  agregos: text("agregos"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const configuracionTienda = pgTable("configuracion_tienda", {
  id: uuid("id").defaultRandom().primaryKey(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id).unique(),
  nombreNegocio: text("nombre_negocio"),
  whatsapp: text("whatsapp"),
  direccion: text("direccion"),
  pdfTarjetaUrl: text("pdf_tarjeta_url"),
  logoUrl: text("logo_url"),
  descripcion: text("descripcion"),
  horario: text("horario"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const globalSettings = pgTable("global_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id).unique(),
  nombreNegocio: text("nombre_negocio").notNull(),
  logoUrl: text("logo_url"),
  direccion: text("direccion"),
  telefono: text("telefono"),
  correo: text("correo"),
  moneda: text("moneda").default("USD"),
  zonaHoraria: text("zona_horaria").default("UTC"),
  porcentajeIva: numeric("porcentaje_iva", { precision: 5, scale: 2 }).default("16.00"),
  mensajeLegal: text("mensaje_legal"),
  stripeKey: text("stripe_key"),
  paypalEmail: text("paypal_email"),
});

export const movimientosCaja = pgTable("movimientos_caja", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  puntoVentaId: uuid("punto_venta_id").notNull().references(() => puntosVenta.id),
  tipo: text("tipo").notNull(), // apertura, cierre, entrada, salida
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).defaultNow(),
  observaciones: text("observaciones"),
  diferencia: numeric("diferencia", { precision: 12, scale: 2 }),
});

export const insertGlobalSettingsSchema = createInsertSchema(globalSettings).omit({ id: true });
export const insertMovimientosCajaSchema = createInsertSchema(movimientosCaja).omit({ id: true });

export type GlobalSettings = typeof globalSettings.$inferSelect;
export type InsertGlobalSettings = z.infer<typeof insertGlobalSettingsSchema>;
export type MovimientoCaja = typeof movimientosCaja.$inferSelect;
export type InsertMovimientoCaja = z.infer<typeof insertMovimientosCajaSchema>;
export const insertProfileSchema = createInsertSchema(profiles).omit({ createdAt: true, updatedAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true });
export const insertInventarioSchema = createInsertSchema(inventario).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMesaSchema = createInsertSchema(mesas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCuentaMesaSchema = createInsertSchema(cuentasMesa).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDetalleCuentaSchema = createInsertSchema(detalleCuenta).omit({ id: true, createdAt: true });
export const insertRecetaSchema = createInsertSchema(recetas).omit({ id: true, createdAt: true });
export const insertAgregoSchema = createInsertSchema(agregos).omit({ id: true, createdAt: true });
export const insertProductoAgregoSchema = createInsertSchema(productoAgregos).omit({ id: true, createdAt: true });
export const insertVentaSchema = createInsertSchema(ventas).omit({ id: true, createdAt: true });
export const insertVentaItemSchema = createInsertSchema(ventaItems).omit({ id: true, createdAt: true });
export const insertConfiguracionTiendaSchema = createInsertSchema(configuracionTienda).omit({ id: true, createdAt: true, updatedAt: true });

export type PuntoVenta = typeof puntosVenta.$inferSelect;
export type InsertPuntoVenta = z.infer<typeof insertPuntoVentaSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type Inventario = typeof inventario.$inferSelect;
export type InsertInventario = z.infer<typeof insertInventarioSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Mesa = typeof mesas.$inferSelect;
export type InsertMesa = z.infer<typeof insertMesaSchema>;
export type CuentaMesa = typeof cuentasMesa.$inferSelect;
export type InsertCuentaMesa = z.infer<typeof insertCuentaMesaSchema>;
export type DetalleCuenta = typeof detalleCuenta.$inferSelect;
export type InsertDetalleCuenta = z.infer<typeof insertDetalleCuentaSchema>;
export type Receta = typeof recetas.$inferSelect;
export type InsertReceta = z.infer<typeof insertRecetaSchema>;
export type Agrego = typeof agregos.$inferSelect;
export type InsertAgrego = z.infer<typeof insertAgregoSchema>;
export type ProductoAgrego = typeof productoAgregos.$inferSelect;
export type InsertProductoAgrego = z.infer<typeof insertProductoAgregoSchema>;
export type Venta = typeof ventas.$inferSelect;
export type InsertVenta = z.infer<typeof insertVentaSchema>;
export type VentaItem = typeof ventaItems.$inferSelect;
export type InsertVentaItem = z.infer<typeof insertVentaItemSchema>;
export type ConfiguracionTienda = typeof configuracionTienda.$inferSelect;
export type InsertConfiguracionTienda = z.infer<typeof insertConfiguracionTiendaSchema>;
