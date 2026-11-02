/**
 * BREAKING NEWS WALA — Media Service Core Engine
 * Grounded in docs/16-Storage.md, docs/06-Business-Rules.md (RULE-NEWS-006, RULE-SEC-004),
 * and docs/13-API.md (MED-01 through MED-04)
 */

import crypto from 'crypto';
import path from 'path';
import { AppError } from '../../errors/app-error';
import { config } from '../../config';
import { ArticleWorkflowEngine } from '../articles/article.workflow';
import { articleRepository, IArticleRepository } from '../articles/article.repository';
import {
  ASSET_TYPES,
  AssetType,
  MIME_TYPE_WHITELIST,
  PRESIGNED_URL_EXPIRY_SECONDS,
} from './media.constants';
import { getMediaRepository, IMediaRepository } from './media.repository';
import { getStorageProvider, IStorageProvider } from './media.storage';
import {
  AttachArticleMediaDto,
  ConfirmUploadDto,
  CreatePresignedUploadDto,
  DirectUploadDto,
  MediaAssetEntity,
  MediaFilterParams,
  MediaSummary,
  PaginatedResult,
  PresignedUploadResult,
} from './types';
import { verifyMagicBytes } from './media.validator';

export class MediaService {
  constructor(
    private readonly repo: IMediaRepository = getMediaRepository(),
    private readonly storage: IStorageProvider = getStorageProvider(),
    private readonly articles: IArticleRepository = articleRepository
  ) {}

  /**
   * Generates a collision-free, safe cryptographic storage key.
   * Format: domain/YYYY/MM/uuid.ext (Section 9.3)
   */
  private generateStorageKey(assetType: AssetType, originalFilename: string, mimeType: string): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();

    const mimeDef = MIME_TYPE_WHITELIST[mimeType.toLowerCase()];
    let ext = path.extname(originalFilename).toLowerCase();
    if (!ext || (mimeDef && !mimeDef.extensions.includes(ext))) {
      ext = mimeDef ? mimeDef.extensions[0] || '.bin' : '.bin';
    }

    const domainFolder =
      assetType === 'image'
        ? 'news/articles'
        : assetType === 'video'
        ? 'video/reels'
        : assetType === 'audio'
        ? 'audio/voiceovers'
        : 'documents/epaper';

    return `${domainFolder}/${year}/${month}/${uuid}${ext}`;
  }

  /**
   * Resolves asset category from declared MIME type.
   */
  private resolveAssetType(declaredType?: AssetType, mimeType?: string): AssetType {
    if (declaredType && ASSET_TYPES.includes(declaredType)) {
      return declaredType;
    }
    if (mimeType) {
      const def = MIME_TYPE_WHITELIST[mimeType.toLowerCase()];
      if (def) return def.assetType;
    }
    return 'image';
  }

  /**
   * Generates short-lived Presigned PUT Upload Ticket (MED-01, DEC-020).
   */
  public async createPresignedUpload(
    userId: string,
    _userRoles: string[],
    dto: CreatePresignedUploadDto
  ): Promise<PresignedUploadResult> {
    const assetType = this.resolveAssetType(dto.assetType, dto.mimeType);
    const storageKey = this.generateStorageKey(assetType, dto.fileName, dto.mimeType);
    const cdnUrl = this.storage.getCdnUrl(storageKey, true);

    // Persist pending media asset record in database
    const mediaAsset = await this.repo.createMediaAsset({
      storageKey,
      cdnUrl,
      fileType: assetType,
      mimeType: dto.mimeType.toLowerCase().trim(),
      fileSizeBytes: BigInt(dto.fileSizeBytes),
      width: dto.width || null,
      height: dto.height || null,
      aspectRatio: dto.aspectRatio || null,
      altTextHi: dto.altTextHi || null,
      uploadedBy: userId,
      processingStatus: 'pending_upload',
      accessClassification: 'public',
      originalFilename: dto.fileName.trim(),
    });

    // Generate cloud storage presigned PUT URL
    const presigned = await this.storage.generatePresignedUploadUrl({
      key: storageKey,
      mimeType: dto.mimeType.toLowerCase().trim(),
      fileSizeBytes: dto.fileSizeBytes,
      expiresInSeconds: config.storage.presignedUrlTtlSeconds || PRESIGNED_URL_EXPIRY_SECONDS,
      isPublic: true,
    });

    return {
      mediaId: mediaAsset.id,
      uploadUrl: presigned.uploadUrl,
      storageKey,
      cdnUrl,
      expiresInSeconds: config.storage.presignedUrlTtlSeconds || PRESIGNED_URL_EXPIRY_SECONDS,
      method: 'PUT',
      headers: presigned.headers,
    };
  }

  /**
   * Confirms upload completion, validates storage presence, and registers variants (MED-02).
   */
  public async confirmUpload(
    userId: string,
    userRoles: string[],
    dto: ConfirmUploadDto
  ): Promise<MediaAssetEntity> {
    const asset = await this.repo.findMediaAssetById(dto.mediaId, true);
    if (!asset) {
      throw AppError.notFound(`Media asset "${dto.mediaId}" not found.`);
    }

    // Authorization: only uploader or elevated editor/admin can confirm upload
    const isOwner = asset.uploadedBy === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);
    if (!isOwner && !isEditor) {
      throw AppError.forbidden('You are not authorized to confirm this media upload.');
    }

    // Verify object existence in cloud storage
    const exists = await this.storage.objectExists(asset.storageKey);
    if (!exists) {
      throw AppError.validationFailed(
        `Cloud storage verification failed: File not found for key "${asset.storageKey}".`
      );
    }

    let aspectRatio: string | null = asset.aspectRatio || null;
    const finalWidth: number | null = dto.width !== undefined ? dto.width : (asset.width || null);
    const finalHeight: number | null = dto.height !== undefined ? dto.height : (asset.height || null);
    if (finalWidth && finalHeight) {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(finalWidth, finalHeight);
      aspectRatio = `${finalWidth / divisor}:${finalHeight / divisor}`;
    }

    // Advance processing status to ready
    const updated = await this.repo.updateMediaAsset(asset.id, {
      width: finalWidth,
      height: finalHeight,
      aspectRatio,
      processingStatus: 'ready',
    });

    // Generate responsive variants metadata if image
    if (asset.fileType === 'image') {
      const existingVariants = await this.repo.findMediaVariants(asset.id);
      if (existingVariants.length === 0) {
        const basePath = asset.storageKey.replace(/\.[^.]+$/, '');
        const ext = path.extname(asset.storageKey);

        await Promise.all([
          this.repo.createMediaVariant({
            parentMediaId: asset.id,
            variantType: 'thumb_320w',
            storageKey: `${basePath}_thumb_320w${ext}`,
            cdnUrl: this.storage.getCdnUrl(`${basePath}_thumb_320w${ext}`, true),
            width: 320,
            height: 180,
          }),
          this.repo.createMediaVariant({
            parentMediaId: asset.id,
            variantType: 'card_640w',
            storageKey: `${basePath}_card_640w${ext}`,
            cdnUrl: this.storage.getCdnUrl(`${basePath}_card_640w${ext}`, true),
            width: 640,
            height: 360,
          }),
          this.repo.createMediaVariant({
            parentMediaId: asset.id,
            variantType: 'lead_1200w',
            storageKey: `${basePath}_lead_1200w${ext}`,
            cdnUrl: this.storage.getCdnUrl(`${basePath}_lead_1200w${ext}`, true),
            width: 1200,
            height: 675,
          }),
        ]);
      }
    }

    return (await this.repo.findMediaAssetById(asset.id, true)) || updated;
  }

  /**
   * Direct media upload with magic byte inspection (RULE-SEC-004, testing/proxy ingress).
   */
  public async uploadMediaDirect(
    userId: string,
    _userRoles: string[],
    dto: DirectUploadDto
  ): Promise<MediaAssetEntity> {
    const assetType = this.resolveAssetType(dto.assetType, dto.mimeType);

    // Deep binary magic byte verification (RULE-SEC-004, RULE-SEC-007)
    const magicResult = verifyMagicBytes(dto.fileBuffer, dto.mimeType);
    if (!magicResult.isValid) {
      throw AppError.validationFailed(
        magicResult.error || 'File binary magic byte verification failed.'
      );
    }

    // Generate safe storage key
    const storageKey = this.generateStorageKey(assetType, dto.fileName, dto.mimeType);

    // Upload directly through storage provider abstraction
    const uploadRes = await this.storage.uploadObject(
      storageKey,
      dto.fileBuffer,
      dto.mimeType,
      true
    );

    // Persist media metadata
    const asset = await this.repo.createMediaAsset({
      storageKey,
      cdnUrl: uploadRes.cdnUrl,
      fileType: assetType,
      mimeType: dto.mimeType.toLowerCase().trim(),
      fileSizeBytes: BigInt(dto.fileBuffer.length),
      altTextHi: dto.altTextHi || null,
      uploadedBy: userId,
      processingStatus: 'ready',
      accessClassification: 'public',
      originalFilename: dto.fileName.trim(),
    });

    // Create standard variants if image
    if (assetType === 'image') {
      const basePath = storageKey.replace(/\.[^.]+$/, '');
      const ext = path.extname(storageKey);

      await Promise.all([
        this.repo.createMediaVariant({
          parentMediaId: asset.id,
          variantType: 'thumb_320w',
          storageKey: `${basePath}_thumb_320w${ext}`,
          cdnUrl: this.storage.getCdnUrl(`${basePath}_thumb_320w${ext}`, true),
          width: 320,
          height: 180,
        }),
        this.repo.createMediaVariant({
          parentMediaId: asset.id,
          variantType: 'card_640w',
          storageKey: `${basePath}_card_640w${ext}`,
          cdnUrl: this.storage.getCdnUrl(`${basePath}_card_640w${ext}`, true),
          width: 640,
          height: 360,
        }),
      ]);
    }

    return (await this.repo.findMediaAssetById(asset.id, true)) || asset;
  }

  /**
   * Retrieves single media asset metadata with access control (MED-03).
   */
  public async getMediaById(
    id: string,
    userId?: string,
    userRoles: string[] = []
  ): Promise<MediaAssetEntity> {
    const asset = await this.repo.findMediaAssetById(id, true);
    if (!asset) {
      throw AppError.notFound(`Media asset "${id}" not found.`);
    }

    // Confidential & private media access isolation
    if (asset.accessClassification === 'confidential' || asset.accessClassification === 'private') {
      const isOwner = userId && asset.uploadedBy === userId;
      const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);
      if (!isOwner && !isEditor) {
        throw AppError.forbidden('Access to private media asset is restricted.');
      }
    }

    return asset;
  }

  /**
   * Lists media assets with filtering and pagination.
   */
  public async listMedia(
    params: MediaFilterParams,
    userId?: string,
    userRoles: string[] = []
  ): Promise<PaginatedResult<MediaSummary>> {
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);

    // If regular reporter and no specific uploader filter, scope to own uploads
    if (!isEditor && userId && !params.uploadedBy) {
      params.uploadedBy = userId;
    }

    return this.repo.findMediaAssets(params);
  }

  /**
   * Deletes a media asset with relational integrity safeguards (MED-04).
   */
  public async deleteMedia(id: string, userId: string, userRoles: string[]): Promise<boolean> {
    const asset = await this.repo.findMediaAssetById(id, false);
    if (!asset) {
      throw AppError.notFound(`Media asset "${id}" not found.`);
    }

    const isOwner = asset.uploadedBy === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);
    if (!isOwner && !isEditor) {
      throw AppError.forbidden('You do not have permission to delete this media asset.');
    }

    // Prevent deletion if currently referenced as featured media by any active article (RULE-EDIT-006)
    const refCount = await this.repo.countArticlesReferencingMedia(id);
    if (refCount > 0) {
      throw AppError.conflict(
        `Cannot delete media asset because it is currently referenced by ${refCount} active news article(s). Detach from articles first.`
      );
    }

    // Delete object from cloud storage
    await this.storage.deleteObject(asset.storageKey);

    // Delete database record and cascade variants
    return this.repo.deleteMediaAsset(id);
  }

  /**
   * Attaches an approved media asset to a news article draft (Article Integration).
   */
  public async attachToArticle(
    userId: string,
    userRoles: string[],
    dto: AttachArticleMediaDto
  ): Promise<{ articleId: string; mediaId: string; isFeatured: boolean }> {
    // 1. Verify media asset exists and is ready
    const media = await this.repo.findMediaAssetById(dto.mediaId, false);
    if (!media) {
      throw AppError.notFound(`Media asset "${dto.mediaId}" not found.`);
    }

    // 2. Verify article exists
    const article = await this.articles.findArticleById(dto.articleId);
    if (!article) {
      throw AppError.notFound(`Article "${dto.articleId}" not found.`);
    }

    // 3. Ownership / editorial authorization
    const isAuthor = article.authorId === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);
    if (!isAuthor && !isEditor) {
      throw AppError.forbidden('You do not have permission to modify attachments for this article.');
    }

    // 4. Update article featured media reference
    await this.articles.updateArticle(article.id, {
      featuredMediaId: dto.mediaId,
    });

    if ('linkArticleMedia' in this.repo && typeof (this.repo as any).linkArticleMedia === 'function') {
      (this.repo as any).linkArticleMedia(article.id, dto.mediaId);
    }

    return {
      articleId: article.id,
      mediaId: media.id,
      isFeatured: true,
    };
  }

  /**
   * Detaches a media asset from a news article.
   */
  public async detachFromArticle(
    userId: string,
    userRoles: string[],
    articleId: string,
    mediaId: string
  ): Promise<{ articleId: string; mediaId: string; detached: boolean }> {
    const article = await this.articles.findArticleById(articleId);
    if (!article) {
      throw AppError.notFound(`Article "${articleId}" not found.`);
    }

    const isAuthor = article.authorId === userId;
    const isEditor = ArticleWorkflowEngine.isElevatedEditor(userRoles);
    if (!isAuthor && !isEditor) {
      throw AppError.forbidden('You do not have permission to modify attachments for this article.');
    }

    if (article.featuredMediaId === mediaId) {
      await this.articles.updateArticle(article.id, {
        featuredMediaId: null,
      });
      if ('unlinkArticleMedia' in this.repo && typeof (this.repo as any).unlinkArticleMedia === 'function') {
        (this.repo as any).unlinkArticleMedia(article.id, mediaId);
      }
    }

    return {
      articleId,
      mediaId,
      detached: true,
    };
  }
}

export const mediaService = new MediaService();
