import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_ITEMS = [
  "FINE ART WEDDINGS",
  "EDITORIAL ESSENCE",
  "LUXURY STORYTELLING",
  "CINEMATIC CAPTURES"
];

export default function Marquee() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);

  useEffect(() => {
    async function loadMarqueeData() {
      try {
        const snap = await getDoc(doc(db, "settings", "marquee"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.tickerItems && Array.isArray(data.tickerItems) && data.tickerItems.length > 0) {
            setItems(data.tickerItems);
          }
        }
      } catch (err) {
        console.error("Error loading marquee settings:", err);
      }
    }
    loadMarqueeData();
  }, []);

  // Duplicate items array to ensure seamless infinite looping without gaps
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <section className="relative py-12 md:py-16 bg-[#000] border-y border-white/5 overflow-hidden select-none">
      {/* Outer Glow limits */}
      <div className="absolute top-0 bottom-0 left-0 w-16 md:w-36 bg-gradient-to-r from-luxury-black to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 md:w-36 bg-gradient-to-l from-luxury-black to-transparent z-10 pointer-events-none" />

      {/* Marquee Wrapper Container */}
      <div className="flex w-[300%] overflow-hidden">
        <div className="flex space-x-12 md:space-x-24 animate-marquee whitespace-nowrap py-2">
          {repeatedItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center space-x-3 text-luxury-cream hover:text-luxury-gold transition-colors duration-400 group cursor-default"
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-[0.3em] font-light">
                {item}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold opacity-45 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 ml-4 md:ml-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
