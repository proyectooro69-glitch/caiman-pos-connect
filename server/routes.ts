import type { Express } from "express";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export function registerRoutes(app: Express) {
  // Proxy for public products
  app.get("/api/proxy/products", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('tipo', 'producto_final');
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Proxy for store config (PDF/QR urls)
  app.get("/api/proxy/config/:storeId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('configuracion_tienda')
        .select('*')
        .eq('punto_venta_id', req.params.storeId)
        .maybeSingle();
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/puntos-venta", async (req, res) => {
    try {
      const puntosVenta = await storage.getPuntosVenta();
      res.json(puntosVenta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/puntos-venta/:id", async (req, res) => {
    try {
      const puntoVenta = await storage.getPuntoVenta(req.params.id);
      if (!puntoVenta) {
        return res.status(404).json({ error: "Punto de venta no encontrado" });
      }
      res.json(puntoVenta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/puntos-venta", async (req, res) => {
    try {
      const parsed = schema.insertPuntoVentaSchema.parse(req.body);
      const puntoVenta = await storage.createPuntoVenta(parsed);
      res.status(201).json(puntoVenta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/puntos-venta/:id", async (req, res) => {
    try {
      const puntoVenta = await storage.updatePuntoVenta(req.params.id, req.body);
      if (!puntoVenta) {
        return res.status(404).json({ error: "Punto de venta no encontrado" });
      }
      res.json(puntoVenta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/profiles", async (req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Perfil no encontrado" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const parsed = schema.insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(parsed);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.updateProfile(req.params.id, req.body);
      if (!profile) {
        return res.status(404).json({ error: "Perfil no encontrado" });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/user-roles/:userId", async (req, res) => {
    try {
      const roles = await storage.getUserRoles(req.params.userId);
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user-roles", async (req, res) => {
    try {
      const parsed = schema.insertUserRoleSchema.parse(req.body);
      const role = await storage.createUserRole(parsed);
      res.status(201).json(role);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/inventario", async (req, res) => {
    try {
      const puntoVentaId = req.query.puntoVentaId as string;
      if (!puntoVentaId) {
        return res.status(400).json({ error: "puntoVentaId es requerido" });
      }
      const inventario = await storage.getInventario(puntoVentaId);
      res.json(inventario);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/inventario/:id", async (req, res) => {
    try {
      const item = await storage.getInventarioItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/inventario", async (req, res) => {
    try {
      const parsed = schema.insertInventarioSchema.parse(req.body);
      const item = await storage.createInventario(parsed);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/inventario/:id", async (req, res) => {
    try {
      const item = await storage.updateInventario(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/inventario/:id", async (req, res) => {
    try {
      await storage.deleteInventario(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clientes", async (req, res) => {
    try {
      const puntoVentaId = req.query.puntoVentaId as string;
      if (!puntoVentaId) {
        return res.status(400).json({ error: "puntoVentaId es requerido" });
      }
      const clientes = await storage.getClientes(puntoVentaId);
      res.json(clientes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clientes", async (req, res) => {
    try {
      const parsed = schema.insertClienteSchema.parse(req.body);
      const cliente = await storage.createCliente(parsed);
      res.status(201).json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/clientes/:id", async (req, res) => {
    try {
      const cliente = await storage.updateCliente(req.params.id, req.body);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(cliente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      await storage.deleteCliente(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/mesas", async (req, res) => {
    try {
      const puntoVentaId = req.query.puntoVentaId as string;
      if (!puntoVentaId) {
        return res.status(400).json({ error: "puntoVentaId es requerido" });
      }
      const mesas = await storage.getMesas(puntoVentaId);
      res.json(mesas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/mesas", async (req, res) => {
    try {
      const parsed = schema.insertMesaSchema.parse(req.body);
      const mesa = await storage.createMesa(parsed);
      res.status(201).json(mesa);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/mesas/:id", async (req, res) => {
    try {
      const mesa = await storage.updateMesa(req.params.id, req.body);
      if (!mesa) {
        return res.status(404).json({ error: "Mesa no encontrada" });
      }
      res.json(mesa);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/mesas/:id", async (req, res) => {
    try {
      await storage.deleteMesa(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cuentas-mesa", async (req, res) => {
    try {
      const mesaId = req.query.mesaId as string;
      if (!mesaId) {
        return res.status(400).json({ error: "mesaId es requerido" });
      }
      const cuentas = await storage.getCuentasMesa(mesaId);
      res.json(cuentas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cuentas-mesa", async (req, res) => {
    try {
      const parsed = schema.insertCuentaMesaSchema.parse(req.body);
      const cuenta = await storage.createCuentaMesa(parsed);
      res.status(201).json(cuenta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/cuentas-mesa/:id", async (req, res) => {
    try {
      const cuenta = await storage.updateCuentaMesa(req.params.id, req.body);
      if (!cuenta) {
        return res.status(404).json({ error: "Cuenta no encontrada" });
      }
      res.json(cuenta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/detalle-cuenta", async (req, res) => {
    try {
      const cuentaId = req.query.cuentaId as string;
      if (!cuentaId) {
        return res.status(400).json({ error: "cuentaId es requerido" });
      }
      const detalles = await storage.getDetalleCuenta(cuentaId);
      res.json(detalles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/detalle-cuenta", async (req, res) => {
    try {
      const parsed = schema.insertDetalleCuentaSchema.parse(req.body);
      const detalle = await storage.createDetalleCuenta(parsed);
      res.status(201).json(detalle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/detalle-cuenta/:id", async (req, res) => {
    try {
      await storage.deleteDetalleCuenta(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/recetas", async (req, res) => {
    try {
      const productoFinalId = req.query.productoFinalId as string;
      if (!productoFinalId) {
        return res.status(400).json({ error: "productoFinalId es requerido" });
      }
      const recetas = await storage.getRecetas(productoFinalId);
      res.json(recetas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recetas", async (req, res) => {
    try {
      const parsed = schema.insertRecetaSchema.parse(req.body);
      const receta = await storage.createReceta(parsed);
      res.status(201).json(receta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/recetas/:id", async (req, res) => {
    try {
      await storage.deleteReceta(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agregos", async (req, res) => {
    try {
      const puntoVentaId = req.query.puntoVentaId as string;
      if (!puntoVentaId) {
        return res.status(400).json({ error: "puntoVentaId es requerido" });
      }
      const agregos = await storage.getAgregos(puntoVentaId);
      res.json(agregos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agregos", async (req, res) => {
    try {
      const parsed = schema.insertAgregoSchema.parse(req.body);
      const agrego = await storage.createAgrego(parsed);
      res.status(201).json(agrego);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/agregos/:id", async (req, res) => {
    try {
      const agrego = await storage.updateAgrego(req.params.id, req.body);
      if (!agrego) {
        return res.status(404).json({ error: "Agrego no encontrado" });
      }
      res.json(agrego);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/agregos/:id", async (req, res) => {
    try {
      await storage.deleteAgrego(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/producto-agregos", async (req, res) => {
    try {
      const productoId = req.query.productoId as string;
      if (!productoId) {
        return res.status(400).json({ error: "productoId es requerido" });
      }
      const productoAgregos = await storage.getProductoAgregos(productoId);
      res.json(productoAgregos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/producto-agregos", async (req, res) => {
    try {
      const parsed = schema.insertProductoAgregoSchema.parse(req.body);
      const productoAgrego = await storage.createProductoAgrego(parsed);
      res.status(201).json(productoAgrego);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/producto-agregos/:id", async (req, res) => {
    try {
      await storage.deleteProductoAgrego(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ventas", async (req, res) => {
    try {
      const puntoVentaId = req.query.puntoVentaId as string;
      if (!puntoVentaId) {
        return res.status(400).json({ error: "puntoVentaId es requerido" });
      }
      const ventas = await storage.getVentas(puntoVentaId);
      res.json(ventas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ventas/:id", async (req, res) => {
    try {
      const venta = await storage.getVenta(req.params.id);
      if (!venta) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }
      res.json(venta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ventas", async (req, res) => {
    try {
      const parsed = schema.insertVentaSchema.parse(req.body);
      const venta = await storage.createVenta(parsed);
      res.status(201).json(venta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/venta-items", async (req, res) => {
    try {
      const ventaId = req.query.ventaId as string;
      if (!ventaId) {
        return res.status(400).json({ error: "ventaId es requerido" });
      }
      const items = await storage.getVentaItems(ventaId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/venta-items", async (req, res) => {
    try {
      const parsed = schema.insertVentaItemSchema.parse(req.body);
      const item = await storage.createVentaItem(parsed);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/configuracion-tienda/:puntoVentaId", async (req, res) => {
    try {
      const config = await storage.getConfiguracionTienda(req.params.puntoVentaId);
      res.json(config || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/configuracion-tienda", async (req, res) => {
    try {
      const parsed = schema.insertConfiguracionTiendaSchema.parse(req.body);
      const config = await storage.createConfiguracionTienda(parsed);
      res.status(201).json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/configuracion-tienda/:puntoVentaId", async (req, res) => {
    try {
      const config = await storage.updateConfiguracionTienda(req.params.puntoVentaId, req.body);
      if (!config) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Global Settings Routes
  app.get("/api/settings/:puntoVentaId", async (req, res) => {
    try {
      const settings = await storage.getGlobalSettings(req.params.puntoVentaId);
      res.json(settings || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const parsed = schema.insertGlobalSettingsSchema.parse(req.body);
      const settings = await storage.createGlobalSettings(parsed);
      res.status(201).json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/settings/:puntoVentaId", async (req, res) => {
    try {
      const { 
        nombreNegocio, logoUrl, direccion, telefono, correo, moneda, 
        zonaHoraria, porcentajeIva, mensajeLegal,
        stripePublicKey, stripeSecretKey, paypalClientId,
        transfermovilPhone, transfermovilCardCup, walletAddressUsdt,
        cryptoNetwork, currencyCode
      } = req.body;

      const settings = await storage.updateGlobalSettings(req.params.puntoVentaId, {
        nombreNegocio, logoUrl, direccion, telefono, correo, moneda, 
        zonaHoraria, porcentajeIva, mensajeLegal
      });

      if (stripePublicKey !== undefined || stripeSecretKey !== undefined || paypalClientId !== undefined ||
          transfermovilPhone !== undefined || transfermovilCardCup !== undefined || 
          walletAddressUsdt !== undefined || cryptoNetwork !== undefined || currencyCode !== undefined) {
        await storage.updatePuntoVenta(req.params.puntoVentaId, {
          stripePublicKey,
          stripeSecretKey: stripeSecretKey === "********" ? undefined : stripeSecretKey,
          paypalClientId,
          transfermovilPhone, transfermovilCardCup, walletAddressUsdt,
          cryptoNetwork, currencyCode
        });
      }

      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Caja Routes
  app.get("/api/caja/:puntoVentaId", async (req, res) => {
    try {
      const movimientos = await storage.getMovimientosCaja(req.params.puntoVentaId);
      res.json(movimientos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/caja", async (req, res) => {
    try {
      const parsed = schema.insertMovimientosCajaSchema.parse(req.body);
      const movimiento = await storage.createMovimientoCaja(parsed);
      res.status(201).json(movimiento);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });
}
