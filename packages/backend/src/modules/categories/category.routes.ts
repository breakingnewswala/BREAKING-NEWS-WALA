/**
 * BREAKING NEWS WALA — Category Router
 * Grounded in docs/06-Business-Rules.md (RULE-CAT-001 through RULE-CAT-006) and docs/13-API.md (PUB-07)
 * Mounts category queries, subcategory lookups, and taxonomy validation.
 */

import { Router } from 'express';
import { categoryController } from './category.controller';
import {
  validateCategoryIdOrSlug,
  validateCategoryQuery,
  validateTaxonomyBody,
} from './category.validator';

const router = Router();

// 1. High-Level Registry Overview (21 Canonical Categories + Hierarchy)
router.get('/overview', categoryController.getOverview);

// 2. Validate Article Taxonomy Binding (Article -> Category -> Subcategory)
router.post('/validate-taxonomy', validateTaxonomyBody, categoryController.validateTaxonomy);

// 3. Paginated, Filterable Category List
router.get('/', validateCategoryQuery, categoryController.getCategories);

// 4. Single Category Detail by UUID or Slug
router.get('/:idOrSlug', validateCategoryIdOrSlug, categoryController.getCategory);

// 5. Child Subcategories of Category
router.get('/:idOrSlug/subcategories', validateCategoryIdOrSlug, categoryController.getSubcategories);

export { router as categoryRouter };

