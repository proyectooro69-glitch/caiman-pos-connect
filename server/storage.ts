import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";

export interface IStorage {
  getPuntosVenta(): Promise<schema.PuntoVenta[]>;
  getPuntoVenta(id: string): Promise<schema.PuntoVenta | undefined>;
  createPuntoVenta(data: schema.InsertPuntoVenta): Promise<schema.PuntoVenta>;
  updatePuntoVenta(id: string, data: Partial<schema.InsertPuntoVenta>): Promise<schema.PuntoVenta | undefined>;
  
  getProfiles(): Promise<schema.Profile[]>;
  getProfile(id: string): Promise<schema.Profile | undefined>;
  getProfileByEmail(email: string): Promise<schema.Profile | undefined>;
  createProfile(data: schema.InsertProfile): Promise<schema.Profile>;
  updateProfile(id: string, data: Partial<schema.InsertProfile>): Promise<schema.Profile | undefined>;
  
  getUserRoles(userId: string): Promise<schema.UserRole[]>;
  createUserRole(data: schema.InsertUserRole): Promise<schema.UserRole>;
  
  getInventario(puntoVentaId: string): Promise<schema.Inventario[]>;
  getInventarioItem(id: string): Promise<schema.Inventario | undefined>;
  createInventario(data: schema.InsertInventario): Promise<schema.Inventario>;
  updateInventario(id: string, data: Partial<schema.InsertInventario>): Promise<schema.Inventario | undefined>;
  deleteInventario(id: string): Promise<boolean>;
  
  getClientes(puntoVentaId: string): Promise<schema.Cliente[]>;
  getCliente(id: string): Promise<schema.Cliente | undefined>;
  createCliente(data: schema.InsertCliente): Promise<schema.Cliente>;
  updateCliente(id: string, data: Partial<schema.InsertCliente>): Promise<schema.Cliente | undefined>;
  deleteCliente(id: string): Promise<boolean>;
  
  getMesas(puntoVentaId: string): Promise<schema.Mesa[]>;
  getMesa(id: string): Promise<schema.Mesa | undefined>;
  createMesa(data: schema.InsertMesa): Promise<schema.Mesa>;
  updateMesa(id: string, data: Partial<schema.InsertMesa>): Promise<schema.Mesa | undefined>;
  deleteMesa(id: string): Promise<boolean>;
  
  getCuentasMesa(mesaId: string): Promise<schema.CuentaMesa[]>;
  getCuentaMesa(id: string): Promise<schema.CuentaMesa | undefined>;
  createCuentaMesa(data: schema.InsertCuentaMesa): Promise<schema.CuentaMesa>;
  updateCuentaMesa(id: string, data: Partial<schema.InsertCuentaMesa>): Promise<schema.CuentaMesa | undefined>;
  
  getDetalleCuenta(cuentaId: string): Promise<schema.DetalleCuenta[]>;
  createDetalleCuenta(data: schema.InsertDetalleCuenta): Promise<schema.DetalleCuenta>;
  deleteDetalleCuenta(id: string): Promise<boolean>;
  
  getRecetas(productoFinalId: string): Promise<schema.Receta[]>;
  createReceta(data: schema.InsertReceta): Promise<schema.Receta>;
  deleteReceta(id: string): Promise<boolean>;
  
  getAgregos(puntoVentaId: string): Promise<schema.Agrego[]>;
  createAgrego(data: schema.InsertAgrego): Promise<schema.Agrego>;
  updateAgrego(id: string, data: Partial<schema.InsertAgrego>): Promise<schema.Agrego | undefined>;
  deleteAgrego(id: string): Promise<boolean>;
  
  getProductoAgregos(productoId: string): Promise<schema.ProductoAgrego[]>;
  createProductoAgrego(data: schema.InsertProductoAgrego): Promise<schema.ProductoAgrego>;
  deleteProductoAgrego(id: string): Promise<boolean>;
  
  getVentas(puntoVentaId: string): Promise<schema.Venta[]>;
  getVenta(id: string): Promise<schema.Venta | undefined>;
  createVenta(data: schema.InsertVenta): Promise<schema.Venta>;
  
  getVentaItems(ventaId: string): Promise<schema.VentaItem[]>;
  createVentaItem(data: schema.InsertVentaItem): Promise<schema.VentaItem>;
  
  getConfiguracionTienda(puntoVentaId: string): Promise<schema.ConfiguracionTienda | undefined>;
  createConfiguracionTienda(data: schema.InsertConfiguracionTienda): Promise<schema.ConfiguracionTienda>;
  updateConfiguracionTienda(puntoVentaId: string, data: Partial<schema.InsertConfiguracionTienda>): Promise<schema.ConfiguracionTienda | undefined>;
  
  getExpiringSubscriptions(targetDate: string): Promise<schema.PuntoVenta[]>;
  getGlobalSettings(puntoVentaId: string): Promise<schema.GlobalSettings | undefined>;
  createGlobalSettings(data: schema.InsertGlobalSettings): Promise<schema.GlobalSettings>;
  updateGlobalSettings(puntoVentaId: string, data: Partial<schema.InsertGlobalSettings>): Promise<schema.GlobalSettings | undefined>;
  getMovimientosCaja(puntoVentaId: string): Promise<schema.MovimientoCaja[]>;
  createMovimientoCaja(data: schema.InsertMovimientoCaja): Promise<schema.MovimientoCaja>;
}

export class DatabaseStorage implements IStorage {
  async getPuntosVenta(): Promise<schema.PuntoVenta[]> {
    return db.select().from(schema.puntosVenta);
  }

  async getPuntoVenta(id: string): Promise<schema.PuntoVenta | undefined> {
    const [result] = await db.select().from(schema.puntosVenta).where(eq(schema.puntosVenta.id, id));
    return result;
  }

  async createPuntoVenta(data: schema.InsertPuntoVenta): Promise<schema.PuntoVenta> {
    const [result] = await db.insert(schema.puntosVenta).values(data).returning();
    return result;
  }

  async updatePuntoVenta(id: string, data: Partial<schema.InsertPuntoVenta>): Promise<schema.PuntoVenta | undefined> {
    const [result] = await db.update(schema.puntosVenta).set({ ...data, updatedAt: new Date() }).where(eq(schema.puntosVenta.id, id)).returning();
    return result;
  }

  async getProfiles(): Promise<schema.Profile[]> {
    return db.select().from(schema.profiles);
  }

  async getProfile(id: string): Promise<schema.Profile | undefined> {
    const [result] = await db.select().from(schema.profiles).where(eq(schema.profiles.id, id));
    return result;
  }

  async getProfileByEmail(email: string): Promise<schema.Profile | undefined> {
    const [result] = await db.select().from(schema.profiles).where(eq(schema.profiles.email, email));
    return result;
  }

  async createProfile(data: schema.InsertProfile): Promise<schema.Profile> {
    const [result] = await db.insert(schema.profiles).values(data).returning();
    return result;
  }

  async updateProfile(id: string, data: Partial<schema.InsertProfile>): Promise<schema.Profile | undefined> {
    const [result] = await db.update(schema.profiles).set({ ...data, updatedAt: new Date() }).where(eq(schema.profiles.id, id)).returning();
    return result;
  }

  async getUserRoles(userId: string): Promise<schema.UserRole[]> {
    return db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, userId));
  }

  async createUserRole(data: schema.InsertUserRole): Promise<schema.UserRole> {
    const [result] = await db.insert(schema.userRoles).values(data).returning();
    return result;
  }

  async getInventario(puntoVentaId: string): Promise<schema.Inventario[]> {
    return db.select().from(schema.inventario).where(eq(schema.inventario.puntoVentaId, puntoVentaId));
  }

  async getInventarioItem(id: string): Promise<schema.Inventario | undefined> {
    const [result] = await db.select().from(schema.inventario).where(eq(schema.inventario.id, id));
    return result;
  }

  async createInventario(data: schema.InsertInventario): Promise<schema.Inventario> {
    const [result] = await db.insert(schema.inventario).values(data).returning();
    return result;
  }

  async updateInventario(id: string, data: Partial<schema.InsertInventario>): Promise<schema.Inventario | undefined> {
    const [result] = await db.update(schema.inventario).set({ ...data, updatedAt: new Date() }).where(eq(schema.inventario.id, id)).returning();
    return result;
  }

  async deleteInventario(id: string): Promise<boolean> {
    const result = await db.delete(schema.inventario).where(eq(schema.inventario.id, id));
    return true;
  }

  async getClientes(puntoVentaId: string): Promise<schema.Cliente[]> {
    return db.select().from(schema.clientes).where(eq(schema.clientes.puntoVentaId, puntoVentaId));
  }

  async getCliente(id: string): Promise<schema.Cliente | undefined> {
    const [result] = await db.select().from(schema.clientes).where(eq(schema.clientes.id, id));
    return result;
  }

  async createCliente(data: schema.InsertCliente): Promise<schema.Cliente> {
    const [result] = await db.insert(schema.clientes).values(data).returning();
    return result;
  }

  async updateCliente(id: string, data: Partial<schema.InsertCliente>): Promise<schema.Cliente | undefined> {
    const [result] = await db.update(schema.clientes).set({ ...data, updatedAt: new Date() }).where(eq(schema.clientes.id, id)).returning();
    return result;
  }

  async deleteCliente(id: string): Promise<boolean> {
    await db.delete(schema.clientes).where(eq(schema.clientes.id, id));
    return true;
  }

  async getMesas(puntoVentaId: string): Promise<schema.Mesa[]> {
    return db.select().from(schema.mesas).where(eq(schema.mesas.puntoVentaId, puntoVentaId));
  }

  async getMesa(id: string): Promise<schema.Mesa | undefined> {
    const [result] = await db.select().from(schema.mesas).where(eq(schema.mesas.id, id));
    return result;
  }

  async createMesa(data: schema.InsertMesa): Promise<schema.Mesa> {
    const [result] = await db.insert(schema.mesas).values(data).returning();
    return result;
  }

  async updateMesa(id: string, data: Partial<schema.InsertMesa>): Promise<schema.Mesa | undefined> {
    const [result] = await db.update(schema.mesas).set({ ...data, updatedAt: new Date() }).where(eq(schema.mesas.id, id)).returning();
    return result;
  }

  async deleteMesa(id: string): Promise<boolean> {
    await db.delete(schema.mesas).where(eq(schema.mesas.id, id));
    return true;
  }

  async getCuentasMesa(mesaId: string): Promise<schema.CuentaMesa[]> {
    return db.select().from(schema.cuentasMesa).where(eq(schema.cuentasMesa.mesaId, mesaId));
  }

  async getCuentaMesa(id: string): Promise<schema.CuentaMesa | undefined> {
    const [result] = await db.select().from(schema.cuentasMesa).where(eq(schema.cuentasMesa.id, id));
    return result;
  }

  async createCuentaMesa(data: schema.InsertCuentaMesa): Promise<schema.CuentaMesa> {
    const [result] = await db.insert(schema.cuentasMesa).values(data).returning();
    return result;
  }

  async updateCuentaMesa(id: string, data: Partial<schema.InsertCuentaMesa>): Promise<schema.CuentaMesa | undefined> {
    const [result] = await db.update(schema.cuentasMesa).set({ ...data, updatedAt: new Date() }).where(eq(schema.cuentasMesa.id, id)).returning();
    return result;
  }

  async getDetalleCuenta(cuentaId: string): Promise<schema.DetalleCuenta[]> {
    return db.select().from(schema.detalleCuenta).where(eq(schema.detalleCuenta.cuentaId, cuentaId));
  }

  async createDetalleCuenta(data: schema.InsertDetalleCuenta): Promise<schema.DetalleCuenta> {
    const [result] = await db.insert(schema.detalleCuenta).values(data).returning();
    return result;
  }

  async deleteDetalleCuenta(id: string): Promise<boolean> {
    await db.delete(schema.detalleCuenta).where(eq(schema.detalleCuenta.id, id));
    return true;
  }

  async getRecetas(productoFinalId: string): Promise<schema.Receta[]> {
    return db.select().from(schema.recetas).where(eq(schema.recetas.productoFinalId, productoFinalId));
  }

  async createReceta(data: schema.InsertReceta): Promise<schema.Receta> {
    const [result] = await db.insert(schema.recetas).values(data).returning();
    return result;
  }

  async deleteReceta(id: string): Promise<boolean> {
    await db.delete(schema.recetas).where(eq(schema.recetas.id, id));
    return true;
  }

  async getAgregos(puntoVentaId: string): Promise<schema.Agrego[]> {
    return db.select().from(schema.agregos).where(eq(schema.agregos.puntoVentaId, puntoVentaId));
  }

  async createAgrego(data: schema.InsertAgrego): Promise<schema.Agrego> {
    const [result] = await db.insert(schema.agregos).values(data).returning();
    return result;
  }

  async updateAgrego(id: string, data: Partial<schema.InsertAgrego>): Promise<schema.Agrego | undefined> {
    const [result] = await db.update(schema.agregos).set(data).where(eq(schema.agregos.id, id)).returning();
    return result;
  }

  async deleteAgrego(id: string): Promise<boolean> {
    await db.delete(schema.agregos).where(eq(schema.agregos.id, id));
    return true;
  }

  async getProductoAgregos(productoId: string): Promise<schema.ProductoAgrego[]> {
    return db.select().from(schema.productoAgregos).where(eq(schema.productoAgregos.productoId, productoId));
  }

  async createProductoAgrego(data: schema.InsertProductoAgrego): Promise<schema.ProductoAgrego> {
    const [result] = await db.insert(schema.productoAgregos).values(data).returning();
    return result;
  }

  async deleteProductoAgrego(id: string): Promise<boolean> {
    await db.delete(schema.productoAgregos).where(eq(schema.productoAgregos.id, id));
    return true;
  }

  async getVentas(puntoVentaId: string): Promise<schema.Venta[]> {
    return db.select().from(schema.ventas).where(eq(schema.ventas.puntoVentaId, puntoVentaId));
  }

  async getVenta(id: string): Promise<schema.Venta | undefined> {
    const [result] = await db.select().from(schema.ventas).where(eq(schema.ventas.id, id));
    return result;
  }

  async createVenta(data: schema.InsertVenta): Promise<schema.Venta> {
    const [result] = await db.insert(schema.ventas).values(data).returning();
    return result;
  }

  async getVentaItems(ventaId: string): Promise<schema.VentaItem[]> {
    return db.select().from(schema.ventaItems).where(eq(schema.ventaItems.ventaId, ventaId));
  }

  async createVentaItem(data: schema.InsertVentaItem): Promise<schema.VentaItem> {
    const [result] = await db.insert(schema.ventaItems).values(data).returning();
    return result;
  }

  async getConfiguracionTienda(puntoVentaId: string): Promise<schema.ConfiguracionTienda | undefined> {
    const [result] = await db.select().from(schema.configuracionTienda).where(eq(schema.configuracionTienda.puntoVentaId, puntoVentaId));
    return result;
  }

  async createConfiguracionTienda(data: schema.InsertConfiguracionTienda): Promise<schema.ConfiguracionTienda> {
    const [result] = await db.insert(schema.configuracionTienda).values(data).returning();
    return result;
  }

  async updateConfiguracionTienda(puntoVentaId: string, data: Partial<schema.InsertConfiguracionTienda>): Promise<schema.ConfiguracionTienda | undefined> {
    const [result] = await db.update(schema.configuracionTienda).set({ ...data, updatedAt: new Date() }).where(eq(schema.configuracionTienda.puntoVentaId, puntoVentaId)).returning();
    return result;
  }

  async getExpiringSubscriptions(targetDate: string): Promise<schema.PuntoVenta[]> {
    return db.select().from(schema.puntosVenta).where(eq(schema.puntosVenta.fechaVencimiento, targetDate));
  }

  async getGlobalSettings(puntoVentaId: string): Promise<schema.GlobalSettings | undefined> {
    const [result] = await db.select().from(schema.globalSettings).where(eq(schema.globalSettings.puntoVentaId, puntoVentaId));
    return result;
  }

  async createGlobalSettings(data: schema.InsertGlobalSettings): Promise<schema.GlobalSettings> {
    const [result] = await db.insert(schema.globalSettings).values(data).returning();
    return result;
  }

  async updateGlobalSettings(puntoVentaId: string, settings: Partial<schema.GlobalSettings>): Promise<schema.GlobalSettings | undefined> {
    const [updated] = await db.update(schema.globalSettings)
      .set({
        ...settings,
        stripeSecretKey: settings.stripeSecretKey === "********" ? undefined : settings.stripeSecretKey,
        updatedAt: new Date()
      })
      .where(eq(schema.globalSettings.puntoVentaId, puntoVentaId))
      .returning();
    return updated;
  }

  async getMovimientosCaja(puntoVentaId: string): Promise<schema.MovimientoCaja[]> {
    return db.select().from(schema.movimientosCaja).where(eq(schema.movimientosCaja.puntoVentaId, puntoVentaId));
  }

  async createMovimientoCaja(data: schema.InsertMovimientoCaja): Promise<schema.MovimientoCaja> {
    const [result] = await db.insert(schema.movimientosCaja).values(data).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
