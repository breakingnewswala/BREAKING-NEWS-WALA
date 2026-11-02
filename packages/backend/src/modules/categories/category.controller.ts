/**
 * BREAKING NEWS WALA — Category Controller
 * Grounded in docs/13-API.md (Section 1.3: Standard Response Envelopes, PUB-07)
 * Handles HTTP request validation, parameter resolution, and formatted API responses.
 */

import { Request, Response, NextFunction } from 'express';
import { CategoryService, categoryService } from './category.service';

export class CategoryController {
  constructor(private readonly service: CategoryService = categoryService) {}

  /**
   * GET /api/v1/categories/overview
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
   * GET /api/v1/public/categories (Canonical PUB-07 Alias)
   */
  public getPublicCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const overview = await this.service.getOverview();
      res.apiSuccess(overview.categories);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/categories
   */
  public getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, search, status, parentId, includeSubcategories, sortBy, sortOrder } =
        req.query as Record<string, string>;

      const result = await this.service.getCategories({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search,
        status: status as any,
        parentId,
        includeSubcategories: includeSubcategories === 'true',
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.apiSuccess(result.items, { pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/categories/:idOrSlug
   */
  public getCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.getCategoryBySlugOrId(req.params.idOrSlug as string);
      res.apiSuccess(category);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/categories/:idOrSlug/subcategories
   */
  public getSubcategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subcategories = await this.service.getSubcategories(req.params.idOrSlug as string);
      res.apiSuccess(subcategories);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/categories/validate-taxonomy
   */
  public validateTaxonomy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { primaryCategoryId, subcategoryId } = req.body;
      const result = await this.service.validateArticleTaxonomy(primaryCategoryId, subcategoryId);
      res.apiSuccess(result);
    } catch (err) {
      next(err);
    }
  };
}

export const categoryController = new CategoryController();

