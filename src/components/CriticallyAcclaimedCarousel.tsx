import React, { useState, useEffect } from "react";
import { Star, Zap, Award } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface CarouselItem {
  id: string;
  image: string;
  tag: string;
  title: string;
  rotation: string;
  translateY: string;
}

const CAROUSEL_IMAGES: CarouselItem[] = [
  {
    id: "img1",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
    tag: "HAUTE WEDDING",
    title: "VILLA D'ESTE ELOPEMENT",
    rotation: "rotate-[-3.5deg]",
    translateY: "translate-y-4",
  },
  {
    id: "img2",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800",
    tag: "EDITORIAL FASHION",
    title: "PARIS COUTURE WEEK",
    rotation: "rotate-[2deg]",
    translateY: "translate-y-1",
  },
  {
    id: "img3",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
    tag: "FINE-ART LANDSCAPE",
    title: "ÉTRETAT WHITE CLIFFS",
    rotation: "rotate-[-1.5deg]",
    translateY: "translate-y-2",
  },
  {
    id: "img4",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
    tag: "AVANT-GARDE COUTURE",
    title: "RAW FRAME CHRONICLE",
    rotation: "rotate-[3deg]",
    translateY: "translate-y-0",
  },
  {
    id: "img5",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800",
    tag: "CLASSIC SCENIC",
    title: "AMALFI ROADWAY COUPE",
    rotation: "rotate-[-2deg]",
    translateY: "translate-y-3",
  },
  {
    id: "img6",
    image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=800",
    tag: "PORTRAIT NOIRE",
    title: "HAUTE LÉGACY MODEL",
    rotation: "rotate-[4deg]",
    translateY: "translate-y-1",
  },
  {
    id: "img7",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800",
    tag: "LINEN ART PRINT",
    title: "BESPOKE MUSEUM EDITION",
    rotation: "rotate-[-2.5deg]",
    translateY: "translate-y-4",
  },
];

export default function CriticallyAcclaimedCarousel() {
  // Duplicate the list twice to ensure flawless seamless loop
  const duplicatedItems = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];

  const [headerConfig, setHeaderConfig] = useState({
    pretitle: "CRITICALLY ACCLAIMED DEPT",
    title: "AVANT-GARDE VISION. METICULOUS PHYSICAL FORMS.",
    subtitle: "Capturing raw human emotion, sophisticated silhouettes, and high-fashion aesthetics, preserving museum-grade physical visual legacies to cherish forever."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "section_headers"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.critically_acclaimed) {
          setHeaderConfig({
            pretitle: data.critically_acclaimed.pretitle || "CRITICALLY ACCLAIMED DEPT",
            title: data.critically_acclaimed.title || "AVANT-GARDE VISION. METICULOUS PHYSICAL FORMS.",
            subtitle: data.critically_acclaimed.subtitle || "Capturing raw human emotion, sophisticated silhouettes, and high-fashion aesthetics, preserving museum-grade physical visual legacies to cherish forever."
          });
        }
      }
    }, (error) => {
      console.warn("Error loading critically acclaimed section headers:", error);
    });
    return unsub;
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 1. Header block modeled after the uploaded luxury elegant layout */}
      <div className="text-center max-w-3xl px-6 mb-16 relative z-10">
        
        {/* Category gold badge identifier */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-[#B7BE43]/15 rounded-full border border-[#B7BE43]/20 text-[8.5px] font-mono tracking-[0.25em] text-luxury-gold uppercase mb-5">
          <Star className="w-3 h-3 text-luxury-gold fill-luxury-gold inline mr-0.5 animate-pulse" />
          <span>{headerConfig.pretitle}</span>
        </div>

        {/* Big centered title - elegant display */}
        <h2 className="font-display font-medium text-3xl sm:text-5xl md:text-6.5xl text-luxury-cream leading-[1.08] uppercase tracking-tight mb-6">
          {headerConfig.title}
        </h2>

        {/* Editorial description paragraph matching the wedding sample */}
        <p className="text-luxury-gray text-xs sm:text-sm md:text-[14.5px] leading-relaxed font-light mx-auto max-w-2xl">
          {headerConfig.subtitle}
        </p>
      </div>

      {/* 2. Seamless continuous auto-scroll track */}
      {/* Absolute master wrapper with mask-image for soft fading borders on left & right sides */}
      <div className="relative w-full overflow-hidden select-none py-12 px-2 [mask-image:_linear-gradient(to_right,transparent_0%,_black_15%,_black_85%,transparent_100%)]">
        
        {/* Infinite scrolling row container. On hover, we pause the animation play-state */}
        <div className="flex animate-scroll-left hover:[animation-play-state:paused] gap-6 w-max py-4 cursor-grab active:cursor-grabbing">
          {duplicatedItems.map((item, index) => {
            return (
              <div
                key={`${item.id}-${index}`}
                className={`flex-shrink-0 w-[220px] sm:w-[280px] aspect-[10/14] rounded-[40px] overflow-hidden relative border border-white/10 bg-[#141414] shadow-2xl transition-all duration-500 group transform ${item.rotation} ${item.translateY} hover:scale-[1.04] hover:-translate-y-2 hover:rotate-0 hover:border-luxury-gold/30`}
              >
                {/* Visual Unsplash Image Cover */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />

                {/* Aesthetic Dark Cinematic Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

                {/* Text Metadata Details inside the Card */}
                <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col">
                  {/* Category word tag */}
                  <span className="text-[8.5px] font-mono text-[#B7BE43] tracking-[0.25em] uppercase font-bold mb-1.5 opacity-85">
                    {item.tag}
                  </span>
                  {/* Piece title */}
                  <h3 className="text-xs sm:text-[13.5px] font-display font-medium text-white uppercase tracking-wider leading-snug">
                    {item.title}
                  </h3>
                </div>

                {/* Subtle top index or frame number tag */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/5 px-2.5 py-1 rounded-full text-[7.5px] font-mono text-zinc-400 tracking-wider">
                  RAW FRAME #{100 + index}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Red Dot / Award status indicator bar at the bottom */}
      <div className="mt-12 flex flex-wrap justify-center items-center gap-6 sm:gap-10 relative z-20 px-6 text-center">
        {/* Red Dot style award decoration */}
        <div className="flex items-center space-x-3 bg-neutral-950/80 backdrop-blur-md px-5 py-3.5 rounded-3xl border border-white/5 shadow-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E63946] to-[#E53E3E] flex items-center justify-center text-white relative flex-shrink-0 animate-pulse">
            <span className="text-[12px] font-display font-black leading-none italic uppercase">rd</span>
            <span className="absolute inset-0.5 border border-dashed border-white/30 rounded-full animate-[spin_20s_linear_infinite]" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-display font-black uppercase text-luxury-cream tracking-wider leading-none">
              red<span className="text-[#E63946]">dot</span> award
            </div>
            <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              winner 2026 • fine-art
            </div>
          </div>
        </div>

        {/* Secondary aesthetic marker */}
        <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
          <Award className="w-4 h-4 text-luxury-gold" />
          <span>AESTHETIC SUPREMACY LABS</span>
          <span className="text-[#B7BE43]">•</span>
          <span>EST. 2026</span>
        </div>
      </div>

    </div>
  );
}
