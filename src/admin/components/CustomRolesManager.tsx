import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2, Plus, Edit2, Trash2, Check, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, CustomRole } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

// Reuse MODULE_PERMISSIONS directly
const MODULE_PERMISSIONS = [
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

export default function CustomRolesManager() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const docRef = doc(db, 'settings', 'roles');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.roles) {
          const rolesArray = Object.keys(data.roles).map(key => ({
            id: key,
            ...data.roles[key]
          }));
          setRoles(rolesArray);
        } else {
          setRoles([]);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch custom roles.");
    } finally {
      setLoading(false);
    }
  };

  const saveRolesToFirestore = async (newRolesArray: CustomRole[]) => {
    setSaving(true);
    try {
      const rolesObject = newRolesArray.reduce((acc, curr) => {
        acc[curr.id] = { name: curr.name, permissions: curr.permissions };
        return acc;
      }, {} as Record<string, any>);

      await setDoc(doc(db, 'settings', 'roles'), { roles: rolesObject }, { merge: true });
      setRoles(newRolesArray);
      setEditingRole(null);
      toast.success("Roles updated successfully. Changes applied to connected sessions.");
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving the role.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = () => {
    setEditingRole({
      id: `role_${Date.now()}`,
      name: "New Custom Role",
      permissions: ["dashboard"]
    });
  };

  const handleDeleteRole = (id: string) => {
    if (confirm("Are you sure you want to delete this custom role? Any sub-admins assigned to it might lose access to features.")) {
      const updated = roles.filter(r => r.id !== id);
      saveRolesToFirestore(updated);
    }
  };

  const handleSaveRole = () => {
    if (!editingRole || !editingRole.name.trim()) {
       toast.error("Role Name is required.");
       return;
    }
    const exists = roles.find(r => r.id === editingRole.id);
    let updated;
    if (exists) {
       updated = roles.map(r => r.id === editingRole.id ? editingRole : r);
    } else {
       updated = [...roles, editingRole];
    }
    saveRolesToFirestore(updated);
  };

  const togglePermission = (permId: string) => {
    if (!editingRole) return;
    const current = editingRole.permissions || [];
    if (current.includes(permId)) {
       setEditingRole({ ...editingRole, permissions: current.filter(p => p !== permId) });
    } else {
       setEditingRole({ ...editingRole, permissions: [...current, permId] });
    }
  };

  if (loading) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center -mt-2 pb-4 border-b border-white/5">
         <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#cfb53b]">Define Custom Sub-Admin Roles</h3>
            <p className="text-xs text-luxury-cream/40 mt-1">Configure dedicated templates and reuse permission limits.</p>
         </div>
         {!editingRole && (
           <button onClick={handleCreateRole} className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs uppercase tracking-widest font-bold transition-all">
              <Plus className="w-4 h-4" /> <span>Create Role</span>
           </button>
         )}
      </div>

      <AnimatePresence mode="wait">
        {editingRole ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-[#0a0710] border border-[#cfb53b]/20 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center mb-2">
                 <h4 className="text-sm text-[#cfb53b] font-bold uppercase tracking-wider">{editingRole.name === 'New Custom Role' ? 'Creating Setup' : 'Editing Role'}</h4>
                 <button onClick={() => setEditingRole(null)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-2 max-w-sm">
                 <label className="text-[10px] font-mono uppercase tracking-widest text-[#cfb53b]">Role Name Display Title</label>
                 <input 
                   type="text" 
                   value={editingRole.name} 
                   onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                   className="w-full border border-white/10 bg-black/50 text-white px-4 py-3 rounded-xl focus:border-[#cfb53b]/50 text-sm focus:outline-none"
                   placeholder="e.g. Sales Manager"
                 />
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">Toggle Role Permissions</h5>
                  </div>
                  <button onClick={() => setEditingRole({...editingRole, permissions: MODULE_PERMISSIONS.map(m => m.id)})} type="button" className="text-[10px] uppercase tracking-widest font-bold text-[#846df7] hover:underline">Select All</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MODULE_PERMISSIONS.map(perm => {
                     const isAllowed = editingRole.permissions.includes(perm.id);
                     return (
                        <div
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isAllowed 
                              ? "bg-[#cfb53b]/10 border-[#cfb53b]/30" 
                              : "bg-white/5 border-transparent hover:border-white/10"
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 flex items-center justify-center w-4 h-4 rounded border ${
                            isAllowed ? "bg-[#cfb53b] border-[#cfb53b]" : "bg-black/40 border-white/20"
                          }`}>
                            {isAllowed && <Check className="w-3.5 h-3.5 text-black" />}
                          </div>
                          <div>
                            <p className={`text-[11px] font-semibold leading-tight ${isAllowed ? "text-[#cfb53b]" : "text-white"}`}>{perm.label}</p>
                            <p className="text-[9px] text-zinc-500 mt-1 leading-snug">{perm.description}</p>
                          </div>
                        </div>
                     );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                 <button onClick={() => setEditingRole(null)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all">Cancel</button>
                 <button disabled={saving} onClick={handleSaveRole} className="px-5 py-2.5 bg-[#cfb53b] hover:bg-[#b59e33] text-black font-bold uppercase tracking-widest text-[10px] rounded-xl flex items-center gap-2 transition-all">
                   {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save Custom Role
                 </button>
              </div>
           </motion.div>
        ) : (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {roles.length === 0 ? (
                 <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center">
                    <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No custom roles defined. Create templates to standardize user permissions.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map(r => (
                       <div key={r.id} className="relative group bg-white/5 border border-white/5 hover:border-white/10 p-5 rounded-2xl transition-all">
                          <h4 className="text-sm font-bold text-white mb-2 pr-12">{r.name}</h4>
                          <div className="flex flex-wrap gap-1">
                             {r.permissions.map(pid => {
                                const def = MODULE_PERMISSIONS.find(m => m.id === pid);
                                return <span key={pid} className="text-[9px] font-mono text-[#846df7] bg-[#846df7]/10 px-2 py-0.5 rounded">{def ? def.label : pid}</span>
                             })}
                             {r.permissions.length === 0 && <span className="text-[9px] text-zinc-500 italic">No permissions</span>}
                          </div>
                          
                          <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={() => setEditingRole(r)} className="p-1.5 hover:bg-[#cfb53b]/20 hover:text-[#cfb53b] text-zinc-500 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteRole(r.id)} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 text-zinc-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
