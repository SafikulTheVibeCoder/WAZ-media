import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  FirestoreSettings,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Prioritize provisioned firebase-applet-config.json with env var fallback
const config = {
  projectId: firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: firebaseConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_DATABASE_ID,
  storageBucket: firebaseConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(config);

// Initialize Firestore with Database ID & XHR long polling for reliable browser/proxy compatibility
export const db = (() => {
  const dbId = config.firestoreDatabaseId || '(default)';
  const settings: FirestoreSettings & { useFetchStreams?: boolean } = {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  };
  try {
    return initializeFirestore(app, settings, dbId);
  } catch (err) {
    console.warn('initializeFirestore fallback to getFirestore:', err);
    return getFirestore(app, dbId);
  }
})();

// Initialize Auth & Storage
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Error Handling Specification
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
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Security/Operation Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation test
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline client mode.');
      return false;
    }
    return true;
  }
}

// Execute connection check on client
if (typeof window !== 'undefined') {
  testFirestoreConnection();
}
