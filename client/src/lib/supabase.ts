import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  localStorage.getItem('zoralive_supabase_url') ||
  'https://sacnahwrigdrdriwauaw.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  localStorage.getItem('zoralive_supabase_anon_key') ||
  'sb_publishable_suOWx1eM-Uy9MrKyn5BcXA_RcdeHCEj';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder'
);

export function configureSupabase(url: string, key: string) {
  try {
    localStorage.setItem('zoralive_supabase_url', url.trim());
    localStorage.setItem('zoralive_supabase_anon_key', key.trim());
    window.location.reload();
  } catch (e) {
    console.error('Failed to save Supabase config:', e);
  }
}
