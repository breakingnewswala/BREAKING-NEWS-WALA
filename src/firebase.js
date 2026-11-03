import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
// Initialize Firebase App
const app = initializeApp(firebaseConfig);
// CRITICAL: The app requires firestoreDatabaseId for custom provisioned databases
const customDbId = firebaseConfig.firestoreDatabaseId;
export const db = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Error Handling Specification matching skill requirements
export var OperationType;
(function (OperationType) {
    OperationType["CREATE"] = "create";
    OperationType["UPDATE"] = "update";
    OperationType["DELETE"] = "delete";
    OperationType["LIST"] = "list";
    OperationType["GET"] = "get";
    OperationType["WRITE"] = "write";
})(OperationType || (OperationType = {}));
export function handleFirestoreError(error, operationType, path) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData?.map((provider) => ({
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
export async function testConnection() {
    try {
        await getDocFromServer(doc(db, 'test', 'connection'));
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
            console.warn('Firebase client is offline or initializing connection.');
        }
    }
}
testConnection();
// Authentication Helpers
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    }
    catch (error) {
        console.error('Google Sign In Error:', error);
        throw error;
    }
}
export async function logOut() {
    try {
        await signOut(auth);
    }
    catch (error) {
        console.error('Sign Out Error:', error);
        throw error;
    }
}
