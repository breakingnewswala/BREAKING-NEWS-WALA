/**
 * BREAKING NEWS WALA — Master News Category & Taxonomy Types
 * Grounded in docs/06-Business-Rules.md (RULE-CAT-001 through RULE-CAT-006),
 * docs/12-Database.md (DOM-B: Content Taxonomy), and docs/13-API.md (PUB-07, ADM-11, ADM-12)
 */

export interface CategoryEntity {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  description: string | null;
  iconToken: string;
  iconMediaId: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  deletedAt: Date | null;
  parent?: CategoryEntity | null;
  children?: CategoryEntity[];
}

export interface SubcategorySummary {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  description: string | null;
  iconToken: string;
  parentId: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CategorySummary {
  id: string;
  nameHi: string;
  nameEn: string;
  slug: string;
  description: string | null;
  iconToken: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  subcategoriesCount?: number;
  subcategories?: SubcategorySummary[];
}

export interface CategoryOverview {
  totalCategories: number;
  totalSubcategories: number;
  activeCategoriesCount: number;
  categories: CategorySummary[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CategoryFilterParams extends PaginationParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  parentId?: string | 'null' | 'none'; // 'null' or 'none' filters top-level only
  includeSubcategories?: boolean;
  sortBy?: 'displayOrder' | 'nameEn' | 'nameHi';
  sortOrder?: 'asc' | 'desc';
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

export interface ArticleTaxonomyValidationResult {
  valid: boolean;
  primaryCategory: CategoryEntity;
  subcategory?: CategoryEntity;
}

export interface SubcategorySeedItem {
  nameHi: string;
  nameEn: string;
  slug: string;
  description?: string;
  iconToken: string;
  displayOrder: number;
}

export interface CategorySeedItem {
  nameHi: string;
  nameEn: string;
  slug: string;
  description?: string;
  iconToken: string;
  displayOrder: number;
  subcategories: SubcategorySeedItem[];
}

