import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const now = new Date();
    let startDate = new Date();
    if (period === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'month') {
      startDate.setDate(now.getDate() - 30);
    } else {
      // default week
      startDate.setDate(now.getDate() - 7);
    }

    const { data, error } = await supabaseAdmin
      .from('analytics_visits')
      .select('session_id, page_path, visited_at')
      .gte('visited_at', startDate.toISOString())
      .order('visited_at', { ascending: true });

    if (error) {
      console.error('[admin analytics]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const visits = data || [];
    const totalVisits = visits.length;
    const uniqueSessions = new Set(visits.map((v) => v.session_id)).size;

    // Group for chart
    const chartMap = {};
    const pageMap = {};

    visits.forEach((v) => {
      // Page counts
      pageMap[v.page_path] = (pageMap[v.page_path] || 0) + 1;

      // Chart grouping
      const date = new Date(v.visited_at);
      let label = '';
      if (period === 'day') {
        label = `${date.getHours()}:00`;
      } else {
        label = `${date.getMonth() + 1}/${date.getDate()}`;
      }
      chartMap[label] = (chartMap[label] || 0) + 1;
    });

    const chartData = Object.keys(chartMap).map((label) => ({
      label,
      count: chartMap[label],
    }));

    const topPages = Object.keys(pageMap)
      .map((path) => ({ path, count: pageMap[path] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      totalVisits,
      uniqueSessions,
      chartData,
      topPages,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
