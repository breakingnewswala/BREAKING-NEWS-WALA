import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: The app requires firestoreDatabaseId for custom provisioned databases
const customDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { onAuthStateChanged, type FirebaseUser };

export const FIREBASE_STATUS_META = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  firestoreDatabaseId: customDbId || '(default)',
  storageBucket: firebaseConfig.storageBucket,
};

// Error Handling Specification matching skill requirements
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider: { providerId: string; email: string | null }) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Validate connection to Firestore on initialization
export async function testConnection(): Promise<{ connected: boolean; offline: boolean }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true, offline: false };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing connection.');
      return { connected: false, offline: true };
    }
    // Permission-denied or not-found still confirms live reachability to Cloud Firestore
    return { connected: true, offline: false };
  }
}

testConnection();

// Prevent duplicate simultaneous popup requests (auth/cancelled-popup-request)
let activeSignInPromise: Promise<FirebaseUser> | null = null;

// Authentication Helpers
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error: any) {
      const code = error?.code || '';
      if (
        code === 'auth/unauthorized-domain' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-blocked'
      ) {
        console.warn('Google Sign In notice:', code, error?.message);
      } else {
        console.error('Google Sign In Error:', error);
      }
      throw error;
    } finally {
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
}

export function getFirebaseAuthErrorMessage(error: any): string {
  const code = error?.code || '';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `डोमेन अधिकृत नहीं है (auth/unauthorized-domain): Firebase Console → Authentication → Settings → Authorized domains में "${host}" जोड़ें।`;
    case 'auth/popup-closed-by-user':
      return 'Google साइन-इन पॉपअप पूरा होने से पहले बंद कर दिया गया। कृपया पुनः प्रयास करें।';
    case 'auth/cancelled-popup-request':
      return 'एक साइन-इन विंडो पहले से खुली है। कृपया उसी विंडो में लॉगिन पूरा करें या पुनः प्रयास करें।';
    case 'auth/popup-blocked':
      return 'ब्राउज़र ने Google साइन-इन पॉपअप ब्लॉक कर दिया है। कृपया एड्रेस बार में पॉपअप की अनुमति (Allow Popups) दें।';
    case 'auth/operation-not-allowed':
      return 'Firebase Console → Authentication → Sign-in method में Google प्रोवाइडर सक्षम (Enable) नहीं है।';
    case 'auth/network-request-failed':
      return 'नेटवर्क कनेक्शन समस्या के कारण Google लॉगिन नहीं हो सका। इंटरनेट जांचें और पुनः प्रयास करें।';
    case 'auth/too-many-requests':
      return 'बहुत अधिक प्रयास किए गए। कृपया कुछ सेकंड बाद पुनः प्रयास करें।';
    default:
      return error?.message
        ? `Google साइन-इन विफल (${code || 'error'}): ${error.message}`
        : 'Google साइन-इन में समस्या आई। कृपया पुनः प्रयास करें।';
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

// -------------------------------------------------------------
// Live Cloud Firestore User & Bookmark Synchronization Helpers
// (Strictly matches firestore.rules & firebase-blueprint.json)
// -------------------------------------------------------------

function mapRoleForFirestoreRule(role: string): 'READER' | 'REPORTER' | 'ADMIN' {
  const upper = String(role || '').toUpperCase();
  if (upper === 'MASTER_ADMIN' || upper === 'SUPER_ADMIN' || upper === 'ADMIN' || upper === 'EDITOR' || upper === 'CHIEF_EDITOR') {
    return 'ADMIN';
  }
  if (upper === 'REPORTER' || upper === 'TRUSTED_REPORTER') {
    return 'REPORTER';
  }
  return 'READER';
}

export async function syncUserProfileToFirestore(firebaseUser: FirebaseUser, resolvedRole = 'READER') {
  if (!firebaseUser?.uid) return;
  const userPath = `users/${firebaseUser.uid}`;
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  try {
    const safeName = (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'पाठक').slice(0, 100);
    const safeEmail = (firebaseUser.email || `${firebaseUser.uid}@reader.breakingnewswala.com`).slice(0, 200);
    const isMaster = firebaseUser.email === 'breakingnewswala.com@gmail.com';

    // Verify if profile already exists in Firestore to execute correct create vs update rule
    const existingSnap = await getDocFromServer(userDocRef).catch(() => null);

    if (!existingSnap || !existingSnap.exists()) {
      // First-time profile creation: matches firestore.rules create requirements
      const createPayload: Record<string, unknown> = {
        uid: firebaseUser.uid,
        email: safeEmail,
        displayName: safeName,
        role: isMaster ? 'ADMIN' : 'READER',
        district: 'भोपाल',
        coins: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (firebaseUser.photoURL) {
        createPayload.photoUrl = firebaseUser.photoURL.slice(0, 1000);
      }
      await setDoc(userDocRef, createPayload);
    } else {
      // Profile update: matches firestore.rules update requirements (only allowed mutable fields)
      const updatePayload: Record<string, unknown> = {
        displayName: safeName,
        email: safeEmail,
        updatedAt: serverTimestamp(),
      };
      if (firebaseUser.photoURL) {
        updatePayload.photoUrl = firebaseUser.photoURL.slice(0, 1000);
      }
      await setDoc(userDocRef, updatePayload, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function fetchUserBookmarksFromFirestore(uid: string): Promise<string[]> {
  if (!uid) return [];
  const colPath = `users/${uid}/bookmarks`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'bookmarks'));
    const ids: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      ids.push(typeof data?.articleId === 'string' ? data.articleId : d.id);
    });
    return ids;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function saveBookmarkToFirestore(
  uid: string,
  article: { id: string; title: string; categoryName?: string; districtName?: string; featuredImage?: string }
) {
  if (!uid || !article?.id) return;
  const docPath = `users/${uid}/bookmarks/${article.id}`;
  try {
    // Strictly matches firestore.rules BookmarkItem schema:
    // keys hasAll: ['userId', 'articleId', 'articleTitle', 'createdAt']
    // keys hasOnly: ['userId', 'articleId', 'articleTitle', 'articleCategory', 'articleDistrict', 'articleImageUrl', 'createdAt']
    const payload: Record<string, unknown> = {
      userId: uid,
      articleId: article.id,
      articleTitle: (article.title || 'समाचार').slice(0, 300),
      createdAt: serverTimestamp(),
    };
    if (article.categoryName) {
      payload.articleCategory = article.categoryName.slice(0, 50);
    }
    if (article.districtName) {
      payload.articleDistrict = article.districtName.slice(0, 100);
    }
    if (article.featuredImage) {
      payload.articleImageUrl = article.featuredImage.slice(0, 1000);
    }
    await setDoc(doc(db, 'users', uid, 'bookmarks', article.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function removeBookmarkFromFirestore(uid: string, articleId: string) {
  if (!uid || !articleId) return;
  const docPath = `users/${uid}/bookmarks/${articleId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'bookmarks', articleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
