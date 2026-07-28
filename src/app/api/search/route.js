import { searchProducts } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);

  if (!q.trim()) {
    return Response.json({ results: [] });
  }

  const { products } = await searchProducts(q, { limit, offset: 0 });

  const results = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    name_en: p.name_en || null,
    name_he: p.name_he || null,
    image_url: p.image_url || null,
    retail_price: p.retail_price || 0,
    slug: p.slug || p.id,
  }));

  return Response.json({ results });
}
