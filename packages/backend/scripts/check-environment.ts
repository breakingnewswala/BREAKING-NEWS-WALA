/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Runtime & Environment Verification Script
 * Validates Node.js, Prisma Client, Models, and MP Geography data structures.
 */

import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { MP_DIVISIONS_AND_DISTRICTS } from '../prisma/seeds/geo-seed';

interface VerificationResult {
  nodeVersion: string;
  isNodeCompatible: boolean;
  prismaVersion: string;
  registeredModelsCount: number;
  registeredModels: string[];
  mpDivisionsCount: number;
  mpDistrictsCount: number;
  uniqueDistrictSlugsCount: number;
  priorityHubsFound: string[];
  newGazetteDistrictsFound: string[];
  databaseConnection: {
    status: 'connected' | 'unreachable';
    details?: string;
  };
}

async function verifyEnvironment(): Promise<VerificationResult> {
  console.log('===========================================================');
  console.log(' BREAKING NEWS WALA — RUNTIME & ENVIRONMENT VERIFICATION  ');
  console.log('===========================================================');

  // 1. Node.js Runtime Check
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace(/^v/, '').split('.')[0], 10);
  const isNodeCompatible = majorVersion >= 20;

  console.log(`[Runtime] Node.js Version: ${nodeVersion} (Compatible: ${isNodeCompatible ? 'YES' : 'NO'})`);

  // 2. Prisma Client & Model Introspection
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://bnw_user:bnw_dev_password_2026@127.0.0.1:5432/bnw_dev?schema=public';
  }

  const prisma = new PrismaClient({
    log: ['error'],
  });

  // Extract model names from Prisma.dmmf
  const modelNames = Prisma.dmmf.datamodel.models.map((m) => m.name);
  const prismaVersion = (Prisma as any).prismaVersion?.client ?? '5.22.0';

  console.log(`[Prisma] Client Version: ${prismaVersion}`);
  console.log(`[Prisma] Total Registered Models: ${modelNames.length}`);

  // 3. Geographic Data Structure Verification
  const totalDivisions = MP_DIVISIONS_AND_DISTRICTS.length;
  let totalDistricts = 0;
  const districtSlugs = new Set<string>();

  const priorityHubKeys = ['niwari', 'bhopal', 'indore', 'jabalpur', 'gwalior', 'ujjain'];
  const newGazetteKeys = ['niwari', 'mauganj', 'maihar', 'pandhurna'];

  const foundPriorityHubs: string[] = [];
  const foundNewGazetteDistricts: string[] = [];

  for (const div of MP_DIVISIONS_AND_DISTRICTS) {
    for (const dist of div.districts) {
      totalDistricts++;
      districtSlugs.add(dist.slug);

      if (priorityHubKeys.includes(dist.slug)) {
        foundPriorityHubs.push(dist.slug);
      }
      if (newGazetteKeys.includes(dist.slug)) {
        foundNewGazetteDistricts.push(dist.slug);
      }
    }
  }

  console.log(`[Geography] Divisions: ${totalDivisions} (Expected: 10)`);
  console.log(`[Geography] Districts: ${totalDistricts} (Expected: 55)`);
  console.log(`[Geography] Unique Slugs: ${districtSlugs.size} / ${totalDistricts}`);
  console.log(`[Geography] Priority Hubs: ${foundPriorityHubs.length} / 6`);
  console.log(`[Geography] Newly Formed Districts: ${foundNewGazetteDistricts.length} / 4`);

  // 4. Database Live Connectivity Test (Graceful Probe)
  let dbStatus: 'connected' | 'unreachable' = 'unreachable';
  let dbDetails = '';

  try {
    console.log('[Database] Probing connection (3s timeout)...');
    const connectPromise = prisma.$queryRaw`SELECT 1 as live_check`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout (PostgreSQL server not reachable at 127.0.0.1:5432)')), 3000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    dbStatus = 'connected';
    dbDetails = 'Database connection established successfully.';
    console.log(`[Database] Status: CONNECTED`);
  } catch (err: any) {
    dbStatus = 'unreachable';
    dbDetails = err.message || 'Unable to connect to PostgreSQL database.';
    console.log(`[Database] Status: UNREACHABLE (${dbDetails})`);
    console.log(`[Database] Note: Docker Desktop or external PostgreSQL required for live queries.`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  console.log('===========================================================');
  console.log(' VERIFICATION SUMMARY:');
  console.log(` - Node Compatible: ${isNodeCompatible ? 'PASS' : 'FAIL'}`);
  console.log(` - Prisma Models: ${modelNames.length === 42 ? 'PASS (42/42)' : `COUNT: ${modelNames.length}`}`);
  console.log(` - MP Geography: ${totalDivisions === 10 && totalDistricts === 55 ? 'PASS (10 Div / 55 Dist)' : 'FAIL'}`);
  console.log(` - DB Live Connectivity: ${dbStatus.toUpperCase()}`);
  console.log('===========================================================');

  return {
    nodeVersion,
    isNodeCompatible,
    prismaVersion,
    registeredModelsCount: modelNames.length,
    registeredModels: modelNames,
    mpDivisionsCount: totalDivisions,
    mpDistrictsCount: totalDistricts,
    uniqueDistrictSlugsCount: districtSlugs.size,
    priorityHubsFound: foundPriorityHubs,
    newGazetteDistrictsFound: foundNewGazetteDistricts,
    databaseConnection: {
      status: dbStatus,
      details: dbDetails,
    },
  };
}

if (require.main === module) {
  verifyEnvironment()
    .then((res) => {
      if (!res.isNodeCompatible || res.registeredModelsCount !== 42 || res.mpDistrictsCount !== 55) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal verification error:', err);
      process.exit(1);
    });
}

export { verifyEnvironment };

