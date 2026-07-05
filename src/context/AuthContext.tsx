import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
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
      if (params.get('oauth_success') === 'true') {
        const email = params.get('email')?.toLowerCase().trim() || '';
        const name = params.get('name') || '';
        const picture = params.get('picture') || '';
        
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
    localStorage.removeItem('custom_admin_user');
    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch (e) {
      console.warn("Independent Google Auth URL fetch failed, falling back to standard Firebase login popup:", e);
    }

    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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
