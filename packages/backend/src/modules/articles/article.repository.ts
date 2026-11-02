/**
 * BREAKING NEWS WALA — Article Repository Boundary
 * Grounded in docs/12-Database.md (DOM-D, DOM-F) and docs/13-API.md
 * Encapsulates database access for NewsArticle, NewsRevision, EditorialReview, and ImportedRssItem.
 */

import { getPrismaClient } from '../../db/client';
import {
  ArticleEntity,
  ArticleFilterParams,
  ArticleSummary,
  EditorialReviewEntity,
  EditorialStats,
  ImportedRssItemEntity,
  NewsRevisionEntity,
  PaginatedResult,
} from './types';

export interface IArticleRepository {
  createArticle(data: Partial<ArticleEntity>): Promise<ArticleEntity>;
  updateArticle(id: string, data: Partial<ArticleEntity>): Promise<ArticleEntity>;
  findArticleById(id: string): Promise<ArticleEntity | null>;
  findArticleBySlug(slug: string): Promise<ArticleEntity | null>;
  findArticleByPublicId(publicId: string): Promise<ArticleEntity | null>;
  findArticles(params: ArticleFilterParams): Promise<PaginatedResult<ArticleSummary>>;
  createRevision(data: Omit<NewsRevisionEntity, 'id' | 'createdAt'>): Promise<NewsRevisionEntity>;
  findRevisions(articleId: string): Promise<NewsRevisionEntity[]>;
  createEditorialReview(data: Omit<EditorialReviewEntity, 'id' | 'createdAt'>): Promise<EditorialReviewEntity>;
  findEditorialReviews(articleId: string): Promise<EditorialReviewEntity[]>;
  findImportedRssItemByGuidHash(guidHash: string): Promise<ImportedRssItemEntity | null>;
  createImportedRssItem(data: Omit<ImportedRssItemEntity, 'id' | 'importedAt'>): Promise<ImportedRssItemEntity>;
  getEditorialStats(): Promise<EditorialStats>;
  findRecentEditorialReviews(limit?: number): Promise<any[]>;
}

export class PrismaArticleRepository implements IArticleRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createArticle(data: any): Promise<ArticleEntity> {
    const created = await this.prisma.newsArticle.create({
      data: {
        publicId: data.publicId,
        slug: data.slug,
        title: data.title,
        subheadline: data.subheadline || null,
        bodyContent: data.bodyContent,
        excerpt: data.excerpt || null,
        authorId: data.authorId,
        primaryCategoryId: data.primaryCategoryId,
        primaryLocationId: data.primaryLocationId,
        featuredMediaId: data.featuredMediaId || null,
        status: data.status || 'draft',
        contentSource: data.contentSource || 'original_reporter',
        sourceAttribution: data.sourceAttribution || null,
        isBreaking: data.isBreaking || false,
        breakingPriority: data.breakingPriority || 0,
        submittedAt: data.submittedAt || null,
        publishedAt: data.publishedAt || null,
      },
      include: {
        author: true,
        primaryCategory: true,
        primaryLocation: true,
      },
    });

    return this.mapPrismaToEntity(created);
  }

  public async updateArticle(id: string, data: any): Promise<ArticleEntity> {
    const updated = await this.prisma.newsArticle.update({
      where: { id },
      data: {
        title: data.title,
        subheadline: data.subheadline,
        bodyContent: data.bodyContent,
        excerpt: data.excerpt,
        slug: data.slug,
        primaryCategoryId: data.primaryCategoryId,
        primaryLocationId: data.primaryLocationId,
        featuredMediaId: data.featuredMediaId,
        status: data.status,
        lastEditorId: data.lastEditorId,
        sourceAttribution: data.sourceAttribution,
        isBreaking: data.isBreaking,
        breakingPriority: data.breakingPriority,
        submittedAt: data.submittedAt,
        publishedAt: data.publishedAt,
        deletedAt: data.deletedAt,
      },
      include: {
        author: true,
        primaryCategory: true,
        primaryLocation: true,
      },
    });

    return this.mapPrismaToEntity(updated);
  }

  public async findArticleById(id: string): Promise<ArticleEntity | null> {
    const found = await this.prisma.newsArticle.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: true,
        primaryCategory: true,
        primaryLocation: true,
        revisions: { orderBy: { versionNumber: 'desc' } },
        editorialReviews: { orderBy: { createdAt: 'desc' } },
      },
    });

    return found ? this.mapPrismaToEntity(found) : null;
  }

  public async findArticleBySlug(slug: string): Promise<ArticleEntity | null> {
    const found = await this.prisma.newsArticle.findFirst({
      where: { slug, deletedAt: null },
      include: {
        author: true,
        primaryCategory: true,
        primaryLocation: true,
        revisions: { orderBy: { versionNumber: 'desc' } },
        editorialReviews: { orderBy: { createdAt: 'desc' } },
      },
    });

    return found ? this.mapPrismaToEntity(found) : null;
  }

  public async findArticleByPublicId(publicId: string): Promise<ArticleEntity | null> {
    const found = await this.prisma.newsArticle.findFirst({
      where: { publicId, deletedAt: null },
      include: {
        author: true,
        primaryCategory: true,
        primaryLocation: true,
        revisions: { orderBy: { versionNumber: 'desc' } },
        editorialReviews: { orderBy: { createdAt: 'desc' } },
      },
    });

    return found ? this.mapPrismaToEntity(found) : null;
  }

  public async findArticles(params: ArticleFilterParams): Promise<PaginatedResult<ArticleSummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (params.status && params.status !== 'all') {
      where.status = params.status;
    }
    if (params.authorId) {
      where.authorId = params.authorId;
    }
    if (params.categoryId) {
      where.primaryCategoryId = params.categoryId;
    }
    if (params.locationId) {
      where.primaryLocationId = params.locationId;
    }
    if (params.isBreaking !== undefined) {
      where.isBreaking = params.isBreaking;
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search.trim(), mode: 'insensitive' } },
        { subheadline: { contains: params.search.trim(), mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortField = params.sortBy || 'createdAt';
    const sortDirection = params.sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = sortDirection;

    const [total, records] = await Promise.all([
      this.prisma.newsArticle.count({ where }),
      this.prisma.newsArticle.findMany({
        where,
        include: {
          author: true,
          primaryCategory: true,
          primaryLocation: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const items: ArticleSummary[] = records.map((r: any) => ({
      id: r.id,
      publicId: r.publicId,
      slug: r.slug,
      title: r.title,
      subheadline: r.subheadline,
      excerpt: r.excerpt,
      status: r.status,
      authorId: r.authorId,
      authorName: r.author?.fullName,
      primaryCategoryId: r.primaryCategoryId,
      primaryCategoryNameHi: r.primaryCategory?.nameHi,
      primaryCategorySlug: r.primaryCategory?.slug,
      primaryLocationId: r.primaryLocationId,
      primaryLocationNameHi: r.primaryLocation?.nameHi,
      primaryLocationSlug: r.primaryLocation?.slug,
      featuredMediaId: r.featuredMediaId,
      isBreaking: r.isBreaking,
      breakingPriority: r.breakingPriority,
      contentSource: r.contentSource,
      viewCount: Number(r.viewCount || 0),
      shareCount: r.shareCount || 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      publishedAt: r.publishedAt,
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async createRevision(data: Omit<NewsRevisionEntity, 'id' | 'createdAt'>): Promise<NewsRevisionEntity> {
    const created = await this.prisma.newsRevision.create({
      data: {
        newsId: data.newsId,
        versionNumber: data.versionNumber,
        title: data.title,
        subheadline: data.subheadline || null,
        bodyContent: data.bodyContent,
        excerpt: data.excerpt || null,
        revisedBy: data.revisedBy,
        revisionSummary: data.revisionSummary || null,
      },
    });

    return {
      id: created.id,
      newsId: created.newsId,
      versionNumber: created.versionNumber,
      title: created.title,
      subheadline: created.subheadline,
      bodyContent: created.bodyContent,
      excerpt: created.excerpt,
      revisedBy: created.revisedBy,
      revisionSummary: created.revisionSummary,
      createdAt: created.createdAt,
    };
  }

  public async findRevisions(articleId: string): Promise<NewsRevisionEntity[]> {
    const list = await this.prisma.newsRevision.findMany({
      where: { newsId: articleId },
      orderBy: { versionNumber: 'desc' },
    });

    return list.map((r: any) => ({
      id: r.id,
      newsId: r.newsId,
      versionNumber: r.versionNumber,
      title: r.title,
      subheadline: r.subheadline,
      bodyContent: r.bodyContent,
      excerpt: r.excerpt,
      revisedBy: r.revisedBy,
      revisionSummary: r.revisionSummary,
      createdAt: r.createdAt,
    }));
  }

  public async createEditorialReview(
    data: Omit<EditorialReviewEntity, 'id' | 'createdAt'>
  ): Promise<EditorialReviewEntity> {
    const created = await this.prisma.editorialReview.create({
      data: {
        newsId: data.newsId,
        reviewerId: data.reviewerId,
        action: data.action,
        reasonCode: data.reasonCode || null,
        feedbackComments: data.feedbackComments || null,
      },
    });

    return {
      id: created.id,
      newsId: created.newsId,
      reviewerId: created.reviewerId,
      action: created.action,
      reasonCode: created.reasonCode,
      feedbackComments: created.feedbackComments,
      createdAt: created.createdAt,
    };
  }

  public async findEditorialReviews(articleId: string): Promise<EditorialReviewEntity[]> {
    const list = await this.prisma.editorialReview.findMany({
      where: { newsId: articleId },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((r: any) => ({
      id: r.id,
      newsId: r.newsId,
      reviewerId: r.reviewerId,
      action: r.action,
      reasonCode: r.reasonCode,
      feedbackComments: r.feedbackComments,
      createdAt: r.createdAt,
    }));
  }

  public async findImportedRssItemByGuidHash(guidHash: string): Promise<ImportedRssItemEntity | null> {
    const item = await this.prisma.importedRssItem.findUnique({
      where: { guidHash },
    });
    return item as any;
  }

  public async createImportedRssItem(
    data: Omit<ImportedRssItemEntity, 'id' | 'importedAt'>
  ): Promise<ImportedRssItemEntity> {
    const item = await this.prisma.importedRssItem.create({
      data: {
        rssSourceId: data.rssSourceId,
        guidHash: data.guidHash,
        originalTitle: data.originalTitle,
        originalUrl: data.originalUrl,
        generatedNewsId: data.generatedNewsId || null,
        aiProcessingStatus: data.aiProcessingStatus || 'pending',
      },
    });
    return item as any;
  }

  public async getEditorialStats(): Promise<EditorialStats> {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [
      pendingReview,
      underReview,
      revisionRequested,
      publishedTotal,
      publishedToday,
      rejected,
      breakingNews,
    ] = await Promise.all([
      this.prisma.newsArticle.count({ where: { status: 'pending_review', deletedAt: null } }),
      this.prisma.newsArticle.count({ where: { status: 'under_review', deletedAt: null } }),
      this.prisma.newsArticle.count({ where: { status: 'revision_requested', deletedAt: null } }),
      this.prisma.newsArticle.count({ where: { status: 'published', deletedAt: null } }),
      this.prisma.newsArticle.count({
        where: { status: 'published', publishedAt: { gte: startOfToday }, deletedAt: null },
      }),
      this.prisma.newsArticle.count({ where: { status: 'rejected', deletedAt: null } }),
      this.prisma.newsArticle.count({ where: { isBreaking: true, deletedAt: null } }),
    ]);

    return {
      totalIncoming: pendingReview + underReview,
      pendingReview,
      underReview,
      revisionRequested,
      publishedToday,
      publishedTotal,
      rejected,
      breakingNews,
    };
  }

  public async findRecentEditorialReviews(limit = 20): Promise<any[]> {
    return this.prisma.editorialReview.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        article: { select: { id: true, title: true, slug: true, status: true } },
        reviewer: {
          select: {
            id: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });
  }

  private mapPrismaToEntity(record: any): ArticleEntity {
    return {
      id: record.id,
      publicId: record.publicId,
      slug: record.slug,
      title: record.title,
      subheadline: record.subheadline,
      bodyContent: record.bodyContent,
      excerpt: record.excerpt,
      authorId: record.authorId,
      lastEditorId: record.lastEditorId,
      primaryCategoryId: record.primaryCategoryId,
      primaryLocationId: record.primaryLocationId,
      featuredMediaId: record.featuredMediaId,
      status: record.status,
      contentSource: record.contentSource,
      sourceAttribution: record.sourceAttribution,
      isBreaking: record.isBreaking,
      breakingPriority: record.breakingPriority,
      viewCount: Number(record.viewCount || 0),
      shareCount: record.shareCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      submittedAt: record.submittedAt,
      publishedAt: record.publishedAt,
      scheduledAt: record.scheduledAt,
      deletedAt: record.deletedAt,
      author: record.author
        ? {
            id: record.author.id,
            fullName: record.author.fullName,
            phoneNumber: record.author.phoneNumber,
            email: record.author.email,
          }
        : undefined,
      primaryCategory: record.primaryCategory
        ? {
            id: record.primaryCategory.id,
            nameHi: record.primaryCategory.nameHi,
            nameEn: record.primaryCategory.nameEn,
            slug: record.primaryCategory.slug,
          }
        : undefined,
      primaryLocation: record.primaryLocation
        ? {
            id: record.primaryLocation.id,
            nameHi: record.primaryLocation.nameHi,
            nameEn: record.primaryLocation.nameEn,
            slug: record.primaryLocation.slug,
            level: record.primaryLocation.level,
          }
        : undefined,
      revisions: record.revisions,
      editorialReviews: record.editorialReviews,
    };
  }
}

export class InMemoryArticleRepository implements IArticleRepository {
  private articles: Map<string, ArticleEntity> = new Map();
  private revisions: Map<string, NewsRevisionEntity[]> = new Map();
  private reviews: Map<string, EditorialReviewEntity[]> = new Map();
  private importedRss: Map<string, ImportedRssItemEntity> = new Map();

  public async createArticle(data: Partial<ArticleEntity>): Promise<ArticleEntity> {
    const id = data.id || `art-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const entity: ArticleEntity = {
      id,
      publicId: data.publicId || `art_${Date.now()}`,
      slug: data.slug || `article-${Date.now()}`,
      title: data.title || '',
      subheadline: data.subheadline || null,
      bodyContent: data.bodyContent || '',
      excerpt: data.excerpt || null,
      authorId: data.authorId!,
      lastEditorId: data.lastEditorId || null,
      primaryCategoryId: data.primaryCategoryId!,
      subcategoryId: data.subcategoryId || null,
      primaryLocationId: data.primaryLocationId!,
      featuredMediaId: data.featuredMediaId || null,
      status: data.status || 'draft',
      contentSource: data.contentSource || 'original_reporter',
      sourceAttribution: data.sourceAttribution || null,
      isBreaking: data.isBreaking || false,
      breakingPriority: data.breakingPriority || 0,
      viewCount: 0,
      shareCount: 0,
      createdAt: now,
      updatedAt: now,
      submittedAt: data.submittedAt || null,
      publishedAt: data.publishedAt || null,
      scheduledAt: data.scheduledAt || null,
      deletedAt: null,
      author: data.author,
      primaryCategory: data.primaryCategory,
      primaryLocation: data.primaryLocation,
    };

    this.articles.set(id, entity);
    return { ...entity };
  }

  public async updateArticle(id: string, data: Partial<ArticleEntity>): Promise<ArticleEntity> {
    const existing = this.articles.get(id);
    if (!existing) {
      throw new Error(`Article ${id} not found`);
    }

    const updated: ArticleEntity = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    this.articles.set(id, updated);
    return { ...updated };
  }

  public async findArticleById(id: string): Promise<ArticleEntity | null> {
    const article = this.articles.get(id);
    if (!article || article.deletedAt) return null;

    const copy = { ...article };
    copy.revisions = this.revisions.get(id) || [];
    copy.editorialReviews = this.reviews.get(id) || [];
    return copy;
  }

  public async findArticleBySlug(slug: string): Promise<ArticleEntity | null> {
    for (const art of this.articles.values()) {
      if (art.slug === slug && !art.deletedAt) {
        const copy = { ...art };
        copy.revisions = this.revisions.get(art.id) || [];
        copy.editorialReviews = this.reviews.get(art.id) || [];
        return copy;
      }
    }
    return null;
  }

  public async findArticleByPublicId(publicId: string): Promise<ArticleEntity | null> {
    for (const art of this.articles.values()) {
      if (art.publicId === publicId && !art.deletedAt) {
        const copy = { ...art };
        copy.revisions = this.revisions.get(art.id) || [];
        copy.editorialReviews = this.reviews.get(art.id) || [];
        return copy;
      }
    }
    return null;
  }

  public async findArticles(params: ArticleFilterParams): Promise<PaginatedResult<ArticleSummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    let list = Array.from(this.articles.values()).filter((a) => !a.deletedAt);

    if (params.status && params.status !== 'all') {
      list = list.filter((a) => a.status === params.status);
    }
    if (params.authorId) {
      list = list.filter((a) => a.authorId === params.authorId);
    }
    if (params.categoryId) {
      list = list.filter((a) => a.primaryCategoryId === params.categoryId);
    }
    if (params.locationId) {
      list = list.filter((a) => a.primaryLocationId === params.locationId);
    }
    if (params.isBreaking !== undefined) {
      list = list.filter((a) => a.isBreaking === params.isBreaking);
    }
    if (params.search) {
      const term = params.search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          (a.subheadline && a.subheadline.toLowerCase().includes(term))
      );
    }

    const sortField = params.sortBy || 'createdAt';
    const isAsc = params.sortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'publishedAt') {
        const aT = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bT = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        cmp = aT - bT;
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      }
      return isAsc ? cmp : -cmp;
    });

    const total = list.length;
    const skip = (page - 1) * limit;
    const paginated = list.slice(skip, skip + limit);

    const items: ArticleSummary[] = paginated.map((r) => ({
      id: r.id,
      publicId: r.publicId,
      slug: r.slug,
      title: r.title,
      subheadline: r.subheadline,
      excerpt: r.excerpt,
      status: r.status,
      authorId: r.authorId,
      authorName: r.author?.fullName,
      primaryCategoryId: r.primaryCategoryId,
      primaryCategoryNameHi: r.primaryCategory?.nameHi,
      primaryCategorySlug: r.primaryCategory?.slug,
      primaryLocationId: r.primaryLocationId,
      primaryLocationNameHi: r.primaryLocation?.nameHi,
      primaryLocationSlug: r.primaryLocation?.slug,
      featuredMediaId: r.featuredMediaId,
      isBreaking: r.isBreaking,
      breakingPriority: r.breakingPriority,
      contentSource: r.contentSource,
      viewCount: Number(r.viewCount || 0),
      shareCount: r.shareCount || 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      publishedAt: r.publishedAt,
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async createRevision(data: Omit<NewsRevisionEntity, 'id' | 'createdAt'>): Promise<NewsRevisionEntity> {
    const rev: NewsRevisionEntity = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      newsId: data.newsId,
      versionNumber: data.versionNumber,
      title: data.title,
      subheadline: data.subheadline || null,
      bodyContent: data.bodyContent,
      excerpt: data.excerpt || null,
      revisedBy: data.revisedBy,
      revisionSummary: data.revisionSummary || null,
      createdAt: new Date(),
    };

    const list = this.revisions.get(data.newsId) || [];
    list.unshift(rev);
    this.revisions.set(data.newsId, list);

    return rev;
  }

  public async findRevisions(articleId: string): Promise<NewsRevisionEntity[]> {
    return this.revisions.get(articleId) || [];
  }

  public async createEditorialReview(
    data: Omit<EditorialReviewEntity, 'id' | 'createdAt'>
  ): Promise<EditorialReviewEntity> {
    const rev: EditorialReviewEntity = {
      id: `revw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      newsId: data.newsId,
      reviewerId: data.reviewerId,
      action: data.action,
      reasonCode: data.reasonCode || null,
      feedbackComments: data.feedbackComments || null,
      createdAt: new Date(),
    };

    const list = this.reviews.get(data.newsId) || [];
    list.unshift(rev);
    this.reviews.set(data.newsId, list);

    return rev;
  }

  public async findEditorialReviews(articleId: string): Promise<EditorialReviewEntity[]> {
    return this.reviews.get(articleId) || [];
  }

  public async findImportedRssItemByGuidHash(guidHash: string): Promise<ImportedRssItemEntity | null> {
    return this.importedRss.get(guidHash) || null;
  }

  public async createImportedRssItem(
    data: Omit<ImportedRssItemEntity, 'id' | 'importedAt'>
  ): Promise<ImportedRssItemEntity> {
    const item: ImportedRssItemEntity = {
      id: `rssitem-${Date.now()}`,
      rssSourceId: data.rssSourceId,
      guidHash: data.guidHash,
      originalTitle: data.originalTitle,
      originalUrl: data.originalUrl,
      generatedNewsId: data.generatedNewsId || null,
      aiProcessingStatus: data.aiProcessingStatus || 'pending',
      importedAt: new Date(),
    };
    this.importedRss.set(data.guidHash, item);
    return item;
  }

  public async getEditorialStats(): Promise<EditorialStats> {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    let pendingReview = 0;
    let underReview = 0;
    let revisionRequested = 0;
    let publishedTotal = 0;
    let publishedToday = 0;
    let rejected = 0;
    let breakingNews = 0;

    for (const art of this.articles.values()) {
      if (art.status === 'pending_review') pendingReview++;
      if (art.status === 'under_review') underReview++;
      if (art.status === 'revision_requested') revisionRequested++;
      if (art.status === 'published') {
        publishedTotal++;
        if (art.publishedAt && new Date(art.publishedAt) >= startOfToday) {
          publishedToday++;
        }
      }
      if (art.status === 'rejected') rejected++;
      if (art.isBreaking) breakingNews++;
    }

    return {
      totalIncoming: pendingReview + underReview,
      pendingReview,
      underReview,
      revisionRequested,
      publishedToday,
      publishedTotal,
      rejected,
      breakingNews,
    };
  }

  public async findRecentEditorialReviews(limit = 20): Promise<any[]> {
    const allReviews: any[] = [];
    for (const [newsId, list] of this.reviews.entries()) {
      const article = this.articles.get(newsId);
      for (const r of list) {
        allReviews.push({
          ...r,
          news: article
            ? { id: article.id, title: article.title, slug: article.slug, status: article.status }
            : null,
          reviewer: { id: r.reviewerId, fullName: 'संपादक' },
        });
      }
    }
    allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return allReviews.slice(0, limit);
  }

  public clear(): void {
    this.articles.clear();
    this.revisions.clear();
    this.reviews.clear();
    this.importedRss.clear();
  }
}

let repositoryInstance: IArticleRepository | null = null;

export function getArticleRepository(): IArticleRepository {
  if (!repositoryInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      repositoryInstance = new InMemoryArticleRepository();
    } else {
      repositoryInstance = new PrismaArticleRepository();
    }
  }
  return repositoryInstance;
}

export const articleRepository = getArticleRepository();
