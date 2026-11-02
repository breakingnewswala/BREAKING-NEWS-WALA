/**
 * BREAKING NEWS WALA — SEO Repository Boundary
 * Grounded in docs/12-Database.md (DOM-S: article_seo_metadata, search_console_integrations).
 */

import { getPrismaClient } from '../../db/client';
import {
  ArticleSeoMetadataItem,
  UpdateArticleSeoDto,
  SearchConsoleIntegrationStatus,
} from './types';
import { SEO_LIMITS } from './seo.constants';

export interface ISeoRepository {
  getArticleSeo(articleId: string): Promise<ArticleSeoMetadataItem | null>;
  upsertArticleSeo(articleId: string, dto: UpdateArticleSeoDto): Promise<ArticleSeoMetadataItem>;
  getSitemapPublishedArticles(limit?: number): Promise<Array<{ id: string; slug: string; title: string; publishedAt: string }>>;
  getSearchConsoleStatus(): Promise<SearchConsoleIntegrationStatus>;
  updateSearchConsoleStatus(status: 'pending_configuration' | 'connected' | 'error' | 'disconnected', email?: string): Promise<SearchConsoleIntegrationStatus>;
}

export class PrismaSeoRepository implements ISeoRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async getArticleSeo(articleId: string): Promise<ArticleSeoMetadataItem | null> {
    const record = await this.prisma.articleSeoMetadata.findUnique({
      where: { articleId },
    });
    if (!record) return null;

    return {
      id: record.id,
      articleId: record.articleId,
      seoTitle: record.seoTitle || undefined,
      metaDescription: record.metaDescription || undefined,
      canonicalUrl: record.canonicalUrl || undefined,
      focusKeywords: record.focusKeywords,
      ogTitle: record.ogTitle || undefined,
      ogDescription: record.ogDescription || undefined,
      ogImageUrl: record.ogImageUrl || undefined,
      twitterCardType: record.twitterCardType,
      robotsDirectives: record.robotsDirectives,
      structuredDataType: record.structuredDataType,
      isIndexed: record.isIndexed,
      searchConsoleStatus: record.searchConsoleStatus,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async upsertArticleSeo(articleId: string, dto: UpdateArticleSeoDto): Promise<ArticleSeoMetadataItem> {
    const record = await this.prisma.articleSeoMetadata.upsert({
      where: { articleId },
      create: {
        articleId,
        seoTitle: dto.seoTitle,
        metaDescription: dto.metaDescription,
        canonicalUrl: dto.canonicalUrl,
        focusKeywords: dto.focusKeywords || [],
        ogTitle: dto.ogTitle,
        ogDescription: dto.ogDescription,
        ogImageUrl: dto.ogImageUrl,
        twitterCardType: dto.twitterCardType || 'summary_large_image',
        robotsDirectives: dto.robotsDirectives || SEO_LIMITS.DEFAULT_ROBOTS,
        structuredDataType: 'NewsArticle',
      },
      update: {
        seoTitle: dto.seoTitle,
        metaDescription: dto.metaDescription,
        canonicalUrl: dto.canonicalUrl,
        focusKeywords: dto.focusKeywords,
        ogTitle: dto.ogTitle,
        ogDescription: dto.ogDescription,
        ogImageUrl: dto.ogImageUrl,
        twitterCardType: dto.twitterCardType,
        robotsDirectives: dto.robotsDirectives,
      },
    });

    return {
      id: record.id,
      articleId: record.articleId,
      seoTitle: record.seoTitle || undefined,
      metaDescription: record.metaDescription || undefined,
      canonicalUrl: record.canonicalUrl || undefined,
      focusKeywords: record.focusKeywords,
      ogTitle: record.ogTitle || undefined,
      ogDescription: record.ogDescription || undefined,
      ogImageUrl: record.ogImageUrl || undefined,
      twitterCardType: record.twitterCardType,
      robotsDirectives: record.robotsDirectives,
      structuredDataType: record.structuredDataType,
      isIndexed: record.isIndexed,
      searchConsoleStatus: record.searchConsoleStatus,
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  public async getSitemapPublishedArticles(limit: number = 1000): Promise<Array<{ id: string; slug: string; title: string; publishedAt: string }>> {
    const articles = await this.prisma.newsArticle.findMany({
      where: { status: 'published' },
      select: { id: true, slug: true, title: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return articles.map((a: any) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      publishedAt: (a.publishedAt || a.createdAt).toISOString(),
    }));
  }

  public async getSearchConsoleStatus(): Promise<SearchConsoleIntegrationStatus> {
    const record = await this.prisma.searchConsoleIntegration.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return {
      siteUrl: record?.siteUrl || 'https://breakingnewswala.com',
      propertyType: record?.propertyType || 'URL_PREFIX',
      connectionStatus: (record?.connectionStatus as any) || 'pending_configuration',
      serviceAccountEmail: record?.serviceAccountEmail || undefined,
      lastSyncAt: record?.lastSyncAt ? record.lastSyncAt.toISOString() : undefined,
      verifiedOwnership: record?.verifiedOwnership || false,
    };
  }

  public async updateSearchConsoleStatus(
    status: 'pending_configuration' | 'connected' | 'error' | 'disconnected',
    email?: string
  ): Promise<SearchConsoleIntegrationStatus> {
    const existing = await this.prisma.searchConsoleIntegration.findFirst();

    if (existing) {
      const updated = await this.prisma.searchConsoleIntegration.update({
        where: { id: existing.id },
        data: {
          connectionStatus: status,
          serviceAccountEmail: email || existing.serviceAccountEmail,
          verifiedOwnership: status === 'connected',
          lastSyncAt: status === 'connected' ? new Date() : undefined,
        },
      });
      return {
        siteUrl: updated.siteUrl,
        propertyType: updated.propertyType,
        connectionStatus: updated.connectionStatus as any,
        serviceAccountEmail: updated.serviceAccountEmail || undefined,
        lastSyncAt: updated.lastSyncAt ? updated.lastSyncAt.toISOString() : undefined,
        verifiedOwnership: updated.verifiedOwnership,
      };
    } else {
      const created = await this.prisma.searchConsoleIntegration.create({
        data: {
          siteUrl: 'https://breakingnewswala.com',
          propertyType: 'URL_PREFIX',
          connectionStatus: status,
          serviceAccountEmail: email,
          verifiedOwnership: status === 'connected',
          lastSyncAt: status === 'connected' ? new Date() : undefined,
        },
      });
      return {
        siteUrl: created.siteUrl,
        propertyType: created.propertyType,
        connectionStatus: created.connectionStatus as any,
        serviceAccountEmail: created.serviceAccountEmail || undefined,
        lastSyncAt: created.lastSyncAt ? created.lastSyncAt.toISOString() : undefined,
        verifiedOwnership: created.verifiedOwnership,
      };
    }
  }
}

export class InMemorySeoRepository implements ISeoRepository {
  private seoMetadataStore = new Map<string, ArticleSeoMetadataItem>();
  private searchConsoleStatus: SearchConsoleIntegrationStatus = {
    siteUrl: 'https://breakingnewswala.com',
    propertyType: 'URL_PREFIX',
    connectionStatus: 'pending_configuration',
    verifiedOwnership: false,
  };

  constructor() {
    this.seedDefaultMetadata();
  }

  private seedDefaultMetadata() {
    this.seoMetadataStore.set('art-bhopal-01', {
      id: 'seo-art-bhopal-01',
      articleId: 'art-bhopal-01',
      seoTitle: 'भोपाल जल शोधन संयंत्र विस्तार परियोजना को मिली मंज़ूरी | Breaking News Wala',
      metaDescription: 'मध्य प्रदेश राज्य मंत्रिमंडल ने भोपाल जल शोधन संयंत्र के द्वितीय चरण के विस्तार हेतु 120 करोड़ रुपये स्वीकृत किए। विस्तृत रिपोर्ट पढ़ें।',
      canonicalUrl: 'https://breakingnewswala.com/news/bhopal-water-treatment-expansion',
      focusKeywords: ['भोपाल जल शोधन', 'मध्य प्रदेश मंत्रिमंडल', 'Bhopal Water Scheme'],
      ogTitle: 'भोपाल जल शोधन संयंत्र विस्तार: 120 करोड़ की परियोजना को मंज़ूरी',
      ogDescription: 'भोपाल शहर में जलापूर्ति सुदृढ़ीकरण हेतु नया जल शोधन संयंत्र स्थापित किया जाएगा।',
      ogImageUrl: 'https://breakingnewswala.com/assets/news/bhopal-water.webp',
      twitterCardType: 'summary_large_image',
      robotsDirectives: 'index, follow',
      structuredDataType: 'NewsArticle',
      isIndexed: true,
      searchConsoleStatus: 'indexed',
      updatedAt: new Date().toISOString(),
    });
  }

  public async getArticleSeo(articleId: string): Promise<ArticleSeoMetadataItem | null> {
    return this.seoMetadataStore.get(articleId) || null;
  }

  public async upsertArticleSeo(articleId: string, dto: UpdateArticleSeoDto): Promise<ArticleSeoMetadataItem> {
    const existing = this.seoMetadataStore.get(articleId);
    const updated: ArticleSeoMetadataItem = {
      id: existing?.id || `seo_${Date.now()}`,
      articleId,
      seoTitle: dto.seoTitle ?? existing?.seoTitle,
      metaDescription: dto.metaDescription ?? existing?.metaDescription,
      canonicalUrl: dto.canonicalUrl ?? existing?.canonicalUrl,
      focusKeywords: dto.focusKeywords ?? existing?.focusKeywords ?? [],
      ogTitle: dto.ogTitle ?? existing?.ogTitle,
      ogDescription: dto.ogDescription ?? existing?.ogDescription,
      ogImageUrl: dto.ogImageUrl ?? existing?.ogImageUrl,
      twitterCardType: dto.twitterCardType ?? existing?.twitterCardType ?? 'summary_large_image',
      robotsDirectives: dto.robotsDirectives ?? existing?.robotsDirectives ?? 'index, follow',
      structuredDataType: 'NewsArticle',
      isIndexed: existing?.isIndexed ?? false,
      searchConsoleStatus: existing?.searchConsoleStatus ?? 'pending_configuration',
      updatedAt: new Date().toISOString(),
    };
    this.seoMetadataStore.set(articleId, updated);
    return updated;
  }

  public async getSitemapPublishedArticles(_limit: number = 1000): Promise<Array<{ id: string; slug: string; title: string; publishedAt: string }>> {
    return [
      {
        id: 'art-bhopal-01',
        slug: 'bhopal-water-treatment-expansion',
        title: 'भोपाल जल शोधन संयंत्र विस्तार परियोजना',
        publishedAt: '2026-11-01T08:00:00.000Z',
      },
      {
        id: 'art-indore-02',
        slug: 'indore-metro-phase-two-trial',
        title: 'इंदौर मेट्रो रेल द्वितीय चरण का सफल ट्रायल रन',
        publishedAt: '2026-11-01T09:30:00.000Z',
      },
      {
        id: 'art-ujjain-03',
        slug: 'ujjain-mahakal-kartik-darshan',
        title: 'उज्जैन महाकाल लोक में कार्तिक मास दर्शन व्यवस्था',
        publishedAt: '2026-11-01T06:15:00.000Z',
      },
    ];
  }

  public async getSearchConsoleStatus(): Promise<SearchConsoleIntegrationStatus> {
    return { ...this.searchConsoleStatus };
  }

  public async updateSearchConsoleStatus(
    status: 'pending_configuration' | 'connected' | 'error' | 'disconnected',
    email?: string
  ): Promise<SearchConsoleIntegrationStatus> {
    this.searchConsoleStatus = {
      siteUrl: 'https://breakingnewswala.com',
      propertyType: 'URL_PREFIX',
      connectionStatus: status,
      serviceAccountEmail: email,
      lastSyncAt: status === 'connected' ? new Date().toISOString() : undefined,
      verifiedOwnership: status === 'connected',
    };
    return { ...this.searchConsoleStatus };
  }
}

let seoRepoInstance: ISeoRepository | null = null;

export function getSeoRepository(): ISeoRepository {
  if (!seoRepoInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      seoRepoInstance = new InMemorySeoRepository();
    } else {
      seoRepoInstance = new PrismaSeoRepository();
    }
  }
  return seoRepoInstance;
}

export function setSeoRepository(repo: ISeoRepository): void {
  seoRepoInstance = repo;
}
