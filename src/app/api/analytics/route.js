import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { session_id, page_path, referrer, user_agent } = body;

    if (!session_id || !page_path) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('analytics_visits').insert({
      session_id,
      page_path,
      referrer: referrer || null,
      user_agent: user_agent || null,
      visited_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[analytics beacon]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
