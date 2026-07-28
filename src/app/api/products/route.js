import { getProductsForCategory } from '../../../lib/queries';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId') || '';
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') || '48', 10), 96);
  const sort = searchParams.get('sort') || 'default';
  const supplierCode = searchParams.get('supplierCode') || null;

  if (!categoryId) {
    return Response.json({ products: [], totalCount: 0 });
  }

  const { products, totalCount } = await getProductsForCategory(categoryId, {
    limit,
    offset,
    sort,
    supplierCode,
  });

  return Response.json({ products, totalCount });
}
