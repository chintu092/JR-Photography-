import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CustomUser {
  uid: string;
  email: string;
  displayName: string;
  isCustomAuth?: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface AuthDiagnostic {
  title: string;
  explanation: string;
  steps: string[];
}

export function getDiagnosticAuthMessage(errStr: string): AuthDiagnostic {
  const normalized = errStr.toLowerCase();
  
  if (normalized.includes("unauthorized-domain") || normalized.includes("unauthorized_domain") || normalized.includes("unauthorized domain")) {
    const currentHost = typeof window !== 'undefined' ? window.location.host : "jr-photography.vercel.app";
    return {
      title: "Firebase Unauthorized Domain (auth/unauthorized-domain)",
      explanation: `The domain "${currentHost}" has not been authorized in your Firebase Project's configuration. Firebase blocks all login popups and redirects from unauthorized domains for security.`,
      steps: [
        "1. Open the Firebase Console (https://console.firebase.google.com).",
        "2. Click on your project -> Build -> Authentication.",
        "3. Click on the 'Settings' tab in the top horizontal menu.",
        "4. Click on 'Authorized domains' in the left-hand sub-menu.",
        `5. Click 'Add domain' and enter exactly: "${currentHost}"`,
        "6. Click Save and reload this page to try signing in again!"
      ]
    };
  }
  
  if (normalized.includes("redirect_uri_mismatch") || normalized.includes("redirect-uri-mismatch")) {
    const origin = typeof window !== 'undefined' ? window.location.origin : "https://jr-photography.vercel.app";
    return {
      title: "Google OAuth Redirect URI Mismatch",
      explanation: "The redirect URI used by this application does not match the Authorized redirect URIs configured for your Client ID in the Google Cloud Console.",
      steps: [
        "1. Open the Google Cloud Console (https://console.cloud.google.com).",
        "2. Ensure you have selected your correct Google Cloud Project.",
        "3. Go to APIs & Services -> Credentials in the navigation menu.",
        "4. Under 'OAuth 2.0 Client IDs', click your Client ID to edit it.",
        "5. Scroll down to the 'Authorized redirect URIs' section.",
        `6. Click 'ADD URI' and add exactly: "${origin}/api/auth/google/callback"`,
        "7. Scroll to the bottom and click 'Save'. Note: It can take Google up to 5 minutes to propagate this update."
      ]
    };
  }

  if (normalized.includes("invalid_client") || normalized.includes("client not found") || normalized.includes("invalid-client")) {
    return {
      title: "Invalid Google OAuth Client ID Configuration",
      explanation: "Google could not verify the provided Client ID or Client Secret. This usually means the Client ID is incorrect, belongs to a different project, or has been deleted.",
      steps: [
        "1. Open your project environment settings (Vercel settings, or .env.example).",
        "2. Check that VITE_GOOGLE_CLIENT_ID matches your Google Cloud Client ID exactly.",
        "3. Confirm that the Client ID ends with '.apps.googleusercontent.com' and contains no quotes, trailing whitespaces, or line breaks.",
        "4. Ensure your Google Cloud Project status is active and the credential has not been disabled."
      ]
    };
  }

  if (normalized.includes("403") || normalized.includes("forbidden") || normalized.includes("access_denied")) {
    return {
      title: "Google OAuth Access Forbidden (403)",
      explanation: "Google rejected the authentication request. This is most commonly caused by your OAuth Consent Screen being in 'Testing' mode and not adding your email address to the authorized test users list.",
      steps: [
        "1. Open the Google Cloud Console (https://console.cloud.google.com) and navigate to APIs & Services -> OAuth consent screen.",
        "2. Check if the Publishing status is 'Testing'.",
        "3. If in Testing, scroll down to the 'Test users' section.",
        "4. Click 'ADD USERS' and add your Google Email address (e.g., 'supriyos9@gmail.com') and any other administrator accounts.",
        "5. Save changes and try logging in again."
      ]
    };
  }

  if (normalized.includes("popup-blocked") || normalized.includes("popup_blocked")) {
    return {
      title: "Google Sign-In Popup Blocked",
      explanation: "Your web browser blocked the Firebase Google Authentication popup window from opening.",
      steps: [
        "1. Check your browser's address bar or menu for a blocked-popup notification.",
        "2. Click the popup blocker notification icon.",
        "3. Choose 'Always allow popups and redirects from this website'.",
        "4. Click the 'Authenticate with Google' button again to proceed."
      ]
    };
  }

  // Generic fallback with helpful troubleshooting
  return {
    title: "Google Sign-In Authorization Issue",
    explanation: errStr,
    steps: [
      "1. Check the browser Console logs (press F12) to view the full detailed error stack trace.",
      "2. Verify that your Google Cloud Platform (GCP) Credentials match your Firebase and environment setup.",
      "3. If deployed on Vercel, make sure the Vercel URL is added to both Google OAuth Authorized Redirect URIs AND Firebase Authorized Domains."
    ]
  };
}

interface AuthContextType {
  user: ((User | CustomUser) & { isCustomAuth?: boolean }) | null;
  isAdmin: boolean;
  role: string | null;
  permissions: string[] | null;
  customRoles: CustomRole[];
  hasPermission: (role: string | null, permission: string) => boolean;
  loading: boolean;
  isApproved: boolean;
  login: () => Promise<void>;
  loginWithCredentials: (email: string, passcode: string) => Promise<void>;
  registerWithCredentials: (email: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<((User | CustomUser) & { isCustomAuth?: boolean }) | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [isApproved, setIsApproved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  useEffect(() => {
    if (isAdmin) {
      const fetchCustomRoles = async () => {
        try {
          const rolesDoc = await getDoc(doc(db, 'settings', 'roles'));
          if (rolesDoc.exists()) {
            const data = rolesDoc.data();
            const rolesArray = Object.keys(data.roles || {}).map(id => ({
              id,
              name: data.roles[id].name,
              permissions: data.roles[id].permissions || []
            }));
            setCustomRoles(rolesArray);
          }
        } catch (e) {
          console.error("Failed to load custom roles:", e);
        }
      };
      // Fetch roles only when user is admin
      fetchCustomRoles();
    } else {
      setCustomRoles([]);
    }
  }, [isAdmin]);

  const hasPermission = (checkRole: string | null, permission: string): boolean => {
    if (!checkRole) return false;
    if (checkRole === 'super_admin') return true;
    if (checkRole === 'writer' && permission === 'blog') return true;
    
    // Core permissions check
    if (permissions && permissions.includes("*")) return true;
    
    const roleConfig = customRoles.find(r => r.id === checkRole);
    if (roleConfig) {
      return roleConfig.permissions.includes(permission);
    }
    
    // For assigned explicit permissions not mapped to custom roles directly 
    if (permissions && permissions.includes(permission)) {
       return true;
    }

    return false;
  };

  useEffect(() => {
    // Check for independent Google OAuth success parameters in the URL query string
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauthSuccess = params.get('oauth_success');
      const oauthError = params.get('oauth_error');
      
      console.log("[OAuth Handshake Debug] Checking URL parameters on mount:", {
        url: window.location.href,
        origin: window.location.origin,
        hasOauthSuccess: !!oauthSuccess,
        oauthSuccessValue: oauthSuccess,
        hasOauthError: !!oauthError,
        oauthErrorValue: oauthError,
        allParams: Array.from(params.entries()).map(([k, v]) => `${k}=${k === 'email' ? '***' : v}`)
      });

      if (oauthSuccess === 'true') {
        const email = params.get('email')?.toLowerCase().trim() || '';
        const name = params.get('name') || '';
        const picture = params.get('picture') || '';
        
        console.log("[OAuth Handshake Debug] Successful OAuth redirect query detected on client. User profile details:", {
          email,
          name,
          hasPicture: !!picture
        });
        
        if (email) {
          setLoading(true);
          // Clear query parameters from URL to keep it pristine and avoid loop issues on refresh
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);

          const authenticateOAuthUser = async () => {
            try {
              let matchedAdmin: any = null;
              
              if (email === 'supriyos9@gmail.com') {
                matchedAdmin = {
                  email: 'supriyos9@gmail.com',
                  name: name || 'Supriyo (Root Super Admin)',
                  role: 'super_admin',
                  permissions: ['*'],
                  approved: true
                };
              } else {
                const { getCollectionData } = await import('../lib/db-client');
                const admins = await getCollectionData<any>('admins');
                matchedAdmin = admins.find(a => a.email?.toLowerCase().trim() === email);
                
                if (!matchedAdmin) {
                  // Auto-register new admin using DB-agnostic save helper
                  matchedAdmin = {
                    email: email,
                    name: name || email,
                    role: 'writer',
                    permissions: ['blog'],
                    approved: false,
                    addedAt: new Date().toISOString(),
                    addedBy: 'self_registration_independent_google'
                  };
                  
                  const { saveDocument } = await import('../lib/db-client');
                  await saveDocument('admins', email, matchedAdmin);
                }
              }

              const customUser = {
                uid: 'google_oauth_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
                email,
                displayName: name || matchedAdmin.name || email,
                photoURL: picture,
                isCustomAuth: true,
                role: matchedAdmin.role || 'writer',
                permissions: matchedAdmin.permissions || ['blog'],
                approved: matchedAdmin.approved !== false
              };

              localStorage.setItem('custom_admin_user', JSON.stringify(customUser));
              setUser(customUser);
              setIsAdmin(true);
              setRole(customUser.role);
              setPermissions(customUser.permissions);
              setIsApproved(customUser.approved);
            } catch (err) {
              console.error("Failed to authenticate independent Google OAuth user:", err);
            } finally {
              setLoading(false);
            }
          };

          authenticateOAuthUser();
          return;
        }
      }
    }

    // Check if there is a custom logged in user in localStorage first
    const savedCustomUser = localStorage.getItem('custom_admin_user');
    if (savedCustomUser) {
      try {
        const parsed = JSON.parse(savedCustomUser);
        setUser(parsed);
        setIsAdmin(true);
        setRole(parsed.role || 'sub_admin');
        setPermissions(parsed.permissions || ['*']);
        setIsApproved(parsed.approved !== false);
        // Do not set loading false synchronously. Let onAuthStateChanged run and successfully restore the Firebase session first.
      } catch (e) {
        console.error("Error reading custom user from storage", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      const savedCustomUser = localStorage.getItem('custom_admin_user');
      if (savedCustomUser) {
        try {
          const parsed = JSON.parse(savedCustomUser);
          
          // Independent Google Auth users bypass Firebase authentication lifecycle entirely
          if (parsed.uid && parsed.uid.startsWith('google_oauth_')) {
            setUser(parsed);
            setIsAdmin(true);
            setRole(parsed.role || 'sub_admin');
            setPermissions(parsed.permissions || ['blog']);
            setIsApproved(parsed.approved !== false);
            setLoading(false);
            return;
          }

          if (!fbUser) {
            console.log("[Auth Restoration] fbUser is null, attempting silent email/password re-auth...");
            // Silent re-auth securely to restore a valid Firebase session using the deterministic password
            const emailClean = parsed.email.toLowerCase().trim();
            const authPassword = `${emailClean}_auth_secret_2026`;
            let userCredential;
            try {
              userCredential = await signInWithEmailAndPassword(auth, emailClean, authPassword);
            } catch (signInErr: any) {
              if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-login-credentials' || signInErr.code === 'auth/wrong-password') {
                userCredential = await createUserWithEmailAndPassword(auth, emailClean, authPassword);
              } else {
                throw signInErr;
              }
            }
            const firebaseUid = userCredential.user.uid;
            
            // Get original admin document data from `/admins/{email}`
            const adminDoc = await getDoc(doc(db, 'admins', emailClean));
            if (adminDoc.exists()) {
              const data = adminDoc.data();
              // Create/Duplicate the admin document under the new Firebase UID
              await setDoc(doc(db, 'admins', firebaseUid), {
                email: emailClean,
                name: data.name || emailClean,
                role: data.role || 'sub_admin',
                permissions: data.permissions || [],
                passcode: data.passcode || '2026',
                addedAt: data.addedAt || new Date().toISOString(),
                addedBy: 'credentials_login_restored',
                approved: data.approved !== false
              });

              const updatedCustomUser = {
                uid: firebaseUid,
                email: emailClean,
                displayName: data.name || emailClean,
                isCustomAuth: true,
              };
              
              localStorage.setItem('custom_admin_user', JSON.stringify({
                ...updatedCustomUser,
                role: data.role || 'sub_admin',
                permissions: data.permissions || [],
                approved: data.approved !== false
              }));

              setUser(updatedCustomUser);
              setIsAdmin(true);
              setRole(data.role || 'sub_admin');
              setPermissions(data.permissions || []);
              setIsApproved(data.approved !== false);
            } else {
              // If no admin doc exists, clear session
              localStorage.removeItem('custom_admin_user');
              setUser(null);
              setIsAdmin(false);
              setRole(null);
              setPermissions(null);
              setIsApproved(true);
            }
          } else {
            // fbUser is restored successfully! Let's ensure it has an active duplication doc under its UID
            console.log("[Auth Restoration] fbUser exists:", fbUser.uid);
            
            const adminDocUid = await getDoc(doc(db, 'admins', fbUser.uid));
            if (!adminDocUid.exists()) {
              console.log("[Auth Restoration] Admin UID doc missing, ensuring duplication of:", parsed.email);
              const emailClean = parsed.email.toLowerCase().trim();
              const adminDoc = await getDoc(doc(db, 'admins', emailClean));
              if (adminDoc.exists()) {
                const data = adminDoc.data();
                await setDoc(doc(db, 'admins', fbUser.uid), {
                  email: emailClean,
                  name: data.name || emailClean,
                  role: data.role || 'sub_admin',
                  permissions: data.permissions || [],
                  passcode: data.passcode || '2026',
                  addedAt: data.addedAt || new Date().toISOString(),
                  addedBy: 'credentials_login_synced',
                  approved: data.approved !== false
                });
              } else {
                localStorage.removeItem('custom_admin_user');
                setUser(null);
                setIsAdmin(false);
                setRole(null);
                setPermissions(null);
                setIsApproved(true);
                setLoading(false);
                return;
              }
            }

            const updatedUser = {
              uid: fbUser.uid,
              email: parsed.email,
              displayName: parsed.displayName,
              isCustomAuth: true
            };
            setUser(updatedUser);
            setIsAdmin(true);
            setRole(parsed.role || 'sub_admin');
            setPermissions(parsed.permissions || []);
            setIsApproved(parsed.approved !== false);
          }
        } catch (e: any) {
          if (e && (e.code === 'auth/admin-restricted-operation' || e.code === 'auth/operation-not-allowed' || e.message?.includes('admin-restricted-operation'))) {
            console.log("[Auth Restoration] Silent anonymous authentication is not enabled on this Firebase project; clearing inactive credential block.");
          } else {
            console.log("[Auth Restoration] Custom auth session recovery bypassed or cleared:", e?.message || e);
          }
          // If the anonymous re-auth failed, clean up the session so the app is not stuck in a half-logged-in broken state.
          localStorage.removeItem('custom_admin_user');
          setUser(null);
          setIsAdmin(false);
          setRole(null);
          setPermissions(null);
          setIsApproved(true);
        }
        setLoading(false);
        return;
      }
      
      setUser(fbUser);
      
      if (fbUser) {
        // Root admin check is synchronous and reliable
        if (fbUser.email && fbUser.email.toLowerCase().trim() === 'supriyos9@gmail.com') {
          setIsAdmin(true);
          setRole('super_admin');
          setPermissions(['*']); // Star represents all access
          setIsApproved(true);
          
          // Seed root admin record with default passcode "2026" if missing
          try {
            const rootRef = doc(db, 'admins', 'supriyos9@gmail.com');
            const rootSnap = await getDoc(rootRef);
            if (!rootSnap.exists()) {
              await setDoc(rootRef, {
                email: 'supriyos9@gmail.com',
                name: 'Supriyo (Root Super Admin)',
                role: 'super_admin',
                permissions: ['*'],
                passcode: '2026',
                addedAt: new Date().toISOString(),
                addedBy: 'system',
                approved: true
              });
            }

            // Also seed record under their actual authenticated UID to allow fast rules-level exists() match
            const uidRef = doc(db, 'admins', fbUser.uid);
            const uidSnap = await getDoc(uidRef);
            if (!uidSnap.exists()) {
              await setDoc(uidRef, {
                email: 'supriyos9@gmail.com',
                name: fbUser.displayName || 'Supriyo (Root Super Admin)',
                role: 'super_admin',
                permissions: ['*'],
                passcode: '2026',
                addedAt: new Date().toISOString(),
                addedBy: 'system',
                approved: true
              });
            }
          } catch (e) {
            console.error("Failed to seed root admin doc:", e);
          }

          setLoading(false);
          return;
        }

        // Fetch other admins but don't block basic auth load if firestore is slow
        try {
          const adminDocPromise = getDoc(doc(db, 'admins', fbUser.uid));
          
          // Race the doc fetch against a 3s timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin check timeout')), 3005)
          );

          const docSnap = await Promise.race([adminDocPromise, timeoutPromise]) as any;
          if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            setIsAdmin(true);
            setRole(data.role || 'sub_admin');
            setPermissions(data.permissions || []);
            setIsApproved(data.approved !== false);
          } else if (fbUser.email) {
            // Check if there is an admin record created using their lowercase email
            const emailDocSnap = await getDoc(doc(db, 'admins', fbUser.email.toLowerCase()));
            if (emailDocSnap.exists()) {
              const data = emailDocSnap.data();
              setIsAdmin(true);
              setRole(data.role || 'sub_admin');
              setPermissions(data.permissions || []);
              setIsApproved(data.approved !== false);

              // Create a duplication under the user's actual UID for faster security lookup
              await setDoc(doc(db, 'admins', fbUser.uid), {
                email: fbUser.email.toLowerCase(),
                name: fbUser.displayName || data.name || '',
                role: data.role || 'sub_admin',
                permissions: data.permissions || [],
                passcode: data.passcode || '2026',
                addedAt: data.addedAt || new Date().toISOString(),
                addedBy: data.addedBy || 'system',
                approved: data.approved !== false
              });
            } else {
              // This is a NEW user! Create automatic registration record with role 'writer' and approved=false
              const emailClean = fbUser.email.toLowerCase().trim();
              const newRecord = {
                email: emailClean,
                name: fbUser.displayName || emailClean,
                role: 'writer' as const,
                permissions: ['blog'],
                passcode: '2026',
                addedAt: new Date().toISOString(),
                addedBy: 'self_registration_google',
                approved: false
              };

              await setDoc(doc(db, 'admins', emailClean), newRecord);
              await setDoc(doc(db, 'admins', fbUser.uid), newRecord);

              setIsAdmin(true);
              setRole('writer');
              setPermissions(['blog']);
              setIsApproved(false);
            }
          } else {
            setIsAdmin(false);
            setRole(null);
            setPermissions(null);
            setIsApproved(true);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          setRole(null);
          setPermissions(null);
          setIsApproved(true);
        }
      } else {
        if (!localStorage.getItem('custom_admin_user')) {
          setIsAdmin(false);
          setRole(null);
          setPermissions(null);
          setIsApproved(true);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    console.log("[OAuth Handshake Debug] login() triggered. Clearing previous custom_admin_user session from localStorage...");
    localStorage.removeItem('custom_admin_user');
    
    // 1. Try to initialize Google OAuth directly on the client side using VITE_GOOGLE_CLIENT_ID
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    console.log("[OAuth Handshake Debug] Loaded client-side environment variable VITE_GOOGLE_CLIENT_ID:", {
      hasValue: !!clientId,
      length: clientId ? clientId.length : 0,
      valueExcerpt: clientId ? `${clientId.substring(0, 10)}...${clientId.substring(Math.max(0, clientId.length - 15))}` : "NONE"
    });
    
    if (!clientId) {
      console.warn("[OAuth Handshake Debug] Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID) is not configured in the client environment. Attempting to fall back to backend URL endpoint /api/auth/google/url...");
    } else {
      const trimmedClientId = clientId.trim();
      let cleanClientId = trimmedClientId.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, "");
      
      const hasDomainSuffix = cleanClientId.endsWith(".apps.googleusercontent.com");
      const hasProtocol = trimmedClientId.includes("://");
      const isPlaceholder = trimmedClientId.toLowerCase().includes("your_") || trimmedClientId.length < 15;
      
      console.log("[OAuth Handshake Debug] Sanitizing and validating client-side Client ID:", {
        original: trimmedClientId,
        cleaned: cleanClientId,
        hasProtocol,
        isPlaceholder,
        hasDomainSuffix
      });
      
      if (hasProtocol) {
        console.warn(`[OAuth Handshake Debug] Cleaned protocol prefix from VITE_GOOGLE_CLIENT_ID: "${trimmedClientId}" -> "${cleanClientId}"`);
      }
      
      if (isPlaceholder) {
        const errorMsg = "Malformed Google OAuth Configuration: The Client ID is a placeholder and not a valid Google Cloud Client ID.";
        console.error(`[OAuth Handshake Debug] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      if (!hasDomainSuffix) {
        const errorMsg = `Malformed Google OAuth Configuration: The Client ID "${cleanClientId}" must end with ".apps.googleusercontent.com".`;
        console.error(`[OAuth Handshake Debug] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      try {
        const origin = window.location.origin;
        const redirectUri = `${origin}/api/auth/google/callback`;
        
        console.log(`[OAuth Handshake Debug] Step 1: Initiating direct client-side Google OAuth redirect:`, {
          clientId: cleanClientId,
          redirectUri,
          origin,
          currentHref: window.location.href
        });

        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
        
        console.log(`[OAuth Handshake Debug] Fully constructed redirect URL:`, oauthUrl);
        window.location.href = oauthUrl;
        return;
      } catch (e: any) {
        console.error("[OAuth Handshake Debug] Client-side direct Google OAuth construction failed, trying backend endpoint:", e);
      }
    }

    // 2. Fallback to API endpoint
    try {
      console.log("[OAuth Handshake Debug] Step 2: Attempting backend Google OAuth URL retrieval fallback...");
      const res = await fetch('/api/auth/google/url');
      console.log("[OAuth Handshake Debug] Fetch request to /api/auth/google/url completed:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("[OAuth Handshake Debug] Received backend OAuth URL response payload:", data);
        if (data.url) {
          console.log("[OAuth Handshake Debug] Redirecting window to backend-supplied Google OAuth URL:", data.url);
          window.location.href = data.url;
          return;
        } else {
          console.warn("[OAuth Handshake Debug] Backend returned empty URL, probably because VITE_GOOGLE_CLIENT_ID is missing on the server.");
        }
      } else {
        console.warn(`[OAuth Handshake Debug] Backend URL retrieval returned status ${res.status}`);
      }
    } catch (e: any) {
      console.warn("[OAuth Handshake Debug] Independent Google Auth URL fetch failed:", e);
    }

    // Throw detailed error since Firebase fallback has been completely removed per request
    throw new Error(
      "Google OAuth 2.0 configuration is missing, invalid, or unreachable. " +
      "Direct client-side VITE_GOOGLE_CLIENT_ID and backend /api/auth/google/url both failed. " +
      "Please make sure VITE_GOOGLE_CLIENT_ID is configured in your environments."
    );
  };

  const loginWithCredentials = async (email: string, passcode: string) => {
    const emailClean = email.toLowerCase().trim();
    if (!emailClean) {
      throw new Error("Email is required");
    }
    // Fetch the admin doc
    const adminDocSnap = await getDoc(doc(db, 'admins', emailClean));
    if (!adminDocSnap.exists()) {
      throw new Error("No administrator account found with this email.");
    }
    const data = adminDocSnap.data();
    // Verify passcode - support both newly updated custom passcode and the legacy default passcode
    const defaultPasscode = (import.meta as any).env.VITE_ADMIN_PASSCODE || "2026";
    const dbPasscode = data.passcode || defaultPasscode;
    
    const isMatch = passcode === dbPasscode || passcode === defaultPasscode;
    if (!isMatch) {
      throw new Error("Invalid passcode/password.");
    }

    // Authenticate the user securely with Firebase Auth using email and a secure deterministic password
    let firebaseUid = '';
    const authPassword = `${emailClean}_auth_secret_2026`;
    try {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailClean, authPassword);
        firebaseUid = userCredential.user.uid;
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-login-credentials' || signInErr.code === 'auth/wrong-password') {
          const userCredential = await createUserWithEmailAndPassword(auth, emailClean, authPassword);
          firebaseUid = userCredential.user.uid;
        } else {
          throw signInErr;
        }
      }
    } catch (e: any) {
      console.warn("Email/Password authentication failed during login:", e);
      if (e.code === 'auth/admin-restricted-operation' || e.code === 'auth/operation-not-allowed' || e.message?.includes('admin-restricted-operation') || e.code === 'auth/configuration-not-allowed') {
        throw new Error("Email password login requires the 'Email/Password' provider to be enabled in your Firebase Console. Please go to your Firebase Console -> Authentication -> Sign-in method, click 'Add new provider', enable 'Email/Password', and save. Alternatively, use Google Auth.");
      }
      throw new Error(`Authentication synchronization failed: ${e.message || e}`);
    }

    // Duplicate/Ensure the admin document is stored under their actual anonymous Firestore UID for rule matches
    await setDoc(doc(db, 'admins', firebaseUid), {
      email: emailClean,
      name: data.name || emailClean,
      role: data.role || 'sub_admin',
      permissions: data.permissions || [],
      passcode: dbPasscode,
      addedAt: data.addedAt || new Date().toISOString(),
      addedBy: 'credentials_login',
      approved: data.approved !== false
    });

    const customUser: CustomUser = {
      uid: firebaseUid,
      email: emailClean,
      displayName: data.name || emailClean,
      isCustomAuth: true,
    };

    localStorage.setItem('custom_admin_user', JSON.stringify({
      ...customUser,
      role: data.role || 'sub_admin',
      permissions: data.permissions || [],
      approved: data.approved !== false
    }));

    setUser(customUser);
    setIsAdmin(true);
    setRole(data.role || 'sub_admin');
    setPermissions(data.permissions || []);
    setIsApproved(data.approved !== false);
  };

  const registerWithCredentials = async (email: string, name: string) => {
    const emailClean = email.toLowerCase().trim();
    if (!emailClean) {
      throw new Error("Email is required");
    }

    const adminDocSnap = await getDoc(doc(db, 'admins', emailClean));
    if (adminDocSnap.exists()) {
      throw new Error("An account already exists for this email address. Please login.");
    }

    const newRecord = {
      email: emailClean,
      name: name || emailClean,
      role: 'writer' as const,
      permissions: ['blog'],
      passcode: '2026', 
      addedAt: new Date().toISOString(),
      addedBy: 'self_registration_credentials',
      approved: false
    };

    const authPassword = `${emailClean}_auth_secret_2026`;
    let firebaseUid;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailClean, authPassword);
      firebaseUid = userCredential.user.uid;
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        const userCredential = await signInWithEmailAndPassword(auth, emailClean, authPassword);
        firebaseUid = userCredential.user.uid;
      } else {
        throw e;
      }
    }

    await setDoc(doc(db, 'admins', emailClean), newRecord);
    await setDoc(doc(db, 'admins', firebaseUid), newRecord);

    await signOut(auth); // Ensure they do not stay logged in
  };

  const logout = async () => {
    localStorage.removeItem('custom_admin_user');
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setRole(null);
    setPermissions(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, role, permissions, customRoles, hasPermission, loading, isApproved, login, loginWithCredentials, registerWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
