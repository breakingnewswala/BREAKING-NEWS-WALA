/**
 * BREAKING NEWS WALA — Media Module Types & Interfaces
 * Grounded in docs/16-Storage.md, docs/12-Database.md (DOM-J), and docs/13-API.md (MED-01 through MED-04)
 */

import { AssetType, ProcessingStatus, AccessClassification } from './media.constants';

export interface MediaAssetEntity {
  id: string;
  storageKey: string;
  cdnUrl: string;
  fileType: string; // image, video, audio, document
  mimeType: string;
  fileSizeBytes: bigint | number;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  blurhash?: string | null;
  altTextHi?: string | null;
  uploadedBy?: string | null;
  createdAt: Date;
  // Transient or populated relations
  variants?: MediaVariantEntity[];
  uploader?: {
    id: string;
    fullName: string;
    email?: string | null;
    phoneNumber?: string | null;
  };
  processingStatus?: ProcessingStatus;
  accessClassification?: AccessClassification;
  originalFilename?: string | null;
}

export interface MediaVariantEntity {
  id: string;
  parentMediaId: string;
  variantType: string; // thumbnail, mobile, tablet, 16x9, 1x1, 9x16, lead_1200w, hero_1920w
  storageKey: string;
  cdnUrl: string;
  width?: number | null;
  height?: number | null;
}

export interface CreatePresignedUploadDto {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  assetType?: AssetType;
  altTextHi?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
}

export interface PresignedUploadResult {
  mediaId: string;
  uploadUrl: string;
  storageKey: string;
  cdnUrl: string;
  expiresInSeconds: number;
  method: 'PUT';
  headers: Record<string, string>;
}

export interface ConfirmUploadDto {
  mediaId: string;
  etag?: string;
  checksumSha256?: string;
  width?: number;
  height?: number;
  durationMs?: number;
}

export interface DirectUploadDto {
  fileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  assetType?: AssetType;
  altTextHi?: string;
  uploadedBy?: string;
}

export interface AttachArticleMediaDto {
  articleId: string;
  mediaId: string;
  isFeatured?: boolean;
}

export interface MediaFilterParams {
  page?: number;
  limit?: number;
  fileType?: string;
  uploadedBy?: string;
  search?: string;
  sortBy?: 'createdAt' | 'fileSizeBytes' | 'fileType';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaSummary {
  id: string;
  storageKey: string;
  cdnUrl: string;
  fileType: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number | null;
  height?: number | null;
  aspectRatio?: string | null;
  blurhash?: string | null;
  altTextHi?: string | null;
  uploadedBy?: string | null;
  uploaderName?: string;
  createdAt: string;
  variants: Array<{
    id: string;
    variantType: string;
    cdnUrl: string;
    width?: number | null;
    height?: number | null;
  }>;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

