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
  ImageIcon, Calendar, ShieldAlert, Sparkles, Folder, GripVertical
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { WorkItem, SEOSettings } from "../../types";
import { WORK_ITEMS } from "../../data";
import { getCollectionData } from "../../lib/db-client";
import ImagePreviewInput from "./ImagePreviewInput";
import SEOAssistantPanel from "./SEOAssistantPanel";

export default function PortfolioManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<WorkItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);

  // Saved Draft placeholder for local storage restoration
  const [savedDraft, setSavedDraft] = useState<any | null>(null);

  // Custom SEO configurations for the portfolio item
  const [seoDraft, setSeoDraft] = useState<SEOSettings>({
    title: "",
    description: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogImageUrl: "",
    noIndex: false,
    slug: "",
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkCategory, setBulkCategory] = useState<WorkItem["category"]>("Wedding");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await getCollectionData<WorkItem>("portfolio");
      
      const healedItems = fetchedItems.map(item => {
        const titleSafe = item.title || "";
        const categorySafe = item.category || "Portfolio";
        if (!item.imageAlt || item.imageAlt.trim() === '') {
          const fallback = WORK_ITEMS.find(wi => wi.id === item.id || (wi.title && wi.title.toLowerCase() === titleSafe.toLowerCase()));
          const newAlt = fallback?.imageAlt || `${categorySafe} photography - ${titleSafe}`;
          return { ...item, title: titleSafe, category: categorySafe, imageAlt: newAlt };
        }
        return { ...item, title: titleSafe, category: categorySafe };
      });

      // Maintain order mapping properly or fallback to title local compare
      const sortedItems = healedItems.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return (a.title || "").localeCompare(b.title || "");
      });

      setItems(sortedItems);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      setItems([]);
    } finally {
      setLoading(false);
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
        setDoc(doc(db, "portfolio", item.id), { order: item.order }, { merge: true })
      ));
      toast.success("Portfolio order saved successfully.");
    } catch (error) {
       console.error("Error updating order:", error);
       toast.error("Error saving new order.");
    }
  };

  // Check for saved drafts on mount
  useEffect(() => {
    const raw = localStorage.getItem("jrphotography-portfolio-draft");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.editingItem) {
          setSavedDraft(parsed);
        }
      } catch (err) {
        console.error("Failed to parse unsaved portfolio draft:", err);
      }
    }
  }, []);

  // Sync draft to local storage on edits
  useEffect(() => {
    if (editingItem) {
      localStorage.setItem("jrphotography-portfolio-draft", JSON.stringify({ editingItem, seoDraft, isSlugCustomized }));
    }
  }, [editingItem, seoDraft, isSlugCustomized]);

  useEffect(() => {
    fetchItems();
  }, []);

  // Sync custom page-level SEO parameters whenever the active edited item changes
  useEffect(() => {
    async function loadPortfolioSEO() {
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
        const seoDoc = await getDoc(doc(db, "settings", "seo", "pages", `works-detail-${editingItem.id}`));
        if (seoDoc.exists()) {
          setSeoDraft(seoDoc.data() as SEOSettings);
        } else {
          setSeoDraft({
            title: editingItem.title || "",
            description: editingItem.description || "",
            focusKeyword: editingItem.category || "",
            canonicalUrl: "",
            ogImageUrl: editingItem.image || "",
            noIndex: false,
            slug: editingItem.id,
          });
        }
      } catch (err) {
        console.error("Error loading portfolio audit SEO settings:", err);
      }
    }

    loadPortfolioSEO();
  }, [editingItem?.id]);

  const handleEditClick = (item: WorkItem) => {
    window.location.hash = `/admin/portfolio/edit/${item.id}`;
    setEditingItem(item);
    // Check if the current slug is customized compared to expected item ID slug string
    const expectedSlug = item.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setIsSlugCustomized(item.id !== expectedSlug && !!item.id);
  };

  const handleAddNewClick = () => {
    window.location.hash = `/admin/portfolio/new`;
    setIsSlugCustomized(false);
    setEditingItem({
      title: "",
      category: "Fashion",
      image: "",
      imageAlt: "",
      description: "",
      year: new Date().getFullYear().toString(),
      client: "",
      role: "",
      details: [] as string[],
      galleryImages: [] as string[]
    });
  };

  const handleBackClick = () => {
    window.location.hash = `/admin/portfolio`;
    localStorage.removeItem("jrphotography-portfolio-draft");
    setEditingItem(null);
  };

  const handleBulkImport = async () => {
    if (!user || !bulkUrls.trim()) return;
    setSaving(true);
    let successCount = 0;
    
    try {
      let parsedData: any[] = [];
      const trimmedData = bulkUrls.trim();
      
      if (trimmedData.startsWith('[') && trimmedData.endsWith(']')) {
        try {
          parsedData = JSON.parse(trimmedData);
        } catch (e) {
           throw new Error("Invalid JSON format provided. Please ensure it is a valid JSON array.");
        }
      } else {
        const urls = trimmedData.split("\n").map(u => u.trim()).filter(u => u.length > 0);
        parsedData = urls.map(url => {
          const titleMatch = url.match(/\/([^/?#]+)[^/]*$/i);
          const titleString = titleMatch ? decodeURIComponent(titleMatch[1].split('.')[0].replace(/[-_]/g, ' ')) : "Bulk Uploaded Project";
          const cleanTitle = titleString.charAt(0).toUpperCase() + titleString.slice(1);
          return { image: url, title: cleanTitle };
        });
      }

      await Promise.all(parsedData.map(async (itemData: any) => {
        const d = new Date();
        const generatedId = itemData.id || `bulk-${d.getTime()}-${Math.floor(Math.random() * 10000)}`;
        
        const cleanTitle = itemData.title || "Bulk Uploaded Project";
        const category = itemData.category || bulkCategory;
        
        const data: any = {
          title: cleanTitle,
          category: category,
          image: itemData.image || "",
          imageAlt: itemData.imageAlt || `${category} photography - ${cleanTitle}`,
          description: itemData.description || "Bulk uploaded portfolio entry.",
          year: itemData.year || d.getFullYear().toString(),
          client: itemData.client || "Independent",
          role: itemData.role || "Lead Photographer",
          details: itemData.details || [],
          galleryImages: itemData.galleryImages || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          order: items.length + successCount + 1,
          ...itemData
        };
        
        // Remove id from document data before saving if it was included in JSON
        if (data.id) delete data.id;

        await setDoc(doc(db, "portfolio", generatedId), data);
        successCount++;
      }));
      toast.success(`Successfully added ${successCount} portfolio items`);
      setShowBulkUpload(false);
      setBulkUrls("");
      fetchItems();
    } catch (e: any) {
      console.error("Error bulk uploading:", e);
      toast.error(`Error during bulk import: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user || !editingItem || !editingItem.title || !editingItem.image) return;
    setSaving(true);
    setMessage(null);
    try {
      const isNew = !editingItem.id;
      const baseSlug = seoDraft.slug || editingItem.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled-project";
      const id = baseSlug;
      const oldId = editingItem.id;
      
      const detailsArray = typeof editingItem.details === 'string' 
        ? (editingItem.details as string).split('\n').filter(s => s.trim())
        : (editingItem.details || []);

      const galleryArray = typeof editingItem.galleryImages === 'string'
        ? (editingItem.galleryImages as string).split('\n').filter(s => s.trim())
        : (editingItem.galleryImages || []);

      const data: any = {
        title: editingItem.title || "",
        category: editingItem.category || "Lifestyle",
        image: editingItem.image || "",
        imageAlt: editingItem.imageAlt || "",
        description: editingItem.description || "",
        year: editingItem.year || "",
        client: editingItem.client || "",
        role: editingItem.role || "",
        details: detailsArray,
        galleryImages: galleryArray,
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

      // 1. Save standard portfolio card body
      await setDoc(doc(db, "portfolio", id!), data, { merge: true });

      // 2. Parallel save nested catalog-level SEO credentials
      const seoData = {
        title: seoDraft.title || data.title,
        description: seoDraft.description || data.description,
        focusKeyword: seoDraft.focusKeyword || data.category,
        canonicalUrl: seoDraft.canonicalUrl || "",
        ogImageUrl: seoDraft.ogImageUrl || data.image,
        noIndex: !!seoDraft.noIndex,
        slug: id,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      await setDoc(doc(db, "settings", "seo", "pages", `works-detail-${id}`), seoData, { merge: true });

      // If existing item and id changed, delete old one
      if (!isNew && oldId && oldId !== id) {
        try {
          await deleteDoc(doc(db, "portfolio", oldId));
          await deleteDoc(doc(db, "settings", "seo", "pages", `works-detail-${oldId}`));
        } catch (e) {
          console.warn("Failed to delete outdated old document:", e);
        }
      }

      setMessage({ type: "success", text: `Portfolio element "${data.title}" saved successfully along with organic index credentials!` });
      toast.success(`Portfolio element "${data.title}" saved successfully along with organic index credentials!`);
      setTimeout(() => {
        setEditingItem(null);
        fetchItems();
        window.location.hash = `/admin/portfolio`;
      }, 1500);
    } catch (error: any) {
      console.error("Error saving portfolio item:", error);
      setMessage({ type: "error", text: "Failed to save portfolio data details." });
      toast.error(`Failed to save portfolio item: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, `portfolio/${editingItem.id || 'new'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    setMessage(null);
    try {
      await deleteDoc(doc(db, "portfolio", deleteId));
      await deleteDoc(doc(db, "settings", "seo", "pages", `works-detail-${deleteId}`));

      setItems(prev => prev.filter(i => i.id !== deleteId));
      setMessage({ type: "success", text: "Portfolio item and index configurations removed successfully." });
      toast.success("Portfolio item and index configurations removed successfully.");
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting item:", error);
      setMessage({ type: "error", text: "Database constraints failed to purge item." });
      toast.error(`Error deleting item: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const snap = await getDocs(collection(db, "portfolio"));
      if (!snap.empty) {
        setMessage({ type: "error", text: "Cannot seed: Database already contains data. Clear it first." });
        toast.error("Cannot seed: Database already contains data. Clear it first.");
        setSaving(false);
        return;
      }

      for (const item of WORK_ITEMS) {
        const id = item.id || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await setDoc(doc(db, "portfolio", id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });

        // Seed basic dynamic portfolio page SEO default coordinates
        await setDoc(doc(db, "settings", "seo", "pages", `works-detail-${id}`), {
          title: item.title,
          description: item.description,
          focusKeyword: item.category,
          slug: id,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      }
      setMessage({ type: "success", text: "Default creative works catalog seeded successfully!" });
      toast.success("Default creative works catalog seeded successfully!");
      fetchItems();
    } catch (error: any) {
      console.error("Error seeding portfolio:", error);
      setMessage({ type: "error", text: "Failed to initialize standard mock coordinates." });
      toast.error(`Failed to initialize standard mock coordinates: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (editingItem) {
    /* DEDICATED FULL SCREEN PORTFOLIO CASE WORK EDIT WORKSPACE */
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
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">creative works curator studio</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white italic truncate max-w-[280px] sm:max-w-md">
                {editingItem.id ? `Editing Item: ${editingItem.title}` : "Create Portfolio Story"}
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
              <span>{saving ? "Publishing Case..." : "Save Portfolio"}</span>
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
          <div className={`p-4 rounded-xl text-xs uppercase tracking-widest text-center font-medium ${
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
                <Folder className="w-4.5 h-4.5 text-[#cfb53b]" />
                Primary Project Specifications
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Creative Project Title</label>
                  <input
                    type="text"
                    value={editingItem.title || ""}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditingItem({ ...editingItem, title: newTitle });
                      if (!isSlugCustomized) {
                        setSeoDraft(prev => ({ 
                          ...prev, 
                          slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") 
                        }));
                      }
                    }}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Traditional Wedding Royalty"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Custom URL Slug Path</label>
                    <label className="text-[10px] flex items-center gap-1.5 text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={isSlugCustomized} 
                        onChange={(e) => setIsSlugCustomized(e.target.checked)}
                        className="accent-[#cfb53b]"
                      />
                      <span>Custom Entry</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={seoDraft.slug || ""}
                    onChange={(e) => {
                      setIsSlugCustomized(true);
                      setSeoDraft({ ...seoDraft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") })
                    }}
                    disabled={!isSlugCustomized}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. traditional-wedding-royalty"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Creative Category</label>
                  <input
                    type="text"
                    list="categories"
                    value={editingItem.category || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Wedding, Portrait, Commercial"
                  />
                  <datalist id="categories">
                    <option value="Fashion" />
                    <option value="Wedding" />
                    <option value="Lifestyle" />
                    <option value="Commercial" />
                    <option value="Cinematics" />
                  </datalist>
                </div>
              </div>

              {/* Main cover images */}
              <ImagePreviewInput
                label="Primary Cover Image URL"
                value={editingItem.image || ""}
                onChange={(val) => setEditingItem({ ...editingItem, image: val })}
                placeholder="https://images.unsplash.com/photo-..."
              />

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Image Descriptive Alt Text (A11y/SEO)</label>
                <input
                  type="text"
                  value={editingItem.imageAlt || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, imageAlt: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  placeholder="Alt descriptions cover image elements..."
                />
              </div>

              {/* Project summary description */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Project Concept Description Summary</label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                  rows={4}
                  placeholder="Briefly detail visual styles and capture workflows..."
                />
              </div>

              {/* Project year, client, roles parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Production Year
                  </label>
                  <input
                    type="text"
                    value={editingItem.year || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, year: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Client Name</label>
                  <input
                    type="text"
                    value={editingItem.client || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, client: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Vogue India"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Your Role</label>
                  <input
                    type="text"
                    value={editingItem.role || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="Creative Lead"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Photographer</label>
                  <input
                    type="text"
                    value={editingItem.photographerName || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, photographerName: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. JR PHOTOGRAPHY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Location</label>
                  <input
                    type="text"
                    value={editingItem.location || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. KHARAGPUR"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Gear</label>
                  <input
                    type="text"
                    value={editingItem.gear || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, gear: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Sony A7R IV"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Status</label>
                  <input
                    type="text"
                    value={editingItem.projectStatus || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, projectStatus: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Delivered"
                  />
                </div>
              </div>

              {/* Supplemental Detail Settings */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-[10px] uppercase tracking-wider text-luxury-gold font-bold">Extra Content & Call to Action</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1">
                      About Shoot Title
                    </label>
                    <input
                      type="text"
                      value={editingItem.aboutShootTitle || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, aboutShootTitle: e.target.value })}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. A Cinematic Expression"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Behind The Scenes URL</label>
                    <input
                      type="text"
                      value={editingItem.behindTheScenesLink || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, behindTheScenesLink: e.target.value })}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. https://youtube.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">CTA Title</label>
                    <input
                      type="text"
                      value={editingItem.ctaTitle || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, ctaTitle: e.target.value })}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. Have a project in mind?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">CTA Subtitle</label>
                    <input
                      type="text"
                      value={editingItem.ctaSubtitle || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, ctaSubtitle: e.target.value })}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. LET'S CREATE SOMETHING BEAUTIFUL"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">CTA Description</label>
                  <textarea
                    value={editingItem.ctaDesc || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, ctaDesc: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none min-h-[60px]"
                    placeholder="e.g. I'm available for travel worldwide..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">CTA Button Text</label>
                  <input
                    type="text"
                    value={editingItem.ctaButtonText || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, ctaButtonText: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. GET IN TOUCH"
                  />
                </div>
              </div>

              {/* Meta lines */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-sans">Extra Technical Specs Details (One spec line per line)</label>
                <textarea
                  value={
                    Array.isArray(editingItem.details) 
                      ? editingItem.details.join('\n') 
                      : (editingItem.details || "")
                  }
                  onChange={(e) => setEditingItem({ ...editingItem, details: e.target.value as any })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 min-h-[100px] leading-relaxed resize-none"
                  placeholder="Gears: Leica M11&#10;Lenses: Apo-Summicron 50mm f/2&#10;Filters: Black Pro-Mist 1/4"
                />
              </div>

              {/* Gallery lists */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Sub-Gallery Collage Images URLs (One URL link per line)</label>
                  <textarea
                    value={
                      Array.isArray(editingItem.galleryImages) 
                        ? (editingItem.galleryImages as string[]).join('\n') 
                        : (editingItem.galleryImages || "")
                    }
                    onChange={(e) => setEditingItem({ ...editingItem, galleryImages: e.target.value as any })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 min-h-[120px] font-mono leading-relaxed"
                    placeholder="https://...&#10;https://..."
                  />
                </div>
                {editingItem.galleryImages && editingItem.galleryImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-luxury-gold/60 font-medium">Image Previews</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(Array.isArray(editingItem.galleryImages) 
                        ? (editingItem.galleryImages as string[]) 
                        : (editingItem.galleryImages as unknown as string).split('\n')).map((url, i) => {
                        const trimmedUrl = url.trim();
                        if (!trimmedUrl) return null;
                        return (
                          <div key={i} className="aspect-square bg-luxury-black/60 rounded-lg overflow-hidden border border-luxury-gold/5 relative group">
                            <img 
                              src={trimmedUrl} 
                              alt={`Preview ${i + 1}`} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Err&background=333&color=fff&size=200`;
                              }}
                            />
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[8px] text-white">
                              {i + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT Sidebar Auditing Preview Tool Column */}
          <div className="lg:col-span-6 flex flex-col h-full sticky top-8">
            <SEOAssistantPanel
              type="portfolio"
              currentTitle={editingItem.title || ""}
              currentSummary={editingItem.description || ""}
              coverImage={editingItem.image}
              imageAlt={editingItem.imageAlt}
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
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">creative masterpieces</h2>
          <p className="text-luxury-cream/40 text-sm">Manage, seed, and polish historical photographic collections and slider case stories.</p>
        </div>
        <div className="flex gap-3 self-end sm:self-center">
          <button
            onClick={() => setShowBulkUpload(true)}
            disabled={saving}
            className="px-4 py-2 bg-[#cfb53b]/20 hover:bg-[#cfb53b]/30 text-[#cfb53b] rounded-xl text-xs font-bold uppercase tracking-widest border border-[#cfb53b]/40 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
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
            <span>Add Portfolio Story</span>
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0a11] border border-white/10 max-w-lg w-full p-6 sm:p-8 rounded-3xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowBulkUpload(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
               <span className="text-[9px] uppercase font-mono tracking-widest text-[#cfb53b]">Bulk Operations</span>
               <h3 className="text-xl font-serif text-white uppercase italic">Batch Import Portfolio Media</h3>
               <p className="text-[10px] text-zinc-500">Provide a list of image URLs (one per line) or a JSON array of complete objects to import multiple portfolio drafts at once.</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Default Category</label>
                  <select
                     value={bulkCategory}
                     onChange={(e: any) => setBulkCategory(e.target.value)}
                     className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                  >
                     <option value="Fashion">Fashion</option>
                     <option value="Wedding">Wedding</option>
                     <option value="Lifestyle">Lifestyle</option>
                     <option value="Commercial">Commercial</option>
                  </select>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Image URLs or JSON Array</label>
                  <textarea
                     value={bulkUrls}
                     onChange={(e) => setBulkUrls(e.target.value)}
                     placeholder={'[\n  {\n    "title": "A Beautiful Wedding",\n    "category": "Wedding",\n    "image": "https://example.com/main.jpg",\n    "imageAlt": "Main photo",\n    "description": "Short description.",\n    "client": "John & Jane",\n    "year": "2026",\n    "role": "Lead Photographer",\n    "details": ["12 Hours", "Pre-wedding shoot"],\n    "galleryImages": ["https://example.com/1.jpg"],\n    "location": "New York",\n    "gear": "Sony A7IV",\n    "photographerName": "Supriyo S."\n  }\n]'}
                     className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 h-48 resize-none font-mono tracking-tight"
                  />
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs uppercase font-bold tracking-widest text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={saving || !bulkUrls.trim()}
                  className="flex-1 py-3 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs uppercase font-bold tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>{saving ? "Importing..." : "Run Import"}</span>
                </button>
            </div>
          </motion.div>
        </div>
      )}

      {items.length > 0 && items.filter(item => !item.imageAlt || item.imageAlt.trim() === '').length > 0 && (
        <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/15 flex items-start gap-4 text-left">
          <ShieldAlert className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold text-xs uppercase text-orange-400">Accessibility & SEO Audit Check</span>
            <p className="text-xs text-zinc-400">
              {items.filter(item => !item.imageAlt || item.imageAlt.trim() === '').length} projects in your creative catalogue are missing Alt descriptions. Provide descriptors to elevate indexability scores.
            </p>
          </div>
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

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="bg-luxury-black/40 border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden group select-none text-left relative"
            >
              <div className="absolute top-4 left-4 z-20 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-white transition-colors bg-black/40 p-1.5 rounded-lg backdrop-blur-md">
                 <GripVertical className="w-4 h-4" />
              </div>
              <div className="aspect-[16/10] bg-zinc-900 relative overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 uppercase font-mono font-bold text-xs">No Cover Image</div>
                )}
                
                {/* Float controls overlay */}
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-2 sm:p-2.5 bg-luxury-black/85 hover:bg-[#cfb53b] text-white hover:text-black rounded-xl border border-white/5 cursor-pointer backdrop-blur-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id || null)}
                    className="p-2 sm:p-2.5 bg-luxury-black/85 hover:bg-red-500 text-white rounded-xl border border-white/5 cursor-pointer backdrop-blur-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-[#cfb53b] font-bold">{item.category}</span>
                <h3 className="font-serif text-lg text-white leading-tight truncate">{item.title}</h3>
                <p className="text-xs text-zinc-500 font-mono tracking-tight">{item.client || "Independent Creation"} • {item.year}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-white/5 rounded-2xl text-zinc-500 font-medium font-sans">
              No entries logged inside Firestore. Select "Seed Defaults" context to initialize catalogs.
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
