/**
 * BREAKING NEWS WALA — Category Repository Boundary
 * Grounded in docs/06-Business-Rules.md (RULE-CAT-001 through RULE-CAT-006) and docs/12-Database.md
 * Encapsulates database operations for Category entity and taxonomy validations.
 */

import { getPrismaClient } from '../../db/client';
import { CANONICAL_CATEGORIES_DATA } from './category-data';
import {
  ArticleTaxonomyValidationResult,
  CategoryEntity,
  CategoryFilterParams,
  CategoryOverview,
  CategorySummary,
  PaginatedResult,
  SubcategorySummary,
} from './types';
import { AppError } from '../../errors/app-error';

export interface ICategoryRepository {
  getOverview(): Promise<CategoryOverview>;
  findCategories(params: CategoryFilterParams): Promise<PaginatedResult<CategorySummary>>;
  findCategoryByIdOrSlug(idOrSlug: string, includeChildren?: boolean): Promise<CategoryEntity | null>;
  findSubcategories(parentIdOrSlug: string): Promise<CategoryEntity[]>;
  validateTaxonomy(primaryCategoryId: string, subcategoryId?: string | null): Promise<ArticleTaxonomyValidationResult>;
}

export class PrismaCategoryRepository implements ICategoryRepository {
  private get prisma() {
    return getPrismaClient();
  }

  public async getOverview(): Promise<CategoryOverview> {
    const parentCategories = await this.prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
        deletedAt: null,
      },
      include: {
        children: {
          where: { isActive: true, deletedAt: null },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const totalCategories = parentCategories.length;
    let totalSubcategories = 0;

    const categories: CategorySummary[] = parentCategories.map((c: any) => {
      const subcategories: SubcategorySummary[] = (c.children || []).map((ch: any) => ({
        id: ch.id,
        nameHi: ch.nameHi,
        nameEn: ch.nameEn,
        slug: ch.slug,
        description: ch.description,
        iconToken: ch.description?.match(/\[icon:([^\]]+)\]/)?.[1] || 'tag',
        parentId: ch.parentId!,
        displayOrder: ch.displayOrder,
        isActive: ch.isActive,
      }));

      totalSubcategories += subcategories.length;

      return {
        id: c.id,
        nameHi: c.nameHi,
        nameEn: c.nameEn,
        slug: c.slug,
        description: c.description,
        iconToken: c.description?.match(/\[icon:([^\]]+)\]/)?.[1] || 'folder',
        parentId: null,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
        subcategoriesCount: subcategories.length,
        subcategories,
      };
    });

    return {
      totalCategories,
      totalSubcategories,
      activeCategoriesCount: totalCategories,
      categories,
    };
  }

  public async findCategories(params: CategoryFilterParams): Promise<PaginatedResult<CategorySummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.status === 'active') {
      where.isActive = true;
    } else if (params.status === 'inactive') {
      where.isActive = false;
    }

    if (params.parentId === 'null' || params.parentId === 'none') {
      where.parentId = null;
    } else if (params.parentId) {
      where.parentId = params.parentId;
    }

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { nameHi: { contains: term, mode: 'insensitive' } },
        { nameEn: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    const sortField = params.sortBy || 'displayOrder';
    const sortDirection = params.sortOrder === 'desc' ? 'desc' : 'asc';
    orderBy[sortField] = sortDirection;

    const [total, records] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        include: params.includeSubcategories
          ? {
              children: {
                where: { deletedAt: null },
                orderBy: { displayOrder: 'asc' },
              },
            }
          : undefined,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const items: CategorySummary[] = records.map((c: any) => ({
      id: c.id,
      nameHi: c.nameHi,
      nameEn: c.nameEn,
      slug: c.slug,
      description: c.description,
      iconToken: c.description?.match(/\[icon:([^\]]+)\]/)?.[1] || 'folder',
      parentId: c.parentId,
      displayOrder: c.displayOrder,
      isActive: c.isActive,
      subcategoriesCount: c.children ? c.children.length : undefined,
      subcategories: c.children
        ? c.children.map((ch: any) => ({
            id: ch.id,
            nameHi: ch.nameHi,
            nameEn: ch.nameEn,
            slug: ch.slug,
            description: ch.description,
            iconToken: ch.description?.match(/\[icon:([^\]]+)\]/)?.[1] || 'tag',
            parentId: ch.parentId!,
            displayOrder: ch.displayOrder,
            isActive: ch.isActive,
          }))
        : undefined,
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async findCategoryByIdOrSlug(idOrSlug: string, includeChildren: boolean = true): Promise<CategoryEntity | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where: any = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

    const record = await this.prisma.category.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        parent: true,
        children: includeChildren
          ? {
              where: { deletedAt: null },
              orderBy: { displayOrder: 'asc' },
            }
          : false,
      },
    });

    if (!record) return null;

    return this.mapPrismaToEntity(record);
  }

  public async findSubcategories(parentIdOrSlug: string): Promise<CategoryEntity[]> {
    const parent = await this.findCategoryByIdOrSlug(parentIdOrSlug, false);
    if (!parent) return [];

    const records = await this.prisma.category.findMany({
      where: {
        parentId: parent.id,
        deletedAt: null,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return records.map((r: any) => this.mapPrismaToEntity(r));
  }

  public async validateTaxonomy(primaryCategoryId: string, subcategoryId?: string | null): Promise<ArticleTaxonomyValidationResult> {
    const primary = await this.findCategoryByIdOrSlug(primaryCategoryId, false);
    if (!primary) {
      throw AppError.notFound(`Primary category "${primaryCategoryId}" not found in category registry.`);
    }

    if (!primary.isActive) {
      throw AppError.validationFailed(`Primary category "${primary.nameHi}" (${primary.slug}) is currently inactive.`);
    }

    if (primary.parentId !== null) {
      throw AppError.validationFailed(
        `Category "${primary.nameHi}" (${primary.slug}) is a subcategory, not a primary tier-1 category (RULE-CAT-004 violation).`
      );
    }

    if (!subcategoryId) {
      return { valid: true, primaryCategory: primary };
    }

    const sub = await this.findCategoryByIdOrSlug(subcategoryId, false);
    if (!sub) {
      throw AppError.notFound(`Subcategory "${subcategoryId}" not found in category registry.`);
    }

    if (!sub.isActive) {
      throw AppError.validationFailed(`Subcategory "${sub.nameHi}" (${sub.slug}) is currently inactive.`);
    }

    if (sub.parentId !== primary.id) {
      throw AppError.validationFailed(
        `Subcategory "${sub.nameHi}" (${sub.slug}) belongs to parent "${sub.parentId}", not primary category "${primary.nameHi}" (${primary.id}).`
      );
    }

    return { valid: true, primaryCategory: primary, subcategory: sub };
  }

  private mapPrismaToEntity(record: any): CategoryEntity {
    return {
      id: record.id,
      nameHi: record.nameHi,
      nameEn: record.nameEn,
      slug: record.slug,
      description: record.description,
      iconToken: record.description?.match(/\[icon:([^\]]+)\]/)?.[1] || 'folder',
      iconMediaId: record.iconMediaId,
      parentId: record.parentId,
      displayOrder: record.displayOrder,
      isActive: record.isActive,
      createdAt: record.createdAt,
      deletedAt: record.deletedAt,
      parent: record.parent ? this.mapPrismaToEntity(record.parent) : null,
      children: record.children ? record.children.map((c: any) => this.mapPrismaToEntity(c)) : undefined,
    };
  }
}

/**
 * Deterministic UUID generator for in-memory mock repository.
 * Formats a consistent 36-char UUID string based on an index or prefix.
 */
function createDeterministicUuid(prefix: string, index: number): string {
  const hex = (index + 1).toString(16).padStart(4, '0');
  const cleanPrefix = prefix.replace(/[^a-f0-9]/gi, '').toLowerCase().padEnd(8, '0').slice(0, 8);
  return `${cleanPrefix}-0000-4000-8000-${hex.padStart(12, '0')}`;
}

export class InMemoryCategoryRepository implements ICategoryRepository {
  private categories: Map<string, CategoryEntity> = new Map();
  private slugToId: Map<string, string> = new Map();

  constructor() {
    this.seedFromCanonical();
  }

  private seedFromCanonical(): void {
    let parentIndex = 0;
    let childIndex = 0;

    for (const cat of CANONICAL_CATEGORIES_DATA) {
      const parentId = createDeterministicUuid(cat.slug, parentIndex++);
      const parentEntity: CategoryEntity = {
        id: parentId,
        nameHi: cat.nameHi,
        nameEn: cat.nameEn,
        slug: cat.slug,
        description: cat.description || null,
        iconToken: cat.iconToken,
        iconMediaId: null,
        parentId: null,
        displayOrder: cat.displayOrder,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        deletedAt: null,
        children: [],
      };

      this.categories.set(parentId, parentEntity);
      this.slugToId.set(cat.slug, parentId);

      for (const sub of cat.subcategories) {
        const childId = createDeterministicUuid(sub.slug, childIndex++);
        const childEntity: CategoryEntity = {
          id: childId,
          nameHi: sub.nameHi,
          nameEn: sub.nameEn,
          slug: sub.slug,
          description: sub.description || null,
          iconToken: sub.iconToken,
          iconMediaId: null,
          parentId: parentId,
          displayOrder: sub.displayOrder,
          isActive: true,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          deletedAt: null,
          parent: { ...parentEntity, children: undefined },
        };

        this.categories.set(childId, childEntity);
        this.slugToId.set(sub.slug, childId);
        parentEntity.children!.push(childEntity);
      }
    }
  }

  public async getOverview(): Promise<CategoryOverview> {
    const parentList: CategorySummary[] = [];
    let totalSubcategories = 0;

    for (const cat of this.categories.values()) {
      if (cat.parentId === null && cat.isActive && !cat.deletedAt) {
        const subcategories: SubcategorySummary[] = (cat.children || [])
          .filter((ch) => ch.isActive && !ch.deletedAt)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((ch) => ({
            id: ch.id,
            nameHi: ch.nameHi,
            nameEn: ch.nameEn,
            slug: ch.slug,
            description: ch.description,
            iconToken: ch.iconToken,
            parentId: ch.parentId!,
            displayOrder: ch.displayOrder,
            isActive: ch.isActive,
          }));

        totalSubcategories += subcategories.length;

        parentList.push({
          id: cat.id,
          nameHi: cat.nameHi,
          nameEn: cat.nameEn,
          slug: cat.slug,
          description: cat.description,
          iconToken: cat.iconToken,
          parentId: null,
          displayOrder: cat.displayOrder,
          isActive: cat.isActive,
          subcategoriesCount: subcategories.length,
          subcategories,
        });
      }
    }

    parentList.sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      totalCategories: parentList.length,
      totalSubcategories,
      activeCategoriesCount: parentList.length,
      categories: parentList,
    };
  }

  public async findCategories(params: CategoryFilterParams): Promise<PaginatedResult<CategorySummary>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));

    let all = Array.from(this.categories.values()).filter((c) => !c.deletedAt);

    if (params.status === 'active') {
      all = all.filter((c) => c.isActive);
    } else if (params.status === 'inactive') {
      all = all.filter((c) => !c.isActive);
    }

    if (params.parentId === 'null' || params.parentId === 'none') {
      all = all.filter((c) => c.parentId === null);
    } else if (params.parentId) {
      const parentId = this.slugToId.get(params.parentId) || params.parentId;
      all = all.filter((c) => c.parentId === parentId);
    }

    if (params.search) {
      const term = params.search.trim().toLowerCase();
      all = all.filter(
        (c) =>
          c.nameHi.toLowerCase().includes(term) ||
          c.nameEn.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term)
      );
    }

    const sortField = params.sortBy || 'displayOrder';
    const isDesc = params.sortOrder === 'desc';

    all.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'displayOrder') {
        cmp = a.displayOrder - b.displayOrder;
      } else if (sortField === 'nameEn') {
        cmp = a.nameEn.localeCompare(b.nameEn);
      } else if (sortField === 'nameHi') {
        cmp = a.nameHi.localeCompare(b.nameHi);
      }
      return isDesc ? -cmp : cmp;
    });

    const total = all.length;
    const skip = (page - 1) * limit;
    const paginated = all.slice(skip, skip + limit);

    const items: CategorySummary[] = paginated.map((c) => ({
      id: c.id,
      nameHi: c.nameHi,
      nameEn: c.nameEn,
      slug: c.slug,
      description: c.description,
      iconToken: c.iconToken,
      parentId: c.parentId,
      displayOrder: c.displayOrder,
      isActive: c.isActive,
      subcategoriesCount: c.children ? c.children.length : undefined,
      subcategories: params.includeSubcategories && c.children
        ? c.children
            .filter((ch) => !ch.deletedAt)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((ch) => ({
              id: ch.id,
              nameHi: ch.nameHi,
              nameEn: ch.nameEn,
              slug: ch.slug,
              description: ch.description,
              iconToken: ch.iconToken,
              parentId: ch.parentId!,
              displayOrder: ch.displayOrder,
              isActive: ch.isActive,
            }))
        : undefined,
    }));

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async findCategoryByIdOrSlug(idOrSlug: string, includeChildren: boolean = true): Promise<CategoryEntity | null> {
    const id = this.slugToId.get(idOrSlug) || idOrSlug;
    const item = this.categories.get(id);
    if (!item || item.deletedAt) return null;

    // Return sanitized clone to avoid circular structure issues in Express JSON serialization
    const copy: CategoryEntity = {
      id: item.id,
      nameHi: item.nameHi,
      nameEn: item.nameEn,
      slug: item.slug,
      description: item.description,
      iconToken: item.iconToken,
      iconMediaId: item.iconMediaId,
      parentId: item.parentId,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      createdAt: item.createdAt,
      deletedAt: item.deletedAt,
    };

    if (item.parentId) {
      const parent = this.categories.get(item.parentId);
      if (parent) {
        copy.parent = {
          id: parent.id,
          nameHi: parent.nameHi,
          nameEn: parent.nameEn,
          slug: parent.slug,
          description: parent.description,
          iconToken: parent.iconToken,
          iconMediaId: parent.iconMediaId,
          parentId: null,
          displayOrder: parent.displayOrder,
          isActive: parent.isActive,
          createdAt: parent.createdAt,
          deletedAt: parent.deletedAt,
        };
      }
    }

    if (includeChildren && item.children) {
      copy.children = item.children
        .filter((ch) => !ch.deletedAt)
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((ch) => ({
          id: ch.id,
          nameHi: ch.nameHi,
          nameEn: ch.nameEn,
          slug: ch.slug,
          description: ch.description,
          iconToken: ch.iconToken,
          iconMediaId: ch.iconMediaId,
          parentId: ch.parentId,
          displayOrder: ch.displayOrder,
          isActive: ch.isActive,
          createdAt: ch.createdAt,
          deletedAt: ch.deletedAt,
        }));
    }

    return copy;
  }

  public async findSubcategories(parentIdOrSlug: string): Promise<CategoryEntity[]> {
    const parent = await this.findCategoryByIdOrSlug(parentIdOrSlug, false);
    if (!parent) return [];

    const results: CategoryEntity[] = [];
    for (const cat of this.categories.values()) {
      if (cat.parentId === parent.id && !cat.deletedAt) {
        results.push({
          id: cat.id,
          nameHi: cat.nameHi,
          nameEn: cat.nameEn,
          slug: cat.slug,
          description: cat.description,
          iconToken: cat.iconToken,
          iconMediaId: cat.iconMediaId,
          parentId: cat.parentId,
          displayOrder: cat.displayOrder,
          isActive: cat.isActive,
          createdAt: cat.createdAt,
          deletedAt: cat.deletedAt,
        });
      }
    }

    return results.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  public async validateTaxonomy(primaryCategoryId: string, subcategoryId?: string | null): Promise<ArticleTaxonomyValidationResult> {
    const primary = await this.findCategoryByIdOrSlug(primaryCategoryId, false);
    if (!primary) {
      throw AppError.notFound(`Primary category "${primaryCategoryId}" not found in category registry.`);
    }

    if (!primary.isActive) {
      throw AppError.validationFailed(`Primary category "${primary.nameHi}" (${primary.slug}) is currently inactive.`);
    }

    if (primary.parentId !== null) {
      throw AppError.validationFailed(
        `Category "${primary.nameHi}" (${primary.slug}) is a subcategory, not a primary tier-1 category (RULE-CAT-004 violation).`
      );
    }

    if (!subcategoryId) {
      return { valid: true, primaryCategory: primary };
    }

    const sub = await this.findCategoryByIdOrSlug(subcategoryId, false);
    if (!sub) {
      throw AppError.notFound(`Subcategory "${subcategoryId}" not found in category registry.`);
    }

    if (!sub.isActive) {
      throw AppError.validationFailed(`Subcategory "${sub.nameHi}" (${sub.slug}) is currently inactive.`);
    }

    if (sub.parentId !== primary.id) {
      throw AppError.validationFailed(
        `Subcategory "${sub.nameHi}" (${sub.slug}) belongs to parent "${sub.parentId}", not primary category "${primary.nameHi}" (${primary.id}).`
      );
    }

    return { valid: true, primaryCategory: primary, subcategory: sub };
  }
}

/**
 * Singleton repository instance.
 * Defaults to InMemory in testing / offline mode, or Prisma if configured.
 */
let instance: ICategoryRepository | null = null;

export function getCategoryRepository(): ICategoryRepository {
  if (!instance) {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      instance = new InMemoryCategoryRepository();
    } else {
      instance = new PrismaCategoryRepository();
    }
  }
  return instance;
}

export const categoryRepository = getCategoryRepository();
