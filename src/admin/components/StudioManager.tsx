import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Loader2, Save, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { StudioSettings } from "../../types";

export default function StudioManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState<Partial<StudioSettings>>({
    city: "KOLKATA STUDIO",
    address: "Kolkata, West Bengal, India",
    phone: "+91 98300 00000",
    hours: "10:00 - 18:00 IST",
    lat: 22.5726,
    lng: 88.3639
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "studio");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as StudioSettings);
        }
      } catch (error: any) {
        if (error?.message && error.message.includes("offline")) {
          console.warn("Studio settings offline, using defaults.");
        } else {
          console.error("Error fetching studio settings:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      if (!settings.city || !settings.address || !settings.phone || !settings.hours || settings.lat === undefined || settings.lng === undefined) {
        throw new Error("Please fill out all required fields.");
      }

      await setDoc(doc(db, "settings", "studio"), {
        ...settings,
        lat: Number(settings.lat),
        lng: Number(settings.lng),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      }, { merge: true });

      setMessage({ type: "success", text: "Studio location successfully updated!" });
      toast.success("Studio location successfully updated!");
    } catch (error: any) {
      console.error("Error saving studio settings:", error);
      setMessage({ type: "error", text: error.message || "Failed to update studio location." });
      toast.error(error.message || "Failed to update studio location.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
      </div>
    );
  }

  return (
    <section className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto block">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">Studio Location</h2>
        <p className="text-luxury-cream/40 text-xs sm:text-sm">Manage contact details and map coordinates for your primary studio.</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl text-center text-xs uppercase tracking-widest font-medium ${
            message.type === "success" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="bg-luxury-charcoal/50 border border-luxury-gold/10 rounded-3xl p-6 sm:p-8 space-y-8">
        
        <div className="space-y-4">
          <h3 className="text-sm font-display text-luxury-cream uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-luxury-gold" />
            General Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium block">Studio Name / City *</label>
              <input
                type="text"
                value={settings.city || ""}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40"
                placeholder="e.g. PARIS RESIDENCE"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium block">Phone Number *</label>
              <input
                type="text"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40"
                placeholder="e.g. +33 (0) 1 53 43 80 00"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium block">Full Address *</label>
            <input
              type="text"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40"
              placeholder="e.g. 14 Rue de la Paix, 75002 Paris, France"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium block">Business Hours *</label>
            <input
              type="text"
              value={settings.hours || ""}
              onChange={(e) => setSettings({ ...settings, hours: e.target.value })}
              className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40"
              placeholder="e.g. 10:00 - 18:00 CEST"
            />
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/5">
          <h3 className="text-sm font-display text-luxury-cream uppercase tracking-widest flex items-center gap-2">
            Map Coordinates
          </h3>
          <p className="text-xs text-luxury-cream/40">These coordinates are used for the radar scan visualization on the contact page.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium block">Latitude *</label>
              <input
                type="number"
                step="any"
                value={settings.lat || ""}
                onChange={(e) => setSettings({ ...settings, lat: parseFloat(e.target.value) })}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream text-mono focus:outline-none focus:border-luxury-gold/40"
                placeholder="e.g. 48.8688"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium block">Longitude *</label>
              <input
                type="number"
                step="any"
                value={settings.lng || ""}
                onChange={(e) => setSettings({ ...settings, lng: parseFloat(e.target.value) })}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream text-mono focus:outline-none focus:border-luxury-gold/40"
                placeholder="e.g. 2.3312"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-luxury-gold text-luxury-black hover:bg-white font-display font-bold text-xs tracking-widest uppercase rounded-xl transition-all flex items-center justify-center space-x-3 mt-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? "SAVING STUDIO..." : "SAVE STUDIO LOCATION"}</span>
        </button>

      </div>
    </section>
  );
}
