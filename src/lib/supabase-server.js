import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://oaxjbquwzeemizvndekc.supabase.co';

function getEnvValue(key, fallback = '') {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && ctx.env[key]) {
      return ctx.env[key];
    }
  } catch (e) {
    // Ignore outside Cloudflare Workers context
  }
  return fallback;
}

function initSupabaseAdmin() {
  const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL', FALLBACK_URL);
  const supabaseServiceKey = getEnvValue('SUPABASE_SERVICE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase Admin initialized without service key. Some server queries may fail.');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _supabaseAdmin = null;
export function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = initSupabaseAdmin();
  }
  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseAdmin();
    if (!client) {
      // Return a safe mock if service key is missing during build/prerender
      return () => Promise.resolve({ data: null, error: new Error('Missing SUPABASE_SERVICE_KEY') });
    }
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});


