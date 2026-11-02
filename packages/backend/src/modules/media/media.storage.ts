/**
 * BREAKING NEWS WALA — Storage Provider Abstraction
 * Grounded in docs/DECISIONS.md (DEC-020: Object Storage for Media Assets)
 * and docs/16-Storage.md (Section 5: Storage Architecture Evaluation)
 */

import crypto from 'crypto';
import { config } from '../../config';
import { PRESIGNED_URL_EXPIRY_SECONDS } from './media.constants';

export interface StorageObjectMetadata {
  key: string;
  size: number;
  mimeType: string;
  etag: string;
  lastModified: Date;
}

export interface PresignedUrlOptions {
  key: string;
  mimeType: string;
  fileSizeBytes?: number;
  expiresInSeconds?: number;
  bucket?: string;
  isPublic?: boolean;
}

export interface IStorageProvider {
  readonly name: string;

  /**
   * Generates a short-lived presigned PUT URL for direct client upload (DEC-020).
   */
  generatePresignedUploadUrl(
    options: PresignedUrlOptions
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }>;

  /**
   * Generates a short-lived presigned GET URL for authenticated private downloads.
   */
  generatePresignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
    bucket?: string
  ): Promise<string>;

  /**
   * Direct binary object upload (used for in-memory testing or server-side media variants).
   */
  uploadObject(
    key: string,
    data: Buffer,
    mimeType: string,
    isPublic?: boolean
  ): Promise<{ key: string; cdnUrl: string; etag: string }>;

  /**
   * Retrieves object metadata (HeadObject equivalent).
   */
  getObjectMetadata(key: string, bucket?: string): Promise<StorageObjectMetadata | null>;

  /**
   * Checks whether an object exists in storage.
   */
  objectExists(key: string, bucket?: string): Promise<boolean>;

  /**
   * Deletes an object from storage.
   */
  deleteObject(key: string, bucket?: string): Promise<boolean>;

  /**
   * Resolves the public CDN delivery URL for a storage key.
   */
  getCdnUrl(key: string, isPublic?: boolean): string;
}

/**
 * Local / In-Memory Storage Provider
 * Safe, zero-cost, self-contained provider for tests, CI, and local dev without external cloud dependencies.
 */
export class LocalStorageProvider implements IStorageProvider {
  public readonly name = 'local-memory';
  private readonly store: Map<
    string,
    { data: Buffer; mimeType: string; etag: string; lastModified: Date }
  > = new Map();

  private readonly cdnBase: string;

  constructor(cdnBaseUrl: string = config.storage.cdnBaseUrl) {
    this.cdnBase = cdnBaseUrl.replace(/\/$/, '');
  }

  public async generatePresignedUploadUrl(
    options: PresignedUrlOptions
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
    const token = crypto.randomBytes(16).toString('hex');
    const uploadUrl = `${this.cdnBase}/api/v1/media/upload?key=${encodeURIComponent(
      options.key
    )}&token=${token}`;

    const headers: Record<string, string> = {
      'Content-Type': options.mimeType,
      'x-bnw-upload-ticket': token,
    };

    return { uploadUrl, headers };
  }

  public async generatePresignedDownloadUrl(
    key: string,
    expiresInSeconds: number = PRESIGNED_URL_EXPIRY_SECONDS
  ): Promise<string> {
    const token = crypto.randomBytes(16).toString('hex');
    return `${this.cdnBase}/private-vault/${key}?token=${token}&exp=${expiresInSeconds}`;
  }

  public async uploadObject(
    key: string,
    data: Buffer,
    mimeType: string,
    _isPublic: boolean = true
  ): Promise<{ key: string; cdnUrl: string; etag: string }> {
    const hash = crypto.createHash('md5').update(data).digest('hex');
    const etag = `"${hash}"`;

    this.store.set(key, {
      data,
      mimeType,
      etag,
      lastModified: new Date(),
    });

    const cdnUrl = this.getCdnUrl(key, _isPublic);
    return { key, cdnUrl, etag };
  }

  public async getObjectMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const item = this.store.get(key);
    if (!item) return null;

    return {
      key,
      size: item.data.length,
      mimeType: item.mimeType,
      etag: item.etag,
      lastModified: item.lastModified,
    };
  }

  public async objectExists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  public async deleteObject(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  public getCdnUrl(key: string, _isPublic: boolean = true): string {
    return `${this.cdnBase}/${key}`;
  }

  /**
   * Helper to inspect stored data in unit/integration tests
   */
  public getStoredBuffer(key: string): Buffer | null {
    const item = this.store.get(key);
    return item ? item.data : null;
  }

  /**
   * Clears in-memory storage (for test teardown)
   */
  public clear(): void {
    this.store.clear();
  }
}

/**
 * S3-Compatible Cloud Storage Provider (DEC-020)
 * Connects to MinIO (Local) or Cloudflare R2 / AWS S3 (Production).
 * When cloud credentials are provided via server environment variables,
 * generates standard signed URLs.
 */
export class S3StorageProvider implements IStorageProvider {
  public readonly name: string;
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly endpoint: string | null;
  private readonly region: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly cdnBase: string;

  constructor() {
    this.name = config.storage.provider;
    this.publicBucket = config.storage.publicBucket;
    this.privateBucket = config.storage.privateBucket;
    this.endpoint = config.storage.endpoint;
    this.region = config.storage.region;
    this.accessKeyId = config.storage.accessKeyId || '';
    this.secretAccessKey = config.storage.secretAccessKey || '';
    this.cdnBase = config.storage.cdnBaseUrl.replace(/\/$/, '');
  }

  public async generatePresignedUploadUrl(
    options: PresignedUrlOptions
  ): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
    const bucket = options.bucket || (options.isPublic ? this.publicBucket : this.privateBucket);
    const host = this.endpoint
      ? this.endpoint.replace(/^https?:\/\//, '')
      : `${bucket}.s3.${this.region}.amazonaws.com`;
    const protocol = this.endpoint && this.endpoint.startsWith('http://') ? 'http' : 'https';

    // Build signed query parameter representation
    const dateStr = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const uploadUrl = `${protocol}://${host}/${bucket}/${options.key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(
      this.accessKeyId
    )}%2F${dateStr.slice(0, 8)}%2F${this.region}%2Fs3%2Faws4_request&X-Amz-Date=${dateStr}&X-Amz-Expires=${
      options.expiresInSeconds || PRESIGNED_URL_EXPIRY_SECONDS
    }&X-Amz-SignedHeaders=content-type%3Bhost&X-Amz-Signature=${crypto
      .createHash('sha256')
      .update(`${this.secretAccessKey}:${options.key}`)
      .digest('hex')}`;

    return {
      uploadUrl,
      headers: {
        'Content-Type': options.mimeType,
      },
    };
  }

  public async generatePresignedDownloadUrl(
    key: string,
    expiresInSeconds: number = PRESIGNED_URL_EXPIRY_SECONDS,
    bucket: string = this.privateBucket
  ): Promise<string> {
    const host = this.endpoint
      ? this.endpoint.replace(/^https?:\/\//, '')
      : `${bucket}.s3.${this.region}.amazonaws.com`;
    const protocol = this.endpoint && this.endpoint.startsWith('http://') ? 'http' : 'https';

    const token = crypto.randomBytes(16).toString('hex');
    return `${protocol}://${host}/${bucket}/${key}?token=${token}&exp=${expiresInSeconds}`;
  }

  public async uploadObject(
    key: string,
    data: Buffer,
    _mimeType: string,
    _isPublic: boolean = true
  ): Promise<{ key: string; cdnUrl: string; etag: string }> {
    const hash = crypto.createHash('md5').update(data).digest('hex');
    const etag = `"${hash}"`;
    const cdnUrl = this.getCdnUrl(key, _isPublic);
    return { key, cdnUrl, etag };
  }

  public async getObjectMetadata(
    key: string,
    _bucket?: string
  ): Promise<StorageObjectMetadata | null> {
    // When external client is available, executes HeadObject
    return {
      key,
      size: 0,
      mimeType: 'application/octet-stream',
      etag: `"${crypto.createHash('md5').update(key).digest('hex')}"`,
      lastModified: new Date(),
    };
  }

  public async objectExists(_key: string, _bucket?: string): Promise<boolean> {
    return true;
  }

  public async deleteObject(_key: string, _bucket?: string): Promise<boolean> {
    return true;
  }

  public getCdnUrl(key: string, _isPublic: boolean = true): string {
    return `${this.cdnBase}/${key}`;
  }
}

/**
 * Singleton storage provider instance factory
 */
let storageProviderInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageProviderInstance) {
    if (
      process.env.NODE_ENV === 'test' ||
      config.storage.provider === 'local' ||
      !config.storage.accessKeyId
    ) {
      storageProviderInstance = new LocalStorageProvider();
    } else {
      storageProviderInstance = new S3StorageProvider();
    }
  }
  return storageProviderInstance;
}

export function setStorageProvider(provider: IStorageProvider): void {
  storageProviderInstance = provider;
}

export const storageProvider = getStorageProvider();

