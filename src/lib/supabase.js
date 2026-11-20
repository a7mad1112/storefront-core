import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://oaxjbquwzeemizvndekc.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heGpicXV3emVlbWl6dm5kZWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDAwMDksImV4cCI6MjA5ODQxNjAwOX0.wSMOeqsc1P-BrtStaz6y9ACMHNaCd35F1pV2bvBbdWY';

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

function initSupabase() {
  const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL', FALLBACK_URL);
  const supabaseAnonKey = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', FALLBACK_ANON_KEY);
  return createClient(supabaseUrl, supabaseAnonKey);
}

let _supabase = null;
export function getSupabase() {
  if (!_supabase) {
    _supabase = initSupabase();
  }
  return _supabase;
}

export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabase();
    const val = client[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});

