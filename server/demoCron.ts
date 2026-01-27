import cron from "node-cron";
import { db } from "./db";
import { ventas, inventario, ventaItems } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

export function startDemoCleanupCron() {
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Demo Cleanup] Starting demo data cleanup...");
    
    try {
      const demoVentas = await db.select({ id: ventas.id })
        .from(ventas)
        .where(eq(ventas.isDemo, true));
      
      if (demoVentas.length > 0) {
        const ventaIds = demoVentas.map(v => v.id);
        await db.delete(ventaItems).where(inArray(ventaItems.ventaId, ventaIds));
        await db.delete(ventas).where(eq(ventas.isDemo, true));
        console.log(`[Demo Cleanup] Deleted ${demoVentas.length} demo sales`);
      }

      const deletedInventory = await db.delete(inventario)
        .where(eq(inventario.isDemo, true))
        .returning({ id: inventario.id });
      
      if (deletedInventory.length > 0) {
        console.log(`[Demo Cleanup] Deleted ${deletedInventory.length} demo inventory items`);
      }

      console.log("[Demo Cleanup] Cleanup completed successfully");
    } catch (error) {
      console.error("[Demo Cleanup] Error during cleanup:", error);
    }
  });

  console.log("[Demo Cleanup] Cron job scheduled to run every 6 hours");
}

export async function seedDemoData(storeId: string) {
  const demoProducts = [
    { nombre: "Hamburguesa Clásica", categoria: "comidas", tipo: "producto_final", precio: "8.50", stock: 50 },
    { nombre: "Pizza Margherita", categoria: "comidas", tipo: "producto_final", precio: "12.00", stock: 30 },
    { nombre: "Ensalada César", categoria: "comidas", tipo: "producto_final", precio: "7.00", stock: 25 },
    { nombre: "Refresco Cola", categoria: "bebidas", tipo: "producto_final", precio: "2.50", stock: 100 },
    { nombre: "Agua Mineral", categoria: "bebidas", tipo: "producto_final", precio: "1.50", stock: 80 },
  ];

  try {
    const existing = await db.select({ id: inventario.id })
      .from(inventario)
      .where(eq(inventario.isDemo, true));

    if (existing.length > 0) {
      console.log("[Demo Seed] Demo products already exist");
      return;
    }

    const insertedProducts = await db.insert(inventario).values(
      demoProducts.map(p => ({
        ...p,
        puntoVentaId: storeId,
        isDemo: true,
      }))
    ).returning();

    console.log(`[Demo Seed] Created ${insertedProducts.length} demo products`);

    if (insertedProducts.length >= 2) {
      await db.insert(ventas).values([
        {
          puntoVentaId: storeId,
          vendedorId: "00000000-0000-0000-0000-000000000000",
          subtotal: "20.00",
          impuesto: "3.20",
          total: "23.20",
          metodoPago: "Efectivo",
          isDemo: true,
        },
        {
          puntoVentaId: storeId,
          vendedorId: "00000000-0000-0000-0000-000000000000",
          subtotal: "14.50",
          impuesto: "2.32",
          total: "16.82",
          metodoPago: "Tarjeta",
          isDemo: true,
        },
      ]);
      console.log("[Demo Seed] Created 2 demo sales");
    }
  } catch (error) {
    console.error("[Demo Seed] Error seeding demo data:", error);
  }
}
