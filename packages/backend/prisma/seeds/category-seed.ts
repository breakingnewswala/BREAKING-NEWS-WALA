/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Master News Category & Taxonomies Seed Script
 * Grounded in docs/01-PRD.md (Section 21.1 & 21.2), docs/06-Business-Rules.md (RULE-CAT-001),
 * and docs/12-Database.md (DOM-B: Content Taxonomy)
 *
 * Exactly 21 Canonical Categories and their Approved Child Subcategories.
 * Fully Idempotent (Upsert).
 */

import { PrismaClient } from '@prisma/client';
import { CANONICAL_CATEGORIES_DATA } from '../../src/modules/categories/category-data';

export async function seedCanonicalCategories(prisma: PrismaClient): Promise<{
  categoriesCount: number;
  subcategoriesCount: number;
}> {
  console.log('[Category-Seed] Starting seeding of 21 canonical categories and subcategories...');

  let seededCategories = 0;
  let seededSubcategories = 0;

  for (const cat of CANONICAL_CATEGORIES_DATA) {
    const iconTag = `[icon:${cat.iconToken}]`;
    const fullDesc = cat.description ? `${cat.description} ${iconTag}` : iconTag;

    // 1. Upsert Parent Category (Tier 1)
    const parentCategory = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameHi: cat.nameHi,
        nameEn: cat.nameEn,
        description: fullDesc,
        displayOrder: cat.displayOrder,
        isActive: true,
        parentId: null,
      },
      create: {
        nameHi: cat.nameHi,
        nameEn: cat.nameEn,
        slug: cat.slug,
        description: fullDesc,
        displayOrder: cat.displayOrder,
        isActive: true,
        parentId: null,
      },
    });

    seededCategories++;

    // 2. Upsert Child Subcategories (Tier 2)
    for (const sub of cat.subcategories) {
      const subIconTag = `[icon:${sub.iconToken}]`;
      const subDesc = sub.description ? `${sub.description} ${subIconTag}` : subIconTag;

      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          nameHi: sub.nameHi,
          nameEn: sub.nameEn,
          description: subDesc,
          displayOrder: sub.displayOrder,
          isActive: true,
          parentId: parentCategory.id,
        },
        create: {
          nameHi: sub.nameHi,
          nameEn: sub.nameEn,
          slug: sub.slug,
          description: subDesc,
          displayOrder: sub.displayOrder,
          isActive: true,
          parentId: parentCategory.id,
        },
      });

      seededSubcategories++;
    }
  }

  console.log(
    `[Category-Seed] Successfully seeded ${seededCategories} primary categories and ${seededSubcategories} subcategories.`
  );

  return {
    categoriesCount: seededCategories,
    subcategoriesCount: seededSubcategories,
  };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedCanonicalCategories(prisma)
    .catch((err) => {
      console.error('[Category-Seed] Error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

