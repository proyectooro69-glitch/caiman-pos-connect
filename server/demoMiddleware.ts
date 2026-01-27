import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_EMAIL = "demo@caimanpos.com";

const PROTECTED_TABLES = [
  "profiles",
  "user_roles",
  "puntos_venta",
  "global_settings",
  "configuracion_tienda",
];

const READ_ONLY_ROUTES = [
  { method: "DELETE", paths: ["/api/profiles", "/api/user-roles", "/api/puntos-venta", "/api/settings", "/api/configuracion-tienda"] },
  { method: "PUT", paths: ["/api/profiles", "/api/puntos-venta", "/api/settings", "/api/configuracion-tienda"] },
  { method: "PATCH", paths: ["/api/profiles", "/api/puntos-venta", "/api/settings", "/api/configuracion-tienda"] },
];

export async function isDemoUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const { data: role, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !role) return false;
    return role.role === "guest";
  } catch {
    return false;
  }
}

export async function checkDemoRestrictions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const token = authHeader.replace("Bearer ", "");
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next();
    }

    if (user.email !== DEMO_EMAIL) {
      return next();
    }

    const method = req.method.toUpperCase();
    const path = req.path;

    for (const route of READ_ONLY_ROUTES) {
      if (route.method === method) {
        for (const protectedPath of route.paths) {
          if (path.startsWith(protectedPath)) {
            return res.status(403).json({
              error: "Acción no permitida en el modo de prueba",
              code: "DEMO_MODE_RESTRICTED",
            });
          }
        }
      }
    }

    next();
  } catch {
    next();
  }
}

export function getDemoConfig() {
  return {
    email: DEMO_EMAIL,
    password: "demo123",
  };
}
