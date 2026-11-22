import { createClient } from '@supabase/supabase-js';
import { getSupabase } from './supabase.js';

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

let _supabaseAdmin = null;

export function getSupabaseAdmin() {
  const serviceKey = getEnvValue('SUPABASE_SERVICE_KEY');
  if (serviceKey) {
    if (!_supabaseAdmin || !_supabaseAdmin._hasServiceKey) {
      const url = getEnvValue('NEXT_PUBLIC_SUPABASE_URL', FALLBACK_URL);
      _supabaseAdmin = createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      _supabaseAdmin._hasServiceKey = true;
    }
    return _supabaseAdmin;
  }
  // Fallback to standard client so server queries never crash
  return getSupabase();
}

export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseAdmin() || getSupabase();
    if (!client) {
      return () => Promise.resolve({ data: null, error: new Error('Missing Supabase client') });
    }
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});



