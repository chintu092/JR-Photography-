import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

/**
 * Dynamically resolves the currently active database engine (Firestore, MongoDB, MySQL)
 * and retrieves corresponding documents either natively or via the proxy server routes.
 */
export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  try {
    // 1. Read admin database config settings to identify active database engine
    const activeDocRef = doc(db, "settings", "database");
    const activeSnap = await getDoc(activeDocRef);
    let activeEngine = "firestore";
    
    if (activeSnap.exists()) {
      activeEngine = activeSnap.data().activeEngine || "firestore";
    }

    if (activeEngine === "firestore") {
      // Fetch normal dynamic Firestore records natively from client-side SDK
      const colRef = collection(db, collectionName);
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } else {
      // Call secure Node server-side proxy route that connects to certified clusters (Mongo/MySQL)
      const response = await fetch(`/api/content/${collectionName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch from active engine ${activeEngine}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        return data as T[];
      }
      return [];
    }
  } catch (error) {
    console.warn(`Dynamic fetch with active engine failed, using Firestore client SDK recovery fallback`, error);
    try {
      const colRef = collection(db, collectionName);
      const snap = await getDocs(colRef);
      if (snap.empty) return [];
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    } catch (fallbackError) {
      console.error("Critical fallback failed:", fallbackError);
      return [];
    }
  }
}
