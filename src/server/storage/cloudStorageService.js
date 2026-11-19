/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Production Cloud Storage Service
 * 
 * Manages media uploads, broadsheet PDFs, reporter credentials, and social cards
 * using Firebase Admin SDK (Cloud Storage) with transparent local development fallback.
 * 
 * Grounded in docs/11-Architecture.md, docs/16-Storage.md, and storage.rules v2.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import firebaseConfig from '../../../firebase-applet-config.json' with { type: 'json' };

const BUCKET_NAME = firebaseConfig.storageBucket || 'breaking-news-wala.firebasestorage.app';

export class CloudStorageService {
  constructor() {
    this.bucketName = BUCKET_NAME;
    this._bucket = null;
    this._initialized = false;
    this.localUploadDir = path.resolve(process.cwd(), 'dist', 'media', 'uploads');
  }

  getBucket() {
    if (this._bucket) return this._bucket;

    try {
      if (getApps().length === 0) {
        initializeApp({
          projectId: firebaseConfig.projectId,
          storageBucket: this.bucketName,
        });
      }
      this._bucket = getStorage().bucket(this.bucketName);
      this._initialized = true;
      return this._bucket;
    } catch (err) {
      // Cloud Storage Admin credentials not ambiently available; local disk fallback active
      this._initialized = false;
      return null;
    }
  }

  /**
   * Generates a deterministic, tenant-safe storage path for an asset based on category
   */
  generateStoragePath({ category = 'article', userId, editionId, fileName }) {
    const safeName = path.basename(fileName || `media_${Date.now()}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const assetId = `med-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    switch (category) {
      case 'avatar':
        return {
          assetId,
          fileName: safeName,
          storagePath: `avatars/${userId || 'unknown'}/${assetId}-${safeName}`,
          isPublic: true,
        };
      case 'credentials':
        return {
          assetId,
          fileName: safeName,
          storagePath: `reporters/${userId || 'unknown'}/credentials/${assetId}-${safeName}`,
          isPublic: false,
        };
      case 'epaper':
        return {
          assetId,
          fileName: safeName,
          storagePath: `epaper/${editionId || 'drafts'}/${assetId}-${safeName}`,
          isPublic: false,
        };
      case 'whatsapp':
        return {
          assetId,
          fileName: safeName,
          storagePath: `whatsapp/${userId || 'unknown'}/${assetId}-${safeName}`,
          isPublic: false,
        };
      case 'ads':
        return {
          assetId,
          fileName: safeName,
          storagePath: `ads/${year}/${month}/${assetId}-${safeName}`,
          isPublic: true,
        };
      case 'article':
      default:
        return {
          assetId,
          fileName: safeName,
          storagePath: `media/articles/${year}/${month}/${assetId}/${safeName}`,
          isPublic: true,
        };
    }
  }

  /**
   * Probes live GCS bucket connectivity
   */
  async checkConnectivity() {
    const bucket = this.getBucket();
    if (!bucket) {
      return { connected: false, reason: 'Bucket not initialized (credentials unavailable)' };
    }
    try {
      const [exists] = await bucket.exists();
      return { connected: exists, bucket: this.bucketName };
    } catch (err) {
      return { connected: false, error: err.message, code: err.code };
    }
  }

  /**
   * Uploads binary buffer to Cloud Storage or local disk fallback.
   * In production (NODE_ENV === 'production'), enforces strict fail-closed policy.
   */
  async uploadFile({ buffer, storagePath, mimeType, isPublic = false }) {
    const isProduction = process.env.NODE_ENV === 'production';
    const bucket = this.getBucket();

    // 1. Attempt Cloud Storage Bucket upload if available
    if (bucket) {
      try {
        const file = bucket.file(storagePath);
        await file.save(buffer, {
          metadata: {
            contentType: mimeType,
            metadata: {
              uploadedAt: new Date().toISOString(),
              isPublic: String(isPublic),
            },
          },
          resumable: false,
        });

        if (isPublic) {
          try {
            await file.makePublic();
          } catch {}
        }

        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${storagePath}`;
        return {
          success: true,
          storageType: 'gcs',
          storagePath,
          url: publicUrl,
          bucket: this.bucketName,
        };
      } catch (gcsErr) {
        if (isProduction) {
          throw new Error(`[CloudStorageService] Production GCS upload failed (fail-closed enforced): ${gcsErr.message}`);
        }
        // Fall back to local storage if bucket upload encounters auth/network issue in dev
      }
    } else if (isProduction) {
      throw new Error(`[CloudStorageService] Production GCS bucket unavailable (fail-closed enforced). Check service account credentials and bucket "${this.bucketName}".`);
    }

    // 2. Safe local disk fallback (retaining full dev & test compatibility)
    try {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
      const diskFileName = storagePath.replace(/\//g, '_');
      const localFilePath = path.join(this.localUploadDir, diskFileName);
      fs.writeFileSync(localFilePath, buffer);

      return {
        success: true,
        storageType: 'local_disk',
        storagePath,
        url: `/media/uploads/${diskFileName}`,
        localPath: localFilePath,
      };
    } catch (diskErr) {
      throw new Error(`Failed to save file to local fallback: ${diskErr.message}`);
    }
  }

  /**
   * Generates a signed V4 upload URL or authorized backend upload path
   */
  async generatePresignedUploadUrl({ storagePath, mimeType, expiresInMinutes = 60 }) {
    const bucket = this.getBucket();

    if (bucket) {
      try {
        const file = bucket.file(storagePath);
        const [signedUrl] = await file.getSignedUrl({
          version: 'v4',
          action: 'write',
          expires: Date.now() + expiresInMinutes * 60 * 1000,
          contentType: mimeType,
        });

        return {
          uploadUrl: signedUrl,
          storagePath,
          provider: 'gcs_v4_signed',
          expiresInSeconds: expiresInMinutes * 60,
          headers: {
            'Content-Type': mimeType,
          },
        };
      } catch (signedErr) {
        // Service account key not present for V4 sign; return authorized backend upload route
      }
    }

    // Direct backend upload route with server authentication
    return {
      uploadUrl: `/api/v1/media/upload?storagePath=${encodeURIComponent(storagePath)}`,
      storagePath,
      provider: 'backend_mediated',
      expiresInSeconds: expiresInMinutes * 60,
      headers: {
        'Content-Type': mimeType,
      },
    };
  }

  /**
   * Retrieves file buffer from GCS or local disk with permission awareness
   */
  async getFileBuffer(storagePath) {
    const bucket = this.getBucket();

    if (bucket) {
      try {
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (exists) {
          const [buffer] = await file.download();
          const [metadata] = await file.getMetadata();
          return {
            buffer,
            contentType: metadata.contentType || 'application/octet-stream',
            size: buffer.length,
          };
        }
      } catch {}
    }

    // Local disk lookup
    const diskFileName = storagePath.replace(/\//g, '_');
    const localFilePath = path.join(this.localUploadDir, diskFileName);
    if (fs.existsSync(localFilePath)) {
      const buffer = fs.readFileSync(localFilePath);
      return {
        buffer,
        contentType: 'application/octet-stream',
        size: buffer.length,
      };
    }

    return null;
  }
}

export const defaultCloudStorageService = new CloudStorageService();
