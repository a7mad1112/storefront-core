import { searchProducts } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 96);
  const supplierCode = searchParams.get('supplierCode') || null;

  if (!q.trim()) {
    return Response.json({ products: [], totalCount: 0 });
  }

  const { products, totalCount } = await searchProducts(q, {
    limit,
    offset,
    supplierCode,
  });

  return Response.json({ products, totalCount });
}
