import type { Express } from "express";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export function registerRoutes(app: Express) {
  // --- RUTAS DE AUTENTICACIÓN ---
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (authData.user) {
        const newUser = await storage.createProfile({
          id: authData.user.id,
          username: username || email.split('@')[0],
          email: email,
        });
        res.status(201).json(newUser);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: "Credenciales inválidas" });
      res.json({ user: data.user, session: data.session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- TUS OTRAS RUTAS (INVENTARIO, VENTAS, ETC) ---
  app.get("/api/proxy/products", async (req, res) => {
    try {
      const { data, error } = await supabase.from('inventario').select('*').eq('tipo', 'producto_final');
      if (error) throw error;
      res.json(data);
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // (Manten el resto de tus rutas de puntos de venta, inventario, etc. igual que antes)
  
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
}
