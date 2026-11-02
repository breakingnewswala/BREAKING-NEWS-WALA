/**
 * BREAKING NEWS WALA — Media Controller
 * Grounded in docs/13-API.md (MED-01 through MED-04) and docs/DECISIONS.md (DEC-026)
 * Handles HTTP parsing, parameter resolution, authorization context, and standard response envelopes.
 */

import { Request, Response, NextFunction } from 'express';
import { MediaService, mediaService } from './media.service';

export class MediaController {
  constructor(private readonly service: MediaService = mediaService) {}

  /**
   * POST /api/v1/media/presigned-upload
   * (MED-01: Generates short-lived presigned PUT URL)
   */
  public createPresignedUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const result = await this.service.createPresignedUpload(userId, userRoles, req.body);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/media/confirm-upload
   * (MED-02: Confirms upload completion, validates file in storage, creates variants)
   */
  public confirmUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const asset = await this.service.confirmUpload(userId, userRoles, req.body);
      res.apiSuccess(asset);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/media/upload
   * (Direct binary/multipart upload with server-side magic byte inspection)
   */
  public uploadDirect = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const { fileName, mimeType, fileBuffer, assetType, altTextHi } = req.body || {};

      let buffer: Buffer;
      if (Buffer.isBuffer(fileBuffer)) {
        buffer = fileBuffer;
      } else if (typeof fileBuffer === 'string') {
        buffer = Buffer.from(fileBuffer, 'base64');
      } else {
        buffer = Buffer.alloc(0);
      }

      const asset = await this.service.uploadMediaDirect(userId, userRoles, {
        fileName,
        mimeType,
        fileBuffer: buffer,
        assetType,
        altTextHi,
        uploadedBy: userId,
      });

      res.apiSuccess(asset);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/media/:id
   * (MED-03: Retrieves media asset metadata and CDN URL)
   */
  public getMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const asset = await this.service.getMediaById(req.params.id as string, userId, userRoles);
      res.apiSuccess(asset);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/media
   * (Lists media assets with filtering and pagination)
   */
  public listMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRoles = req.user?.roles || [];
      const { page, limit, fileType, uploadedBy, search, sortBy, sortOrder } =
        req.query as Record<string, string>;

      const result = await this.service.listMedia(
        {
          page: page ? parseInt(page, 10) : undefined,
          limit: limit ? parseInt(limit, 10) : undefined,
          fileType,
          uploadedBy,
          search,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
        },
        userId,
        userRoles
      );

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/media/:id
   * (MED-04: Soft/hard delete media asset with relational integrity safeguards)
   */
  public deleteMedia = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      await this.service.deleteMedia(req.params.id as string, userId, userRoles);
      res.apiSuccess({ deleted: true, mediaId: req.params.id });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/media/attach-article
   * (Attaches media to a news article draft)
   */
  public attachToArticle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const result = await this.service.attachToArticle(userId, userRoles, req.body);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/media/detach-article
   * (Detaches media from a news article)
   */
  public detachFromArticle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRoles = req.user!.roles;
      const { articleId, mediaId } = req.body || {};
      const result = await this.service.detachFromArticle(userId, userRoles, articleId, mediaId);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };
}

export const mediaController = new MediaController();

