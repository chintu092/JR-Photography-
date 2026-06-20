import React, { useState, useEffect } from "react";
import { Copy, Plus, Trash2, Edit2, CheckCircle2, X, AlertCircle, Loader2, ChevronLeft, HelpCircle, Save, GripVertical } from "lucide-react";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { FaqItem } from "../../types";
import { FAQS as initialFaqs } from "../../data";

interface FAQPageData {
  id: string; // The page ID (e.g. "home", "about", "services", "contact")
  title: string; // "Home Page FAQs"
  faqs: FaqItem[];
}

const PAGE_OPTIONS = [
  { id: "home", label: "Home Page" },
  { id: "about", label: "About Page" },
  { id: "services", label: "Services Page" },
  { id: "contact", label: "Contact Page" },
];

export default function FAQManager() {
  const toast = useToast();
  const [pages, setPages] = useState<FAQPageData[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<Partial<FaqItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchFaqPages();
  }, []);

  const fetchFaqPages = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "faq_pages"));
      let pagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQPageData));
      
      // If none, preload default
      if (pagesData.length === 0) {
        console.log("No FAQ pages found, preloading defaults...");
        for (const page of PAGE_OPTIONS) {
          const docRef = doc(db, "faq_pages", page.id);
          const defaultData: any = {
            title: page.label,
            faqs: page.id === "home" ? initialFaqs : [] // Only preload into home by default
          };
          await setDoc(docRef, defaultData);
          pagesData.push({ id: page.id, ...defaultData });
        }
      }
      setPages(pagesData);
    } catch (err: any) {
      setError(err.message || "Failed to load FAQs");
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

    const pageIndex = pages.findIndex(p => p.id === selectedPageId);
    if (pageIndex === -1) return;

    const pageData = { ...pages[pageIndex] };
    const faqsList = [...(pageData.faqs || [])];
    
    const [draggedItem] = faqsList.splice(dragIndex, 1);
    faqsList.splice(dropIndex, 0, draggedItem);

    const newPages = [...pages];
    newPages[pageIndex].faqs = faqsList;
    setPages(newPages);

    try {
      await updateDoc(doc(db, "faq_pages", selectedPageId), { faqs: faqsList });
      toast.success("Order saved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save reordering.");
    }
  };

  const handleEditClick = (faq: FaqItem) => {
    window.location.hash = `/admin/faq/edit/${faq.id}`;
    setEditingItem(faq);
    setIsFormOpen(true);
  };


  const handleAddNewClick = () => {
    window.location.hash = `/admin/faq/new`;
    setEditingItem({ question: "", answer: "" });
    setIsFormOpen(true);
  };

  const handleBackClick = () => {
    window.location.hash = `/admin/faq`;
    setEditingItem(null);
    setIsFormOpen(false);
  };

  const handleCreateOrUpdate = async () => {
    if (!editingItem?.question || !editingItem?.answer) {
      setError("Please fill out all required fields.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const pageIndex = pages.findIndex(p => p.id === selectedPageId);
      if (pageIndex === -1) throw new Error("Selected page not found");

      const pageData = { ...pages[pageIndex] };
      const faqsList = [...(pageData.faqs || [])];

      if (editingItem.id) {
        // Update
        const idx = faqsList.findIndex(f => f.id === editingItem.id);
        if (idx !== -1) {
          faqsList[idx] = editingItem as FaqItem;
        }
      } else {
        // Create
        faqsList.push({
          id: `f-${Date.now()}`,
          question: editingItem.question,
          answer: editingItem.answer,
        });
      }

      await updateDoc(doc(db, "faq_pages", selectedPageId), { faqs: faqsList });
      
      const newPages = [...pages];
      newPages[pageIndex].faqs = faqsList;
      setPages(newPages);
      
      setIsFormOpen(false);
      setEditingItem(null);
      toast.success("FAQ item saved successfully!");
      window.location.hash = `/admin/faq`;
    } catch (err: any) {
      setError(err.message || "Failed to save FAQ.");
      toast.error(err.message || "Failed to save FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this question?")) return;
    try {
      const pageIndex = pages.findIndex(p => p.id === selectedPageId);
      if (pageIndex === -1) return;

      const pageData = { ...pages[pageIndex] };
      const faqsList = (pageData.faqs || []).filter(f => f.id !== faqId);

      await updateDoc(doc(db, "faq_pages", selectedPageId), { faqs: faqsList });
      
      const newPages = [...pages];
      newPages[pageIndex].faqs = faqsList;
      setPages(newPages);
      toast.success("FAQ item deleted successfully!");
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete FAQ.");
      toast.error("Failed to delete FAQ.");
    }
  };

  // Find the selected page data
  const currentPageData = pages.find(p => p.id === selectedPageId);
  const currentFaqs = currentPageData?.faqs || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-luxury-gold">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto text-left">
      
      {/* Back & header layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">customer assistance knowledge base</span>
          <h2 className="text-3xl font-serif text-white italic">faq content strategy</h2>
          <p className="text-xs text-zinc-400 mt-1">Manage interactive and transactional FAQs contextually for search spiders.</p>
        </div>
        
        {!isFormOpen && (
          <button
            onClick={handleAddNewClick}
            className="inline-flex items-center space-x-2 bg-[#cfb53b] text-black px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white transition-all cursor-pointer shadow-lg active:scale-95 self-end sm:self-center"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Add FAQ to Page</span>
          </button>
        )}
      </div>

      {!isFormOpen && (
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto select-none">
          {PAGE_OPTIONS.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`px-5 py-3 text-xs uppercase tracking-widest font-mono transition-all rounded-lg whitespace-nowrap cursor-pointer ${
                selectedPageId === page.id 
                ? "bg-white/5 text-[#cfb53b] font-bold border border-white/10" 
                : "text-zinc-400 hover:text-white"
              }`}
            >
              {page.label}
            </button>
          ))}
        </div>
      )}

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
              <span className="text-[9px] uppercase tracking-wider text-[#cfb53b] font-mono">Curator workspace</span>
              <h3 className="text-xl font-serif text-white italic">
                {editingItem?.id ? "Modify FAQ Question" : `Create FAQ for ${PAGE_OPTIONS.find(p => p.id === selectedPageId)?.label}`}
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-zinc-500" />
                Inquiry Question
              </label>
              <input
                type="text"
                value={editingItem?.question || ""}
                onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                placeholder="e.g. Do you support high speed dynamic synchronization?"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Comprehensive Answer Narrative</label>
              <textarea
                value={editingItem?.answer || ""}
                onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })}
                rows={6}
                className="w-full bg-[#0e0d16] border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                placeholder="Detailed technical or policy response transparent to web customers..."
              />
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-black" />
                    <span>Save Question</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {currentFaqs.length === 0 ? (
            <div className="text-center py-20 bg-luxury-black/30 border border-white/5 rounded-3xl">
              <p className="text-zinc-500 font-light text-xs font-mono">No FAQs exist for this page context yet.</p>
              <button
                onClick={handleAddNewClick}
                className="mt-4 text-[#cfb53b] uppercase tracking-widest text-[9px] font-bold hover:text-white underline decoration-[#cfb53b]/30 underline-offset-4 cursor-pointer"
              >
                Create the first one
              </button>
            </div>
          ) : (
            currentFaqs.map((faq, index) => (
              <div 
                key={faq.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="bg-luxury-black/40 border border-white/5 rounded-2xl p-6 group hover:border-[#cfb53b]/20 transition-all text-left flex gap-4 items-start"
              >
                <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-white transition-colors mt-1">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex items-start justify-between gap-6 flex-grow">
                  <div className="space-y-2 flex-grow">
                    <h4 className="font-serif text-lg text-white leading-snug">{faq.question}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light font-sans">{faq.answer}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditClick(faq)}
                      className="p-2 text-zinc-400 hover:text-[#cfb53b] hover:bg-white/5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
