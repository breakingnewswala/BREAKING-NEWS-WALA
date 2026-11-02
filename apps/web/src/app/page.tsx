import React from 'react';
import Link from 'next/link';
import {
  fetchPublishedArticles,
  fetchTrendingArticles,
} from '../lib/api';
import { NewsCardHeroAnchor } from '../components/NewsCardHeroAnchor';
import { NewsCardStandard } from '../components/NewsCardStandard';
import { NewsCardCompact } from '../components/NewsCardCompact';
import { NewsFeedSectionHeader } from '../components/NewsFeedSectionHeader';
import { InArticleAdSlot } from '../components/InArticleAdSlot';
import { PRIORITY_DISTRICT_HUBS } from '../lib/constants';

export const revalidate = 60; // SSR with ISR every 60 seconds

export default async function HomePage() {
  const [latestArticlesRes, trendingArticles] = await Promise.all([
    fetchPublishedArticles({ limit: 12 }),
    fetchTrendingArticles(5),
  ]);

  const articles = latestArticlesRes.items;
  const leadStory = articles[0] || null;
  const secondaryStories = articles.slice(1, 3);
  const remainingLatest = articles.slice(3, 9);

  return (
    <main className="site-container py-4 sm:py-6">
      {/* 1. Main Grid: Lead Story + Secondary Stories + Trending Sidebar */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" aria-label="मुख्य समाचार एवं ट्रेंडिंग">
        {/* Left Column: Lead Hero + Secondary (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {leadStory ? (
            <NewsCardHeroAnchor story={leadStory} priority={true} />
          ) : (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <span className="text-3xl">📰</span>
              <h2 className="text-xl font-bold text-gray-800 mt-2">
                मध्य प्रदेश की ताज़ा खबरें संकलित की जा रही हैं
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                संपादकीय डेस्क द्वारा अनुमोदित खबरें शीघ्र ही यहाँ प्रदर्शित होंगी।
              </p>
            </div>
          )}

          {/* Secondary 2-column spotlight */}
          {secondaryStories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {secondaryStories.map((story) => (
                <div key={story.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                  <NewsCardStandard story={story} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Trending Sidebar (4 cols) */}
        <aside className="lg:col-span-4 bg-gray-50/70 border border-gray-200 rounded-xl p-4 sm:p-5" aria-label="ट्रेंडिंग खबरें">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h3 className="text-lg font-bold text-gray-900">ट्रेंडिंग न्यूज़</h3>
            </div>
            <span className="text-[11px] bg-red-100 text-[#ED1727] font-bold px-2 py-0.5 rounded-full uppercase">
              Live
            </span>
          </div>

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
            ) : articles.length > 0 ? (
              // Fallback to top published articles as trending
              articles.slice(0, 5).map((art, idx) => (
                <NewsCardCompact
                  key={art.id}
                  story={{
                    id: art.id,
                    headline: art.title,
                    slug: art.slug,
                    rankIndex: idx + 1,
                    districtName: art.primaryLocationNameHi,
                    publishedAt: art.publishedAt,
                  }}
                />
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">
                वर्तमान में कोई ट्रेंडिंग खबर उपलब्ध नहीं है।
              </p>
            )}
          </div>

          {/* Sidebar In-feed Ad */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <InArticleAdSlot slotId="home-sidebar-ad" />
          </div>
        </aside>
      </section>

      {/* 2. Madhya Pradesh Hyperlocal District Hub Bar */}
      <section className="my-8 p-4 bg-gradient-to-r from-red-50 via-white to-red-50 border border-red-100 rounded-xl" aria-label="मध्य प्रदेश जिला समाचार">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-[#ED1727]">📍</span>
              <span>मध्य प्रदेश के 55 जिले: आपका शहर, आपकी खबर</span>
            </h3>
            <p className="text-xs text-gray-600">
              अपने जिले की स्थानीय खबरें, प्रशासनिक आदेश और जमीनी मुद्दे सीधे पढ़ें
            </p>
          </div>
          <Link
            href="/category/madhya-pradesh"
            className="text-xs font-bold text-[#344FD6] hover:text-[#ED1727] transition-colors"
          >
            सभी 55 जिले देखें →
          </Link>
        </div>

        {/* Priority District Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {PRIORITY_DISTRICT_HUBS.map((hub) => (
            <Link
              key={hub.slug}
              href={`/district/${hub.slug}`}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-800 border border-gray-200 hover:border-[#ED1727] hover:text-[#ED1727] hover:shadow-xs transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#ED1727] mr-1.5" />
              <span>{hub.nameHi}</span>
            </Link>
          ))}
          <Link
            href="/district/bhopal"
            className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            राजधानी भोपाल न्यूज़
          </Link>
        </div>
      </section>

      {/* 3. Latest Published News Feed Section */}
      <section className="my-8" aria-label="ताज़ा समाचार">
        <NewsFeedSectionHeader
          titleHindi="ताज़ा समाचार (Latest Feed)"
          viewAllHref="/category/madhya-pradesh"
          badge="अपडेटेड"
        />

        {remainingLatest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remainingLatest.map((story) => (
              <div key={story.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                <NewsCardStandard story={story} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-6 text-center">
            ताज़ा खबरें लोड हो रही हैं।
          </p>
        )}
      </section>

      {/* 4. Categorized News Blocks (Politics & Crime) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8" aria-label="प्रमुख श्रेणियां">
        {/* Category: राजनीति */}
        <div>
          <NewsFeedSectionHeader
            titleHindi="राजनीति (Politics)"
            viewAllHref="/category/politics"
          />
          <div className="space-y-3">
            {articles
              .filter((a) => a.primaryCategorySlug === 'politics')
              .slice(0, 3)
              .map((story) => (
                <NewsCardStandard key={story.id} story={story} />
              ))}
            {articles.filter((a) => a.primaryCategorySlug === 'politics').length === 0 && (
              <p className="text-xs text-gray-500 py-4">राजनीति श्रेणी में नई खबरें शीघ्र उपलब्ध होंगी।</p>
            )}
          </div>
        </div>

        {/* Category: क्राइम और कानून */}
        <div>
          <NewsFeedSectionHeader
            titleHindi="क्राइम और सुरक्षा (Crime & Law)"
            viewAllHref="/category/crime"
          />
          <div className="space-y-3">
            {articles
              .filter((a) => a.primaryCategorySlug === 'crime')
              .slice(0, 3)
              .map((story) => (
                <NewsCardStandard key={story.id} story={story} />
              ))}
            {articles.filter((a) => a.primaryCategorySlug === 'crime').length === 0 && (
              <p className="text-xs text-gray-500 py-4">क्राइम श्रेणी में नई खबरें शीघ्र उपलब्ध होंगी।</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. Banner Ad Slot */}
      <InArticleAdSlot slotId="homepage-bottom-banner" />
    </main>
  );
}
