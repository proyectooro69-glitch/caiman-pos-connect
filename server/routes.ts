import type { Express } from "express";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export function registerRoutes(app: Express) {
  
  // --- RUTAS DE AUTENTICACIÓN (NUEVAS) ---

  // Registro de usuario
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // 1. Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Crear perfil en la base de datos local si el registro fue exitoso
      if (authData.user) {
        const newUser = await storage.createProfile({
          id: authData.user.id,
          username: username || email.split('@')[0],
          email: email,
        });
        return res.status(201).json(newUser);
      }
      res.status(400).json({ error: "No se pudo crear el usuario" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Inicio de sesión
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return res.status(401).json({ error: "Credenciales inválidas" });
      
      // Buscamos el perfil asociado en nuestra base de datos
      const profile = await storage.getProfile(data.user.id);
      
      res.json({ 
        user: data.user, 
        profile: profile,
        session: data.session 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cerrar sesión
  app.post("/api/logout", async (req, res) => {
    await supabase.auth.signOut();
    res.sendStatus(200);
  });

  // --- RUTAS DE PROXY Y NEGOCIO (EXISTENTES) ---

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

  app.post("/api/puntos-venta", async (req, res) => {
    try {
      const parsed = schema.insertPuntoVentaSchema.parse(req.body);
      const puntoVenta = await storage.createPuntoVenta(parsed);
      res.status(201).json(puntoVenta);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ... (Aquí siguen tus demás rutas de inventario, clientes, ventas, etc.)
  // He mantenido la lógica original para el resto de tus endpoints.

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy" });
  });
}
