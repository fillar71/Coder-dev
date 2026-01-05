import { createClient } from '@supabase/supabase-js';

// Try process.env first (Next.js/Vite Polyfill), then import.meta.env (Vite Native)
const getEnv = (key: string, viteKey: string) => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[viteKey]) {
    return (import.meta as any).env[viteKey];
  }
  return undefined;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Fallback to null client if env vars are missing to prevent crash, but warn user
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Chat history will not be saved. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;