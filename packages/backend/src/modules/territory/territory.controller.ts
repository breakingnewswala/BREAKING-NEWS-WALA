/**
 * BREAKING NEWS WALA — Territory Controller
 * Grounded in docs/13-API.md (Section 1.3: Standard Response Envelopes, PUB-08)
 * Handles HTTP request validation, parameter resolution, and formatted API responses.
 */

import { Request, Response, NextFunction } from 'express';
import { TerritoryService, territoryService } from './territory.service';
import { AppError } from '../../errors/app-error';

export class TerritoryController {
  constructor(private readonly service: TerritoryService = territoryService) {}

  /**
   * GET /api/v1/territory/overview
   */
  public getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await this.service.getOverview();
      res.apiSuccess(overview);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/states
   */
  public getStates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, status } = req.query as Record<string, string>;
      const result = await this.service.getStates({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        status: status as any,
      });

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/states/:idOrSlug
   */
  public getState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = await this.service.getStateBySlugOrId(req.params.idOrSlug as string);
      res.apiSuccess(state);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/divisions
   */
  public getDivisions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { stateId, stateSlug, stateCode, search, status, includeDistricts, page, limit } =
        req.query as Record<string, string>;

      const result = await this.service.getDivisions({
        stateId,
        stateSlug,
        stateCode,
        search,
        status: status as any,
        includeDistricts: includeDistricts === 'true',
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/divisions/:idOrSlug
   */
  public getDivision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const includeDistricts = req.query.includeDistricts !== 'false';
      const division = await this.service.getDivisionBySlugOrId(req.params.idOrSlug as string, includeDistricts);
      res.apiSuccess(division);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/districts
   */
  public getDistricts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { divisionId, divisionSlug, stateId, stateSlug, stateCode, search, status, sortBy, sortOrder, page, limit } =
        req.query as Record<string, string>;

      const result = await this.service.getDistricts({
        divisionId,
        divisionSlug,
        stateId,
        stateSlug,
        stateCode,
        search,
        status: status as any,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/districts/:idOrSlug
   */
  public getDistrict = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const district = await this.service.getDistrictBySlugOrId(req.params.idOrSlug as string);
      res.apiSuccess(district);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/territory/my-assignments
   * Authenticated endpoint for reporters to view their assigned beats/territories.
   */
  public getMyAssignments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw AppError.unauthorized('Authentication required to view territory assignments.');
      }

      const assignments = await this.service.getReporterAssignments(userId);
      res.apiSuccess({ assignments });
    } catch (err) {
      next(err);
    }
  };
}

export const territoryController = new TerritoryController();
