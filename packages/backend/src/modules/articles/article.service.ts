/**
 * BREAKING NEWS WALA — Article Core Service
 * Grounded in docs/05-Workflows.md (WF-CRE-01, WF-CRE-03, WF-EDT-01, WF-EDT-02, WF-EDT-03, WF-TRU-01),
 * docs/06-Business-Rules.md (RULE-NEWS-003, RULE-NEWS-004, RULE-NEWS-005, RULE-EDIT-001 through RULE-EDIT-007),
 * and docs/13-API.md (REP-03 through REP-08)
 */

import crypto from 'crypto';
import { AppError } from '../../errors/app-error';
import { categoryService, CategoryService } from '../categories/category.service';
import { territoryService, TerritoryService } from '../territory/territory.service';
import { articleRepository, IArticleRepository } from './article.repository';
import { ArticleWorkflowEngine } from './article.workflow';
import {
  ArticleEntity,
  ArticleFilterParams,
  ArticleStatus,
  ArticleSummary,
  CreateArticleDraftDto,
  EditorialReviewDto,
  EditorialReviewEntity,
  EditorialStats,
  IngestExternalArticleDto,
  NewsRevisionEntity,
  PaginatedResult,
  UpdateArticleDraftDto,
} from './types';

export class ArticleService {
  constructor(
    private readonly repo: IArticleRepository = articleRepository,
    private readonly categories: CategoryService = categoryService,
    private readonly territories: TerritoryService = territoryService
  ) {}

  /**
   * Generates a unique, non-colliding human-readable publicId (e.g. art_20261031_ab12cd).
   */
  private generatePublicId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(3).toString('hex');
    return `art_${dateStr}_${rand}`;
  }

  /**
   * Generates an SEO-compliant ASCII URL slug from title and publicId.
   */
  private generateSlug(title: string, publicId: string): string {
    const asciiPart = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);

    return asciiPart ? `${asciiPart}-${publicId}` : `${publicId}`;
  }

  /**
   * Creates a new news article draft.
   * Grounded in WF-CRE-01 & RULE-NEWS-005.
   */
  public async createDraft(
    authorId: string,
    _authorRoles: string[],
    dto: CreateArticleDraftDto
  ): Promise<ArticleEntity> {
    // 1. Validate Category Binding via Category Module (RULE-CAT-004)
    const categoryResult = await this.categories.validateArticleTaxonomy(
      dto.primaryCategoryId,
      dto.subcategoryId
    );

    // 2. Validate Geographic Location via Territory Module (RULE-LOC-001, RULE-NEWS-005)
    const location = await this.territories.getDistrictBySlugOrId(dto.primaryLocationId);

    // 3. Generate Public ID and Slug
    const publicId = this.generatePublicId();
    const slug = dto.slug && dto.slug.trim() ? dto.slug.trim() : this.generateSlug(dto.title, publicId);

    // Ensure slug uniqueness
    const existingSlug = await this.repo.findArticleBySlug(slug);
    const finalSlug = existingSlug ? `${slug}-${crypto.randomBytes(2).toString('hex')}` : slug;

    // 4. Derive Excerpt if omitted
    const excerpt = dto.excerpt || dto.bodyContent.slice(0, 200).replace(/\s+[^\s]*$/, '...');

    // 5. Persist Article Draft
    const article = await this.repo.createArticle({
      publicId,
      slug: finalSlug,
      title: dto.title.trim(),
      subheadline: dto.subheadline ? dto.subheadline.trim() : null,
      bodyContent: dto.bodyContent.trim(),
      excerpt,
      authorId,
      primaryCategoryId: categoryResult.primaryCategory.id,
      subcategoryId: categoryResult.subcategory?.id || null,
      primaryLocationId: location.id,
      featuredMediaId: dto.featuredMediaId || null,
      status: 'draft',
      contentSource: 'original_reporter',
      sourceAttribution: dto.sourceAttribution || null,
      isBreaking: dto.isBreaking || false,
      breakingPriority: dto.breakingPriority || 0,
    });

    // 6. Record Initial Version Snapshot (NewsRevision v1)
    await this.repo.createRevision({
      newsId: article.id,
      versionNumber: 1,
      title: article.title,
      subheadline: article.subheadline,
      bodyContent: article.bodyContent,
      excerpt: article.excerpt,
      revisedBy: authorId,
      revisionSummary: 'Initial draft created',
    });

    return article;
  }

  /**
   * Updates an existing draft or revision-requested article.
   * Grounded in WF-CRE-01, WF-EDT-04 & RULE-EDIT-006.
   */
  public async updateDraft(
    articleId: string,
    userId: string,
    userRoles: string[],
    dto: UpdateArticleDraftDto
  ): Promise<ArticleEntity> {
    const article = await this.repo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const isAuthor = article.authorId === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);

    // IDOR & Authorization Gate
    if (!isAuthor && !isEditor) {
      throw AppError.forbidden('You do not have permission to edit this article draft.');
    }

    // Editable status constraint
    if (!isEditor && article.status !== 'draft' && article.status !== 'revision_requested') {
      throw AppError.forbidden(
        `Articles in "${article.status}" state cannot be modified through the draft editor.`
      );
    }

    // Re-validate category if changed
    let categoryId = article.primaryCategoryId;
    let subcatId = article.subcategoryId;
    if (dto.primaryCategoryId) {
      const catCheck = await this.categories.validateArticleTaxonomy(
        dto.primaryCategoryId,
        dto.subcategoryId !== undefined ? dto.subcategoryId : subcatId
      );
      categoryId = catCheck.primaryCategory.id;
      subcatId = catCheck.subcategory?.id || null;
    }

    // Re-validate location if changed
    let locationId = article.primaryLocationId;
    if (dto.primaryLocationId) {
      const loc = await this.territories.getDistrictBySlugOrId(dto.primaryLocationId);
      locationId = loc.id;
    }

    const updated = await this.repo.updateArticle(article.id, {
      title: dto.title !== undefined ? dto.title.trim() : article.title,
      subheadline: dto.subheadline !== undefined ? dto.subheadline.trim() : article.subheadline,
      bodyContent: dto.bodyContent !== undefined ? dto.bodyContent.trim() : article.bodyContent,
      excerpt: dto.excerpt !== undefined ? dto.excerpt : article.excerpt,
      slug: dto.slug !== undefined ? dto.slug.trim() : article.slug,
      primaryCategoryId: categoryId,
      subcategoryId: subcatId,
      primaryLocationId: locationId,
      featuredMediaId: dto.featuredMediaId !== undefined ? dto.featuredMediaId : article.featuredMediaId,
      sourceAttribution: dto.sourceAttribution !== undefined ? dto.sourceAttribution : article.sourceAttribution,
      isBreaking: dto.isBreaking !== undefined ? dto.isBreaking : article.isBreaking,
      breakingPriority: dto.breakingPriority !== undefined ? dto.breakingPriority : article.breakingPriority,
      lastEditorId: userId,
    });

    // Record Revision Snapshot if text changed (RULE-EDIT-006)
    if (
      dto.title !== undefined ||
      dto.bodyContent !== undefined ||
      dto.subheadline !== undefined
    ) {
      const revisions = await this.repo.findRevisions(article.id);
      const nextVersion = revisions.length > 0 && revisions[0] ? revisions[0].versionNumber + 1 : 2;

      await this.repo.createRevision({
        newsId: article.id,
        versionNumber: nextVersion,
        title: updated.title,
        subheadline: updated.subheadline,
        bodyContent: updated.bodyContent,
        excerpt: updated.excerpt,
        revisedBy: userId,
        revisionSummary: dto.revisionSummary || 'Draft content updated',
      });
    }

    return updated;
  }

  /**
   * Retrieves an article by ID, publicId, or slug.
   * Enforces reader privacy and permission boundaries (RULE-ROLE-005).
   */
  public async getArticle(
    idOrSlugOrPublicId: string,
    userId?: string,
    userRoles: string[] = []
  ): Promise<ArticleEntity> {
    let article = await this.repo.findArticleById(idOrSlugOrPublicId);
    if (!article) {
      article = await this.repo.findArticleByPublicId(idOrSlugOrPublicId);
    }
    if (!article) {
      article = await this.repo.findArticleBySlug(idOrSlugOrPublicId);
    }

    if (!article) {
      throw AppError.notFound(`Article "${idOrSlugOrPublicId}" not found.`);
    }

    // Access control for non-published articles
    if (article.status !== 'published') {
      const isAuthor = userId && article.authorId === userId;
      const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);

      if (!isAuthor && !isEditor) {
        throw AppError.forbidden('Access to unpublished newsroom drafts is restricted.');
      }
    }

    return article;
  }

  /**
   * Lists articles authored by the authenticated user.
   */
  public async listMyArticles(
    userId: string,
    params: ArticleFilterParams
  ): Promise<PaginatedResult<ArticleSummary>> {
    return this.repo.findArticles({
      ...params,
      authorId: userId,
    });
  }

  /**
   * General article querying with pagination, search, and status filters.
   */
  public async listArticles(
    params: ArticleFilterParams,
    _userId?: string,
    userRoles: string[] = []
  ): Promise<PaginatedResult<ArticleSummary>> {
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);

    // If caller is public / unauthenticated, enforce status = published
    if (!isEditor && params.status !== 'published') {
      params.status = 'published';
    }

    return this.repo.findArticles(params);
  }

  /**
   * Submits a draft for central editorial review.
   * Grounded in WF-CRE-03 & RULE-EDIT-001.
   */
  public async submitDraft(
    articleId: string,
    authorId: string,
    authorRoles: string[]
  ): Promise<ArticleEntity> {
    const article = await this.repo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const isAuthor = article.authorId === authorId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(authorRoles);

    if (!isAuthor && !isEditor) {
      throw AppError.forbidden('Only the author can submit this draft for review.');
    }

    // Enforce workflow state transition
    ArticleWorkflowEngine.validateTransition(article.status, 'pending_review', {
      userId: authorId,
      userRoles: authorRoles,
      isAuthor,
    });

    const updated = await this.repo.updateArticle(article.id, {
      status: 'pending_review',
      submittedAt: new Date(),
    });

    return updated;
  }

  /**
   * Fast-track direct publishing for Trusted Reporters.
   * Grounded in WF-TRU-01, RULE-EDIT-002, and RULE-EDIT-003.
   */
  public async directPublish(
    articleId: string,
    authorId: string,
    authorRoles: string[]
  ): Promise<{ article: ArticleEntity; rerouted?: boolean; note?: string }> {
    const article = await this.repo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const isAuthor = article.authorId === authorId;
    if (!isAuthor) {
      throw AppError.forbidden('Only the article author can execute publication.');
    }

    // Retrieve reporter assigned districts
    const assignments = await this.territories.getReporterAssignments(authorId);
    const assignedDistrictIds = assignments.map((a) => a.locationId);

    // Validate transition & territorial jurisdiction
    const transitionResult = ArticleWorkflowEngine.validateTransition(
      article.status,
      'published',
      {
        userId: authorId,
        userRoles: authorRoles,
        isAuthor: true,
        assignedDistricts: assignedDistrictIds,
        articleDistrictId: article.primaryLocationId,
      }
    );

    const now = new Date();
    const updated = await this.repo.updateArticle(article.id, {
      status: transitionResult.targetStatus,
      publishedAt: transitionResult.targetStatus === 'published' ? now : null,
      submittedAt: transitionResult.targetStatus === 'pending_review' ? now : article.submittedAt,
    });

    // Record editorial review audit entry for direct publishing
    await this.repo.createEditorialReview({
      newsId: article.id,
      reviewerId: authorId,
      action: transitionResult.targetStatus === 'published' ? 'direct_published' : 'rerouted_to_review',
      reasonCode: transitionResult.rerouted ? 'OUTSIDE_BEAT' : null,
      feedbackComments: transitionResult.note || 'Trusted reporter publication',
    });

    return {
      article: updated,
      rerouted: transitionResult.rerouted,
      note: transitionResult.note,
    };
  }

  /**
   * Performs an editorial review action on an article.
   * Actions: claim, approve, request_changes, reject, retract.
   * Grounded in WF-EDT-01, WF-EDT-02, WF-EDT-03, RULE-EDIT-005, RULE-EDIT-007.
   */
  public async reviewArticle(
    articleId: string,
    reviewerId: string,
    reviewerRoles: string[],
    dto: EditorialReviewDto
  ): Promise<{ article: ArticleEntity; review: EditorialReviewEntity }> {
    if (!ArticleWorkflowEngine.isElevatedEditor(reviewerRoles)) {
      throw AppError.forbidden('Editorial actions require editor or administrator privileges.');
    }

    const article = await this.repo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    let targetStatus: ArticleStatus;
    let actionName: string = dto.action;

    switch (dto.action) {
      case 'claim':
        targetStatus = 'under_review';
        break;
      case 'approve':
        targetStatus = 'published';
        break;
      case 'request_changes':
        targetStatus = 'revision_requested';
        break;
      case 'reject':
        targetStatus = 'rejected';
        break;
      case 'retract':
        targetStatus = 'retracted';
        break;
      default:
        throw AppError.validationFailed(`Unsupported editorial review action: ${dto.action}`);
    }

    // Enforce workflow constraints & rejection feedback requirements
    ArticleWorkflowEngine.validateTransition(article.status, targetStatus, {
      userId: reviewerId,
      userRoles: reviewerRoles,
      isAuthor: false,
      reasonCode: dto.reasonCode,
      feedbackComments: dto.feedbackComments,
    });

    const now = new Date();
    const updated = await this.repo.updateArticle(article.id, {
      status: targetStatus,
      lastEditorId: reviewerId,
      publishedAt: targetStatus === 'published' ? now : article.publishedAt,
    });

    const review = await this.repo.createEditorialReview({
      newsId: article.id,
      reviewerId,
      action: actionName,
      reasonCode: dto.reasonCode || null,
      feedbackComments: dto.feedbackComments || null,
    });

    return { article: updated, review };
  }

  /**
   * Ingests an external wire/RSS article into a non-published draft state.
   * Grounded in WF-RSS-02 & Section 10 of prompt.
   */
  public async ingestExternalArticle(
    dto: IngestExternalArticleDto
  ): Promise<{ article: ArticleEntity; isNew: boolean }> {
    // 1. Deduplication via GUID / URL Hash (SimHash / SHA-256)
    const guidHash =
      dto.guidHash ||
      crypto.createHash('sha256').update(dto.originalUrl.trim()).digest('hex');

    const existingItem = await this.repo.findImportedRssItemByGuidHash(guidHash);
    if (existingItem && existingItem.generatedNewsId) {
      const existingArticle = await this.repo.findArticleById(existingItem.generatedNewsId);
      if (existingArticle) {
        return { article: existingArticle, isNew: false };
      }
    }

    // 2. Resolve default category if omitted
    let categoryId = dto.primaryCategoryId;
    if (!categoryId) {
      const overview = await this.categories.getOverview();
      categoryId = overview.categories[0]?.id || 'top-news';
    }

    // 3. Resolve default location if omitted
    let locationId = dto.primaryLocationId;
    if (!locationId) {
      locationId = 'bhopal'; // Flagship state capital location
    }

    const publicId = this.generatePublicId();
    const slug = this.generateSlug(dto.originalTitle, publicId);

    // 4. Create in DRAFT status (Never directly published per Section 10)
    const article = await this.repo.createArticle({
      publicId,
      slug,
      title: dto.originalTitle.trim().slice(0, 150),
      bodyContent: dto.bodyContent.trim(),
      excerpt: dto.bodyContent.slice(0, 200),
      authorId: '00000000-0000-0000-0000-000000000001', // System Wire Ingestion Service UID
      primaryCategoryId: categoryId,
      primaryLocationId: locationId,
      status: 'draft',
      contentSource: 'external_wire',
      sourceAttribution: dto.sourceName.trim(),
    });

    // 5. Track Imported RSS metadata
    await this.repo.createImportedRssItem({
      rssSourceId: '00000000-0000-0000-0000-000000000001',
      guidHash,
      originalTitle: dto.originalTitle,
      originalUrl: dto.originalUrl,
      generatedNewsId: article.id,
      aiProcessingStatus: 'pending',
    });

    return { article, isNew: true };
  }

  public async getArticleReviews(
    articleId: string,
    userId: string,
    userRoles: string[]
  ): Promise<EditorialReviewEntity[]> {
    const article = await this.repo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const isAuthor = article.authorId === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);

    if (!isAuthor && !isEditor) {
      throw AppError.forbidden('You do not have permission to view review history for this article.');
    }

    return this.repo.findEditorialReviews(articleId);
  }

  public async getArticleRevisions(
    articleId: string,
    userId: string,
    userRoles: string[]
  ): Promise<NewsRevisionEntity[]> {
    const article = await this.repo.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const isAuthor = article.authorId === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);

    if (!isAuthor && !isEditor) {
      throw AppError.forbidden('You do not have permission to view version revisions for this article.');
    }

    return this.repo.findRevisions(articleId);
  }

  /**
   * Retrieves aggregated newsroom statistics for authorized editorial personnel.
   */
  public async getEditorialStats(userRoles: string[]): Promise<EditorialStats> {
    if (!ArticleWorkflowEngine.isElevatedEditor(userRoles)) {
      throw AppError.forbidden('Editorial statistics require editor or administrator privileges.');
    }
    return this.repo.getEditorialStats();
  }

  /**
   * Retrieves recent editorial activity timeline across all articles.
   */
  public async getRecentEditorialActivity(userRoles: string[], limit = 20): Promise<any[]> {
    if (!ArticleWorkflowEngine.isElevatedEditor(userRoles)) {
      throw AppError.forbidden('Editorial activity feed requires editor or administrator privileges.');
    }
    return this.repo.findRecentEditorialReviews(limit);
  }
}

export const articleService = new ArticleService();
