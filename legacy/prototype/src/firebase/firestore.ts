import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  getDocFromServer,
  query, 
  where, 
  orderBy, 
  limit, 
  Firestore 
} from 'firebase/firestore';
import { auth } from './config.ts';
import firebaseConfig from '../../firebase-applet-config.json';
import { Article } from '../types/index.ts';

// Initialize Firebase App instance if not already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Initialize Cloud Firestore using the configuration from firebase-applet-config.json.
 * CRITICAL: The database ID must be provided or the applet will fail to connect.
 */
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Cloud Firestore connection established.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export interface FetchNewsOptions {
  category?: string;
  district?: string;
  status?: string;
  limitCount?: number;
}

/**
 * Real-time listener for articles from the 'news' collection in Cloud Firestore using onSnapshot.
 * Automatically notifies the callback with real-time updates and returns the unsubscribe function.
 */
export function fetchArticlesFromFirestore(
  onUpdate: (articles: Article[]) => void,
  options?: FetchNewsOptions
): () => void {
  const collectionPath = 'news';
  try {
    const newsRef = collection(db, collectionPath);
    const constraints: any[] = [];

    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }
    if (options?.category && options.category !== 'होम' && options.category !== 'all') {
      constraints.push(where('category', '==', options.category));
    }
    if (options?.district && options.district !== 'सभी जिले' && options.district !== 'all') {
      constraints.push(where('district', '==', options.district));
    }
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = constraints.length > 0 ? query(newsRef, ...constraints) : newsRef;

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const articles: Article[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          articles.push({
            id: docSnap.id,
            title: data.title || '',
            subtitle: data.subtitle || '',
            content: data.content || '',
            rawScript: data.rawScript || '',
            slug: data.slug || docSnap.id,
            category: data.category || 'ताज़ा खबरें',
            subcategory: data.subcategory || '',
            state: data.state || 'मध्य प्रदेश',
            district: data.district || '',
            city: data.city || '',
            thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=900&auto=format&fit=crop&q=80',
            images: data.images || [],
            videoUrl: data.videoUrl || '',
            isReel: !!data.isReel,
            status: data.status || 'published',
            authorId: data.authorId || '',
            authorName: data.authorName || 'संवाददाता',
            authorRole: data.authorRole || 'reporter',
            isTrustedPublish: !!data.isTrustedPublish,
            views: data.views || 0,
            shares: data.shares || 0,
            bookmarks: data.bookmarks || 0,
            readingTimeMinutes: data.readingTimeMinutes || 2,
            isBreaking: !!data.isBreaking,
            isLeadStory: !!data.isLeadStory,
            publishedAt: data.publishedAt || data.createdAt || new Date().toISOString(),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            seoTitle: data.seoTitle || '',
            metaDescription: data.metaDescription || '',
            tags: data.tags || []
          });
        });
        onUpdate(articles);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionPath);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
    return () => {};
  }
}

// Aliases for compatibility
export const fetchArticlesFromNews = fetchArticlesFromFirestore;
export const getNewsArticles = fetchArticlesFromFirestore;
export const fetchNewsFromFirestore = fetchArticlesFromFirestore;
