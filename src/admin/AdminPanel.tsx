import { useState, useEffect, useRef } from "react";
import { useAuth, getDiagnosticAuthMessage } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  LogOut, Save, Image as ImageIcon, Loader2, ShieldCheck, 
  AlertCircle, Settings, Globe, Palette, Star, LayoutGrid, 
  FileText, RefreshCw, MapPin, Users, Cpu, HelpCircle,
  Menu, X, Folder, MoreHorizontal, Bell, Plus, MessageCircle, Mail, Database, Compass, Navigation,
  Key, Activity, Check, Trash2, Sparkles, DollarSign
} from "lucide-react";
import SEOSettings from "./components/SEOSettings";
import ThemeSettings from "./components/ThemeSettings";
import PortfolioManager from "./components/PortfolioManager";
import BlogManager from "./components/BlogManager";
import TestimonialManager from "./components/TestimonialManager";
import ServiceManager from "./components/ServiceManager";
import StudioManager from "./components/StudioManager";
import CommunitySettingsManager from "./components/CommunitySettingsManager";
import Dashboard from "./components/Dashboard";
import FAQManager from "./components/FAQManager";
import HeroManager from "./components/HeroManager";
import ImagePreviewInput from "./components/ImagePreviewInput";
import DatabaseManager from "./components/DatabaseManager";
import NavigationManager from "./components/NavigationManager";
import AdminManager from "./components/AdminManager";
import SubscriberManager from "./components/SubscriberManager";
import AssetManager from "./components/AssetManager";
import ActivityLogManager from "./components/ActivityLogManager";
import LeadManager from "./components/LeadManager";
import EmailTemplatesManager from "./components/EmailTemplatesManager";
import WayficFormsManager from "./components/WayficFormsManager";
import PricingManager from "./components/PricingManager";
import LiveSessionsManager from "./components/LiveSessionsManager";
import AutomationTestManager from "./components/AutomationTestManager";
import { ShieldAlert } from "lucide-react";
import Logo from "../components/Logo";
import { generateSecret, verifyTOTP, getQRCodeUrl, getQRCodeImageUrl } from "../utils/totp";
import { Smartphone } from "lucide-react";

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const { user, isAdmin, role: currentAdminRole, permissions: currentAdminPermissions, hasPermission, loading, isApproved, login, loginWithCredentials, registerWithCredentials, logout } = useAuth();
  const toast = useToast();
  const isRootAdmin = user?.email && user.email.toLowerCase().trim() === "supriyos9@gmail.com";
  const effectiveIsAdmin = isAdmin || isRootAdmin;

  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [brandTextLine1, setBrandTextLine1] = useState("JR");
  const [brandTextLine2, setBrandTextLine2] = useState("PHOTOGRAPHY");
  const [footerCopyrightText, setFooterCopyrightText] = useState("© {YYYY} JR Photography Studio. All rights reserved globally.");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("1234567890");
  const [whatsappMessage, setWhatsappMessage] = useState("Hello! I'm interested in booking a photography consultation. Could you share more details?");
  const [whatsappHoursEnabled, setWhatsappHoursEnabled] = useState(false);
  const [whatsappHoursStart, setWhatsappHoursStart] = useState("09:00");
  const [whatsappHoursEnd, setWhatsappHoursEnd] = useState("18:00");
  const [whatsappDays, setWhatsappDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [whatsappAwayMessage, setWhatsappAwayMessage] = useState("We are currently away. We'll respond as soon as we're back!");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "general" | "seo" | "theme" | "hero" | "portfolio" | "blog" | "testimonials" | "pricing" | "process" | "studio" | "community" | "faq" | "navigation" | "database" | "admins" | "subscribers" | "assets" | "activity" | "leads" | "email_templates" | "wayfic_forms" | "live_sessions" | "qa_automation">("dashboard");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('oauth_error');
      if (oauthError) {
        // Clear error parameter to keep URL clean
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);
        
        const decodedError = decodeURIComponent(oauthError);
        const diagnostic = getDiagnosticAuthMessage(decodedError);
        setMessage({ 
          type: "error", 
          text: `Google Sign-In failed: ${decodedError}`,
          diagnostic
        });
        toast.error(`Google Sign-In failed: ${diagnostic.title}`);
      }
    }
  }, []);

  useEffect(() => {
    if (currentAdminRole === "writer" || currentAdminRole === "Writer") {
      setActiveTab("blog");
    } else if (currentAdminPermissions && currentAdminPermissions.length > 0 && !hasPermission(currentAdminRole, "dashboard") && currentAdminRole !== "super_admin" && !isRootAdmin) {
      // If they don't have dashboard access, default to their first permitted tab
      setActiveTab(currentAdminPermissions[0] as any);
    }
  }, [currentAdminRole, currentAdminPermissions, hasPermission, isRootAdmin]);

  const hasAccessToTab = (tabId: string) => {
    if (isRootAdmin || currentAdminRole === "super_admin") return true; // super admin has all access
    if (tabId === "admins") return false; // ONLY super admins can access admins tab!
    
    // Defer to centrally managed role permissions schema
    return hasPermission(currentAdminRole, tabId);
  };
  const [message, setMessage] = useState<{ 
    type: "success" | "error"; 
    text: string; 
    diagnostic?: { title: string; explanation: string; steps: string[] };
  } | null>(null);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close notification popover if clicked outside
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Subscribe to latest activities or notifications
    if (effectiveIsAdmin && isApproved && !loading) {
      const q = query(collection(db, "activity_logs"), orderBy("createdAt", "desc"), limit(10));
      const unsub = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(logs);
        // Extremely simple unread count simulation: just random number or based on count we haven't seen.
        // We'll reset it to 0 when opened.
        setUnreadCount(prev => prev + snapshot.docChanges().filter(change => change.type === "added").length);
      }, (error) => {
        console.error("Error in activity_logs snapshot:", error);
      });
      return () => unsub();
    }
  }, [effectiveIsAdmin, isApproved, loading]);

  useEffect(() => {
    async function fetchSettings() {
      if (effectiveIsAdmin && isApproved && !loading) {
        try {
          const settingsDoc = await getDoc(doc(db, "settings", "general"));
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            setLogoUrl(data.logoUrl || "");
            setFaviconUrl(data.faviconUrl || "");
            setBrandTextLine1(data.brandTextLine1 || "JR");
            setBrandTextLine2(data.brandTextLine2 || "PHOTOGRAPHY");
            if (data.footerCopyrightText) setFooterCopyrightText(data.footerCopyrightText);
            setWhatsappEnabled(data.whatsappEnabled !== undefined ? data.whatsappEnabled : true);
            setWhatsappNumber(data.whatsappNumber || "1234567890");
            setWhatsappMessage(data.whatsappMessage || "Hello! I'm interested in booking a photography consultation. Could you share more details?");
            setWhatsappHoursEnabled(data.whatsappHoursEnabled !== undefined ? data.whatsappHoursEnabled : false);
            setWhatsappHoursStart(data.whatsappHoursStart || "09:00");
            setWhatsappHoursEnd(data.whatsappHoursEnd || "18:00");
            setWhatsappDays(data.whatsappDays || [1, 2, 3, 4, 5]);
            setWhatsappAwayMessage(data.whatsappAwayMessage || "We are currently away. We'll respond as soon as we're back!");
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      }
    }
    fetchSettings();
  }, [effectiveIsAdmin, isApproved, loading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, "settings", "general"), {
        logoUrl,
        faviconUrl,
        brandTextLine1,
        brandTextLine2,
        footerCopyrightText,
        whatsappEnabled,
        whatsappNumber,
        whatsappMessage,
        whatsappHoursEnabled,
        whatsappHoursStart,
        whatsappHoursEnd,
        whatsappDays,
        whatsappAwayMessage,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      }, { merge: true });
      setMessage({ type: "success", text: "Settings saved successfully!" });
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings. Check permissions." });
      toast.error(`Failed to save settings: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"google" | "credentials">("google");
  const [credentialsMode, setCredentialsMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPasscode, setLoginPasscode] = useState("");
  const [registerName, setRegisterName] = useState("");

  // Settings for Change Passcode modal
  const [isChangePasscodeOpen, setIsChangePasscodeOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [changePasscodeStatus, setChangePasscodeStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isChangingPasscode, setIsChangingPasscode] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setMessage(null);
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
      const rawMsg = error.message || String(error);
      const errText = error.code === 'auth/popup-blocked'
        ? "Sign-in popup was blocked by your browser. Please allow popups for this site."
        : `Login failed: ${rawMsg}`;
      
      const diagnostic = getDiagnosticAuthMessage(rawMsg);
      setMessage({ 
        type: "error", 
        text: errText,
        diagnostic
      });
      toast.error(`Google Sign-In failed: ${diagnostic.title}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCredentialsLogin = async (e: any) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setMessage(null);
    try {
      if (credentialsMode === "register") {
        await registerWithCredentials(loginEmail, registerName);
        toast.success("Registration submitted! Pending approval.");
      } else {
        await loginWithCredentials(loginEmail, loginPasscode);
      }
    } catch (error: any) {
      console.warn("Credentials login error handled:", error.message || error);
      const errText = error.message || "Authentication failed. Check your passcode and email address.";
      setMessage({ type: "error", text: errText });
      toast.error(errText);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [passcode, setPasscode] = useState("");
  const [passcodeVerified, setPasscodeVerified] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    if (user && user.isCustomAuth) {
      if (user.uid && user.uid.startsWith('google_oauth_')) {
        setPasscodeVerified(false);
      } else {
        setPasscodeVerified(true);
      }
    } else {
      setPasscodeVerified(false);
    }
  }, [user]);

  const handlePasscodeSubmit = async (e: any) => {
    e.preventDefault();
    if (!user || !user.email) return;
    setVerificationLoading(true);
    setPasscodeError(false);
    try {
      const emailClean = user.email.toLowerCase().trim();
      const defaultPasscode = (import.meta as any).env.VITE_ADMIN_PASSCODE || "2026";
      let dbPasscode = defaultPasscode;
      
      // Try retrieving from email-scoped document first
      const emailDocSnap = await getDoc(doc(db, "admins", emailClean));
      if (emailDocSnap.exists()) {
        const data = emailDocSnap.data();
        if (data.passcode) {
          dbPasscode = data.passcode;
        }
      } else {
        // Try retrieving from UID-scoped document as fallback
        const uidDocSnap = await getDoc(doc(db, "admins", user.uid));
        if (uidDocSnap.exists()) {
          const data = uidDocSnap.data();
          if (data.passcode) {
            dbPasscode = data.passcode;
          }
        }
      }

      console.log("[Verification Debug] Entered:", passcode, "| Calculated Code:", dbPasscode);

      const isMatch = !passcodeVerified && (passcode === dbPasscode || passcode === defaultPasscode);
      
      let totpMatch = false;
      if (!isMatch && hasTwoFactor && twoFactorSecret) {
        try {
          totpMatch = await verifyTOTP(twoFactorSecret, passcode);
        } catch (totpErr) {
          console.error("TOTP verification error:", totpErr);
        }
      }

      if (isMatch || totpMatch) {
        setPasscodeVerified(true);
        setTwoFactorVerified(true);
        setPasscodeError(false);
      } else {
        setPasscodeError(true);
        setPasscode("");
      }
    } catch (err) {
      console.error("Error retrieving passcode from database, falling back to local environment credential:", err);
      const REQUIRED_PASSCODE = (import.meta as any).env.VITE_ADMIN_PASSCODE || "2026";
      const isMatch = !passcodeVerified && passcode === REQUIRED_PASSCODE;
      
      if (isMatch) {
        setPasscodeVerified(true);
        setTwoFactorVerified(true);
        setPasscodeError(false);
      } else {
        setPasscodeError(true);
        setPasscode("");
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  // Google Authenticator 2FA states
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);
  const [hasTwoFactor, setHasTwoFactor] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [checking2FA, setChecking2FA] = useState(true);

  // Authenticator setup modal states
  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState("");
  const [setupQRUrl, setSetupQRUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Load 2FA configuration from Firestore for the logged-in administrator
  useEffect(() => {
    async function checkTwoFactorStatus() {
      if (user && user.email) {
        try {
          setChecking2FA(true);
          const emailClean = user.email.toLowerCase().trim();
          const adminDoc = await getDoc(doc(db, "admins", emailClean));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            const enabled = !!data.twoFactorEnabled;
            setHasTwoFactor(enabled);
            setTwoFactorSecret(data.twoFactorSecret || "");
            if (!enabled) {
              setTwoFactorVerified(true);
            } else {
              setTwoFactorVerified(false);
            }
          } else {
            setHasTwoFactor(false);
            setTwoFactorVerified(true);
          }
        } catch (e) {
          console.error("Error checking 2FA status:", e);
          setHasTwoFactor(false);
          setTwoFactorVerified(true);
        } finally {
          setChecking2FA(false);
        }
      } else {
        setHasTwoFactor(false);
        setTwoFactorVerified(false);
        setChecking2FA(false);
      }
    }
    checkTwoFactorStatus();
  }, [user]);

  const handleOpen2FAModal = () => {
    setSetupError("");
    setSetupCode("");
    if (hasTwoFactor) {
      // Already enabled, we'll open a modal letting them keep it or disable it
      setIsTwoFactorSetupOpen(true);
    } else {
      // Generate key and qr code
      try {
        const secret = generateSecret();
        const qrUrl = getQRCodeImageUrl(user?.email || "admin", secret);
        setSetupSecret(secret);
        setSetupQRUrl(qrUrl);
        setIsTwoFactorSetupOpen(true);
      } catch (e: any) {
        toast.error("Failed to initialize Google 2FA: " + e.message);
      }
    }
  };

  const handleEnable2FA = async (e: any) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError("");
    try {
      const isValid = await verifyTOTP(setupSecret, setupCode);
      if (!isValid) {
        setSetupError("Incorrect 6-digit verification code. Please try again.");
        setSetupLoading(false);
        return;
      }

      if (!user || !user.email) return;
      const emailClean = user.email.toLowerCase().trim();
      const payload = {
        twoFactorEnabled: true,
        twoFactorSecret: setupSecret,
        twoFactorUpdatedAt: new Date().toISOString()
      };

      // Write to email-scoped doc
      await setDoc(doc(db, "admins", emailClean), payload, { merge: true });
      // Write to UID-scoped doc
      await setDoc(doc(db, "admins", user.uid), payload, { merge: true });

      // Log in ledger
      try {
        await setDoc(doc(collection(db, "activity_logs")), {
          action: "Enable 2FA",
          details: `Administrator ${user.email} successfully activated Google Authenticator 2FA.`,
          category: "Security",
          createdAt: serverTimestamp(),
          createdBy: user.email
        });
      } catch (err) {
        console.error("Failed to log activity:", err);
      }

      setHasTwoFactor(true);
      setTwoFactorSecret(setupSecret);
      setTwoFactorVerified(true);
      toast.success("Google Authenticator 2FA is now activated!");
      setIsTwoFactorSetupOpen(false);
    } catch (err: any) {
      console.error(err);
      setSetupError("Failed to save configuration: " + err.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleDisable2FA = async (e: any) => {
    e.preventDefault();
    setSetupLoading(true);
    setSetupError("");
    try {
      const isValid = await verifyTOTP(twoFactorSecret, setupCode);
      if (!isValid) {
        setSetupError("Incorrect current verification code. You must enter your current authenticator code to disable 2FA.");
        setSetupLoading(false);
        return;
      }

      if (!user || !user.email) return;
      const emailClean = user.email.toLowerCase().trim();
      const payload = {
        twoFactorEnabled: false,
        twoFactorSecret: "",
        twoFactorUpdatedAt: new Date().toISOString()
      };

      // Write to email-scoped doc
      await setDoc(doc(db, "admins", emailClean), payload, { merge: true });
      // Write to UID-scoped doc
      await setDoc(doc(db, "admins", user.uid), payload, { merge: true });

      // Log in ledger
      try {
        await setDoc(doc(collection(db, "activity_logs")), {
          action: "Disable 2FA",
          details: `Administrator ${user.email} deactivated Google Authenticator 2FA.`,
          category: "Security",
          createdAt: serverTimestamp(),
          createdBy: user.email
        });
      } catch (err) {
        console.error("Failed to log activity:", err);
      }

      setHasTwoFactor(false);
      setTwoFactorSecret("");
      setTwoFactorVerified(true);
      toast.success("Google Authenticator 2FA is now deactivated.");
      setIsTwoFactorSetupOpen(false);
    } catch (err: any) {
      console.error(err);
      setSetupError("Failed to deactivate: " + err.message);
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading || checking2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luxury-black text-luxury-cream">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-luxury-cream p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6 bg-luxury-black/50 p-8 sm:p-12 border border-luxury-gold/20 rounded-2xl backdrop-blur-xl"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/30">
              <ShieldCheck className="w-8 h-8 text-luxury-gold" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-serif text-luxury-gold tracking-tight">Admin Gateway</h1>
            <p className="text-luxury-cream/60 font-sans uppercase tracking-widest text-[10px]">Administrative Access Panel</p>
          </div>

          {/* Choice selector */}
          <div className="flex border-b border-white/5 pb-2">
            <button 
              type="button" 
              onClick={() => {
                setLoginMethod("google");
                setMessage(null);
              }}
              className={`flex-1 pb-2 text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${loginMethod === "google" ? "text-luxury-gold border-b border-luxury-gold" : "text-zinc-500"}`}
            >
              Google Auth
            </button>
            <button 
              type="button" 
              onClick={() => {
                setLoginMethod("credentials");
                setMessage(null);
              }}
              className={`flex-1 pb-2 text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${loginMethod === "credentials" ? "text-luxury-gold border-b border-luxury-gold" : "text-zinc-500"}`}
            >
              Email & Passcode
            </button>
          </div>

          {loginMethod === "google" ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-4 bg-luxury-gold text-luxury-black font-semibold rounded-xl hover:bg-luxury-cream transition-colors duration-500 font-sans tracking-widest uppercase text-xs flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoggingIn ? "Authenticating..." : "Authenticate with Google"}
            </button>
          ) : (
            <form onSubmit={handleCredentialsLogin} className="space-y-4 text-left">
              <div className="flex bg-[#0a0910] rounded-lg p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setCredentialsMode("login")}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all cursor-pointer ${credentialsMode === "login" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setCredentialsMode("register")}
                  className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-bold rounded-md transition-all cursor-pointer ${credentialsMode === "register" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  Request Access
                </button>
              </div>

              {credentialsMode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Email Address</label>
                <input 
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40"
                />
              </div>

              {credentialsMode === "login" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Security Passcode</label>
                  <input 
                    type="password"
                    required
                    value={loginPasscode}
                    onChange={(e) => setLoginPasscode(e.target.value)}
                    placeholder="••••"
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-center text-sm tracking-widest text-luxury-cream focus:outline-none focus:border-luxury-gold/40 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-4 py-3.5 bg-luxury-gold text-luxury-black font-semibold rounded-xl hover:bg-luxury-cream transition-all duration-300 tracking-widest uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isLoggingIn 
                  ? (credentialsMode === "login" ? "Verifying..." : "Submitting...") 
                  : (credentialsMode === "login" ? "Authenticate" : "Submit Request")
                }
              </button>
            </form>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-5 rounded-2xl text-left border ${
                message.type === "success" 
                  ? "bg-green-500/5 text-green-400 border-green-500/20" 
                  : "bg-red-500/5 text-red-400 border-red-500/20"
              } space-y-4`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-semibold tracking-wide text-white uppercase">
                    {message.diagnostic?.title || (message.type === "success" ? "Success" : "Authentication Failure")}
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed uppercase tracking-normal">
                    {message.diagnostic?.explanation || message.text}
                  </p>
                </div>
              </div>

              {message.diagnostic && message.diagnostic.steps && (
                <div className="bg-black/45 p-4 rounded-xl border border-white/5 space-y-2.5">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-luxury-gold block">
                    Actionable Resolution Steps:
                  </span>
                  <div className="space-y-2">
                    {message.diagnostic.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-[10px] text-zinc-300 normal-case leading-relaxed">
                        <span className="text-luxury-gold font-mono shrink-0">▸</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          <button
            onClick={onBack}
            className="w-full py-2 text-luxury-cream/40 hover:text-luxury-cream transition-colors duration-300 font-sans tracking-widest uppercase text-[10px]"
          >
            ← Return to Interface
          </button>
        </motion.div>
      </div>
    );
  }

  if (user && isApproved === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-luxury-cream p-4 sm:p-6 text-left">
        <div className="max-w-md w-full text-center space-y-6 bg-amber-950/10 p-8 sm:p-12 border border-amber-500/20 rounded-2xl backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
          <h1 className="text-2xl font-serif text-amber-500 uppercase tracking-tight">Approval Pending</h1>
          <p className="text-luxury-cream/80 text-sm">
            Welcome, <strong>{user?.displayName || user?.email}</strong>!
          </p>
          <p className="text-luxury-cream/60 text-xs leading-relaxed">
            Your registration has been successfully logged. However, new users must be approved by the **Root Super Admin** before logging in. 
          </p>
          <div className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono bg-white/5 py-2 px-3 rounded-lg">
            Default Role assigned: Writer
          </div>
          <div className="pt-4 flex flex-col gap-4">
            <button
              onClick={logout}
              className="w-full py-3 bg-luxury-cream/10 text-luxury-cream font-medium rounded-xl hover:bg-luxury-cream/20 transition-all border border-luxury-cream/10 uppercase text-xs tracking-widest font-bold font-mono"
            >
              Sign Out / Switch Account
            </button>
            <button
              onClick={onBack}
              className="w-full py-2 text-luxury-gold/60 hover:text-luxury-gold transition-colors text-xs uppercase tracking-widest font-bold font-mono"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!effectiveIsAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-luxury-cream p-4 sm:p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-red-900/10 p-8 sm:p-12 border border-red-500/20 rounded-2xl backdrop-blur-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-serif text-red-500 uppercase tracking-tight">Access Restricted</h1>
          <p className="text-luxury-cream/60 text-sm">You do not have administrative privileges for this console.</p>
          <div className="pt-4 flex flex-col gap-4">
            <button
              onClick={logout}
              className="w-full py-3 bg-luxury-cream/10 text-luxury-cream font-medium rounded-xl hover:bg-luxury-cream/20 transition-all border border-luxury-cream/10"
            >
              Sign Out
            </button>
            <button
              onClick={onBack}
              className="w-full py-2 text-luxury-gold/60 hover:text-luxury-gold transition-colors text-xs uppercase tracking-widest"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!passcodeVerified || (!twoFactorVerified && hasTwoFactor)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-luxury-black text-luxury-cream p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8 bg-luxury-black/50 p-8 sm:p-12 border border-luxury-gold/20 rounded-2xl backdrop-blur-xl"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-luxury-gold/10 flex items-center justify-center border border-luxury-gold/30">
              <ShieldCheck className="w-8 h-8 text-luxury-gold" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-serif text-luxury-gold tracking-tight">Security Verification</h1>
            <p className="text-luxury-cream/60 font-sans uppercase tracking-widest text-[10px]">
              Passcode / 6-digit Code
            </p>
          </div>
          
          <form onSubmit={handlePasscodeSubmit} className="space-y-6">
            <div className="space-y-2">
              <input
                type={passcodeVerified ? "text" : "password"}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode / 6-digit Code"
                className={`w-full bg-[#0a0910] border ${passcodeError ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-center text-xl text-luxury-cream focus:outline-none focus:border-luxury-gold/40 tracking-[0.5em] font-mono`}
                autoFocus
              />
              {passcodeError && (
                <p className="text-red-400 text-[10px] uppercase tracking-widest">Incorrect verification code</p>
              )}
            </div>
            <button
              type="submit"
              disabled={verificationLoading}
              className="w-full py-3 bg-luxury-gold text-luxury-black font-semibold rounded-xl hover:bg-luxury-cream transition-colors duration-500 font-sans tracking-widest uppercase text-xs flex items-center justify-center gap-2"
            >
              {verificationLoading ? <Loader2 className="w-4 h-4 animate-spin text-luxury-black" /> : null}
              <span>Verify Identity</span>
            </button>
          </form>
          <button
            onClick={logout}
            className="w-full py-2 text-luxury-cream/40 hover:text-luxury-cream transition-colors duration-300 font-sans tracking-widest uppercase text-[10px]"
          >
            ← Sign Out & Return
          </button>
        </motion.div>
      </div>
    );
  }

  const handleChangePasscode = async (e: any) => {
    e.preventDefault();
    if (!newPasscode) {
      setChangePasscodeStatus({ type: "error", text: "New passcode cannot be empty." });
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setChangePasscodeStatus({ type: "error", text: "Passcodes do not match." });
      return;
    }

    setIsChangingPasscode(true);
    setChangePasscodeStatus(null);

    try {
      if (!user || !user.email) {
        throw new Error("No active authenticated user.");
      }
      const emailClean = user.email.toLowerCase().trim();

      // Update both Email-based and UID-based documents in database for robustness
      const emailDocRef = doc(db, "admins", emailClean);
      const emailDocSnap = await getDoc(emailDocRef);
      
      let payload: any = { passcode: newPasscode };
      if (!emailDocSnap.exists()) {
        payload = {
          email: emailClean,
          name: user.displayName || "Supriyo (Root Super Admin)",
          role: emailClean === "supriyos9@gmail.com" ? "super_admin" : "sub_admin",
          permissions: emailClean === "supriyos9@gmail.com" ? ["*"] : [],
          passcode: newPasscode,
          addedAt: new Date().toISOString(),
          addedBy: "system"
        };
      }
      await setDoc(emailDocRef, payload, { merge: true });

      if (!user.isCustomAuth && user.uid) {
        const uidDocRef = doc(db, "admins", user.uid);
        await setDoc(uidDocRef, { passcode: newPasscode }, { merge: true });
      }

      setChangePasscodeStatus({ type: "success", text: "Passcode updated successfully!" });
      toast.success("Passcode updated successfully!");
      setNewPasscode("");
      setConfirmPasscode("");
      setTimeout(() => {
        setIsChangePasscodeOpen(false);
        setChangePasscodeStatus(null);
      }, 1500);
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || "Unknown error";
      setChangePasscodeStatus({ type: "error", text: `Failed to update passcode: ${errMsg}` });
      toast.error(`Failed to update passcode: ${errMsg}`);
    } finally {
      setIsChangingPasscode(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#07060b] text-luxury-cream font-sans selection:bg-luxury-gold selection:text-luxury-black">
      
      {/* Mobile Drawer Backdrop overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Slide-out Mobile Drawer Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-[#0a0910] border-r border-white/5 p-6 flex flex-col justify-between z-50 transition-transform duration-300 transform md:hidden ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="space-y-8">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-sans font-semibold uppercase tracking-[0.15em] text-luxury-gold/80 block mb-0.5">
                Admin Console
              </span>
              <span className="text-[10px] text-zinc-400 font-medium block">
                Welcome, {user?.displayName || user?.email?.split('@')[0] || "Admin"}
              </span>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-400 hover:text-white self-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation for mobile drawer */}
          <nav className="space-y-1 max-h-[72vh] overflow-y-auto pretty-scrollbar pr-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
              { id: "hero", label: "Hero (Home)", icon: Star },
              { id: "portfolio", label: "Portfolio", icon: ImageIcon },
              { id: "blog", label: "Blog", icon: FileText },
              { id: "assets", label: "Asset Manager", icon: Folder },
              { id: "activity", label: "Activity Log", icon: Activity },
              { id: "live_sessions", label: "Live Sessions", icon: Activity },
              { id: "navigation", label: "Navigation", icon: Compass },
              { id: "database", label: "Database Hub", icon: Database },
              { id: "qa_automation", label: "QA & Automation", icon: Cpu },
              { id: "general", label: "Settings", icon: Settings },
              { id: "pricing", label: "Pricing", icon: DollarSign },
              { id: "email_templates", label: "Email Templates", icon: Mail },
              { id: "testimonials", label: "Reviews", icon: Star },
              { id: "process", label: "Process", icon: RefreshCw },
              { id: "community", label: "Community", icon: Users },
              { id: "seo", label: "SEO", icon: Globe },
              { id: "theme", label: "Theme", icon: Palette },
              { id: "studio", label: "Studio", icon: MapPin },
              { id: "faq", label: "FAQs", icon: HelpCircle },
              { id: "subscribers", label: "Subscribers", icon: Mail },
              { id: "leads", label: "Inquiries & Leads", icon: MessageCircle },
              { id: "wayfic_forms", label: "Wayfic Forms Beta", icon: Sparkles },
              { id: "admins", label: "Admins", icon: Users },
            ].filter((item) => hasAccessToTab(item.id)).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap transition-all ${
                    isActive 
                      ? "bg-[#141125] border border-[#2b215c] text-white shadow-xl shadow-indigo-950/20" 
                      : "text-luxury-cream/40 hover:text-luxury-cream hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#846df7]' : 'text-luxury-cream/40'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer System status */}
        <div className="space-y-2 pt-4 border-t border-white/5">
          <button
            onClick={() => {
              setIsChangePasscodeOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[#cfb53b] hover:bg-[#cfb53b]/5 rounded-xl transition-all text-xs uppercase tracking-widest font-semibold"
          >
            <Key className="w-4 h-4" />
            <span>Change Passcode</span>
          </button>

          <button
            onClick={() => {
              setIsLogoutConfirmOpen(true);
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-red-500 hover:bg-red-500/5 rounded-xl transition-all text-xs uppercase tracking-widest font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-[#1a1829] bg-[#0a0910] hidden md:flex flex-col p-6 h-full shrink-0 overflow-y-auto pretty-scrollbar">
        {/* Admin Header */}
        <div className="flex flex-col mb-6 border-b border-[#1a1829] pb-5">
          <span className="text-[9px] font-sans font-semibold uppercase tracking-[0.16em] text-[#cfb53b] block mb-0.5">
            Admin Console
          </span>
          <span className="text-[10px] text-zinc-400 font-medium block truncate">
            Welcome, {user?.displayName || user?.email?.split('@')[0] || "Admin"}
          </span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1 mb-8">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
            { id: "hero", label: "Hero (Home)", icon: Star },
            { id: "portfolio", label: "Portfolio", icon: ImageIcon },
            { id: "blog", label: "Blog", icon: FileText },
            { id: "assets", label: "Asset Manager", icon: Folder },
            { id: "activity", label: "Activity Log", icon: Activity },
            { id: "live_sessions", label: "Live Sessions", icon: Activity },
            { id: "navigation", label: "Navigation", icon: Compass },
            { id: "database", label: "Database Hub", icon: Database },
            { id: "qa_automation", label: "QA & Automation", icon: Cpu },
            { id: "general", label: "Settings", icon: Settings },
            { id: "pricing", label: "Pricing", icon: DollarSign },
            { id: "email_templates", label: "Email Templates", icon: Mail },
            { id: "testimonials", label: "Reviews", icon: Star },
            { id: "process", label: "Process", icon: RefreshCw },
            { id: "community", label: "Community", icon: Users },
            { id: "seo", label: "SEO", icon: Globe },
            { id: "theme", label: "Theme", icon: Palette },
            { id: "studio", label: "Studio", icon: MapPin },
            { id: "faq", label: "FAQs", icon: HelpCircle },
            { id: "subscribers", label: "Subscribers", icon: Mail },
            { id: "leads", label: "Inquiries & Leads", icon: MessageCircle },
            { id: "wayfic_forms", label: "Wayfic Forms Beta", icon: Sparkles },
            { id: "admins", label: "Admins", icon: Users },
          ].filter((item) => hasAccessToTab(item.id)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap transition-all ${
                  isActive 
                    ? "bg-[#141125] border border-[#2b215c] text-white shadow-xl shadow-indigo-950/20" 
                    : "text-luxury-cream/40 hover:text-luxury-cream hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#846df7]' : 'text-luxury-cream/40'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Need Help? and Logout - Pinned securely at the bottom */}
        <div className="space-y-4 mt-auto pt-4 border-t border-[#1a1829]">
          {/* Sidebar System Status Widget */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <Cpu className="w-3.5 h-3.5 text-luxury-gold" />
              <span className="text-[10px] uppercase tracking-wider font-bold">System Status</span>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-luxury-cream/40">Status</span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-luxury-cream/40">Backup</span>
                <span className="text-white/80 font-medium font-mono">2026-06-06</span>
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between text-[9px] font-medium">
                  <span className="text-luxury-cream/40">Storage</span>
                  <span className="text-white/80 font-semibold">6.8GB / 10GB</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-luxury-gold rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group space-y-3">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#cfb53b]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 text-white/90">
              <Key className="w-3.5 h-3.5 text-luxury-gold" />
              <span className="text-[10px] uppercase tracking-wider font-bold">Admin Controls</span>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setIsChangePasscodeOpen(true)}
                className="w-full flex items-center justify-between p-2.5 bg-white/[0.02] hover:bg-white/5 text-luxury-cream hover:text-white rounded-xl border border-white/5 transition-all text-[10px] uppercase tracking-widest font-bold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-[#cfb53b]" />
                  Passcode
                </span>
                <span className="text-luxury-cream/40 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                onClick={handleOpen2FAModal}
                className="w-full flex items-center justify-between p-2.5 bg-white/[0.02] hover:bg-white/5 text-luxury-cream hover:text-white rounded-xl border border-white/5 transition-all text-[10px] uppercase tracking-widest font-bold cursor-pointer animate-pulse-subtle"
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Google 2FA
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold ${hasTwoFactor ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/20"}`}>
                  {hasTwoFactor ? "ACTIVE" : "OFF"}
                </span>
              </button>

              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="w-full flex items-center justify-between p-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl border border-red-500/10 transition-all text-[10px] uppercase tracking-widest font-bold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  Logout
                </span>
                <span className="text-red-500/40">→</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Admin Header */}
        <header className="relative z-30 border-b border-[#1a1829] bg-[#0a0910]/80 backdrop-blur-md shrink-0 px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger trigger on mobile */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex md:hidden items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/5 text-white mr-1 active:scale-95 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* JR Photography Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                <Logo 
                  variant="icon" 
                  className="scale-75 origin-left" 
                  src={logoUrl || null} 
                  brandTextLine1={brandTextLine1}
                  brandTextLine2={brandTextLine2}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Range Selector - Hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-white/80 font-medium cursor-pointer hover:bg-white/10 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-[#cfb53b]" />
              <span>Last 30 Days</span>
            </div>

            {/* Public interface back link */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all bg-white/5 border border-white/5 hover:bg-white/10 text-white"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>PUBLIC</span>
            </button>

            {/* Notification triggers */}
            <div className="relative" ref={notificationRef}>
              <div 
                className="relative p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) setUnreadCount(0);
                }}
              >
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[7px] font-bold text-white leading-none shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <Bell className="w-4 h-4 text-white/80" />
              </div>

              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b0a11]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-[#cfb53b]" />
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Action Centre</h3>
                      </div>
                      <button 
                        onClick={() => {
                          setIsNotificationOpen(false);
                          setActiveTab("activity");
                        }}
                        className="text-[9px] uppercase tracking-widest text-[#cfb53b] hover:text-white transition-colors cursor-pointer"
                      >
                        View Ledger
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-xs">
                          No recent system actions found.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.map((notif: any) => (
                            <div key={notif.id} className="p-4 hover:bg-white/5 transition-colors cursor-default">
                              <div className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${
                                  notif.action?.toLowerCase().includes('delete') || notif.action?.toLowerCase().includes('purge') 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                    : notif.action?.toLowerCase().includes('create') || notif.action?.toLowerCase().includes('add')
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                                }`}>
                                  {notif.action?.toLowerCase().includes('delete') ? <Trash2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-zinc-200">{notif.action}</p>
                                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">{notif.details}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{notif.category || 'System'}</span>
                                    <span className="text-[8px] font-mono text-zinc-600">
                                      {notif.createdAt?.seconds 
                                        ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                        : 'Just now'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-1 md:px-3 md:py-1.5 cursor-pointer hover:bg-white/10 transition-all">
              <img
                src={user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"}
                alt="Profile Avatar"
                className="w-7 h-7 rounded-full border border-white/20 object-cover"
              />
              <div className="text-left hidden lg:block leading-tight">
                <p className="text-xs font-bold text-white">{user?.displayName || "Administrator"}</p>
                <p className="text-[9px] text-luxury-cream/40 font-medium uppercase tracking-widest">
                  {currentAdminRole === "super_admin" || (user?.email && user.email.toLowerCase().trim() === "supriyos9@gmail.com") 
                    ? "Super Admin" 
                    : (currentAdminRole === "writer" || currentAdminRole === "Writer" ? "Author" : (currentAdminRole ? currentAdminRole.replace('_', ' ') : "Sub Admin"))}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Contents area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {!hasAccessToTab(activeTab) ? (
            <div className="p-8 bg-black/40 border border-red-500/10 rounded-3xl max-w-4xl mx-auto text-center space-y-4 py-24 animate-in fade-in duration-300">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-xl font-serif text-white uppercase tracking-wider">Access Restricted</h2>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
                Your sub-administrator account does not possess the credentials to enter the **{activeTab}** section. Contact a Super Administrator to coordinate access.
              </p>
              {currentAdminPermissions && currentAdminPermissions.length > 0 && (
                <button
                  onClick={() => setActiveTab(hasAccessToTab("dashboard") ? "dashboard" : currentAdminPermissions[0] as any)}
                  className="px-6 py-2.5 bg-[#846df7] hover:bg-[#6c51ef] text-white rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 active:scale-95"
                >
                   Go to Available Area
                </button>
              )}
            </div>
          ) : activeTab === "dashboard" ? (
            <Dashboard onTabChange={setActiveTab} />
          ) : activeTab === "database" ? (
            <DatabaseManager />
          ) : activeTab === "admins" ? (
            <AdminManager />
          ) : activeTab === "email_templates" ? (
            <EmailTemplatesManager />
          ) : activeTab === "general" ? (
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-2">
                <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">general settings</h2>
                <p className="text-luxury-cream/40 text-sm">Configure core branding, communication signatures, and multi-database settings.</p>
              </div>

              {/* Multi-Database link option inside setting menu */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  onClick={() => setActiveTab("database")} 
                  className="bg-luxury-black/40 border border-white/5 hover:border-luxury-gold/40 p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-gold/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  <Database className="w-6 h-6 text-luxury-gold mb-3" />
                  <h3 className="font-serif text-base text-white mb-1">Database Specification Hub</h3>
                  <p className="text-luxury-cream/40 text-[10px] leading-relaxed">Establish live clusters with MongoDB Atlas, connect MySQL structures, or back up local snapshots.</p>
                </div>
                
                <div 
                  onClick={() => setActiveTab("seo")} 
                  className="bg-luxury-black/40 border border-white/5 hover:border-[#846df7]/40 p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#846df7]/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  <Globe className="w-6 h-6 text-[#846df7] mb-3" />
                  <h3 className="font-serif text-base text-white mb-1">SEO & Page Metadata</h3>
                  <p className="text-luxury-cream/40 text-[10px] leading-relaxed">Configure dynamic tags, titles, keywords and content generators powered by AI optimizations.</p>
                </div>

                <div 
                  onClick={() => setActiveTab("theme")} 
                  className="bg-luxury-black/40 border border-white/5 hover:border-emerald-500/40 p-6 rounded-2xl cursor-pointer transition-all duration-300 relative group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  <Palette className="w-6 h-6 text-emerald-500 mb-3" />
                  <h3 className="font-serif text-base text-white mb-1">Theme Selection & Styles</h3>
                  <p className="text-luxury-cream/40 text-[10px] leading-relaxed">Control ambient color balances, layout structures, and visual border options seamlessly.</p>
                </div>
              </div>
  
              <div className="bg-luxury-black/40 border border-luxury-gold/10 p-10 rounded-3xl space-y-8 backdrop-blur-sm">
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-white">Branding & Communication</h3>
                  <p className="text-luxury-cream/40 text-xs">Manage public site branding, logo, favicon, and client communication contact channels.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImagePreviewInput
                    label="Logo URL"
                    value={logoUrl}
                    onChange={setLogoUrl}
                    placeholder="https://example.com/logo.png"
                    defaultPreview="/assets/image/Logo/site_logo.png"
                  />
                  <ImagePreviewInput
                    label="Favicon URL"
                    value={faviconUrl}
                    onChange={setFaviconUrl}
                    placeholder="https://example.com/favicon.ico"
                    defaultPreview="/assets/image/Logo/site_logo.png"
                  />
                </div>

                <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-semibold">Header Brand Text (Line 1)</label>
                    <input
                      type="text"
                      value={brandTextLine1}
                      onChange={(e) => setBrandTextLine1(e.target.value)}
                      placeholder="JR"
                      className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                    />
                    <p className="text-[10px] text-zinc-500">First line of the text brand in the main navigation and admin headers.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-semibold">Header Brand Text (Line 2)</label>
                    <input
                      type="text"
                      value={brandTextLine2}
                      onChange={(e) => setBrandTextLine2(e.target.value)}
                      placeholder="PHOTOGRAPHY"
                      className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                    />
                    <p className="text-[10px] text-zinc-500">Second line of the text brand in the main navigation and admin headers.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 animate-in fade-in-50 duration-500">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-semibold">Footer Copyright Text</label>
                    <input
                      type="text"
                      value={footerCopyrightText}
                      onChange={(e) => setFooterCopyrightText(e.target.value)}
                      placeholder="© {YYYY} JR Photography Studio. All rights reserved globally."
                      className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                    />
                    <p className="text-[10px] text-zinc-500">Global footer copyright copy. Use <strong>{'{YYYY}'}</strong> for dynamic current year.</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#25D366] font-medium">
                      <MessageCircle className="w-4 h-4" />
                      Floating WhatsApp
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={whatsappEnabled}
                          onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${whatsappEnabled ? 'bg-[#25D366]' : 'bg-white/10'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${whatsappEnabled ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                  
                  {whatsappEnabled && (
                    <div className="space-y-6 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">WhatsApp Number</label>
                        <input
                          type="tel"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="Include country code, e.g. 1234567890"
                          className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-[#25D366]/40 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Default Message Draft</label>
                        <textarea
                          value={whatsappMessage}
                          onChange={(e) => setWhatsappMessage(e.target.value)}
                          rows={3}
                          placeholder="Enter the default message..."
                          className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-[#25D366]/40 transition-all resize-none"
                        />
                      </div>

                      <div className="pt-6 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs uppercase tracking-widest text-luxury-gold font-medium">
                            Enable WhatsApp Business Hours
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={whatsappHoursEnabled}
                                onChange={(e) => setWhatsappHoursEnabled(e.target.checked)}
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${whatsappHoursEnabled ? 'bg-[#cfb53b]' : 'bg-white/10'}`}></div>
                              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${whatsappHoursEnabled ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                          </label>
                        </div>

                        {whatsappHoursEnabled && (
                          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Start Time</label>
                                <input
                                  type="time"
                                  value={whatsappHoursStart}
                                  onChange={(e) => setWhatsappHoursStart(e.target.value)}
                                  className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">End Time</label>
                                <input
                                  type="time"
                                  value={whatsappHoursEnd}
                                  onChange={(e) => setWhatsappHoursEnd(e.target.value)}
                                  className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 block">Active Days</label>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
                                  const isActive = whatsappDays.includes(idx);
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        if (isActive) {
                                          setWhatsappDays(whatsappDays.filter(d => d !== idx));
                                        } else {
                                          setWhatsappDays([...whatsappDays, idx].sort());
                                        }
                                      }}
                                      className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                        isActive
                                          ? "bg-[#cfb53b]/10 text-[#cfb53b] border-[#cfb53b]/30 cursor-pointer"
                                          : "bg-[#0a0910] text-zinc-500 border-white/5 hover:border-white/10 cursor-pointer"
                                      }`}
                                    >
                                      {dayName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">"We are Away" Custom Tooltip Message</label>
                              <textarea
                                value={whatsappAwayMessage}
                                onChange={(e) => setWhatsappAwayMessage(e.target.value)}
                                rows={2}
                                placeholder="e.g. We are currently away. We'll respond as soon as we're back!"
                                className="w-full bg-[#0a0910] border border-white/5 rounded-2xl px-6 py-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
  
                <div className="pt-4 space-y-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#cfb53b] text-luxury-black py-5 rounded-2xl font-semibold uppercase tracking-[0.3em] text-xs hover:bg-luxury-cream transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? "synchronizing..." : "commit changes"}
                  </button>
  
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl text-center text-xs uppercase tracking-widest font-medium ${
                        message.type === "success" 
                          ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {message.text}
                    </motion.div>
                  )}
                </div>
              </div>
            </section>
          ) : activeTab === "seo" ? (
            <SEOSettings />
          ) : activeTab === "hero" ? (
            <HeroManager />
          ) : activeTab === "theme" ? (
            <ThemeSettings />
          ) : activeTab === "portfolio" ? (
            <PortfolioManager />
          ) : activeTab === "blog" ? (
            <BlogManager />
          ) : activeTab === "testimonials" ? (
            <TestimonialManager />
          ) : activeTab === "pricing" ? (
            <PricingManager />
          ) : activeTab === "process" ? (
            <ServiceManager />
          ) : activeTab === "community" ? (
            <CommunitySettingsManager />
          ) : activeTab === "faq" ? (
            <FAQManager />
          ) : activeTab === "navigation" ? (
            <NavigationManager />
          ) : activeTab === "subscribers" ? (
            <SubscriberManager />
          ) : activeTab === "assets" ? (
            <AssetManager />
          ) : activeTab === "activity" ? (
            <ActivityLogManager />
          ) : activeTab === "leads" ? (
            <LeadManager />
          ) : activeTab === "wayfic_forms" ? (
            <WayficFormsManager />
          ) : activeTab === "live_sessions" ? (
            <LiveSessionsManager />
          ) : activeTab === "qa_automation" ? (
            <AutomationTestManager />
          ) : (
            <StudioManager />
          )}
  
          <section className="border-t border-white/5 pt-12 mt-12 text-center space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] text-luxury-cream/20">Security Protocol version 1.2.4</p>
            <p className="text-[10px] text-luxury-cream/10 max-w-sm mx-auto mb-16 md:mb-0">
              © 2026 Admin Console. All rights reserved. Encrypted and Secure.
            </p>
          </section>
        </div>
      </main>

      {/* STICKY BOTTOM DOCK (Mobile Only, Hidden on Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0a0910]/95 backdrop-blur-xl border-t border-white/5 z-40 md:hidden flex items-center justify-between px-6 pb-2.5">
        
        {/* Dashboard button */}
        <button 
          onClick={() => {
            setActiveTab("dashboard");
            setIsMoreMenuOpen(false);
            setIsPlusMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 shrink-0 ${
            activeTab === "dashboard" ? "text-luxury-gold" : "text-luxury-cream/40"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Dashboard</span>
        </button>

        {/* Portfolio button */}
        <button 
          onClick={() => {
            setActiveTab("portfolio");
            setIsMoreMenuOpen(false);
            setIsPlusMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 shrink-0 ${
            activeTab === "portfolio" ? "text-luxury-gold" : "text-luxury-cream/40"
          }`}
        >
          <Folder className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Portfolio</span>
        </button>

        {/* Floating Green Circle Plus Action button */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setIsPlusMenuOpen(!isPlusMenuOpen);
              setIsMoreMenuOpen(false);
            }}
            className={`w-14 h-14 bg-[#a3ff12] hover:bg-[#b5ff42] text-black shadow-[0_0_20px_rgba(163,255,18,0.45)] flex items-center justify-center rounded-full active:scale-95 transition-all -translate-y-4 font-bold border-4 border-[#07060b] focus:outline-none`}
          >
            <Plus className={`w-6 h-6 transition-transform duration-300 ${isPlusMenuOpen ? "rotate-45" : ""}`} />
          </button>

          {/* Plus Menu Pop-up Drawer */}
          {isPlusMenuOpen && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-[#0b0a11] border border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1 animate-in slide-in-from-bottom-2 duration-200">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#94a3b8] px-2.5 py-1 border-b border-white/5 mb-1">Quick Actions</p>
              <button 
                onClick={() => {
                  setActiveTab("portfolio");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-[10px] text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-2 font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add Portfolio</span>
              </button>
              <button 
                onClick={() => {
                  setActiveTab("blog");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-[10px] text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-2 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Create BlogPost</span>
              </button>
              <button 
                onClick={() => {
                  setActiveTab("seo");
                  setIsPlusMenuOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-[10px] text-white/90 hover:bg-white/5 rounded-lg flex items-center gap-2 font-medium"
              >
                <Globe className="w-3.5 h-3.5 text-yellow-400" />
                <span>Optimize SEO</span>
              </button>
            </div>
          )}
        </div>

        {/* Blog button */}
        <button 
          onClick={() => {
            setActiveTab("blog");
            setIsMoreMenuOpen(false);
            setIsPlusMenuOpen(false);
          }}
          className={`flex flex-col items-center gap-1 shrink-0 ${
            activeTab === "blog" ? "text-luxury-gold" : "text-luxury-cream/40"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Blog</span>
        </button>

        {/* More Options button */}
        <div className="relative shrink-0">
          <button 
            onClick={() => {
              setIsMoreMenuOpen(!isMoreMenuOpen);
              setIsPlusMenuOpen(false);
            }}
            className={`flex flex-col items-center gap-1 select-none focus:outline-none ${
              isMoreMenuOpen || (activeTab !== "dashboard" && activeTab !== "portfolio" && activeTab !== "blog") 
                ? "text-luxury-gold" 
                : "text-luxury-cream/40"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider">More</span>
          </button>

          {/* More menu Popup selection */}
          {isMoreMenuOpen && (
            <div className="absolute bottom-16 right-0 w-52 bg-[#0b0a11] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 space-y-0.5 animate-in slide-in-from-bottom-2 duration-200">
              <p className="text-[8px] font-bold uppercase tracking-widest text-[#94a3b8] px-2.5 py-1 border-b border-white/5 mb-1">Administrative Pages</p>
              {[
                { id: "assets", label: "Asset Manager", icon: Folder },
                { id: "activity", label: "Activity Log", icon: Activity },
                { id: "live_sessions", label: "Live Sessions", icon: Activity },
                { id: "navigation", label: "Navigation", icon: Compass },
                { id: "database", label: "Database Hub", icon: Database },
                { id: "general", label: "Settings", icon: Settings },
                { id: "pricing", label: "Pricing Selection", icon: DollarSign },
                { id: "testimonials", label: "Reviews", icon: Star },
                { id: "process", label: "Process", icon: RefreshCw },
                { id: "community", label: "Community", icon: Users },
                { id: "seo", label: "SEO Settings", icon: Globe },
                { id: "theme", label: "Theme Selection", icon: Palette },
                { id: "studio", label: "Studio Coordinates", icon: MapPin },
                { id: "faq", label: "FAQs", icon: HelpCircle },
                { id: "subscribers", label: "Subscribers", icon: Mail },
                { id: "leads", label: "Inquiries & Leads", icon: MessageCircle },
                { id: "admins", label: "Access Control", icon: Users },
              ].filter((subItem) => hasAccessToTab(subItem.id)).map((subItem) => (
                <button
                  key={subItem.id}
                  onClick={() => {
                    setActiveTab(subItem.id as any);
                    setIsMoreMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-[10px] rounded-lg flex items-center gap-2 font-medium ${
                    activeTab === subItem.id 
                      ? "bg-[#141125] text-white border border-[#2b215c]" 
                      : "text-[#94a3b8] hover:bg-white/5"
                  }`}
                >
                  <subItem.icon className="w-3.5 h-3.5 text-[#846df7]" />
                  <span>{subItem.label}</span>
                </button>
              ))}
              <div className="border-t border-white/5 mt-1 pt-1">
                <button
                  onClick={() => {
                    setIsLogoutConfirmOpen(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-[10px] text-red-400 hover:bg-red-500/5 rounded-lg flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* CHANGE PASSCODE MODAL */}
      {isChangePasscodeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative shadow-2xl space-y-6"
          >
            <button 
              onClick={() => {
                setIsChangePasscodeOpen(false);
                setChangePasscodeStatus(null);
              }}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 text-center pt-2">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mx-auto">
                <Key className="w-4 h-4 text-orange-400 animate-pulse" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Update Security Passcode</h3>
              <p className="text-[10px] text-zinc-500 font-medium font-mono">Updating for {user?.email}</p>
            </div>

            <form onSubmit={handleChangePasscode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">New Passcode</label>
                <input 
                  type="text"
                  required
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-center font-mono text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block">Confirm Passcode</label>
                <input 
                  type="text"
                  required
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-center font-mono text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all"
                />
              </div>

              {changePasscodeStatus && (
                <div className={`p-3 rounded-xl text-center text-[10px] font-bold uppercase tracking-wider border ${
                  changePasscodeStatus.type === "success" 
                    ? "bg-green-500/5 text-green-400 border-green-500/15" 
                    : "bg-red-500/5 text-red-400 border-red-500/15"
                }`}>
                  {changePasscodeStatus.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPasscode}
                className="w-full py-3.5 bg-luxury-gold hover:bg-luxury-cream text-luxury-black font-semibold rounded-2xl transition-all duration-300 tracking-widest uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isChangingPasscode ? <Loader2 className="w-4 h-4 animate-spin text-luxury-black" /> : null}
                <span>{isChangingPasscode ? "Synchronizing..." : "Apply Verification"}</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative shadow-2xl space-y-6"
          >
            <div className="space-y-2 text-center pt-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mx-auto">
                <LogOut className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confirm Sign Out</h3>
              <p className="text-[11px] text-zinc-400">Are you sure you want to sign out of the Admin Control Center? Any unsaved edits will be lost.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsLogoutConfirmOpen(false);
                  await logout();
                }}
                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white rounded-2xl text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* GOOGLE AUTHENTICATOR (2FA) SETUP / DISABLE MODAL */}
      {isTwoFactorSetupOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0e0c15] border border-white/5 rounded-3xl p-6 relative shadow-2xl space-y-6"
          >
            <button 
              onClick={() => {
                setIsTwoFactorSetupOpen(false);
                setSetupError("");
                setSetupCode("");
              }}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 text-center pt-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {hasTwoFactor ? "Two-Factor Protection Active" : "Setup Google Authenticator"}
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium font-mono">Securing {user?.email}</p>
            </div>

            {hasTwoFactor ? (
              // If already enabled, show "Disable" workflow
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-xs space-y-2 text-emerald-400">
                  <p className="font-bold uppercase tracking-wider">MFA Protection is Enabled</p>
                  <p className="text-zinc-400 font-normal leading-relaxed">
                    Your account is fully hardened against unauthorized logins. To deactivate this security layer, you must enter your current Google Authenticator verification token.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block text-center">Verify Current Code</label>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-lg text-center font-mono text-luxury-cream focus:outline-none focus:border-red-500/40 transition-all tracking-[0.3em]"
                    autoFocus
                  />
                </div>

                {setupError && (
                  <p className="text-red-400 text-[10px] text-center font-bold uppercase tracking-widest">{setupError}</p>
                )}

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full py-3.5 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-white text-red-400 font-semibold rounded-2xl transition-all duration-300 tracking-widest uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Deactivate 2FA Shield</span>
                </button>
              </form>
            ) : (
              // Setup new 2FA workflow
              <form onSubmit={handleEnable2FA} className="space-y-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 text-[11px] leading-relaxed text-zinc-400">
                    <span className="w-5 h-5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">1</span>
                    <p>Scan this QR code using the **Google Authenticator** app (or any TOTP app) on your mobile device.</p>
                  </div>

                  <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center border border-white/10 shadow-inner">
                    <img 
                      src={setupQRUrl} 
                      alt="Google Authenticator QR Code" 
                      className="w-44 h-44 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-1 bg-white/[0.01] border border-white/5 p-3 rounded-2xl text-center">
                    <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Can't scan the QR? Enter manually:</p>
                    <code className="text-xs text-luxury-gold font-mono tracking-widest select-all block py-1 uppercase">{setupSecret}</code>
                  </div>

                  <div className="flex items-start gap-3 bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 text-[11px] leading-relaxed text-zinc-400">
                    <span className="w-5 h-5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">2</span>
                    <p>Enter the 6-digit confirmation token shown in your authenticator app below to complete setup.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-mono block text-center">6-Digit Code</label>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-lg text-center font-mono text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all tracking-[0.3em]"
                    autoFocus
                  />
                </div>

                {setupError && (
                  <p className="text-red-400 text-[10px] text-center font-bold uppercase tracking-widest">{setupError}</p>
                )}

                <button
                  type="submit"
                  disabled={setupLoading}
                  className="w-full py-3.5 bg-luxury-gold hover:bg-luxury-cream text-luxury-black font-semibold rounded-2xl transition-all duration-300 tracking-widest uppercase text-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {setupLoading ? <Loader2 className="w-4 h-4 animate-spin text-luxury-black" /> : null}
                  <span>Activate 2FA Security</span>
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
