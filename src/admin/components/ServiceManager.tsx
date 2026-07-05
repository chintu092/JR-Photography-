import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { 
  collection, doc, getDocs, setDoc, deleteDoc, getDoc, 
  serverTimestamp, query, orderBy, Timestamp 
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Loader2, Plus, Edit2, Trash2, Save, X, ChevronLeft, 
  Hash, ShieldCheck, Sparkles, Sliders, GripVertical 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Service, SEOSettings } from "../../types";
import { SERVICES } from "../../data";
import { getCollectionData, saveDocument, deleteDocument } from "../../lib/db-client";
import SEOAssistantPanel from "./SEOAssistantPanel";

export default function ServiceManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<Service> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Parallel custom SEO coordinates
  const [seoDraft, setSeoDraft] = useState<SEOSettings>({
    title: "",
    description: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogImageUrl: "",
    noIndex: false,
    slug: "",
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await getCollectionData<Service>("services");
      const sorted = fetchedItems.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return (a.title || "").localeCompare(b.title || "");
      });
      setItems(sorted);
    } catch (error) {
      console.error("Error fetching services:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Fetch or initialize page-level SEO settings whenever the active edited service changes
  useEffect(() => {
    async function loadServiceSEO() {
      if (!editingItem || !editingItem.id) {
        setSeoDraft({
          title: "",
          description: "",
          focusKeyword: "",
          canonicalUrl: "",
          ogImageUrl: "",
          noIndex: false,
          slug: "",
        });
        return;
      }

      try {
        const seoDoc = await getDoc(doc(db, "settings", "seo", "pages", `service-${editingItem.id}`));
        if (seoDoc.exists()) {
          setSeoDraft(seoDoc.data() as SEOSettings);
        } else {
          setSeoDraft({
            title: editingItem.title || "",
            description: editingItem.description || "",
            focusKeyword: editingItem.title || "Photography Service",
            canonicalUrl: "",
            ogImageUrl: "",
            noIndex: false,
            slug: editingItem.id,
          });
        }
      } catch (err) {
        console.error("Error loading service level search definitions:", err);
      }
    }

    loadServiceSEO();
  }, [editingItem?.id]);

  const handleEditClick = (item: Service) => {
    window.location.hash = `/admin/services/edit/${item.id}`;
    setEditingItem(item);
  };

  const handleAddNewClick = () => {
    window.location.hash = `/admin/services/new`;
    setEditingItem({
      num: "01",
      title: "",
      description: "",
      longDesc: "",
      tags: [] as string[],
      order: items.length + 1
    });
  };

  const handleBackClick = () => {
    window.location.hash = `/admin/services`;
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!user || !editingItem || !editingItem.title) return;
    setSaving(true);
    setMessage(null);
    try {
      const isNew = !editingItem.id;
      const id = isNew 
        ? "service-" + Date.now() 
        : editingItem.id;
      
      const tagsArray = typeof editingItem.tags === 'string'
        ? (editingItem.tags as string).split(",").map(t => t.trim()).filter(Boolean)
        : (editingItem.tags || []);

      const data: any = {
        num: editingItem.num || "01",
        title: editingItem.title || "",
        description: editingItem.description || "",
        longDesc: editingItem.longDesc || "",
        tags: tagsArray,
        order: editingItem.order || items.length + 1,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      let finalCreatedAt = serverTimestamp();
      if (!isNew && editingItem.createdAt) {
        const val = editingItem.createdAt as any;
        if (typeof val.toDate === "function") {
          finalCreatedAt = val;
        } else if (typeof val === "string") {
          try {
            finalCreatedAt = Timestamp.fromDate(new Date(val)) as any;
          } catch (e) {
            console.warn("Legacy string date format failed to parse:", e);
          }
        } else if (val.seconds !== undefined) {
          finalCreatedAt = new Timestamp(val.seconds, val.nanoseconds) as any;
        } else if (val instanceof Date) {
          finalCreatedAt = Timestamp.fromDate(val) as any;
        } else {
          finalCreatedAt = val;
        }
      }
      data.createdAt = finalCreatedAt;

      // 1. Save standard service card
      await saveDocument("services", id!, data);

      // 2. Parallel save nested service-level SEO coordinates
      const seoData = {
        title: seoDraft.title || data.title,
        description: seoDraft.description || data.description,
        focusKeyword: seoDraft.focusKeyword || data.title,
        canonicalUrl: seoDraft.canonicalUrl || "",
        ogImageUrl: seoDraft.ogImageUrl || "",
        noIndex: !!seoDraft.noIndex,
        slug: seoDraft.slug || id,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      await saveDocument("settings_seo_pages", `service-${id}`, seoData);

      setMessage({ type: "success", text: `Service architecture "${data.title}" saved successfully along with SEO configs!` });
      toast.success(`Service architecture "${data.title}" saved successfully along with SEO configs!`);
      setTimeout(() => {
        setEditingItem(null);
        fetchItems();
        window.location.hash = `/admin/services`;
      }, 1500);
    } catch (error: any) {
      console.error("Error saving service:", error);
      setMessage({ type: "error", text: "Failed to upload service modifications." });
      toast.error(`Failed to upload service modifications: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, `services/${editingItem.id || 'new'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    setMessage(null);
    try {
      await deleteDocument("services", deleteId);
      await deleteDocument("settings_seo_pages", `service-${deleteId}`);

      setItems(prev => prev.filter(i => i.id !== deleteId));
      setMessage({ type: "success", text: "Service item and associated metadata deleted successfully." });
      toast.success("Service item and associated metadata deleted successfully.");
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting service:", error);
      setMessage({ type: "error", text: "Authority constraint failure during deletions." });
      toast.error(`Error deleting service: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const snap = await getDocs(collection(db, "services"));
      if (!snap.empty) {
        setMessage({ type: "error", text: "Cannot seed: Database already contains data. Clear it first." });
        toast.error("Cannot seed: Database already contains data. Clear it first.");
        setSaving(false);
        return;
      }

      for (const item of SERVICES) {
        const id = item.id || `service-${item.num}`;
        await saveDocument("services", id, {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });

        // Seed basic dynamic service SEO coordinates
        await saveDocument("settings_seo_pages", `service-${id}`, {
          title: item.title,
          description: item.description,
          focusKeyword: item.tags.join(", "),
          slug: id,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      }
      setMessage({ type: "success", text: "Core photography services catalog seeded successfully!" });
      toast.success("Core photography services catalog seeded successfully!");
      fetchItems();
    } catch (error: any) {
      console.error("Error seeding services:", error);
      setMessage({ type: "error", text: "Failed to initialize mock templates." });
      toast.error(`Failed to seed photography services list: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragIndex", index.toString());
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

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    // Update local state and assigning new order fields
    const updatedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    setItems(updatedItems);
    
    try {
      // Setup batch updates
      await Promise.all(updatedItems.map(item => 
        saveDocument("services", item.id, { order: item.order })
      ));
      toast.success("Service order saved successfully.");
    } catch (error) {
       console.error("Error updating order:", error);
       toast.error("Error saving new order.");
    }
  };

  if (editingItem) {
    /* DEDICATED FULL SCREEN SERVICE CASE WORK EDIT WORKSPACE */
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left max-w-7xl mx-auto min-h-screen pb-16">
        
        {/* Upper edit controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="p-2 sm:p-3 bg-white/5 hover:bg-[#cfb53b] hover:text-black rounded-xl border border-white/5 transition-all text-zinc-400 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">service architecture curator studio</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white italic truncate max-w-[280px] sm:max-w-md">
                {editingItem.id ? `Editing Service: ${editingItem.title}` : "Create Service Step"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto self-end sm:self-center">
            <button
              onClick={handleBackClick}
              className="flex-1 sm:flex-initial px-4 py-3 bg-white/5 rounded-xl text-xs uppercase font-bold tracking-widest text-zinc-400 hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-initial px-6 py-3 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Publishing Step..." : "Save Service"}</span>
            </button>
          </div>
        </div>

        {saving && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs flex items-center gap-2 font-mono uppercase">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Writing files. Synchronizing local state modifications onto Firestore buckets...</span>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-xl text-xs tracking-widest uppercase text-center font-medium ${
            message.type === "success" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {message.text}
          </div>
        )}

        {/* Form area list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT inputs details card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-luxury-black/40 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6">
              <h4 className="text-xs uppercase tracking-widest text-[#cfb53b] font-bold pb-2 border-b border-white/5 flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-[#cfb53b]" />
                Process Specification Coordinates
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-zinc-500" />
                    Display Step Number
                  </label>
                  <input
                    type="text"
                    value={editingItem.num || "01"}
                    onChange={(e) => setEditingItem({ ...editingItem, num: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                    placeholder="e.g. 01"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Chronological Sort Order</label>
                  <input
                    type="number"
                    value={editingItem.order || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Architecture Step Title</label>
                <input
                  type="text"
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  placeholder="e.g. Masterclass Lighting Setup"
                />
              </div>

              {/* Description summary */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Short Deck Description Overview</label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                  rows={3}
                  placeholder="Brief summary visible on list cards..."
                />
              </div>

              {/* Long descriptive text */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Detailed Inside Long Copy Story</label>
                <textarea
                  value={editingItem.longDesc || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, longDesc: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                  rows={6}
                  placeholder="Comprehensive technical, lighting, and logistical workflows..."
                />
              </div>

              {/* Specialty tags */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Specialty Tags / Technologies</label>
                  <span className="text-[8px] text-zinc-500 uppercase">comma separated list</span>
                </div>
                <input
                  type="text"
                  value={Array.isArray(editingItem.tags) ? editingItem.tags.join(", ") : editingItem.tags || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  placeholder="e.g. High Fashion, Runway Lighting, Capture One"
                />
              </div>
            </div>
          </div>

          {/* RIGHT Sidebar Auditing Preview Tool Column */}
          <div className="lg:col-span-6 flex flex-col h-full sticky top-8">
            <SEOAssistantPanel
              type="services"
              currentTitle={editingItem.title || ""}
              currentSummary={editingItem.description || ""}
              seoSettings={seoDraft}
              onUpdate={setSeoDraft}
            />
          </div>

        </div>

      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 text-left">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight font-light">service architectures</h2>
          <p className="text-luxury-cream/40 text-sm">Review, seed, and polish procedural steps, gear pipelines, and post-processing structures.</p>
        </div>
        <div className="flex gap-3 self-end sm:self-center">
          <button
            onClick={handleSeed}
            disabled={saving}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 cursor-pointer disabled:opacity-40"
          >
            Seed Defaults
          </button>
          <button
            onClick={handleAddNewClick}
            className="px-4 py-2 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add Process Step</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs tracking-widest uppercase text-center font-medium ${
          message.type === "success" 
            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="bg-luxury-black/40 border border-white/5 rounded-2xl md:rounded-3xl p-6 relative group flex flex-col h-full text-left col-span-1"
            >
              <div className="absolute top-6 left-5 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-white transition-colors">
                 <GripVertical className="w-5 h-5" />
              </div>

              <div className="absolute top-6 right-6 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClick(item)}
                  className="p-1.5 bg-luxury-black border border-white/5 rounded-xl text-[#cfb53b] hover:bg-[#cfb53b] hover:text-black transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(item.id!)}
                  className="p-1.5 bg-luxury-black border border-white/5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4 mt-6">
                <span className="text-[10px] font-mono text-[#cfb53b] font-bold tracking-widest bg-white/5 border border-white/5 px-2.5 py-1 rounded-full">
                  STEP {item.num}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Rank: {item.order}</span>
              </div>

              <h3 className="font-serif text-xl text-white group-hover:text-[#cfb53b] transition-colors mb-2 leading-tight">
                {item.title}
              </h3>
              
              <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4 line-clamp-3">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-white/5">
                {item.tags.map((tag, idx) => (
                  <span key={idx} className="text-[8px] font-mono tracking-wider uppercase text-zinc-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-white/5 rounded-2xl text-zinc-500 font-medium font-sans">
              No entries logged inside Firestore. Select "Seed Defaults" to pre-populate.
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-white/5 max-w-sm w-full p-8 rounded-3xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-serif text-white leading-snug">Confirm Deletion</h3>
                <p className="text-zinc-500 text-xs">
                  Are you sure you want to permanently delete "{items.find(i => i.id === deleteId)?.title}"? This action is irreversible.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold uppercase tracking-widest text-[9px] hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Deleting..." : "Permanently Delete"}
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={saving}
                  className="w-full bg-white/5 text-zinc-400 py-3 rounded-xl font-semibold uppercase tracking-widest text-[9px] hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
