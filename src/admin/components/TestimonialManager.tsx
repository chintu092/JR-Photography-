import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Loader2, Plus, Edit2, Trash2, Save, X, Star, ChevronLeft, Quote, User, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Review } from "../../types";
import { REVIEWS } from "../../data";
import { getCollectionData } from "../../lib/db-client";
import ImagePreviewInput from "./ImagePreviewInput";

export default function TestimonialManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<Review> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await getCollectionData<Review>("testimonials");
      
      const sortedItems = fetchedItems.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return (a.name || "").localeCompare(b.name || "");
      });

      setItems(sortedItems);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
    
    const updatedItems = newItems.map((item, index) => ({ ...item, order: index + 1 }));
    setItems(updatedItems);
    
    try {
      await Promise.all(updatedItems.map(item => 
        setDoc(doc(db, "testimonials", item.id), { order: item.order }, { merge: true })
      ));
      toast.success("Testimonial order saved successfully.");
    } catch (error) {
       console.error("Error updating order:", error);
       toast.error("Error saving new order.");
    }
  };

  const handleEditClick = (item: Review) => {
    window.location.hash = `/admin/testimonials/edit/${item.id}`;
    setEditingItem(item);
  };

  const handleAddNewClick = () => {
    window.location.hash = `/admin/testimonials/new`;
    setEditingItem({
      name: "", role: "", company: "", comment: "", avatar: "", rating: 5
    });
  };

  const handleBackClick = () => {
    window.location.hash = `/admin/testimonials`;
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!user || !editingItem || !editingItem.name || !editingItem.comment) return;
    setSaving(true);
    setMessage(null);
    try {
      const isNew = !editingItem.id;
      const id = isNew ? editingItem.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now() : editingItem.id;
      
      const data: any = {
        name: editingItem.name || "",
        role: editingItem.role || "",
        company: editingItem.company || "",
        comment: editingItem.comment || "",
        avatar: editingItem.avatar || "",
        rating: editingItem.rating || 5,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      if (isNew) {
        data.createdAt = serverTimestamp();
      } else {
        data.createdAt = editingItem.createdAt;
      }

      await setDoc(doc(db, "testimonials", id!), data, { merge: true });
      setMessage({ type: "success", text: `Client feedback from "${data.name}" saved successfully!` });
      toast.success(`Client feedback from "${data.name}" saved successfully!`);
      setTimeout(() => {
        setEditingItem(null);
        fetchItems();
        window.location.hash = `/admin/testimonials`;
      }, 1500);
    } catch (error: any) {
      console.error("Error saving testimonial:", error);
      setMessage({ type: "error", text: "Failed to upload feedback modifications." });
      toast.error(`Failed to save feedback: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    setMessage(null);
    try {
      await deleteDoc(doc(db, "testimonials", deleteId));
      setItems(prev => prev.filter(i => i.id !== deleteId));
      setMessage({ type: "success", text: "Feedback removed successfully." });
      toast.success("Feedback removed successfully.");
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting testimonial:", error);
      setMessage({ type: "error", text: "Authority constraint failure during deletion." });
      toast.error(`Failed to delete feedback: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const snap = await getDocs(collection(db, "testimonials"));
      if (!snap.empty) {
        setMessage({ type: "error", text: "Cannot seed: Database already contains data. Clear it first." });
        toast.error("Cannot seed: Database already contains data. Clear it first.");
        setSaving(false);
        return;
      }

      for (const review of REVIEWS) {
        const { id: reviewId, ...cleanReview } = review;
        const id = reviewId || cleanReview.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await setDoc(doc(db, "testimonials", id), {
          ...cleanReview,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      }
      setMessage({ type: "success", text: "Default client feedback list seeded successfully!" });
      toast.success("Default client feedback list seeded successfully!");
      fetchItems();
    } catch (error: any) {
      console.error("Error seeding testimonials:", error);
      setMessage({ type: "error", text: "Failed to initialize standard feedback templates." });
      toast.error(`Failed to initialize standard feedback templates: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (editingItem) {
    /* DEDICATED TESTIMONIAL EDIT SCENE */
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
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">client feedback curator studio</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white italic truncate max-w-[280px] sm:max-w-md">
                {editingItem.id ? `Editing Feedback: ${editingItem.name}` : "Create Client Feedback"}
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
              <span>{saving ? "Publishing Review..." : "Save Feedback"}</span>
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

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-luxury-black/40 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6">
              <h4 className="text-xs uppercase tracking-widest text-[#cfb53b] font-bold pb-2 border-b border-white/5 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-[#cfb53b]" />
                Client Profile Identity
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Client Name</label>
                  <input
                    type="text"
                    value={editingItem.name || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Supriyo Sen"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Professional Role</label>
                  <input
                    type="text"
                    value={editingItem.role || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Groom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Company / Organization</label>
                  <input
                    type="text"
                    value={editingItem.company || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Kolkata Wedding Diarist"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Rating Experience (1 to 5 Stars)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editingItem.rating || 5}
                    onChange={(e) => setEditingItem({ ...editingItem, rating: parseInt(e.target.value) || 5 })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                  />
                </div>
              </div>

              <ImagePreviewInput
                label="Portrait Avatar Image URL"
                value={editingItem.avatar || ""}
                onChange={(val) => setEditingItem({ ...editingItem, avatar: val })}
                placeholder="https://images.unsplash.com/photo-..."
              />

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Client Review Narrative</label>
                <textarea
                  value={editingItem.comment || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, comment: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                  rows={6}
                  placeholder="Insert client story narrative detailing visual elements, shoot support structure, and overall review feedback..."
                />
              </div>

            </div>
          </div>

          {/* Right Live Card Preview Column */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-8">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">Live Component Preview</span>
            
            <div className="bg-[#0e0d16] border border-white/10 rounded-3xl p-8 relative flex flex-col justify-between h-[300px] shadow-xl text-left">
              <Quote className="absolute right-8 top-8 w-12 h-12 text-white/5 pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${
                        i < (editingItem.rating || 5) 
                          ? "text-[#cfb53b] fill-[#cfb53b]" 
                          : "text-white/10"
                      }`} 
                    />
                  ))}
                </div>
                
                <p className="text-zinc-300 text-sm italic font-sans leading-relaxed line-clamp-5">
                  "{editingItem.comment || "Configure the description details on the left form layout to watch a real time simulation build..."}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0">
                  {editingItem.avatar ? (
                    <img 
                      src={editingItem.avatar} 
                      alt={editingItem.name || "Preview Profile"} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-xs uppercase">?</div>
                  )}
                </div>

                <div>
                  <h5 className="font-serif text-sm text-white font-medium">{editingItem.name || "Client Name Placeholder"}</h5>
                  <p className="text-[10px] text-[#cfb53b] uppercase tracking-widest font-mono">
                    {editingItem.role || "Role"} {editingItem.company ? `, ${editingItem.company}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 text-left">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">client reviews</h2>
          <p className="text-luxury-cream/40 text-sm">Review, seed, and curation testimonials to provide verified structural authenticity.</p>
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
            <span>Add Testimonial</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div 
              key={item.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="bg-luxury-black/40 border border-white/5 rounded-2xl p-6 relative group text-left flex flex-col justify-between min-h-[220px]"
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
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteId(item.id!);
                  }}
                  className="p-1.5 bg-luxury-black border border-white/5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < item.rating ? "text-[#cfb53b] fill-[#cfb53b]" : "text-white/10"}`} />
                  ))}
                </div>
                <p className="text-xs text-zinc-300 italic font-sans leading-relaxed line-clamp-4">
                  "{item.comment}"
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5 mt-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="font-serif text-sm text-white font-medium">{item.name}</h3>
                  <p className="text-[9px] text-[#cfb53b] uppercase tracking-widest font-mono">
                    {item.role}{item.company ? `, ${item.company}` : ""}
                  </p>
                </div>
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
                  Are you sure you want to permanently delete client testimonial from "{items.find(i => i.id === deleteId)?.name}"? This action is irreversible.
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
