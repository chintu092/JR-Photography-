import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { motion } from "motion/react";
import { Palette, Save, Loader2, RotateCcw, ShieldCheck } from "lucide-react";

const DEFAULT_THEME = {
  gold: "#B7BE43",
  black: "#0C0F0A",
  cream: "#E9E9E7",
  gray: "#999F94",
};

export default function ThemeSettings() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [colors, setColors] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Apply colors to root for instant local feedback
  const applyColorsLocally = (newColors: typeof DEFAULT_THEME) => {
    const root = document.documentElement;
    root.style.setProperty('--luxury-gold', newColors.gold);
    root.style.setProperty('--luxury-black', newColors.black);
    root.style.setProperty('--luxury-cream', newColors.cream);
    root.style.setProperty('--luxury-gray', newColors.gray);
    root.style.backgroundColor = newColors.black;
  };

  useEffect(() => {
    async function fetchTheme() {
      if (isAdmin) {
        try {
          const themeDoc = await getDoc(doc(db, "settings", "theme"));
          if (themeDoc.exists()) {
            const data = themeDoc.data() as typeof DEFAULT_THEME;
            setColors(data);
            applyColorsLocally(data);
          }
        } catch (error) {
          console.error("Error fetching theme:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchTheme();
  }, [isAdmin]);

  // Debounced save to Firestore
  useEffect(() => {
    if (!user || loading) return;

    const timeout = setTimeout(async () => {
       try {
         await setDoc(doc(db, "settings", "theme"), {
           ...colors,
           updatedAt: serverTimestamp(),
           updatedBy: user.uid,
         });
         console.log("Theme synced to Firestore");
         toast.success("Visual theme synced and updated successfully!");
       } catch (error: any) {
         console.error("Error auto-saving theme:", error);
         toast.error(`Auto-save: Failed to sync visual theme: ${error.message || error}`);
       }
     }, 1000); // 1 second debounce

    return () => clearTimeout(timeout);
  }, [colors, user, loading]);

  const handleColorChange = (key: keyof typeof DEFAULT_THEME, value: string) => {
    const newColors = { ...colors, [key]: value.toUpperCase() };
    setColors(newColors);
    applyColorsLocally(newColors);
  };

  const resetToDefault = () => {
    setColors(DEFAULT_THEME);
    applyColorsLocally(DEFAULT_THEME);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold/20" />
      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">visual identity</h2>
          <p className="text-luxury-cream/40 text-sm">Define the core color palette of your digital studio atmosphere.</p>
        </div>
        <button 
          onClick={resetToDefault}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-luxury-cream/30 hover:text-luxury-gold transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Defaults
        </button>
      </div>

      <div className="bg-luxury-black/40 border border-luxury-gold/10 p-6 sm:p-10 rounded-2xl sm:rounded-3xl space-y-12 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          {/* Gold Accent */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
              Primary Accent (Gold)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colors.gold}
                onChange={(e) => handleColorChange("gold", e.target.value)}
                className="w-16 h-16 rounded-xl bg-luxury-black border border-luxury-gold/10 cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={colors.gold}
                onChange={(e) => handleColorChange("gold", e.target.value)}
                className="flex-1 bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 font-mono uppercase"
              />
            </div>
          </div>

          {/* Background */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
              Deep Background (Black)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colors.black}
                onChange={(e) => handleColorChange("black", e.target.value)}
                className="w-16 h-16 rounded-xl bg-luxury-black border border-luxury-gold/10 cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={colors.black}
                onChange={(e) => handleColorChange("black", e.target.value)}
                className="flex-1 bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 font-mono uppercase"
              />
            </div>
          </div>

          {/* High Contrast Text */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
              Primary Text (Cream)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colors.cream}
                onChange={(e) => handleColorChange("cream", e.target.value)}
                className="w-16 h-16 rounded-xl bg-luxury-black border border-luxury-gold/10 cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={colors.cream}
                onChange={(e) => handleColorChange("cream", e.target.value)}
                className="flex-1 bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 font-mono uppercase"
              />
            </div>
          </div>

          {/* Secondary UI Color */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
              Secondary Accents (Gray)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colors.gray}
                onChange={(e) => handleColorChange("gray", e.target.value)}
                className="w-16 h-16 rounded-xl bg-luxury-black border border-luxury-gold/10 cursor-pointer overflow-hidden p-0"
              />
              <input
                type="text"
                value={colors.gray}
                onChange={(e) => handleColorChange("gray", e.target.value)}
                className="flex-1 bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Sample */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-widest text-luxury-cream/30">Interface Simulation</label>
          <div 
            className="w-full p-8 rounded-2xl sm:rounded-3xl border border-luxury-gold/5 space-y-6"
            style={{ backgroundColor: colors.black }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div 
                  className="font-serif italic text-2xl lowercase tracking-tight"
                  style={{ color: colors.gold }}
                >
                  brand signature
                </div>
                <div 
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: colors.gray }}
                >
                  Atmospheric Simulation
                </div>
              </div>
              <div 
                className="px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold"
                style={{ backgroundColor: colors.gold, color: colors.black }}
              >
                Sample Action
              </div>
            </div>
            <p 
              className="font-light text-sm leading-relaxed"
              style={{ color: colors.cream }}
            >
              This preview demonstrates how your selected palette interacts within the studio's layout modules.
            </p>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-luxury-gold animate-pulse">
            <ShieldCheck className="w-3 h-3" />
            live syncing enabled
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-center text-[10px] uppercase tracking-widest font-medium ${
                message.type === "success" 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
