import React, { useState, useEffect } from "react";
import { 
  Save, Loader2, Shield, Check, CheckSquare, Square, Info
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";

interface Capability {
  id: string;
  name: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  { id: "general", name: "Manage General Settings", description: "Edit link options, breadcrumbs, webmaster keys, and robots.txt." },
  { id: "titles_meta", name: "Manage Titles & Meta Defaults", description: "Customize global OpenGraph cards, schema defaults, and post titles format." },
  { id: "sitemaps", name: "Manage XML Sitemaps", description: "Enable, configure, or split sitemaps for search spiders." },
  { id: "redirections", name: "Manage Redirections Rules", description: "Create, delete, or activate 301, 302, and 307 URL redirects." },
  { id: "four_zero_four", name: "Analyze 404 Crawl Error Logs", description: "Inspect unresolved requests and view broken path user-agents." },
  { id: "indexing", name: "Submit Instant Indexing Requests", description: "Manually notify Bing and Yandex APIs about new page updates." },
  { id: "on_page", name: "On-Page SEO Optimization Panel", description: "Edit on-page descriptions, custom focus keywords, and schemas." },
  { id: "seo_analyzer", name: "Run Site SEO Analyzer Audits", description: "Trigger full-site audits checking security, performance, and canonicals." },
  { id: "link_builder", name: "Configure Internal Link Rules", description: "Establish keyword-replacement policies to link resources." },
  { id: "content_ai", name: "Use Content AI Assistant", description: "Fetch AI keywords suggestions and character counts goals." }
];

const ROLES = [
  { id: "administrator", name: "Administrator", desc: "Full root access to all settings." },
  { id: "editor", name: "Editor", desc: "Manage content SEO and sitemaps." },
  { id: "author", name: "Author", desc: "Configure only personal published content." },
  { id: "contributor", name: "Contributor", desc: "Draft post outlines without meta access." }
];

export default function RankMathRoleManager() {
  const toast = useToast();
  const [activeRole, setActiveRole] = useState("administrator");
  const [loading, setLoading] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    administrator: CAPABILITIES.map(c => c.id), // All enabled by default
    editor: ["on_page", "four_zero_four", "seo_analyzer", "content_ai"],
    author: ["on_page", "content_ai"],
    contributor: ["content_ai"]
  });

  useEffect(() => {
    async function loadPermissions() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seo_roles"));
        if (docSnap.exists()) {
          setRolePermissions({
            ...rolePermissions,
            ...docSnap.data().permissions
          });
        }
      } catch (error) {
        console.error("Failed to load permissions:", error);
      }
    }
    loadPermissions();
  }, []);

  const handleToggleCapability = (roleId: string, capId: string) => {
    if (roleId === "administrator") {
      toast.error("Administrators retain full root permissions to secure operations. Access cannot be altered.");
      return;
    }

    const current = rolePermissions[roleId] || [];
    const updated = current.includes(capId)
      ? current.filter(id => id !== capId)
      : [...current, capId];

    setRolePermissions({
      ...rolePermissions,
      [roleId]: updated
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "seo_roles"), {
        permissions: rolePermissions
      }, { merge: true });
      toast.success("Role & Permission credentials stored successfully.");
    } catch (error: any) {
      toast.error(`Failed to store: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-500">
      
      {/* Roles select list rail */}
      <div className="lg:col-span-4 space-y-3 bg-[#0a0a10]/40 border border-white/5 p-4 rounded-3xl h-fit">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 pl-2">System User Roles</span>
        
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          {ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                activeRole === role.id
                  ? "bg-[#cfb53b]/10 border-[#cfb53b]/25 text-white"
                  : "bg-zinc-950/20 border-white/5 text-luxury-cream/40 hover:text-white"
              }`}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Shield className={`w-4 h-4 ${activeRole === role.id ? "text-[#cfb53b]" : "text-zinc-600"}`} />
                <span>{role.name}</span>
              </h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{role.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Capabilities list checkboxes */}
      <div className="lg:col-span-8 bg-luxury-black/40 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
        
        <div className="space-y-6">
          <div className="space-y-1">
            <h4 className="font-serif text-lg text-white">
              Capabilities for <span className="text-[#cfb53b] capitalize font-bold">{activeRole}</span>
            </h4>
            <p className="text-luxury-cream/40 text-xs">Configure granular access to SEO panel elements. Toggle individual permissions below.</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            {CAPABILITIES.map((cap) => {
              const isChecked = (rolePermissions[activeRole] || []).includes(cap.id);
              const isDisabled = activeRole === "administrator";
              return (
                <div 
                  key={cap.id}
                  onClick={() => !isDisabled && handleToggleCapability(activeRole, cap.id)}
                  className={`p-4 border rounded-2xl flex items-center justify-between transition-all ${
                    isDisabled ? "opacity-90" : "cursor-pointer"
                  } ${
                    isChecked 
                      ? "bg-zinc-950/60 border-white/10" 
                      : "bg-zinc-950/20 border-transparent hover:border-white/5"
                  }`}
                >
                  <div className="space-y-0.5 pr-4">
                    <p className={`text-xs font-bold uppercase tracking-wider ${isChecked ? "text-white" : "text-zinc-400"}`}>
                      {cap.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-tight">
                      {cap.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isDisabled}
                    className={`p-1 rounded-md transition-all ${
                      isChecked 
                        ? "text-[#cfb53b]" 
                        : "text-zinc-600"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5.5 h-5.5" />
                    ) : (
                      <Square className="w-5.5 h-5.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {activeRole === "administrator" ? (
          <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl flex items-start gap-2.5 text-[10px] text-yellow-500 mt-6 leading-normal">
            <Info className="w-4 h-4 shrink-0" />
            <span>Root Administrator role is structurally locked. Capabilities are permanently enabled.</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Permissions Credentials</span>
          </button>
        )}

      </div>
    </div>
  );
}
