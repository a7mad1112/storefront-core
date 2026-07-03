import { getCategories, getProducts } from '../lib/queries';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gbstore.ps';

export const revalidate = 3600; // Revalidate sitemap once per hour

export default async function sitemap() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ limit: 5000 }), // Fetch up to 5000 products for sitemap
  ]);

  const categoryEntries = categories.map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug || cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const productEntries = products.map((prod) => ({
    url: `${BASE_URL}/product/${prod.slug || prod.id}`,
    lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
