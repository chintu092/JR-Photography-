import { useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

// Generate a random unique ID for the session, persistent per browser tab session
const SESSION_STORAGE_KEY = "jr_photography_session_id";
function getOrCreateSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = "sess_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (e) {
    // Fallback to random ID if sessionStorage is disabled or throws (e.g. Private Mode)
    return "sess_fallback_" + Math.random().toString(36).substring(2, 15);
  }
}

interface SessionTrackerProps {
  currentPage: string;
}

export default function SessionTracker({ currentPage }: SessionTrackerProps) {
  const { user, isAdmin } = useAuth();
  const userRef = useRef({ user, isAdmin });
  const currentPageRef = useRef(currentPage);

  // Keep refs up-to-date for async event handlers
  useEffect(() => {
    userRef.current = { user, isAdmin };
  }, [user, isAdmin]);

  useEffect(() => {
    currentPageRef.current = currentPage;
    
    // If session is already created, update the current page location in Firestore
    const sessionId = getOrCreateSessionId();
    const sessionDocRef = doc(db, "active_sessions", sessionId);
    
    updateDoc(sessionDocRef, {
      page: currentPage,
      lastActive: serverTimestamp()
    }).catch((e) => {
      // Ignore if session document hasn't been created yet (will be created in main useEffect)
    });
  }, [currentPage]);

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const sessionDocRef = doc(db, "active_sessions", sessionId);

    // Detect device type with higher precision (including modern iPad spoofing detection)
    const ua = navigator.userAgent;
    let deviceType = "Laptop/Desktop";
    const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|PlayBook|Silk/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isMobile) {
      deviceType = "Mobile";
    } else if (isTablet) {
      deviceType = "Tablet";
    }

    // Detect OS
    let os = "Unknown OS";
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/linux/i.test(ua)) os = "Linux";

    // Detect Browser
    let browser = "Unknown Browser";
    if (/chrome|crios/i.test(ua)) browser = "Chrome";
    else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
    else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
    else if (/opr\//i.test(ua)) browser = "Opera";
    else if (/edg/i.test(ua)) browser = "Edge";

    let active = true;

    async function registerSession() {
      // 1. Register session IMMEDIATELY so it shows up in admin instantly!
      const sessionPayload: any = {
        id: sessionId,
        ip: "Checking...",
        deviceType,
        os,
        browser,
        page: currentPageRef.current,
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        city: "Unknown",
        country: "Unknown",
        org: "Unknown"
      };

      if (userRef.current.user) {
        sessionPayload.email = userRef.current.user.email || "";
        sessionPayload.isAdmin = !!userRef.current.isAdmin;
      }

      try {
        await setDoc(sessionDocRef, sessionPayload);
      } catch (err) {
        console.error("Failed to register active session in Firestore:", err);
        return; // Halt if initial setup fails
      }

      if (!active) return;

      // 2. Fetch IP and details asynchronously in the background
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
          const data = await response.json();
          if (!active) return;
          await updateDoc(sessionDocRef, {
            ip: data.ip || "Unknown",
            city: data.city || "Unknown",
            country: data.country_name || "Unknown",
            org: data.org || "Unknown"
          });
        } else {
          throw new Error("ipapi response not ok");
        }
      } catch (e) {
        if (!active) return;
        // Fallback to ipify for IP only
        try {
          const fallbackRes = await fetch("https://api.ipify.org?format=json");
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (!active) return;
            await updateDoc(sessionDocRef, {
              ip: data.ip || "Unknown"
            });
          }
        } catch (fallbackErr) {
          if (!active) return;
          await updateDoc(sessionDocRef, {
            ip: "Unavailable"
          });
        }
      }
    }

    registerSession();

    // Setup heartbeat interval (every 20 seconds)
    const heartbeatInterval = setInterval(() => {
      const updatePayload: any = {
        lastActive: serverTimestamp(),
        page: currentPageRef.current
      };

      if (userRef.current.user) {
        updatePayload.email = userRef.current.user.email || "";
        updatePayload.isAdmin = !!userRef.current.isAdmin;
      }

      updateDoc(sessionDocRef, updatePayload).catch((err) => {
        // If the document was deleted/expired, re-register it
        if (err.code === "not-found" || err.message?.includes("not found")) {
          registerSession();
        }
      });
    }, 20000);

    // Unload cleanup (best-effort deleting active session so dashboard updates instantly)
    const handleUnload = () => {
      deleteDoc(sessionDocRef).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      active = false;
      clearInterval(heartbeatInterval);
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("unload", handleUnload);
      // We DO NOT delete on unmount anymore because it triggers on simple React state changes/re-renders.
      // This ensures that active sessions are persistent as long as the page is open.
    };
  }, []);

  return null; // Invisible tracker component
}
