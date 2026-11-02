/**
 * BREAKING NEWS WALA — Media Validation & Security Middlewares
 * Grounded in docs/16-Storage.md (Section 9), docs/06-Business-Rules.md (RULE-NEWS-006, RULE-SEC-004),
 * and docs/13-API.md (Section 14: Media Upload and Download APIs)
 */

import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../errors/app-error';
import { ApiErrorDetail } from '@bnw/types';
import {
  AVATAR_SIZE_LIMIT,
  FILE_SIZE_LIMITS,
  MIME_TYPE_WHITELIST,
  PROHIBITED_EXTENSIONS,
} from './media.constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID_REGEX = /^[a-z0-9_-]{3,64}$/i;

/**
 * Validates binary magic byte signatures against declared MIME type (RULE-SEC-004, RULE-SEC-007).
 */
export function verifyMagicBytes(
  buffer: Buffer,
  declaredMimeType: string
): { isValid: boolean; detectedMime?: string; error?: string } {
  if (!buffer || buffer.length < 4) {
    return { isValid: false, error: 'File buffer is too short to verify magic bytes.' };
  }

  // 1. JPEG: FF D8 FF
  if (declaredMimeType === 'image/jpeg') {
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    return isJpeg
      ? { isValid: true, detectedMime: 'image/jpeg' }
      : { isValid: false, error: 'Binary header does not match standard JPEG magic bytes (FF D8 FF).' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (declaredMimeType === 'image/png') {
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    return isPng
      ? { isValid: true, detectedMime: 'image/png' }
      : { isValid: false, error: 'Binary header does not match standard PNG magic bytes.' };
  }

  // 3. WebP: RIFF .... WEBP
  if (declaredMimeType === 'image/webp') {
    const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const isWebp = buffer.length >= 12 && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    return isRiff && isWebp
      ? { isValid: true, detectedMime: 'image/webp' }
      : { isValid: false, error: 'Binary header does not match standard WebP RIFF/WEBP structure.' };
  }

  // 4. PDF: %PDF (25 50 44 46)
  if (declaredMimeType === 'application/pdf') {
    const isPdf = buffer.subarray(0, 4).toString('ascii') === '%PDF';
    return isPdf
      ? { isValid: true, detectedMime: 'application/pdf' }
      : { isValid: false, error: 'Binary header does not match standard PDF (%PDF-) magic bytes.' };
  }

  // 5. MP4 / MOV: ftyp at offset 4
  if (declaredMimeType === 'video/mp4' || declaredMimeType === 'video/quicktime') {
    if (buffer.length >= 12) {
      const ftyp = buffer.subarray(4, 8).toString('ascii');
      const isMp4 = ftyp === 'ftyp' || ftyp === 'moov' || ftyp === 'mdat';
      if (isMp4) return { isValid: true, detectedMime: declaredMimeType };
    }
    return {
      isValid: false,
      error: 'Binary header does not match standard MP4/MOV container structure (ftyp/moov).',
    };
  }

  // 6. WebM: 1A 45 DF A3 (EBML)
  if (declaredMimeType === 'video/webm') {
    const isEbml =
      buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    return isEbml
      ? { isValid: true, detectedMime: 'video/webm' }
      : { isValid: false, error: 'Binary header does not match standard WebM EBML structure.' };
  }

  // 7. MP3: ID3 or MPEG Audio sync word FF FB / FF F3 / FF F2
  if (declaredMimeType === 'audio/mpeg') {
    const isId3 = buffer.subarray(0, 3).toString('ascii') === 'ID3';
    const isSync = buffer[0] === 0xff && (buffer[1]! & 0xe0) === 0xe0;
    return isId3 || isSync
      ? { isValid: true, detectedMime: 'audio/mpeg' }
      : { isValid: false, error: 'Binary header does not match standard MP3 ID3 or sync word.' };
  }

  // 8. WAV: RIFF .... WAVE
  if (declaredMimeType === 'audio/wav') {
    const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const isWave = buffer.length >= 12 && buffer.subarray(8, 12).toString('ascii') === 'WAVE';
    return isRiff && isWave
      ? { isValid: true, detectedMime: 'audio/wav' }
      : { isValid: false, error: 'Binary header does not match standard WAV RIFF/WAVE structure.' };
  }

  // If MIME type is in whitelist but no specific magic byte parser defined:
  return { isValid: true };
}

/**
 * Validates presigned upload request parameters (MED-01)
 */
export function validatePresignedUpload(req: Request, _res: Response, next: NextFunction): void {
  const { fileName, mimeType, fileSizeBytes, assetType } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  // 1. Filename validation & directory traversal defense
  if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
    errors.push({
      field: 'body.fileName',
      code: 'ERR_REQUIRED_FIELD',
      message: 'File name is required.',
    });
  } else {
    const trimmed = fileName.trim();
    if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
      errors.push({
        field: 'body.fileName',
        code: 'ERR_INVALID_FILENAME',
        message: 'File name must not contain directory traversal characters (/ or \\ or ..).',
      });
    }

    const ext = path.extname(trimmed).toLowerCase();
    if (PROHIBITED_EXTENSIONS.has(ext)) {
      errors.push({
        field: 'body.fileName',
        code: 'ERR_PROHIBITED_EXTENSION',
        message: `File extension "${ext}" is strictly prohibited for security reasons.`,
      });
    }
  }

  // 2. MIME type whitelist verification
  if (!mimeType || typeof mimeType !== 'string' || mimeType.trim() === '') {
    errors.push({
      field: 'body.mimeType',
      code: 'ERR_REQUIRED_FIELD',
      message: 'MIME type is required.',
    });
  } else {
    const normalizedMime = mimeType.trim().toLowerCase();
    const mimeDef = MIME_TYPE_WHITELIST[normalizedMime];
    if (!mimeDef) {
      errors.push({
        field: 'body.mimeType',
        code: 'ERR_UNSUPPORTED_MIME_TYPE',
        message: `MIME type "${mimeType}" is not supported. Allowed types: ${Object.keys(
          MIME_TYPE_WHITELIST
        ).join(', ')}.`,
      });
    } else if (fileName && typeof fileName === 'string') {
      const ext = path.extname(fileName.trim()).toLowerCase();
      if (ext && !mimeDef.extensions.includes(ext)) {
        errors.push({
          field: 'body.mimeType',
          code: 'ERR_MIME_EXTENSION_MISMATCH',
          message: `File extension "${ext}" does not match declared MIME type "${normalizedMime}".`,
        });
      }
    }
  }

  // 3. File size verification
  if (fileSizeBytes === undefined || fileSizeBytes === null || typeof fileSizeBytes !== 'number') {
    errors.push({
      field: 'body.fileSizeBytes',
      code: 'ERR_REQUIRED_FIELD',
      message: 'File size in bytes is required.',
    });
  } else if (fileSizeBytes <= 0) {
    errors.push({
      field: 'body.fileSizeBytes',
      code: 'ERR_INVALID_SIZE',
      message: 'File size must be greater than zero bytes.',
    });
  } else {
    // Resolve applicable limit
    const normalizedMime = mimeType && typeof mimeType === 'string' ? mimeType.trim().toLowerCase() : '';
    const mimeDef = MIME_TYPE_WHITELIST[normalizedMime];
    const resolvedAssetType = (assetType || mimeDef?.assetType || 'image') as keyof typeof FILE_SIZE_LIMITS;
    const maxLimit = FILE_SIZE_LIMITS[resolvedAssetType] || FILE_SIZE_LIMITS.image;

    // Check user role: public citizen avatar restriction
    const roles: string[] = req.user?.roles || [];
    const isCitizenOnly =
      roles.length === 1 &&
      roles[0]?.toLowerCase().replace(/^role_/, '') === 'public_user';

    if (isCitizenOnly && fileSizeBytes > AVATAR_SIZE_LIMIT) {
      errors.push({
        field: 'body.fileSizeBytes',
        code: 'ERR_SIZE_EXCEEDED',
        message: `Public user avatar size exceeds maximum allowable limit of ${
          AVATAR_SIZE_LIMIT / (1024 * 1024)
        } MB.`,
      });
    } else if (fileSizeBytes > maxLimit) {
      errors.push({
        field: 'body.fileSizeBytes',
        code: 'ERR_SIZE_EXCEEDED',
        message: `File size exceeds maximum allowable limit of ${
          maxLimit / (1024 * 1024)
        } MB for ${resolvedAssetType}.`,
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Media upload request validation failed.', errors));
  }

  next();
}

/**
 * Validates upload confirmation request (MED-02)
 */
export function validateConfirmUpload(req: Request, _res: Response, next: NextFunction): void {
  const { mediaId, checksumSha256 } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!mediaId || typeof mediaId !== 'string' || mediaId.trim() === '') {
    errors.push({
      field: 'body.mediaId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'mediaId is required.',
    });
  } else if (!UUID_REGEX.test(mediaId.trim()) && !ID_REGEX.test(mediaId.trim())) {
    errors.push({
      field: 'body.mediaId',
      code: 'ERR_INVALID_MEDIA_ID',
      message: 'mediaId must be a valid UUID.',
    });
  }

  if (checksumSha256 !== undefined && checksumSha256 !== null) {
    if (typeof checksumSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(checksumSha256.trim())) {
      errors.push({
        field: 'body.checksumSha256',
        code: 'ERR_INVALID_CHECKSUM',
        message: 'checksumSha256 must be a valid 64-character hexadecimal SHA-256 hash.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Upload confirmation validation failed.', errors));
  }

  next();
}

/**
 * Validates direct media upload (MED-01 / direct binary upload)
 */
export function validateDirectUpload(req: Request, _res: Response, next: NextFunction): void {
  const { fileName, mimeType, fileBuffer } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
    errors.push({
      field: 'body.fileName',
      code: 'ERR_REQUIRED_FIELD',
      message: 'fileName is required.',
    });
  }

  if (!mimeType || typeof mimeType !== 'string' || mimeType.trim() === '') {
    errors.push({
      field: 'body.mimeType',
      code: 'ERR_REQUIRED_FIELD',
      message: 'mimeType is required.',
    });
  } else if (!MIME_TYPE_WHITELIST[mimeType.trim().toLowerCase()]) {
    errors.push({
      field: 'body.mimeType',
      code: 'ERR_UNSUPPORTED_MIME_TYPE',
      message: `MIME type "${mimeType}" is not permitted.`,
    });
  }

  // Check buffer
  let buf: Buffer | null = null;
  if (fileBuffer) {
    if (Buffer.isBuffer(fileBuffer)) {
      buf = fileBuffer;
    } else if (typeof fileBuffer === 'string') {
      buf = Buffer.from(fileBuffer, 'base64');
    }
  }

  if (!buf || buf.length === 0) {
    errors.push({
      field: 'body.fileBuffer',
      code: 'ERR_EMPTY_FILE',
      message: 'File buffer cannot be empty.',
    });
  } else if (mimeType && typeof mimeType === 'string') {
    const magicCheck = verifyMagicBytes(buf, mimeType.trim().toLowerCase());
    if (!magicCheck.isValid) {
      errors.push({
        field: 'body.fileBuffer',
        code: 'ERR_MAGIC_BYTE_MISMATCH',
        message: magicCheck.error || 'File binary signature does not match declared MIME type.',
      });
    }
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Direct upload validation failed.', errors));
  }

  next();
}

/**
 * Validates URL identifier parameter (MED-03, MED-04)
 */
export function validateMediaIdParam(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params;
  if (!id || (typeof id === 'string' && !UUID_REGEX.test(id.trim()) && !ID_REGEX.test(id.trim()))) {
    return next(
      AppError.validationFailed(`Invalid media identifier "${id}". Must be a valid UUID.`)
    );
  }
  next();
}

/**
 * Validates article-media attachment request
 */
export function validateArticleAttachment(req: Request, _res: Response, next: NextFunction): void {
  const { articleId, mediaId } = req.body || {};
  const errors: ApiErrorDetail[] = [];

  if (!articleId || typeof articleId !== 'string' || articleId.trim() === '') {
    errors.push({
      field: 'body.articleId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'articleId is required.',
    });
  }

  if (!mediaId || typeof mediaId !== 'string' || mediaId.trim() === '') {
    errors.push({
      field: 'body.mediaId',
      code: 'ERR_REQUIRED_FIELD',
      message: 'mediaId is required.',
    });
  }

  if (errors.length > 0) {
    return next(AppError.validationFailed('Article media attachment validation failed.', errors));
  }

  next();
}

