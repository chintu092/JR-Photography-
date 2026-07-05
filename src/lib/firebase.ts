import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

// Support client-side dynamic Firebase configuration overrides saved from the admin UI
let firebaseConfig = defaultFirebaseConfig;
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const customConfigStr = window.localStorage.getItem('CUSTOM_FIREBASE_CONFIG');
    if (customConfigStr) {
      const parsed = JSON.parse(customConfigStr);
      if (parsed && typeof parsed === 'object') {
        const merged = { ...defaultFirebaseConfig, ...parsed };
        console.log('[Firebase Init] Leveraging custom administrative database override configurations:', merged.projectId);
        firebaseConfig = merged;
      }
    }
  } catch (error) {
    console.error('Failed to construct custom Firebase credentials layout from browser persistence:', error);
  }
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const getSavedCustomUser = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('custom_admin_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {}
  }
  return null;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const customUser = getSavedCustomUser();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: customUser?.uid || null,
      email: customUser?.email || null,
      isAnonymous: false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function logAdminActivity(action: string, details: string, category: string) {
  try {
    const customUser = getSavedCustomUser();
    await addDoc(collection(db, "activity_logs"), {
      action,
      details,
      category,
      adminEmail: customUser?.email || "unknown@admin.com",
      adminUid: customUser?.uid || "unknown",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}


