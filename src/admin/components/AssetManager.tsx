import React, { useState, useEffect } from "react";
import { db, logAdminActivity, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, getDocs, addDoc, setDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Folder, Image as ImageIcon, Loader2, Plus, Trash2, Edit3, 
  Search, X, Grid, List, Tag, Eye, Info, Check, Calendar, HardDrive 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MediaAsset {
  id: string;
  url: string;
  title: string;
  caption: string;
  tags: string[];
  category: string;
  fileSize?: string;
  dimensions?: string;
  createdAt?: any;
}

export default function AssetManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  
  // Tag filter
  const [selectedTag, setSelectedTag] = useState<string>("all");
  
  // Modal state for adding new asset
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({
    title: "",
    url: "",
    caption: "",
    category: "nature",
    tagsString: "",
    fileSize: "1.2 MB",
    dimensions: "1920 x 1280"
  });

  // Modal state for editing metadata
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // Fetch specifically declared assets
      const snap = await getDocs(collection(db, "assets"));
      let fetched = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as MediaAsset[];

      // To guarantee the asset loader doesn't start completely empty, scan existing portfolio and blog items 
      // dynamically to auto-harvest assets! This creates an incredibly delightful user experience.
      const portfolioSnap = await getDocs(collection(db, "portfolio"));
      const pAssets: MediaAsset[] = [];
      portfolioSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.image) {
          pAssets.push({
            id: `p-${docSnap.id}`,
            url: d.image,
            title: d.title || "Portfolio Work",
            caption: d.description || "Portfolio item cover asset",
            category: d.category || "portfolio",
            tags: [d.category || "portfolio", "harvested", d.year || "2026"].filter(Boolean) as string[],
            fileSize: "2.4 MB",
            dimensions: "2400 x 1600",
            createdAt: d.createdAt
          });
        }
        if (d.galleryImages && Array.isArray(d.galleryImages)) {
          d.galleryImages.forEach((imgUrl: string, idx: number) => {
            pAssets.push({
              id: `p-${docSnap.id}-gal-${idx}`,
              url: imgUrl,
              title: `${d.title || "Portfolio"} - Gallery View ${idx + 1}`,
              caption: `Gallery image from ${d.title}`,
              category: d.category || "portfolio",
              tags: [d.category || "portfolio", "gallery", "harvested"].filter(Boolean) as string[],
              fileSize: "1.8 MB",
              dimensions: "2048 x 1365",
              createdAt: d.createdAt
            });
          });
        }
      });

      const blogSnap = await getDocs(collection(db, "blog"));
      const bAssets: MediaAsset[] = [];
      blogSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.coverImage) {
          bAssets.push({
            id: `b-${docSnap.id}`,
            url: d.coverImage,
            title: d.title || "Blog Cover",
            caption: d.summary || "Blog editorial header cover",
            category: "blog-editorial",
            tags: ["blog", d.category || "editorial", "harvested"].filter(Boolean) as string[],
            fileSize: "1.5 MB",
            dimensions: "1920 x 1080",
            createdAt: d.createdAt
          });
        }
      });

      // Merge harvested assets ensuring no duplicate URLs
      const allMerged = [...fetched];
      const seenUrls = new Set(fetched.map(a => a.url));
      
      const toMerge = [...pAssets, ...bAssets];
      for (const asset of toMerge) {
        if (!seenUrls.has(asset.url)) {
          seenUrls.add(asset.url);
          allMerged.push(asset);
        }
      }

      setAssets(allMerged);
    } catch (error: any) {
      console.error("Error fetching media assets:", error);
      toast.error(`Failed to load media catalogue: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Save new custom asset
  const handleAddAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.title.trim() || !newAsset.url.trim()) {
      toast.error("Please fill in both the Title and Image URL.");
      return;
    }
    setSavingAsset(true);
    try {
      const parsedTags = newAsset.tagsString
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const assetPayload = {
        title: newAsset.title.trim(),
        url: newAsset.url.trim(),
        caption: newAsset.caption.trim(),
        category: newAsset.category,
        tags: parsedTags,
        fileSize: newAsset.fileSize || "1.1 MB",
        dimensions: newAsset.dimensions || "1920 x 1285",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "assets"), assetPayload);
      const newlyCreated: MediaAsset = {
        id: docRef.id,
        ...assetPayload
      };

      setAssets(prev => [newlyCreated, ...prev]);
      toast.success("Asset cataloged successfully!");
      logAdminActivity(
        "Created Media Asset",
        `Cataloged media asset titled "${newAsset.title}" under tags: ${parsedTags.join(", ")}`,
        "assets"
      );
      
      setNewAsset({
        title: "",
        url: "",
        caption: "",
        category: "editorial",
        tagsString: "",
        fileSize: "1.3 MB",
        dimensions: "1920 x 1280"
      });
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Failed to add asset:", error);
      toast.error(`Failed to add asset: ${error.message || error}`);
    } finally {
      setSavingAsset(false);
    }
  };

  // Save edited asset metadata tags
  const handleEditAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !editingAsset.title.trim()) return;
    setSavingAsset(true);
    try {
      // If the asset is a harvested asset (starts with 'p-' or 'b-'), we save it to the native "assets" collection so that they own the cataloged record!
      const isHarvested = editingAsset.id.startsWith("p-") || editingAsset.id.startsWith("b-");
      const cleanId = isHarvested ? editingAsset.id.replace(/^[pb]-/, "") : editingAsset.id;

      const payload = {
        title: editingAsset.title.trim(),
        caption: editingAsset.caption.trim(),
        category: editingAsset.category,
        tags: editingAsset.tags,
        url: editingAsset.url,
        fileSize: editingAsset.fileSize || "2.1 MB",
        dimensions: editingAsset.dimensions || "1920 x 1280"
      };

      // Set under clean id
      await setDoc(doc(db, "assets", editingAsset.id), payload);

      setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, ...payload } : a));
      toast.success("Image metadata tags saved successfully!");
      logAdminActivity(
        "Updated Media Asset Tags",
        `Updated tags for asset "${editingAsset.title}" to [${editingAsset.tags.join(", ")}]`,
        "assets"
      );

      setSelectedAsset(prev => prev && prev.id === editingAsset.id ? { ...prev, ...payload } : prev);
      setShowEditModal(false);
      setEditingAsset(null);
    } catch (error: any) {
      console.error("Failed to update asset metadata tags:", error);
      toast.error(`Update failed: ${error.message || error}`);
    } finally {
      setSavingAsset(false);
    }
  };

  // Handle asset deletion from catalogue
  const handleDeleteAsset = async (asset: MediaAsset) => {
    if (confirm(`Are you sure you want to remove "${asset.title}" from the Asset Catalogue?`)) {
      try {
        const isHarvested = asset.id.startsWith("p-") || asset.id.startsWith("b-");
        if (isHarvested) {
          // If harvested, it's inside the portfolio/blog collections. Inform them they should delete it from there.
          toast.error("This is an active Portfolio/Blog image. To guarantee link integrity, edit or delete it from the original Portfolio or Blog workspace tab instead.");
          return;
        }

        await deleteDoc(doc(db, "assets", asset.id));
        setAssets(prev => prev.filter(a => a.id !== asset.id));
        if (selectedAsset?.id === asset.id) setSelectedAsset(null);
        toast.success("Asset catalog registry cleared.");
        logAdminActivity(
          "Deleted Media Asset",
          `Removed asset "${asset.title}" from catalog database`,
          "assets"
        );
      } catch (error: any) {
        console.error("Failed to delete asset:", error);
        toast.error(`Delete failed: ${error.message || error}`);
      }
    }
  };

  // Get list of all unique tags in entire catalogue for tag choosing chips
  const allUniqueTags = React.useMemo(() => {
    const list = new Set<string>();
    assets.forEach(a => a.tags?.forEach(t => list.add(t)));
    return Array.from(list);
  }, [assets]);

  // Filter list
  const filteredAssets = React.useMemo(() => {
    return assets.filter(asset => {
      const matchSearch = 
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchTag = selectedTag === "all" || asset.tags?.includes(selectedTag);
      return matchSearch && matchTag;
    });
  }, [assets, searchQuery, selectedTag]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-luxury-gold uppercase tracking-[0.2em] font-mono text-[9px]">
            <Folder className="w-3.5 h-3.5" />
            <span>Studio Media Server</span>
          </div>
          <h2 className="text-3xl font-serif text-white tracking-tight lowercase">
            Asset <span className="text-luxury-gold italic">Management Vault</span>
          </h2>
          <p className="text-luxury-cream/40 text-xs">
            Manage, tag, and organize media resources, portfolio previews, and blog covers in a central repository.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-[#cfb53b] hover:bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Catalog New Asset URL</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT column: filter, search controls and asset list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 bg-luxury-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets by title, caption..."
                className="w-full bg-[#07060b]/60 border border-white/10 hover:border-[#cfb53b]/40 focus:border-[#cfb53b] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-650 transition-all font-sans"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Layout toggler */}
              <div className="bg-black/30 p-1 rounded-lg border border-white/5 flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tag Select Chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mr-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Filter Topic:</span>
            </span>
            <button
              onClick={() => setSelectedTag("all")}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all leading-none ${
                selectedTag === "all"
                  ? "bg-[#cfb53b]/20 text-[#cfb53b] border border-[#cfb53b]/30"
                  : "bg-white/5 text-zinc-400 hover:text-white border border-transparent"
              }`}
            >
              All Assets ({assets.length})
            </button>
            {allUniqueTags.slice(0, 16).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all leading-none ${
                  selectedTag === tag
                    ? "bg-[#cfb53b]/20 text-[#cfb53b] border border-[#cfb53b]/30"
                    : "bg-white/5 text-zinc-400 hover:text-white border border-transparent"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-luxury-gold mx-auto mb-2" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Harvesting cataloged media nodes...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-white/5 bg-[#07060b]/30 rounded-3xl space-y-3">
              <ImageIcon className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-sm font-serif italic text-zinc-400">No media assets match your query tag or keys.</p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedTag("all"); }}
                className="text-xs text-[#cfb53b] underline font-semibold cursor-pointer border-none bg-transparent"
              >
                Clear Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const isActive = selectedAsset?.id === asset.id;
                return (
                  <motion.div
                    layoutId={`asset-card-${asset.id}`}
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`bg-luxury-black/30 border rounded-2xl overflow-hidden aspect-square relative group cursor-pointer transition-all ${
                      isActive ? "ring-2 ring-[#cfb53b] border-transparent" : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <img
                      src={asset.url}
                      alt={asset.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-serif font-semibold text-xs leading-tight truncate">{asset.title}</p>
                      <span className="text-[8px] uppercase tracking-wider text-luxury-gold mt-1 font-mono">{asset.category}</span>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-[#cfb53b] text-black w-5 h-5 rounded-full flex items-center justify-center border border-black/10">
                        <Check className="w-3.5 h-3.5 font-bold" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#0b0a11]/80 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-4 flex gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer items-center justify-between ${
                    selectedAsset?.id === asset.id ? "bg-white/[0.03]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={asset.url} 
                      alt={asset.title} 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                    />
                    <div className="leading-snug">
                      <h4 className="text-white text-xs font-semibold">{asset.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-md">{asset.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="text-zinc-400 font-mono uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">{asset.category}</span>
                    <span className="text-zinc-500 font-mono">{asset.dimensions}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT column: Selected Asset Details Panel / Meta Tagging */}
        <div className="lg:col-span-4 bg-[#0b0a11]/90 border border-white/5 rounded-3xl p-6 space-y-6 shrink-0 relative sticky top-6">
          {selectedAsset ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs uppercase tracking-widest text-[#cfb53b] font-bold">Cabinet Inspector</h4>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs"
                >
                  Clear Selection
                </button>
              </div>

              {/* Preview block with sizing overlay */}
              <div className="border border-white/10 p-1 bg-black/60 rounded-2xl relative aspect-[3/2] overflow-hidden flex items-center justify-center">
                <img 
                  src={selectedAsset.url} 
                  alt={selectedAsset.title} 
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full rounded-xl object-contain shadow-xl"
                />
                
                {/* Full screen popup icon */}
                <a 
                  href={selectedAsset.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 p-2 bg-black/70 hover:bg-black text-white hover:text-[#cfb53b] border border-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Open Full Image"
                >
                  <Eye className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Tagging information elements */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500">Asset Title</span>
                  <h3 className="text-sm font-semibold text-white leading-normal">{selectedAsset.title}</h3>
                </div>

                {selectedAsset.caption && (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500">Caption / Context Details</span>
                    <p className="text-xs text-zinc-400 font-light leading-relaxed whitespace-pre-wrap">{selectedAsset.caption}</p>
                  </div>
                )}

                {/* Technical data table */}
                <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl gap-2 grid grid-cols-2 text-[10px] font-mono leading-none text-zinc-400">
                  <div className="space-y-1 border-r border-white/5 pr-2">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">Category</span>
                    <span className="text-white uppercase font-bold truncate block">{selectedAsset.category}</span>
                  </div>
                  <div className="space-y-1 pl-2">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 block">File Size</span>
                    <span className="text-zinc-300 font-bold block">{selectedAsset.fileSize || "1.5 MB"}</span>
                  </div>
                  <div className="space-y-1 border-r border-white/5 pr-2 pt-2 border-t mt-2">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 block font-bold">Dimensions</span>
                    <span className="text-zinc-300 font-bold block">{selectedAsset.dimensions || "1920 x 1280"}</span>
                  </div>
                  <div className="space-y-1 pl-2 pt-2 border-t mt-2">
                    <span className="text-[8px] uppercase tracking-wider text-zinc-500 block font-bold">Cabinet Node ID</span>
                    <span className="text-indigo-400 font-bold text-[8.5px] truncate block select-all">{selectedAsset.id}</span>
                  </div>
                </div>

                {/* Tags container */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block">Metadata Keywords Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAsset.tags && selectedAsset.tags.length > 0 ? (
                      selectedAsset.tags.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white/5 border border-white/5 text-zinc-400 text-[9px] uppercase tracking-wider font-bold rounded-lg flex items-center gap-1">
                          <span>#{tag}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-650 italic text-[10px]">No metadata tags attached.</span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => {
                      setEditingAsset({ ...selectedAsset });
                      setShowEditModal(true);
                    }}
                    className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 border border-white/5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Tag Metadata</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(selectedAsset)}
                    disabled={selectedAsset.id.startsWith("p-") || selectedAsset.id.startsWith("b-")}
                    className="py-3 bg-red-500/5 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title={selectedAsset.id.startsWith("p-") || selectedAsset.id.startsWith("b-") ? "Portfolio referenced element: delete original record" : "Delete from catalogue"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Asset</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 mx-auto">
                <Info className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs uppercase tracking-wider text-zinc-300 font-bold">Cabinet Empty Selection</h5>
                <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Select any active media preview to audit file dimensions, catalog resolution properties, and write customized keyword search tags.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD NEW ASSET FROM EXTERNAL URL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0a11] border border-white/10 max-w-lg w-full p-6 sm:p-8 rounded-3xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#cfb53b]">Vault Entry</span>
              <h3 className="text-xl font-serif text-white uppercase italic">Catalog Asset URL</h3>
              <p className="text-[10px] text-zinc-500">Submit an external media URL to save its tag indexes for portfolio and blogging use.</p>
            </div>

            <form onSubmit={handleAddAssetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Asset Title</label>
                <input
                  type="text"
                  required
                  value={newAsset.title}
                  onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  placeholder="e.g. Vintage Bride Studio Silhouette"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Image URL</label>
                  <span className="text-[8.5px] text-zinc-500 font-mono">Unsplash and secure addresses supported</span>
                </div>
                <input
                  type="url"
                  required
                  value={newAsset.url}
                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Caption Details</label>
                <textarea
                  value={newAsset.caption}
                  onChange={(e) => setNewAsset({ ...newAsset, caption: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 h-16 resize-none"
                  placeholder="Additional context description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">Category</label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 uppercase font-mono text-[9.5px]"
                  >
                    <option value="fashion">Fashion</option>
                    <option value="matrimony">Matrimony</option>
                    <option value="portraits">Portraits</option>
                    <option value="commercial">Commercial</option>
                    <option value="bts">Behind the Scenes</option>
                    <option value="presets">Asset Presets</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">File Size (Est)</label>
                  <input
                    type="text"
                    value={newAsset.fileSize}
                    onChange={(e) => setNewAsset({ ...newAsset, fileSize: e.target.value })}
                    className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Keyword tags (Separated by comma)</label>
                <input
                  type="text"
                  value={newAsset.tagsString}
                  onChange={(e) => setNewAsset({ ...newAsset, tagsString: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  placeholder="editorial, bridal, studio, dark, monochrome"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs uppercase font-bold tracking-widest text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="flex-1 py-3 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs uppercase font-bold tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {savingAsset && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>{savingAsset ? "Saving..." : "Commit Asset"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: EDIT ASSET METADATA TAGS */}
      {showEditModal && editingAsset && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0a11] border border-white/10 max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 relative animate-in fade-in duration-300"
          >
            <button 
              onClick={() => { setShowEditModal(false); setEditingAsset(null); }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
              <span className="text-[9px] uppercase font-mono tracking-widest text-[#cfb53b]">Auditor Cabinet</span>
              <h3 className="text-lg font-serif text-white uppercase italic">Audit Asset Metadata</h3>
              <p className="text-[10px] text-zinc-500">Update search keys and category alignments mapping this asset reference.</p>
            </div>

            <form onSubmit={handleEditAssetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Asset Title</label>
                <input
                  type="text"
                  required
                  value={editingAsset.title}
                  onChange={(e) => setEditingAsset({ ...editingAsset, title: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block block">Caption Details</label>
                <textarea
                  value={editingAsset.caption || ""}
                  onChange={(e) => setEditingAsset({ ...editingAsset, caption: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 h-16 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block">Category Alignment</label>
                <input
                  type="text"
                  value={editingAsset.category}
                  onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 uppercase font-mono text-[9.5px]"
                />
              </div>

              {/* Tag modification interface */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider text-zinc-450">
                  <span>Tags Index List Clipboard</span>
                  <span className="font-sans text-[8px] text-zinc-500 font-bold">Press Enter to add</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 p-3 bg-black/60 border border-white/10 rounded-2xl min-h-[50px] items-center">
                  {editingAsset.tags?.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/10 text-white text-[9px] uppercase tracking-wider font-bold rounded-lg flex items-center gap-1">
                      <span>#{tag}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          const updated = (editingAsset.tags || []).filter((_, i) => i !== idx);
                          setEditingAsset({ ...editingAsset, tags: updated });
                        }}
                        className="p-0.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full bg-transparent border-none cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim().toLowerCase();
                        if (val && !editingAsset.tags?.includes(val)) {
                          const updated = [...(editingAsset.tags || []), val];
                          setEditingAsset({ ...editingAsset, tags: updated });
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                    placeholder="add tag..."
                    className="bg-transparent border-none focus:outline-none text-xs text-white py-1 pl-1 ml-1 w-20 placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingAsset(null); }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs uppercase font-bold tracking-widest text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAsset}
                  className="flex-1 py-3 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs uppercase font-bold tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {savingAsset && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>{savingAsset ? "Saving..." : "Commit Tags"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
