/**
 * BREAKING NEWS WALA — Media Repository Boundary
 * Grounded in docs/12-Database.md (DOM-J: Media Asset Management)
 * Encapsulates database access for MediaAsset and MediaVariant entities.
 */

import { getPrismaClient } from '../../db/client';
import {
  MediaAssetEntity,
  MediaFilterParams,
  MediaSummary,
  MediaVariantEntity,
  PaginatedResult,
} from './types';

export interface IMediaRepository {
  createMediaAsset(data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity>;
  updateMediaAsset(id: string, data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity>;
  findMediaAssetById(id: string, includeVariants?: boolean): Promise<MediaAssetEntity | null>;
  findMediaAssetByStorageKey(storageKey: string): Promise<MediaAssetEntity | null>;
  findMediaAssets(params: MediaFilterParams): Promise<PaginatedResult<MediaSummary>>;
  deleteMediaAsset(id: string): Promise<boolean>;
  createMediaVariant(data: Omit<MediaVariantEntity, 'id'>): Promise<MediaVariantEntity>;
  findMediaVariants(parentMediaId: string): Promise<MediaVariantEntity[]>;
  deleteMediaVariant(id: string): Promise<boolean>;
  countArticlesReferencingMedia(mediaId: string): Promise<number>;
}

export class PrismaMediaRepository implements IMediaRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async createMediaAsset(data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    const created = await this.prisma.mediaAsset.create({
      data: {
        storageKey: data.storageKey!,
        cdnUrl: data.cdnUrl!,
        fileType: data.fileType!,
        mimeType: data.mimeType!,
        fileSizeBytes: BigInt(data.fileSizeBytes || 0),
        width: data.width || null,
        height: data.height || null,
        aspectRatio: data.aspectRatio || null,
        blurhash: data.blurhash || null,
        altTextHi: data.altTextHi || null,
        uploadedBy: data.uploadedBy || null,
      },
      include: {
        variants: true,
        uploader: {
          select: { id: true, email: true, phoneNumber: true, profile: { select: { fullName: true } } },
        },
      },
    });

    return this.mapPrismaToEntity(created);
  }

  public async updateMediaAsset(id: string, data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    const updatePayload: any = {};
    if (data.storageKey !== undefined) updatePayload.storageKey = data.storageKey;
    if (data.cdnUrl !== undefined) updatePayload.cdnUrl = data.cdnUrl;
    if (data.fileType !== undefined) updatePayload.fileType = data.fileType;
    if (data.mimeType !== undefined) updatePayload.mimeType = data.mimeType;
    if (data.fileSizeBytes !== undefined) updatePayload.fileSizeBytes = BigInt(data.fileSizeBytes);
    if (data.width !== undefined) updatePayload.width = data.width;
    if (data.height !== undefined) updatePayload.height = data.height;
    if (data.aspectRatio !== undefined) updatePayload.aspectRatio = data.aspectRatio;
    if (data.blurhash !== undefined) updatePayload.blurhash = data.blurhash;
    if (data.altTextHi !== undefined) updatePayload.altTextHi = data.altTextHi;

    const updated = await this.prisma.mediaAsset.update({
      where: { id },
      data: updatePayload,
      include: {
        variants: true,
        uploader: {
          select: { id: true, email: true, phoneNumber: true, profile: { select: { fullName: true } } },
        },
      },
    });

    return this.mapPrismaToEntity(updated);
  }

  public async findMediaAssetById(
    id: string,
    includeVariants: boolean = true
  ): Promise<MediaAssetEntity | null> {
    const found = await this.prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        variants: includeVariants,
        uploader: {
          select: { id: true, email: true, phoneNumber: true, profile: { select: { fullName: true } } },
        },
      },
    });

    return found ? this.mapPrismaToEntity(found) : null;
  }

  public async findMediaAssetByStorageKey(storageKey: string): Promise<MediaAssetEntity | null> {
    const found = await this.prisma.mediaAsset.findUnique({
      where: { storageKey },
      include: {
        variants: true,
        uploader: {
          select: { id: true, email: true, phoneNumber: true, profile: { select: { fullName: true } } },
        },
      },
    });

    return found ? this.mapPrismaToEntity(found) : null;
  }

  public async findMediaAssets(params: MediaFilterParams): Promise<PaginatedResult<MediaSummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.fileType) {
      where.fileType = params.fileType;
    }
    if (params.uploadedBy) {
      where.uploadedBy = params.uploadedBy;
    }
    if (params.search) {
      where.OR = [
        { storageKey: { contains: params.search, mode: 'insensitive' } },
        { altTextHi: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const sortField = params.sortBy || 'createdAt';
    const sortDir = params.sortOrder || 'desc';

    const [total, records] = await Promise.all([
      this.prisma.mediaAsset.count({ where }),
      this.prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortDir },
        include: {
          variants: true,
          uploader: {
            select: { id: true, profile: { select: { fullName: true } } },
          },
        },
      }),
    ]);

    const items: MediaSummary[] = records.map((r: any) => ({
      id: r.id,
      storageKey: r.storageKey,
      cdnUrl: r.cdnUrl,
      fileType: r.fileType,
      mimeType: r.mimeType,
      fileSizeBytes: Number(r.fileSizeBytes),
      width: r.width,
      height: r.height,
      aspectRatio: r.aspectRatio,
      blurhash: r.blurhash,
      altTextHi: r.altTextHi,
      uploadedBy: r.uploadedBy,
      uploaderName: r.uploader?.profile?.fullName || '',
      createdAt: r.createdAt.toISOString(),
      variants: (r.variants || []).map((v: any) => ({
        id: v.id,
        variantType: v.variantType,
        cdnUrl: v.cdnUrl,
        width: v.width,
        height: v.height,
      })),
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async deleteMediaAsset(id: string): Promise<boolean> {
    try {
      await this.prisma.mediaAsset.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async createMediaVariant(
    data: Omit<MediaVariantEntity, 'id'>
  ): Promise<MediaVariantEntity> {
    const created = await this.prisma.mediaVariant.create({
      data: {
        parentMediaId: data.parentMediaId,
        variantType: data.variantType,
        storageKey: data.storageKey,
        cdnUrl: data.cdnUrl,
        width: data.width || null,
        height: data.height || null,
      },
    });

    return {
      id: created.id,
      parentMediaId: created.parentMediaId,
      variantType: created.variantType,
      storageKey: created.storageKey,
      cdnUrl: created.cdnUrl,
      width: created.width,
      height: created.height,
    };
  }

  public async findMediaVariants(parentMediaId: string): Promise<MediaVariantEntity[]> {
    const variants = await this.prisma.mediaVariant.findMany({
      where: { parentMediaId },
    });

    return variants.map((v: any) => ({
      id: v.id,
      parentMediaId: v.parentMediaId,
      variantType: v.variantType,
      storageKey: v.storageKey,
      cdnUrl: v.cdnUrl,
      width: v.width,
      height: v.height,
    }));
  }

  public async deleteMediaVariant(id: string): Promise<boolean> {
    try {
      await this.prisma.mediaVariant.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  public async countArticlesReferencingMedia(mediaId: string): Promise<number> {
    return this.prisma.newsArticle.count({
      where: { featuredMediaId: mediaId, deletedAt: null },
    });
  }

  private mapPrismaToEntity(record: any): MediaAssetEntity {
    return {
      id: record.id,
      storageKey: record.storageKey,
      cdnUrl: record.cdnUrl,
      fileType: record.fileType,
      mimeType: record.mimeType,
      fileSizeBytes: Number(record.fileSizeBytes),
      width: record.width,
      height: record.height,
      aspectRatio: record.aspectRatio,
      blurhash: record.blurhash,
      altTextHi: record.altTextHi,
      uploadedBy: record.uploadedBy,
      createdAt: record.createdAt,
      variants: (record.variants || []).map((v: any) => ({
        id: v.id,
        parentMediaId: v.parentMediaId,
        variantType: v.variantType,
        storageKey: v.storageKey,
        cdnUrl: v.cdnUrl,
        width: v.width,
        height: v.height,
      })),
      uploader: record.uploader
        ? {
            id: record.uploader.id,
            fullName: record.uploader.profile?.fullName || '',
            email: record.uploader.email,
            phoneNumber: record.uploader.phoneNumber,
          }
        : undefined,
    };
  }
}

/**
 * In-Memory Media Repository
 * Provides isolated, stateful repository operations during testing and local development.
 */
export class InMemoryMediaRepository implements IMediaRepository {
  private assets: Map<string, MediaAssetEntity> = new Map();
  private variants: Map<string, MediaVariantEntity[]> = new Map();
  private articleMediaReferences: Map<string, Set<string>> = new Map(); // mediaId -> Set<articleId>

  public async createMediaAsset(data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    const id = data.id || `med-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();

    const entity: MediaAssetEntity = {
      id,
      storageKey: data.storageKey!,
      cdnUrl: data.cdnUrl!,
      fileType: data.fileType || 'image',
      mimeType: data.mimeType || 'image/jpeg',
      fileSizeBytes: data.fileSizeBytes || 0,
      width: data.width || null,
      height: data.height || null,
      aspectRatio: data.aspectRatio || null,
      blurhash: data.blurhash || null,
      altTextHi: data.altTextHi || null,
      uploadedBy: data.uploadedBy || null,
      createdAt: now,
      variants: [],
      uploader: data.uploader,
      processingStatus: data.processingStatus || 'ready',
      accessClassification: data.accessClassification || 'public',
      originalFilename: data.originalFilename || null,
    };

    this.assets.set(id, entity);
    return entity;
  }

  public async updateMediaAsset(id: string, data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    const existing = this.assets.get(id);
    if (!existing) {
      throw new Error(`Media asset "${id}" not found.`);
    }

    const updated: MediaAssetEntity = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
    };

    this.assets.set(id, updated);
    return updated;
  }

  public async findMediaAssetById(
    id: string,
    includeVariants: boolean = true
  ): Promise<MediaAssetEntity | null> {
    const asset = this.assets.get(id);
    if (!asset) return null;

    if (includeVariants) {
      const v = this.variants.get(id) || [];
      return { ...asset, variants: v };
    }

    return asset;
  }

  public async findMediaAssetByStorageKey(storageKey: string): Promise<MediaAssetEntity | null> {
    for (const asset of this.assets.values()) {
      if (asset.storageKey === storageKey) {
        const v = this.variants.get(asset.id) || [];
        return { ...asset, variants: v };
      }
    }
    return null;
  }

  public async findMediaAssets(params: MediaFilterParams): Promise<PaginatedResult<MediaSummary>> {
    let list = Array.from(this.assets.values());

    if (params.fileType) {
      list = list.filter((a) => a.fileType === params.fileType);
    }
    if (params.uploadedBy) {
      list = list.filter((a) => a.uploadedBy === params.uploadedBy);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.storageKey.toLowerCase().includes(q) ||
          (a.altTextHi && a.altTextHi.toLowerCase().includes(q))
      );
    }

    const sortField = params.sortBy || 'createdAt';
    const isAsc = params.sortOrder === 'asc';

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'fileSizeBytes') {
        cmp = Number(a.fileSizeBytes) - Number(b.fileSizeBytes);
      } else if (sortField === 'fileType') {
        cmp = a.fileType.localeCompare(b.fileType);
      }
      return isAsc ? cmp : -cmp;
    });

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const total = list.length;
    const skip = (page - 1) * limit;
    const paginated = list.slice(skip, skip + limit);

    const items: MediaSummary[] = paginated.map((r) => {
      const vList = this.variants.get(r.id) || [];
      return {
        id: r.id,
        storageKey: r.storageKey,
        cdnUrl: r.cdnUrl,
        fileType: r.fileType,
        mimeType: r.mimeType,
        fileSizeBytes: Number(r.fileSizeBytes),
        width: r.width,
        height: r.height,
        aspectRatio: r.aspectRatio,
        blurhash: r.blurhash,
        altTextHi: r.altTextHi,
        uploadedBy: r.uploadedBy,
        uploaderName: r.uploader?.fullName,
        createdAt: r.createdAt.toISOString(),
        variants: vList.map((v) => ({
          id: v.id,
          variantType: v.variantType,
          cdnUrl: v.cdnUrl,
          width: v.width,
          height: v.height,
        })),
      };
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async deleteMediaAsset(id: string): Promise<boolean> {
    this.variants.delete(id);
    return this.assets.delete(id);
  }

  public async createMediaVariant(
    data: Omit<MediaVariantEntity, 'id'>
  ): Promise<MediaVariantEntity> {
    const id = `var-uuid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const variant: MediaVariantEntity = {
      id,
      parentMediaId: data.parentMediaId,
      variantType: data.variantType,
      storageKey: data.storageKey,
      cdnUrl: data.cdnUrl,
      width: data.width || null,
      height: data.height || null,
    };

    const list = this.variants.get(data.parentMediaId) || [];
    list.push(variant);
    this.variants.set(data.parentMediaId, list);

    return variant;
  }

  public async findMediaVariants(parentMediaId: string): Promise<MediaVariantEntity[]> {
    return this.variants.get(parentMediaId) || [];
  }

  public async deleteMediaVariant(id: string): Promise<boolean> {
    for (const [parentId, list] of this.variants.entries()) {
      const filtered = list.filter((v) => v.id !== id);
      if (filtered.length !== list.length) {
        this.variants.set(parentId, filtered);
        return true;
      }
    }
    return false;
  }

  public async countArticlesReferencingMedia(mediaId: string): Promise<number> {
    const refs = this.articleMediaReferences.get(mediaId);
    return refs ? refs.size : 0;
  }

  /**
   * Test helper to record simulated article media attachment
   */
  public linkArticleMedia(articleId: string, mediaId: string): void {
    const refs = this.articleMediaReferences.get(mediaId) || new Set();
    refs.add(articleId);
    this.articleMediaReferences.set(mediaId, refs);
  }

  public unlinkArticleMedia(articleId: string, mediaId: string): void {
    const refs = this.articleMediaReferences.get(mediaId);
    if (refs) {
      refs.delete(articleId);
    }
  }

  public clear(): void {
    this.assets.clear();
    this.variants.clear();
    this.articleMediaReferences.clear();
  }
}

let repositoryInstance: IMediaRepository | null = null;

export function getMediaRepository(): IMediaRepository {
  if (!repositoryInstance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      repositoryInstance = new InMemoryMediaRepository();
    } else {
      repositoryInstance = new PrismaMediaRepository();
    }
  }
  return repositoryInstance;
}

export const mediaRepository = getMediaRepository();
