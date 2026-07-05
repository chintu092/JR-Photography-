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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauthSuccess = params.get('oauth_success');
      
      if (oauthSuccess === 'true') {
        const email = params.get('email')?.toLowerCase().trim() || '';
        const name = params.get('name') || '';
        const picture = params.get('picture') || '';
        
        if (email) {
          setLoading(true);
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
                
                await setDoc(doc(db, 'admins', 'supriyos9@gmail.com'), matchedAdmin);
              } else {
                const adminDoc = await getDoc(doc(db, 'admins', email));
                if (adminDoc.exists()) {
                  matchedAdmin = adminDoc.data();
                } else {
                  matchedAdmin = {
                    email: email,
                    name: name || email,
                    role: 'writer',
                    permissions: ['blog'],
                    approved: false,
                    addedAt: new Date().toISOString(),
                    addedBy: 'self_registration_independent_google'
                  };
                  await setDoc(doc(db, 'admins', email), matchedAdmin);
                }
              }

              const customUser: CustomUser = {
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
              setRole(customUser.role || 'writer');
              setPermissions(customUser.permissions || ['blog']);
              setIsApproved(customUser.approved !== false);
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
  }, []);

  const login = async () => {
    console.log("[OAuth Handshake Debug] login() triggered. Clearing previous custom_admin_user session from localStorage...");
    localStorage.removeItem('custom_admin_user');
    
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
      
      try {
        const origin = window.location.origin;
        const redirectUri = `${origin}/api/auth/google/callback`;
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cleanClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account`;
        window.location.href = oauthUrl;
        return;
      } catch (e: any) {
        console.error("[OAuth Handshake Debug] Client-side direct Google OAuth construction failed:", e);
      }
    }

    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch (e: any) {
      console.warn("[OAuth Handshake Debug] Independent Google Auth URL fetch failed:", e);
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
