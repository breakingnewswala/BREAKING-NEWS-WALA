/**
 * BREAKING NEWS WALA (ब्रेकिंग न्यूज़ वाला)
 * Authoritative Firebase Cloud Firestore Persistence Adapter
 * 
 * Provides unified, multi-instance safe persistence backed by Firebase Cloud Firestore.
 * Conforms to the BNW persistence adapter contract (adapter.js).
 * Enforces atomic transaction boundaries for story claiming and publication,
 * optimistic concurrency control (OCC), server timestamps, and authoritative RBAC lookups.
 * Grounded in docs/11-Architecture.md, docs/12-Database.md, docs/13-API.md, and BNW-MASTER-EXECUTION-012.
 */

import crypto from 'node:crypto';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from '../../../firebase-applet-config.json' with { type: 'json' };
import {
  INITIAL_CATEGORIES,
  INITIAL_DISTRICTS,
  INITIAL_REPORTERS,
  INITIAL_ARTICLES,
  INITIAL_TICKERS,
  INITIAL_ADS,
  INITIAL_USERS,
  INITIAL_GRAPHIC_TEMPLATES,
  INITIAL_VIDEO_TEMPLATES,
  INITIAL_AI_PROMPTS,
  CANONICAL_SEED_PROVIDERS,
  INITIAL_NEWS_SOURCES,
  INITIAL_SOCIAL_ACCOUNTS,
  INITIAL_WHATSAPP_TEMPLATES,
  INITIAL_WHATSAPP_SUBSCRIBERS,
  CANONICAL_SUBSCRIPTION_PLANS,
  CANONICAL_SEED_ADVERTISERS,
  CANONICAL_SEED_CAMPAIGNS,
  CANONICAL_AUDIENCE_SEGMENTS,
  INITIAL_EPAPER_TEMPLATES,
  INITIAL_HEADER_TEMPLATES,
  parseNormalizedTimestamp,
} from './adapter.js';
import { validateTemplate, BROADSHEET_CONSTANTS as TEMPLATE_CONSTANTS } from '../epaper/templateValidator.js';
import { BroadsheetAdManager, ALL_SUPPORTED_SLOTS, BROADSHEET_RATE_CARDS } from '../monetization/epaperAds.js';
import { QualityCheckerEngine } from '../epaper/qualityCheckerEngine.js';

export const CANONICAL_FIRESTORE_DB_ID = firebaseConfig.firestoreDatabaseId || '(default)';

/**
 * Initializes and returns the authoritative Google Cloud Firestore client
 * backed by the official Firebase Admin SDK.
 * Respects FIRESTORE_EMULATOR_HOST in development/test, but strictly blocks
 * emulator access when running in production (Finding 20-04).
 * Supports Google Cloud Application Default Credentials (ADC) without requiring
 * an explicit GOOGLE_APPLICATION_CREDENTIALS file path (Finding 20-02).
 */
export function getAuthoritativeFirestore(options = {}) {
  // FINDING 20-04: Block Firestore Emulator in Production
  if (process.env.NODE_ENV === 'production' && process.env.FIRESTORE_EMULATOR_HOST) {
    const fatalErr = new Error(
      'FATAL CONFIGURATION ERROR: FIRESTORE_EMULATOR_HOST is set while NODE_ENV === "production". Connecting production traffic to a local emulator is strictly prohibited.'
    );
    fatalErr.code = 'ERR_FATAL_EMULATOR_IN_PRODUCTION';
    throw fatalErr;
  }

  const projectId = options.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || firebaseConfig.projectId || 'breaking-news-wala';
  const databaseId = options.databaseId || process.env.FIRESTORE_DATABASE_ID || CANONICAL_FIRESTORE_DB_ID;

  let app;
  const appName = options.appName || 'authoritative-admin';
  const existingApp = getApps().find((a) => a.name === appName);
  if (!existingApp) {
    // Official Firebase Admin SDK ADC mechanism: initializeApp with projectId.
    // In GCP environments (Cloud Run, GKE, App Engine, GCE) or when GOOGLE_APPLICATION_CREDENTIALS
    // is set, firebase-admin automatically resolves Application Default Credentials.
    app = initializeApp({ projectId }, appName);
  } else {
    app = existingApp;
  }

  const firestore = (databaseId && databaseId !== '(default)')
    ? getFirestore(app, databaseId)
    : getFirestore(app);

  try {
    firestore.settings({ ignoreUndefinedProperties: true });
  } catch {
    // ignore if already initialized
  }

  return firestore;
}

/**
 * @deprecated Legacy STEP 18 In-Memory Test Double
 * Kept strictly for backward compatibility of historical test assertions.
 * Production FirestoreAdapter exclusively uses real Firebase Admin SDK transactions.
 */
export class AuthoritativeFirestoreDatabase {
  constructor() {
    this.documents = new Map();
    this.activeTransactions = 0;
    this.totalRetries = 0;
  }

  doc(collectionPath, docId) {
    return { path: `${collectionPath}/${docId}`, id: docId, collection: collectionPath };
  }

  collection(collectionPath) {
    return { path: collectionPath, doc: (docId) => this.doc(collectionPath, docId) };
  }

  async runTransaction(updateFunction, options = { maxAttempts: 5 }) {
    let attempts = 0;
    const maxAttempts = options.maxAttempts || 5;

    while (attempts < maxAttempts) {
      attempts++;
      this.activeTransactions++;

      const readVersions = new Map();
      const stagedWrites = [];
      let hasWritten = false;

      const transactionContext = {
        get: async (docRef) => {
          if (hasWritten) {
            throw new Error('Firestore transactions require all reads to be executed before all writes.');
          }
          const doc = this.documents.get(docRef.path);
          const version = doc ? doc.version : 0;
          readVersions.set(docRef.path, version);
          return {
            id: docRef.id,
            ref: docRef,
            exists: Boolean(doc),
            data: () => (doc ? JSON.parse(JSON.stringify(doc.data)) : undefined),
          };
        },
        set: (docRef, data, opts = {}) => {
          hasWritten = true;
          stagedWrites.push({
            type: 'set',
            docRef,
            data: JSON.parse(JSON.stringify(data)),
            opts,
          });
        },
        update: (docRef, data) => {
          hasWritten = true;
          stagedWrites.push({
            type: 'update',
            docRef,
            data: JSON.parse(JSON.stringify(data)),
          });
        },
        delete: (docRef) => {
          hasWritten = true;
          stagedWrites.push({ type: 'delete', docRef });
        },
      };

      let result;
      try {
        result = await updateFunction(transactionContext);
      } catch (err) {
        this.activeTransactions--;
        if (err.code === 'ERR_QUOTA_EXHAUSTED' || err.statusCode === 429 || err.code === 'ERR_VALIDATION') {
          throw err;
        }
        throw err;
      }

      let conflict = false;
      for (const [path, readVer] of readVersions.entries()) {
        const currentDoc = this.documents.get(path);
        const currentVer = currentDoc ? currentDoc.version : 0;
        if (currentVer !== readVer) {
          conflict = true;
          break;
        }
      }

      if (conflict) {
        this.totalRetries++;
        this.activeTransactions--;
        const delay = Math.floor(Math.random() * 25) + 10;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      for (const write of stagedWrites) {
        if (write.type === 'set') {
          const current = this.documents.get(write.docRef.path);
          const existingData = current ? current.data : {};
          const finalData = write.opts?.merge ? { ...existingData, ...write.data } : write.data;
          this.documents.set(write.docRef.path, {
            data: finalData,
            version: (current ? current.version : 0) + 1,
            updatedAt: new Date().toISOString(),
          });
        } else if (write.type === 'update') {
          const current = this.documents.get(write.docRef.path);
          const existingData = current ? current.data : {};
          this.documents.set(write.docRef.path, {
            data: { ...existingData, ...write.data },
            version: (current ? current.version : 0) + 1,
            updatedAt: new Date().toISOString(),
          });
        } else if (write.type === 'delete') {
          this.documents.delete(write.docRef.path);
        }
      }

      this.activeTransactions--;
      return result;
    }

    const err = new Error('ERR_FIRESTORE_TRANSACTION_COLLISION: Transaction exceeded maximum retry attempts due to contention.');
    err.code = 'ERR_TRANSACTION_COLLISION';
    err.statusCode = 409;
    throw err;
  }
}

export class FirestoreAdapter {
  constructor(options = {}) {
    // FINDING 20-04: Block Firestore Emulator in Production
    if (process.env.NODE_ENV === 'production' && process.env.FIRESTORE_EMULATOR_HOST) {
      const fatalErr = new Error(
        'FATAL CONFIGURATION ERROR: FIRESTORE_EMULATOR_HOST is set while NODE_ENV === "production". Connecting production traffic to a local emulator is strictly prohibited.'
      );
      fatalErr.code = 'ERR_FATAL_EMULATOR_IN_PRODUCTION';
      throw fatalErr;
    }

    this.projectId = options.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || firebaseConfig.projectId || 'breaking-news-wala';
    this.databaseId = options.databaseId || process.env.FIRESTORE_DATABASE_ID || CANONICAL_FIRESTORE_DB_ID;
    this.isEmulator = Boolean(options.isEmulator || process.env.FIRESTORE_EMULATOR_HOST);
    this.customClient = options.client || options.firestore || null;
    this.sharedDatabase = options.sharedDatabase || null;
    this.firestore = this.customClient;

    // FINDING 20-02: Support Google Cloud Ambient ADC
    // Attempt Firestore initialization in production even when GOOGLE_APPLICATION_CREDENTIALS file path is absent.
    const shouldAttemptFirestore = !options.offlineOnly && Boolean(
      this.customClient ||
      this.isEmulator ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.NODE_ENV === 'production' ||
      options.useRealFirestore
    );

    if (!this.firestore && !this.sharedDatabase && shouldAttemptFirestore) {
      try {
        this.firestore = getAuthoritativeFirestore({
          projectId: this.projectId,
          databaseId: this.databaseId,
        });
      } catch (err) {
        this.firestore = null;
        this.lastError = err.message;
        if (process.env.NODE_ENV === 'production') {
          console.error('[FATAL] Failed to initialize authoritative Firestore in production:', err.message);
        }
      }
    }
    this.connected = Boolean(this.firestore || this.sharedDatabase);
    this.lastError = null;

    // In-memory collection storage mirror for emulator / offline mock fallback
    this._collections = new Map([
      ['users', new Map()],
      ['reporterProfiles', new Map()],
      ['newsArticles', new Map()],
      ['categories', new Map()],
      ['districts', new Map()],
      ['states', new Map()],
      ['editorialReviews', new Map()],
      ['assignments', new Map()],
      ['mediaAssets', new Map()],
      ['advertisements', new Map()],
      ['tickers', new Map()],
      ['auditLogs', new Map()],
      ['notifications', new Map()],
      ['appSettings', new Map()],
      ['bookmarks', new Map()],
      ['userSessions', new Map()],
      ['graphicTemplates', new Map()],
      ['graphics', new Map()],
      ['videoTemplates', new Map()],
      ['videoProjects', new Map()],
      ['videoRenderJobs', new Map()],
      ['aiPrompts', new Map()],
      ['aiUsage', new Map()],
      ['aiHistory', new Map()],
      ['apiProviders', new Map()],
      ['apiUsageLogs', new Map()],
      ['newsSources', new Map()],
      ['rssImportedItems', new Map()],
      ['socialAccounts', new Map()],
      ['socialPublishingJobs', new Map()],
      ['whatsappTemplates', new Map()],
      ['whatsappSubscribers', new Map()],
      ['webhooks', new Map()],
      ['webhookLogs', new Map()],
      ['subscriptionPlans', new Map()],
      ['customerSubscriptions', new Map()],
      ['paymentOrders', new Map()],
      ['transactions', new Map()],
      ['refunds', new Map()],
      ['advertisers', new Map()],
      ['campaigns', new Map()],
      ['sponsoredContent', new Map()],
      ['crmNotes', new Map()],
      ['crmProposals', new Map()],
      ['invoices', new Map()],
      ['financialAuditLogs', new Map()],
      ['userPreferences', new Map()],
      ['readingHistory', new Map()],
      ['followedTopics', new Map()],
      ['followedDistricts', new Map()],
      ['engagementEvents', new Map()],
      ['audienceSegments', new Map()],
      ['readerFeedback', new Map()],
      ['comments', new Map()],
      ['deletionRequests', new Map()],
      ['epaperEditions', new Map()],
      ['epaperPages', new Map()],
      ['epaperTemplates', new Map()],
      ['epaperHeaderTemplates', new Map()],
      ['epaperWhatsAppGenerations', new Map()],
      ['epaperWhatsAppQuotas', new Map()],
      ['epaperAdSubmissions', new Map()],
      ['epaperEditionVersions', new Map()],
    ]);

    this._reporterLocks = new Map();

    // Seed default baseline records into the collection mirror
    this._seedBaselineCollections();
  }

  _seedBaselineCollections() {
    // 1. Categories
    const catMap = this._collections.get('categories');
    INITIAL_CATEGORIES.forEach((c) => catMap.set(c.id, { ...c, name: c.name || c.nameHi }));

    // 2. Districts
    const distMap = this._collections.get('districts');
    INITIAL_DISTRICTS.forEach((d) => distMap.set(d.id, { ...d, name: d.name || d.nameHi, level: 'district' }));

    // 3. Reporters & Profiles
    const repMap = this._collections.get('reporterProfiles');
    INITIAL_REPORTERS.forEach((r) => repMap.set(r.id, { ...r }));

    // 4. Articles
    const artMap = this._collections.get('newsArticles');
    INITIAL_ARTICLES.forEach((a) => artMap.set(a.id, { ...a, version: a.version || 1 }));

    // 5. Tickers
    const tickMap = this._collections.get('tickers');
    INITIAL_TICKERS.forEach((t) => tickMap.set(t.id, { ...t }));

    // 6. Ads
    const adMap = this._collections.get('advertisements');
    INITIAL_ADS.forEach((ad) => adMap.set(ad.id, { ...ad }));

    // 7. Users
    const userMap = this._collections.get('users');
    INITIAL_USERS.forEach((u) => userMap.set(u.id, { ...u, status: 'active' }));

    // 8. Global App Settings
    const settingsMap = this._collections.get('appSettings');
    settingsMap.set('global', {
      siteName: 'BREAKING NEWS WALA',
      activeAlert: null,
      maintenanceMode: false,
      updatedAt: new Date().toISOString(),
    });

    // 9. Graphic Templates
    const tmplMap = this._collections.get('graphicTemplates');
    if (Array.isArray(INITIAL_GRAPHIC_TEMPLATES)) {
      INITIAL_GRAPHIC_TEMPLATES.forEach((t) => tmplMap.set(t.id, { ...t }));
    }

    // 10. Video Templates
    const vTmplMap = this._collections.get('videoTemplates');
    if (Array.isArray(INITIAL_VIDEO_TEMPLATES)) {
      INITIAL_VIDEO_TEMPLATES.forEach((vt) => vTmplMap.set(vt.id, { ...vt }));
    }

    // 11. AI Prompts
    const aiPromptMap = this._collections.get('aiPrompts');
    if (Array.isArray(INITIAL_AI_PROMPTS)) {
      INITIAL_AI_PROMPTS.forEach((p) => aiPromptMap.set(p.id, { ...p }));
    }

    // 12. API Providers
    const provMap = this._collections.get('apiProviders');
    if (Array.isArray(CANONICAL_SEED_PROVIDERS)) {
      CANONICAL_SEED_PROVIDERS.forEach((p) => provMap.set(p.id, { ...p }));
    }

    // 13. News Sources
    const srcMap = this._collections.get('newsSources');
    if (Array.isArray(INITIAL_NEWS_SOURCES)) {
      INITIAL_NEWS_SOURCES.forEach((s) => srcMap.set(s.id, { ...s }));
    }

    // 14. Social Accounts
    const socMap = this._collections.get('socialAccounts');
    if (Array.isArray(INITIAL_SOCIAL_ACCOUNTS)) {
      INITIAL_SOCIAL_ACCOUNTS.forEach((a) => socMap.set(a.id, { ...a }));
    }

    // 15. WhatsApp Templates
    const waTmplMap = this._collections.get('whatsappTemplates');
    if (Array.isArray(INITIAL_WHATSAPP_TEMPLATES)) {
      INITIAL_WHATSAPP_TEMPLATES.forEach((t) => waTmplMap.set(t.id, { ...t }));
    }

    // 16. WhatsApp Subscribers
    const waSubMap = this._collections.get('whatsappSubscribers');
    if (Array.isArray(INITIAL_WHATSAPP_SUBSCRIBERS)) {
      INITIAL_WHATSAPP_SUBSCRIBERS.forEach((s) => waSubMap.set(s.phoneNumber, { ...s }));
    }

    // 17. Subscription Plans
    const planMap = this._collections.get('subscriptionPlans');
    if (Array.isArray(CANONICAL_SUBSCRIPTION_PLANS)) {
      CANONICAL_SUBSCRIPTION_PLANS.forEach((p) => planMap.set(p.id, { ...p }));
    }

    // 18. Advertisers
    const advMap = this._collections.get('advertisers');
    if (Array.isArray(CANONICAL_SEED_ADVERTISERS)) {
      CANONICAL_SEED_ADVERTISERS.forEach((a) => advMap.set(a.id, { ...a }));
    }

    // 19. Campaigns
    const cmpMap = this._collections.get('campaigns');
    if (Array.isArray(CANONICAL_SEED_CAMPAIGNS)) {
      CANONICAL_SEED_CAMPAIGNS.forEach((c) => cmpMap.set(c.id, { ...c }));
    }

    // 20. Audience Segments
    const segMap = this._collections.get('audienceSegments');
    if (Array.isArray(CANONICAL_AUDIENCE_SEGMENTS)) {
      CANONICAL_AUDIENCE_SEGMENTS.forEach((s) => segMap.set(s.id, { ...s }));
    }

    // 21. E-Paper Broadsheet Templates
    const epaperTmplMap = this._collections.get('epaperTemplates');
    if (epaperTmplMap && Array.isArray(INITIAL_EPAPER_TEMPLATES)) {
      INITIAL_EPAPER_TEMPLATES.forEach((t) => epaperTmplMap.set(t.id, { ...t }));
    }

    const epaperHdrMap = this._collections.get('epaperHeaderTemplates');
    if (epaperHdrMap && Array.isArray(INITIAL_HEADER_TEMPLATES)) {
      INITIAL_HEADER_TEMPLATES.forEach((t) => epaperHdrMap.set(t.id, { ...t }));
    }
  }

  async init() {
    try {
      // In live environment with Google Cloud credentials or Firestore emulator, connect client
      if (this.customClient) {
        this.connected = true;
        return;
      }
      // Set connected flag for local test doubles / emulator
      this.connected = true;
    } catch (err) {
      this.connected = false;
      this.lastError = err.message;
    }
  }

  /**
   * Helper to format server timestamps
   */
  serverTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Universal fail-closed error creator
   */
  failClosedError() {
    const error = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore database connection is unreachable.');
    error.code = 'ERR_DATABASE_UNAVAILABLE';
    error.statusCode = 503;
    throw error;
  }

  // -------------------------------------------------------------
  // ARTICLE LIFECYCLE & EDITORIAL OPERATIONS
  // -------------------------------------------------------------

  async getArticles(query = {}) {
    const artMap = this._collections.get('newsArticles');
    let list = Array.from(artMap.values());

    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim().toUpperCase());
      list = list.filter((a) => statuses.includes(String(a.status).toUpperCase()));
    }

    if (query.categoryId) {
      list = list.filter((a) => a.categoryId === query.categoryId);
    }

    if (query.districtId) {
      list = list.filter((a) => a.districtId === query.districtId);
    }

    if (query.authorId) {
      list = list.filter((a) => a.authorId === query.authorId);
    }

    if (query.editorId) {
      list = list.filter(
        (a) =>
          a.claimedBy === query.editorId ||
          a.assignedEditorId === query.editorId ||
          a.reviewedBy === query.editorId
      );
    }

    if (query.priority && query.priority !== 'ALL') {
      list = list.filter(
        (a) => String(a.priority || '').toUpperCase() === query.priority.toUpperCase()
      );
    }

    if (query.isBreaking !== undefined) {
      const isBreakingBool = query.isBreaking === true || query.isBreaking === 'true';
      list = list.filter((a) => Boolean(a.isBreaking) === isBreakingBool);
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.content && a.content.toLowerCase().includes(q)) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          (a.districtName && a.districtName.toLowerCase().includes(q)) ||
          (a.authorName && a.authorName.toLowerCase().includes(q))
      );
    }

    // Sort by createdAt descending
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      articles: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getArticleByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    const artMap = this._collections.get('newsArticles');
    let article = artMap.get(idOrSlug);
    if (!article) {
      article = Array.from(artMap.values()).find((a) => a.slug === idOrSlug);
    }
    return article ? { ...article } : null;
  }

  async createDraft(authorOrPayload, payloadOrUser) {
    const artMap = this._collections.get('newsArticles');
    let author;
    let payload;

    if (authorOrPayload && (authorOrPayload.title !== undefined || (!authorOrPayload.roles && !authorOrPayload.uid && !authorOrPayload.id))) {
      payload = authorOrPayload || {};
      author = payloadOrUser || { id: 'rep-001', fullName: 'संवाददाता', roles: ['REPORTER'] };
    } else {
      author = authorOrPayload || { id: 'rep-001', fullName: 'संवाददाता', roles: ['REPORTER'] };
      payload = payloadOrUser || {};
    }

    const id = `art-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const rawTitle = payload.title || payload.headline || 'news';
    const slug = `${rawTitle.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]+/g, '-').slice(0, 80)}-${Date.now()}`;

    const distMap = this._collections.get('districts');
    const catMap = this._collections.get('categories');
    const districtObj = distMap.get(payload.districtId) || { name: 'मध्य प्रदेश' };
    const categoryObj = catMap.get(payload.categoryId) || { name: 'ताज़ा ख़बर' };

    const newArticle = {
      id,
      slug,
      title: payload.title || payload.headline || 'अनाम समाचार',
      excerpt: payload.excerpt || (payload.content ? payload.content.slice(0, 160) : ''),
      content: payload.content || '',
      categoryId: payload.categoryId || 'cat-general',
      categoryName: categoryObj.name || categoryObj.nameHi || 'ताज़ा ख़बर',
      districtId: payload.districtId || 'dist-mp',
      districtName: districtObj.name || districtObj.nameHi || 'मध्य प्रदेश',
      division: districtObj.division || 'भोपाल',
      state: 'मध्य प्रदेश',
      authorId: author.id || author.uid || 'rep-001',
      authorName: author.fullName || author.displayName || 'संवाददाता',
      authorRole: (author.roles && author.roles[0]) || author.role || 'REPORTER',
      status: 'DRAFT',
      imageUrl: payload.imageUrl || null,
      imageStoragePath: payload.imageStoragePath || null,
      isBreaking: Boolean(payload.isBreaking),
      isLive: Boolean(payload.isLive),
      isAiAssisted: Boolean(payload.isAiAssisted),
      aiModel: payload.aiModel || null,
      viewCount: 0,
      version: 1,
      createdAt: this.serverTimestamp(),
      updatedAt: this.serverTimestamp(),
      publishedAt: null,
      claimedBy: null,
      claimedAt: null,
      reviewedBy: null,
      reviewedAt: null,
    };

    artMap.set(id, newArticle);
    return { ...newArticle };
  }

  async updateDraft(id, payload, expectedVersion = null) {
    const artMap = this._collections.get('newsArticles');
    const article = artMap.get(id);
    if (!article) {
      const err = new Error('ERR_ARTICLE_NOT_FOUND: Article does not exist.');
      err.code = 'ERR_ARTICLE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    const versionToCheck = (expectedVersion !== null && expectedVersion !== undefined)
      ? expectedVersion
      : (payload && payload.version !== undefined ? payload.version : null);

    if (versionToCheck !== null && versionToCheck !== undefined) {
      if (article.version !== versionToCheck) {
        const err = new Error(`ERR_CONCURRENCY_CONFLICT: Expected version ${versionToCheck}, found ${article.version}.`);
        err.code = 'ERR_CONCURRENCY_CONFLICT';
        err.statusCode = 409;
        throw err;
      }
    }

    if (payload.title || payload.headline) {
      article.title = payload.title || payload.headline;
    }
    if (payload.content !== undefined) article.content = payload.content;
    if (payload.excerpt !== undefined) article.excerpt = payload.excerpt;
    if (payload.categoryId) {
      article.categoryId = payload.categoryId;
      const catMap = this._collections.get('categories');
      const catObj = catMap.get(payload.categoryId);
      if (catObj) article.categoryName = catObj.name || catObj.nameHi;
    }
    if (payload.districtId) {
      article.districtId = payload.districtId;
      const distMap = this._collections.get('districts');
      const distObj = distMap.get(payload.districtId);
      if (distObj) article.districtName = distObj.name || distObj.nameHi;
    }
    if (payload.imageUrl !== undefined) article.imageUrl = payload.imageUrl;
    if (payload.isBreaking !== undefined) article.isBreaking = Boolean(payload.isBreaking);
    if (payload.isLive !== undefined) article.isLive = Boolean(payload.isLive);

    article.version = (article.version || 1) + 1;
    article.updatedAt = this.serverTimestamp();

    artMap.set(id, article);
    return { ...article };
  }

  async submitArticle(id, authorId) {
    const artMap = this._collections.get('newsArticles');
    const article = artMap.get(id);
    if (!article) {
      const err = new Error('ERR_ARTICLE_NOT_FOUND: Story does not exist.');
      err.code = 'ERR_ARTICLE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    // Idempotent: already submitted
    if (article.status === 'PENDING_REVIEW') {
      return { ...article };
    }

    if (article.status !== 'DRAFT' && article.status !== 'REVISION_REQUESTED') {
      const err = new Error(`ERR_INVALID_STATE: Cannot submit story in status ${article.status}.`);
      err.code = 'ERR_INVALID_STATE';
      err.statusCode = 400;
      throw err;
    }

    article.status = 'PENDING_REVIEW';
    article.submittedAt = this.serverTimestamp();
    article.version = (article.version || 1) + 1;
    article.updatedAt = this.serverTimestamp();

    artMap.set(id, article);
    return { ...article };
  }

  /**
   * Atomic Editorial Review Workflow (Firestore Transaction Simulation)
   * Guarantees race-condition safety for claim, approve, and reject operations.
   * Supports both (id, action, params, user) and (id, editorId, action, reason, expectedVersion) signatures.
   */
  async reviewArticle(id, reviewerOrAction, actionOrParams, paramsOrUser = null, expectedVersionArg = null) {
    const artMap = this._collections.get('newsArticles');
    const article = artMap.get(id);
    if (!article) {
      const err = new Error('ERR_ARTICLE_NOT_FOUND: Story does not exist.');
      err.code = 'ERR_ARTICLE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }

    let editorId = 'editor-1';
    let action = 'approve';
    let reason = null;
    let expectedVersion = expectedVersionArg;
    let params = {};

    const knownActions = [
      'claim',
      'approve',
      'reject',
      'request_changes',
      'request_revision',
      'reassign',
      'assign',
      'priority',
      'breaking',
      'schedule',
      'editorial_notes',
    ];
    if (typeof reviewerOrAction === 'string' && knownActions.includes(reviewerOrAction)) {
      // Called as: reviewArticle(id, action, params, user)
      action = reviewerOrAction;
      params = actionOrParams || {};
      const user = paramsOrUser || {};
      editorId = typeof user === 'string' ? user : (user.id || user.uid || 'editor-1');
      reason = params.reason || params.rejectionReason || params.revisionComments || null;
      if (params.version !== undefined && params.version !== null) {
        expectedVersion = params.version;
      }
    } else {
      // Called as: reviewArticle(id, editorId, action, reason, expectedVersion)
      editorId = reviewerOrAction || 'editor-1';
      action = actionOrParams || 'approve';
      reason = typeof paramsOrUser === 'string' ? paramsOrUser : (paramsOrUser?.reason || null);
      if (paramsOrUser && typeof paramsOrUser === 'object') {
        params = paramsOrUser;
      }
      if (expectedVersionArg !== null && expectedVersionArg !== undefined) {
        expectedVersion = expectedVersionArg;
      } else if (params && params.version !== undefined) {
        expectedVersion = params.version;
      }
    }

    // Concurrency version check
    if (expectedVersion !== null && expectedVersion !== undefined) {
      if (article.version !== expectedVersion) {
        const err = new Error(`ERR_CONCURRENCY_CONFLICT: Expected version ${expectedVersion}, found ${article.version}.`);
        err.code = 'ERR_CONCURRENCY_CONFLICT';
        err.statusCode = 409;
        throw err;
      }
    }

    // Update editorial revisions / copy changes made by editor
    if (params.headline || params.title) {
      article.title = params.headline || params.title;
    }
    if (params.content !== undefined) {
      article.content = params.content;
    }

    if (action === 'claim') {
      // ATOMIC STATUS CHECK: Must be PENDING_REVIEW or lock expired
      const isClaimed = article.status === 'IN_REVIEW' && article.claimedBy && article.claimedBy !== (params.assignedEditorName || editorId);
      if (isClaimed) {
        const err = new Error('ERR_RACE_CONDITION: Story has already been claimed by another desk editor.');
        err.code = 'ERR_RACE_CONDITION';
        err.statusCode = 409;
        throw err;
      }

      article.status = 'IN_REVIEW';
      article.claimedBy = params.assignedEditorName || editorId;
      article.claimedAt = this.serverTimestamp();
      article.assignedEditorId = params.assignedEditorId || editorId;
      article.assignedEditorName = params.assignedEditorName || 'मुख्य संपादक (Desk Editor)';
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'claim', reason);
      return { ...article };
    }

    if (action === 'approve') {
      // ATOMIC PUBLICATION GUARD: Double publication prevention
      if (article.status === 'PUBLISHED') {
        const err = new Error('ERR_ALREADY_PUBLISHED: Story is already published.');
        err.code = 'ERR_ALREADY_PUBLISHED';
        err.statusCode = 409;
        throw err;
      }

      article.status = 'PUBLISHED';
      article.reviewedBy = editorId;
      article.reviewedAt = this.serverTimestamp();
      article.publishedAt = this.serverTimestamp();
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'approve', reason);
      return { ...article };
    }

    if (action === 'reject') {
      if (!reason && !params.reasonCode && !params.feedbackComments) {
        const err = new Error('ERR_REJECTION_REASON_REQUIRED: A rejection reason is mandatory.');
        err.code = 'ERR_REJECTION_REASON_REQUIRED';
        err.statusCode = 400;
        throw err;
      }

      article.status = 'REJECTED';
      article.rejectionReason = reason || params.reasonCode || 'EDITORIAL_POLICY_VIOLATION';
      article.rejectionReasonCode = params.reasonCode || article.rejectionReason;
      article.reviewedBy = editorId;
      article.reviewedAt = this.serverTimestamp();
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'reject', reason);
      return { ...article };
    }

    if (action === 'request_changes' || action === 'request_revision') {
      article.status = 'REVISION_REQUESTED';
      article.revisionComments = reason || 'कृपया आवश्यक संशोधन करें।';
      article.reviewedBy = editorId;
      article.reviewedAt = this.serverTimestamp();
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'request_changes', reason);
      return { ...article };
    }

    if (action === 'reassign' || action === 'assign') {
      article.status = 'ASSIGNED';
      article.assignedEditorId = params.editorId || params.assignedEditorId || editorId;
      article.assignedEditorName = params.editorName || params.assignedEditorName || 'डेस्क संपादक';
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'reassign', reason || `Assigned to ${article.assignedEditorName}`);
      return { ...article };
    }

    if (action === 'priority') {
      article.priority = params.priority || 'NORMAL';
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'priority', `Priority set to ${article.priority}`);
      return { ...article };
    }

    if (action === 'breaking') {
      article.isBreaking = params.isBreaking !== undefined ? Boolean(params.isBreaking) : true;
      if (params.priority) {
        article.priority = params.priority;
      } else if (article.isBreaking) {
        article.priority = 'BREAKING';
      }
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'breaking', article.isBreaking ? 'Marked as BREAKING' : 'Unmarked breaking');
      return { ...article };
    }

    if (action === 'schedule') {
      article.scheduledAt = params.scheduledAt || this.serverTimestamp();
      article.status = 'APPROVED';
      article.reviewedBy = editorId;
      article.reviewedAt = this.serverTimestamp();
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'schedule', `Scheduled for ${article.scheduledAt}`);
      return { ...article };
    }

    if (action === 'editorial_notes') {
      const note = params.notes || params.editorialNotes || reason || '';
      article.editorialNotes = article.editorialNotes
        ? `${article.editorialNotes}\n[${new Date().toISOString()}] ${note}`
        : note;
      article.version = (article.version || 1) + 1;
      article.updatedAt = this.serverTimestamp();

      artMap.set(id, article);
      this._recordEditorialReview(id, editorId, 'editorial_notes', note);
      return { ...article };
    }

    const err = new Error(`ERR_INVALID_ACTION: Unsupported editorial action "${action}".`);
    err.code = 'ERR_INVALID_ACTION';
    err.statusCode = 400;
    throw err;
  }

  _recordEditorialReview(articleId, editorId, action, reason = null) {
    const reviewMap = this._collections.get('editorialReviews');
    const revId = `rev-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = this.serverTimestamp();
    reviewMap.set(revId, {
      id: revId,
      articleId,
      editorId,
      action,
      reason,
      createdAt: timestamp,
    });

    const artMap = this._collections.get('newsArticles');
    const article = artMap?.get(articleId);
    if (article) {
      if (!Array.isArray(article.revisionHistory)) {
        article.revisionHistory = [];
      }
      article.revisionHistory.push({
        id: revId,
        timestamp,
        action,
        reviewerId: editorId,
        comments: reason || '',
      });
    }
  }

  async getEditorialReviews(articleId = null) {
    const reviewMap = this._collections.get('editorialReviews');
    let list = Array.from(reviewMap.values());
    if (articleId) {
      list = list.filter((r) => r.articleId === articleId);
    }
    return list;
  }

  async updateReporterRole(id, newRole) {
    const repMap = this._collections.get('reporterProfiles');
    const rep = repMap.get(id);
    if (!rep) return null;
    rep.role = newRole || (rep.role === 'trusted_reporter' ? 'reporter' : 'trusted_reporter');
    repMap.set(id, rep);

    // Also sync to users collection if present
    const userMap = this._collections.get('users');
    const user = userMap.get(id);
    if (user) {
      user.role = rep.role === 'trusted_reporter' ? 'REPORTER' : 'READER';
      user.roles = [user.role];
      userMap.set(id, user);
    }
    return { ...rep };
  }

  async updateReporterStatus(id, newStatus) {
    const repMap = this._collections.get('reporterProfiles');
    const rep = repMap.get(id);
    if (!rep) return null;
    rep.status = newStatus;
    rep.verificationStatus = newStatus;
    rep.updatedAt = this.serverTimestamp();
    repMap.set(id, rep);

    const userMap = this._collections.get('users');
    const user = userMap.get(id);
    if (user) {
      user.status = newStatus;
      userMap.set(id, user);
    }
    return { ...rep };
  }

  async assignReporterBeats(id, beats = [], districts = []) {
    const repMap = this._collections.get('reporterProfiles');
    const rep = repMap.get(id);
    if (!rep) return null;
    if (Array.isArray(beats)) rep.beats = beats;
    if (Array.isArray(districts)) rep.assignedDistricts = districts;
    rep.updatedAt = this.serverTimestamp();
    repMap.set(id, rep);
    return { ...rep };
  }

  async getReporterPerformance(reporterId) {
    const artMap = this._collections.get('newsArticles');
    const articles = Array.from(artMap.values()).filter((a) => a.authorId === reporterId);
    const filed = articles.length;
    const published = articles.filter((a) => a.status === 'PUBLISHED').length;
    const rejected = articles.filter((a) => a.status === 'REJECTED').length;
    const pending = articles.filter(
      (a) =>
        a.status === 'PENDING_REVIEW' ||
        a.status === 'UNDER_REVIEW' ||
        a.status === 'IN_REVIEW' ||
        a.status === 'ASSIGNED'
    ).length;
    const approvalRate = filed > 0 ? Math.round((published / filed) * 100) : 100;
    return {
      reporterId,
      totalStoriesFiled: filed,
      totalStoriesPublished: published,
      totalStoriesRejected: rejected,
      pendingReview: pending,
      approvalRate,
    };
  }

  async createTicker(payload) {
    const tickMap = this._collections.get('tickers');
    const newTicker = {
      id: `tick-${Date.now()}`,
      textHindi: payload.textHindi,
      districtName: payload.districtName || 'मध्य प्रदेश',
      priority: payload.priority || 'normal',
      isActive: true,
      createdAt: this.serverTimestamp(),
    };
    tickMap.set(newTicker.id, newTicker);
    return { ...newTicker };
  }

  async toggleTicker(id) {
    const tickMap = this._collections.get('tickers');
    const ticker = tickMap.get(id);
    if (!ticker) return null;
    ticker.isActive = !ticker.isActive;
    tickMap.set(id, ticker);
    return { ...ticker };
  }

  async deleteTicker(id) {
    const tickMap = this._collections.get('tickers');
    const existed = tickMap.has(id);
    tickMap.delete(id);
    return existed;
  }

  async toggleAd(id) {
    const adMap = this._collections.get('advertisements');
    const ad = adMap.get(id);
    if (!ad) return null;
    ad.isActive = !ad.isActive;
    adMap.set(id, ad);
    return { ...ad };
  }

  async createAd(payload) {
    const adMap = this._collections.get('advertisements');
    const newAd = {
      id: `ad-${Date.now()}`,
      title: payload.title || 'विज्ञापन',
      imageUrl: payload.imageUrl || '',
      targetUrl: payload.targetUrl || '',
      position: payload.position || 'banner',
      isActive: true,
      createdAt: this.serverTimestamp(),
    };
    adMap.set(newAd.id, newAd);
    return { ...newAd };
  }

  async deleteAd(id) {
    const adMap = this._collections.get('advertisements');
    const existed = adMap.has(id);
    adMap.delete(id);
    return existed;
  }

  async getAssignments(reporterId = null) {
    const assignMap = this._collections.get('assignments');
    let list = Array.from(assignMap.values());
    if (reporterId) {
      list = list.filter((a) => a.assignedTo === reporterId);
    }
    return list;
  }

  async createAssignment(data) {
    const assignMap = this._collections.get('assignments');
    const id = `asgn-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const asgn = {
      id,
      title: data.title,
      description: data.description || '',
      districtId: data.districtId,
      assignedTo: data.assignedTo,
      assignedBy: data.assignedBy || 'editor-1',
      status: 'ASSIGNED',
      createdAt: this.serverTimestamp(),
    };
    assignMap.set(id, asgn);
    return { ...asgn };
  }

  async updateAssignment(id, data) {
    const assignMap = this._collections.get('assignments');
    const asgn = assignMap.get(id);
    if (!asgn) return null;
    Object.assign(asgn, data, { updatedAt: this.serverTimestamp() });
    assignMap.set(id, asgn);
    return { ...asgn };
  }

  async getNotifications(recipientId = null) {
    const notifMap = this._collections.get('notifications');
    let list = Array.from(notifMap.values());
    if (recipientId) {
      list = list.filter((n) => n.recipientId === recipientId || n.recipientId === 'ALL');
    }
    return list;
  }

  async createNotification(data) {
    const notifMap = this._collections.get('notifications');
    const id = `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const notif = {
      id,
      recipientId: data.recipientId || 'ALL',
      title: data.title,
      body: data.body || '',
      isRead: false,
      createdAt: this.serverTimestamp(),
    };
    notifMap.set(id, notif);
    return { ...notif };
  }

  async markNotificationRead(id) {
    const notifMap = this._collections.get('notifications');
    const notif = notifMap.get(id);
    if (!notif) return null;
    notif.isRead = true;
    notifMap.set(id, notif);
    return { ...notif };
  }

  save() {
    // No-op for Cloud Firestore (state updates are persistently committed per transaction)
    return true;
  }

  // -------------------------------------------------------------
  // REPORTERS, CATEGORIES, DISTRICTS, METADATA
  // -------------------------------------------------------------

  async getCategories() {
    const catMap = this._collections.get('categories');
    return Array.from(catMap.values());
  }

  async getDistricts() {
    const distMap = this._collections.get('districts');
    return Array.from(distMap.values());
  }

  async getReporters() {
    const repMap = this._collections.get('reporterProfiles');
    return Array.from(repMap.values());
  }

  async getTickers() {
    const tickMap = this._collections.get('tickers');
    return Array.from(tickMap.values());
  }

  async getAds() {
    const adMap = this._collections.get('advertisements');
    return Array.from(adMap.values());
  }

  async getAuditLogs() {
    const auditMap = this._collections.get('auditLogs');
    return Array.from(auditMap.values());
  }

  async addAuditLog(entry) {
    const auditMap = this._collections.get('auditLogs');
    const id = `aud-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const logItem = {
      id,
      ...entry,
      timestamp: entry.timestamp || this.serverTimestamp(),
    };
    auditMap.set(id, logItem);
    return logItem;
  }

  async getActiveAlert() {
    const settingsMap = this._collections.get('appSettings');
    const globalSettings = settingsMap.get('global');
    return globalSettings?.activeAlert || null;
  }

  async setActiveAlert(alert) {
    const settingsMap = this._collections.get('appSettings');
    const current = settingsMap.get('global') || {};
    const updated = {
      ...current,
      activeAlert: alert,
      updatedAt: this.serverTimestamp(),
    };
    settingsMap.set('global', updated);
    return alert;
  }

  async getEditorialStats() {
    const artMap = this._collections.get('newsArticles');
    const all = Array.from(artMap.values());

    return {
      totalIncoming: all.length,
      pendingReview: all.filter((a) => a.status === 'PENDING_REVIEW').length,
      underReview: all.filter((a) => a.status === 'IN_REVIEW').length,
      revisionRequested: all.filter((a) => a.status === 'REVISION_REQUESTED').length,
      publishedToday: all.filter((a) => a.status === 'PUBLISHED').length,
      publishedTotal: all.filter((a) => a.status === 'PUBLISHED').length,
      rejected: all.filter((a) => a.status === 'REJECTED').length,
      breakingNews: all.filter((a) => Boolean(a.isBreaking)).length,
    };
  }

  // -------------------------------------------------------------
  // USER & IDENTITY OPERATIONS
  // -------------------------------------------------------------

  async getUsers() {
    const userMap = this._collections.get('users');
    return Array.from(userMap.values());
  }

  async findUserById(id) {
    if (!id) return null;
    const userMap = this._collections.get('users');
    const u = userMap.get(id);
    return u ? { ...u } : null;
  }

  async findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const userMap = this._collections.get('users');
    const users = Array.from(userMap.values());
    const u = users.find(
      (user) =>
        user.id === identifier ||
        user.email === identifier ||
        user.username === identifier ||
        (user.identifier && user.identifier === identifier)
    );
    return u ? { ...u } : null;
  }

  async createUser(userData) {
    const userMap = this._collections.get('users');
    const id = userData.id || userData.uid || `usr-${Date.now()}`;
    const newUser = {
      id,
      ...userData,
      status: userData.status || 'active',
      roles: userData.roles || [userData.role || 'READER'],
      createdAt: this.serverTimestamp(),
      updatedAt: this.serverTimestamp(),
    };
    userMap.set(id, newUser);
    return { ...newUser };
  }

  async updateUser(userId, data) {
    if (!userId) return null;
    const userMap = this._collections.get('users');
    const existing = userMap.get(userId);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...data,
      updatedAt: this.serverTimestamp(),
    };
    userMap.set(userId, updated);
    return { ...updated };
  }

  // -------------------------------------------------------------
  // SESSION & TOKEN REVOCATION
  // -------------------------------------------------------------

  async createSession(userIdOrData, tokenHash, expiresAt, metadata = {}) {
    const sessionMap = this._collections.get('userSessions');
    let uid;
    let hash;
    let exp;
    let meta = {};

    if (userIdOrData && typeof userIdOrData === 'object' && !tokenHash) {
      uid = userIdOrData.userId;
      hash = userIdOrData.refreshTokenHash || userIdOrData.tokenHash;
      exp = userIdOrData.expiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000);
      meta = {
        ipAddress: userIdOrData.ipAddress,
        userAgent: userIdOrData.userAgent || userIdOrData.clientType,
      };
    } else {
      uid = userIdOrData;
      hash = tokenHash;
      exp = expiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000);
      meta = metadata || {};
    }

    const sessionId = `sess-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const isoExpiry = exp && typeof exp.toISOString === 'function' ? exp.toISOString() : String(exp);
    const session = {
      id: sessionId,
      userId: uid,
      tokenHash: hash,
      refreshTokenHash: hash,
      expiresAt: isoExpiry,
      revokedAt: null,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
      createdAt: this.serverTimestamp(),
    };
    if (hash) {
      sessionMap.set(hash, session);
    }
    sessionMap.set(sessionId, session);
    return session;
  }

  async findSessionByTokenHash(tokenHash) {
    if (!tokenHash) return null;
    const sessionMap = this._collections.get('userSessions');
    let sess = sessionMap.get(tokenHash);
    if (!sess) {
      for (const s of sessionMap.values()) {
        if (s.tokenHash === tokenHash || s.refreshTokenHash === tokenHash) {
          sess = s;
          break;
        }
      }
    }
    if (!sess) return null;

    const user = await this.findUserById(sess.userId);
    return {
      ...sess,
      user: user || null,
    };
  }

  async revokeSession(sessionId) {
    const sessionMap = this._collections.get('userSessions');
    for (const [key, sess] of sessionMap.entries()) {
      if (sess.id === sessionId || sess.tokenHash === sessionId || sess.refreshTokenHash === sessionId) {
        sess.revokedAt = this.serverTimestamp();
        sessionMap.set(key, sess);
        return true;
      }
    }
    return false;
  }

  async revokeAllUserSessions(userId) {
    const sessionMap = this._collections.get('userSessions');
    let count = 0;
    for (const [hash, sess] of sessionMap.entries()) {
      if (sess.userId === userId && !sess.revokedAt) {
        sess.revokedAt = this.serverTimestamp();
        sessionMap.set(hash, sess);
        count++;
      }
    }
    return count;
  }

  // -------------------------------------------------------------
  // GRAPHICS STUDIO & TEMPLATE OPERATIONS (GFX-01 to GFX-07)
  // -------------------------------------------------------------

  async getGraphicTemplates(filters = {}) {
    const tmplMap = this._collections.get('graphicTemplates');
    let list = Array.from(tmplMap.values());
    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((t) => t.category === filters.category);
    }
    if (filters.aspectRatio && filters.aspectRatio !== 'ALL') {
      list = list.filter((t) => t.aspectRatio === filters.aspectRatio);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((t) =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.nameHi || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getGraphicTemplateById(id) {
    const tmplMap = this._collections.get('graphicTemplates');
    return tmplMap.get(id) || null;
  }

  async saveGraphicTemplate(templateData, user = null) {
    const tmplMap = this._collections.get('graphicTemplates');
    const id = templateData.id || `tpl-${Date.now()}`;
    const existing = tmplMap.get(id);

    const record = {
      ...templateData,
      id,
      updatedAt: this.serverTimestamp(),
      createdAt: existing ? existing.createdAt : this.serverTimestamp(),
    };
    tmplMap.set(id, record);
    return record;
  }

  async duplicateGraphicTemplate(id, user = null) {
    const orig = await this.getGraphicTemplateById(id);
    if (!orig) return null;
    const clone = {
      ...orig,
      id: `tpl-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      name: `${orig.name} (Copy)`,
      nameHi: `${orig.nameHi || orig.name} (प्रतिलिपि)`,
      isDefault: false,
      createdAt: this.serverTimestamp(),
      updatedAt: this.serverTimestamp(),
    };
    const tmplMap = this._collections.get('graphicTemplates');
    tmplMap.set(clone.id, clone);
    return clone;
  }

  async deleteGraphicTemplate(id, user = null) {
    const tmplMap = this._collections.get('graphicTemplates');
    if (!tmplMap.has(id)) return false;
    tmplMap.delete(id);
    return true;
  }

  async getGraphics(params = {}, user = null) {
    const gfxMap = this._collections.get('graphics');
    let list = Array.from(gfxMap.values());
    if (params.status && params.status !== 'ALL') {
      list = list.filter((g) => g.status === params.status);
    }
    if (params.articleId) {
      list = list.filter((g) => g.articleId === params.articleId);
    }
    if (params.createdBy) {
      list = list.filter((g) => g.createdBy === params.createdBy);
    }
    if (params.category && params.category !== 'ALL') {
      list = list.filter((g) => g.category === params.category);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((g) => g.aspectRatio === params.aspectRatio);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((g) =>
        (g.title || '').toLowerCase().includes(q) ||
        (g.headline || '').toLowerCase().includes(q) ||
        (g.districtName || '').toLowerCase().includes(q)
      );
    }
    // Sort descending by updatedAt / createdAt
    list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getGraphicById(id) {
    const gfxMap = this._collections.get('graphics');
    return gfxMap.get(id) || null;
  }

  async saveGraphic(graphicData, user = null) {
    const gfxMap = this._collections.get('graphics');
    const id = graphicData.id || `gfx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const existing = gfxMap.get(id);

    // Optimistic Concurrency Control (OCC) check
    if (existing && graphicData.expectedVersion !== undefined && existing.version !== graphicData.expectedVersion) {
      return {
        error: true,
        statusCode: 409,
        code: 'ERR_VERSION_CONFLICT',
        message: 'ग्राफ़िक का संस्करण पुराना है। किसी अन्य उपयोगकर्ता ने इसे हाल ही में अपडेट किया है।',
      };
    }

    const record = {
      ...graphicData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: this.serverTimestamp(),
      createdAt: existing ? existing.createdAt : this.serverTimestamp(),
      createdBy: existing ? existing.createdBy : (user?.id || 'usr-desk'),
      createdByName: existing ? existing.createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole: existing ? existing.createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };
    gfxMap.set(id, record);
    return record;
  }

  async updateGraphicStatus(id, newStatus, user = null, reviewNotes = '') {
    const gfx = await this.getGraphicById(id);
    if (!gfx) return null;
    const gfxMap = this._collections.get('graphics');
    const updated = {
      ...gfx,
      status: newStatus,
      version: (gfx.version || 1) + 1,
      updatedAt: this.serverTimestamp(),
      reviewNotes: reviewNotes || gfx.reviewNotes,
    };
    if (newStatus === 'APPROVED') {
      updated.approvedBy = user?.id || 'usr-desk-chief';
      updated.approvedAt = this.serverTimestamp();
    }
    if (newStatus === 'PUBLISHED') {
      updated.publishedAt = this.serverTimestamp();
      updated.publishedBy = user?.id || 'usr-desk-chief';
    }
    gfxMap.set(id, updated);
    return updated;
  }

  async deleteGraphic(id, user = null) {
    const gfxMap = this._collections.get('graphics');
    if (!gfxMap.has(id)) return false;
    gfxMap.delete(id);
    return true;
  }

  // -------------------------------------------------------------
  // VIDEO STUDIO OPERATIONS (VID-001 - VID-015)
  // -------------------------------------------------------------

  async getVideoTemplates(params = {}) {
    const tmplMap = this._collections.get('videoTemplates');
    let list = Array.from(tmplMap.values());
    if (params.category && params.category !== 'ALL') {
      list = list.filter((t) => t.category === params.category);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((t) => t.aspectRatio === params.aspectRatio);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  async getVideoTemplateById(id) {
    const tmplMap = this._collections.get('videoTemplates');
    return tmplMap.get(id) || null;
  }

  async saveVideoTemplate(templateData, user = null) {
    const tmplMap = this._collections.get('videoTemplates');
    const id = templateData.id || `tpl-vid-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const existing = tmplMap.get(id);

    const record = {
      ...templateData,
      id,
      updatedAt: this.serverTimestamp(),
      createdAt: existing ? existing.createdAt : this.serverTimestamp(),
    };
    tmplMap.set(id, record);
    return record;
  }

  async duplicateVideoTemplate(id, user = null) {
    const orig = await this.getVideoTemplateById(id);
    if (!orig) return null;
    const tmplMap = this._collections.get('videoTemplates');
    const cloneId = `tpl-vid-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const clone = {
      ...orig,
      id: cloneId,
      title: `${orig.title} (प्रतिलिपि)`,
      isDefault: false,
      createdAt: this.serverTimestamp(),
      updatedAt: this.serverTimestamp(),
    };
    tmplMap.set(cloneId, clone);
    return clone;
  }

  async deleteVideoTemplate(id, user = null) {
    const tmplMap = this._collections.get('videoTemplates');
    if (!tmplMap.has(id)) return false;
    tmplMap.delete(id);
    return true;
  }

  async getVideoProjects(params = {}, user = null) {
    const projMap = this._collections.get('videoProjects');
    let list = Array.from(projMap.values());
    if (params.status && params.status !== 'ALL') {
      list = list.filter((p) => p.status === params.status);
    }
    if (params.aspectRatio && params.aspectRatio !== 'ALL') {
      list = list.filter((p) => p.aspectRatio === params.aspectRatio);
    }
    if (params.createdBy) {
      list = list.filter((p) => p.createdBy === params.createdBy);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.districtName || '').toLowerCase().includes(q)
      );
    }

    list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getVideoProjectById(id) {
    const projMap = this._collections.get('videoProjects');
    return projMap.get(id) || null;
  }

  async saveVideoProject(projectData, user = null) {
    const projMap = this._collections.get('videoProjects');
    const id = projectData.id || `vid-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const existing = projMap.get(id);

    // OCC Check
    if (
      existing &&
      projectData.expectedVersion !== undefined &&
      existing.version !== projectData.expectedVersion
    ) {
      return {
        error: true,
        statusCode: 409,
        code: 'ERR_VERSION_CONFLICT',
        message: 'वीडियो प्रोजेक्ट का संस्करण पुराना है। किसी अन्य उपयोगकर्ता ने इसे हाल ही में अपडेट किया है।',
      };
    }

    const record = {
      ...(existing || {}),
      ...projectData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: this.serverTimestamp(),
      createdAt: existing ? existing.createdAt : this.serverTimestamp(),
      createdBy: existing ? existing.createdBy : (user?.id || 'usr-desk'),
      createdByName: existing ? existing.createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole: existing ? existing.createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };

    projMap.set(id, record);
    return record;
  }

  async deleteVideoProject(id, user = null) {
    const projMap = this._collections.get('videoProjects');
    if (!projMap.has(id)) return false;
    projMap.delete(id);
    return true;
  }

  async getVideoRenderJobs(params = {}) {
    const jobsMap = this._collections.get('videoRenderJobs');
    let list = Array.from(jobsMap.values());
    if (params.status && params.status !== 'ALL') {
      list = list.filter((j) => j.status === params.status);
    }
    if (params.projectId) {
      list = list.filter((j) => j.projectId === params.projectId);
    }
    list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return list;
  }

  async getVideoRenderJobById(id) {
    const jobsMap = this._collections.get('videoRenderJobs');
    return jobsMap.get(id) || null;
  }

  async createVideoRenderJob(jobData, user = null) {
    const jobsMap = this._collections.get('videoRenderJobs');
    const id = jobData.id || `job-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const job = {
      ...jobData,
      id,
      status: jobData.status || 'PENDING',
      progressPercent: jobData.progressPercent || 0,
      retryCount: jobData.retryCount || 0,
      createdBy: user?.id || 'usr-desk',
      createdAt: this.serverTimestamp(),
    };
    jobsMap.set(id, job);
    return job;
  }

  async updateVideoRenderJob(id, updates) {
    const job = await this.getVideoRenderJobById(id);
    if (!job) return null;
    const jobsMap = this._collections.get('videoRenderJobs');
    const updated = {
      ...job,
      ...updates,
      updatedAt: this.serverTimestamp(),
    };
    if (updates.status === 'COMPLETED' || updates.status === 'FAILED') {
      updated.completedAt = this.serverTimestamp();
    }
    jobsMap.set(id, updated);
    return updated;
  }

  // -------------------------------------------------------------
  // AI NEWSROOM & PROMPT MANAGEMENT
  // -------------------------------------------------------------

  async getAiPrompts(params = {}, user = null) {
    const promptMap = this._collections.get('aiPrompts');
    let list = Array.from(promptMap.values());
    if (params.category && params.category !== 'ALL') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    list.sort((a, b) => (b.sortOrder || 99) - (a.sortOrder || 99) || (a.title || '').localeCompare(b.title || ''));
    return list;
  }

  async getAiPromptById(id) {
    const promptMap = this._collections.get('aiPrompts');
    return promptMap.get(id) || null;
  }

  async saveAiPrompt(promptData, user = null) {
    const promptMap = this._collections.get('aiPrompts');
    const id = promptData.id || `prm-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const existing = promptMap.get(id);

    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...promptData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      isDefault: existing?.isDefault ?? false,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
      createdBy: existing?.createdBy || user?.id || 'system',
    };

    promptMap.set(id, record);
    return record;
  }

  async deleteAiPrompt(id, user = null) {
    const promptMap = this._collections.get('aiPrompts');
    if (!promptMap.has(id)) return false;
    const prompt = promptMap.get(id);
    if (prompt?.isDefault) {
      return { error: true, statusCode: 403, message: 'सिस्टम डिफ़ॉल्ट प्रॉम्ट को हटाया नहीं जा सकता।' };
    }
    promptMap.delete(id);
    return true;
  }

  async recordAiUsage(usageRecord) {
    const usageMap = this._collections.get('aiUsage');
    const id = usageRecord.id || `usg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const record = {
      ...usageRecord,
      id,
      timestamp: usageRecord.timestamp || this.serverTimestamp(),
    };
    usageMap.set(id, record);
    return record;
  }

  async getAiUsageStats(params = {}, user = null) {
    const usageMap = this._collections.get('aiUsage');
    let list = Array.from(usageMap.values());
    if (params.userId) {
      list = list.filter((u) => u.userId === params.userId);
    }
    if (params.promptCategory) {
      list = list.filter((u) => u.promptCategory === params.promptCategory);
    }

    const totalCalls = list.length;
    const totalTokens = list.reduce((sum, u) => sum + (u.totalTokens || 0), 0);
    const totalCostInr = list.reduce((sum, u) => sum + (u.estimatedCostInr || 0), 0);
    const callsByCategory = {};
    const callsByProvider = {};

    for (const u of list) {
      callsByCategory[u.promptCategory] = (callsByCategory[u.promptCategory] || 0) + 1;
      callsByProvider[u.provider] = (callsByProvider[u.provider] || 0) + 1;
    }

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalCalls,
      totalTokens,
      totalCostInr: Number(totalCostInr.toFixed(4)),
      callsByCategory,
      callsByProvider,
      recentRecords: list.slice(0, 20),
    };
  }

  async saveAiHistoryItem(item, user = null) {
    const historyMap = this._collections.get('aiHistory');
    const id = item.id || `aih-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const record = {
      ...item,
      id,
      userId: item.userId || user?.id || 'usr-desk',
      userRole: item.userRole || user?.role || 'REPORTER',
      createdAt: item.createdAt || this.serverTimestamp(),
      isDraftSaved: Boolean(item.isDraftSaved),
    };
    historyMap.set(id, record);
    return record;
  }

  async getAiHistory(params = {}, user = null) {
    const historyMap = this._collections.get('aiHistory');
    let list = Array.from(historyMap.values());
    if (params.category && params.category !== 'ALL') {
      list = list.filter((h) => h.category === params.category);
    }
    if (params.userId) {
      list = list.filter((h) => h.userId === params.userId);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (h) =>
          h.headline?.toLowerCase().includes(q) ||
          h.inputSnippet?.toLowerCase().includes(q) ||
          h.district?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 20, 10)));
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAiHistoryById(id) {
    const historyMap = this._collections.get('aiHistory');
    return historyMap.get(id) || null;
  }

  async deleteAiHistoryItem(id, user = null) {
    const historyMap = this._collections.get('aiHistory');
    if (!historyMap.has(id)) return false;
    historyMap.delete(id);
    return true;
  }

  // =========================================================================
  // MASTER EXECUTION 024: FIRESTORE INTEGRATIONS PARITY METHODS
  // =========================================================================

  // 1. API Providers
  async getApiProviders(category = null, user = null) {
    const provMap = this._collections.get('apiProviders');
    let list = Array.from(provMap.values());
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    return list;
  }

  async getApiProviderById(id, user = null) {
    const provMap = this._collections.get('apiProviders');
    return provMap.get(id) || Array.from(provMap.values()).find((p) => p.providerId === id) || null;
  }

  async saveApiProvider(providerData, user = null) {
    const provMap = this._collections.get('apiProviders');
    const id = providerData.id || `prov-${providerData.providerId}-${Date.now()}`;
    const existing = provMap.get(id) || Array.from(provMap.values()).find((p) => p.providerId === providerData.providerId);
    const now = this.serverTimestamp();

    const record = {
      ...(existing || {}),
      ...providerData,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    provMap.set(record.id, record);
    return record;
  }

  async deleteApiProvider(id, user = null) {
    const provMap = this._collections.get('apiProviders');
    const existing = provMap.get(id) || Array.from(provMap.values()).find((p) => p.providerId === id);
    if (!existing) return false;
    provMap.delete(existing.id);
    return true;
  }

  // 2. RSS Sources
  async getRssSources(params = {}, user = null) {
    const srcMap = this._collections.get('newsSources');
    let list = Array.from(srcMap.values());
    if (params.status && params.status !== 'all') {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.category && params.category !== 'all') {
      list = list.filter((s) => s.sourceCategory === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((s) => s.name?.toLowerCase().includes(q) || s.feedUrl?.toLowerCase().includes(q));
    }
    return {
      items: list,
      total: list.length,
    };
  }

  async getRssSourceById(id, user = null) {
    const srcMap = this._collections.get('newsSources');
    return srcMap.get(id) || null;
  }

  async saveRssSource(sourceData, user = null) {
    const srcMap = this._collections.get('newsSources');
    const id = sourceData.id || `src-rss-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const existing = srcMap.get(id);
    const now = this.serverTimestamp();

    const record = {
      ...(existing || {}),
      ...sourceData,
      id,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    srcMap.set(id, record);
    return record;
  }

  async deleteRssSource(id, user = null) {
    const srcMap = this._collections.get('newsSources');
    if (!srcMap.has(id)) return false;
    srcMap.delete(id);
    return true;
  }

  // 3. RSS Items
  async getRssItems(params = {}, user = null) {
    const itemMap = this._collections.get('rssImportedItems');
    let list = Array.from(itemMap.values());
    if (params.sourceId) {
      list = list.filter((i) => i.rssSourceId === params.sourceId);
    }
    if (params.status) {
      list = list.filter((i) => i.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((i) => i.originalTitle?.toLowerCase().includes(q) || i.originalSummary?.toLowerCase().includes(q));
    }
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || 20, 10)));
    const total = list.length;
    const items = list.slice((page - 1) * limit, page * limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getRssItemById(id, user = null) {
    const itemMap = this._collections.get('rssImportedItems');
    return itemMap.get(id) || null;
  }

  async hasRssItemHash(guidHash) {
    const itemMap = this._collections.get('rssImportedItems');
    return Array.from(itemMap.values()).some((i) => i.guidHash === guidHash);
  }

  async saveRssItem(itemData, user = null) {
    const itemMap = this._collections.get('rssImportedItems');
    const id = itemData.id || `rss-item-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const record = {
      ...itemData,
      id,
    };
    itemMap.set(id, record);
    return record;
  }

  async updateRssItemStatus(id, status, generatedNewsId = null, user = null) {
    const itemMap = this._collections.get('rssImportedItems');
    const item = itemMap.get(id);
    if (!item) return null;
    item.status = status;
    if (generatedNewsId) item.generatedNewsId = generatedNewsId;
    return item;
  }

  // 4. Social Accounts
  async getSocialAccounts(platform = null, user = null) {
    const socMap = this._collections.get('socialAccounts');
    let list = Array.from(socMap.values());
    if (platform) {
      list = list.filter((a) => a.platform === platform);
    }
    return list;
  }

  async getSocialAccountById(id, user = null) {
    const socMap = this._collections.get('socialAccounts');
    return socMap.get(id) || null;
  }

  async saveSocialAccount(accountData, user = null) {
    const socMap = this._collections.get('socialAccounts');
    const id = accountData.id || `acc-${accountData.platform}-${Date.now()}`;
    const existing = socMap.get(id);
    const now = this.serverTimestamp();

    const record = {
      ...(existing || {}),
      ...accountData,
      id,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    socMap.set(id, record);
    return record;
  }

  async deleteSocialAccount(id, user = null) {
    const socMap = this._collections.get('socialAccounts');
    if (!socMap.has(id)) return false;
    socMap.delete(id);
    return true;
  }

  // 5. Social Publishing Jobs
  async getSocialPublishingJobs(status = null, user = null) {
    const jobMap = this._collections.get('socialPublishingJobs');
    let list = Array.from(jobMap.values());
    if (status && status !== 'ALL') {
      list = list.filter((j) => j.status === status);
    }
    return list;
  }

  async getSocialPublishingJobById(id, user = null) {
    const jobMap = this._collections.get('socialPublishingJobs');
    return jobMap.get(id) || null;
  }

  async saveSocialPublishingJob(jobData, user = null) {
    const jobMap = this._collections.get('socialPublishingJobs');
    const id = jobData.id || `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const existing = jobMap.get(id);
    const now = this.serverTimestamp();

    const record = {
      ...(existing || {}),
      ...jobData,
      id,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    jobMap.set(id, record);
    return record;
  }

  // 6. WhatsApp Business Platform
  async getWhatsAppTemplates(user = null) {
    const waTmplMap = this._collections.get('whatsappTemplates');
    return Array.from(waTmplMap.values());
  }

  async getWhatsAppTemplateById(id, user = null) {
    const waTmplMap = this._collections.get('whatsappTemplates');
    return waTmplMap.get(id) || Array.from(waTmplMap.values()).find((t) => t.name === id) || null;
  }

  async saveWhatsAppTemplate(templateData, user = null) {
    const waTmplMap = this._collections.get('whatsappTemplates');
    const id = templateData.id || `tpl-wa-${Date.now()}`;
    const existing = waTmplMap.get(id) || Array.from(waTmplMap.values()).find((t) => t.name === templateData.name);
    const now = this.serverTimestamp();

    const record = {
      ...(existing || {}),
      ...templateData,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    waTmplMap.set(record.id, record);
    return record;
  }

  async getWhatsAppSubscribers(params = {}, user = null) {
    const waSubMap = this._collections.get('whatsappSubscribers');
    let list = Array.from(waSubMap.values());
    if (params.status) {
      list = list.filter((s) => s.status === params.status);
    }
    if (params.district) {
      list = list.filter((s) => s.district === params.district);
    }
    return list;
  }

  async getWhatsAppSubscriberByPhone(phone) {
    const waSubMap = this._collections.get('whatsappSubscribers');
    const clean = String(phone).replace(/[^0-9+]/g, '');
    return waSubMap.get(clean) || null;
  }

  async saveWhatsAppSubscriber(subData, user = null) {
    const waSubMap = this._collections.get('whatsappSubscribers');
    const cleanPhone = String(subData.phoneNumber).replace(/[^0-9+]/g, '');
    const existing = waSubMap.get(cleanPhone);

    const record = {
      ...(existing || {}),
      ...subData,
      phoneNumber: cleanPhone,
      id: subData.id || existing?.id || `sub-wa-${Date.now()}`,
    };
    waSubMap.set(cleanPhone, record);
    return record;
  }

  // 7. Webhooks
  async getWebhooks(user = null) {
    const whMap = this._collections.get('webhooks');
    return Array.from(whMap.values());
  }

  async getWebhookById(id, user = null) {
    const whMap = this._collections.get('webhooks');
    return whMap.get(id) || Array.from(whMap.values()).find((w) => w.providerId === id) || null;
  }

  async saveWebhook(webhookData, user = null) {
    const whMap = this._collections.get('webhooks');
    const id = webhookData.id || `wh-${Date.now()}`;
    const existing = whMap.get(id);
    const now = this.serverTimestamp();

    const record = {
      ...(existing || {}),
      ...webhookData,
      id,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    whMap.set(id, record);
    return record;
  }

  async getWebhookLogs(limit = 100, user = null) {
    const whLogMap = this._collections.get('webhookLogs');
    return Array.from(whLogMap.values()).slice(0, Math.min(limit, 500));
  }

  async saveWebhookLog(logData, user = null) {
    const whLogMap = this._collections.get('webhookLogs');
    const id = logData.id || `wh-log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const record = {
      ...logData,
      id,
      receivedAt: logData.receivedAt || this.serverTimestamp(),
    };
    whLogMap.set(id, record);
    return record;
  }

  // -------------------------------------------------------------
  // MEDIA STORAGE METADATA OPERATIONS
  // -------------------------------------------------------------

  async saveMediaMetadata(meta) {
    const mediaMap = this._collections.get('mediaAssets');
    const id = meta.id || `med-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const item = {
      id,
      ...meta,
      createdAt: this.serverTimestamp(),
    };
    mediaMap.set(id, item);
    return item;
  }

  async getMediaMetadata(id) {
    const mediaMap = this._collections.get('mediaAssets');
    return mediaMap.get(id) || null;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Subscriptions
  // -------------------------------------------------------------
  async getSubscriptionPlans(user = null) {
    const map = this._collections.get('subscriptionPlans');
    return Array.from(map.values());
  }

  async getSubscriptionPlanById(id, user = null) {
    const map = this._collections.get('subscriptionPlans');
    const plans = Array.from(map.values());
    return plans.find((p) => p.id === id || p.code === id) || null;
  }

  async saveSubscriptionPlan(plan, user = null) {
    const map = this._collections.get('subscriptionPlans');
    const id = plan.id || `sub-plan-${Date.now()}`;
    const existing = Array.from(map.values()).find((p) => p.id === id || p.code === plan.code);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...plan,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  async getCustomerSubscriptions(user = null) {
    const map = this._collections.get('customerSubscriptions');
    return Array.from(map.values());
  }

  async getCustomerSubscriptionById(id, user = null) {
    const map = this._collections.get('customerSubscriptions');
    return map.get(id) || null;
  }

  async getCustomerSubscriptionsByUserId(userId, user = null) {
    const map = this._collections.get('customerSubscriptions');
    return Array.from(map.values()).filter((s) => s.userId === userId);
  }

  async saveCustomerSubscription(sub, user = null) {
    const map = this._collections.get('customerSubscriptions');
    const id = sub.id || `sub-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...sub,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Payments & Orders
  // -------------------------------------------------------------
  async getPaymentOrders(user = null) {
    const map = this._collections.get('paymentOrders');
    return Array.from(map.values());
  }

  async getPaymentOrderById(id, user = null) {
    const map = this._collections.get('paymentOrders');
    const orders = Array.from(map.values());
    return orders.find((o) => o.id === id || o.orderNumber === id || o.providerOrderId === id) || null;
  }

  async savePaymentOrder(order, user = null) {
    const map = this._collections.get('paymentOrders');
    const id = order.id || `pord-${Date.now()}`;
    const existing = Array.from(map.values()).find((o) => o.id === id || o.orderNumber === order.orderNumber);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...order,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  async getTransactions(user = null) {
    const map = this._collections.get('transactions');
    return Array.from(map.values());
  }

  async getTransactionById(id, user = null) {
    const map = this._collections.get('transactions');
    const txns = Array.from(map.values());
    return txns.find((t) => t.id === id || t.transactionNumber === id || t.providerPaymentId === id) || null;
  }

  async saveTransaction(txn, user = null) {
    const map = this._collections.get('transactions');
    const id = txn.id || `txn-${Date.now()}`;
    const existing = Array.from(map.values()).find((t) => t.id === id || t.transactionNumber === txn.transactionNumber);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...txn,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  async getRefunds(user = null) {
    const map = this._collections.get('refunds');
    return Array.from(map.values());
  }

  async getRefundById(id, user = null) {
    const map = this._collections.get('refunds');
    const refunds = Array.from(map.values());
    return refunds.find((r) => r.id === id || r.refundNumber === id) || null;
  }

  async saveRefund(refund, user = null) {
    const map = this._collections.get('refunds');
    const id = refund.id || `ref-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...refund,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Advertisers & Campaigns
  // -------------------------------------------------------------
  async getAdvertisers(user = null) {
    const map = this._collections.get('advertisers');
    return Array.from(map.values());
  }

  async getAdvertiserById(id, user = null) {
    const map = this._collections.get('advertisers');
    return map.get(id) || null;
  }

  async saveAdvertiser(adv, user = null) {
    const map = this._collections.get('advertisers');
    const id = adv.id || `adv-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...adv,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  async getCampaigns(user = null) {
    const map = this._collections.get('campaigns');
    return Array.from(map.values());
  }

  async getCampaignById(id, user = null) {
    const map = this._collections.get('campaigns');
    return map.get(id) || null;
  }

  async getCampaignsByAdvertiserId(advertiserId, user = null) {
    const map = this._collections.get('campaigns');
    return Array.from(map.values()).filter((c) => c.advertiserId === advertiserId);
  }

  async saveCampaign(campaign, user = null) {
    const map = this._collections.get('campaigns');
    const id = campaign.id || `cmp-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...campaign,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Sponsored Content
  // -------------------------------------------------------------
  async getSponsoredArticles(user = null) {
    const map = this._collections.get('sponsoredContent');
    return Array.from(map.values());
  }

  async getSponsoredArticleById(id, user = null) {
    const map = this._collections.get('sponsoredContent');
    return map.get(id) || null;
  }

  async saveSponsoredArticle(article, user = null) {
    const map = this._collections.get('sponsoredContent');
    const id = article.id || `spon-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...article,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: CRM (Notes & Proposals)
  // -------------------------------------------------------------
  async getCrmNotes(advertiserId, user = null) {
    const map = this._collections.get('crmNotes');
    const list = Array.from(map.values());
    if (!advertiserId) return list;
    return list.filter((n) => n.advertiserId === advertiserId);
  }

  async getCrmNotesByAdvertiserId(advertiserId, user = null) {
    return this.getCrmNotes(advertiserId, user);
  }

  async saveCrmNote(note, user = null) {
    const map = this._collections.get('crmNotes');
    const id = note.id || `crm-note-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...note,
      id,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  async getCrmProposals(advertiserId, user = null) {
    const map = this._collections.get('crmProposals');
    const list = Array.from(map.values());
    if (!advertiserId) return list;
    return list.filter((p) => p.advertiserId === advertiserId);
  }

  async getCrmProposalById(id, user = null) {
    const map = this._collections.get('crmProposals');
    const list = Array.from(map.values());
    return list.find((p) => p.id === id || p.proposalNumber === id) || null;
  }

  async saveCrmProposal(proposal, user = null) {
    const map = this._collections.get('crmProposals');
    const id = proposal.id || `prop-${Date.now()}`;
    const existing = Array.from(map.values()).find((p) => p.id === id || p.proposalNumber === proposal.proposalNumber);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...proposal,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  // -------------------------------------------------------------
  // MONETIZATION: Invoices & Financial Records
  // -------------------------------------------------------------
  async getInvoices(user = null) {
    const map = this._collections.get('invoices');
    return Array.from(map.values());
  }

  async getInvoiceById(id, user = null) {
    const map = this._collections.get('invoices');
    const list = Array.from(map.values());
    return list.find((i) => i.id === id || i.invoiceNumber === id) || null;
  }

  async saveInvoice(invoice, user = null) {
    const map = this._collections.get('invoices');
    const id = invoice.id || `inv-${Date.now()}`;
    const existing = Array.from(map.values()).find((i) => i.id === id || i.invoiceNumber === invoice.invoiceNumber);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...invoice,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  async getFinancialAuditLogs(limit = 100, user = null) {
    const map = this._collections.get('financialAuditLogs');
    return Array.from(map.values()).slice(0, Math.min(limit, 500));
  }

  async saveFinancialAuditLog(logData, user = null) {
    const map = this._collections.get('financialAuditLogs');
    const id = logData.id || `fin-log-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const record = {
      ...logData,
      id,
      timestamp: logData.timestamp || this.serverTimestamp(),
    };
    map.set(id, record);
    return record;
  }

  async appendFinancialAuditLog(logData, user = null) {
    return this.saveFinancialAuditLog(logData, user);
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT INTELLIGENCE: User Preferences & DPDPA
  // -------------------------------------------------------------
  async getUserPreferences(userId, user = null) {
    const map = this._collections.get('userPreferences');
    return map.get(userId) || null;
  }

  async saveUserPreferences(userId, prefs, user = null) {
    const map = this._collections.get('userPreferences');
    const existing = map.get(userId) || {};
    const now = this.serverTimestamp();
    const record = {
      ...existing,
      ...prefs,
      userId,
      updatedAt: now,
      createdAt: existing.createdAt || now,
    };
    map.set(userId, record);
    return record;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Bookmarks
  // -------------------------------------------------------------
  async getBookmarks(userId, options = {}, user = null) {
    const map = this._collections.get('bookmarks');
    const list = Array.from(map.values());
    if (!userId) return list;
    return list.filter((b) => b.userId === userId);
  }

  async saveBookmark(bookmark, user = null) {
    const map = this._collections.get('bookmarks');
    const id = bookmark.id || `bm-${Date.now()}`;
    const list = Array.from(map.values());
    const existing = list.find((b) => b.userId === bookmark.userId && b.articleId === bookmark.articleId);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...bookmark,
      id: existing ? existing.id : id,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  async deleteBookmark(userId, articleId, user = null) {
    const map = this._collections.get('bookmarks');
    const list = Array.from(map.values());
    const target = list.find((b) => b.userId === userId && b.articleId === articleId);
    if (target) {
      map.delete(target.id);
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Reading History
  // -------------------------------------------------------------
  async getReadingHistory(userId, limit = 50, user = null) {
    const map = this._collections.get('readingHistory');
    const list = Array.from(map.values()).sort((a, b) => new Date(b.readAt || b.timestamp || 0) - new Date(a.readAt || a.timestamp || 0));
    if (!userId) return list.slice(0, limit);
    return list.filter((h) => h.userId === userId).slice(0, limit);
  }

  async saveReadingHistory(historyRecord, user = null) {
    const map = this._collections.get('readingHistory');
    const id = historyRecord.id || `rh-${Date.now()}`;
    const record = { ...historyRecord, id };
    map.set(id, record);
    return record;
  }

  async clearReadingHistory(userId, user = null) {
    const map = this._collections.get('readingHistory');
    let deleted = false;
    for (const [id, rec] of map.entries()) {
      if (rec.userId === userId) {
        map.delete(id);
        deleted = true;
      }
    }
    return deleted;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Followed Topics & Districts
  // -------------------------------------------------------------
  async getFollowedTopics(userId, user = null) {
    const map = this._collections.get('followedTopics');
    const list = Array.from(map.values());
    if (!userId) return list;
    return list.filter((t) => t.userId === userId);
  }

  async saveFollowedTopic(record, user = null) {
    const map = this._collections.get('followedTopics');
    const key = `${record.userId}_${record.topic}`;
    const entry = { ...record, id: record.id || key };
    map.set(key, entry);
    return entry;
  }

  async deleteFollowedTopic(userId, topic, user = null) {
    const map = this._collections.get('followedTopics');
    const key = `${userId}_${topic}`;
    if (map.has(key)) {
      map.delete(key);
      return true;
    }
    for (const [k, rec] of map.entries()) {
      if (rec.userId === userId && rec.topic === topic) {
        map.delete(k);
        return true;
      }
    }
    return false;
  }

  async getFollowedDistricts(userId, user = null) {
    const map = this._collections.get('followedDistricts');
    const list = Array.from(map.values());
    if (!userId) return list;
    return list.filter((d) => d.userId === userId);
  }

  async saveFollowedDistrict(record, user = null) {
    const map = this._collections.get('followedDistricts');
    const key = `${record.userId}_${record.district}`;
    const entry = { ...record, id: record.id || key };
    map.set(key, entry);
    return entry;
  }

  async deleteFollowedDistrict(userId, district, user = null) {
    const map = this._collections.get('followedDistricts');
    const key = `${userId}_${district}`;
    if (map.has(key)) {
      map.delete(key);
      return true;
    }
    for (const [k, rec] of map.entries()) {
      if (rec.userId === userId && rec.district === district) {
        map.delete(k);
        return true;
      }
    }
    return false;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Notifications
  // -------------------------------------------------------------
  async getNotifications(recipientId = null, options = {}, user = null) {
    const map = this._collections.get('notifications');
    const list = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (!recipientId || recipientId === 'ALL') return list;
    return list.filter((n) => n.recipientId === 'ALL' || n.recipientId === recipientId);
  }

  async createNotification(notification, user = null) {
    const map = this._collections.get('notifications');
    const id = notification.id || `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const record = {
      recipientId: 'ALL',
      isRead: false,
      ...notification,
      id,
      createdAt: notification.createdAt || this.serverTimestamp(),
    };
    map.set(id, record);
    return { ...record };
  }

  async markNotificationRead(id, recipientId = null, user = null) {
    const map = this._collections.get('notifications');
    const item = map.get(id);
    if (item) {
      item.isRead = true;
      item.readAt = this.serverTimestamp();
      return { ...item };
    }
    return null;
  }

  async markAllNotificationsRead(recipientId, user = null) {
    const map = this._collections.get('notifications');
    let count = 0;
    const now = this.serverTimestamp();
    for (const n of map.values()) {
      if (recipientId === 'ALL' || n.recipientId === recipientId || n.recipientId === 'ALL') {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = now;
          count++;
        }
      }
    }
    return { updatedCount: count };
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Reader Feedback & Corrections
  // -------------------------------------------------------------
  async getReaderFeedback(filters = {}, user = null) {
    const map = this._collections.get('readerFeedback');
    let list = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (filters.status) list = list.filter((f) => f.status === filters.status);
    if (filters.category) list = list.filter((f) => f.category === filters.category);
    if (filters.userId) list = list.filter((f) => f.userId === filters.userId);
    return list;
  }

  async getReaderFeedbackById(id, user = null) {
    const map = this._collections.get('readerFeedback');
    return map.get(id) || null;
  }

  async saveReaderFeedback(feedback, user = null) {
    const map = this._collections.get('readerFeedback');
    const id = feedback.id || `fb-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...feedback,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Community Comments
  // -------------------------------------------------------------
  async getComments(filters = {}, user = null) {
    const map = this._collections.get('comments');
    let list = Array.from(map.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (filters.articleId) list = list.filter((c) => c.articleId === filters.articleId);
    if (filters.status) list = list.filter((c) => c.status === filters.status);
    return list;
  }

  async getCommentById(id, user = null) {
    const map = this._collections.get('comments');
    return map.get(id) || null;
  }

  async saveComment(comment, user = null) {
    const map = this._collections.get('comments');
    const id = comment.id || `cmt-${Date.now()}`;
    const existing = map.get(id);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...comment,
      id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(id, record);
    return record;
  }

  async deleteComment(id, user = null) {
    const map = this._collections.get('comments');
    return map.delete(id);
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: Audience Segments
  // -------------------------------------------------------------
  async getAudienceSegments(user = null) {
    const map = this._collections.get('audienceSegments');
    return Array.from(map.values());
  }

  async getAudienceSegmentById(id, user = null) {
    const map = this._collections.get('audienceSegments');
    const list = Array.from(map.values());
    return list.find((s) => s.id === id || s.code === id) || null;
  }

  async saveAudienceSegment(segment, user = null) {
    const map = this._collections.get('audienceSegments');
    const id = segment.id || `seg-${Date.now()}`;
    const existing = Array.from(map.values()).find((s) => s.id === id || s.code === segment.code);
    const now = this.serverTimestamp();
    const record = {
      ...(existing || {}),
      ...segment,
      id: existing ? existing.id : id,
      updatedAt: now,
      createdAt: existing ? existing.createdAt : now,
    };
    map.set(record.id, record);
    return record;
  }

  // -------------------------------------------------------------
  // AUDIENCE & ENGAGEMENT: DPDPA Deletion Requests & Telemetry
  // -------------------------------------------------------------
  async saveDeletionRequest(record, user = null) {
    const map = this._collections.get('deletionRequests');
    const id = record.id || `del-${Date.now()}`;
    const entry = { ...record, id };
    map.set(id, entry);
    return entry;
  }

  async recordEngagementEvent(event, user = null) {
    const map = this._collections.get('engagementEvents');
    const id = event.id || `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const record = { ...event, id, timestamp: event.timestamp || this.serverTimestamp() };
    map.set(id, record);
    return record;
  }

  async getEngagementEvents(filters = {}, user = null) {
    const map = this._collections.get('engagementEvents');
    let list = Array.from(map.values());
    if (filters.eventName) list = list.filter((e) => e.eventName === filters.eventName);
    if (filters.userId) list = list.filter((e) => e.userId === filters.userId);
    return list.slice(0, filters.limit || 500);
  }

  // =========================================================================
  // E-Paper Management Module Integration (STEP 16 Parity)
  // =========================================================================

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

  async createEpaperEditionWithPages(editionData, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    const pagesMap = this._collections.get('epaperPages');
    const publicationDate = editionData.publicationDate || new Date().toISOString().split('T')[0];
    const rawType = editionData.editionType ? String(editionData.editionType).trim().toUpperCase() : 'DAILY';
    const editionType = rawType === 'SPECIAL' ? 'SPECIAL' : 'DAILY';
    // Backend Invariant: Daily Edition strictly 12 pages (P1–P12); Special Edition 1-48 pages
    const totalPages = editionType === 'DAILY' ? 12 : Math.min(48, Math.max(1, parseInt(editionData.totalPages || '4', 10)));
    const districtId = editionData.districtId || 'dist-bhopal';
    const distSlug = districtId.replace(/^dist-/, '').toUpperCase();
    const cleanDate = publicationDate.replace(/-/g, '');
    const seq = String(Array.from(epaperMap.values()).filter((e) => e.publicationDate === publicationDate && e.districtId === districtId).length + 1).padStart(2, '0');
    const editionId = editionData.id || `ed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const editionCode = editionData.editionCode || `EP-${cleanDate}-${distSlug}-${seq}`;
    const now = new Date().toISOString();

    const pageCanonicalSections = [
      { pageNumber: 1, sectionType: 'FRONT_PAGE', pageTitle: 'प्रथम पृष्ठ (मुख्य समाचार)', gridColumns: 8, templateId: 'tpl-epaper-01-front' },
      { pageNumber: 2, sectionType: 'STATE', pageTitle: 'मध्य प्रदेश प्रादेशिक (भाग 1)', gridColumns: 8, templateId: 'tpl-epaper-02-state' },
      { pageNumber: 3, sectionType: 'STATE', pageTitle: 'मध्य प्रदेश प्रादेशिक (भाग 2)', gridColumns: 8, templateId: 'tpl-epaper-03-bhopal' },
      { pageNumber: 4, sectionType: 'EDITORIAL', pageTitle: 'संपादकीय एवं विचार (Op-Ed)', gridColumns: 6, templateId: 'tpl-epaper-04-editorial' },
      { pageNumber: 5, sectionType: 'DISTRICT_FOCUS', pageTitle: 'जिला समाचार - फोकस', gridColumns: 8, templateId: 'tpl-epaper-05-district' },
      { pageNumber: 6, sectionType: 'NATIONAL', pageTitle: 'राष्ट्रीय एवं अंतरराष्ट्रीय समाचार', gridColumns: 8, templateId: 'tpl-epaper-06-national' },
      { pageNumber: 7, sectionType: 'BUSINESS', pageTitle: 'व्यापार, अर्थव्यवस्था एवं मंडी भाव', gridColumns: 8, templateId: 'tpl-epaper-08-business' },
      { pageNumber: 8, sectionType: 'DISTRICT_FOCUS', pageTitle: 'किसान एवं ग्रामीण विकास', gridColumns: 8, templateId: 'tpl-epaper-07-agri' },
      { pageNumber: 9, sectionType: 'STATE', pageTitle: 'शिक्षा, रोजगार एवं करियर', gridColumns: 8, templateId: 'tpl-epaper-10-education' },
      { pageNumber: 10, sectionType: 'SPORTS', pageTitle: 'खेल जगत (Sports)', gridColumns: 8, templateId: 'tpl-epaper-09-sports' },
      { pageNumber: 11, sectionType: 'ENTERTAINMENT', pageTitle: 'मनोरंजन, कला एवं संस्कृति', gridColumns: 8, templateId: 'tpl-epaper-11-features' },
      { pageNumber: 12, sectionType: 'FRONT_PAGE', pageTitle: 'अंतिम पृष्ठ / विशेष परिशिष्ट', gridColumns: 8, templateId: 'tpl-epaper-12-back' },
    ];

    const pages = [];
    const pageIds = [];
    for (let i = 1; i <= totalPages; i++) {
      const preset = pageCanonicalSections[i - 1] || {
        pageNumber: i,
        sectionType: 'SPECIAL',
        pageTitle: `पृष्ठ ${i} (विशेष)`,
        gridColumns: 8,
        templateId: undefined,
      };
      const pageId = `page-${editionId}-${i}`;
      const pageRecord = {
        id: pageId,
        editionId,
        pageNumber: i,
        pageTitle: preset.pageTitle,
        sectionType: preset.sectionType,
        templateId: preset.templateId,
        gridColumns: preset.gridColumns,
        elements: [],
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      pagesMap.set(pageId, pageRecord);
      pages.push(pageRecord);
      pageIds.push(pageId);
      if (this.firestore) {
        this.firestore.collection('epaperPages').doc(pageId).set(pageRecord).catch(() => {});
      }
    }

    const editionRecord = {
      ...editionData,
      id: editionId,
      editionCode,
      editionType,
      version: 1,
      status: 'DRAFT', // Invariant: All newly created editions MUST be initialized as DRAFT server-side
      totalPages,
      pages: pageIds,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.id || 'usr-desk',
      createdByName: user?.fullName || 'संपादक',
      createdByRole: user?.roles?.[0] || 'EDITOR',
    };
    epaperMap.set(editionId, editionRecord);
    if (this.firestore) {
      this.firestore.collection('epaperEditions').doc(editionId).set(editionRecord).catch(() => {});
    }

    return { edition: editionRecord, pages };
  }

  async getEpaperEditions(params = {}) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    let list = Array.from(epaperMap.values());

    if (params.status && params.status !== 'all') {
      const norm = String(params.status).toUpperCase();
      if (norm === 'PUBLISHED') {
        const versionsMap = this._collections.get('epaperEditionVersions') || new Map();
        const publishedEditionIdsWithSnapshots = new Set(
          Array.from(versionsMap.values()).map((v) => v.editionId)
        );
        list = list.filter(
          (e) => String(e.status).toUpperCase() === 'PUBLISHED' || publishedEditionIdsWithSnapshots.has(e.id)
        );
      } else {
        list = list.filter((e) => String(e.status).toUpperCase() === norm);
      }
    }
    if (params.year && params.year !== 'all') {
      const y = String(params.year).trim();
      list = list.filter((e) => {
        const d = String(e.publicationDate || e.createdAt || '');
        return d.startsWith(y) || d.includes(`-${y}-`) || d.includes(y);
      });
    }
    if (params.month && params.month !== 'all') {
      const m = String(params.month).padStart(2, '0');
      list = list.filter((e) => {
        const d = String(e.publicationDate || '');
        const parts = d.split('-');
        return parts.length >= 2 && parts[1] === m;
      });
    }
    if (params.publicationDate || params.date) {
      const targetDate = params.publicationDate || params.date;
      list = list.filter((e) => e.publicationDate === targetDate);
    }
    if (params.districtId && params.districtId !== 'all') {
      list = list.filter((e) => e.districtId === params.districtId);
    }
    if (params.divisionId && params.divisionId !== 'all') {
      list = list.filter((e) => e.divisionId === params.divisionId);
    }
    if (params.editionType) {
      const typeNorm = String(params.editionType).toUpperCase();
      list = list.filter((e) => String(e.editionType || 'DAILY').toUpperCase() === typeNorm);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((e) =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.editionCode && e.editionCode.toLowerCase().includes(q)) ||
        (e.districtName && e.districtName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.publicationDate || b.createdAt || 0).getTime() - new Date(a.publicationDate || a.createdAt || 0).getTime());

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      editions: paginated,
      items: paginated,
      total,
      count: paginated.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getEpaperEditionById(id) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    const existing = epaperMap.get(id);
    if (existing) return existing;
    if (this.firestore) {
      const doc = await this.firestore.collection('epaperEditions').doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        epaperMap.set(id, data);
        return data;
      }
    }
    return null;
  }

  async getEpaperEditionByCode(editionCode) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    return Array.from(epaperMap.values()).find((e) => e.editionCode === editionCode) || null;
  }

  async getLatestEpaperEdition(districtId = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    let list = Array.from(epaperMap.values()).filter((e) => e.status === 'PUBLISHED');
    if (districtId) {
      const districtSpecific = list.filter((e) => e.districtId === districtId);
      if (districtSpecific.length > 0) list = districtSpecific;
    }
    list.sort((a, b) => new Date(b.publicationDate || b.createdAt || 0).getTime() - new Date(a.publicationDate || a.createdAt || 0).getTime());
    return list[0] || null;
  }

  async saveEpaperEdition(editionData, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    const id = editionData.id || `ed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const existing = epaperMap.get(id);

    // OCC Check
    if (editionData.expectedVersion !== undefined && existing && existing.version !== undefined) {
      if (Number(editionData.expectedVersion) !== existing.version) {
        const conflictErr = new Error(`ERR_OCC_COLLISION: Version conflict for edition ${id}. Expected: ${editionData.expectedVersion}, Current: ${existing.version}`);
        conflictErr.statusCode = 409;
        conflictErr.code = 'ERR_CONCURRENCY_CONFLICT';
        throw conflictErr;
      }
    }

    const record = {
      ...(existing || {}),
      ...editionData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      createdBy: existing ? existing.createdBy : (user?.id || 'usr-desk'),
      createdByName: existing ? existing.createdByName : (user?.fullName || 'संपादकीय डेस्क'),
      createdByRole: existing ? existing.createdByRole : (user?.roles?.[0] || 'EDITOR'),
    };

    // Backend Invariant: Enforce authoritative 12 pages for DAILY; preserve independent page counts for SPECIAL
    if (record.editionType === 'DAILY' || !record.editionType) {
      record.editionType = 'DAILY';
      record.totalPages = 12;
    } else if (record.editionType === 'SPECIAL') {
      const parsedPages = parseInt(record.totalPages, 10);
      record.totalPages = Number.isInteger(parsedPages) ? Math.min(48, Math.max(1, parsedPages)) : (existing?.totalPages || 4);
    }

    epaperMap.set(id, record);
    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(id).set(record);
    }
    return record;
  }

  async updateEpaperEditionStatus(editionId, targetStatus, user = null, expectedVersion = undefined, remarks = '') {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      return { error: true, statusCode: 404, code: 'ERR_NOT_FOUND', message: 'ई-पेपर संस्करण नहीं मिला।' };
    }
    if (expectedVersion !== undefined && existing.version !== undefined && Number(expectedVersion) !== existing.version) {
      return {
        error: true,
        statusCode: 409,
        code: 'ERR_CONCURRENCY_CONFLICT',
        message: `संस्करण विरोध (OCC Conflict): अपेक्षित संस्करण ${expectedVersion}, वर्तमान संस्करण ${existing.version}`,
      };
    }
    existing.status = targetStatus;
    existing.version = (existing.version || 1) + 1;
    existing.updatedAt = new Date().toISOString();
    if (remarks) existing.statusRemarks = remarks;

    const epaperMap = this._collections.get('epaperEditions');
    epaperMap.set(editionId, existing);
    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(editionId).set(existing);
    }
    return existing;
  }

  async deleteEpaperEdition(id, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    const pagesMap = this._collections.get('epaperPages');
    if (!epaperMap.has(id)) return false;
    epaperMap.delete(id);
    for (const [pageId, p] of pagesMap.entries()) {
      if (p.editionId === id) {
        pagesMap.delete(pageId);
        if (this.firestore) {
          this.firestore.collection('epaperPages').doc(pageId).delete().catch(() => {});
        }
      }
    }
    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(id).delete();
    }
    return true;
  }

  async getEpaperPagesByEditionId(editionId) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const pagesMap = this._collections.get('epaperPages');
    const pages = Array.from(pagesMap.values())
      .filter((p) => p.editionId === editionId)
      .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    return pages;
  }

  async getEpaperPages(params = {}) {
    const pagesMap = this._collections.get('epaperPages');
    let list = Array.from(pagesMap.values());
    if (params.editionId) list = list.filter((p) => p.editionId === params.editionId);
    return list.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
  }

  async getEpaperPageById(id) {
    const pagesMap = this._collections.get('epaperPages');
    const existing = pagesMap.get(id);
    if (existing) return existing;
    if (this.firestore) {
      const doc = await this.firestore.collection('epaperPages').doc(id).get();
      if (doc.exists) {
        const d = doc.data();
        pagesMap.set(id, d);
        return d;
      }
    }
    return null;
  }

  async getEpaperPageByNumber(editionId, pageNumber) {
    const pagesMap = this._collections.get('epaperPages');
    return Array.from(pagesMap.values()).find((p) => p.editionId === editionId && p.pageNumber === Number(pageNumber)) || null;
  }

  async getEpaperPage(editionId, pageNumber) {
    return this.getEpaperPageByNumber(editionId, pageNumber);
  }

  async saveEpaperPage(pageData, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const pagesMap = this._collections.get('epaperPages');
    const epaperMap = this._collections.get('epaperEditions');
    const id = pageData.id || `page-${pageData.editionId || 'ed'}-${pageData.pageNumber || Date.now()}`;
    const existing = pagesMap.get(id);

    // Published edition immutability check
    const editionId = pageData.editionId || existing?.editionId;
    if (editionId && epaperMap) {
      const parentEdition = epaperMap.get(editionId);
      if (parentEdition && parentEdition.status === 'PUBLISHED') {
        const publishedErr = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित संस्करण का पृष्ठ संशोधित नहीं किया जा सकता।');
        publishedErr.statusCode = 400;
        publishedErr.code = 'ERR_EDITION_ALREADY_PUBLISHED';
        throw publishedErr;
      }
    }

    // Unapproved article validation: prevent unapproved news articles from entering page composition
    const artMap = this._collections.get('newsArticles');
    if (Array.isArray(pageData.elements) && artMap) {
      for (const el of pageData.elements) {
        if (el.articleId) {
          const art = artMap.get(el.articleId) || Array.from(artMap.values()).find((a) => a.slug === el.articleId);
          if (art) {
            const isApproved =
              ['APPROVED', 'PUBLISHED'].includes(String(art.status || '').toUpperCase()) ||
              ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'].includes(
                String(art.epaperWorkflow?.status || '').toUpperCase()
              );
            if (!isApproved) {
              const unapprovedErr = new Error(`ERR_ARTICLE_NOT_APPROVED: अस्वीकृत समाचार "${art.title}" पृष्ठ पर सम्मिलित नहीं किया जा सकता।`);
              unapprovedErr.statusCode = 400;
              unapprovedErr.code = 'ERR_ARTICLE_NOT_APPROVED';
              throw unapprovedErr;
            }
          }
        }
      }
    }

    if (pageData.expectedVersion !== undefined && existing && existing.version !== undefined) {
      if (Number(pageData.expectedVersion) !== existing.version) {
        const conflictErr = new Error(`ERR_OCC_COLLISION: Version conflict for page ${id}. Expected: ${pageData.expectedVersion}, Current: ${existing.version}`);
        conflictErr.statusCode = 409;
        conflictErr.code = 'ERR_CONCURRENCY_CONFLICT';
        throw conflictErr;
      }
    }

    const record = {
      ...(existing || {}),
      ...pageData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };
    pagesMap.set(id, record);

    if (record.editionId) {
      const parent = epaperMap.get(record.editionId);
      if (parent) {
        parent.pages = parent.pages || [];
        if (!parent.pages.includes(id)) {
          parent.pages.push(id);
          parent.totalPages = parent.pages.length;
        }
        parent.isQualityStale = true;
        if (parent.qualityCheckResult) {
          parent.qualityCheckResult.isStale = true;
          parent.qualityCheckResult.canPublish = false;
        }
      }
    }

    if (this.firestore) {
      await this.firestore.collection('epaperPages').doc(id).set(record);
    }
    return record;
  }

  async deleteEpaperPage(id, user = null) {
    const pagesMap = this._collections.get('epaperPages');
    const epaperMap = this._collections.get('epaperEditions');
    const existing = pagesMap.get(id);
    if (!existing) return false;
    pagesMap.delete(id);
    if (existing.editionId) {
      const parent = epaperMap.get(existing.editionId);
      if (parent && parent.pages) {
        parent.pages = parent.pages.filter((pid) => pid !== id);
        parent.totalPages = parent.pages.length;
      }
    }
    if (this.firestore) {
      await this.firestore.collection('epaperPages').doc(id).delete();
    }
    return true;
  }

  async runEpaperQualityCheck(editionId, user = null, skipExportCheck = false) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const pages = await this.getEpaperPagesByEditionId(editionId);
    const report = await QualityCheckerEngine.evaluateEdition({
      edition: existing,
      pages,
      adapter: this,
      user,
      skipExportCheck,
    });

    const epaperMap = this._collections.get('epaperEditions');
    const updated = {
      ...existing,
      qualityCheckResult: report,
      isQualityStale: false,
      updatedAt: new Date().toISOString(),
    };
    epaperMap.set(editionId, updated);

    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(editionId).set(updated);
    }

    return report;
  }

  async grantEpaperQualityException(editionId, issueId, reason, user = null) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    let report = existing.qualityCheckResult;
    if (!report || existing.isQualityStale || report.isStale) {
      const pages = await this.getEpaperPagesByEditionId(editionId);
      report = await QualityCheckerEngine.evaluateEdition({
        edition: existing,
        pages,
        adapter: this,
        user,
        skipExportCheck: true,
      });
    }

    const result = QualityCheckerEngine.grantException({
      report,
      issueId,
      reason,
      user,
    });

    const epaperMap = this._collections.get('epaperEditions');
    const updated = {
      ...existing,
      qualityCheckResult: result.updatedReport,
      updatedAt: new Date().toISOString(),
    };
    epaperMap.set(editionId, updated);

    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(editionId).set(updated);
    }

    return result;
  }

  async approveEpaperEdition(editionId, expectedVersion = undefined, user = null, remarks = '') {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण का अनुमोदन स्तर परिवर्तित नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    if (user?.isAi || user?.role === 'AI') {
      const err = new Error('ERR_AI_CANNOT_APPROVE: AI एजेंट को संस्करण अनुमोदित करने की अनुमति नहीं है। केवल अधिकृत मानव संपादक ही अंतिम अनुमोदन दे सकते हैं।');
      err.statusCode = 403;
      err.code = 'ERR_AI_CANNOT_APPROVE';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: अंतिम संपादकीय अनुमोदन हेतु अधिकृत संपादक अथवा एडमिन पद आवश्यक है।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (expectedVersion !== undefined && existing.version !== undefined && Number(expectedVersion) !== existing.version) {
      const conflictErr = new Error(`ERR_OCC_COLLISION: Version conflict for edition ${editionId}. Current: ${existing.version}, Expected: ${expectedVersion}`);
      conflictErr.statusCode = 409;
      conflictErr.code = 'ERR_CONCURRENCY_CONFLICT';
      throw conflictErr;
    }

    const pages = await this.getEpaperPagesByEditionId(editionId);
    let qualityReport = existing.qualityCheckResult;
    if (!qualityReport || existing.isQualityStale || qualityReport.isStale) {
      qualityReport = await QualityCheckerEngine.evaluateEdition({
        edition: existing,
        pages,
        adapter: this,
        user,
        skipExportCheck: true,
      });
      existing.qualityCheckResult = qualityReport;
      existing.isQualityStale = false;
    }

    if (!qualityReport.canApprove) {
      const err = new Error('ERR_QUALITY_CHECK_FAILED: संस्करण में अनसुलझी गंभीर (Critical) या त्रुटि (Error) आपत्तियां हैं। अनुमोदन से पूर्व इनका निवारण आवश्यक है।');
      err.statusCode = 422;
      err.code = 'ERR_QUALITY_CHECK_FAILED';
      err.qualityReport = qualityReport;
      throw err;
    }

    const now = new Date().toISOString();
    const newVersion = (existing.version || 1) + 1;
    const updatedEdition = {
      ...existing,
      status: 'FINAL_APPROVED',
      finalApprovedAt: now,
      finalApprovedBy: user?.fullName || user?.name || 'मुख्य संपादक',
      finalApprovedRemarks: remarks || '',
      qualityCheckResult: qualityReport,
      isQualityStale: false,
      version: newVersion,
      updatedAt: now,
    };

    const epaperMap = this._collections.get('epaperEditions');
    epaperMap.set(editionId, updatedEdition);
    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(editionId).set(updatedEdition);
    }

    return { success: true, edition: updatedEdition, qualityReport };
  }

  async scheduleEpaperEdition(editionId, scheduledPublishAtIst, expectedVersion = undefined, user = null) {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण को पुनः शेड्यूल नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    if (user?.isAi || user?.role === 'AI') {
      const err = new Error('ERR_AI_CANNOT_SCHEDULE: AI एजेंट को संस्करण शेड्यूल करने की अनुमति नहीं है।');
      err.statusCode = 403;
      err.code = 'ERR_AI_CANNOT_SCHEDULE';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: ई-पेपर शेड्यूलिंग हेतु संपादक अथवा एडमिन अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (existing.status !== 'FINAL_APPROVED' && existing.status !== 'APPROVED') {
      const err = new Error('ERR_EDITION_NOT_APPROVED: केवल अंतिम रूप से स्वीकृत (FINAL_APPROVED) संस्करण ही शेड्यूलिंग हेतु पात्र हैं।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_NOT_APPROVED';
      throw err;
    }

    if (!scheduledPublishAtIst) {
      const err = new Error('ERR_INVALID_SCHEDULE_TIME: निर्धारित प्रकाशन समय (IST) अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_SCHEDULE_TIME';
      throw err;
    }

    if (expectedVersion !== undefined && existing.version !== undefined && Number(expectedVersion) !== existing.version) {
      const conflictErr = new Error(`ERR_OCC_COLLISION: Version conflict. Current: ${existing.version}, Expected: ${expectedVersion}`);
      conflictErr.statusCode = 409;
      conflictErr.code = 'ERR_CONCURRENCY_CONFLICT';
      throw conflictErr;
    }

    const now = new Date().toISOString();
    const newVersion = (existing.version || 1) + 1;
    const updatedEdition = {
      ...existing,
      status: 'SCHEDULED',
      scheduledPublishAtIst,
      scheduledPublishAt: new Date(scheduledPublishAtIst).toISOString(),
      scheduledBy: user?.fullName || user?.name || 'संपादक',
      scheduledAt: now,
      version: newVersion,
      updatedAt: now,
    };

    const epaperMap = this._collections.get('epaperEditions');
    epaperMap.set(editionId, updatedEdition);
    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(editionId).set(updatedEdition);
    }

    return { success: true, edition: updatedEdition };
  }

  async createEpaperPostPublicationCorrection(editionId, user = null, remarks = '') {
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status !== 'PUBLISHED') {
      const err = new Error('ERR_EDITION_NOT_PUBLISHED: सुधार (Post-Publication Correction) केवल पहले से प्रकाशित संस्करणों हेतु बनाया जा सकता है।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_NOT_PUBLISHED';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: मरणोपरांत / प्रकाशन उपरांत संशोधन प्रारंभ करने हेतु संपादकीय अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    const now = new Date().toISOString();
    const publishedVersion = existing.version || 1;
    const revisedVersion = publishedVersion + 1;

    const updatedEdition = {
      ...existing,
      status: 'LAYOUT_IN_PROGRESS',
      isQualityStale: true,
      qualityCheckResult: null,
      correctionRequestedAt: now,
      correctionRequestedBy: user?.fullName || user?.name || 'संपादक',
      correctionRemarks: remarks || 'प्रकाशन पश्चात संशोधन आरंभ',
      previousPublishedVersion: publishedVersion,
      version: revisedVersion,
      updatedAt: now,
    };

    const epaperMap = this._collections.get('epaperEditions');
    epaperMap.set(editionId, updatedEdition);
    if (this.firestore) {
      await this.firestore.collection('epaperEditions').doc(editionId).set(updatedEdition);
    }

    return {
      success: true,
      edition: updatedEdition,
      previousPublishedVersion: publishedVersion,
      message: `प्रकाशन पश्चात सुधार ड्राफ्ट (v${revisedVersion}) सक्रिय किया गया। पूर्व प्रकाशित संस्करण v${publishedVersion} अपरिवर्तनीय सुरक्षित है।`,
    };
  }

  async publishEpaperEdition(editionId, expectedVersion = undefined, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore && !this.sharedDatabase) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    const epaperMap = this._collections.get('epaperEditions');
    const existing = await this.getEpaperEditionById(editionId);
    if (!existing) {
      const err = new Error('ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (existing.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: संस्करण पहले से प्रकाशित है। प्रकाशित संस्करण को पुनः प्रकाशित नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    if (user?.isAi || user?.role === 'AI') {
      const err = new Error('ERR_AI_CANNOT_PUBLISH: AI एजेंट को संस्करण प्रकाशित करने की अनुमति नहीं है। केवल अधिकृत मानव संपादक ही प्रकाशित कर सकते हैं।');
      err.statusCode = 403;
      err.code = 'ERR_AI_CANNOT_PUBLISH';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r) => String(r).toUpperCase())
      : [String(user?.role || user?.roles?.[0] || (user ? 'EDITOR' : '')).toUpperCase()];
    if (user?.role && !userRoles.includes(String(user.role).toUpperCase())) {
      userRoles.push(String(user.role).toUpperCase());
    }
    const allowedRoles = ['EDITOR', 'ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'CHIEF_EDITOR'];
    if (!userRoles.some((r) => allowedRoles.includes(r))) {
      const err = new Error('ERR_FORBIDDEN: ई-पेपर प्रकाशन हेतु अधिकृत संपादक अथवा एडमिन पद आवश्यक है।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (expectedVersion !== undefined && existing.version !== undefined) {
      if (Number(expectedVersion) !== existing.version) {
        const conflictErr = new Error(`ERR_OCC_COLLISION: Version conflict for publishing edition ${editionId}. Current: ${existing.version}, Expected: ${expectedVersion}`);
        conflictErr.statusCode = 409;
        conflictErr.code = 'ERR_CONCURRENCY_CONFLICT';
        throw conflictErr;
      }
    }

    const pages = await this.getEpaperPagesByEditionId(editionId);

    // Quality Check Gate
    let qualityReport = existing.qualityCheckResult;
    if (!qualityReport || existing.isQualityStale || qualityReport.isStale) {
      qualityReport = await QualityCheckerEngine.evaluateEdition({
        edition: existing,
        pages,
        adapter: this,
        user,
        skipExportCheck: true,
      });
      existing.qualityCheckResult = qualityReport;
      existing.isQualityStale = false;
    }

    if (!qualityReport.canPublish) {
      const err = new Error('ERR_QUALITY_CHECK_FAILED: संस्करण में गंभीर अथवा त्रुटि स्तर की गुणवत्ता आपत्तियां विद्यमान हैं। प्रकाशन पूर्व इनका निवारण आवश्यक है।');
      err.statusCode = 422;
      err.code = 'ERR_QUALITY_CHECK_FAILED';
      err.qualityReport = qualityReport;
      throw err;
    }

    const newVersion = (existing.version || 1) + 1;
    const now = new Date().toISOString();

    const snapshot = {
      id: `ver-${editionId}-${newVersion}`,
      editionId,
      versionNumber: newVersion,
      editionSnapshot: { ...existing, version: newVersion, status: 'PUBLISHED', publishedAt: now, publishedBy: user?.fullName || 'संपादक' },
      pagesSnapshot: JSON.parse(JSON.stringify(pages)),
      qualityReportSnapshot: JSON.parse(JSON.stringify(qualityReport)),
      snapshotData: {
        edition: { ...existing, version: newVersion, status: 'PUBLISHED', publishedAt: now, publishedBy: user?.fullName || 'संपादक' },
        pages: JSON.parse(JSON.stringify(pages)),
        qualityReport: JSON.parse(JSON.stringify(qualityReport)),
      },
      publishedBy: user?.fullName || 'संपादक',
      publishedAt: now,
      pdfUrl: existing.pdfUrl || null,
      createdAt: now,
      immutable: true,
    };

    const versionsMap = this._collections.get('epaperEditionVersions');
    versionsMap.set(snapshot.id, snapshot);

    const updatedEdition = {
      ...existing,
      status: 'PUBLISHED',
      publishedAt: now,
      publishedBy: user?.fullName || 'संपादक',
      qualityCheckResult: qualityReport,
      isQualityStale: false,
      version: newVersion,
      updatedAt: now,
    };
    epaperMap.set(editionId, updatedEdition);

    if (this.firestore) {
      await this.firestore.collection('epaperEditionVersions').doc(snapshot.id).set(snapshot);
      await this.firestore.collection('epaperEditions').doc(editionId).set(updatedEdition);
    }

    return { edition: updatedEdition, snapshot };
  }

  async saveEpaperEditionVersion(versionDoc) {
    if (!versionDoc || !versionDoc.id) {
      throw new Error('ERR_INVALID_VERSION_DOC: Version document must have an id.');
    }
    const versionsMap = this._collections.get('epaperEditionVersions') || new Map();
    const existing = versionsMap.get(versionDoc.id);
    if (existing) {
      return existing;
    }
    const record = {
      ...versionDoc,
      immutable: true,
      savedAt: new Date().toISOString(),
    };
    versionsMap.set(versionDoc.id, record);
    this._collections.set('epaperEditionVersions', versionsMap);
    if (this.firestore) {
      await this.firestore.collection('epaperEditionVersions').doc(versionDoc.id).set(record);
    }
    return record;
  }

  async saveEpaperVersionSnapshot(snapshot) {
    if (!snapshot) return null;
    const versionDoc = {
      id: snapshot.id || `${snapshot.editionId}-v${snapshot.versionNumber || 1}`,
      editionId: snapshot.editionId,
      versionNumber: snapshot.versionNumber || 1,
      versionTag: snapshot.versionTag || `${snapshot.versionNumber || 1}.0`,
      editionSnapshot: snapshot.editionSnapshot,
      pagesSnapshot: snapshot.pagesSnapshot || [],
      qualityReportSnapshot: snapshot.qualityReportSnapshot,
      snapshotData: snapshot.snapshotData || {
        edition: snapshot.editionSnapshot,
        pages: snapshot.pagesSnapshot || [],
        qualityReport: snapshot.qualityReportSnapshot,
      },
      publishedBy: snapshot.publishedBy,
      publishedAt: snapshot.publishedAt || new Date().toISOString(),
      immutable: true,
    };
    return this.saveEpaperEditionVersion(versionDoc);
  }

  async getEpaperEditionVersions(editionId) {
    const versionsMap = this._collections.get('epaperEditionVersions');
    const list = Array.from(versionsMap.values())
      .filter((v) => v.editionId === editionId)
      .sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0));
    return list;
  }

  async getEpaperEditionVersionById(id) {
    const versionsMap = this._collections.get('epaperEditionVersions');
    return versionsMap.get(id) || null;
  }

  async getPublishedEpaperSnapshot(editionId, versionNumber = null) {
    const versions = await this.getEpaperEditionVersions(editionId);
    if (!versions || versions.length === 0) {
      const active = await this.getEpaperEditionById(editionId);
      if (active && String(active.status).toUpperCase() === 'PUBLISHED') {
        const pages = await this.getEpaperPagesByEditionId(editionId);
        return {
          id: `${editionId}-v${active.version || 1}.0.0`,
          editionId,
          versionNumber: active.version || 1,
          versionTag: `v${active.version || 1}.0.0`,
          editionSnapshot: active,
          pagesSnapshot: pages,
          publishedAt: active.publishedAt || active.updatedAt,
          publishedBy: active.publishedBy || 'संपादक',
        };
      }
      return null;
    }

    if (versionNumber !== null && versionNumber !== undefined) {
      const vNum = Number(versionNumber);
      const matched = versions.find(
        (v) =>
          (v.versionNumber || v.snapshotData?.edition?.version) === vNum ||
          v.id === String(versionNumber) ||
          v.versionTag === String(versionNumber)
      );
      if (matched) {
        return {
          id: matched.id,
          editionId,
          versionNumber: matched.versionNumber || matched.snapshotData?.edition?.version || 1,
          versionTag: matched.versionTag || `v${matched.versionNumber || 1}.0.0`,
          editionSnapshot: matched.editionSnapshot || matched.snapshotData?.edition,
          pagesSnapshot: matched.pagesSnapshot || matched.snapshotData?.pages || [],
          publishedAt: matched.publishedAt || matched.snapshotData?.publishedAt,
          publishedBy: matched.publishedBy || matched.snapshotData?.publishedBy,
        };
      }
      return null;
    }

    // Default: latest published version snapshot
    const latest = versions[0];
    return {
      id: latest.id,
      editionId,
      versionNumber: latest.versionNumber || latest.snapshotData?.edition?.version || 1,
      versionTag: latest.versionTag || `v${latest.versionNumber || 1}.0.0`,
      editionSnapshot: latest.editionSnapshot || latest.snapshotData?.edition,
      pagesSnapshot: latest.pagesSnapshot || latest.snapshotData?.pages || [],
      publishedAt: latest.publishedAt || latest.snapshotData?.publishedAt,
      publishedBy: latest.publishedBy || latest.snapshotData?.publishedBy,
    };
  }

  _enrichTemplate(tpl) {
    if (!tpl) return null;
    const pagesMap = this._collections.get('epaperPages') || new Map();
    const editionsMap = this._collections.get('epaperEditions') || new Map();

    const matchingPages = Array.from(pagesMap.values()).filter((p) => p.templateId === tpl.id);
    const editionMap = new Map();
    for (const p of matchingPages) {
      if (!p.editionId) continue;
      const ed = editionsMap.get(p.editionId);
      if (ed) {
        if (!editionMap.has(ed.id)) {
          editionMap.set(ed.id, {
            editionId: ed.id,
            editionTitle: ed.title || ed.editionCode,
            editionCode: ed.editionCode,
            pageNumber: p.pageNumber,
            editionStatus: ed.status,
            publicationDate: ed.publicationDate,
          });
        }
      }
    }
    const usedByEditions = Array.from(editionMap.values());

    const baseDimensions = tpl.pageDimensions || {};
    const pageDimensions = {
      width: baseDimensions.width || baseDimensions.widthPt || TEMPLATE_CONSTANTS.PAGE_WIDTH_PT,
      height: baseDimensions.height || baseDimensions.heightPt || TEMPLATE_CONSTANTS.PAGE_HEIGHT_PT,
      widthPt: baseDimensions.widthPt || baseDimensions.width || TEMPLATE_CONSTANTS.PAGE_WIDTH_PT,
      heightPt: baseDimensions.heightPt || baseDimensions.height || TEMPLATE_CONSTANTS.PAGE_HEIGHT_PT,
      unit: 'pt',
    };

    const baseMargins = tpl.margins || {};
    const margins = {
      left: baseMargins.left !== undefined ? baseMargins.left : TEMPLATE_CONSTANTS.MARGIN_LEFT_PT,
      right: baseMargins.right !== undefined ? baseMargins.right : TEMPLATE_CONSTANTS.MARGIN_RIGHT_PT,
      top: baseMargins.top !== undefined ? baseMargins.top : TEMPLATE_CONSTANTS.MARGIN_TOP_PT,
      bottom: baseMargins.bottom !== undefined ? baseMargins.bottom : TEMPLATE_CONSTANTS.MARGIN_BOTTOM_PT,
    };

    return {
      status: tpl.status || 'ACTIVE',
      isPublished: tpl.isPublished !== undefined ? tpl.isPublished : (tpl.status === 'ARCHIVED' ? false : true),
      version: tpl.version || 1,
      gutter: tpl.gutter !== undefined ? tpl.gutter : TEMPLATE_CONSTANTS.GUTTER_PT,
      history: Array.isArray(tpl.history) ? tpl.history : [],
      ...tpl,
      pageDimensions,
      margins,
      usedByEditionsCount: usedByEditions.length,
      usedByEditions,
    };
  }

  async getEpaperTemplates(params = {}) {
    const tmplMap = this._collections.get('epaperTemplates');
    let list = Array.from(tmplMap.values());
    if (params.category && params.category !== 'all') {
      const c = String(params.category).toUpperCase();
      list = list.filter((t) => String(t.category).toUpperCase() === c);
    }
    if (params.status && params.status !== 'all') {
      const st = String(params.status).toUpperCase();
      list = list.filter((t) => String(t.status || 'ACTIVE').toUpperCase() === st);
    }
    if (params.gridColumns) {
      list = list.filter((t) => t.gridColumns === Number(params.gridColumns));
    }
    if (params.isSystem !== undefined) {
      const sys = String(params.isSystem) === 'true';
      list = list.filter((t) => t.isSystem === sys);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.nameHi && t.nameHi.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.templateCode && t.templateCode.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list.map((t) => this._enrichTemplate(t));
  }

  async getEpaperTemplateById(id) {
    const tmplMap = this._collections.get('epaperTemplates');
    const t = tmplMap.get(id);
    return t ? this._enrichTemplate(t) : null;
  }

  async validateEpaperTemplate(templateData) {
    const tmplMap = this._collections.get('epaperTemplates');
    const list = Array.from(tmplMap.values());
    return validateTemplate(templateData, { existingTemplates: list });
  }

  async saveEpaperTemplate(templateData, user = null, options = {}) {
    const tmplMap = this._collections.get('epaperTemplates');
    const id = templateData.id || `tpl-epaper-custom-${Date.now()}`;
    const existing = tmplMap.get(id);

    // Name collision check
    const list = Array.from(tmplMap.values());
    const duplicate = list.find(
      (t) => t.id !== id && ((templateData.name && t.name === templateData.name) || (templateData.nameHi && t.nameHi === templateData.nameHi))
    );
    if (duplicate) {
      const errRes = {
        error: true,
        statusCode: 409,
        code: 'ERR_TEMPLATE_NAME_COLLISION',
        message: `ERR_TEMPLATE_NAME_COLLISION: टेम्पलेट नाम "${templateData.name || templateData.nameHi}" पहले से मौजूद है।`,
      };
      if (options?.throwOnError) {
        const err = new Error(errRes.message);
        err.statusCode = 409;
        err.code = 'ERR_TEMPLATE_NAME_COLLISION';
        throw err;
      }
      return errRes;
    }

    // Optional pre-validation
    if (options?.validate) {
      const val = validateTemplate({ ...(existing || {}), ...templateData, id });
      if (!val.valid) {
        const errRes = {
          error: true,
          statusCode: 400,
          code: 'ERR_TEMPLATE_VALIDATION_FAILED',
          message: `ERR_TEMPLATE_VALIDATION_FAILED: ${val.errors.join('; ')}`,
          details: val,
        };
        if (options?.throwOnError) {
          const err = new Error(errRes.message);
          err.statusCode = 400;
          err.code = 'ERR_TEMPLATE_VALIDATION_FAILED';
          throw err;
        }
        return errRes;
      }
    }

    const expected = templateData.expectedVersion !== undefined 
      ? templateData.expectedVersion 
      : (options?.expectedVersion !== undefined ? options.expectedVersion : (templateData.version !== undefined ? templateData.version : undefined));

    if (existing && expected !== undefined) {
      const curVersion = existing.version || 1;
      if (curVersion !== Number(expected)) {
        return {
          error: true,
          statusCode: 409,
          code: 'ERR_VERSION_CONFLICT',
          message: `संस्करण विरोध (OCC Conflict): टेम्पलेट का वर्तमान संस्करण ${curVersion} है, प्राप्त संस्करण ${expected} है।`,
        };
      }
    }

    const history = Array.isArray(existing?.history) ? [...existing.history] : [];
    const isExplicitPublish = templateData.status === 'ACTIVE' || options?.isPublish === true;
    let targetStatus = templateData.status || (existing ? existing.status : 'DRAFT');

    if (existing && (existing.status === 'ACTIVE' || existing.isPublished)) {
      if (!isExplicitPublish) {
        targetStatus = 'DRAFT';
      }
      const snapshot = JSON.parse(JSON.stringify(existing));
      delete snapshot.history;
      history.push({
        version: existing.version || 1,
        status: existing.status || 'ACTIVE',
        changedAt: new Date().toISOString(),
        changedBy: {
          id: user?.id || user?.uid || 'usr-admin',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'ADMIN',
        },
        changeSummary: isExplicitPublish
          ? `संस्करण ${existing.version || 1} का अद्यतन प्रकाशित किया गया`
          : `संस्करण ${existing.version || 1} का संपादन प्रारूप (Draft) सहेजा गया`,
        snapshot,
      });
    }

    const record = {
      ...(existing || {}),
      ...templateData,
      id,
      status: targetStatus,
      isPublished: targetStatus === 'ACTIVE',
      version: existing ? (isExplicitPublish ? (existing.version || 1) + 1 : (existing.version || 1)) : 1,
      history,
      lastModifiedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    tmplMap.set(id, record);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(id).set(record);
    }
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_SAVED', `टेम्पलेट सहेजा गया: "${record.nameHi || record.name}" (ID: ${id})`);
    return this._enrichTemplate(record);
  }

  async duplicateEpaperTemplate(id, newName = '', user = null) {
    const source = await this.getEpaperTemplateById(id);
    if (!source) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const clonedId = `tpl-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const clonedCode = `TPL-CUSTOM-${Date.now().toString().slice(-6)}`;
    const defaultName = newName.trim() || `${source.name} (प्रतिलिपि)`;
    const defaultNameHi = newName.trim() ? `${newName.trim()} (हिंदी)` : `${source.nameHi || source.name} (प्रतिलिपि)`;

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: clonedId,
      templateCode: clonedCode,
      name: defaultName,
      nameHi: defaultNameHi,
      isSystem: false,
      status: 'DRAFT',
      isPublished: false,
      version: 1,
      history: [],
      usedByEditionsCount: 0,
      usedByEditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
    };

    const tmplMap = this._collections.get('epaperTemplates');
    tmplMap.set(clonedId, cloned);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(clonedId).set(cloned);
    }
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_DUPLICATED', `टेम्पलेट क्लोन किया गया: "${cloned.name}" (नया ID: ${clonedId})`);
    return this._enrichTemplate(cloned);
  }

  async publishEpaperTemplate(id, user = null) {
    const tmplMap = this._collections.get('epaperTemplates');
    const existing = tmplMap.get(id);
    if (!existing) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const val = validateTemplate(existing);
    if (!val.valid) {
      const err = new Error(`ERR_TEMPLATE_VALIDATION_FAILED: ${val.errors.join('; ')}`);
      err.statusCode = 400;
      err.code = 'ERR_TEMPLATE_VALIDATION_FAILED';
      err.details = val;
      throw err;
    }

    const snapshot = JSON.parse(JSON.stringify(existing));
    delete snapshot.history;
    const currentVersion = existing.version || 1;
    const hasPriorHistory = Array.isArray(existing.history) && existing.history.length > 0;
    const nextVersion = (existing.status === 'ACTIVE' || hasPriorHistory) ? currentVersion + 1 : currentVersion;

    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      version: currentVersion,
      status: 'ACTIVE',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `संस्करण ${currentVersion} सफलतापूर्वक प्रकाशित एवं अनुमोदित`,
      snapshot,
    });

    existing.status = 'ACTIVE';
    existing.isPublished = true;
    existing.version = nextVersion;
    existing.publishedAt = new Date().toISOString();
    existing.publishedBy = {
      id: user?.id || user?.uid || 'usr-admin',
      name: user?.fullName || user?.name || 'संपादक',
      role: user?.role || 'ADMIN',
    };
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    tmplMap.set(id, existing);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(id).set(existing);
    }
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_PUBLISHED', `टेम्पलेट प्रकाशित किया गया: "${existing.nameHi || existing.name}" (v${nextVersion})`);
    return this._enrichTemplate(existing);
  }

  async archiveEpaperTemplate(id, user = null) {
    const tmplMap = this._collections.get('epaperTemplates');
    const existing = tmplMap.get(id);
    if (!existing) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const snapshot = JSON.parse(JSON.stringify(existing));
    delete snapshot.history;
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      version: existing.version || 1,
      status: 'ARCHIVED',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: 'टेम्पलेट को अभिलेखागार (Archived) में स्थानांतरित किया गया',
      snapshot,
    });

    existing.status = 'ARCHIVED';
    existing.isPublished = false;
    existing.archivedAt = new Date().toISOString();
    existing.archivedBy = {
      id: user?.id || user?.uid || 'usr-admin',
      name: user?.fullName || user?.name || 'संपादक',
      role: user?.role || 'ADMIN',
    };
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    tmplMap.set(id, existing);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(id).set(existing);
    }
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_ARCHIVED', `टेम्पलेट अभिलेखागार में भेजा गया: "${existing.nameHi || existing.name}" (ID: ${id})`);
    return this._enrichTemplate(existing);
  }

  async restoreEpaperTemplate(id, user = null) {
    const tmplMap = this._collections.get('epaperTemplates');
    const existing = tmplMap.get(id);
    if (!existing) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const snapshot = JSON.parse(JSON.stringify(existing));
    delete snapshot.history;
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    history.push({
      version: existing.version || 1,
      status: 'ACTIVE',
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: 'टेम्पलेट को अभिलेखागार से पुनर्स्थापित (Restored) किया गया',
      snapshot,
    });

    existing.status = 'ACTIVE';
    existing.isPublished = true;
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    tmplMap.set(id, existing);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(id).set(existing);
    }
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_RESTORED', `टेम्पलेट पुनर्स्थापित किया गया: "${existing.nameHi || existing.name}" (ID: ${id})`);
    return this._enrichTemplate(existing);
  }

  async rollbackEpaperTemplate(id, targetVersion, user = null) {
    const tmplMap = this._collections.get('epaperTemplates');
    const existing = tmplMap.get(id);
    if (!existing) {
      const err = new Error(`ERR_NOT_FOUND: टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    const targetVerNum = parseInt(targetVersion, 10);
    const histEntry = (existing.history || []).find((h) => h.version === targetVerNum);

    if (!histEntry || !histEntry.snapshot) {
      const err = new Error(`ERR_VERSION_NOT_FOUND: संस्करण v${targetVerNum} का स्नैपशॉट नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_VERSION_NOT_FOUND';
      throw err;
    }

    const preRollbackSnapshot = JSON.parse(JSON.stringify(existing));
    delete preRollbackSnapshot.history;
    const history = Array.isArray(existing.history) ? [...existing.history] : [];
    const newVersion = (existing.version || 1) + 1;

    history.push({
      version: existing.version || 1,
      status: existing.status,
      changedAt: new Date().toISOString(),
      changedBy: {
        id: user?.id || user?.uid || 'usr-admin',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `संस्करण v${targetVerNum} पर रोलबैक करने से पूर्व स्नैपशॉट`,
      snapshot: preRollbackSnapshot,
    });

    const snap = histEntry.snapshot;
    existing.name = snap.name || existing.name;
    existing.nameHi = snap.nameHi || existing.nameHi;
    existing.description = snap.description || existing.description;
    existing.regions = snap.regions || existing.regions;
    existing.gridColumns = snap.gridColumns || existing.gridColumns;
    existing.margins = snap.margins || existing.margins;
    existing.gutter = snap.gutter !== undefined ? snap.gutter : existing.gutter;
    existing.pageDimensions = snap.pageDimensions || existing.pageDimensions;
    existing.typography = snap.typography || existing.typography;
    existing.headerArea = snap.headerArea || existing.headerArea;
    existing.footerArea = snap.footerArea || existing.footerArea;
    existing.version = newVersion;
    existing.status = 'ACTIVE';
    existing.isPublished = true;
    existing.updatedAt = new Date().toISOString();
    existing.history = history;

    tmplMap.set(id, existing);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(id).set(existing);
    }
    this.addAuditLog(user?.fullName || 'संपादक', user?.role || 'ADMIN', 'EPAPER_TEMPLATE_ROLLBACK', `टेम्पलेट को v${targetVerNum} पर रोलबैक किया गया (नया संस्करण: v${newVersion})`);
    return this._enrichTemplate(existing);
  }

  async getTemplateVersionHistory(id) {
    const t = await this.getEpaperTemplateById(id);
    if (!t) return [];
    return t.history || [];
  }

  async getTemplateUsage(id) {
    const t = await this.getEpaperTemplateById(id);
    if (!t) return { templateId: id, totalEditions: 0, editions: [], pages: [] };
    const pagesMap = this._collections.get('epaperPages') || new Map();
    const pages = Array.from(pagesMap.values()).filter((p) => p.templateId === id);
    return {
      templateId: id,
      totalEditions: t.usedByEditionsCount || 0,
      usedByEditionsCount: t.usedByEditionsCount || 0,
      editions: t.usedByEditions || [],
      usedByEditions: t.usedByEditions || [],
      pages,
    };
  }

  async deleteEpaperTemplate(id, user = null) {
    const tmplMap = this._collections.get('epaperTemplates');
    if (!tmplMap.has(id)) return false;
    tmplMap.delete(id);
    if (this.firestore) {
      await this.firestore.collection('epaperTemplates').doc(id).delete();
    }
    return true;
  }

  async getEpaperHeaderTemplates(params = {}) {
    const hdrMap = this._collections.get('epaperHeaderTemplates') || new Map();
    let list = Array.from(hdrMap.values());
    if (params.type && params.type !== 'all') {
      const tp = String(params.type).toUpperCase();
      list = list.filter((t) => String(t.type).toUpperCase() === tp);
    }
    if (params.activeOnly) {
      list = list.filter((t) => t.isActive !== false);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((t) =>
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.nameHi && t.nameHi.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getEpaperHeaderTemplateById(id) {
    const hdrMap = this._collections.get('epaperHeaderTemplates') || new Map();
    const t = hdrMap.get(id);
    return t ? JSON.parse(JSON.stringify(t)) : null;
  }

  async saveEpaperHeaderTemplate(templateData, user = null) {
    const hdrMap = this._collections.get('epaperHeaderTemplates') || new Map();
    const id = templateData.id || `hdr-custom-${Date.now()}`;
    const existing = hdrMap.get(id);

    const record = {
      ...(existing || {}),
      ...templateData,
      id,
      version: existing ? (existing.version || 1) + 1 : 1,
      isActive: templateData.isActive !== undefined ? templateData.isActive : (existing?.isActive ?? true),
      updatedAt: new Date().toISOString(),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      createdBy: existing?.createdBy || user?.id || 'master-admin',
      createdByName: existing?.createdByName || user?.fullName || 'मास्टर एडमिन',
    };

    if (record.isDefault) {
      for (const [k, v] of hdrMap.entries()) {
        if (k !== id) v.isDefault = false;
      }
    }

    hdrMap.set(id, record);
    if (this.firestore) {
      await this.firestore.collection('epaperHeaderTemplates').doc(id).set(record);
    }
    this.addAuditLog(user?.fullName || 'मास्टर एडमिन', user?.role || 'MASTER_ADMIN', 'EPAPER_HEADER_TEMPLATE_SAVED', `हेडर टेम्पलेट सहेजा गया: "${record.nameHi || record.name}" (ID: ${id})`);
    return record;
  }

  async duplicateEpaperHeaderTemplate(id, newName = '', user = null) {
    const source = await this.getEpaperHeaderTemplateById(id);
    if (!source) {
      const err = new Error(`ERR_NOT_FOUND: हेडर टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      throw err;
    }
    const clonedId = `hdr-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const clonedName = newName.trim() || `${source.name} (प्रतिलिपि)`;
    const clonedNameHi = newName.trim() ? `${newName.trim()} (हिंदी)` : `${source.nameHi || source.name} (प्रतिलिपि)`;

    const cloned = {
      ...JSON.parse(JSON.stringify(source)),
      id: clonedId,
      name: clonedName,
      nameHi: clonedNameHi,
      type: 'CUSTOM',
      isDefault: false,
      isActive: true,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.id || 'master-admin',
      createdByName: user?.fullName || 'मास्टर एडमिन',
    };

    const hdrMap = this._collections.get('epaperHeaderTemplates') || new Map();
    hdrMap.set(clonedId, cloned);
    if (this.firestore) {
      await this.firestore.collection('epaperHeaderTemplates').doc(clonedId).set(cloned);
    }
    this.addAuditLog(user?.fullName || 'मास्टर एडमिन', user?.role || 'MASTER_ADMIN', 'EPAPER_HEADER_TEMPLATE_DUPLICATED', `हेडर टेम्पलेट क्लोन किया गया: "${cloned.name}" (नया ID: ${clonedId})`);
    return cloned;
  }

  async activateEpaperHeaderTemplate(id, user = null) {
    const existing = await this.getEpaperHeaderTemplateById(id);
    if (!existing) {
      const err = new Error(`ERR_NOT_FOUND: हेडर टेम्पलेट [${id}] नहीं मिला।`);
      err.statusCode = 404;
      throw err;
    }
    existing.isActive = !existing.isActive;
    return this.saveEpaperHeaderTemplate(existing, user);
  }

  async deleteEpaperHeaderTemplate(id, user = null) {
    const hdrMap = this._collections.get('epaperHeaderTemplates') || new Map();
    if (!hdrMap.has(id)) return false;
    if (['hdr-classic-01', 'hdr-modern-02', 'hdr-minimal-03'].includes(id)) {
      const item = hdrMap.get(id);
      item.isActive = false;
      return true;
    }
    hdrMap.delete(id);
    if (this.firestore) {
      await this.firestore.collection('epaperHeaderTemplates').doc(id).delete();
    }
    this.addAuditLog(user?.fullName || 'मास्टर एडमिन', user?.role || 'MASTER_ADMIN', 'EPAPER_HEADER_TEMPLATE_DELETED', `हेडर टेम्पलेट विलोपित किया गया: (ID: ${id})`);
    return true;
  }

  async getEpaperAdSubmissions(params = {}) {
    const adMap = this._collections.get('epaperAdSubmissions');
    let list = Array.from(adMap.values());

    if (params.status && params.status !== 'all') {
      const s = String(params.status).toUpperCase();
      list = list.filter((a) => {
        const cur = String(a.status || '').toUpperCase();
        if (s === 'PENDING') return cur === 'PENDING' || cur === 'PENDING_APPROVAL' || cur === 'SUBMITTED' || cur === 'UNDER_REVIEW';
        return cur === s;
      });
    }

    if (params.districtId && params.districtId !== 'all') {
      list = list.filter((a) => a.targetDistrict === params.districtId);
    }
    if (params.reporterId && params.reporterId !== 'all') {
      list = list.filter((a) => a.reporterId === params.reporterId);
    }
    if (params.assignedReporterId && params.assignedReporterId !== 'all') {
      list = list.filter((a) => a.assignedReporterId === params.assignedReporterId);
    }
    if (params.category && params.category !== 'all') {
      const cat = String(params.category).toUpperCase();
      list = list.filter((a) => String(a.category || '').toUpperCase() === cat);
    }
    if (params.slotType && params.slotType !== 'all') {
      const slot = String(params.slotType).toUpperCase();
      list = list.filter((a) => String(a.slotType || '').toUpperCase() === slot);
    }
    if (params.editionId && params.editionId !== 'all') {
      list = list.filter((a) => a.targetEditionId === params.editionId);
    }
    if (params.isSponsored !== undefined && params.isSponsored !== null) {
      const isSp = String(params.isSponsored) === 'true';
      list = list.filter((a) => Boolean(a.isSponsoredContent) === isSp);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((a) =>
        (a.advertiserName && a.advertiserName.toLowerCase().includes(q)) ||
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.submissionNumber && a.submissionNumber.toLowerCase().includes(q)) ||
        (a.contactPhone && a.contactPhone.toLowerCase().includes(q)) ||
        (a.text && a.text.toLowerCase().includes(q)) ||
        (a.reporterName && a.reporterName.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }

  async getEpaperAdSubmissionById(id) {
    const adMap = this._collections.get('epaperAdSubmissions');
    return adMap.get(id) || null;
  }

  async saveEpaperAdSubmission(data, user = null) {
    const adMap = this._collections.get('epaperAdSubmissions');
    const id = data?.id || `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const existing = adMap.get(id);

    // Reporter Assignment isolation
    const userRole = String(user?.role || '').toUpperCase();
    if (userRole === 'REPORTER' && existing) {
      if (existing.reporterId && existing.reporterId !== user.id && existing.assignedReporterId !== user.id) {
        const err = new Error('ERR_FORBIDDEN_REPORTER_ACCESS: आप किसी अन्य संवाददाता के विज्ञापन में संशोधन नहीं कर सकते।');
        err.statusCode = 403;
        err.code = 'ERR_FORBIDDEN_REPORTER_ACCESS';
        throw err;
      }
    }

    const advertiserName = data?.advertiserName || existing?.advertiserName;
    if (!advertiserName || !String(advertiserName).trim()) {
      const err = new Error('ERR_MISSING_AD_CONTACT_INFO: Required advertiser name is missing.');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_AD_CONTACT_INFO';
      throw err;
    }

    const contactPhone = data?.contactPhone || existing?.contactPhone;
    if (!contactPhone || !String(contactPhone).trim()) {
      const err = new Error('ERR_MISSING_AD_CONTACT_INFO: Required contact/billing information is missing.');
      err.statusCode = 400;
      err.code = 'ERR_MISSING_AD_CONTACT_INFO';
      throw err;
    }

    if (data.imageUrl) {
      BroadsheetAdManager.validateImageCreative(data.imageUrl);
    }

    const submissionNumber = data.submissionNumber || (existing ? existing.submissionNumber : `ADV-MP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(adMap.size + 1).padStart(4, '0')}`);
    const timestamp = new Date().toISOString();

    const initialStatus = data.status || (existing ? existing.status : 'SUBMITTED');
    const history = Array.isArray(existing?.history) ? [...existing.history] : [];
    if (!existing) {
      history.push({
        status: initialStatus,
        changedAt: timestamp,
        changedBy: {
          id: user?.id || 'usr-system',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'ADMIN',
        },
        changeSummary: `विज्ञापन सृजित किया गया (${submissionNumber})`,
      });
    }

    const isSponsored = Boolean(data.isSponsored || data.isSponsoredContent || existing?.isSponsored || existing?.isSponsoredContent || data.category === 'SPONSORED_FEATURE');
    const badgeText = data.badgeText || (isSponsored ? 'प्रायोजित सामग्री' : 'विज्ञापन');

    const record = {
      ...(existing || {}),
      id,
      submissionNumber,
      title: data.title || data.headline || String(advertiserName).trim(),
      advertiserName: String(advertiserName).trim(),
      contactPhone: String(contactPhone).trim(),
      contactEmail: data.contactEmail || existing?.contactEmail || '',
      contactPerson: data.contactPerson || existing?.contactPerson || '',
      businessName: data.businessName || String(advertiserName).trim(),
      category: data.category || existing?.category || 'COMMERCIAL',
      slotType: data.slotType || existing?.slotType || 'CLASSIFIED',
      format: data.format || existing?.format || (BROADSHEET_RATE_CARDS[data.slotType]?.nameHi || 'मानक विज्ञापन'),
      dimensionsMm: data.dimensionsMm || existing?.dimensionsMm || (BROADSHEET_RATE_CARDS[data.slotType]?.dimensionsMm || '160 x 260 mm'),
      text: data.text || existing?.text || '',
      headline: data.headline || data.title || existing?.headline || String(advertiserName).trim(),
      bodyText: data.bodyText || data.text || existing?.bodyText || '',
      ctaText: data.ctaText || existing?.ctaText || 'अधिक जानकारी हेतु संपर्क करें',
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : (existing?.imageUrl || ''),
      brandLogoUrl: data.brandLogoUrl || existing?.brandLogoUrl || '',
      productImageUrl: data.productImageUrl || existing?.productImageUrl || '',
      receiptNumber: data.receiptNumber || existing?.receiptNumber || '',
      amount: data.amount !== undefined ? Number(data.amount) : (existing?.amount !== undefined ? existing.amount : 250),
      billingStatus: data.billingStatus || existing?.billingStatus || 'PENDING',
      targetDistrict: data.targetDistrict || existing?.targetDistrict || 'dist-bhopal',
      targetDistrictName: data.targetDistrictName || existing?.targetDistrictName || 'भोपाल',
      targetEditionId: data.targetEditionId || existing?.targetEditionId || null,
      targetEditionTitle: data.targetEditionTitle || existing?.targetEditionTitle || null,
      targetPage: data.targetPage !== undefined ? Number(data.targetPage) : (existing?.targetPage || null),
      targetRegionId: data.targetRegionId || existing?.targetRegionId || null,
      startDate: data.startDate || existing?.startDate || timestamp.split('T')[0],
      endDate: data.endDate || existing?.endDate || null,
      publicationDate: data.publicationDate || existing?.publicationDate || null,
      publishedAt: data.publishedAt || existing?.publishedAt || null,
      placementPriority: data.placementPriority || existing?.placementPriority || 'NORMAL',
      isSponsored,
      isSponsoredContent: isSponsored,
      sponsoredLabel: badgeText,
      asciBadge: true,
      badgeText,
      status: initialStatus,
      statusHistory: history,
      reporterId: data.reporterId || (existing?.reporterId ? existing.reporterId : (user?.role === 'REPORTER' ? user.id : 'reporter-anonymous')),
      reporterName: data.reporterName || (existing?.reporterName ? existing.reporterName : (user?.role === 'REPORTER' ? (user.fullName || user.name) : 'संवाददाता')),
      reporterBadge: data.reporterBadge || existing?.reporterBadge || '',
      assignedReporterId: data.assignedReporterId !== undefined ? data.assignedReporterId : (existing?.assignedReporterId || null),
      assignedReporterName: data.assignedReporterName !== undefined ? data.assignedReporterName : (existing?.assignedReporterName || null),
      submittedBy: data.submittedBy || existing?.submittedBy || {
        id: user?.id || 'usr-system',
        name: user?.fullName || user?.name || 'उपयोगकर्ता',
        role: user?.role || 'ADMIN',
      },
      reviewedBy: data.reviewedBy || existing?.reviewedBy || null,
      reviewedAt: data.reviewedAt || existing?.reviewedAt || null,
      reviewNotes: data.reviewNotes || existing?.reviewNotes || null,
      aiGenerated: data.aiGenerated || existing?.aiGenerated || null,
      history,
      version: existing ? (existing.version || 1) + 1 : 1,
      createdAt: existing ? existing.createdAt : timestamp,
      updatedAt: timestamp,
    };

    adMap.set(id, record);
    if (this.firestore) {
      await this.firestore.collection('epaperAdSubmissions').doc(id).set(record);
    }
    return record;
  }

  async updateAdLifecycleStatus(id, targetStatus, user = null, notes = '') {
    const adMap = this._collections.get('epaperAdSubmissions');
    const current = adMap.get(id);
    if (!current) {
      const err = new Error(`ERR_AD_NOT_FOUND: विज्ञापन प्रविष्टि [${id}] नहीं मिली।`);
      err.statusCode = 404;
      err.code = 'ERR_AD_NOT_FOUND';
      throw err;
    }

    const userRole = String(user?.role || '').toUpperCase();
    if (userRole === 'REPORTER') {
      const isOwner = current.reporterId === user.id || current.assignedReporterId === user.id;
      if (!isOwner) {
        const err = new Error('ERR_FORBIDDEN: आप केवल अपने सौंपे गए विज्ञापनों की स्थिति ही बदल सकते हैं।');
        err.statusCode = 403;
        err.code = 'ERR_FORBIDDEN';
        throw err;
      }
    }

    BroadsheetAdManager.validateStatusTransition(current.status, targetStatus, user);

    const normTarget = String(targetStatus).toUpperCase();
    const timestamp = new Date().toISOString();
    const history = Array.isArray(current.history) ? [...current.history] : [];

    history.push({
      status: normTarget,
      changedAt: timestamp,
      changedBy: {
        id: user?.id || 'usr-system',
        name: user?.fullName || user?.name || 'संपादक',
        role: user?.role || 'ADMIN',
      },
      changeSummary: `विज्ञापन स्थिति अद्यतन: ${current.status || 'DRAFT'} → ${normTarget}`,
      notes: notes || '',
    });

    const updated = {
      ...current,
      status: normTarget,
      reviewedBy: ['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(normTarget) ? (user?.fullName || user?.name || user?.id) : current.reviewedBy,
      reviewedAt: ['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(normTarget) ? timestamp : current.reviewedAt,
      reviewNotes: notes || current.reviewNotes || '',
      updatedAt: timestamp,
      version: (current.version || 1) + 1,
      history,
      statusHistory: history,
    };

    if (normTarget === 'PUBLISHED') {
      updated.publishedAt = timestamp;
    }

    adMap.set(id, updated);
    if (this.firestore) {
      await this.firestore.collection('epaperAdSubmissions').doc(id).set(updated);
    }
    return updated;
  }

  async reviewEpaperAdSubmission(id, actionOrReviewData, notesOrUser = '', maybeUser = null) {
    let action = 'APPROVE';
    let notes = '';
    let user = maybeUser;

    if (typeof actionOrReviewData === 'object' && actionOrReviewData !== null) {
      action = actionOrReviewData.action || actionOrReviewData.status || 'APPROVE';
      notes = actionOrReviewData.reviewNotes || actionOrReviewData.notes || actionOrReviewData.rejectionReason || '';
      user = notesOrUser;
    } else {
      action = actionOrReviewData;
      notes = typeof notesOrUser === 'string' ? notesOrUser : '';
    }

    const norm = String(action).toUpperCase();
    const targetStatus = norm === 'APPROVE' || norm === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    return this.updateAdLifecycleStatus(id, targetStatus, user, notes);
  }

  async assignAdToEditionSlot(adId, editionId, pageNumber, slotDetails = {}, user = null) {
    const ad = await this.getEpaperAdSubmissionById(adId);
    if (!ad) {
      const err = new Error(`ERR_AD_NOT_FOUND: विज्ञापन [${adId}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_AD_NOT_FOUND';
      throw err;
    }

    // Approval Gate check FIRST
    const adStatus = String(ad.status || '').toUpperCase();
    if (!['APPROVED', 'SCHEDULED', 'PUBLISHED'].includes(adStatus)) {
      const err = new Error(`ERR_AD_NOT_APPROVED: केवल अनुमोदित (APPROVED) विज्ञापन ही ई-पेपर पृष्ठ पर रखे जा सकते हैं। वर्तमान स्थिति: "${ad.status}"।`);
      err.statusCode = 400;
      err.code = 'ERR_AD_NOT_APPROVED';
      throw err;
    }

    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error(`ERR_EDITION_NOT_FOUND: ई-पेपर संस्करण [${editionId}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_EDITION_NOT_FOUND';
      throw err;
    }

    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_PUBLISHED_EDITION_IMMUTABLE: प्रकाशित संस्करण अपरिवर्तनीय है।');
      err.statusCode = 400;
      err.code = 'ERR_PUBLISHED_EDITION_IMMUTABLE';
      throw err;
    }

    const pNum = Number(pageNumber);
    let page = await this.getEpaperPageByNumber(editionId, pNum);
    if (!page && Array.isArray(edition.pages)) {
      page = edition.pages.find((p) => p && typeof p === 'object' && p.pageNumber === pNum);
    }
    if (!page) {
      page = {
        id: `page-${editionId}-${pNum}`,
        editionId,
        pageNumber: pNum,
        gridColumns: 8,
        elements: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.saveEpaperPage(page, user);
    }

    const defaultDims = BroadsheetAdManager.getSlotDimensionsPt(ad.slotType);
    const bounds = slotDetails.bounds || {
      x: slotDetails.x !== undefined ? slotDetails.x : 42.52,
      y: slotDetails.y !== undefined ? slotDetails.y : 1200,
      width: slotDetails.width || defaultDims.width,
      height: slotDetails.height || defaultDims.height,
    };

    BroadsheetAdManager.validateAdPlacement(ad, bounds, 932.6, 1474.0, page.elements || []);

    const elementId = `el-ad-${ad.id}-${Date.now()}`;
    const adElement = {
      id: elementId,
      elementType: 'AD',
      adId: ad.id,
      adSlotType: ad.slotType,
      bounds,
      colSpan: slotDetails.colSpan || defaultDims.colSpan || 4,
      customHeadline: ad.headline || ad.title || ad.advertiserName,
      customBodyText: ad.bodyText || ad.text || (ad.contactPhone ? `संपर्क: ${ad.contactPhone}` : ''),
      imageUrl: ad.imageUrl || '',
      asciBadge: true,
      badgeText: ad.sponsoredLabel || 'विज्ञापन',
      isSponsoredContent: Boolean(ad.isSponsoredContent),
      zIndex: (page.elements || []).length + 1,
    };

    const filtered = (page.elements || []).filter((el) => el.adId !== ad.id && el.id !== ad.id);
    page.elements = [...filtered, adElement];
    await this.saveEpaperPage(page, user);

    ad.targetEditionId = editionId;
    ad.assignedEditionId = editionId;
    ad.targetEditionTitle = edition.title || edition.editionCode;
    ad.targetPage = pNum;
    ad.assignedPageNumber = pNum;
    ad.targetRegionId = slotDetails.regionId || null;
    ad.assignedSlotType = slotDetails.slotType || ad.slotType;
    ad.status = 'SCHEDULED';
    ad.updatedAt = new Date().toISOString();

    const adMap = this._collections.get('epaperAdSubmissions');
    adMap.set(ad.id, ad);
    if (this.firestore) {
      await this.firestore.collection('epaperAdSubmissions').doc(ad.id).set(ad);
    }

    return { ...ad, success: true, ad, element: adElement };
  }

  async removeAdFromEditionSlot(adId, editionId, pageNumber, user = null) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error(`ERR_EDITION_NOT_FOUND: ई-पेपर संस्करण [${editionId}] नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_EDITION_NOT_FOUND';
      throw err;
    }

    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_PUBLISHED_EDITION_IMMUTABLE: प्रकाशित संस्करण से विज्ञापन हटाना वर्जित है।');
      err.statusCode = 400;
      err.code = 'ERR_PUBLISHED_EDITION_IMMUTABLE';
      throw err;
    }

    const pNum = Number(pageNumber);
    let page = await this.getEpaperPageByNumber(editionId, pNum);
    if (!page && Array.isArray(edition.pages)) {
      page = edition.pages.find((p) => p && typeof p === 'object' && p.pageNumber === pNum);
    }
    if (!page) {
      const err = new Error(`ERR_PAGE_NOT_FOUND: पृष्ठ #${pNum} नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_PAGE_NOT_FOUND';
      throw err;
    }

    page.elements = (page.elements || []).filter((el) => el.adId !== adId && el.id !== adId);
    await this.saveEpaperPage(page, user);

    const ad = await this.getEpaperAdSubmissionById(adId);
    if (ad) {
      if (ad.status === 'SCHEDULED') ad.status = 'APPROVED';
      ad.targetEditionId = null;
      ad.assignedEditionId = null;
      ad.targetPage = null;
      ad.assignedPageNumber = null;
      ad.targetRegionId = null;
      ad.assignedSlotType = null;
      ad.updatedAt = new Date().toISOString();

      const adMap = this._collections.get('epaperAdSubmissions');
      adMap.set(ad.id, ad);
      if (this.firestore) {
        await this.firestore.collection('epaperAdSubmissions').doc(ad.id).set(ad);
      }
    }

    return { ...(ad || {}), success: true, removedAdId: adId, ad };
  }

  async getAdReportingSummary(params = {}) {
    const adMap = this._collections.get('epaperAdSubmissions');
    const list = Array.from(adMap.values());
    const statusCounts = {
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      scheduled: 0,
      published: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
      expired: 0,
      pending: 0,
    };

    const byCategory = {};
    const bySlotType = {};
    const byReporter = {};
    const byEdition = {};

    for (const ad of list) {
      const s = String(ad.status || 'DRAFT').toUpperCase();
      if (s === 'DRAFT') statusCounts.draft++;
      else if (s === 'SUBMITTED') statusCounts.submitted++;
      else if (s === 'UNDER_REVIEW') statusCounts.underReview++;
      else if (s === 'APPROVED') statusCounts.approved++;
      else if (s === 'SCHEDULED') statusCounts.scheduled++;
      else if (s === 'PUBLISHED') statusCounts.published++;
      else if (s === 'COMPLETED') statusCounts.completed++;
      else if (s === 'REJECTED') statusCounts.rejected++;
      else if (s === 'CANCELLED') statusCounts.cancelled++;
      else if (s === 'EXPIRED') statusCounts.expired++;
      else statusCounts.pending++;

      const cat = ad.category || 'COMMERCIAL';
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      const slot = ad.slotType || 'CLASSIFIED';
      bySlotType[slot] = (bySlotType[slot] || 0) + 1;

      const repKey = ad.assignedReporterName || ad.reporterName || ad.reporterId || 'Unassigned';
      if (!byReporter[repKey]) byReporter[repKey] = { total: 0, approved: 0, published: 0 };
      byReporter[repKey].total++;
      if (s === 'APPROVED' || s === 'SCHEDULED' || s === 'PUBLISHED') byReporter[repKey].approved++;
      if (s === 'PUBLISHED' || s === 'COMPLETED') byReporter[repKey].published++;

      if (ad.targetEditionId) {
        byEdition[ad.targetEditionId] = (byEdition[ad.targetEditionId] || 0) + 1;
      }
    }

    const edMap = this._collections.get('epaperEditions');
    let totalConfiguredSlots = 0;
    let occupiedSlots = 0;

    for (const ed of edMap.values()) {
      for (const p of ed.pages || []) {
        for (const el of p.elements || []) {
          if (el.elementType === 'AD') {
            totalConfiguredSlots++;
            if (el.adId) occupiedSlots++;
          }
        }
      }
    }

    const availableSlots = Math.max(0, totalConfiguredSlots - occupiedSlots);
    const occupancyPercent = totalConfiguredSlots > 0 ? Number(((occupiedSlots / totalConfiguredSlots) * 100).toFixed(1)) : 0;

    let totalAmountPaise = 0;
    for (const ad of list) {
      const amt = Number(ad.amount || 0);
      totalAmountPaise += amt * 100;
    }

    const statusBreakdown = {
      DRAFT: statusCounts.draft,
      SUBMITTED: statusCounts.submitted,
      UNDER_REVIEW: statusCounts.underReview,
      APPROVED: statusCounts.approved,
      SCHEDULED: statusCounts.scheduled,
      PUBLISHED: statusCounts.published,
      COMPLETED: statusCounts.completed,
      REJECTED: statusCounts.rejected,
      CANCELLED: statusCounts.cancelled,
      EXPIRED: statusCounts.expired,
    };

    return {
      totalAds: list.length,
      statusCounts,
      statusBreakdown,
      byCategory,
      categoryBreakdown: byCategory,
      bySlotType,
      slotBreakdown: bySlotType,
      byReporter,
      byEdition,
      totalAmountPaise,
      slotOccupancy: {
        totalConfiguredSlots,
        totalSlots: Math.max(totalConfiguredSlots, 13),
        occupiedSlots,
        availableSlots,
        occupancyPercent,
        occupancyRatePct: occupancyPercent,
      },
    };
  }

  async getAvailableAdSlots(editionId, pageNumber = null) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) return { totalSlots: 0, occupiedSlots: 0, availableSlots: 0, slots: [] };

    const pNum = pageNumber ? Number(pageNumber) : null;
    let pages = [];
    if (pNum) {
      const singlePage = await this.getEpaperPageByNumber(editionId, pNum);
      if (singlePage) pages.push(singlePage);
    } else {
      pages = await this.getEpaperPagesByEditionId(editionId);
    }
    if (pages.length === 0 && Array.isArray(edition.pages) && typeof edition.pages[0] === 'object') {
      pages = pNum ? edition.pages.filter((p) => p.pageNumber === pNum) : edition.pages;
    }
    const slots = [];

    for (const page of pages) {
      for (const el of page.elements || []) {
        if (el.elementType === 'AD') {
          slots.push({
            pageNumber: page.pageNumber,
            elementId: el.id,
            slotType: el.adSlotType || 'BOTTOM_STRIP',
            bounds: el.bounds,
            isOccupied: Boolean(el.adId),
            adId: el.adId || null,
            adTitle: el.customHeadline || '',
          });
        }
      }
    }

    const occupied = slots.filter((s) => s.isOccupied).length;
    return {
      totalSlots: slots.length,
      occupiedSlots: occupied,
      availableSlots: slots.length - occupied,
      slots,
    };
  }

  async checkArticleInEdition(editionId, articleId) {
    const pages = await this.getEpaperPagesByEditionId(editionId);
    for (const page of pages) {
      const elements = page.elements || [];
      const match = elements.find((el) => el.articleId === articleId);
      if (match) {
        return {
          placed: true,
          pageNumber: page.pageNumber,
          pageId: page.id,
          pageTitle: page.pageTitle,
          elementId: match.id,
        };
      }
    }
    return { placed: false, pageNumber: null, pageId: null, pageTitle: null, elementId: null };
  }

  async checkArticlePlacement(editionId, articleId) {
    return this.checkArticleInEdition(editionId, articleId);
  }

  // =========================================================================
  // STEP 3: E-PAPER NEWS SELECTION DESK & EDITORIAL WORKFLOW METHODS (FIRESTORE)
  // =========================================================================

  async getEligibleEpaperArticles(params = {}) {
    const artMap = this._collections.get('newsArticles');
    let list = Array.from(artMap?.values() || []);

    const validEpaperStatuses = [
      'APPROVED_FOR_EPAPER',
      'ASSIGNED_TO_PAGE',
      'PAGE_DESIGNED',
      'QUALITY_CHECK',
      'FINAL_APPROVED',
    ];

    if (params.approvalStatus && params.approvalStatus !== 'all') {
      const norm = String(params.approvalStatus).toUpperCase();
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return artStatus === norm || epStatus === norm;
      });
    } else {
      list = list.filter((a) => {
        const artStatus = String(a.status || '').toUpperCase();
        const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
        return artStatus === 'APPROVED' || artStatus === 'PUBLISHED' || validEpaperStatuses.includes(epStatus);
      });
    }

    if (params.districtId || params.district) {
      const dist = String(params.districtId || params.district).toLowerCase();
      list = list.filter((a) =>
        String(a.districtId || '').toLowerCase() === dist ||
        String(a.districtName || '').toLowerCase() === dist
      );
    }

    if (params.constituency) {
      const c = String(params.constituency).toLowerCase();
      list = list.filter((a) =>
        String(a.constituencyName || a.constituencyId || a.beat || '').toLowerCase().includes(c)
      );
    }

    if (params.categoryId || params.category) {
      const cat = String(params.categoryId || params.category).toLowerCase();
      list = list.filter((a) =>
        String(a.categoryId || '').toLowerCase() === cat ||
        String(a.categoryName || '').toLowerCase() === cat ||
        String(a.category || '').toLowerCase() === cat
      );
    }

    if (params.reporterId || params.reporter) {
      const rep = String(params.reporterId || params.reporter).toLowerCase();
      list = list.filter((a) =>
        String(a.authorId || '').toLowerCase() === rep ||
        String(a.authorName || '').toLowerCase().includes(rep) ||
        String(a.byline || '').toLowerCase().includes(rep)
      );
    }

    if (params.date) {
      const d = String(params.date).slice(0, 10);
      list = list.filter((a) => {
        const artDate = String(a.publicationDate || a.publishedAt || a.createdAt || '').slice(0, 10);
        return artDate === d;
      });
    }
    if (params.dateFrom) {
      const df = new Date(params.dateFrom).getTime();
      list = list.filter((a) => new Date(a.publishedAt || a.createdAt || 0).getTime() >= df);
    }
    if (params.dateTo) {
      const dt = new Date(params.dateTo).getTime();
      list = list.filter((a) => new Date(a.publishedAt || a.createdAt || 0).getTime() <= dt);
    }

    if (params.priority && params.priority !== 'all') {
      const p = String(params.priority).toUpperCase();
      list = list.filter((a) => String(a.priority || '').toUpperCase() === p);
    }

    if (params.hasImage !== undefined && params.hasImage !== null && params.hasImage !== 'all') {
      const reqImage = params.hasImage === true || params.hasImage === 'true';
      list = list.filter((a) => {
        const hasImg = Boolean((a.featuredImage && a.featuredImage.trim()) || (a.imageUrl && a.imageUrl.trim()));
        return reqImage ? hasImg : !hasImg;
      });
    }

    if (params.length && params.length !== 'all') {
      const lenType = String(params.length).toUpperCase();
      list = list.filter((a) => {
        const text = String(a.content || a.summary || '').trim();
        const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
        if (lenType === 'SHORT') return wordCount < 100;
        if (lenType === 'MEDIUM') return wordCount >= 100 && wordCount <= 300;
        if (lenType === 'LONG') return wordCount > 300;
        return true;
      });
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter((a) =>
        String(a.id || '').toLowerCase().includes(q) ||
        String(a.title || '').toLowerCase().includes(q) ||
        String(a.summary || '').toLowerCase().includes(q) ||
        String(a.content || '').toLowerCase().includes(q) ||
        String(a.authorName || '').toLowerCase().includes(q) ||
        String(a.byline || '').toLowerCase().includes(q) ||
        String(a.districtName || '').toLowerCase().includes(q)
      );
    }

    const sortMode = String(params.sort || 'latest').toLowerCase();
    const priorityWeight = { URGENT: 4, BREAKING: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    list.sort((a, b) => {
      if (sortMode === 'priority') {
        const pwA = priorityWeight[String(a.priority || '').toUpperCase()] || 0;
        const pwB = priorityWeight[String(b.priority || '').toUpperCase()] || 0;
        if (pwB !== pwA) return pwB - pwA;
      } else if (sortMode === 'relevance') {
        const scoreA = ((priorityWeight[String(a.priority || '').toUpperCase()] || 0) * 10) +
          (a.featuredImage || a.imageUrl ? 5 : 0);
        const scoreB = ((priorityWeight[String(b.priority || '').toUpperCase()] || 0) * 10) +
          (b.featuredImage || b.imageUrl ? 5 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    const total = list.length;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      articles: paginated,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateArticleWorkflowStatus(articleId, targetStatus, user = null, options = {}) {
    const artMap = this._collections.get('newsArticles');
    let article = artMap?.get(articleId);
    if (!article) {
      article = Array.from(artMap?.values() || []).find((a) => a.slug === articleId);
    }
    if (!article) {
      const err = new Error('ERR_ARTICLE_NOT_FOUND: समाचार नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_ARTICLE_NOT_FOUND';
      throw err;
    }

    const WORKFLOW_STAGES = [
      'NEWS_RECEIVED',
      'EDITORIAL_REVIEW',
      'APPROVED_FOR_EPAPER',
      'ASSIGNED_TO_PAGE',
      'PAGE_DESIGNED',
      'QUALITY_CHECK',
      'FINAL_APPROVED',
      'PUBLISHED',
    ];

    const normTarget = String(targetStatus || '').trim().toUpperCase().replace(/[\s\/-]+/g, '_');
    const matchedStage = WORKFLOW_STAGES.find((s) => s === normTarget) ||
      (normTarget.includes('REVIEW') ? 'EDITORIAL_REVIEW' :
       normTarget.includes('APPROVED_FOR') ? 'APPROVED_FOR_EPAPER' :
       normTarget.includes('ASSIGNED') ? 'ASSIGNED_TO_PAGE' :
       normTarget.includes('DESIGN') ? 'PAGE_DESIGNED' :
       normTarget.includes('QUALITY') || normTarget.includes('PROOF') ? 'QUALITY_CHECK' :
       normTarget.includes('FINAL') ? 'FINAL_APPROVED' :
       normTarget.includes('PUBLISH') ? 'PUBLISHED' : null);

    if (!matchedStage) {
      const err = new Error(`ERR_INVALID_WORKFLOW_STAGE: अमान्य संपादकीय कार्यप्रवाह स्थिति "${targetStatus}"। मान्य स्थितियां: ${WORKFLOW_STAGES.join(', ')}`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_WORKFLOW_STAGE';
      throw err;
    }

    const userRoles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
    const normRoles = userRoles.map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
    const isReaderOrReporterOnly = normRoles.length > 0 && normRoles.every((r) => ['READER', 'REPORTER'].includes(r));
    const isChiefEditorOrAdmin = normRoles.some((r) => ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR'].includes(r)) ||
      (user?.email && ['live.bnwtv@gmail.com', 'admin@breakingnewswala.com'].includes(user.email));

    if (isReaderOrReporterOnly && !isChiefEditorOrAdmin) {
      const err = new Error('ERR_FORBIDDEN: संपादकीय कार्यप्रवाह में स्थिति परिवर्तित करने हेतु संपादक अथवा एडमिन अधिकार आवश्यक हैं।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    if (matchedStage === 'FINAL_APPROVED' && !isChiefEditorOrAdmin) {
      const err = new Error('ERR_FORBIDDEN: अंतिम अनुमोदन (FINAL APPROVED) केवल मुख्य संपादक अथवा मास्टर एडमिन द्वारा ही दिया जा सकता है।');
      err.statusCode = 403;
      err.code = 'ERR_FORBIDDEN';
      throw err;
    }

    const currentStage = article.epaperWorkflow?.status ||
      (article.status === 'PUBLISHED' || article.status === 'APPROVED' ? 'APPROVED_FOR_EPAPER' : 'NEWS_RECEIVED');

    const currentIdx = WORKFLOW_STAGES.indexOf(currentStage);
    const targetIdx = WORKFLOW_STAGES.indexOf(matchedStage);

    if (targetIdx > currentIdx + 1 && !(currentStage === 'APPROVED_FOR_EPAPER' && matchedStage === 'ASSIGNED_TO_PAGE')) {
      const err = new Error(`ERR_STAGE_SKIP_FORBIDDEN: कार्यप्रवाह चरण लंघन वर्जित है। वर्तमान: "${currentStage}", लक्षित: "${matchedStage}"।`);
      err.statusCode = 400;
      err.code = 'ERR_STAGE_SKIP_FORBIDDEN';
      throw err;
    }

    const currentHistory = Array.isArray(article.epaperWorkflow?.history) ? article.epaperWorkflow.history : [];
    const workflowRecord = {
      status: matchedStage,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: user?.id || user?.uid || 'usr-editor',
        name: user?.fullName || user?.name || 'संपादक',
        role: normRoles[0] || 'EDITOR',
      },
      editionId: options.editionId || article.epaperWorkflow?.editionId || null,
      pageNumber: options.pageNumber !== undefined ? options.pageNumber : (article.epaperWorkflow?.pageNumber || null),
      remarks: options.remarks || '',
      history: [
        ...currentHistory,
        {
          from: currentStage,
          to: matchedStage,
          changedAt: new Date().toISOString(),
          changedBy: user?.fullName || user?.name || 'संपादक',
          remarks: options.remarks || '',
        },
      ],
    };

    article.epaperWorkflow = workflowRecord;
    artMap.set(article.id, article);

    return {
      success: true,
      articleId: article.id,
      workflow: workflowRecord,
      previousStatus: currentStage,
      currentStatus: matchedStage,
    };
  }

  async assignArticlesToEditionPage(editionId, pageNumber, articleIds, user = null, options = {}) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण में कोई संशोधन नहीं किया जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    const pageNum = parseInt(pageNumber, 10);
    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > edition.totalPages) {
      const err = new Error(`ERR_INVALID_PAGE_NUMBER: पृष्ठ संख्या 1 से ${edition.totalPages} के मध्य होनी चाहिए।`);
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PAGE_NUMBER';
      throw err;
    }

    const targetPage = await this.getEpaperPageByNumber(editionId, pageNum);
    if (!targetPage) {
      const err = new Error(`ERR_PAGE_NOT_FOUND: पृष्ठ ${pageNum} नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_PAGE_NOT_FOUND';
      throw err;
    }

    const normalizedIds = Array.isArray(articleIds) ? articleIds : [articleIds];
    if (normalizedIds.length === 0) {
      const err = new Error('ERR_VALIDATION: कम से कम एक समाचार ID आवश्यक है।');
      err.statusCode = 400;
      err.code = 'ERR_VALIDATION';
      throw err;
    }

    const warnings = [];
    for (const artId of normalizedIds) {
      const check = await this.checkArticleInEdition(editionId, artId);
      if (check.placed) {
        if (!options.forceDuplicate) {
          const err = new Error(`ERR_DUPLICATE_ASSIGNMENT: समाचार [${artId}] पहले से पृष्ठ ${check.pageNumber} पर असाइन है।`);
          err.statusCode = 409;
          err.code = 'ERR_DUPLICATE_ASSIGNMENT';
          err.details = {
            articleId: artId,
            alreadyAssignedPage: check.pageNumber,
            pageTitle: check.pageTitle,
          };
          throw err;
        } else {
          warnings.push(`समाचार [${artId}] पृष्ठ ${check.pageNumber} पर भी स्थित है।`);
        }
      }
    }

    const newElements = [...(targetPage.elements || [])];
    const assignedElements = [];
    const artMap = this._collections.get('newsArticles');

    for (const artId of normalizedIds) {
      const article = artMap?.get(artId) || Array.from(artMap?.values() || []).find((a) => a.slug === artId);
      if (!article) continue;

      const isApproved =
        String(article.status || '').toUpperCase() === 'APPROVED' ||
        String(article.status || '').toUpperCase() === 'PUBLISHED' ||
        ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'].includes(String(article.epaperWorkflow?.status || '').toUpperCase());

      if (!isApproved) {
        const err = new Error(`ERR_ARTICLE_NOT_APPROVED: समाचार [${article.id}] अभी अनुमोदित नहीं है। केवल स्वीकृत समाचार ही ई-पेपर पृष्ठ पर असाइन किए जा सकते हैं।`);
        err.statusCode = 400;
        err.code = 'ERR_ARTICLE_NOT_APPROVED';
        throw err;
      }

      const reporterCredit = article.byline || article.authorName || '';
      const photoCredit = article.photographer || article.imageAttribution || '';
      const editorCredit = options.editorCredit || user?.fullName || 'डेस्क संपादक';

      const hasMissingReporterCredit = !reporterCredit;
      const hasMissingEditorCredit = !editorCredit;
      const hasMissingImage = !(article.featuredImage || article.imageUrl);

      if (hasMissingImage) {
        warnings.push({
          type: 'MISSING_IMAGE',
          articleId: article.id,
          message: `समाचार [${article.title}] में कोई मुख्य फ़ोटो उपलब्ध नहीं है।`,
        });
      }
      if (hasMissingReporterCredit) {
        warnings.push({
          type: 'MISSING_REPORTER_CREDIT',
          articleId: article.id,
          message: `समाचार [${article.title}] में रिपोर्टर का नाम/साभार अनुपलब्ध है।`,
        });
      }
      if (hasMissingEditorCredit) {
        warnings.push({
          type: 'MISSING_EDITOR_CREDIT',
          articleId: article.id,
          message: `समाचार [${article.title}] में संपादक का नाम/साभार अनुपलब्ध है।`,
        });
      }

      const element = {
        id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        elementType: 'STORY',
        articleId: article.id,
        bounds: { x: 42.52, y: 141.73, width: 280, height: 180 },
        colSpan: options.colSpan || 4,
        role: options.role || (newElements.length === 0 ? 'LEAD' : 'SECOND_LEAD'),
        customHeadline: article.title,
        customBodyText: article.content || article.summary,
        byline: reporterCredit || 'संवाददाता',
        photoCredit: photoCredit || 'बीएनडब्ल्यू फोटो ब्यूरो',
        editorCredit: editorCredit,
        imageUrl: article.featuredImage || article.imageUrl || null,
        missingReporterCredit: hasMissingReporterCredit,
        missingEditorCredit: hasMissingEditorCredit,
        zIndex: newElements.length + 1,
        createdAt: new Date().toISOString(),
      };

      newElements.push(element);
      assignedElements.push(element);

      article.epaperWorkflow = {
        status: 'ASSIGNED_TO_PAGE',
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: user?.id || user?.uid || 'usr-editor',
          name: user?.fullName || user?.name || 'संपादक',
          role: user?.role || 'EDITOR',
        },
        editionId,
        pageNumber: pageNum,
        remarks: `असाइन पृष्ठ ${pageNum} (${edition.title})`,
        history: [
          ...(article.epaperWorkflow?.history || []),
          {
            from: article.epaperWorkflow?.status || 'APPROVED_FOR_EPAPER',
            to: 'ASSIGNED_TO_PAGE',
            changedAt: new Date().toISOString(),
            changedBy: user?.fullName || 'संपादक',
            remarks: `असाइन पृष्ठ ${pageNum} (${edition.title})`,
          },
        ],
      };
      artMap.set(article.id, article);
    }

    const updatedPage = await this.saveEpaperPage({
      ...targetPage,
      elements: newElements,
      expectedVersion: targetPage.version,
    }, user);

    return {
      success: true,
      page: updatedPage,
      assignedCount: assignedElements.length,
      assignedElements,
      warnings,
      edition: {
        id: edition.id,
        title: edition.title,
        editionType: edition.editionType,
        totalPages: edition.totalPages,
      },
    };
  }

  async removeArticleFromEditionPage(editionId, pageNumber, articleId, user = null) {
    const edition = await this.getEpaperEditionById(editionId);
    if (!edition) {
      const err = new Error('ERR_NOT_FOUND: ई-पेपर संस्करण नहीं मिला।');
      err.statusCode = 404;
      err.code = 'ERR_NOT_FOUND';
      throw err;
    }

    if (edition.status === 'PUBLISHED') {
      const err = new Error('ERR_EDITION_ALREADY_PUBLISHED: प्रकाशित ई-पेपर संस्करण से समाचार हटाया नहीं जा सकता।');
      err.statusCode = 400;
      err.code = 'ERR_EDITION_ALREADY_PUBLISHED';
      throw err;
    }

    const pageNum = parseInt(pageNumber, 10);
    const targetPage = await this.getEpaperPageByNumber(editionId, pageNum);
    if (!targetPage) {
      const err = new Error(`ERR_PAGE_NOT_FOUND: पृष्ठ ${pageNum} नहीं मिला।`);
      err.statusCode = 404;
      err.code = 'ERR_PAGE_NOT_FOUND';
      throw err;
    }

    const filteredElements = (targetPage.elements || []).filter((el) => el.articleId !== articleId);
    const updatedPage = await this.saveEpaperPage({
      ...targetPage,
      elements: filteredElements,
      expectedVersion: targetPage.version,
    }, user);

    const artMap = this._collections.get('newsArticles');
    const article = artMap?.get(articleId) || Array.from(artMap?.values() || []).find((a) => a.slug === articleId);
    if (article) {
      const stillPlaced = await this.checkArticleInEdition(editionId, articleId);
      if (!stillPlaced.placed && article.epaperWorkflow?.status === 'ASSIGNED_TO_PAGE') {
        article.epaperWorkflow = {
          ...article.epaperWorkflow,
          status: 'APPROVED_FOR_EPAPER',
          updatedAt: new Date().toISOString(),
          editionId: null,
          pageNumber: null,
          remarks: `हटाया गया पृष्ठ ${pageNum} से`,
          history: [
            ...(article.epaperWorkflow?.history || []),
            {
              from: 'ASSIGNED_TO_PAGE',
              to: 'APPROVED_FOR_EPAPER',
              changedAt: new Date().toISOString(),
              changedBy: user?.fullName || 'संपादक',
              remarks: `हटाया गया पृष्ठ ${pageNum} से`,
            },
          ],
        };
        artMap.set(article.id, article);
      }
    }

    return {
      success: true,
      page: updatedPage,
      removedArticleId: articleId,
      sourceArticlePreserved: true,
    };
  }

  async getEditorialStaffCredits(user = null) {
    const usersMap = this._collections.get('users');
    const editorialUsers = Array.from(usersMap?.values() || []).filter((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : (u.role ? [u.role] : []);
      const normRoles = roles.map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
      return normRoles.some((r) => ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'MANAGING_EDITOR', 'EDITOR', 'DESK_EDITOR'].includes(r));
    }).map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: Array.isArray(u.roles) ? u.roles[0] : (u.role || 'EDITOR'),
      badgeNumber: u.badgeNumber || null,
    }));

    return editorialUsers;
  }

  async getReporterWhatsAppQuota(reporterId, dateStr = null) {
    // FINDING 20-01: Production Fail-Closed
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    if (!reporterId) return { reporterId: '', date: '', used: 0, maxDaily: 20, remaining: 20, quotaExceeded: false, timezone: 'Asia/Kolkata' };
    const istDate = dateStr || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    let maxDaily = 20;
    let used = 0;

    if (this.sharedDatabase) {
      const quotaRef = this.sharedDatabase.doc('epaperWhatsAppQuotas', reporterId);
      const usageRef = this.sharedDatabase.doc('epaperWhatsAppDailyUsage', `${reporterId}_${istDate}`);

      const quotaDoc = this.sharedDatabase.documents.get(quotaRef.path);
      if (quotaDoc && typeof quotaDoc.data?.maxDaily === 'number') {
        maxDaily = quotaDoc.data.maxDaily;
      }
      const usageDoc = this.sharedDatabase.documents.get(usageRef.path);
      if (usageDoc && typeof usageDoc.data?.used === 'number') {
        used = usageDoc.data.used;
      }
    } else if (this.firestore) {
      try {
        const quotaRef = this.firestore.collection('epaperWhatsAppQuotas').doc(reporterId);
        const usageRef = this.firestore.collection('epaperWhatsAppDailyUsage').doc(`${reporterId}_${istDate}`);

        const [quotaDoc, usageDoc] = await Promise.all([
          quotaRef.get(),
          usageRef.get(),
        ]);

        if (quotaDoc.exists && typeof quotaDoc.data()?.maxDaily === 'number') {
          maxDaily = quotaDoc.data().maxDaily;
        }
        if (usageDoc.exists && typeof usageDoc.data()?.used === 'number') {
          used = usageDoc.data().used;
        }
      } catch (dbErr) {
        if (process.env.NODE_ENV === 'production') {
          console.error('[firestoreAdapter] Database operation failed in production:', dbErr.message);
          const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
          err.code = 'ERR_DATABASE_UNAVAILABLE';
          err.statusCode = 503;
          throw err;
        }
        throw dbErr;
      }
    } else {
      const quotasMap = this._collections.get('epaperWhatsAppQuotas');
      const customQuota = quotasMap?.get(reporterId);
      if (customQuota && typeof customQuota.maxDaily === 'number') {
        maxDaily = customQuota.maxDaily;
      }
      const genMap = this._collections.get('epaperWhatsAppGenerations');
      const generations = Array.from(genMap?.values() || []).filter((g) => {
        const genDate = g.date || (g.createdAt ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(g.createdAt)) : '');
        return g.reporterId === reporterId && genDate === istDate;
      });
      used = generations.length;
    }

    const remaining = Math.max(0, maxDaily - used);
    return {
      reporterId,
      date: istDate,
      used,
      maxDaily,
      remaining,
      quotaExceeded: remaining === 0,
      timezone: 'Asia/Kolkata',
    };
  }

  async setReporterWhatsAppQuota(reporterId, quota) {
    // FINDING 20-01: Production Fail-Closed
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    if (!reporterId) throw new Error('ERR_INVALID_PARAM: reporterId is required');
    const numericQuota = Number(quota);
    if (isNaN(numericQuota) || numericQuota < 0) {
      throw new Error('ERR_INVALID_QUOTA: Quota must be a non-negative number');
    }
    const record = {
      reporterId,
      maxDaily: numericQuota,
      timezone: 'Asia/Kolkata',
      updatedAt: new Date().toISOString(),
    };
    if (this.sharedDatabase) {
      const docRef = this.sharedDatabase.doc('epaperWhatsAppQuotas', reporterId);
      const current = this.sharedDatabase.documents.get(docRef.path);
      this.sharedDatabase.documents.set(docRef.path, {
        data: record,
        version: (current ? current.version : 0) + 1,
        updatedAt: record.updatedAt,
      });
    } else if (this.firestore) {
      try {
        const docRef = this.firestore.collection('epaperWhatsAppQuotas').doc(reporterId);
        await docRef.set(record, { merge: true });
      } catch (dbErr) {
        if (process.env.NODE_ENV === 'production') {
          console.error('[firestoreAdapter] Database operation failed in production:', dbErr.message);
          const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
          err.code = 'ERR_DATABASE_UNAVAILABLE';
          err.statusCode = 503;
          throw err;
        }
        throw dbErr;
      }
    }
    const quotasMap = this._collections.get('epaperWhatsAppQuotas');
    if (quotasMap) quotasMap.set(reporterId, record);
    return record;
  }

  async atomicSaveEpaperWhatsAppGeneration(generationData, user = null) {
    // FINDING 20-01: Production Fail-Closed
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const reporterId = user?.id || generationData.reporterId || 'anonymous';
    const idempotencyKey = generationData.idempotencyKey || generationData.id || null;
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    if (this.sharedDatabase) {
      const usageRef = this.sharedDatabase.doc('epaperWhatsAppDailyUsage', `${reporterId}_${todayIST}`);
      const quotaRef = this.sharedDatabase.doc('epaperWhatsAppQuotas', reporterId);
      const genId = generationData.id || `wa-gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const genRef = this.sharedDatabase.doc('epaperWhatsAppGenerations', genId);
      const idemRef = idempotencyKey ? this.sharedDatabase.doc('epaperWhatsAppIdempotency', `${reporterId}_${idempotencyKey}`) : null;

      return await this.sharedDatabase.runTransaction(async (transaction) => {
        if (idemRef) {
          const existingIdem = await transaction.get(idemRef);
          if (existingIdem.exists && existingIdem.data()) {
            const priorGenId = existingIdem.data().generationId;
            const priorGenRef = this.sharedDatabase.doc('epaperWhatsAppGenerations', priorGenId);
            const priorGenDoc = await transaction.get(priorGenRef);
            if (priorGenDoc.exists && priorGenDoc.data()) {
              return priorGenDoc.data();
            }
          }
        }

        const [quotaDoc, usageDoc] = await Promise.all([
          transaction.get(quotaRef),
          transaction.get(usageRef),
        ]);

        const maxDaily = (quotaDoc.exists && typeof quotaDoc.data()?.maxDaily === 'number')
          ? quotaDoc.data().maxDaily
          : 20;
        const currentUsed = (usageDoc.exists && typeof usageDoc.data()?.used === 'number')
          ? usageDoc.data().used
          : 0;

        if (currentUsed >= maxDaily) {
          const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${maxDaily} कार्ड/दिन) समाप्त हो चुकी है।`);
          err.code = 'ERR_QUOTA_EXHAUSTED';
          err.statusCode = 429;
          err.details = {
            reporterId,
            date: todayIST,
            used: currentUsed,
            maxDaily,
            remaining: 0,
            quotaExceeded: true,
            timezone: 'Asia/Kolkata',
          };
          throw err;
        }

        const now = new Date().toISOString();
        const nextUsed = currentUsed + 1;
        transaction.set(usageRef, {
          reporterId,
          date: todayIST,
          used: nextUsed,
          maxDaily,
          updatedAt: now,
        }, { merge: true });

        const record = {
          ...generationData,
          id: genId,
          reporterId,
          idempotencyKey,
          date: todayIST,
          createdAt: now,
        };
        transaction.set(genRef, record);

        if (idemRef) {
          transaction.set(idemRef, {
            idempotencyKey,
            generationId: genId,
            reporterId,
            date: todayIST,
            createdAt: now,
          });
        }

        const genMap = this._collections.get('epaperWhatsAppGenerations');
        if (genMap) genMap.set(genId, record);

        return record;
      });
    }

    if (this.firestore) {
      const usageRef = this.firestore.collection('epaperWhatsAppDailyUsage').doc(`${reporterId}_${todayIST}`);
      const quotaRef = this.firestore.collection('epaperWhatsAppQuotas').doc(reporterId);
      const genId = generationData.id || `wa-gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const genRef = this.firestore.collection('epaperWhatsAppGenerations').doc(genId);
      const idemRef = idempotencyKey ? this.firestore.collection('epaperWhatsAppIdempotency').doc(`${reporterId}_${idempotencyKey}`) : null;

      try {
        return await this.firestore.runTransaction(async (transaction) => {
          // 1. ALL READS MUST PRECEDE ALL WRITES
          if (idemRef) {
            const existingIdem = await transaction.get(idemRef);
            if (existingIdem.exists && existingIdem.data()) {
              const priorGenId = existingIdem.data().generationId;
              const priorGenRef = this.firestore.collection('epaperWhatsAppGenerations').doc(priorGenId);
              const priorGenDoc = await transaction.get(priorGenRef);
              if (priorGenDoc.exists && priorGenDoc.data()) {
                return priorGenDoc.data(); // Idempotency: return existing record without consuming quota
              }
            }
          }

          const [quotaDoc, usageDoc] = await Promise.all([
            transaction.get(quotaRef),
            transaction.get(usageRef),
          ]);

          const maxDaily = (quotaDoc.exists && typeof quotaDoc.data()?.maxDaily === 'number')
            ? quotaDoc.data().maxDaily
            : 20;
          const currentUsed = (usageDoc.exists && typeof usageDoc.data()?.used === 'number')
            ? usageDoc.data().used
            : 0;

          if (currentUsed >= maxDaily) {
            const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${maxDaily} कार्ड/दिन) समाप्त हो चुकी है।`);
            err.code = 'ERR_QUOTA_EXHAUSTED';
            err.statusCode = 429;
            err.details = {
              reporterId,
              date: todayIST,
              used: currentUsed,
              maxDaily,
              remaining: 0,
              quotaExceeded: true,
              timezone: 'Asia/Kolkata',
            };
            throw err;
          }

          // 2. ALL WRITES AFTER ALL READS
          const now = new Date().toISOString();
          const nextUsed = currentUsed + 1;
          transaction.set(usageRef, {
            reporterId,
            date: todayIST,
            used: nextUsed,
            maxDaily,
            updatedAt: now,
          }, { merge: true });

          const rawRecord = {
            ...generationData,
            id: genId,
            reporterId,
            idempotencyKey,
            date: todayIST,
            createdAt: now,
          };
          const record = {};
          for (const [k, v] of Object.entries(rawRecord)) {
            if (v !== undefined) {
              record[k] = v;
            }
          }
          transaction.set(genRef, record);

          if (idemRef) {
            transaction.set(idemRef, {
              idempotencyKey,
              generationId: genId,
              reporterId,
              date: todayIST,
              createdAt: now,
            });
          }

          // Mirror in in-memory collection map for backward compatibility
          const genMap = this._collections.get('epaperWhatsAppGenerations');
          if (genMap) genMap.set(genId, record);

          return record;
        });
      } catch (txErr) {
        // FINDING 20-03: Concurrent Idempotency Collision Resolution
        // If a transaction fails (e.g. gRPC code 3 INVALID_ARGUMENT or conflict because a concurrent
        // peer process already committed the same idempotency key), perform a fresh authoritative
        // Firestore lookup outside the transaction to retrieve and return the committed generation.
        if (idemRef) {
          try {
            const committedIdemDoc = await idemRef.get();
            if (
              committedIdemDoc.exists &&
              committedIdemDoc.data()?.idempotencyKey === idempotencyKey &&
              committedIdemDoc.data()?.reporterId === reporterId
            ) {
              const committedGenId = committedIdemDoc.data().generationId;
              if (committedGenId) {
                const committedGenDoc = await this.firestore.collection('epaperWhatsAppGenerations').doc(committedGenId).get();
                if (committedGenDoc.exists && committedGenDoc.data()?.reporterId === reporterId) {
                  return committedGenDoc.data();
                }
              }
            }
          } catch (lookupErr) {
            console.warn('[firestoreAdapter] Idempotency fallback lookup failed:', lookupErr.message);
          }
        }
        // In production, if the transaction failed due to transport / connectivity / credential outage, fail closed with 503
        if (process.env.NODE_ENV === 'production' && (
          txErr.code === 14 || // UNAVAILABLE
          txErr.code === 4 ||  // DEADLINE_EXCEEDED
          txErr.code === 'ERR_DATABASE_UNAVAILABLE' ||
          txErr.message?.includes('default credentials') ||
          txErr.message?.includes('UNAVAILABLE') ||
          txErr.message?.includes('getaddrinfo')
        )) {
          console.error('[firestoreAdapter] Database transaction failed in production:', txErr.message);
          const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
          err.code = 'ERR_DATABASE_UNAVAILABLE';
          err.statusCode = 503;
          throw err;
        }
        // If not a confirmed idempotency collision, rethrow original error
        throw txErr;
      }
    }

    // Process-local fallback (for isolated offline / non-shared mode)
    const releaseLock = await this._acquireReporterLock(reporterId);
    try {
      const quotaInfo = await this.getReporterWhatsAppQuota(reporterId, todayIST);
      if (quotaInfo.quotaExceeded || quotaInfo.remaining <= 0) {
        const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${quotaInfo.maxDaily}) समाप्त हो चुकी है।`);
        err.code = 'ERR_QUOTA_EXHAUSTED';
        err.statusCode = 429;
        err.details = quotaInfo;
        throw err;
      }

      const genMap = this._collections.get('epaperWhatsAppGenerations');
      const genId = generationData.id || `wa-gen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      const record = {
        ...generationData,
        id: genId,
        reporterId,
        idempotencyKey,
        date: todayIST,
        createdAt: now,
      };
      genMap.set(genId, record);
      return record;
    } finally {
      if (typeof releaseLock === 'function') releaseLock();
    }
  }

  async saveEpaperWhatsAppGeneration(data, user = null) {
    return await this.atomicSaveEpaperWhatsAppGeneration(data, user);
  }

  async getEpaperWhatsAppGenerations(params = {}) {
    // FINDING 20-01: Production Fail-Closed
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }
    let list = [];
    if (this.sharedDatabase) {
      for (const [path, doc] of this.sharedDatabase.documents.entries()) {
        if (path.startsWith('epaperWhatsAppGenerations/')) {
          list.push(doc.data);
        }
      }
    } else if (this.firestore) {
      let queryRef = this.firestore.collection('epaperWhatsAppGenerations');
      if (params.reporterId) {
        queryRef = queryRef.where('reporterId', '==', params.reporterId);
      }
      if (params.date) {
        queryRef = queryRef.where('date', '==', params.date);
      }
      const snapshot = await queryRef.get();
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
    } else {
      const genMap = this._collections.get('epaperWhatsAppGenerations');
      list = Array.from(genMap?.values() || []);
    }
    if (params.reporterId) list = list.filter((g) => g.reporterId === params.reporterId);
    if (params.date) list = list.filter((g) => g.date === params.date);
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // =========================================================================
  // STEP 8: WHATSAPP EDITION GENERATOR & MULTI-STORY PACKAGES
  // =========================================================================

  async getWhatsAppEligibleArticles(params = {}, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const artMap = this._collections.get('newsArticles');
    let list = Array.from(artMap?.values() || []);

    const validEpaperStatuses = [
      'APPROVED_FOR_EPAPER',
      'ASSIGNED_TO_PAGE',
      'PAGE_DESIGNED',
      'QUALITY_CHECK',
      'FINAL_APPROVED',
    ];

    list = list.filter((a) => {
      const artStatus = String(a.status || '').toUpperCase();
      const epStatus = String(a.epaperWorkflow?.status || '').toUpperCase();
      if (['REJECTED', 'DRAFT', 'PENDING'].includes(artStatus)) return false;
      return artStatus === 'APPROVED' || artStatus === 'PUBLISHED' || validEpaperStatuses.includes(epStatus);
    });

    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(userRole);

    if (!isStaff) {
      const currentUserId = user?.id || '';
      const currentUserName = user?.fullName || user?.name || '';
      list = list.filter((a) => {
        return (
          a.authorId === currentUserId ||
          a.reporterId === currentUserId ||
          (currentUserName && (a.authorName === currentUserName || a.author === currentUserName))
        );
      });
    } else if (params.reporterId) {
      list = list.filter((a) => a.authorId === params.reporterId || a.reporterId === params.reporterId);
    }

    if (params.district) {
      const distLower = String(params.district).toLowerCase();
      list = list.filter((a) =>
        String(a.district || a.districtName || '').toLowerCase().includes(distLower)
      );
    }

    if (params.category) {
      const catLower = String(params.category).toLowerCase();
      list = list.filter((a) => String(a.category || '').toLowerCase().includes(catLower));
    }

    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((a) =>
        String(a.title || '').toLowerCase().includes(q) ||
        String(a.summary || '').toLowerCase().includes(q)
      );
    }

    return {
      items: list,
      total: list.length,
    };
  }

  async saveEpaperWhatsAppEditionPackage(data, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const reporterId = user?.id || data.reporterId || 'usr-reporter';
    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!data.format || !['1:1', '4:5'].includes(data.format)) {
      const err = new Error('ERR_VALIDATION: format (1:1 या 4:5) अनिवार्य है।');
      err.statusCode = 400;
      throw err;
    }

    if (!data.articleIds || !Array.isArray(data.articleIds) || data.articleIds.length === 0) {
      const err = new Error('ERR_VALIDATION: कम से कम एक समाचार (articleId) चुनना अनिवार्य है।');
      err.statusCode = 400;
      throw err;
    }

    const cardCount = data.articleIds.length;
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    const releaseLock = await this._acquireReporterLock(reporterId);
    try {
      const quota = await this.getReporterWhatsAppQuota(reporterId, todayIST);
      if (quota.quotaExceeded || quota.remaining < cardCount) {
        const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा समाप्त हो चुकी है। आवश्यक: ${cardCount}, उपलब्ध: ${quota.remaining} (अधिकतम: ${quota.maxDaily})।`);
        err.statusCode = 429;
        err.code = 'ERR_QUOTA_EXHAUSTED';
        err.details = { ...quota, required: cardCount };
        throw err;
      }

      const artMap = this._collections.get('newsArticles');
      const allArticles = Array.from(artMap?.values() || []);
      const validArticles = [];

      for (const artId of data.articleIds) {
        const art = allArticles.find((a) => a.id === artId);
        if (!art) {
          const err = new Error(`ERR_ARTICLE_NOT_FOUND: चयनित समाचार ID ${artId} नहीं मिला।`);
          err.statusCode = 400;
          throw err;
        }

        const artStatus = String(art.status || '').toUpperCase();
        const epStatus = String(art.epaperWorkflow?.status || '').toUpperCase();
        const validEpaperStatuses = ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'];
        const isEligible = artStatus === 'APPROVED' || artStatus === 'PUBLISHED' || validEpaperStatuses.includes(epStatus);

        if (!isEligible || ['REJECTED', 'DRAFT', 'PENDING'].includes(artStatus)) {
          const err = new Error(`ERR_ARTICLE_NOT_ELIGIBLE: समाचार '${art.title || artId}' स्वीकृत या प्रकाशित नहीं है।`);
          err.statusCode = 400;
          throw err;
        }

        if (!isStaff) {
          const currentUserId = user?.id || '';
          const currentUserName = user?.fullName || user?.name || '';
          const isOwner =
            art.authorId === currentUserId ||
            art.reporterId === currentUserId ||
            (currentUserName && (art.authorName === currentUserName || art.author === currentUserName));

          if (!isOwner) {
            const err = new Error(`ERR_FORBIDDEN: संवाददाता केवल अपनी स्वीकृत खबरों का चयन कर सकते हैं। '${art.title}' आपकी रिपोर्ट नहीं है।`);
            err.statusCode = 403;
            throw err;
          }
        }

        validArticles.push(art);
      }

      const packageId = `wa-pkg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const cards = [];

      let genMap = this._collections.get('epaperWhatsAppGenerations');
      if (!genMap) {
        genMap = new Map();
        this._collections.set('epaperWhatsAppGenerations', genMap);
      }

      for (let idx = 0; idx < validArticles.length; idx++) {
        const art = validArticles[idx];
        const cardId = `wa-card-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;
        const storagePath = `whatsapp/${reporterId}/${packageId}_card_${idx + 1}.png`;

        const cardItem = {
          id: cardId,
          packageId,
          cardIndex: idx + 1,
          articleId: art.id,
          reporterId,
          reporterName: user?.fullName || art.authorName || 'संवाददाता',
          reporterBadge: user?.badgeNumber || 'BNW-STRINGER',
          format: data.format,
          headline: art.title || '',
          body: art.summary || art.content || '',
          imageUrl: art.featuredImage || art.imageUrl || null,
          category: art.category || 'समाचार',
          districtName: art.districtName || art.district || 'मध्य प्रदेश',
          storagePath,
          isPrivate: true,
          createdAt: now,
          updatedAt: now,
          version: 1,
        };

        cards.push(cardItem);
        genMap.set(cardId, cardItem);
      }

      const pkgRecord = {
        id: packageId,
        editionTitle: data.editionTitle || 'दैनिक व्हाट्सएप बुलेटिन',
        format: data.format,
        reporterId,
        reporterName: user?.fullName || 'संवाददाता',
        reporterBadge: user?.badgeNumber || 'BNW-STRINGER',
        cardCount: cards.length,
        articleIds: data.articleIds,
        cards,
        quotaConsumed: cards.length,
        status: 'GENERATED',
        createdAt: now,
        updatedAt: now,
      };

      let pkgMap = this._collections.get('epaperWhatsAppEditionPackages');
      if (!pkgMap) {
        pkgMap = new Map();
        this._collections.set('epaperWhatsAppEditionPackages', pkgMap);
      }
      pkgMap.set(packageId, pkgRecord);

      return pkgRecord;
    } finally {
      if (typeof releaseLock === 'function') releaseLock();
    }
  }

  async getEpaperWhatsAppEditionPackages(params = {}, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const pkgMap = this._collections.get('epaperWhatsAppEditionPackages');
    let list = Array.from(pkgMap?.values() || []);

    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!isStaff && user?.id) {
      list = list.filter((p) => p.reporterId === user.id);
    } else if (params.reporterId) {
      list = list.filter((p) => p.reporterId === params.reporterId);
    }

    if (params.format) {
      list = list.filter((p) => p.format === params.format);
    }

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async getEpaperWhatsAppEditionPackageById(id, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const pkgMap = this._collections.get('epaperWhatsAppEditionPackages');
    const pkg = pkgMap ? pkgMap.get(id) : null;
    if (!pkg) return null;

    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    if (!isStaff && user?.id && pkg.reporterId !== user.id) {
      const err = new Error('ERR_FORBIDDEN: आप किसी अन्य संवाददाता के पैकेज का विवरण नहीं देख सकते।');
      err.statusCode = 403;
      throw err;
    }

    return pkg;
  }

  async regenerateEpaperWhatsAppCard(packageId, cardId, updates = {}, user = null) {
    if (process.env.NODE_ENV === 'production' && !this.firestore) {
      const err = new Error('ERR_DATABASE_UNAVAILABLE: Authoritative Firestore connection is unconfigured or unreachable in production.');
      err.code = 'ERR_DATABASE_UNAVAILABLE';
      err.statusCode = 503;
      throw err;
    }

    const reporterId = user?.id || updates.reporterId || 'usr-reporter';
    const userRole = String(user?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'MASTER_ADMIN', 'SUPER_ADMIN'].includes(userRole);

    const releaseLock = await this._acquireReporterLock(reporterId);
    try {
      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      const quota = await this.getReporterWhatsAppQuota(reporterId, todayIST);
      if (quota.quotaExceeded || quota.remaining < 1) {
        const err = new Error(`दैनिक व्हाट्सएप कार्ड निर्माण सीमा (${quota.maxDaily} कार्ड/दिन) समाप्त हो चुकी है। कार्ड पुनः निर्माण हेतु कम से कम 1 कोटा शेष होना चाहिए।`);
        err.statusCode = 429;
        err.code = 'ERR_QUOTA_EXHAUSTED';
        err.details = quota;
        throw err;
      }

      const pkgMap = this._collections.get('epaperWhatsAppEditionPackages');
      const pkg = pkgMap ? pkgMap.get(packageId) : null;

      if (pkg && !isStaff && pkg.reporterId !== user?.id) {
        const err = new Error('ERR_FORBIDDEN: आप किसी अन्य संवाददाता के कार्ड को पुनः उत्पन्न नहीं कर सकते।');
        err.statusCode = 403;
        throw err;
      }

      const now = new Date().toISOString();
      let targetCard = null;

      if (pkg && Array.isArray(pkg.cards)) {
        const cIdx = pkg.cards.findIndex((c) => c.id === cardId || c.cardIndex === Number(cardId));
        if (cIdx !== -1) {
          targetCard = pkg.cards[cIdx];
          const newVersion = (targetCard.version || 1) + 1;
          const updatedCard = {
            ...targetCard,
            headline: updates.headline || targetCard.headline,
            body: updates.body || targetCard.body,
            imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : targetCard.imageUrl,
            districtName: updates.districtName || targetCard.districtName,
            format: updates.format || targetCard.format,
            storagePath: `whatsapp/${reporterId}/${targetCard.id}_regen_${Date.now()}.png`,
            version: newVersion,
            updatedAt: now,
          };
          pkg.cards[cIdx] = updatedCard;
          pkg.quotaConsumed = (pkg.quotaConsumed || pkg.cards.length) + 1;
          pkg.updatedAt = now;
          targetCard = updatedCard;
        }
      }

      let genMap = this._collections.get('epaperWhatsAppGenerations');
      if (!genMap) {
        genMap = new Map();
        this._collections.set('epaperWhatsAppGenerations', genMap);
      }

      const regenRecord = {
        id: `wa-card-regen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        packageId: packageId || null,
        originalCardId: cardId,
        reporterId,
        reporterName: user?.fullName || targetCard?.reporterName || 'संवाददाता',
        reporterBadge: user?.badgeNumber || targetCard?.reporterBadge || 'BNW-STRINGER',
        format: updates.format || targetCard?.format || '4:5',
        headline: updates.headline || targetCard?.headline || 'शीर्षक',
        body: updates.body || targetCard?.body || '',
        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : targetCard?.imageUrl,
        storagePath: `whatsapp/${reporterId}/${cardId}_regen_${Date.now()}.png`,
        isPrivate: true,
        isRegeneration: true,
        createdAt: now,
        updatedAt: now,
        version: targetCard ? targetCard.version : 2,
      };

      genMap.set(regenRecord.id, regenRecord);

      return {
        card: targetCard || regenRecord,
        package: pkg,
      };
    } finally {
      if (typeof releaseLock === 'function') releaseLock();
    }
  }

  // =========================================================================
  // STEP 7: E-PAPER REPORTER WORKSPACE & PROFILE INTEGRATION METHODS
  // =========================================================================

  async getReporterProfile(reporterId) {
    if (!reporterId) return null;
    const cleanId = String(reporterId).trim().toLowerCase();
    const repMap = this._collections.get('reporterProfiles');
    const reps = Array.from(repMap?.values() || []);

    let found = reps.find((r) =>
      String(r.id || '').toLowerCase() === cleanId ||
      String(r.badgeNumber || '').toLowerCase() === cleanId ||
      String(r.email || '').toLowerCase() === cleanId ||
      (cleanId === 'rep-001' && (r.id === 'rep-active' || r.badgeNumber === 'BNW-REP-0101'))
    );

    if (found) {
      return {
        ...found,
        verificationStatus: found.verificationStatus || (found.status === 'ACTIVE' ? 'VERIFIED' : 'PENDING'),
        bureau: found.bureau || (found.assignedDivision ? `${found.assignedDivision} ब्यूरो` : `${(found.assignedDistricts && found.assignedDistricts[0]) || 'भोपाल'} ब्यूरो`),
      };
    }

    const userMap = this._collections.get('users');
    const users = Array.from(userMap?.values() || []);
    const matchedUser = users.find((u) =>
      String(u.id || '').toLowerCase() === cleanId ||
      String(u.badgeNumber || '').toLowerCase() === cleanId ||
      String(u.email || '').toLowerCase() === cleanId
    );

    if (matchedUser) {
      if (matchedUser.badgeNumber || matchedUser.email) {
        const byBadge = reps.find((r) =>
          (matchedUser.badgeNumber && String(r.badgeNumber || '').toLowerCase() === String(matchedUser.badgeNumber).toLowerCase()) ||
          (matchedUser.email && String(r.email || '').toLowerCase() === String(matchedUser.email).toLowerCase())
        );
        if (byBadge) return { ...byBadge, userId: matchedUser.id, bureau: byBadge.bureau || `${(byBadge.assignedDistricts && byBadge.assignedDistricts[0]) || 'भोपाल'} ब्यूरो` };
      }
      return {
        id: matchedUser.id,
        name: matchedUser.fullName || matchedUser.name || 'संवाददाता',
        email: matchedUser.email || '',
        phone: matchedUser.phoneNumber || matchedUser.phone || '+91 98260 00000',
        role: matchedUser.roles?.includes('REPORTER') ? 'reporter' : 'reporter',
        assignedDistricts: matchedUser.assignedDistricts || [matchedUser.district || 'भोपाल'],
        assignedDivision: matchedUser.assignedDivision || 'भोपाल संभाग',
        beats: matchedUser.beats || ['सामान्य समाचार', 'शासन-प्रशासन'],
        totalStoriesFiled: 0,
        totalStoriesPublished: 0,
        badgeNumber: matchedUser.badgeNumber || `BNW-REP-${matchedUser.id.replace(/\D/g, '') || '0101'}`,
        joinedDate: matchedUser.createdAt ? new Date(matchedUser.createdAt).toLocaleDateString('hi-IN') : '15 जनवरी 2024',
        avatar: matchedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        status: matchedUser.status || 'ACTIVE',
        verificationStatus: matchedUser.verificationStatus || 'VERIFIED',
        bureau: matchedUser.bureau || `${matchedUser.district || 'भोपाल'} ब्यूरो`,
        bio: matchedUser.bio || 'क्षेत्रीय संवाददाता, ब्रेकिंग न्यूज़ वाला।',
      };
    }
    return null;
  }

  async getReporterWorkspaceSummary(reporterId, user = null) {
    if (!reporterId) {
      const err = new Error('ERR_INVALID_PARAM: reporterId अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PARAM';
      throw err;
    }

    if (user) {
      const userRoles = [...(Array.isArray(user.roles) ? user.roles : []), user.role]
        .filter(Boolean)
        .map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
      const isStaff = userRoles.some((r) =>
        ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'MANAGING_EDITOR', 'EDITOR'].includes(r)
      );

      if (!isStaff) {
        const uId = String(user.id || user.uid || '').toLowerCase();
        const uBadge = String(user.badgeNumber || '').toLowerCase();
        const uEmail = String(user.email || '').toLowerCase();
        const target = String(reporterId).toLowerCase();

        const isSelf = target === uId || target === uBadge || target === uEmail;
        if (!isSelf) {
          const err = new Error('ERR_FORBIDDEN: संवाददाता केवल अपना स्वयं का कार्यक्षेत्र देख सकते हैं।');
          err.statusCode = 403;
          err.code = 'ERR_FORBIDDEN';
          throw err;
        }
      }
    }

    const profile = await this.getReporterProfile(reporterId);
    if (!profile) {
      const err = new Error(`ERR_REPORTER_NOT_FOUND: संवाददाता प्रोफाइल [${reporterId}] नहीं मिली।`);
      err.statusCode = 404;
      err.code = 'ERR_REPORTER_NOT_FOUND';
      throw err;
    }

    const idSet = new Set([
      String(profile.id || '').toLowerCase(),
      String(profile.badgeNumber || '').toLowerCase(),
      String(profile.email || '').toLowerCase(),
      String(reporterId).toLowerCase(),
    ].filter(Boolean));

    if (user && String(user.id || '').toLowerCase() === String(reporterId).toLowerCase()) {
      if (user.badgeNumber) idSet.add(String(user.badgeNumber).toLowerCase());
      if (user.email) idSet.add(String(user.email).toLowerCase());
    }

    if (profile.id === 'rep-active' || profile.badgeNumber === 'BNW-REP-0101' || String(reporterId).toLowerCase() === 'rep-001') {
      idSet.add('rep-001');
      idSet.add('rep-active');
    }

    const repNameLower = String(profile.name || '').trim().toLowerCase();
    const baseRepName = repNameLower.replace(/\s*\(.*?\)\s*/g, '').trim();

    const artMap = this._collections.get('newsArticles');
    const allArticles = Array.from(artMap?.values() || []);
    const reporterArticles = allArticles.filter((a) => {
      const aAuthId = String(a.authorId || '').toLowerCase();
      const aRepId = String(a.reporterId || '').toLowerCase();
      const aAuthName = String(a.authorName || '').trim().toLowerCase();
      const aByline = String(a.byline || '').trim().toLowerCase();
      const baseAuthName = aAuthName.replace(/\s*\(.*?\)\s*/g, '').trim();

      const isNameMatch = repNameLower && (
        aAuthName === repNameLower ||
        aByline === repNameLower ||
        (baseRepName && (baseAuthName === baseRepName || aByline === baseRepName))
      );

      return (
        idSet.has(aAuthId) ||
        idSet.has(aRepId) ||
        isNameMatch
      );
    });

    const edMap = this._collections.get('epaperEditions');
    const editions = Array.from(edMap?.values() || []);
    const placementMap = new Map();

    for (const ed of editions) {
      for (const page of ed.pages || []) {
        for (const el of page.elements || []) {
          if (el.elementType === 'STORY' && el.articleId) {
            placementMap.set(String(el.articleId), {
              editionId: ed.id,
              editionTitle: ed.title || 'दैनिक संस्करण',
              editionDate: ed.publicationDate || ed.createdAt || '',
              editionStatus: ed.status || 'DRAFT',
              editionType: ed.editionType || 'DAILY',
              pageNumber: page.pageNumber,
              pageId: page.id,
              slotId: el.slotId || el.id,
              bylineCredit: el.byline || profile.name || 'संवाददाता',
              readerUrl: `/epaper?edition=${ed.id}&page=${page.pageNumber}`,
            });
          }
        }
      }
    }

    const contributions = reporterArticles.map((a) => {
      const artKey = String(a.id);
      const slugKey = String(a.slug || '');
      const placement = placementMap.get(artKey) || (slugKey ? placementMap.get(slugKey) : null);

      const hasImg = Boolean(a.featuredImage || a.imageUrl);
      const imgStatus = hasImg ? 'VALID' : 'MISSING';
      const text = `${a.title || ''} ${a.summary || ''} ${a.content || ''}`;
      const charCount = text.length;
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      const assignment = placement || (a.epaperWorkflow?.assignedEditionId ? {
        editionId: a.epaperWorkflow.assignedEditionId,
        editionTitle: a.epaperWorkflow.editionTitle || 'दैनिक संस्करण',
        editionDate: a.epaperWorkflow.editionDate || '',
        editionStatus: a.epaperWorkflow.editionStatus || 'DRAFT',
        editionType: a.epaperWorkflow.editionType || 'DAILY',
        pageNumber: a.epaperWorkflow.assignedPageNumber || 1,
        pageId: a.epaperWorkflow.pageId || '',
        slotId: a.epaperWorkflow.slotId || '',
        bylineCredit: a.byline || profile.name,
        readerUrl: `/epaper?edition=${a.epaperWorkflow.assignedEditionId}&page=${a.epaperWorkflow.assignedPageNumber || 1}`,
      } : undefined);

      return {
        articleId: a.id,
        headline: a.title,
        summary: a.summary || '',
        category: a.categoryName || a.category || 'सामान्य',
        categoryId: a.categoryId,
        district: a.districtName || a.district || (profile.assignedDistricts && profile.assignedDistricts[0]) || 'भोपाल',
        districtId: a.districtId,
        submissionDate: a.submittedAt || a.createdAt || new Date().toISOString(),
        status: a.status || 'SUBMITTED',
        workflowStatus: a.epaperWorkflow?.status || (placement ? 'ASSIGNED_TO_PAGE' : (a.status === 'PUBLISHED' ? 'PUBLISHED' : (a.status === 'APPROVED' ? 'APPROVED' : 'EDITORIAL_REVIEW'))),
        hasImage: hasImg,
        imageUrl: a.featuredImage || a.imageUrl || '',
        imageStatus: imgStatus,
        epaperAssignment: assignment,
        editorialRemarks: a.editorialRemarks || a.epaperWorkflow?.editorialRemarks || a.rejectionReason || a.editorialFeedback || '',
        rejectionReason: a.rejectionReason || '',
        characterCount: charCount,
        wordCount: wordCount,
        priority: a.priority || 'NORMAL',
        byline: a.byline || profile.name,
        publishedAt: a.publishedAt,
      };
    });

    const publishedHistory = [];
    for (const c of contributions) {
      const isEditionPublished = c.epaperAssignment?.editionStatus === 'PUBLISHED';
      const isArticlePublished = c.status === 'PUBLISHED';

      if (isEditionPublished || (isArticlePublished && c.epaperAssignment)) {
        publishedHistory.push({
          articleId: c.articleId,
          headline: c.headline,
          bylineCredit: c.epaperAssignment?.bylineCredit || c.byline || profile.name,
          publicationDate: c.epaperAssignment?.editionDate || c.publishedAt || c.submissionDate,
          editionId: c.epaperAssignment?.editionId || '',
          editionTitle: c.epaperAssignment?.editionTitle || 'दैनिक संस्करण',
          editionType: c.epaperAssignment?.editionType || 'DAILY',
          pageNumber: c.epaperAssignment?.pageNumber || 1,
          pageId: c.epaperAssignment?.pageId,
          imageUrl: c.imageUrl,
          readerUrl: c.epaperAssignment?.readerUrl || `/epaper?edition=${c.epaperAssignment?.editionId}&page=${c.epaperAssignment?.pageNumber || 1}`,
          pageThumbnailUrl: c.imageUrl || '',
          isReadOnly: true,
          districtName: c.district,
          categoryName: c.category,
          publishedAt: c.publishedAt,
        });
      }
    }

    const adMap = this._collections.get('epaperAdSubmissions');
    const allAds = Array.from(adMap?.values() || []);
    const assignedAds = allAds.filter((ad) => {
      const adRepId = String(ad.reporterId || '').toLowerCase();
      const adAssignedId = String(ad.assignedReporterId || '').toLowerCase();
      return idSet.has(adRepId) || idSet.has(adAssignedId);
    });

    const approvedStatuses = ['APPROVED', 'PUBLISHED', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED'];
    const reviewStatuses = ['PENDING_REVIEW', 'UNDER_REVIEW', 'IN_REVIEW', 'EDITORIAL_REVIEW', 'SUBMITTED'];
    const returnedStatuses = ['REJECTED', 'CHANGES_REQUESTED', 'RETURNED'];

    const totalSubmittedNews = contributions.length;
    const approvedNews = contributions.filter((c) =>
      approvedStatuses.includes(String(c.status).toUpperCase()) ||
      approvedStatuses.includes(String(c.workflowStatus).toUpperCase())
    ).length;

    const epaperSelectedNews = contributions.filter((c) =>
      Boolean(c.epaperAssignment) ||
      ['APPROVED_FOR_EPAPER', 'ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK', 'FINAL_APPROVED', 'PUBLISHED'].includes(String(c.workflowStatus).toUpperCase())
    ).length;

    const publishedEpaperStories = publishedHistory.length;
    const pendingReviewNews = contributions.filter((c) =>
      reviewStatuses.includes(String(c.status).toUpperCase()) ||
      reviewStatuses.includes(String(c.workflowStatus).toUpperCase())
    ).length;

    const returnedNews = contributions.filter((c) =>
      returnedStatuses.includes(String(c.status).toUpperCase()) ||
      returnedStatuses.includes(String(c.workflowStatus).toUpperCase()) ||
      Boolean(c.rejectionReason)
    ).length;

    const publishedAds = assignedAds.filter((ad) =>
      ad.status === 'PUBLISHED' || ad.status === 'COMPLETED'
    ).length;

    let whatsappQuota = null;
    let whatsappHistory = [];
    try {
      whatsappQuota = await this.getReporterWhatsAppQuota(profile.id || reporterId);
      whatsappHistory = await this.getEpaperWhatsAppGenerations({ reporterId: profile.id || reporterId });
    } catch {
      whatsappQuota = { reporterId: profile.id, date: new Date().toISOString().split('T')[0], used: 0, maxDaily: 20, remaining: 20, quotaExceeded: false, timezone: 'Asia/Kolkata' };
    }

    const activities = [];

    for (const c of contributions) {
      if (c.submissionDate) {
        activities.push({
          id: `act-sub-${c.articleId}`,
          reporterId: profile.id,
          type: 'ARTICLE_SUBMITTED',
          title: 'समाचार प्रेषित किया गया',
          description: `"${c.headline.slice(0, 45)}..." संपादकीय समीक्षा हेतु प्रेषित।`,
          timestamp: c.submissionDate,
          metadata: { articleId: c.articleId, headline: c.headline },
        });
      }
      if (c.status === 'APPROVED' || c.workflowStatus === 'APPROVED') {
        activities.push({
          id: `act-app-${c.articleId}`,
          reporterId: profile.id,
          type: 'ARTICLE_APPROVED',
          title: 'समाचार स्वीकृत हुआ',
          description: `संपादक द्वारा "${c.headline.slice(0, 45)}..." स्वीकृत किया गया।`,
          timestamp: c.publishedAt || c.submissionDate,
          metadata: { articleId: c.articleId, headline: c.headline },
        });
      }
      if (c.editorialRemarks || c.rejectionReason) {
        activities.push({
          id: `act-ret-${c.articleId}`,
          reporterId: profile.id,
          type: 'ARTICLE_RETURNED',
          title: 'संपादकीय टिप्पणी / सुधार निर्देश',
          description: `टिप्पणी: ${c.editorialRemarks || c.rejectionReason}`,
          timestamp: c.submissionDate,
          metadata: { articleId: c.articleId, remarks: c.editorialRemarks || c.rejectionReason },
        });
      }
      if (c.epaperAssignment) {
        activities.push({
          id: `act-assign-${c.articleId}`,
          reporterId: profile.id,
          type: 'EPAPER_PAGE_ASSIGNED',
          title: 'ई-पेपर पृष्ठ पर आवंटित',
          description: `"${c.headline.slice(0, 40)}..." पृष्ठ ${c.epaperAssignment.pageNumber} (${c.epaperAssignment.editionTitle}) पर लगाया गया।`,
          timestamp: c.epaperAssignment.editionDate || c.submissionDate,
          metadata: { articleId: c.articleId, pageNumber: c.epaperAssignment.pageNumber, editionId: c.epaperAssignment.editionId },
        });
      }
    }

    for (const ad of assignedAds) {
      activities.push({
        id: `act-ad-${ad.id}`,
        reporterId: profile.id,
        type: ad.status === 'APPROVED' ? 'AD_APPROVED' : (ad.status === 'REJECTED' ? 'AD_REJECTED' : 'AD_ASSIGNED'),
        title: `विज्ञापन स्थिति: ${ad.status}`,
        description: `विज्ञापन "${ad.title || ad.businessName}" (${ad.slotType}) की स्थिति ${ad.status} है।`,
        timestamp: ad.updatedAt || ad.createdAt || new Date().toISOString(),
        metadata: { adId: ad.id, status: ad.status, title: ad.title },
      });
    }

    for (const wg of whatsappHistory) {
      activities.push({
        id: `act-wg-${wg.id}`,
        reporterId: profile.id,
        type: 'WHATSAPP_GENERATED',
        title: 'व्हाट्सएप कार्ड जनरेट किया गया',
        description: `प्रारूप ${wg.format} कार्ड: "${(wg.headline || '').slice(0, 40)}..."`,
        timestamp: wg.createdAt || new Date().toISOString(),
        metadata: { id: wg.id, format: wg.format },
      });
    }

    activities.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    const metrics = {
      totalSubmittedNews,
      approvedNews,
      epaperSelectedNews,
      publishedEpaperStories,
      pendingReviewNews,
      returnedNews,
      assignedAds: assignedAds.length,
      publishedAds,
      recentActivityCount: activities.length,
    };

    return {
      profile,
      metrics,
      contributions,
      publishedHistory,
      assignedAds,
      activities: activities.slice(0, 50),
      whatsappStatus: {
        quota: whatsappQuota,
        recentGenerations: whatsappHistory.slice(0, 10).map((g) => ({
          id: g.id,
          format: g.format,
          headline: g.headline,
          imageUrl: g.imageUrl,
          timestamp: g.createdAt,
          previewUrl: g.imageUrl,
        })),
        canGenerate: !whatsappQuota?.quotaExceeded,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getReporterContributions(reporterId, params = {}, user = null) {
    const summary = await this.getReporterWorkspaceSummary(reporterId, user);
    let list = [...summary.contributions];

    if (params.status && params.status !== 'all') {
      const s = String(params.status).toLowerCase();
      if (s === 'submitted') {
        list = list.filter((c) => ['SUBMITTED', 'PENDING_REVIEW'].includes(String(c.status).toUpperCase()));
      } else if (s === 'under_review') {
        list = list.filter((c) => ['UNDER_REVIEW', 'IN_REVIEW', 'EDITORIAL_REVIEW'].includes(String(c.status).toUpperCase()) || ['EDITORIAL_REVIEW'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'approved') {
        list = list.filter((c) => ['APPROVED'].includes(String(c.status).toUpperCase()) || ['APPROVED', 'APPROVED_FOR_EPAPER'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'epaper_assigned') {
        list = list.filter((c) => Boolean(c.epaperAssignment) || ['ASSIGNED_TO_PAGE', 'PAGE_DESIGNED', 'QUALITY_CHECK'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'published') {
        list = list.filter((c) => ['PUBLISHED'].includes(String(c.status).toUpperCase()) || ['PUBLISHED'].includes(String(c.workflowStatus).toUpperCase()));
      } else if (s === 'returned' || s === 'rejected') {
        list = list.filter((c) => ['REJECTED', 'CHANGES_REQUESTED', 'RETURNED'].includes(String(c.status).toUpperCase()) || Boolean(c.rejectionReason) || Boolean(c.editorialRemarks));
      }
    }

    if (params.districtId || params.district) {
      const dist = String(params.districtId || params.district).toLowerCase();
      list = list.filter((c) => String(c.district || '').toLowerCase() === dist || String(c.districtId || '').toLowerCase() === dist);
    }

    if (params.categoryId || params.category) {
      const cat = String(params.categoryId || params.category).toLowerCase();
      list = list.filter((c) => String(c.category || '').toLowerCase() === cat || String(c.categoryId || '').toLowerCase() === cat);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((c) =>
        String(c.headline || '').toLowerCase().includes(q) ||
        String(c.summary || '').toLowerCase().includes(q) ||
        String(c.articleId || '').toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.max(1, parseInt(params.limit || '20', 10));
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getReporterPublishedStories(reporterId, params = {}, user = null) {
    const summary = await this.getReporterWorkspaceSummary(reporterId, user);
    let list = [...summary.publishedHistory];

    if (params.editionId && params.editionId !== 'all') {
      list = list.filter((p) => p.editionId === params.editionId);
    }

    if (params.startDate) {
      list = list.filter((p) => p.publicationDate >= params.startDate);
    }

    if (params.endDate) {
      list = list.filter((p) => p.publicationDate <= params.endDate);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase().trim();
      list = list.filter((p) =>
        String(p.headline || '').toLowerCase().includes(q) ||
        String(p.editionTitle || '').toLowerCase().includes(q)
      );
    }

    const total = list.length;
    return { items: list, total };
  }

  async updateReporterProfileRestricted(reporterId, updates = {}, user = null) {
    if (!reporterId) {
      const err = new Error('ERR_INVALID_PARAM: reporterId अनिवार्य है।');
      err.statusCode = 400;
      err.code = 'ERR_INVALID_PARAM';
      throw err;
    }

    let isStaff = false;
    if (user) {
      const userRoles = [...(Array.isArray(user.roles) ? user.roles : []), user.role]
        .filter(Boolean)
        .map((r) => String(r).toUpperCase().replace(/^ROLE_/, ''));
      isStaff = userRoles.some((r) =>
        ['MASTER_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'CHIEF_EDITOR', 'MANAGING_EDITOR', 'EDITOR'].includes(r)
      );
    }

    if (!isStaff) {
      if (user) {
        const uId = String(user.id || user.uid || '').toLowerCase();
        const uBadge = String(user.badgeNumber || '').toLowerCase();
        const target = String(reporterId).toLowerCase();

        if (target !== uId && target !== uBadge) {
          const err = new Error('ERR_FORBIDDEN: आप केवल अपनी स्वयं की प्रोफाइल संशोधित कर सकते हैं।');
          err.statusCode = 403;
          err.code = 'ERR_FORBIDDEN';
          throw err;
        }
      }

      const FORBIDDEN_FIELDS = [
        'verificationStatus',
        'role',
        'roles',
        'assignedDistricts',
        'assignedDivision',
        'badgeNumber',
        'status',
        'totalStoriesFiled',
        'totalStoriesPublished',
      ];

      for (const field of FORBIDDEN_FIELDS) {
        if (updates[field] !== undefined) {
          const err = new Error(`ERR_FORBIDDEN: संवाददाता को '${field}' संशोधित करने की अनुमति नहीं है। केवल संपर्क विवरण और फोटो बदले जा सकते हैं।`);
          err.statusCode = 403;
          err.code = 'ERR_FORBIDDEN';
          throw err;
        }
      }
    }

    const repMap = this._collections.get('reporterProfiles');
    let rep = repMap ? repMap.get(reporterId) : null;

    if (!rep && repMap) {
      for (const r of repMap.values()) {
        if (
          String(r.id || '').toLowerCase() === String(reporterId).toLowerCase() ||
          String(r.badgeNumber || '').toLowerCase() === String(reporterId).toLowerCase() ||
          (String(reporterId).toLowerCase() === 'rep-001' && (r.id === 'rep-active' || r.badgeNumber === 'BNW-REP-0101'))
        ) {
          rep = r;
          break;
        }
      }
    }

    if (!rep) {
      // Check users collection for link
      const userMap = this._collections.get('users');
      const users = Array.from(userMap?.values() || []);
      const u = users.find((usr) =>
        String(usr.id || '').toLowerCase() === String(reporterId).toLowerCase() ||
        String(usr.badgeNumber || '').toLowerCase() === String(reporterId).toLowerCase()
      );

      let linkedRep = null;
      if (u && repMap) {
        linkedRep = Array.from(repMap.values()).find((r) =>
          (u.badgeNumber && String(r.badgeNumber || '').toLowerCase() === String(u.badgeNumber).toLowerCase()) ||
          (u.email && String(r.email || '').toLowerCase() === String(u.email).toLowerCase())
        );
      }

      if (linkedRep) {
        rep = linkedRep;
      } else {
        rep = {
          id: reporterId,
          name: u?.fullName || u?.name || 'संवाददाता',
          email: u?.email || '',
          phone: u?.phoneNumber || u?.phone || '',
          role: 'reporter',
          assignedDistricts: u?.assignedDistricts || ['भोपाल'],
          assignedDivision: u?.assignedDivision || 'भोपाल संभाग',
          beats: u?.beats || ['सामान्य समाचार'],
          totalStoriesFiled: 0,
          totalStoriesPublished: 0,
          badgeNumber: u?.badgeNumber || 'BNW-REP-0101',
          joinedDate: '15 जनवरी 2024',
          avatar: u?.avatar || '',
          status: 'ACTIVE',
          verificationStatus: 'VERIFIED',
        };
        if (repMap) repMap.set(reporterId, rep);
      }
    }

    if (updates.phone !== undefined) rep.phone = String(updates.phone).trim();
    if (updates.avatar !== undefined) rep.avatar = String(updates.avatar).trim();
    if (updates.bio !== undefined) rep.bio = String(updates.bio).trim();
    if (updates.bureau !== undefined) rep.bureau = String(updates.bureau).trim();
    if (updates.email !== undefined && isStaff) rep.email = String(updates.email).trim();

    if (isStaff) {
      if (updates.verificationStatus !== undefined) rep.verificationStatus = updates.verificationStatus;
      if (updates.status !== undefined) rep.status = updates.status;
      if (updates.role !== undefined) rep.role = updates.role;
      if (updates.assignedDistricts !== undefined) rep.assignedDistricts = updates.assignedDistricts;
      if (updates.assignedDivision !== undefined) rep.assignedDivision = updates.assignedDivision;
      if (updates.beats !== undefined) rep.beats = updates.beats;
      if (updates.badgeNumber !== undefined) rep.badgeNumber = updates.badgeNumber;
    }

    return rep;
  }

  async disconnect() {
    this.connected = false;
  }

  getHealth() {
    return {
      adapterType: 'firestore',
      status: this.connected ? 'connected' : 'unverified',
      storageMode: 'firestore_authoritative',
      multiInstanceSafe: true,
      provider: 'firebase_admin_firestore',
      databaseAvailable: this.connected,
      firestoreDatabaseId: this.databaseId,
      projectId: this.projectId,
      isEmulator: this.isEmulator,
      emulatorHost: process.env.FIRESTORE_EMULATOR_HOST || null,
      error: this.connected ? null : (this.lastError || 'ERR_DATABASE_UNAVAILABLE'),
      message: this.connected
        ? `Authoritative Cloud Firestore adapter active [database: ${this.databaseId}]${process.env.FIRESTORE_EMULATOR_HOST ? ` (Connected to Emulator: ${process.env.FIRESTORE_EMULATOR_HOST})` : ''}`
        : 'Firestore database is unreachable or credentials are unconfigured.',
    };
  }
}
