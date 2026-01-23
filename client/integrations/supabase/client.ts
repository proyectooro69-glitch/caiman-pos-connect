// This file is updated to work with Render and Caiman POS Offline Mode
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Usamos los nombres de variables que configuramos en el panel de Environment de Render
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Atención: Las credenciales de Supabase no están cargadas correctamente. Revisa el panel de Render.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true, // Crucial para que el vendedor no pierda la sesión sin internet
    autoRefreshToken: true,
  }
});
