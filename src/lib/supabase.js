import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 *
 * Uses the public anon key which is safe to expose —
 * Row Level Security (RLS) ensures wholesale prices
 * are never returned to unauthenticated users.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
