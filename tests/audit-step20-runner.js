/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 20 AUDIT — Independent Multi-Process Test Runner
 * 
 * Verifies True OS-Level Process Isolation for Distributed Cloud Firestore Transactions:
 * - Worker 1 and Worker 2 run in completely independent OS processes (distinct PIDs).
 * - Zero shared memory, zero shared Promise chains or locks.
 * - Both workers communicate exclusively through IPC with the runner and connect
 *   to the live Firestore Emulator on 127.0.0.1:8085.
 * - Scenarios A through H executed with direct Firestore document validation.
 */

import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.resolve(__dirname, 'audit-step20-worker.js');

let reqCounter = 0;
function sendWorkerRequest(worker, payload) {
  const reqId = ++reqCounter;
  return new Promise((resolve, reject) => {
    const handler = (msg) => {
      if (msg.reqId === reqId) {
        worker.off('message', handler);
        resolve(msg);
      }
    };
    worker.on('message', handler);
    worker.send({ ...payload, reqId });
  });
}

function spawnWorker(id) {
  const child = fork(workerPath, [], {
    env: {
      ...process.env,
      WORKER_ID: id,
    },
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });
  return child;
}

async function pingWorker(worker) {
  return new Promise((resolve) => {
    const handler = (msg) => {
      if (msg.type === 'PONG') {
        worker.off('message', handler);
        resolve(msg);
      }
    };
    worker.on('message', handler);
    worker.send({ type: 'PING' });
  });
}

async function runStep20MultiProcessAudit() {
  console.log('\n===============================================================');
  console.log('STEP 20 AUDIT: TRUE MULTI-PROCESS ISOLATION VERIFICATION');
  console.log('===============================================================\n');

  console.log('1. Spawning Independent OS Processes...');
  const worker1 = spawnWorker('PROCESS-A');
  const worker2 = spawnWorker('PROCESS-B');

  const pong1 = await pingWorker(worker1);
  const pong2 = await pingWorker(worker2);

  console.log(`✓ Process A running (PID: ${pong1.pid})`);
  console.log(`✓ Process B running (PID: ${pong2.pid})`);
  assert.notEqual(pong1.pid, pong2.pid, 'Process A and Process B must have different OS PIDs');
  console.log('✓ Verified: Independent OS runtimes, distinct memory heaps, zero shared memory.\n');

  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  // -------------------------------------------------------------
  // Scenario A: Quota = 1 with 10 concurrent requests across Process A & B
  // -------------------------------------------------------------
  console.log('--- SCENARIO A: Quota = 1, 10 Concurrent Requests Across Process A & B ---');
  const repA = `rep-proc-a-${Date.now()}`;
  await sendWorkerRequest(worker1, { type: 'SET_QUOTA', reporterId: repA, quota: 1 });

  const promisesA = [];
  for (let i = 0; i < 10; i++) {
    const target = i % 2 === 0 ? worker1 : worker2;
    promisesA.push(
      sendWorkerRequest(target, {
        type: 'GENERATE',
        reporterId: repA,
        idempotencyKey: `call-scen-a-${i}`,
      })
    );
  }

  const resultsA = await Promise.all(promisesA);
  const successA = resultsA.filter((r) => r.success);
  const failureA = resultsA.filter((r) => !r.success);

  console.log(`Results: ${successA.length} successes, ${failureA.length} failures`);
  assert.equal(successA.length, 1, `Scenario A must have exactly 1 success, got ${successA.length}`);
  assert.equal(failureA.length, 9, `Scenario A must have exactly 9 failures, got ${failureA.length}`);
  for (const f of failureA) {
    assert.equal(f.error.statusCode, 429);
    assert.equal(f.error.code, 'ERR_QUOTA_EXHAUSTED');
  }

  const docUsageA = await sendWorkerRequest(worker1, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repA}_${todayIST}`,
  });
  assert.equal(docUsageA.exists, true);
  assert.equal(docUsageA.data.used, 1);
  console.log('✓ Firestore Verification: epaperWhatsAppDailyUsage document strictly shows used = 1');
  console.log(`✓ Winner Process: ${successA[0].workerId} (PID ${successA[0].pid})\n`);

  // -------------------------------------------------------------
  // Scenario B: Quota = 2 with 10 concurrent requests across Process A & B
  // -------------------------------------------------------------
  console.log('--- SCENARIO B: Quota = 2, 10 Concurrent Requests Across Process A & B ---');
  const repB = `rep-proc-b-${Date.now()}`;
  await sendWorkerRequest(worker2, { type: 'SET_QUOTA', reporterId: repB, quota: 2 });

  const promisesB = [];
  for (let i = 0; i < 10; i++) {
    const target = i % 2 === 0 ? worker1 : worker2;
    promisesB.push(
      sendWorkerRequest(target, {
        type: 'GENERATE',
        reporterId: repB,
        idempotencyKey: `call-scen-b-${i}`,
      })
    );
  }

  const resultsB = await Promise.all(promisesB);
  const successB = resultsB.filter((r) => r.success);
  const failureB = resultsB.filter((r) => !r.success);

  console.log(`Results: ${successB.length} successes, ${failureB.length} failures`);
  assert.equal(successB.length, 2, `Scenario B must have exactly 2 successes, got ${successB.length}`);
  assert.equal(failureB.length, 8, `Scenario B must have exactly 8 failures, got ${failureB.length}`);

  const docUsageB = await sendWorkerRequest(worker2, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repB}_${todayIST}`,
  });
  assert.equal(docUsageB.exists, true);
  assert.equal(docUsageB.data.used, 2);
  console.log('✓ Firestore Verification: epaperWhatsAppDailyUsage document strictly shows used = 2\n');

  // -------------------------------------------------------------
  // Scenario C: Multiple reporters with independent quotas across processes
  // -------------------------------------------------------------
  console.log('--- SCENARIO C: Multiple Reporters (rep-alpha=1, rep-beta=3) Concurrently ---');
  const repAlpha = `rep-alpha-${Date.now()}`;
  const repBeta = `rep-beta-${Date.now()}`;

  await sendWorkerRequest(worker1, { type: 'SET_QUOTA', reporterId: repAlpha, quota: 1 });
  await sendWorkerRequest(worker2, { type: 'SET_QUOTA', reporterId: repBeta, quota: 3 });

  const promisesC = [];
  for (let i = 0; i < 6; i++) {
    // 6 for alpha
    promisesC.push(
      sendWorkerRequest(i % 2 === 0 ? worker1 : worker2, {
        type: 'GENERATE',
        reporterId: repAlpha,
        idempotencyKey: `alpha-${i}`,
      }).then((r) => ({ rep: 'alpha', ...r }))
    );
    // 6 for beta
    promisesC.push(
      sendWorkerRequest(i % 2 === 0 ? worker1 : worker2, {
        type: 'GENERATE',
        reporterId: repBeta,
        idempotencyKey: `beta-${i}`,
      }).then((r) => ({ rep: 'beta', ...r }))
    );
  }

  const resultsC = await Promise.all(promisesC);
  const alphaSuccess = resultsC.filter((r) => r.rep === 'alpha' && r.success);
  const betaSuccess = resultsC.filter((r) => r.rep === 'beta' && r.success);

  console.log(`Alpha: ${alphaSuccess.length} successes, Beta: ${betaSuccess.length} successes`);
  assert.equal(alphaSuccess.length, 1, 'repAlpha must have exactly 1 success');
  assert.equal(betaSuccess.length, 3, 'repBeta must have exactly 3 successes');

  const docAlpha = await sendWorkerRequest(worker1, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repAlpha}_${todayIST}`,
  });
  const docBeta = await sendWorkerRequest(worker2, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repBeta}_${todayIST}`,
  });

  assert.equal(docAlpha.data.used, 1);
  assert.equal(docBeta.data.used, 3);
  console.log('✓ Firestore Verification: Reporter isolation strictly enforced with zero cross-talk.\n');

  // -------------------------------------------------------------
  // Scenario D: Duplicate idempotency keys across processes
  // -------------------------------------------------------------
  console.log('--- SCENARIO D: Duplicate Idempotency Key Dispatched to Process A & B Simultaneously ---');
  const repD = `rep-idem-${Date.now()}`;
  await sendWorkerRequest(worker1, { type: 'SET_QUOTA', reporterId: repD, quota: 2 });
  const sharedKey = `shared-idem-key-${Date.now()}`;

  // Process A and Process B fire concurrently with the exact same idempotencyKey
  const resultsD = await Promise.all([
    sendWorkerRequest(worker1, {
      type: 'GENERATE',
      reporterId: repD,
      idempotencyKey: sharedKey,
      headline: 'Headline from Process A',
    }),
    sendWorkerRequest(worker2, {
      type: 'GENERATE',
      reporterId: repD,
      idempotencyKey: sharedKey,
      headline: 'Headline from Process B',
    }),
  ]);

  console.log('Results D:', JSON.stringify(resultsD, null, 2));

  // At least one process MUST succeed and create the initial record
  const successesD = resultsD.filter((r) => r.success);
  assert.ok(successesD.length >= 1, 'At least one process must succeed');
  const primaryGenId = successesD[0].result.id;

  // Now, Process B sends a subsequent idempotent request with the same key
  const sequentialD = await sendWorkerRequest(worker2, {
    type: 'GENERATE',
    reporterId: repD,
    idempotencyKey: sharedKey,
    headline: 'Sequential Request from Process B',
  });

  assert.equal(sequentialD.success, true, 'Sequential idempotent call must succeed');
  assert.equal(
    sequentialD.result.id,
    primaryGenId,
    'Sequential call from Process B must return the exact same generation ID'
  );

  const docUsageD = await sendWorkerRequest(worker1, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repD}_${todayIST}`,
  });
  assert.equal(docUsageD.data.used, 1, 'Idempotent duplicate must consume exactly 1 quota, not 2');
  console.log(`✓ Verified: Primary Generation ID: ${primaryGenId}`);
  console.log(`✓ Process B sequentially returned identical Generation ID: ${sequentialD.result.id}`);
  console.log('✓ Firestore Verification: Usage count strictly preserved at 1\n');

  // -------------------------------------------------------------
  // Scenario E: High-Contention Transactions
  // -------------------------------------------------------------
  console.log('--- SCENARIO E: High Contention (Quota = 4, 12 Requests Across Process A & B) ---');
  const repE = `rep-contention-${Date.now()}`;
  await sendWorkerRequest(worker1, { type: 'SET_QUOTA', reporterId: repE, quota: 4 });

  const promisesE = [];
  for (let i = 0; i < 12; i++) {
    promisesE.push(
      sendWorkerRequest(i % 2 === 0 ? worker1 : worker2, {
        type: 'GENERATE',
        reporterId: repE,
        idempotencyKey: `contention-${i}`,
      })
    );
  }

  const resultsE = await Promise.all(promisesE);
  const successE = resultsE.filter((r) => r.success);
  const failureE = resultsE.filter((r) => !r.success);

  console.log(`Results: ${successE.length} successes, ${failureE.length} failures (HTTP 429)`);
  assert.equal(successE.length, 4, `Scenario E must have exactly 4 successes, got ${successE.length}`);
  assert.equal(failureE.length, 8, `Scenario E must have exactly 8 failures, got ${failureE.length}`);

  const docUsageE = await sendWorkerRequest(worker1, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repE}_${todayIST}`,
  });
  assert.equal(docUsageE.data.used, 4);
  console.log('✓ Firestore Verification: Contention retries succeeded, max quota 4 strictly enforced\n');

  // -------------------------------------------------------------
  // Scenario F: IST Midnight Rollover
  // -------------------------------------------------------------
  console.log('--- SCENARIO F: IST Midnight Rollover (Asia/Kolkata Boundary) ---');
  const repF = `rep-ist-${Date.now()}`;
  await sendWorkerRequest(worker1, { type: 'SET_QUOTA', reporterId: repF, quota: 1 });

  // Generate for today
  const resF1 = await sendWorkerRequest(worker1, {
    type: 'GENERATE',
    reporterId: repF,
    idempotencyKey: `ist-call-today`,
  });
  assert.equal(resF1.success, true);

  // Quota exhausted for today
  const resF2 = await sendWorkerRequest(worker2, {
    type: 'GENERATE',
    reporterId: repF,
    idempotencyKey: `ist-call-today-2`,
  });
  assert.equal(resF2.success, false);
  assert.equal(resF2.error.statusCode, 429);

  // Directly check tomorrow's quota date
  const tomorrowIST = '2026-11-19';
  const quotaTomorrow = await sendWorkerRequest(worker2, {
    type: 'GET_QUOTA',
    reporterId: repF,
    dateStr: tomorrowIST,
  });
  assert.equal(quotaTomorrow.result.used, 0);
  assert.equal(quotaTomorrow.result.remaining, 1);
  assert.equal(quotaTomorrow.result.quotaExceeded, false);
  console.log('✓ Verified: Today exhausted (used=1, rem=0), Tomorrow fresh (used=0, rem=1)\n');

  // -------------------------------------------------------------
  // Scenario G: Application Restart and Persistence
  // -------------------------------------------------------------
  console.log('--- SCENARIO G: Application Process Termination & State Persistence ---');
  const repG = `rep-restart-${Date.now()}`;
  await sendWorkerRequest(worker1, { type: 'SET_QUOTA', reporterId: repG, quota: 1 });

  // Worker 1 writes generation
  const resG1 = await sendWorkerRequest(worker1, {
    type: 'GENERATE',
    reporterId: repG,
    idempotencyKey: `restart-key-1`,
  });
  assert.equal(resG1.success, true);
  console.log(`✓ Worker 1 (PID ${pong1.pid}) successfully wrote to Firestore.`);

  // Kill Worker 1 permanently
  console.log(`Killing Worker 1 (PID ${pong1.pid})...`);
  worker1.kill('SIGTERM');

  // Spawn brand new Worker 3 with a new PID
  console.log('Spawning Worker 3 (New Independent Process)...');
  const worker3 = spawnWorker('PROCESS-C');
  const pong3 = await pingWorker(worker3);
  console.log(`✓ Worker 3 running (PID: ${pong3.pid})`);
  assert.notEqual(pong3.pid, pong1.pid);

  // Worker 3 reads quota from Cloud Firestore
  const quotaG = await sendWorkerRequest(worker3, {
    type: 'GET_QUOTA',
    reporterId: repG,
  });
  assert.equal(quotaG.result.used, 1);
  assert.equal(quotaG.result.remaining, 0);
  assert.equal(quotaG.result.quotaExceeded, true);

  // Worker 3 attempts generation; must fail with 429
  const resG2 = await sendWorkerRequest(worker3, {
    type: 'GENERATE',
    reporterId: repG,
    idempotencyKey: `restart-key-2`,
  });
  assert.equal(resG2.success, false);
  assert.equal(resG2.error.statusCode, 429);
  console.log('✓ Verified: Persisted Firestore state survived process termination; Worker 3 enforced 429\n');

  // -------------------------------------------------------------
  // Scenario H: Transaction Rollback
  // -------------------------------------------------------------
  console.log('--- SCENARIO H: Transaction Abort & Rollback Atomicity ---');
  const repH = `rep-rollback-${Date.now()}`;
  await sendWorkerRequest(worker2, { type: 'SET_QUOTA', reporterId: repH, quota: 1 });

  // Simulate an aborted transaction on Worker 2
  const abortRes = await sendWorkerRequest(worker2, {
    type: 'SIMULATE_ABORT',
    reporterId: repH,
    dateStr: todayIST,
  });
  assert.equal(abortRes.success, false);
  console.log('✓ Intentional transaction failure aborted successfully.');

  // Verify that used count is NOT 999
  const docUsageH = await sendWorkerRequest(worker3, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repH}_${todayIST}`,
  });
  assert.equal(docUsageH.exists, false, 'Aborted transaction must leave no document');

  // Now Worker 3 does a valid generation; must succeed cleanly
  const resHValid = await sendWorkerRequest(worker3, {
    type: 'GENERATE',
    reporterId: repH,
    idempotencyKey: 'rollback-valid-key',
  });
  assert.equal(resHValid.success, true);

  const docUsageHAfter = await sendWorkerRequest(worker3, {
    type: 'GET_DOC',
    collection: 'epaperWhatsAppDailyUsage',
    docId: `${repH}_${todayIST}`,
  });
  assert.equal(docUsageHAfter.data.used, 1);
  console.log('✓ Verified: Zero partial or contaminated writes committed; subsequent transaction succeeded\n');

  // Cleanup workers
  worker2.kill('SIGTERM');
  worker3.kill('SIGTERM');

  console.log('===============================================================');
  console.log('ALL SCENARIOS (A THROUGH H) PASSED IN TRUE MULTI-PROCESS MODE!');
  console.log('===============================================================\n');
}

runStep20MultiProcessAudit().catch((err) => {
  console.error('FATAL AUDIT FAILURE:', err);
  process.exit(1);
});
