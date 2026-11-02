/**
 * BREAKING NEWS WALA — Main Database Seeder Entrypoint
 * Executes master seed scripts in sequential, idempotent order
 */

import { PrismaClient } from '@prisma/client';
import { seedMadhyaPradeshGeography } from './seeds/geo-seed';
import { seedCanonicalCategories } from './seeds/category-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BREAKING NEWS WALA DATABASE SEEDER ===');
  console.log('Executing database seeders...');

  // 1. Geography (10 divisions, 55 districts of MP)
  const geoResult = await seedMadhyaPradeshGeography(prisma);
  console.log(`[Geo-Seed] Complete: ${geoResult.divisionsCount} divisions, ${geoResult.districtsCount} districts.`);

  // 2. Categories (21 Canonical Categories & Subcategories)
  const catResult = await seedCanonicalCategories(prisma);
  console.log(`[Category-Seed] Complete: ${catResult.categoriesCount} categories, ${catResult.subcategoriesCount} subcategories.`);
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Seeder execution error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { main };
