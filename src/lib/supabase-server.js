import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 *
 * Uses the service_role key which bypasses RLS —
 * this must ONLY be used in server components, API routes,
 * and server actions. NEVER import this file in client components.
 *
 * The service key has full access to all tables including
 * wholesale_price, margins, and sync_logs.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY. ' +
    'Check your .env.local file.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
