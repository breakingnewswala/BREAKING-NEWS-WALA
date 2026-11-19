/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * STEP 20 AUDIT — Independent Process Worker
 * 
 * Runs in its own dedicated Node.js OS process with:
 * - Its own memory heap
 * - Its own Firebase Admin SDK initialization
 * - Its own FirestoreAdapter instance
 * - Zero shared JavaScript memory with any other worker or parent
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FirestoreAdapter, getAuthoritativeFirestore } from '../src/server/persistence/firestoreAdapter.js';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const workerId = process.env.WORKER_ID || `worker-${process.pid}`;
process.env.NODE_ENV = 'test';
process.env.GCLOUD_PROJECT = firebaseConfig.projectId || 'breaking-news-wala';

// Initialize own Firebase Admin Firestore instance
const firestore = getAuthoritativeFirestore();
const adapter = new FirestoreAdapter({ firestore });

// Explicitly wipe process-local mutex to guarantee zero process-local serialization
adapter._reporterLocks = null;

process.on('message', async (msg) => {
  try {
    if (msg.type === 'PING') {
      process.send({ type: 'PONG', workerId, pid: process.pid });
      return;
    }

    if (msg.type === 'SET_QUOTA') {
      const result = await adapter.setReporterWhatsAppQuota(msg.reporterId, msg.quota);
      process.send({ reqId: msg.reqId, success: true, result });
      return;
    }

    if (msg.type === 'GET_QUOTA') {
      const result = await adapter.getReporterWhatsAppQuota(msg.reporterId, msg.dateStr);
      process.send({ reqId: msg.reqId, success: true, result });
      return;
    }

    if (msg.type === 'GENERATE') {
      try {
        const result = await adapter.atomicSaveEpaperWhatsAppGeneration({
          reporterId: msg.reporterId,
          idempotencyKey: msg.idempotencyKey,
          editionId: msg.editionId || 'ed-audit-step20',
          headline: msg.headline || `Card from ${workerId}`,
          format: msg.format || '1:1',
        });
        process.send({ reqId: msg.reqId, success: true, result, workerId, pid: process.pid });
      } catch (err) {
        process.send({
          reqId: msg.reqId,
          success: false,
          error: {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
            details: err.details,
          },
          workerId,
          pid: process.pid,
        });
      }
      return;
    }

    if (msg.type === 'GET_DOC') {
      // Direct Firestore document inspection to independently verify document state
      const docSnap = await firestore.collection(msg.collection).doc(msg.docId).get();
      process.send({
        reqId: msg.reqId,
        success: true,
        exists: docSnap.exists,
        data: docSnap.exists ? docSnap.data() : null,
      });
      return;
    }

    if (msg.type === 'SIMULATE_ABORT') {
      // Intentionally abort a transaction midway to test rollback
      try {
        await firestore.runTransaction(async (transaction) => {
          const quotaRef = firestore.collection('epaperWhatsAppQuotas').doc(msg.reporterId);
          const usageRef = firestore.collection('epaperWhatsAppDailyUsage').doc(`${msg.reporterId}_${msg.dateStr}`);
          const qDoc = await transaction.get(quotaRef);
          const uDoc = await transaction.get(usageRef);
          transaction.set(usageRef, { reporterId: msg.reporterId, used: 999 }, { merge: true });
          throw new Error('INTENTIONAL_SIMULATED_TRANSACTION_FAILURE');
        });
        process.send({ reqId: msg.reqId, success: true });
      } catch (err) {
        process.send({ reqId: msg.reqId, success: false, error: err.message });
      }
      return;
    }

    if (msg.type === 'SHUTDOWN') {
      process.exit(0);
    }
  } catch (fatalErr) {
    process.send({ reqId: msg.reqId, success: false, fatal: fatalErr.message });
  }
});
