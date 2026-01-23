import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage, // Guarda la sesión en el navegador
    persistSession: true, 
    autoRefreshToken: true,
  },
  // Configuración para Modo Offline
  global: {
    headers: { 'x-application-name': 'caiman-pos' },
  },
  db: {
    schema: 'public',
  }
});
