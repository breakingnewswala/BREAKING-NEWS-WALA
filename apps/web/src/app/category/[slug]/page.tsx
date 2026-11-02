import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchCategories,
  fetchPublishedArticles,
  fetchTrendingArticles,
} from '../../../lib/api';
import { PublicSubcategory } from '../../../lib/types';
import { CANONICAL_CATEGORIES } from '../../../lib/constants';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { NewsCardStandard } from '../../../components/NewsCardStandard';
import { NewsCardCompact } from '../../../components/NewsCardCompact';
import { InArticleAdSlot } from '../../../components/InArticleAdSlot';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string; sub?: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonicalCategory = CANONICAL_CATEGORIES.find(
    (c) => c.slug.toLowerCase() === slug.toLowerCase()
  );

  const nameHi = canonicalCategory ? canonicalCategory.nameHi : slug;

  return {
    title: `${nameHi} समाचार — ताज़ा अपडेट एवं ग्राउंड रिपोर्ट`,
    description: `मध्य प्रदेश एवं राष्ट्रीय स्तर पर ${nameHi} से जुड़ी ताज़ा ब्रेकिंग न्यूज़, विस्तृत विश्लेषण और निष्पक्ष रिपोर्टिंग।`,
    alternates: {
      canonical: `/category/${slug}`,
    },
    openGraph: {
      title: `${nameHi} समाचार | BREAKING NEWS WALA`,
      description: `मध्य प्रदेश में ${nameHi} की ताज़ा और प्रामाणिक खबरें।`,
      url: `/category/${slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10) || 1;

  const categories = await fetchCategories();
  const currentCategory =
    categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) ||
    CANONICAL_CATEGORIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase());

  if (!currentCategory) {
    notFound();
  }

  // Find rich subcategories if available
  const subcategories: PublicSubcategory[] =
    'subcategories' in currentCategory && Array.isArray((currentCategory as any).subcategories)
      ? ((currentCategory as any).subcategories as PublicSubcategory[])
      : [];

  // Fetch published articles in this category
  const [articlesRes, trendingArticles] = await Promise.all([
    fetchPublishedArticles({
      categoryId: currentCategory.id,
      page: currentPage,
      limit: 12,
    }),
    fetchTrendingArticles(5),
  ]);

  const articles = articlesRes.items;
  const totalPages = articlesRes.pagination.totalPages;

  return (
    <main className="site-container py-4 sm:py-6">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { labelHindi: 'श्रेणियां', href: '/' },
          { labelHindi: currentCategory.nameHi },
        ]}
      />

      {/* 2. Category Header */}
      <header className="my-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="w-2 h-8 bg-[#ED1727] rounded-full inline-block" aria-hidden="true" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-normal">
            {currentCategory.nameHi} समाचार
          </h1>
          <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2.5 py-1 rounded-full uppercase tracking-wider">
            {currentCategory.nameEn}
          </span>
        </div>

        {/* Subcategories Filter Pills */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-2">
            <span className="text-xs font-semibold text-gray-500 py-1 mr-1">उप-श्रेणियां:</span>
            {subcategories.map((sub) => (
              <span
                key={sub.slug}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-[#ED1727] transition-colors cursor-pointer"
              >
                {sub.nameHi}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* 3. Main Content + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
        {/* Left: Article Feed (8 cols) */}
        <section className="lg:col-span-8">
          {articles.length > 0 ? (
            <div className="space-y-4">
              {articles.map((story) => (
                <div
                  key={story.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors"
                >
                  <NewsCardStandard story={story} />
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-between pt-6 border-t border-gray-200" aria-label="पेज नेविगेशन">
                  {currentPage > 1 ? (
                    <Link
                      href={`/category/${slug}?page=${currentPage - 1}`}
                      className="px-4 py-2 border rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      ← पिछला पेज
                    </Link>
                  ) : (
                    <div />
                  )}

                  <span className="text-xs text-gray-600 font-medium">
                    पेज {currentPage} / {totalPages}
                  </span>

                  {currentPage < totalPages ? (
                    <Link
                      href={`/category/${slug}?page=${currentPage + 1}`}
                      className="px-4 py-2 border rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      अगला पेज →
                    </Link>
                  ) : (
                    <div />
                  )}
                </nav>
              )}
            </div>
          ) : (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <span className="text-3xl">📭</span>
              <h3 className="text-lg font-bold text-gray-800 mt-2">
                इस श्रेणी में अभी कोई प्रकाशित समाचार नहीं है
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                संपादकीय डेस्क द्वारा इस श्रेणी की नई प्रामाणिक खबरें जल्द ही प्रकाशित की जाएंगी। कृपया बाद में देखें।
              </p>
              <Link
                href="/"
                className="inline-block mt-4 text-xs font-bold text-[#344FD6] hover:underline"
              >
                ← मुख्य पृष्ठ पर लौटें
              </Link>
            </div>
          )}
        </section>

        {/* Right: Trending Sidebar (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6" aria-label="श्रेणी साइडबार">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
              <span>🔥</span>
              <span>ट्रेंडिंग खबरें</span>
            </h3>

            <div className="divide-y divide-gray-100">
              {trendingArticles.length > 0 ? (
                trendingArticles.map((t, idx) => (
                  <NewsCardCompact
                    key={t.id || t.articleId || idx}
                    story={{
                      id: t.id || t.articleId || String(idx),
                      headline: t.headline || t.title || '',
                      slug: t.slug,
                      rankIndex: idx + 1,
                      districtName: t.districtName || t.district,
                      publishedAt: t.publishedAt,
                    }}
                  />
                ))
              ) : (
                <p className="text-xs text-gray-500 py-3 text-center">
                  ट्रेंडिंग खबरें उपलब्ध नहीं हैं।
                </p>
              )}
            </div>
          </div>

          <InArticleAdSlot slotId="category-sidebar-ad" />
        </aside>
      </div>
    </main>
  );
}
