import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Save, Loader2, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import ImagePreviewInput from "./ImagePreviewInput";

export default function HeroManager() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    titleLine1: "CAPTURING",
    titleLine2: "Candid Moments.",
    badgeText: "AWARD WINNING IN KOLKATA",
    description: "JR Photography is the Best Wedding Photographer in Kolkata. We connect visionary couples with high-fidelity creators for premium, high-contrast, beautiful candid imagery and cinematic wedding films.",
    btn1Text: "Explore Portfolio",
    btn1Link: "#portfolio",
    btn2Text: "Become a client",
    btn2Link: "#contact",
    backdropSlides: [
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1600"
    ],
    column1Cards: [
      { id: "h1", img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600", name: "Taaniel Malleus", city: "Kolkata, India", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150" },
      { id: "h2", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600", name: "Alex Pastoor", city: "Berlin, Germany", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" },
      { id: "h3", img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=600", name: "Ines Garmond", city: "Paris, France", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" },
      { id: "h4", img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=600", name: "Marcus Aurel", city: "Zurich, Switzerland", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150" }
    ],
    column2Cards: [
      { id: "h5", img: "https://images.unsplash.com/photo-1510747440251-2485fc3f684e?auto=format&fit=crop&q=80&w=600", name: "Maria Sariynawa", city: "London, UK", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150" },
      { id: "h6", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600", name: "Christoph Becker", city: "Munich, Germany", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150" },
      { id: "h7", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600", name: "Amélie Dubois", city: "Paris, France", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" },
      { id: "h8", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600", name: "Dimitri Volkov", city: "New York, USA", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150" }
    ]
  });

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "hero"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData((prev) => {
            const mergedCol1 = data.column1Cards && data.column1Cards.length > 0 ? [...data.column1Cards] : prev.column1Cards;
            // merge missing cards
            prev.column1Cards.forEach((c: any) => {
              if (!mergedCol1.find((mc: any) => mc.id === c.id)) {
                mergedCol1.push(c);
              }
            });

            const mergedCol2 = data.column2Cards && data.column2Cards.length > 0 ? [...data.column2Cards] : prev.column2Cards;
            // merge missing cards
            prev.column2Cards.forEach((c: any) => {
              if (!mergedCol2.find((mc: any) => mc.id === c.id)) {
                mergedCol2.push(c);
              }
            });

            return {
              ...prev,
              ...data,
              column1Cards: mergedCol1,
              column2Cards: mergedCol2
            };
          });
        }
      } catch (error) {
        console.error("Error fetching hero settings:", error);
      } finally {
        setLoading(false);
      }
    };
    if (isAdmin) {
      fetchHero();
    }
  }, [isAdmin]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      await setDoc(doc(db, "settings", "hero"), {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      setMessage({ type: "success", text: "Hero section saved successfully!" });
      toast.success("Hero section database configuration updated!");
    } catch (error: any) {
      console.error("Error saving hero:", error);
      setMessage({ type: "error", text: "Error saving hero settings. Please check permissions." });
      toast.error(`Error saving hero settings: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBackdropChange = (idx: number, value: string) => {
    const newSlides = [...formData.backdropSlides];
    newSlides[idx] = value;
    setFormData(prev => ({ ...prev, backdropSlides: newSlides }));
  };

  const addBackdropSlide = () => {
    setFormData(prev => ({ ...prev, backdropSlides: [...prev.backdropSlides, ""] }));
  };

  const removeBackdropSlide = (idx: number) => {
    const newSlides = formData.backdropSlides.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, backdropSlides: newSlides }));
  };

  const handleCardChange = (col: "column1Cards" | "column2Cards", idx: number, field: string, value: string) => {
    const newCards = [...formData[col]];
    newCards[idx] = { ...newCards[idx], [field]: value };
    setFormData(prev => ({ ...prev, [col]: newCards }));
  };

  const addCard = (col: "column1Cards" | "column2Cards") => {
    const newId = `h${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      [col]: [...prev[col], { id: newId, img: "", name: "", city: "", avatar: "" }]
    }));
  };

  const removeCard = (col: "column1Cards" | "column2Cards", idx: number) => {
    const newCards = formData[col].filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, [col]: newCards }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
      </div>
    );
  }

  const renderCardList = (col: "column1Cards" | "column2Cards", label: string) => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-serif text-luxury-gold">{label}</h3>
        <button
          type="button"
          onClick={() => addCard(col)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a0910] border border-white/5 rounded-xl hover:border-luxury-gold/50 transition-colors text-xs text-luxury-cream"
        >
          <Plus className="w-4 h-4" /> Add Box
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formData[col].map((card, idx) => (
          <div key={idx} className="bg-[#0a0910] border border-white/5 p-6 rounded-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => removeCard(col, idx)}
              className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="space-y-2">
              <ImagePreviewInput
                label="Main Image URL"
                value={card.img}
                onChange={(val) => handleCardChange(col, idx, "img", val)}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Name</label>
              <input type="text" value={card.name} onChange={(e) => handleCardChange(col, idx, "name", e.target.value)} className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-2 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">City</label>
              <input type="text" value={card.city} onChange={(e) => handleCardChange(col, idx, "city", e.target.value)} className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-2 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
            </div>
            <div className="space-y-2">
              <ImagePreviewInput
                label="Avatar / Face Image URL"
                value={card.avatar}
                onChange={(val) => handleCardChange(col, idx, "avatar", val)}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-3xl font-serif text-luxury-gold tracking-tight">Hero Section Settings</h2>
          <p className="text-luxury-cream/40 text-sm">Manage the texts, links, images, and content of the homepage hero.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-white transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Hero Texts */}
      <div className="bg-luxury-black/40 border border-luxury-gold/10 p-8 rounded-3xl space-y-6">
        <h3 className="text-xl font-serif text-luxury-gold">Hero Typography & Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Badge Text</label>
            <input type="text" name="badgeText" value={formData.badgeText} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
          </div>
          <div className="space-y-2"></div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Headline Line 1</label>
            <input type="text" name="titleLine1" value={formData.titleLine1} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Headline Line 2</label>
            <input type="text" name="titleLine2" value={formData.titleLine2} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Description Paragraph</label>
            <textarea name="description" value={formData.description} onChange={handleTextChange} rows={3} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none resize-none" />
          </div>

          <div className="space-y-4 p-4 border border-white/5 rounded-xl">
            <h4 className="text-sm font-bold text-luxury-cream">Primary Button</h4>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Button Text</label>
              <input type="text" name="btn1Text" value={formData.btn1Text} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Button Link</label>
              <input type="text" name="btn1Link" value={formData.btn1Link} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
            </div>
          </div>

          <div className="space-y-4 p-4 border border-white/5 rounded-xl">
            <h4 className="text-sm font-bold text-luxury-cream">Secondary Button</h4>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Button Text</label>
              <input type="text" name="btn2Text" value={formData.btn2Text} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40">Button Link</label>
              <input type="text" name="btn2Link" value={formData.btn2Link} onChange={handleTextChange} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop Slides */}
      <div className="bg-luxury-black/40 border border-luxury-gold/10 p-8 rounded-3xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-serif text-luxury-gold">Background Slideshow Images</h3>
          <button type="button" onClick={addBackdropSlide} className="flex items-center gap-2 px-4 py-2 border border-white/5 rounded-xl hover:border-luxury-gold/50 transition-colors text-xs text-luxury-cream">
            <Plus className="w-4 h-4" /> Add Background
          </button>
        </div>

        <div className="space-y-6">
          {formData.backdropSlides.map((slide, idx) => (
            <div key={idx} className="bg-[#0a0910] border border-white/5 p-6 rounded-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => removeBackdropSlide(idx)}
                className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 transition-colors z-10"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <ImagePreviewInput
                label={`Slide #${idx + 1} Image URL`}
                value={slide}
                onChange={(val) => handleBackdropChange(idx, val)}
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* Column 1 Cards */}
      <div className="bg-luxury-black/40 border border-luxury-gold/10 p-8 rounded-3xl space-y-6">
        {renderCardList("column1Cards", "Column 1 Image Boxes (Scrolls Up)")}
      </div>

      {/* Column 2 Cards */}
      <div className="bg-luxury-black/40 border border-luxury-gold/10 p-8 rounded-3xl space-y-6">
        {renderCardList("column2Cards", "Column 2 Image Boxes (Scrolls Down)")}
      </div>

    </form>
  );
}
