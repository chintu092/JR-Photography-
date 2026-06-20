import { useState, useEffect } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "../../context/ToastContext";
import { Loader2, Save, Type, Link as LinkIcon, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import ImagePreviewInput from "./ImagePreviewInput";

export default function CommunitySettingsManager() {
  const toast = useToast();
  const [data, setData] = useState({
    titleHeader: "",
    subtitleHeader: "",
    body: "",
    joinLink: "",
    backgroundImage: "",
    imageURL: "",
    features: [
        "Exclusive artistic access",
        "Premium campaign behind-the-scenes",
        "Private gallery previews & announcements"
    ]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "community");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data() as any);
        } else {
          const defaults = {
            titleHeader: "Stay connected.",
            subtitleHeader: "Engage with our art.",
            body: "Join our official Facebook page to stay updated with our latest collections, exclusive behind-the-scenes content, and a community of photography enthusiasts. From Kolkata to destinations worldwide, be part of our journey.",
            joinLink: "https://www.facebook.com/share/1Bf4XdWk9p/",
            backgroundImage: "https://images.unsplash.com/photo-1549064492-c416b7418968?auto=format&fit=crop&q=80&w=800",
            imageURL: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=250",
            features: [
                "Exclusive artistic access",
                "Premium campaign behind-the-scenes",
                "Private gallery previews & announcements"
            ]
          };
          setData(defaults);
          try {
            await setDoc(docRef, { ...defaults, updatedAt: serverTimestamp(), updatedBy: "system" });
          } catch(e) {
            console.error("Error preloading defaults", e);
          }
        }
      } catch (error) {
        console.error("Error fetching community settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...data.features];
    newFeatures[index] = value;
    setData({ ...data, features: newFeatures });
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
        setMessage({ type: "error", text: "You must be logged in to save." });
        toast.error("You must be logged in to save.");
        return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, "settings", "community"), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser.uid,
      });
      setMessage({ type: "success", text: "Community settings updated!" });
      toast.success("Community settings updated successfully!");
    } catch (error: any) {
      console.error("Error saving community settings:", error);
      setMessage({ type: "error", text: "Failed to save settings: " + (error as any).message });
      toast.error(`Failed to save settings: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="w-8 h-8 animate-spin text-luxury-gold mx-auto" />;

  return (
    <section className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">community management</h2>
        <p className="text-luxury-cream/40 text-xs sm:text-sm">Manage the 'Stay connected' section visibility and content.</p>
      </div>

      <div className="bg-luxury-black/40 border border-luxury-gold/10 p-6 sm:p-10 rounded-2xl sm:rounded-3xl space-y-6 sm:space-y-8 backdrop-blur-sm">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
                <Type className="w-4 h-4" /> Title Header
            </label>
            <input
                type="text"
                value={data.titleHeader ?? ""}
                onChange={(e) => setData({ ...data, titleHeader: e.target.value })}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all placeholder:text-luxury-cream/20 font-sans"
            />
            </div>
            <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
                <Type className="w-4 h-4" /> Subtitle Header
            </label>
            <input
                type="text"
                value={data.subtitleHeader ?? ""}
                onChange={(e) => setData({ ...data, subtitleHeader: e.target.value })}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all placeholder:text-luxury-cream/20 font-sans"
            />
            </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
            <MessageSquare className="w-4 h-4" /> Body Text
          </label>
          <textarea
            value={data.body ?? ""}
            onChange={(e) => setData({ ...data, body: e.target.value })}
            rows={4}
            className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all placeholder:text-luxury-cream/20 font-sans"
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
            <LinkIcon className="w-4 h-4" /> Join Link (Facebook)
          </label>
          <input
            type="url"
            value={data.joinLink ?? ""}
            onChange={(e) => setData({ ...data, joinLink: e.target.value })}
            className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all placeholder:text-luxury-cream/20 font-sans"
          />
        </div>

        <ImagePreviewInput
          label="Background Image URL"
          value={data.backgroundImage ?? ""}
          onChange={(val) => setData({ ...data, backgroundImage: val })}
          placeholder="https://images.unsplash.com/photo-..."
        />

        <ImagePreviewInput
          label="Avatar Image URL"
          value={data.imageURL ?? ""}
          onChange={(val) => setData({ ...data, imageURL: val })}
          placeholder="https://images.unsplash.com/photo-..."
        />

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
            <Type className="w-4 h-4" /> Feature Highlights
          </label>
          { (data.features || []).map((feature, index) => (
            <input
                key={index}
                type="text"
                value={feature ?? ""}
                onChange={(e) => handleFeatureChange(index, e.target.value)}
                className="w-full bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all placeholder:text-luxury-cream/20 font-sans"
                placeholder={`Feature ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-luxury-gold text-luxury-black py-5 rounded-2xl font-semibold uppercase tracking-[0.3em] text-xs hover:bg-luxury-cream transition-all duration-500 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "synchronizing..." : "commit changes"}
        </button>

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
      </div>
    </section>
  );
}
