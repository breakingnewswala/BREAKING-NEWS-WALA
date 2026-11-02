import React from 'react';
import type { Metadata } from 'next';
import { Search as SearchIcon } from 'lucide-react';
import { fetchPublishedArticles, fetchTrendingArticles } from '../../lib/api';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { NewsCardStandard } from '../../components/NewsCardStandard';
import { NewsCardCompact } from '../../components/NewsCardCompact';
import { InArticleAdSlot } from '../../components/InArticleAdSlot';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export const revalidate = 30;

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  return {
    title: query ? `"${query}" के खोज परिणाम — BREAKING NEWS WALA` : 'समाचार खोजें — BREAKING NEWS WALA',
    description: `मध्य प्रदेश के सभी 55 जिलों में "${query}" से संबंधित ताज़ा समाचार एवं रिपोर्टिंग।`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page } = await searchParams;
  const query = q?.trim() || '';
  const currentPage = parseInt(page || '1', 10) || 1;

  const [articlesRes, trendingArticles] = await Promise.all([
    query
      ? fetchPublishedArticles({
          search: query,
          page: currentPage,
          limit: 10,
        })
      : Promise.resolve({ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
    fetchTrendingArticles(5),
  ]);

  const articles = articlesRes.items;
  const totalResults = articlesRes.pagination.total;

  return (
    <main className="site-container py-4 sm:py-6">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { labelHindi: 'खोज (Search)' },
          ...(query ? [{ labelHindi: `"${query}"` }] : []),
        ]}
      />

      {/* 2. Search Input Header */}
      <section className="my-6 p-6 bg-gray-50 border border-gray-200 rounded-xl" aria-label="खोज फॉर्म">
        <h1 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
          <SearchIcon className="w-6 h-6 text-[#ED1727]" />
          <span>समाचार खोजें (Search Portal)</span>
        </h1>
        <p className="text-xs text-gray-600 mb-4">
          मध्य प्रदेश, अपने जिले या किसी विशिष्ट घटना के बारे में तुरंत खोजें:
        </p>

        <form action="/search" method="GET" className="flex items-center gap-2 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="जिले का नाम, नेता, घटना या कीवर्ड दर्ज करें..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1727] focus:border-[#ED1727]"
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#ED1727] hover:bg-[#c9121f] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1.5"
          >
            <span>खोजें</span>
          </button>
        </form>
      </section>

      {/* 3. Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
        <section className="lg:col-span-8">
          {query ? (
            <>
              <div className="mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-800">
                  &quot;{query}&quot; के लिए परिणाम: {totalResults} समाचार मिले
                </h2>
              </div>

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
                </div>
              ) : (
                <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <span className="text-3xl">🔍</span>
                  <h3 className="text-base font-bold text-gray-800 mt-2">
                    &quot;{query}&quot; से संबंधित कोई प्रकाशित समाचार नहीं मिला
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    कृपया वर्तनी की जांच करें या अन्य सामान्य कीवर्ड (उदा. भोपाल, किसान, चुनाव) का प्रयोग करें।
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <span className="text-3xl">💡</span>
              <h3 className="text-base font-bold text-gray-800 mt-2">
                खोज शुरू करने के लिए ऊपर बॉक्स में कीवर्ड दर्ज करें
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                आप किसी भी जिले का नाम, राजनीतिक दल या विशिष्ट विषय लिखकर खोज सकते हैं।
              </p>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6" aria-label="खोज साइडबार">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3 flex items-center gap-2">
              <span>🔥</span>
              <span>ट्रेंडिंग विषय</span>
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
                  ट्रेंडिंग विषय लोड हो रहे हैं।
                </p>
              )}
            </div>
          </div>

          <InArticleAdSlot slotId="search-sidebar-ad" />
        </aside>
      </div>
    </main>
  );
}
