import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { 
  collection, doc, getDocs, setDoc, deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Loader2, Plus, Edit2, Trash2, Save, X, Shield, 
  ShieldCheck, ShieldAlert, CheckSquare, Square, Users,
  Check, AlertTriangle, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PermissionDef {
  id: string;
  label: string;
  description: string;
}

const MODULE_PERMISSIONS: PermissionDef[] = [
  { id: "dashboard", label: "Dashboard Metrics Access", description: "View analytics overview, counters, visitor charts, and SEO indices on the main dashboard view." },
  { id: "hero", label: "Hero Home Editor", description: "Edit homepage headers, descriptions, slides, and background graphics." },
  { id: "portfolio", label: "Portfolio Items", description: "Create, update, and manage creative works and project imagery." },
  { id: "blog", label: "Blog & Editorial Content", description: "Compose articles, edit post slugs, and assign news tags." },
  { id: "assets", label: "Asset Manager", description: "Upload, browse, and manage images and files." },
  { id: "navigation", label: "Menu Navigation links", description: "Define primary headers, custom links, and order layout menus." },
  { id: "database", label: "Database snapshots & restore", description: "Pull, export, and download JSON snapshots or restore configuration." },
  { id: "general", label: "General branding & WhatsApp settings", description: "Manage brand logo image url and WhatsApp chat bubble number/text." },
  { id: "pricing", label: "Pricing Modules", description: "Manage service limits, features, and price tags." },
  { id: "email_templates", label: "Email Templates", description: "Manage automated email designs and messages." },
  { id: "testimonials", label: "Testimonials & Reviews", description: "Moderate testimonials, client feedback scores, and reviewer bios." },
  { id: "process", label: "Process & services manager", description: "Adjust service descriptions, service tiers, prices, and packages." },
  { id: "community", label: "Community forums & events", description: "Conduct settings management for community widgets, links, and hubs." },
  { id: "seo", label: "SEO & Layout metadata optimization", description: "Tune schema markup keywords, index directives, and OG tags." },
  { id: "theme", label: "CSS Visual Theme & palette presets", description: "Tune accent color selections, fonts, borders, and main body rules." },
  { id: "studio", label: "Studio Maps/Locations", description: "Manage custom studios, geo coords, physical addresses, and map details." },
  { id: "faq", label: "FAQ Pages and Section items", description: "Maintain categorized FAQs, accordion questions, and answers." },
  { id: "subscribers", label: "Newsletter Subscribers", description: "View and export newsletter subscribers list." },
  { id: "leads", label: "Inquiries & Leads", description: "Manage form submissions and contact leads." },
  { id: "wayfic_forms", label: "Wayfic Forms Beta", description: "Manage custom form fields and form data flows." },
  { id: "activity", label: "Activity Logs", description: "Track system changes and administrative logs." }
];

interface AdminRecord {
  // Can represent multiple underlying Firestore documents (UID-keyed and/or Email-keyed)
  documentIds: string[]; 
  email: string;
  name: string;
  role: string;
  permissions: string[];
  passcode?: string;
  addedAt?: string;
  addedBy?: string;
  approved?: boolean;
}

export default function AdminManager() {
  const { user, role: currentAdminRole } = useAuth();
  const toast = useToast();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<Partial<AdminRecord> | null>(null);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [message, setMessageRaw] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const setMessage = (msg: { type: "success" | "error"; text: string } | null) => {
    setMessageRaw(msg);
    if (msg) {
      if (msg.type === "success") {
        toast.success(msg.text);
      } else {
        toast.error(msg.text);
      }
    }
  };
  const [deleteEmail, setDeleteEmail] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "admins"));
      
      // Parse list
      const rawRecords = snap.docs.map(d => ({ docId: d.id, ...d.data() } as any));
      
      // Group by email to handle UID-duplicated docs elegantly
      const groupedMap: { [email: string]: AdminRecord } = {};
      
      // Seed root/super user if not in firestore so we're aware of them
      groupedMap["supriyos9@gmail.com"] = {
        documentIds: [],
        email: "supriyos9@gmail.com",
        name: "Supriyo (Root Super Admin)",
        role: "super_admin",
        permissions: ["*"],
        passcode: "2026",
        addedAt: "System Boot",
        addedBy: "System",
        approved: true
      };

      rawRecords.forEach((rec) => {
        if (!rec.email) return;
        const emailKey = rec.email.toLowerCase().trim();
        
        if (groupedMap[emailKey]) {
          // If we already have a record, append its document ID to the sync list
          if (!groupedMap[emailKey].documentIds.includes(rec.docId)) {
            groupedMap[emailKey].documentIds.push(rec.docId);
          }
          // Prefer non-empty properties
          if (!groupedMap[emailKey].name && rec.name) {
            groupedMap[emailKey].name = rec.name;
          }
          // Prefer most powerful role
          if (rec.role === "super_admin") {
            groupedMap[emailKey].role = "super_admin";
            groupedMap[emailKey].permissions = ["*"];
          }
          if (rec.passcode) {
            groupedMap[emailKey].passcode = rec.passcode;
          }
          if (rec.approved !== undefined) {
            groupedMap[emailKey].approved = rec.approved;
          }
        } else {
          groupedMap[emailKey] = {
            documentIds: [rec.docId],
            email: emailKey,
            name: rec.name || "",
            role: rec.role || "sub_admin",
            permissions: rec.permissions || [],
            passcode: rec.passcode || "2026",
            addedAt: rec.addedAt || "",
            addedBy: rec.addedBy || "",
            approved: rec.approved !== false
          };
        }
      });

      setAdmins(Object.values(groupedMap));
    } catch (error) {
      console.error("Error fetching admins list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleEditClick = (admin: AdminRecord) => {
    setEditingAdmin({ ...admin });
    setIsNew(false);
    setMessage(null);
  };

  const handleAddNewClick = () => {
    setEditingAdmin({
      documentIds: [],
      email: "",
      name: "",
      role: "sub_admin",
      permissions: ["dashboard", "hero", "portfolio", "blog"],
      passcode: "2026",
      addedAt: "",
      addedBy: ""
    });
    setIsNew(true);
    setMessage(null);
  };

  const togglePermission = (permId: string) => {
    if (!editingAdmin) return;
    const currentPerms = editingAdmin.permissions ? [...editingAdmin.permissions] : [];
    
    if (currentPerms.includes(permId)) {
      setEditingAdmin({
        ...editingAdmin,
        permissions: currentPerms.filter(p => p !== permId)
      });
    } else {
      setEditingAdmin({
        ...editingAdmin,
        permissions: [...currentPerms, permId]
      });
    }
  };

  const toggleAllPermissions = () => {
    if (!editingAdmin) return;
    const allIds = MODULE_PERMISSIONS.map(p => p.id);
    const hasAll = allIds.every(id => editingAdmin.permissions?.includes(id));
    
    setEditingAdmin({
      ...editingAdmin,
      permissions: hasAll ? [] : allIds
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !editingAdmin.email) return;

    const emailClean = editingAdmin.email.toLowerCase().trim();
    if (!emailClean) {
      setMessage({ type: "error", text: "Please provide a valid administrator email address." });
      return;
    }

    // Root admin cannot be altered or degraded
    if (emailClean === "supriyos9@gmail.com" && editingAdmin.role !== "super_admin") {
      setMessage({ type: "error", text: "The primary root administrator cannot be degraded or modified." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const isSuper = editingAdmin.role === "super_admin";
      const finalPermissions = isSuper ? ["*"] : (editingAdmin.permissions || []);
      
      const payload = {
        email: emailClean,
        name: editingAdmin.name || "",
        role: editingAdmin.role || "sub_admin",
        permissions: finalPermissions,
        passcode: editingAdmin.passcode || "2026",
        addedAt: editingAdmin.addedAt || new Date().toISOString(),
        addedBy: editingAdmin.addedBy || user?.email || "unknown",
        approved: editingAdmin.approved !== false
      };

      // Save to Firestore.
      // We write to the Email-indexed document first-and-foremost
      const emailDocRef = doc(db, "admins", emailClean);
      await setDoc(emailDocRef, payload);

      // If documentIds contains a UID, we also synchronized that UID document!
      const promises = (editingAdmin.documentIds || [])
        .filter(id => id !== emailClean) // skip the already saved emailDoc
        .map(uid => setDoc(doc(db, "admins", uid), payload));
      
      await Promise.all(promises);

      setMessage({ type: "success", text: "Administrator privileges updated successfully." });
      setTimeout(() => {
        setEditingAdmin(null);
        fetchAdmins();
      }, 1500);

    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "An error occurred while saving. Check your write permissions." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: AdminRecord) => {
    if (admin.email === "supriyos9@gmail.com") {
      alert("The primary root administrator cannot be deleted.");
      return;
    }
    
    // Prevent locking out. Check if there is another Super Admin left if deleting a super admin
    if (admin.role === "super_admin") {
      const activeSuperAdmins = admins.filter(a => a.role === "super_admin");
      if (activeSuperAdmins.length <= 1) {
        alert("Action Denied: You must retain at least one Super Admin to configure permission models.");
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Delete by email document id
      await deleteDoc(doc(db, "admins", admin.email));

      // 2. Delete any matching UID documents if available
      const promises = admin.documentIds
        .filter(id => id !== admin.email)
        .map(uid => deleteDoc(doc(db, "admins", uid)));
      
      await Promise.all(promises);
      
      setDeleteEmail(null);
      fetchAdmins();
    } catch (err) {
      console.error(err);
      alert("Failed to revoke administrator access.");
    } finally {
      setSaving(false);
    }
  };

  const isCurrentlySuper = currentAdminRole === "super_admin" || (user?.email && user.email.toLowerCase().trim() === "supriyos9@gmail.com");
  if (!isCurrentlySuper) {
    return (
      <div className="p-8 bg-black/40 border border-red-500/10 rounded-3xl max-w-4xl mx-auto text-center space-y-4 animate-in fade-in duration-300">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-xl font-serif text-white uppercase tracking-wider">Access Restricted</h2>
        <p className="text-luxury-cream/60 text-sm max-w-lg mx-auto leading-relaxed">
          The User Management & Access Control Console is strictly restricted to authorized **Super Administrators**. Sub-administrators can coordinate separate workflow modules but are excluded from adjusting administrative credentials.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-serif text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-[#846df7]" />
            <span>Access Control & User Management</span>
          </h2>
          <p className="text-xs text-luxury-cream/40 uppercase tracking-widest mt-1">
            Delegate workspace roles, configure sub-admin tab limits, and enforce granular visual access rules
          </p>
        </div>
        {!editingAdmin && (
          <button
            onClick={handleAddNewClick}
            className="flex items-center gap-2 px-5 py-3 bg-[#846df7] hover:bg-[#6c51ef] text-white rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Administrator</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editingAdmin ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#0e0c15] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-serif text-white">
                  {isNew ? "Register New Console Admin" : `Modify Credentials: ${editingAdmin.name || editingAdmin.email}`}
                </h3>
                <p className="text-xs text-luxury-cream/40">Assign roles and select menu capabilities</p>
              </div>
              <button 
                onClick={() => setEditingAdmin(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

             <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#846df7]">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={!isNew || editingAdmin.email === "supriyos9@gmail.com"}
                    value={editingAdmin.email || ""}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                    placeholder="e.g. subadmin@gmail.com"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-[#846df7]/40 transition-all font-mono disabled:opacity-50"
                  />
                  <p className="text-[10px] text-zinc-500">Can authenticate with Google or direct credentials.</p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-[#cfb53b]">Administrator Display Name</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.name || ""}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                    placeholder="e.g. Rachel Adams"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-[#cfb53b]/40 transition-all"
                  />
                  <p className="text-[10px] text-zinc-500">Greeting display name inside the dashboard headers.</p>
                </div>

                {/* Passcode */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-orange-400">Security Passcode / Password</label>
                  <input
                    type="text"
                    required
                    value={editingAdmin.passcode || ""}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, passcode: e.target.value })}
                    placeholder="e.g. 1234"
                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-3.5 text-sm text-luxury-cream focus:outline-none focus:border-orange-400/40 transition-all font-mono"
                  />
                  <p className="text-[10px] text-zinc-500 font-sans">Passcode required globally to unlock the dashboard sessions.</p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-luxury-cream/40 block">Administrative Role Tier</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Super Admin selector */}
                  <div 
                    onClick={() => {
                      if (editingAdmin.email === "supriyos9@gmail.com") return;
                      setEditingAdmin({ ...editingAdmin, role: "super_admin", permissions: ["*"] });
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      editingAdmin.role === "super_admin" 
                        ? "bg-[#100d1c] border-[#846df7]/40 shadow-lg shadow-[#846df7]/5" 
                        : "bg-black/20 border-white/5 hover:border-white/10"
                    } ${editingAdmin.email === "supriyos9@gmail.com" ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <ShieldCheck className="w-4 h-4 text-orange-400" />
                      </div>
                      <h4 className="text-xs font-semibold text-white tracking-wide">Super Admin</h4>
                    </div>
                    <p className="text-[11px] text-luxury-cream/40 leading-normal mt-1 text-left">
                      Unrestricted global layout access. Authorize credentials & manage systems.
                    </p>
                  </div>

                  {/* Sub Admin selector */}
                  <div 
                    onClick={() => {
                      if (editingAdmin.email === "supriyos9@gmail.com") return;
                      // default permissions
                      setEditingAdmin({ 
                        ...editingAdmin, 
                        role: "sub_admin", 
                        permissions: ["hero", "portfolio", "blog"] 
                      });
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      editingAdmin.role === "sub_admin" 
                        ? "bg-[#0d101a] border-[#3b82f6]/40 shadow-lg shadow-blue-950/5" 
                        : "bg-black/20 border-white/5 hover:border-white/10"
                    } ${editingAdmin.email === "supriyos9@gmail.com" ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Shield className="w-4 h-4 text-blue-400" />
                      </div>
                      <h4 className="text-xs font-semibold text-white tracking-wide">Sub Admin</h4>
                    </div>
                    <p className="text-[11px] text-luxury-cream/40 leading-normal mt-1 text-left">
                      Custom granular dashboard view access. Excluded from core settings & databases.
                    </p>
                  </div>

                  {/* Author selector */}
                  <div 
                    onClick={() => {
                      if (editingAdmin.email === "supriyos9@gmail.com") return;
                      setEditingAdmin({ 
                        ...editingAdmin, 
                        role: "writer", 
                        permissions: ["blog"] 
                      });
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      editingAdmin.role === "writer" 
                        ? "bg-[#0d1a12] border-emerald-500/40 shadow-lg shadow-emerald-950/5" 
                        : "bg-black/20 border-white/5 hover:border-white/10"
                    } ${editingAdmin.email === "supriyos9@gmail.com" ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-505/20">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-xs font-semibold text-white tracking-wide">Author (Blog)</h4>
                    </div>
                    <p className="text-[11px] text-luxury-cream/40 leading-normal mt-1 text-left">
                      Allowed ONLY blog content menu options. Excluded from editing others' articles.
                    </p>
                  </div>

                  {/* Custom Role selector */}
                  <div 
                    onClick={() => {
                      if (editingAdmin.email === "supriyos9@gmail.com") return;
                      if (['super_admin', 'sub_admin', 'writer'].includes(editingAdmin.role || "")) {
                         setEditingAdmin({ 
                           ...editingAdmin, 
                           role: "custom_role", 
                           permissions: ["dashboard"] 
                         });
                      }
                    }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      !['super_admin', 'sub_admin', 'writer'].includes(editingAdmin.role || "")
                        ? "bg-[#1a0f18] border-pink-500/40 shadow-lg shadow-pink-950/5" 
                        : "bg-black/20 border-white/5 hover:border-white/10"
                    } ${editingAdmin.email === "supriyos9@gmail.com" ? "cursor-not-allowed opacity-80" : ""}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 shrink-0 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                        <Users className="w-4 h-4 text-pink-400" />
                      </div>
                      {!['super_admin', 'sub_admin', 'writer'].includes(editingAdmin.role || "") ? (
                        <input 
                          type="text" 
                          placeholder="Role Title"
                          value={editingAdmin.role === "custom_role" ? "" : editingAdmin.role}
                          onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                          className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-semibold text-white tracking-wide w-full outline-none focus:border-pink-500/50"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 className="text-xs font-semibold text-white tracking-wide">Custom Role</h4>
                      )}
                    </div>
                    <p className="text-[11px] text-luxury-cream/40 leading-normal mt-1 text-left">
                      Define a tailored role title and explicitly pick permitted navigation modules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Approval Status Toggle */}
              {editingAdmin && editingAdmin.email !== "supriyos9@gmail.com" && (
                <div className="p-5 rounded-2xl border border-white/5 bg-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 text-left">
                    <h4 className="text-xs font-semibold text-white tracking-wide">Approval / Activation Status</h4>
                    <p className="text-[11px] text-luxury-cream/40 leading-normal">
                      Toggle whether this user's credentials are active/approved. Unapproved users will be locked out and receive an "Approval Pending" notification.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingAdmin({ ...editingAdmin, approved: editingAdmin.approved === false })}
                    className={`px-4 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                      editingAdmin.approved !== false
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/15 text-red-500 border border-red-500/20"
                    }`}
                  >
                    {editingAdmin.approved !== false ? "Approved & Active" : "Pending / Inactive"}
                  </button>
                </div>
              )}

              {/* Permissions selector for Sub Admins and Custom Roles */}
              {!['super_admin', 'writer'].includes(editingAdmin.role || "") && (
                <div className="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-3 duration-350">
                  <div className="flex justify-between items-center pb-2">
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[#3b82f6] font-bold">Configure Sub-Admin Module Permissions</h4>
                      <p className="text-[11px] text-luxury-cream/40">Checked modules will be visible & editable inside their console navigation menu.</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleAllPermissions}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] uppercase font-bold tracking-widest text-[#cfb53b] transition-all"
                    >
                      {MODULE_PERMISSIONS.every(m => editingAdmin.permissions?.includes(m.id)) ? "Deselect All" : "Allow All Access"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {MODULE_PERMISSIONS.map((perm) => {
                      const isAllowed = editingAdmin.permissions?.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`p-4 rounded-xl border cursor-pointer flex gap-3 transition-all select-none ${
                            isAllowed 
                              ? "bg-black/50 border-emerald-500/30 text-white" 
                              : "bg-black/20 border-white/5 hover:border-white/10 text-luxury-cream/40"
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isAllowed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-600" />
                            )}
                          </div>
                          <div>
                            <span className={`text-xs font-semibold ${isAllowed ? "text-white" : "text-zinc-300"}`}>
                              {perm.label}
                            </span>
                            <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">{perm.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase tracking-widest font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-[#cfb53b] text-luxury-black font-semibold rounded-xl text-xs uppercase tracking-widest hover:bg-luxury-cream transition-all duration-300 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? "Saving changes..." : "Commit Credentials"}</span>
                </button>
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-xl text-center text-xs uppercase tracking-widest font-medium ${
                    message.type === "success" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Warning Alert banner */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3.5 text-amber-200">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider">Credentials Policy Enforcement</h4>
                <p className="text-[11px] text-amber-200/60 leading-normal max-w-4xl">
                  Admins added by email will automatically register their Firestore document when they log in to the system. Changing their permissions synchronizes instantly. Ensure correct Google addresses are entered to allow successful system authentication.
                </p>
              </div>
            </div>

            {/* Admins Grid */}
            {loading ? (
              <div className="py-24 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {admins.map((adm) => {
                  const isRoot = adm.email === "supriyos9@gmail.com";
                  const isSuper = adm.role === "super_admin";
                  
                  return (
                    <div 
                      key={adm.email} 
                      className="p-5 bg-black/40 border border-white/5 rounded-3xl flex flex-col justify-between min-h-[170px] relative group hover:border-[#846df7]/30 transition-all duration-300"
                    >
                      <div className="space-y-4">
                        {/* Header card info */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-white tracking-wide">
                              {adm.name || "Awaiting Login..."}
                            </h3>
                            <span className="text-xs text-luxury-cream/40 block font-mono">{adm.email}</span>
                          </div>
                          
                          {/* Badge tag for Role */}
                          <div className="flex flex-col sm:flex-row items-end gap-1.5 shrink-0">
                            {adm.approved === false && (
                              <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[8px] uppercase font-bold tracking-widest flex items-center gap-1 shadow-sm font-mono animate-pulse">
                                Pending Approval
                              </span>
                            )}
                            {isSuper ? (
                              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 shadow-sm font-mono">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Super Admin
                              </span>
                            ) : adm.role === "writer" ? (
                              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 shadow-sm font-mono">
                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                Author
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-[#846df7]/10 border border-[#846df7]/20 text-[#846df7] rounded-lg text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5 shadow-sm font-mono">
                                <Shield className="w-3.5 h-3.5" />
                                {adm.role ? adm.role.replace('_', ' ') : "Sub Admin"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle detailed view for sub-admins permissions list */}
                        {!isSuper && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b]">Granted Modules:</span>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {adm.permissions.length === 0 ? (
                                <span className="text-[9px] font-bold uppercase tracking-wide text-red-400 bg-red-500/5 px-2 py-0.5 rounded-lg border border-red-500/10">No Access Granted</span>
                              ) : adm.permissions.length === MODULE_PERMISSIONS.length ? (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">All Access Enabled</span>
                              ) : (
                                adm.permissions.map((pId) => {
                                  const def = MODULE_PERMISSIONS.find(m => m.id === pId);
                                  return (
                                    <span key={pId} className="text-[9px] text-[#846df7] bg-[#846df7]/5 border border-white/5 px-2 py-0.5 rounded-md font-sans">
                                      {def ? def.label : pId}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        {isSuper && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b]">Workspace Scope:</span>
                            <p className="text-[11px] text-luxury-cream/40 leading-normal">
                              Fully unrestricted administrator permission key. All dynamic sections, database management features, and settings layouts are accessible.
                            </p>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Security Passcode:</span>
                          <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 font-mono font-bold tracking-wider">
                            {adm.passcode || "2026"}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-[10px] text-zinc-500">
                        <span>Added By: {adm.addedBy || "Internal Initializer"}</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(adm)}
                            className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-[#846df7] transition-all flex items-center gap-1.5 uppercase font-bold text-[10px]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Modify</span>
                          </button>

                          {deleteEmail === adm.email ? (
                            <div className="flex items-center gap-1 bg-red-950/20 border border-red-500/15 p-1 rounded-xl">
                              <span className="text-red-400 font-bold px-1 text-[9px] uppercase">Sure?</span>
                              <button
                                onClick={() => handleDelete(adm)}
                                className="px-2 py-1 bg-red-500 text-white rounded-lg text-[9px] uppercase font-bold"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteEmail(null)}
                                className="px-2 py-1 bg-white/10 text-white rounded-lg text-[9px] uppercase font-bold"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (isRoot) return;
                                setDeleteEmail(adm.email);
                              }}
                              disabled={isRoot}
                              className={`p-2 hover:bg-red-500/5 rounded-xl text-zinc-500 hover:text-red-400 transition-all flex items-center gap-1.5 uppercase font-bold text-[10px] ${
                                isRoot ? "opacity-30 cursor-not-allowed" : ""
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
