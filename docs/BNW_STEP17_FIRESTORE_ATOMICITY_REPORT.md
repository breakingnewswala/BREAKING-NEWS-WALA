# BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
# STEP 17 — FIRESTORE ATOMICITY & DISTRIBUTED CONCURRENCY AUDIT REPORT

**Project:** BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)  
**Document ID:** `BNW-DOC-EPAPER-STEP17-FIRESTORE-ATOMICITY-2026-V1.0`  
**Classification:** Deep-Dive Persistence Concurrency Assessment  
**Audit Phase:** Post-STEP 16 Independent Verification  
**Audit Date:** 2026-11-18  

---

## 1. Executive Summary & Core Architectural Finding

In STEP 16, a concurrency mutex queue (`_acquireReporterLock(reporterId)`) was introduced into `LocalJsonAdapter` and `FirestoreAdapter` to resolve the Time-of-Check to Time-of-Use (TOCTOU) race condition in WhatsApp quota enforcement (`POST /api/v1/epaper/whatsapp/generate`).

While this implementation **successfully guarantees concurrency safety within a single Node.js runtime process** (empirically proven by 10-concurrent-request automated stress tests), an independent architectural audit of `FirestoreAdapter` reveals a critical limitation for multi-instance distributed deployments:

> [!CAUTION]
> **CRITICAL ARCHITECTURAL OBSERVATION (FINDING-17-01)**:  
> The lock mechanism `_acquireReporterLock(reporterId)` is implemented strictly in-memory using a JavaScript `Map` of chained `Promise` objects within the Node.js process heap.  
> In a horizontally scaled production deployment (e.g. multiple Google Cloud Run instances, multi-node Google App Hosting, or clustered Node.js workers), **separate server instances do not share Node.js process memory**.  
> Therefore, an in-memory mutex **CANNOT** provide distributed concurrency protection across separate server instances.

Pursuant to the Step 17 Mandate:  
*“If production Firestore atomicity is not demonstrably guaranteed by a genuine transaction or equivalent distributed atomic operation, mark FINDING-17-01 as OPEN / BLOCKED. Do not accept a LocalJson or mocked Firestore concurrency test as proof of distributed safety.”*

**FINDING-17-01 is formally designated: OPEN / BLOCKED.**

---

## 2. In-Depth Analysis of Current Implementation

### 2.1 The Process-Local Mutex Queue
Lines 2776–2788 in `src/server/persistence/firestoreAdapter.js`:
```javascript
async _acquireReporterLock(reporterId) {
  if (!this._reporterLocks) {
    this._reporterLocks = new Map();
  }
  let releaseLock;
  const prevLock = this._reporterLocks.get(reporterId) || Promise.resolve();
  const nextLock = new Promise((resolve) => {
    releaseLock = resolve;
  });
  this._reporterLocks.set(reporterId, prevLock.then(() => nextLock));
  await prevLock;
  return () => releaseLock();
}
```

### 2.2 Mechanism Analysis
1. **Intra-Process Safety (Verified)**:
   - Within a single Node.js event loop, if 10 requests targeting the same `reporterId` arrive simultaneously:
     - Request 1 awaits `Promise.resolve()` and acquires the critical section immediately.
     - Requests 2 through 10 chain onto `nextLock` and wait asynchronously.
     - Request 1 checks current daily usage in IST (`Asia/Kolkata`), determines `remaining = 1`, writes the generation record, and calls `releaseLock()`.
     - Request 2 is unblocked, checks current daily usage, observes `remaining = 0`, and throws HTTP 429 `ERR_QUOTA_EXHAUSTED`.
     - Requests 3 through 10 sequentially observe `remaining = 0` and are rejected with HTTP 429.
   - **Empirical Proof**: Verified in `tests/backend-epaper-step16-concurrency.test.js` (Subtest 2.2 & 2.4): Exactly 1 succeeded (201), 9 rejected (429).
2. **Inter-Process / Multi-Instance Limitation (Vulnerability)**:
   - In a production horizontal environment where multiple container instances service traffic behind a load balancer (Cloudflare / GCP Cloud Load Balancer):
     ```
                                 ┌─────────────────────────┐
                                 │   GCP Cloud Run / LB    │
                                 └────────────┬────────────┘
                                              │
                       ┌──────────────────────┴──────────────────────┐
                       │                                             │
             ┌─────────▼─────────┐                         ┌─────────▼─────────┐
             │ Server Instance A │                         │ Server Instance B │
             │ (PID 1234, Heap A)│                         │ (PID 5678, Heap B)│
             ├───────────────────┤                         ├───────────────────┤
             │ _reporterLocks:   │                         │ _reporterLocks:   │
             │   Map { rep-1 }   │                         │   Map { rep-1 }   │
             └─────────┬─────────┘                         └─────────┬─────────┘
                       │                                             │
                       └──────────────────────┬──────────────────────┘
                                              │
                                   ┌──────────▼──────────┐
                                   │  Shared Firestore   │
                                   └─────────────────────┘
     ```
   - If Request 1 routes to Instance A and Request 2 routes to Instance B at the same millisecond:
     - Instance A acquires its local lock in Heap A.
     - Instance B acquires its local lock in Heap B.
     - Both instances read the shared database and observe `remaining = 1`.
     - Both instances write generation records.
     - **Result**: Daily quota is exceeded by 100%.

---

## 3. Production Firestore Transaction Blueprint

To achieve true distributed concurrency protection in a multi-instance production environment, `FirestoreAdapter` must execute an atomic Firestore transaction (`db.runTransaction()`) directly on the Google Cloud Firestore document.

### 3.1 Recommended Document Data Model for Quotas
Store daily quota usage in a dedicated document keyed by reporter and date:
- Path: `epaperWhatsAppDailyUsage/${reporterId}_${todayIST}`
- Fields:
  ```json
  {
    "reporterId": "rep-001",
    "date": "2026-11-18",
    "used": 1,
    "maxDaily": 20,
    "updatedAt": "2026-11-18T07:05:00.000Z"
  }
  ```

### 3.2 True Distributed Atomic Transaction Implementation
```javascript
async atomicSaveEpaperWhatsAppGenerationDistributed(generationData, user = null) {
  const reporterId = generationData.reporterId || user?.id || 'anonymous';
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const usageDocRef = this.db.collection('epaperWhatsAppDailyUsage').doc(`${reporterId}_${todayIST}`);
  const quotaConfigRef = this.db.collection('epaperWhatsAppQuotas').doc(reporterId);
  const genDocRef = this.db.collection('epaperWhatsAppGenerations').doc();

  return await this.db.runTransaction(async (transaction) => {
    // 1. ALL READS MUST PRECEDE ALL WRITES IN FIRESTORE TRANSACTIONS
    const [usageDoc, quotaDoc] = await Promise.all([
      transaction.get(usageDocRef),
      transaction.get(quotaConfigRef)
    ]);

    const maxDaily = (quotaDoc.exists && typeof quotaDoc.data().maxDaily === 'number')
      ? quotaDoc.data().maxDaily
      : 20;

    const currentUsed = usageDoc.exists ? (usageDoc.data().used || 0) : 0;

    if (currentUsed >= maxDaily) {
      const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${maxDaily}) समाप्त हो चुकी है।`);
      err.code = 'ERR_QUOTA_EXHAUSTED';
      err.statusCode = 429;
      err.quotaInfo = { reporterId, date: todayIST, used: currentUsed, maxDaily, remaining: 0, quotaExceeded: true };
      throw err;
    }

    // 2. WRITES COMMITTED ATOMICALLY
    const newUsed = currentUsed + 1;
    transaction.set(usageDocRef, {
      reporterId,
      date: todayIST,
      used: newUsed,
      maxDaily,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const genRecord = {
      ...generationData,
      id: genDocRef.id,
      reporterId,
      date: todayIST,
      createdAt: new Date().toISOString()
    };
    transaction.set(genDocRef, genRecord);

    return genRecord;
  });
}
```

### 3.3 How This Solves Distributed Concurrency
1. **Firestore Optimistic Concurrency Control**:
   - Firestore's server-side transaction coordinator validates document read versions before committing writes.
   - If Instance A and Instance B attempt to update `usageDocRef` simultaneously, Firestore detects document collision.
   - One transaction succeeds; the other transaction is automatically retried by the SDK.
   - On retry, the second transaction reads `currentUsed = 1`, observes `currentUsed >= maxDaily`, and aborts with HTTP 429 without writing.
2. **Zero Cross-Instance Vulnerability**:
   - Works identically whether running across 1 instance or 50 instances.
   - Eliminates dependence on process-local Node.js heap memory.

---

## 4. Current Verification Assessment

| Environment | Mechanism Tested | Safety Level | Audit Assessment |
| :--- | :--- | :---: | :--- |
| **Local Development / Dev Server** | `LocalJsonAdapter` (File/Memory) + Promise Mutex | **VERIFIED SAFE** | Single process; all concurrent threads serialized. |
| **Single-Container Staging** | `FirestoreAdapter` + Process-Local Mutex | **VERIFIED SAFE** | Single container; 100% thread-safe under stress. |
| **Multi-Container Production** | `FirestoreAdapter` (Current In-Memory Mutex) | **BLOCKED / OPEN** | Requires `db.runTransaction()` on document before multi-container launch. |

---

## 5. Audit Recommendations for Staging & Production Deployment

1. **For Phase 1 Staging (Single-Container)**:
   - Deploying to a single container instance (e.g. 1 replica Cloud Run service with concurrency limit) is safe under the current mutex.
2. **Prior to Multi-Instance Production Scaling**:
   - Implement the distributed `db.runTransaction()` blueprint documented in Section 3.
   - Validate against the Firebase Firestore Local Emulator running 2 distinct Node.js client worker processes.
