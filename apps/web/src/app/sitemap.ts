import { MetadataRoute } from 'next';
import { CANONICAL_CATEGORIES, MP_DIVISIONS_AND_DISTRICTS } from '../lib/constants';
import { fetchPublishedArticles } from '../lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://breakingnewswala.in';
  const now = new Date();

  // 1. Root Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];

  // 2. 21 Approved Canonical Categories
  for (const cat of CANONICAL_CATEGORIES) {
    routes.push({
      url: `${siteUrl}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    });
  }

  // 3. 55 Madhya Pradesh Districts
  for (const div of MP_DIVISIONS_AND_DISTRICTS) {
    for (const dist of div.districts) {
      routes.push({
        url: `${siteUrl}/district/${dist.slug}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.8,
      });
    }
  }

  // 4. Recently Published Articles
  try {
    const articlesRes = await fetchPublishedArticles({ limit: 50 });
    for (const art of articlesRes.items) {
      routes.push({
        url: `${siteUrl}/news/${art.slug}`,
        lastModified: art.updatedAt ? new Date(art.updatedAt) : new Date(art.publishedAt),
        changeFrequency: 'daily',
        priority: 0.9,
      });
    }
  } catch {
    // If API unavailable at sitemap generation time, base pages still serve
  }

  return routes;
}

