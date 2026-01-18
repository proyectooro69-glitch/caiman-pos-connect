// Helper para crear cliente supabase sin tipos estrictos
// Usar para tablas que pueden no estar en los tipos generados
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Cliente sin tipado estricto para consultas dinámicas
export const supabaseUntyped = createClient(supabaseUrl, supabaseAnonKey);
