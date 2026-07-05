import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

/**
 * Resolves the active database engine using a lightweight API call.
 */
async function resolveActiveEngine(): Promise<string> {
  try {
    const res = await fetch("/api/database/active");
    if (res.ok) {
      const data = await res.json();
      return data.activeEngine || "firestore";
    }
  } catch (err) {
    console.warn("Failed to fetch active database engine, defaulting to firestore", err);
  }
  return "firestore";
}

/**
 * Dynamically resolves the currently active database engine (Firestore, MongoDB, MySQL)
 * and retrieves corresponding documents either natively or via the proxy server routes.
 */
export async function getCollectionData<T>(collectionName: string): Promise<T[]> {
  try {
    const activeEngine = await resolveActiveEngine();

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

/**
 * Helper to dynamically map flat collection names to their nested Firestore DocumentReferences.
 */
function getFirestoreDocRef(collectionName: string, id: string) {
  if (collectionName === "settings_seo_pages") {
    return doc(db, "settings", "seo", "pages", id);
  } else if (collectionName === "settings_hero") {
    return doc(db, "settings", "hero");
  } else if (collectionName === "settings_seo") {
    return doc(db, "settings", "seo");
  }
  return doc(db, collectionName, id);
}

/**
 * Saves a document to the currently active database engine. Disconnects Firestore writes if an external engine is active.
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<void> {
  const activeEngine = await resolveActiveEngine();

  if (activeEngine === "firestore") {
    // Write natively to Firestore
    const docRef = getFirestoreDocRef(collectionName, id);
    await setDoc(docRef, data, { merge: true });
  } else {
    // Route only to external database proxy, bypassing Firestore writes
    try {
      const response = await fetch(`/api/content/${collectionName}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
      if (!response.ok) {
        throw new Error(`Proxy write returned non-ok status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to save to active database proxy (${activeEngine}):`, error);
      throw error;
    }
  }
}

/**
 * Deletes a document from the currently active database engine. Disconnects Firestore deletes if an external engine is active.
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const activeEngine = await resolveActiveEngine();

  if (activeEngine === "firestore") {
    // Delete natively from Firestore
    const docRef = getFirestoreDocRef(collectionName, id);
    await deleteDoc(docRef);
  } else {
    // Route only to external database proxy, bypassing Firestore deletes
    try {
      const response = await fetch(`/api/content/${collectionName}/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(`Proxy delete returned non-ok status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to delete from active database proxy (${activeEngine}):`, error);
      throw error;
    }
  }
}
