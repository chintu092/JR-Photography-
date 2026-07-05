import React, { useState, useEffect } from "react";
import { 
  Plus, Trash2, Edit2, ChevronLeft, HelpCircle, Save, 
  GripVertical, Loader2, AlertCircle, ArrowUp, ArrowDown, Star, LayoutGrid, DollarSign, Clock, Hash, Check
} from "lucide-react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { PricingTier, PlanVariant } from "../../types";
import { PRICING_PLANS as initialPricingPlans } from "../../data";

export default function PricingManager() {
  const toast = useToast();
  const { user } = useAuth();
  const [plans, setPlans] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<Partial<PricingTier> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states representation
  const [formFeaturesText, setFormFeaturesText] = useState("");
  const [formTagsText, setFormTagsText] = useState("");

  // Plan Variant states
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newVariantDuration, setNewVariantDuration] = useState("");
  const [newVariantDescription, setNewVariantDescription] = useState("");
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "pricing_plans"));
      let plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingTier));

      // Sort plans by order, then by doc ID if order is missing
      plansData.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        return orderA - orderB;
      });
      
      // If none exist in Firestore, seed standard pricing plans from data.ts
      if (plansData.length === 0) {
        console.log("No pricing plans found in database, seeding default packages...");
        const seededList: PricingTier[] = [];
        for (let i = 0; i < initialPricingPlans.length; i++) {
          const defaultPlan = initialPricingPlans[i];
          const docId = defaultPlan.id || `p-${Date.now()}-${i}`;
          const planWithMeta: any = {
            name: defaultPlan.name,
            price: defaultPlan.price,
            description: defaultPlan.description,
            features: defaultPlan.features || [],
            highlight: defaultPlan.highlight !== undefined ? defaultPlan.highlight : false,
            tags: defaultPlan.tags || [],
            duration: i === 0 ? "3 - 4 WEEKS" : i === 1 ? "4 - 6 WEEKS" : "6 - 8 WEEKS",
            stylePreset: `p${(i % 3) + 1}`,
            order: i,
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || "system"
          };
          await setDoc(doc(db, "pricing_plans", docId), planWithMeta);
          seededList.push({ id: docId, ...planWithMeta });
        }
        plansData = seededList;
      }
      setPlans(plansData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load pricing configurations.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (plan: PricingTier) => {
    setEditingItem({
      ...plan,
      variants: plan.variants || []
    });
    setFormFeaturesText((plan.features || []).join("\n"));
    setFormTagsText((plan.tags || []).join(", "));
    // Reset variant states
    setNewVariantName("");
    setNewVariantPrice("");
    setNewVariantDuration("");
    setNewVariantDescription("");
    setEditingVariantId(null);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingItem({
      name: "",
      price: "$0",
      description: "",
      features: [],
      highlight: false,
      tags: [],
      duration: "2 - 4 WEEKS",
      stylePreset: "p1",
      active: true,
      variants: [],
      order: plans.length
    });
    setFormFeaturesText("");
    setFormTagsText("");
    // Reset variant states
    setNewVariantName("");
    setNewVariantPrice("");
    setNewVariantDuration("");
    setNewVariantDescription("");
    setEditingVariantId(null);
    setIsFormOpen(true);
  };

  const handleBackClick = () => {
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleAddOrUpdateVariant = () => {
    if (!newVariantName || !newVariantPrice || !newVariantDuration || !newVariantDescription) {
      toast.error("Please fill in all Variant options (Name, Price, Duration, Description)");
      return;
    }

    const currentVariants = editingItem?.variants || [];
    let updatedVariants: PlanVariant[] = [];

    if (editingVariantId) {
      // Update existing
      updatedVariants = currentVariants.map(v => 
        v.id === editingVariantId 
          ? { ...v, name: newVariantName, price: newVariantPrice, duration: newVariantDuration, description: newVariantDescription }
          : v
      );
      setEditingVariantId(null);
      toast.success("Variant specification updated in memory.");
    } else {
      // Add new
      const newVar: PlanVariant = {
        id: `var-${Date.now()}`,
        name: newVariantName,
        price: newVariantPrice,
        duration: newVariantDuration,
        description: newVariantDescription
      };
      updatedVariants = [...currentVariants, newVar];
      toast.success("Variant profile added to layout.");
    }

    if (editingItem) {
      setEditingItem({
        ...editingItem,
        variants: updatedVariants
      });
    }

    // Reset inputs
    setNewVariantName("");
    setNewVariantPrice("");
    setNewVariantDuration("");
    setNewVariantDescription("");
  };

  const handleEditVariant = (v: PlanVariant) => {
    setEditingVariantId(v.id);
    setNewVariantName(v.name);
    setNewVariantPrice(v.price);
    setNewVariantDuration(v.duration);
    setNewVariantDescription(v.description);
  };

  const handleDeleteVariant = (variantId: string) => {
    if (!window.confirm("Remove this variant?")) return;
    const currentVariants = editingItem?.variants || [];
    const updatedVariants = currentVariants.filter(v => v.id !== variantId);
    
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        variants: updatedVariants
      });
    }

    if (editingVariantId === variantId) {
      setEditingVariantId(null);
      setNewVariantName("");
      setNewVariantPrice("");
      setNewVariantDuration("");
      setNewVariantDescription("");
    }
    toast.success("Variant removed from plan matrix.");
  };

  const handleCreateOrUpdate = async () => {
    if (!editingItem?.name || !editingItem?.price || !editingItem?.description) {
      setError("Please fill out all required fields (Name, Price, Description).");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // Parse multi-line features
      const features = formFeaturesText
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Parse comma-separated tags
      const tags = formTagsText
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const payload: any = {
        name: editingItem.name,
        price: editingItem.price,
        description: editingItem.description,
        features: features,
        highlight: editingItem.highlight || false,
        tags: tags,
        duration: editingItem.duration || "2 - 4 WEEKS",
        stylePreset: editingItem.stylePreset || "p1",
        active: editingItem.active !== false,
        variants: editingItem.variants || [],
        order: editingItem.order !== undefined ? editingItem.order : plans.length,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || "system"
      };

      const planId = editingItem.id || `p-${Date.now()}`;
      if (!editingItem.id) {
        payload.createdAt = serverTimestamp();
      }

      await setDoc(doc(db, "pricing_plans", planId), payload, { merge: true });

      // Refresh list
      await fetchPricingPlans();
      
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success("Package configuration synchronized successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to commit package adjustments.");
      toast.error(err.message || "Failed to save package.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this pricing package? This will impact the frontend billing matrices.")) return;
    try {
      await deleteDoc(doc(db, "pricing_plans", planId));
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success("Package deleted successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete pricing package.");
    }
  };

  const moveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= plans.length) return;

    const reordered = [...plans];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Update orders
    const updatedPlans = reordered.map((plan, idx) => ({
      ...plan,
      order: idx
    }));

    setPlans(updatedPlans);

    try {
      for (const plan of updatedPlans) {
        await updateDoc(doc(db, "pricing_plans", plan.id), {
          order: plan.order
        });
      }
      toast.success("Presentation hierarchy reordered.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save reordered hierarchy.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-luxury-gold">
        <Loader2 className="w-9 h-9 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto text-left">
      
      {/* Header layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">Invoicing & Dynamic Collateral Matrix</span>
          <h2 className="text-3xl font-serif text-white italic">pricing & investments packages</h2>
          <p className="text-xs text-zinc-400 mt-1">Configure client premium plans, rate deposits, highlight vectors and checklist specs dynamically.</p>
        </div>
        
        {!isFormOpen && (
          <button
            onClick={handleAddNewClick}
            className="inline-flex items-center space-x-2 bg-[#cfb53b] text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isFormOpen ? (
        <div className="bg-luxury-black/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <button
              onClick={handleBackClick}
              className="p-2 bg-white/5 hover:bg-[#cfb53b] hover:text-black rounded-lg border border-white/5 text-zinc-400 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-[#cfb53b] font-mono">Dynamic Plan Editor</span>
              <h3 className="text-xl font-serif text-white italic">
                {editingItem?.id ? `Edit Package: ${editingItem.name}` : "Create Dynamic Investment Plan"}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-500" />
                Package Name
              </label>
              <input
                type="text"
                value={editingItem?.name || ""}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 animate-none"
                placeholder="e.g. Legacy Masterclass"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                Display Pricing Value
              </label>
              <input
                type="text"
                value={editingItem?.price || ""}
                onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 animate-none"
                placeholder="e.g. $9,500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Package Brief Description</label>
              <textarea
                value={editingItem?.description || ""}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                rows={3}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                placeholder="Brief value proposition and visual scope briefing statement..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center justify-between">
                <span>Core Deliverables checklist (One per line)</span>
                <span className="text-[9px] text-[#cfb53b] normal-case">Supports rich listing details</span>
              </label>
              <textarea
                value={formFeaturesText}
                onChange={(e) => setFormFeaturesText(e.target.value)}
                rows={5}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-sans leading-relaxed"
                placeholder="e.g.&#10;Up to 2 days worldwide coverage&#10;Headed by Lead Photographer&#10;80 expertly graded plates&#10;Fully sound-designed film clip"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Tags / Categories (Comma separated)</label>
              <input
                type="text"
                value={formTagsText}
                onChange={(e) => setFormTagsText(e.target.value)}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                placeholder="e.g. Destination Weddings, Milestones, Private Estates"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Estimated Delivery Frame
              </label>
              <input
                type="text"
                value={editingItem?.duration || ""}
                onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                placeholder="e.g. 4 - 6 WEEKS"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Background Style Theme</label>
              <select
                value={editingItem?.stylePreset || "p1"}
                onChange={(e) => setEditingItem({ ...editingItem, stylePreset: e.target.value as any })}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 cursor-pointer"
              >
                <option value="p1">Elite (Premium Black Gradient)</option>
                <option value="p2">Royal Bronze (Cozy Warm Sunset Theme)</option>
                <option value="p3">Couture Diamond (Sleek Dark Teal Theme)</option>
              </select>
            </div>

            {/* Dynamic Plan Variants (Optional Events / Package Tiers) */}
            <div className="md:col-span-2 border-y border-white/5 py-8 my-4 space-y-6 text-left">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">CUSTOM PLAN VARIANTS</span>
                <h4 className="text-lg font-serif text-white italic mt-1">Event Types & Package Variations</h4>
                <p className="text-xs text-zinc-400 mt-1">Add specific variants with distinct rate adjustments, delivery frames, and customized itemized descriptions.</p>
              </div>

              {/* Grid of existing variants of the currently edited plan */}
              {(editingItem?.variants || []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(editingItem?.variants || []).map((variant) => (
                    <div 
                      key={variant.id}
                      className="bg-[#0b0a12] border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-sans font-bold text-sm text-white">{variant.name}</h5>
                          <span className="text-xs font-mono font-bold text-[#cfb53b] bg-white/5 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">
                            {variant.price}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">Delivery: {variant.duration}</p>
                        <p className="text-xs text-zinc-400 font-light mt-1.5 line-clamp-2 leading-relaxed">{variant.description}</p>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleEditVariant(variant)}
                          className="text-xs text-zinc-400 hover:text-[#cfb53b] transition-colors inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="text-xs text-zinc-400 hover:text-red-400 transition-colors inline-flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-zinc-950/20 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-xs text-zinc-500 font-light">No variation plans set for this package. It will fall back to its global standard rate and criteria.</p>
                </div>
              )}

              {/* Inline input form box to configure/add/update variants */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
                <span className="text-[9px] uppercase tracking-wider text-[#cfb53b] font-mono block">
                  {editingVariantId ? "⚡ UPDATE SELECTED VARIATION" : "✨ ATTACH NEW VARIATION OPTION"}
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Variation/Event Name</label>
                    <input
                      type="text"
                      value={newVariantName}
                      onChange={(e) => setNewVariantName(e.target.value)}
                      className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. Rice Ceremony"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Variant Price</label>
                    <input
                      type="text"
                      value={newVariantPrice}
                      onChange={(e) => setNewVariantPrice(e.target.value)}
                      className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. ₹15,000"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Delivery Timeframe</label>
                    <input
                      type="text"
                      value={newVariantDuration}
                      onChange={(e) => setNewVariantDuration(e.target.value)}
                      className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                      placeholder="e.g. 7 Days"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Custom Description / Services Details</label>
                    <textarea
                      value={newVariantDescription}
                      onChange={(e) => setNewVariantDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0e0d16] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                      placeholder="e.g. 1 Photographer, 4 Hours Coverage, 100 Edited Photos, Online Gallery"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingVariantId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVariantId(null);
                        setNewVariantName("");
                        setNewVariantPrice("");
                        setNewVariantDuration("");
                        setNewVariantDescription("");
                      }}
                      className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#cfb53b] hover:text-white font-mono rounded-lg hover:bg-white/5 bg-transparent border border-white/5 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddOrUpdateVariant}
                    className="inline-flex items-center gap-1.5 bg-[#cfb53b] text-black px-5 py-2 rounded-xl font-bold uppercase tracking-widest text-[9.5px] hover:bg-white transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-black" />
                    <span>{editingVariantId ? "Update Option" : "Add Option Under Plan"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 justify-center pt-4 sm:pt-8 md:col-span-2 sm:flex-row sm:items-center">
              <label className="flex items-center space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editingItem?.highlight || false}
                  onChange={(e) => setEditingItem({ ...editingItem, highlight: e.target.checked })}
                  className="w-4.5 h-4.5 rounded text-[#cfb53b] focus:ring-[#cfb53b] bg-black border-zinc-700 cursor-pointer"
                />
                <span className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-1.5">
                  <Star className="w-4.5 h-4.5 text-[#cfb53b] fill-[#cfb53b]/20" />
                  Mark as Preferred (Highlighted Card UI)
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer select-none sm:ml-8">
                <input
                  type="checkbox"
                  checked={editingItem?.active !== false}
                  onChange={(e) => setEditingItem({ ...editingItem, active: e.target.checked })}
                  className="w-4.5 h-4.5 rounded text-[#cfb53b] focus:ring-[#cfb53b] bg-black border-zinc-700 cursor-pointer"
                />
                <span className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-1.5">
                  <Check className="w-4.5 h-4.5 text-[#cfb53b]" />
                  Active Status (Visible to Customers)
                </span>
              </label>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
            <button
              onClick={handleBackClick}
              className="px-5 py-3 text-xs text-zinc-400 hover:text-white font-bold uppercase tracking-widest rounded-xl bg-white/5 transition-all cursor-pointer"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateOrUpdate}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#cfb53b] hover:bg-white text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-black" />
                  <span>Save Plan Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan, index) => (
            <div 
              key={plan.id}
              className={`border rounded-2xl p-6 group hover:border-[#cfb53b]/20 transition-all text-left flex gap-4 items-center justify-between ${
                plan.active === false 
                  ? "bg-zinc-950/20 border-red-950/40 opacity-70" 
                  : "bg-luxury-black/40 border-white/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => moveOrder(index, "up")}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === plans.length - 1}
                    onClick={() => moveOrder(index, "down")}
                    className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-serif text-lg text-white leading-snug font-bold">{plan.name}</h4>
                    <span className="text-xs text-[#cfb53b] font-mono px-2 py-0.5 border border-[#cfb53b]/20 rounded-full font-bold">
                      {plan.price}
                    </span>
                    {plan.highlight && (
                      <span className="text-[8px] bg-amber-400/10 text-amber-400 font-mono tracking-widest uppercase px-2 py-0.5 rounded border border-amber-400/20 font-bold">
                        Preferred
                      </span>
                    )}
                    {plan.active === false && (
                      <span className="text-[8px] bg-red-400/10 text-red-400 font-mono tracking-widest uppercase px-2 py-0.5 rounded border border-red-500/20 font-bold">
                        Hidden / Inactive
                      </span>
                    )}
                    {plan.active !== false && (
                      <span className="text-[8px] bg-emerald-400/10 text-emerald-400 font-mono tracking-widest uppercase px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed font-light">{plan.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {(plan.tags || []).map((t, idx) => (
                      <span key={idx} className="text-[7.5px] bg-zinc-800/60 text-zinc-400 font-mono tracking-wider px-1.5 py-0.5 rounded uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditClick(plan)}
                  className="p-2.5 text-zinc-400 hover:text-[#cfb53b] hover:bg-white/5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Edit Plan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="p-2.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                  title="Delete Plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="text-center py-20 bg-luxury-black/30 border border-white/5 rounded-3xl">
              <p className="text-zinc-500 font-light text-xs font-mono">No pricing package plans configured.</p>
              <button
                onClick={handleAddNewClick}
                className="mt-4 text-[#cfb53b] uppercase tracking-widest text-[9px] font-bold hover:text-white underline decoration-[#cfb53b]/30 underline-offset-4 cursor-pointer"
              >
                Assemble the first package
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
