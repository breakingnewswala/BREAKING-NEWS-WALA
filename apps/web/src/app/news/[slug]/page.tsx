import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchArticleBySlugOrId,
  fetchPublishedArticles,
  fetchTrendingArticles,
} from '../../../lib/api';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { FontSizeSwitcher } from '../../../components/FontSizeSwitcher';
import { SocialShareBar } from '../../../components/SocialShareBar';
import { NewsCardCompact } from '../../../components/NewsCardCompact';
import { NewsCardStandard } from '../../../components/NewsCardStandard';
import { InArticleAdSlot } from '../../../components/InArticleAdSlot';
import { AnalyticsBeacon } from '../../../components/AnalyticsBeacon';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlugOrId(slug);

  if (!article || article.status !== 'published') {
    return {
      title: 'समाचार उपलब्ध नहीं है | BREAKING NEWS WALA',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://breakingnewswala.in';
  const canonicalUrl = `${siteUrl}/news/${article.slug}`;
  const ogImageUrl = article.featuredImageUrl || `${siteUrl}/brand/logo.png`;

  return {
    title: `${article.title} — BREAKING NEWS WALA`,
    description: article.excerpt || article.summaryLead || article.title,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || article.summaryLead || article.title,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      section: article.primaryCategoryNameHi || 'मध्य प्रदेश',
      authors: [article.authorName || 'विशेष संवाददाता'],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 675,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || article.summaryLead || article.title,
      images: [ogImageUrl],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchArticleBySlugOrId(slug);

  // STRICT INVARIANT: Only editorially published articles can be accessed publicly
  if (!article || article.status !== 'published') {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://breakingnewswala.in';
  const currentArticleUrl = `${siteUrl}/news/${article.slug}`;

  // Fetch related and trending stories
  const [relatedRes, trendingArticles] = await Promise.all([
    fetchPublishedArticles({
      categoryId: article.primaryCategoryId,
      limit: 4,
    }),
    fetchTrendingArticles(5),
  ]);

  const relatedStories = relatedRes.items.filter((item) => item.id !== article.id).slice(0, 3);

  // Format publication date in Hindi
  const publishedDateHindi = article.publishedAt
    ? new Intl.DateTimeFormat('hi-IN', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      }).format(new Date(article.publishedAt))
    : 'हाल ही में प्रकाशित';

  // Format schema.org NewsArticle JSON-LD
  const newsArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': currentArticleUrl,
    },
    headline: article.title,
    description: article.excerpt || article.summaryLead || article.title,
    image: [article.featuredImageUrl || `${siteUrl}/brand/logo.png`],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.authorName || 'विशेष संवाददाता',
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'BREAKING NEWS WALA',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/brand/logo.png`,
        width: 600,
        height: 180,
      },
    },
    articleSection: article.primaryCategoryNameHi || 'मध्य प्रदेश',
    inLanguage: 'hi',
  };

  // Split content paragraphs for in-article ad slot insertion
  const rawContent = article.bodyContent || article.content || article.excerpt || '';
  const paragraphs: string[] = rawContent
    .split(/\n\s*\n/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <article className="site-container py-4 sm:py-6" itemScope itemType="https://schema.org/NewsArticle">
      {/* Schema.org NewsArticle Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />

      {/* Non-blocking Telemetry Dispatcher */}
      <AnalyticsBeacon
        eventName="article_viewed"
        articleId={article.id}
        categoryId={article.primaryCategoryId}
        locationId={article.primaryLocationId}
        slug={article.slug}
      />

      {/* 1. Breadcrumbs Trail */}
      <Breadcrumbs
        items={[
          ...(article.primaryCategoryNameHi
            ? [
                {
                  labelHindi: article.primaryCategoryNameHi,
                  href: `/category/${article.primaryCategorySlug || 'madhya-pradesh'}`,
                },
              ]
            : []),
          ...(article.primaryLocationNameHi
            ? [
                {
                  labelHindi: article.primaryLocationNameHi,
                  href: `/district/${article.primaryLocationSlug || 'bhopal'}`,
                },
              ]
            : []),
          { labelHindi: article.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-4">
        {/* Main Article Content Column (8 cols) */}
        <div className="lg:col-span-8">
          {/* Master Headline (COMP-ART-001) */}
          <h1
            itemProp="headline"
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-[1.4] sm:leading-[1.45] tracking-tight mb-3 font-serif"
          >
            {article.title}
          </h1>

          {/* Subheadline / Lead Excerpt (COMP-ART-002) */}
          {(article.summaryLead || article.excerpt) && (
            <p
              itemProp="description"
              className="text-base sm:text-lg text-gray-600 font-medium leading-[1.65] mb-4 border-l-4 border-[#ED1727] pl-3 py-0.5 bg-red-50/40 rounded-r"
            >
              {article.summaryLead || article.excerpt}
            </p>
          )}

          {/* Byline & Metadata Dock (COMP-ART-003) */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-gray-200 text-xs text-gray-600 mb-4">
            <div className="flex items-center gap-3">
              {/* Fact-Check Verified Badge */}
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>10-बिंदु तथ्य सत्यापित</span>
              </span>

              {/* Author & District */}
              <span className="font-semibold text-gray-900" itemProp="author">
                {article.authorName || 'विशेष संवाददाता'}
              </span>

              {article.primaryLocationNameHi && (
                <span className="text-red-700 font-medium">
                  📍 {article.primaryLocationNameHi}
                </span>
              )}
            </div>

            {/* Typography Scaler (COMP-ART-006) */}
            <div className="flex items-center gap-3">
              <time dateTime={article.publishedAt} itemProp="datePublished" className="hidden sm:inline">
                {publishedDateHindi}
              </time>
              <FontSizeSwitcher />
            </div>
          </div>

          {/* Social Share Bar (COMP-ART-008) */}
          <SocialShareBar
            articleId={article.id}
            headline={article.title}
            url={currentArticleUrl}
            className="mb-6"
          />

          {/* Featured Hero Media (COMP-ART-004) */}
          {article.featuredImageUrl && (
            <figure className="mb-6 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
              <div className="aspect-video w-full relative">
                <img
                  src={article.featuredImageUrl}
                  alt={article.featuredImageCaption || article.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  itemProp="image"
                />
              </div>
              {article.featuredImageCaption && (
                <figcaption className="text-xs text-gray-500 py-2 px-3 bg-gray-50 border-t border-gray-100 italic">
                  {article.featuredImageCaption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Main Article Body (COMP-ART-005) */}
          <div
            id="article-content-body"
            itemProp="articleBody"
            className="prose max-w-none text-gray-800 leading-[1.85] font-sans space-y-4"
            style={{ fontSize: '1.125rem' }}
          >
            {paragraphs.length > 0 ? (
              paragraphs.map((para: string, index: number) => (
                <React.Fragment key={index}>
                  <p className="leading-[1.85]">{para}</p>

                  {/* In-Article Ad Slot after paragraph 3 (COMP-ART-014) */}
                  {index === 2 && (
                    <InArticleAdSlot slotId={`in-article-ad-${index}`} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <p className="leading-[1.85]">
                इस खबर का विस्तृत विवरण शीघ्र ही अद्यतन किया जा रहा है।
              </p>
            )}
          </div>

          {/* Bottom Social Share Bar */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <span className="text-xs font-bold text-gray-700 mb-2 block">
              इस खबर को अपने मित्रों एवं परिवारजनों के साथ साझा करें:
            </span>
            <SocialShareBar
              articleId={article.id}
              headline={article.title}
              url={currentArticleUrl}
            />
          </div>

          {/* Editorial & Statutory Grievance Disclaimer */}
          <aside className="my-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 leading-relaxed">
            <p className="font-semibold text-gray-700 mb-1">
              ⚖️ निष्पक्ष पत्रकारिता एवं आचार संहिता (IT Rules 2021)
            </p>
            <p>
              BREAKING NEWS WALA की सभी खबरें हमारे 10-बिंदु तथ्य-सत्यापन प्रोटोकॉल से गुजरने के बाद ही प्रकाशित की जाती हैं। यदि आपको इस खबर के किसी तथ्य, फोटो या विवरण पर कोई आपत्ति है, तो आप हमारे शिकायत निवारण अधिकारी (Grievance Officer) से <strong className="text-gray-700">grievance@breakingnewswala.in</strong> पर संपर्क कर सकते हैं।
            </p>
          </aside>

          {/* Related Stories Grid (COMP-ART-012) */}
          {relatedStories.length > 0 && (
            <section className="mt-8 pt-6 border-t border-gray-200" aria-label="संबंधित खबरें">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ED1727] rounded-full inline-block" />
                <span>संबंधित खबरें</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedStories.map((story) => (
                  <div key={story.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <NewsCardStandard story={story} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6" aria-label="साइडबार">
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
                  ट्रेंडिंग खबरें लोड हो रही हैं।
                </p>
              )}
            </div>
          </div>

          <InArticleAdSlot slotId="article-sidebar-ad" />
        </aside>
      </div>
    </article>
  );
}
