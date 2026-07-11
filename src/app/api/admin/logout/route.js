import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[Admin Logout API Error]', err);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete('gb_admin_token');
  return response;
}
