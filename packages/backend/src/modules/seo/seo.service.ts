/**
 * BREAKING NEWS WALA — SEO Domain Service
 * Grounded in docs/SEO.md and docs/DECISIONS.md (DEC-048).
 */

import { AppError } from '../../errors/app-error';
import { getArticleRepository, IArticleRepository } from '../articles/article.repository';
import { ArticleWorkflowEngine } from '../articles/article.workflow';
import { getSeoRepository, ISeoRepository } from './seo.repository';
import { SEO_LIMITS } from './seo.constants';
import {
  ArticleSeoMetadataItem,
  UpdateArticleSeoDto,
  SeoValidationResult,
  SeoPreviews,
  SitemapStatusResult,
  SearchConsoleIntegrationStatus,
} from './types';

export class SeoService {
  private customRepo?: ISeoRepository;
  private customArticleRepo?: IArticleRepository;

  constructor(repo?: ISeoRepository, articleRepo?: IArticleRepository) {
    this.customRepo = repo;
    this.customArticleRepo = articleRepo;
  }

  private get repo(): ISeoRepository {
    return this.customRepo || getSeoRepository();
  }

  private get articleRepo(): IArticleRepository {
    return this.customArticleRepo || getArticleRepository();
  }

  private assertNotChiefEditor(userRoles: string[]): void {
    if (userRoles.some((r) => r.toUpperCase().includes('CHIEF_EDITOR'))) {
      throw AppError.forbidden('ROLE_CHIEF_EDITOR remains Pending Approval under DEC-048.');
    }
  }

  private isElevated(userRoles: string[]): boolean {
    this.assertNotChiefEditor(userRoles);
    return (
      ArticleWorkflowEngine.isElevatedEditor(userRoles) ||
      userRoles.some((r) => {
        const clean = r.toUpperCase().replace(/^ROLE_/, '');
        return clean === 'ADMIN' || clean === 'SUPER_ADMIN';
      })
    );
  }

  /**
   * Retrieves SEO metadata for an article, falling back to sensible defaults.
   */
  public async getArticleSeoMetadata(articleId: string): Promise<ArticleSeoMetadataItem> {
    const custom = await this.repo.getArticleSeo(articleId);
    if (custom) return custom;

    const article = await this.articleRepo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const defaultTitle = `${article.title} | ${SEO_LIMITS.DEFAULT_PUBLISHER_NAME}`;
    const defaultDesc = article.excerpt || article.subheadline || article.bodyContent.slice(0, 150).replace(/<[^>]*>/g, '');
    const canonical = `${SEO_LIMITS.CANONICAL_HOST}/news/${article.slug}`;

    return {
      id: `def_${article.id}`,
      articleId: article.id,
      seoTitle: defaultTitle,
      metaDescription: defaultDesc,
      canonicalUrl: canonical,
      focusKeywords: [],
      ogTitle: article.title,
      ogDescription: defaultDesc,
      ogImageUrl: `${SEO_LIMITS.CANONICAL_HOST}/assets/brand-logo.png`,
      twitterCardType: 'summary_large_image',
      robotsDirectives: article.status === 'published' ? SEO_LIMITS.DEFAULT_ROBOTS : 'noindex, nofollow',
      structuredDataType: 'NewsArticle',
      isIndexed: article.status === 'published',
      searchConsoleStatus: 'pending_configuration',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates article SEO metadata with validation.
   */
  public async updateArticleSeo(
    userRoles: string[],
    articleId: string,
    dto: UpdateArticleSeoDto
  ): Promise<ArticleSeoMetadataItem> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Newsroom Editors and Administrators hold authority to edit article SEO metadata.');
    }

    const article = await this.articleRepo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    return this.repo.upsertArticleSeo(articleId, dto);
  }

  /**
   * Evaluates SEO quality and structured data readiness without claiming ranking guarantees.
   */
  public async validateArticleSeo(articleId: string): Promise<SeoValidationResult> {
    const metadata = await this.getArticleSeoMetadata(articleId);
    const issues: string[] = [];
    const recommendations: string[] = [];

    const titleLength = metadata.seoTitle?.length || 0;
    const descLength = metadata.metaDescription?.length || 0;

    let titleStatus: 'good' | 'too_short' | 'too_long' = 'good';
    if (titleLength < SEO_LIMITS.TITLE_OPTIMAL_MIN) {
      titleStatus = 'too_short';
      issues.push(`शीर्षक की लंबाई (${titleLength} वर्ण) 50 वर्णों से कम है।`);
      recommendations.push('सर्च इंजन में स्पष्ट दृश्यता हेतु शीर्षक को 50-70 वर्णों के बीच रखें।');
    } else if (titleLength > SEO_LIMITS.TITLE_OPTIMAL_MAX) {
      titleStatus = 'too_long';
      issues.push(`शीर्षक की लंबाई (${titleLength} वर्ण) 70 वर्णों से अधिक है, जो खोज परिणामों में कट सकता है।`);
    }

    let descStatus: 'good' | 'too_short' | 'too_long' = 'good';
    if (descLength < SEO_LIMITS.DESC_OPTIMAL_MIN) {
      descStatus = 'too_short';
      issues.push(`मेटा विवरण (${descLength} वर्ण) 120 वर्णों से कम है।`);
      recommendations.push('संक्षिप्त सार और मुख्य बिंदुओं को शामिल कर विवरण को 120-160 वर्णों तक बढ़ाएं।');
    } else if (descLength > SEO_LIMITS.DESC_OPTIMAL_MAX) {
      descStatus = 'too_long';
      issues.push(`मेटा विवरण (${descLength} वर्ण) 160 वर्णों से अधिक है।`);
    }

    const hasCanonical = !!metadata.canonicalUrl;
    if (!hasCanonical) {
      issues.push('कैनोनिकल URL अनुपस्थित है (Duplicate URL risk)।');
    }

    const hasOgImage = !!metadata.ogImageUrl;
    if (!hasOgImage) {
      issues.push('ओपन ग्राफ (सोशल शेयरिंग) इमेज अनुपस्थित है।');
      recommendations.push('सोशल मीडिया और व्हाट्सएप प्रीव्यू हेतु उच्च गुणवत्ता की 1200x630 इमेज जोड़ें।');
    }

    let score = 100;
    if (titleStatus !== 'good') score -= 15;
    if (descStatus !== 'good') score -= 15;
    if (!hasCanonical) score -= 20;
    if (!hasOgImage) score -= 15;

    const structuredData = await this.generateStructuredData(articleId);

    return {
      isValid: issues.length === 0,
      seoScore: Math.max(score, 20),
      titleLength,
      descriptionLength: descLength,
      titleStatus,
      descriptionStatus: descStatus,
      hasCanonicalUrl: hasCanonical,
      hasOgImage,
      issues,
      recommendations,
      structuredDataJsonLd: structuredData,
    };
  }

  /**
   * Generates Schema.org compliant NewsArticle JSON-LD.
   */
  public async generateStructuredData(articleId: string): Promise<Record<string, any>> {
    const article = await this.articleRepo.findArticleById(articleId);
    const seo = await this.getArticleSeoMetadata(articleId);

    const canonical = seo.canonicalUrl || `${SEO_LIMITS.CANONICAL_HOST}/news/${article?.slug || articleId}`;
    const publishedAt = article?.publishedAt || article?.createdAt || new Date();

    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical,
      },
      headline: seo.seoTitle || article?.title || 'समाचार',
      description: seo.metaDescription || article?.excerpt || '',
      image: [seo.ogImageUrl || `${SEO_LIMITS.CANONICAL_HOST}/assets/brand-logo.png`],
      datePublished: publishedAt instanceof Date ? publishedAt.toISOString() : String(publishedAt),
      dateModified: article?.updatedAt ? new Date(article.updatedAt).toISOString() : new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: article?.authorId ? 'ज़िला संवाददाता (District Stringer)' : 'संपादकीय डेस्क',
        jobTitle: 'संवाददाता',
      },
      publisher: {
        '@type': 'NewsMediaOrganization',
        name: SEO_LIMITS.DEFAULT_PUBLISHER_NAME,
        logo: {
          '@type': 'ImageObject',
          url: SEO_LIMITS.DEFAULT_LOGO_URL,
        },
      },
      articleSection: 'मध्य प्रदेश समाचार',
      inLanguage: 'hi',
    };
  }

  /**
   * Generates visual SERP, Open Graph, and Twitter Card preview models.
   */
  public async generatePreviews(articleId: string): Promise<SeoPreviews> {
    const seo = await this.getArticleSeoMetadata(articleId);

    return {
      googleSearch: {
        title: seo.seoTitle || 'समाचार शीर्षक',
        url: seo.canonicalUrl || 'https://breakingnewswala.com/news',
        description: seo.metaDescription || 'समाचार संक्षिप्त विवरण...',
      },
      openGraph: {
        title: seo.ogTitle || seo.seoTitle || 'सोशल मीडिया शीर्षक',
        description: seo.ogDescription || seo.metaDescription || 'सोशल मीडिया विवरण...',
        imageUrl: seo.ogImageUrl || 'https://breakingnewswala.com/assets/brand-logo.png',
        siteName: 'BREAKING NEWS WALA',
        url: seo.canonicalUrl || 'https://breakingnewswala.com',
      },
      twitterCard: {
        card: seo.twitterCardType || 'summary_large_image',
        title: seo.ogTitle || seo.seoTitle || 'X / Twitter शीर्षक',
        description: seo.ogDescription || seo.metaDescription || 'X / Twitter विवरण...',
        imageUrl: seo.ogImageUrl || 'https://breakingnewswala.com/assets/brand-logo.png',
      },
    };
  }

  /**
   * Sitemap Status Overview.
   */
  public async getSitemapStatus(): Promise<SitemapStatusResult> {
    const articles = await this.repo.getSitemapPublishedArticles(1000);

    return {
      totalPublishedArticles: articles.length,
      sitemapIndexUrl: `${SEO_LIMITS.CANONICAL_HOST}/sitemap.xml`,
      newsSitemapUrl: `${SEO_LIMITS.CANONICAL_HOST}/sitemap-news.xml`,
      lastGeneratedAt: new Date().toISOString(),
      isCompliantWithGoogleNews: true,
    };
  }

  /**
   * Search Console Integration Status.
   */
  public async getSearchConsoleStatus(): Promise<SearchConsoleIntegrationStatus> {
    return this.repo.getSearchConsoleStatus();
  }

  public async updateSearchConsoleStatus(
    userRoles: string[],
    status: 'pending_configuration' | 'connected' | 'error' | 'disconnected',
    email?: string
  ): Promise<SearchConsoleIntegrationStatus> {
    if (!this.isElevated(userRoles)) {
      throw AppError.forbidden('Only Administrators can configure Search Console integration.');
    }
    return this.repo.updateSearchConsoleStatus(status, email);
  }
}

export const seoService = new SeoService();
