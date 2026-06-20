import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface NavItem {
  id: string; // internal id for drag/drop or mapping
  label: string;
  actionId: string; // The page ID or URL
  isExternal?: boolean;
}

interface NavigationSettings {
  headerLinks: NavItem[];
  footerExploreLinks: NavItem[];
  footerLegalLinks: NavItem[];
}

const DEFAULT_HEADER: NavItem[] = [
  { id: "h1", label: "Home", actionId: "home" },
  { id: "h2", label: "About", actionId: "about" },
  { id: "h3", label: "Process", actionId: "services" },
  { id: "h4", label: "Works", actionId: "works" },
  { id: "h5", label: "Blog", actionId: "blog" },
  { id: "h6", label: "Contact", actionId: "contact" }
];

const DEFAULT_FOOTER_EXPLORE: NavItem[] = [
  { id: "fe1", label: "Home", actionId: "home" },
  { id: "fe2", label: "About", actionId: "about" },
  { id: "fe3", label: "Services", actionId: "services" },
  { id: "fe4", label: "Archives", actionId: "works" },
  { id: "fe5", label: "Blog Publications", actionId: "blog" }
];

const DEFAULT_FOOTER_LEGAL: NavItem[] = [
  { id: "fl1", label: "Privacy Policy", actionId: "/privacy", isExternal: true },
  { id: "fl2", label: "Terms of Service", actionId: "/terms", isExternal: true },
  { id: "fl3", label: "Returns & Refunds", actionId: "/refunds", isExternal: true }
];

export default function NavigationManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [headerLinks, setHeaderLinks] = useState<NavItem[]>(DEFAULT_HEADER);
  const [footerExplore, setFooterExplore] = useState<NavItem[]>(DEFAULT_FOOTER_EXPLORE);
  const [footerLegal, setFooterLegal] = useState<NavItem[]>(DEFAULT_FOOTER_LEGAL);

  useEffect(() => {
    async function loadNavigation() {
      try {
        const snapshot = await getDoc(doc(db, "settings", "navigation"));
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.headerLinks) setHeaderLinks(data.headerLinks);
          if (data.footerExploreLinks) setFooterExplore(data.footerExploreLinks);
          if (data.footerLegalLinks) setFooterLegal(data.footerLegalLinks);
        }
      } catch (err) {
        console.error("Error loading navigation:", err);
        handleFirestoreError(err, OperationType.GET, "settings/navigation");
      } finally {
        setLoading(false);
      }
    }
    loadNavigation();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, "settings", "navigation"), {
        headerLinks,
        footerExploreLinks: footerExplore,
        footerLegalLinks: footerLegal,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setMessage({ type: "success", text: "Navigation settings updated successfully!" });
      toast.success("Navigation settings updated successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to save settings: " + err.message });
      toast.error(`Failed to save settings: ${err.message}`);
      handleFirestoreError(err, OperationType.WRITE, "settings/navigation");
    } finally {
      setSaving(false);
    }
  };

  const NavListEditor = ({ 
    title, 
    links, 
    setLinks 
  }: { 
    title: string; 
    links: NavItem[]; 
    setLinks: React.Dispatch<React.SetStateAction<NavItem[]>> 
  }) => {
    const handleAdd = () => {
      setLinks([...links, { id: Math.random().toString(36).substr(2, 9), label: "New Link", actionId: "" }]);
    };
    
    const handleRemove = (id: string) => {
      setLinks(links.filter(l => l.id !== id));
    };
    
    const handleChange = (id: string, field: keyof NavItem, value: any) => {
      setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("dragIndex", index.toString());
      // Small timeout to allow the drag visual to capture without being changed immediately
      setTimeout(() => {
        if (e.target instanceof HTMLElement) {
          e.target.style.opacity = "0.4";
        }
      }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = "1";
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
      if (isNaN(dragIndex) || dragIndex === dropIndex) return;

      const newLinks = [...links];
      const [draggedItem] = newLinks.splice(dragIndex, 1);
      newLinks.splice(dropIndex, 0, draggedItem);
      
      setLinks(newLinks);
    };
    
    return (
      <div className="bg-luxury-black/40 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-xl text-white">{title}</h3>
          <button
            onClick={handleAdd}
            className="w-8 h-8 rounded-full bg-[#cfb53b]/10 text-[#cfb53b] flex items-center justify-center hover:bg-[#cfb53b] hover:text-black transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          {links.map((link, index) => (
            <div 
              key={link.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="flex gap-4 items-center bg-white/5 border border-white/5 p-3 rounded-xl transition-colors hover:bg-white/10"
            >
              <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-white transition-colors">
                <GripVertical className="w-4 h-4" />
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 mb-1 block">Label</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleChange(link.id, 'label', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-zinc-500 mb-1 block">Action / URL ID</label>
                  <input
                    type="text"
                    value={link.actionId}
                    onChange={(e) => handleChange(link.id, 'actionId', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="e.g. 'home' or '/about'"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <label className="text-[10px] flex items-center gap-1.5 text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!link.isExternal}
                    onChange={(e) => handleChange(link.id, 'isExternal', e.target.checked)}
                    className="accent-[#cfb53b]"
                  />
                  <span>URL?</span>
                </label>
                
                <button
                  onClick={() => handleRemove(link.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">Navigation Engine</h2>
          <p className="text-luxury-cream/40 text-sm">Configure site routing logic and contextual menu architectures.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-[#cfb53b] hover:bg-white text-black font-bold uppercase tracking-widest text-xs rounded-xl transition-all duration-300 flex items-center gap-2"
        >
          {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Setup</>}
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-sm font-medium ${
            message.type === "success" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-xs leading-relaxed">
            Specify Action IDs as internal page identifiers for dynamic routing (e.g. <span className="font-mono text-[10px] bg-black/40 px-1 rounded">home</span>, <span className="font-mono text-[10px] bg-black/40 px-1 rounded">about</span>, <span className="font-mono text-[10px] bg-black/40 px-1 rounded">portfolio</span>). For external URLs or absolute links, tick the <strong>URL?</strong> checkbox and provide valid paths.
          </p>
        </div>
        
        <NavListEditor title="Header Architecture" links={headerLinks} setLinks={setHeaderLinks} />
        <NavListEditor title="Footer Explore Hub" links={footerExplore} setLinks={setFooterExplore} />
        <NavListEditor title="Footer Legal Documentation" links={footerLegal} setLinks={setFooterLegal} />
      </div>
    </section>
  );
}
