import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { db, handleFirestoreError, OperationType, FirestoreErrorInfo } from './firestore.ts';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  db, 
  handleFirestoreError, 
  OperationType, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
};
export type { User, FirestoreErrorInfo };
