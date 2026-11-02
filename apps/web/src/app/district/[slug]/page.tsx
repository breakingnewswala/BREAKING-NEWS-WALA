import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchDistrictBySlug,
  fetchPublishedArticles,
  fetchTrendingArticles,
} from '../../../lib/api';
import { MP_DIVISIONS_AND_DISTRICTS } from '../../../lib/constants';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { NewsCardStandard } from '../../../components/NewsCardStandard';
import { NewsCardCompact } from '../../../components/NewsCardCompact';
import { InArticleAdSlot } from '../../../components/InArticleAdSlot';

interface DistrictPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const district = await fetchDistrictBySlug(slug);

  const nameHi = district ? district.nameHi : slug;
  const divisionHi = district?.divisionNameHi ? `(${district.divisionNameHi} संभाग)` : '';

  return {
    title: `${nameHi} न्यूज़ — ताज़ा ब्रेकिंग समाचार, प्रशासन एवं स्थानीय घटनाएं ${divisionHi}`,
    description: `मध्य प्रदेश के ${nameHi} जिले की ताज़ा ब्रेकिंग न्यूज़, स्थानीय समस्याएं, विकास कार्य, कृषि मंडियों के भाव और प्रशासनिक आदेश।`,
    alternates: {
      canonical: `/district/${slug}`,
    },
    openGraph: {
      title: `${nameHi} समाचार | BREAKING NEWS WALA`,
      description: `मध्य प्रदेश के ${nameHi} जिले की निष्पक्ष और तेज़ ग्राउंड रिपोर्ट।`,
      url: `/district/${slug}`,
      type: 'website',
    },
  };
}

export default async function DistrictPage({ params, searchParams }: DistrictPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPage = parseInt(resolvedSearchParams.page || '1', 10) || 1;

  const district = await fetchDistrictBySlug(slug);
  if (!district) {
    notFound();
  }

  // Find division and peer districts in the same division
  const divisionDef = MP_DIVISIONS_AND_DISTRICTS.find(
    (div) => div.divisionSlug === district.divisionSlug
  );
  const peerDistricts = divisionDef
    ? divisionDef.districts.filter((d) => d.slug !== district.slug)
    : [];

  // Fetch published articles for this district
  const [articlesRes, trendingArticles] = await Promise.all([
    fetchPublishedArticles({
      locationId: district.id,
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
          { labelHindi: 'मध्य प्रदेश', href: '/category/madhya-pradesh' },
          ...(district.divisionNameHi
            ? [{ labelHindi: `${district.divisionNameHi} संभाग` }]
            : []),
          { labelHindi: district.nameHi },
        ]}
      />

      {/* 2. District Masthead / Header */}
      <header className="my-4 p-5 bg-gradient-to-r from-red-50 via-white to-gray-50 border border-gray-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">📍</span>
              <span className="text-xs bg-red-100 text-[#ED1727] font-bold px-2.5 py-0.5 rounded-full">
                {district.divisionNameHi || 'मध्य प्रदेश'} संभाग
              </span>
              {district.isPriorityHub && (
                <span className="text-xs bg-yellow-100 text-yellow-800 font-semibold px-2 py-0.5 rounded-full">
                  ★ प्रमुख केंद्र
                </span>
              )}
              {district.isNewlyFormed && (
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  नवीनतम जिला
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-normal">
              {district.nameHi} जिला समाचार (Ground Reports)
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              प्रशासनिक सूचनाएं, स्थानीय घटनाएं, अपराध, मौसम और विकास कार्यों की प्रामाणिक कवरेज
            </p>
          </div>

          <div className="flex-shrink-0">
            <span className="inline-block text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg shadow-2xs font-mono">
              DISTRICT: {district.slug.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Division Peer Districts */}
        {peerDistricts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">
              {district.divisionNameHi} संभाग के अन्य जिले:
            </span>
            {peerDistricts.map((peer) => (
              <Link
                key={peer.slug}
                href={`/district/${peer.slug}`}
                className="text-xs text-gray-700 hover:text-[#ED1727] hover:underline bg-white px-2.5 py-0.5 rounded border border-gray-200 transition-colors"
              >
                {peer.nameHi}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* 3. Main Articles Grid & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
        {/* Left: District News Stream (8 cols) */}
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
                      href={`/district/${slug}?page=${currentPage - 1}`}
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
                      href={`/district/${slug}?page=${currentPage + 1}`}
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
              <span className="text-3xl">📡</span>
              <h3 className="text-lg font-bold text-gray-800 mt-2">
                {district.nameHi} जिले से कोई हालिया समाचार प्रकाशित नहीं है
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                हमारे स्थानीय संवाददाता एवं संपादकीय टीम फील्ड से सूचनाओं का सत्यापन कर रही है। नई खबरें शीघ्र प्रकाशित होंगी।
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

        {/* Right: Trending / Division Sidebar (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6" aria-label="जिला साइडबार">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
              <span>🔥</span>
              <span>राज्य स्तरीय ट्रेंडिंग</span>
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

          <InArticleAdSlot slotId="district-sidebar-ad" />
        </aside>
      </div>
    </main>
  );
}
