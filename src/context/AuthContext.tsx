import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface CustomUser {
  uid: string;
  email: string;
  displayName: string;
  isCustomAuth?: boolean;
  photoURL?: string;
  role?: string;
  permissions?: string[];
  approved?: boolean;
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
        "6. Click 'ADD URI' and add exactly: \"" + origin + "/api/auth/google/callback\"",
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
  user: CustomUser | null;
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
  const [user, setUser] = useState<CustomUser | null>(null);
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
      fetchCustomRoles();
    } else {
      setCustomRoles([]);
    }
  }, [isAdmin]);

  const hasPermission = (checkRole: string | null, permission: string): boolean => {
    if (!checkRole) return false;
    if (checkRole === 'super_admin') return true;
    if (checkRole === 'writer' && permission === 'blog') return true;
    
    if (permissions && permissions.includes("*")) return true;
    
    const roleConfig = customRoles.find(r => r.id === checkRole);
    if (roleConfig) {
      return roleConfig.permissions.includes(permission);
    }
    
    if (permissions && permissions.includes(permission)) {
       return true;
    }

    return false;
  };

  const handleGoogleAuthSuccess = async (
    email: string,
    name: string,
    picture: string,
    role?: string,
    permissions?: string[],
    approved?: boolean
  ) => {
    try {
      setLoading(true);
      
      const resolvedRole = role || (email === 'supriyos9@gmail.com' ? 'super_admin' : 'writer');
      const resolvedPermissions = permissions || (email === 'supriyos9@gmail.com' ? ['*'] : ['blog']);
      const resolvedApproved = approved !== undefined ? approved : (email === 'supriyos9@gmail.com');

      const customUser: CustomUser = {
        uid: 'google_oauth_' + email.replace(/[^a-zA-Z0-9]/g, '_'),
        email,
        displayName: name || email,
        photoURL: picture,
        isCustomAuth: true,
        role: resolvedRole,
        permissions: resolvedPermissions,
        approved: resolvedApproved
      };

      try {
        const adminDocSnap = await getDoc(doc(db, 'admins', email));
        if (!adminDocSnap.exists()) {
          const newRecord = {
            email,
            name: name || email,
            role: resolvedRole,
            permissions: resolvedPermissions,
            approved: resolvedApproved,
            addedAt: new Date().toISOString(),
            addedBy: 'self_registration_google',
            photoURL: picture
          };
          await setDoc(doc(db, 'admins', email), newRecord);
          console.log("[AuthContext] Saved new user to Firestore:", email);
        }
      } catch (firestoreErr) {
        console.error("[AuthContext] Failed to save new user to Firestore:", firestoreErr);
      }

      localStorage.setItem('custom_admin_user', JSON.stringify(customUser));
      setUser(customUser);
      setIsAdmin(true);
      setRole(resolvedRole);
      setPermissions(resolvedPermissions);
      setIsApproved(resolvedApproved);
    } catch (err) {
      console.error("Failed to authenticate independent Google OAuth user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauthSuccess = params.get('oauth_success');
      
      if (oauthSuccess === 'true') {
        const email = params.get('email')?.toLowerCase().trim() || '';
        const name = params.get('name') || '';
        const picture = params.get('picture') || '';
        const role = params.get('role') || '';
        const permissionsRaw = params.get('permissions') || '';
        const approvedRaw = params.get('approved') || '';
        
        let permissions: string[] | undefined;
        try {
          if (permissionsRaw) {
            permissions = JSON.parse(permissionsRaw);
          }
        } catch (_) {}
        
        const approved = approvedRaw === 'true';
        
        if (email) {
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
          handleGoogleAuthSuccess(email, name, picture, role, permissions, approved);
          return;
        }
      }

      // Add popup message event listener
      const handleMessage = (event: MessageEvent) => {
        // Simple domain/origin check
        const origin = event.origin;
        if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('vercel.app')) {
          return;
        }

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          const { email, name, picture, role, permissions, approved } = event.data;
          if (email) {
            console.log("[OAuth Handshake Debug] Received successful auth message via popup postMessage!");
            handleGoogleAuthSuccess(email, name || '', picture || '', role, permissions, approved);
          }
        } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
          console.error("[OAuth Handshake Debug] Received failure message via popup postMessage:", event.data.error);
        }
      };

      window.addEventListener('message', handleMessage);
      
      const savedCustomUser = localStorage.getItem('custom_admin_user');
      if (savedCustomUser) {
        try {
          const parsed = JSON.parse(savedCustomUser);
          setUser(parsed);
          setIsAdmin(true);
          setRole(parsed.role || 'sub_admin');
          setPermissions(parsed.permissions || ['*']);
          setIsApproved(parsed.approved !== false);
        } catch (e) {
          console.error("Error reading custom user from storage", e);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setRole(null);
        setPermissions(null);
        setIsApproved(true);
      }
      setLoading(false);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    } else {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    console.log("[OAuth Handshake Debug] login() triggered. Clearing previous custom_admin_user session from localStorage...");
    localStorage.removeItem('custom_admin_user');
    
    let oauthUrl = "";
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("[OAuth Handshake Debug] Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID) is not configured in the client environment.");
    } else {
      const trimmedClientId = clientId.trim();
      let cleanClientId = trimmedClientId.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/+$/, "");
      
      const hasDomainSuffix = cleanClientId.endsWith(".apps.googleusercontent.com");
      const isPlaceholder = trimmedClientId.toLowerCase().includes("your_") || trimmedClientId.length < 15;
      
      if (isPlaceholder) {
        throw new Error("Malformed Google OAuth Configuration: The Client ID is a placeholder.");
      }
      
      if (!hasDomainSuffix) {
        throw new Error("Malformed Google OAuth Configuration: Client ID must end with .apps.googleusercontent.com");
      }
      
      const origin = window.location.origin;
      const callbackPath = origin.includes("vercel.app") ? "/api/auth/callback/google" : "/api/auth/google/callback";
      const redirectUri = `${origin}${callbackPath}`;
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=${encodeURIComponent(origin)}`;
    }

    if (!oauthUrl) {
      try {
        const res = await fetch(`/api/auth/google/url?origin=${encodeURIComponent(window.location.origin)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            oauthUrl = data.url;
          }
        }
      } catch (e: any) {
        console.warn("[OAuth Handshake Debug] Independent Google Auth URL fetch failed:", e);
      }
    }

    if (oauthUrl) {
      // Open standard popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      console.log("[OAuth Handshake Debug] Opening OAuth provider URL in popup:", oauthUrl);
      const popup = window.open(
        oauthUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );
      
      if (!popup) {
        console.warn("[OAuth Handshake Debug] Popup blocked, falling back to window location redirection.");
        window.location.href = oauthUrl;
      }
      return;
    }

    throw new Error(
      "Google OAuth 2.0 configuration is missing, invalid, or unreachable. " +
      "Please make sure VITE_GOOGLE_CLIENT_ID is configured in your environments."
    );
  };

  const loginWithCredentials = async (email: string, passcode: string) => {
    const emailClean = email.toLowerCase().trim();
    if (!emailClean) {
      throw new Error("Email is required");
    }
    if (!passcode) {
      throw new Error("Passcode is required");
    }

    const adminDocSnap = await getDoc(doc(db, 'admins', emailClean));
    if (!adminDocSnap.exists()) {
      throw new Error("No admin account found with this email. Please register first or use Google login.");
    }

    const data = adminDocSnap.data();
    const dbPasscode = (data.passcode || '').trim();
    
    if (dbPasscode !== passcode.trim()) {
      throw new Error("Invalid passcode. Please try again.");
    }

    const customUser: CustomUser = {
      uid: 'credentials_' + emailClean.replace(/[^a-zA-Z0-9]/g, '_'),
      email: emailClean,
      displayName: data.name || emailClean,
      isCustomAuth: true,
      role: data.role || 'sub_admin',
      permissions: data.permissions || [],
      approved: data.approved !== false
    };

    localStorage.setItem('custom_admin_user', JSON.stringify(customUser));
    setUser(customUser);
    setIsAdmin(true);
    setRole(customUser.role || 'sub_admin');
    setPermissions(customUser.permissions || []);
    setIsApproved(customUser.approved !== false);
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

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$*';
    const array = new Uint32Array(6);
    window.crypto.getRandomValues(array);
    let randomPasscode = '';
    for (let i = 0; i < 6; i++) {
      randomPasscode += chars[array[i] % chars.length];
    }

    const newRecord = {
      email: emailClean,
      name: name || emailClean,
      role: 'writer' as const,
      permissions: ['blog'],
      passcode: randomPasscode, 
      addedAt: new Date().toISOString(),
      addedBy: 'self_registration_credentials',
      approved: false
    };

    await setDoc(doc(db, 'admins', emailClean), newRecord);
  };

  const logout = async () => {
    localStorage.removeItem('custom_admin_user');
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
