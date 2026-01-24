// Helper para crear cliente supabase sin tipos estrictos
import { createClient } from '@supabase/supabase-js';

// CAMBIA ESTA LÍNEA:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// AHORA COINCIDE CON NETLIFY:
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; 

// Cliente sin tipado estricto para consultas dinámicas
export const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey);
