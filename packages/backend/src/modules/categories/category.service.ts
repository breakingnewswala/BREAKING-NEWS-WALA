/**
 * BREAKING NEWS WALA — Master News Category Service
 * Grounded in docs/06-Business-Rules.md (RULE-CAT-001 through RULE-CAT-006)
 * and docs/13-API.md (PUB-07, ADM-11, ADM-12)
 */

import { AppError } from '../../errors/app-error';
import { ICategoryRepository, categoryRepository } from './category.repository';
import {
  ArticleTaxonomyValidationResult,
  CategoryEntity,
  CategoryFilterParams,
  CategoryOverview,
  CategorySummary,
  PaginatedResult,
} from './types';

export class CategoryService {
  constructor(private readonly repo: ICategoryRepository = categoryRepository) {}

  /**
   * Retrieves high-level category registry overview.
   * Grounded in PRD Section 21.1 & RULE-CAT-001: 21 Canonical Categories.
   */
  public async getOverview(): Promise<CategoryOverview> {
    return this.repo.getOverview();
  }

  /**
   * Retrieves paginated list of categories with optional search, status filtering, and sorting.
   */
  public async getCategories(params: CategoryFilterParams): Promise<PaginatedResult<CategorySummary>> {
    return this.repo.findCategories(params);
  }

  /**
   * Retrieves a single category by UUID or canonical slug.
   * Throws HTTP 404 AppError if not found.
   */
  public async getCategoryBySlugOrId(idOrSlug: string): Promise<CategoryEntity> {
    const category = await this.repo.findCategoryByIdOrSlug(idOrSlug, true);
    if (!category) {
      throw AppError.notFound(`Category "${idOrSlug}" not found in category registry.`);
    }
    return category;
  }

  /**
   * Retrieves child subcategories of a category identified by UUID or slug.
   * Throws HTTP 404 AppError if the parent category does not exist.
   */
  public async getSubcategories(parentIdOrSlug: string): Promise<CategoryEntity[]> {
    const parent = await this.repo.findCategoryByIdOrSlug(parentIdOrSlug, false);
    if (!parent) {
      throw AppError.notFound(`Category "${parentIdOrSlug}" not found in category registry.`);
    }
    return this.repo.findSubcategories(parentIdOrSlug);
  }

  /**
   * Validates article taxonomy binding (Article -> Primary Category -> Subcategory).
   * Enforces RULE-CAT-004 (Two-tier constraint) and relational integrity.
   */
  public async validateArticleTaxonomy(
    primaryCategoryId: string,
    subcategoryId?: string | null
  ): Promise<ArticleTaxonomyValidationResult> {
    return this.repo.validateTaxonomy(primaryCategoryId, subcategoryId);
  }
}

export const categoryService = new CategoryService();

