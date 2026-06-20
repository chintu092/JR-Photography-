import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, MoveRight } from "lucide-react";
import { audioService } from "../utils/audio";
import LazyImage from "./LazyImage";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { StudioSettings } from "../types";

interface HeroSettings {
  titleLine1: string;
  titleLine2: string;
  badgeText: string;
  description: string;
  btn1Text: string;
  btn1Link: string;
  btn2Text: string;
  btn2Link: string;
  backdropSlides: string[];
  column1Cards: { id: string; img: string; name: string; city: string; avatar: string }[];
  column2Cards: { id: string; img: string; name: string; city: string; avatar: string }[];
}

// Elegant backdrop slides for ambient parallax fader
const BACKDROP_SLIDES = [
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1600"
];

// High fidelity photo content matching the screenshot style and aesthetic
const COLUMN_1_CARDS = [
  {
    id: "h1",
    img: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600",
    name: "Taaniel Malleus",
    city: "Kolkata, India",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "h2",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600",
    name: "Alex Pastoor",
    city: "Berlin, Germany",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "h3",
    img: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=600",
    name: "Ines Garmond",
    city: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "h4",
    img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=600",
    name: "Marcus Aurel",
    city: "Zurich, Switzerland",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
  }
];

const COLUMN_2_CARDS = [
  {
    id: "h5",
    img: "https://images.unsplash.com/photo-1510747440251-2485fc3f684e?auto=format&fit=crop&q=80&w=600",
    name: "Maria Sariynawa",
    city: "London, UK",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "h6",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
    name: "Christoph Becker",
    city: "Munich, Germany",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "h7",
    img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
    name: "Amélie Dubois",
    city: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
  },
  {
    id: "h8",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
    name: "Dimitri Volkov",
    city: "New York, USA",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150"
  }
];

export default function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [studio, setStudio] = useState<StudioSettings | null>(null);
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);

  useEffect(() => {
    const fetchStudio = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "studio"));
        if (docSnap.exists()) {
          setStudio(docSnap.data() as StudioSettings);
        }
      } catch (error: any) {
        if (error?.message && error.message.includes("offline")) {
          console.warn("Studio settings offline, using defaults.");
        } else {
          console.error("Error fetching studio:", error);
        }
      }
    };
    const fetchHero = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "hero"));
        if (docSnap.exists()) {
          setHeroSettings(docSnap.data() as HeroSettings);
        }
      } catch (error: any) {
        if (error?.message && error.message.includes("offline")) {
          console.warn("Hero settings offline, using defaults.");
        } else {
          console.error("Error fetching hero settings:", error);
        }
      }
    };
    fetchStudio();
    fetchHero();
  }, []);

  const heroBackdrops = heroSettings?.backdropSlides?.length ? heroSettings.backdropSlides : BACKDROP_SLIDES;
  const col1Cards = heroSettings?.column1Cards?.length ? heroSettings.column1Cards : COLUMN_1_CARDS;
  const col2Cards = heroSettings?.column2Cards?.length ? heroSettings.column2Cards : COLUMN_2_CARDS;

  useEffect(() => {
    const head = document.head;
    const preloadLinks: HTMLLinkElement[] = [];

    const addPreload = (url: string) => {
      if (!url) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      head.appendChild(link);
      preloadLinks.push(link);
    };

    heroBackdrops.forEach(addPreload);
    col1Cards.slice(0, 3).forEach(c => addPreload(c.img));
    col2Cards.slice(0, 3).forEach(c => addPreload(c.img));

    return () => {
      preloadLinks.forEach(link => {
        if (head.contains(link)) head.removeChild(link);
      });
    };
  }, [heroBackdrops, col1Cards, col2Cards]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroBackdrops.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroBackdrops.length]);

  const handleScrollTo = (selector: string) => {
    audioService.playClick();
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  // We duplicate cards several times to compile a smooth infinite vertical scroll.
  const duplicatedCol1 = [...col1Cards, ...col1Cards, ...col1Cards];
  const duplicatedCol2 = [...col2Cards, ...col2Cards, ...col2Cards];

  return (
    <section 
      id="hero" 
      className="relative min-h-[92vh] lg:min-h-screen w-full bg-luxury-black overflow-hidden flex items-center pt-24 pb-12"
    >
      {/* Background Slideshow Fader */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.18, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={heroBackdrops[activeSlide]}
              alt="Backdrop ambient scenery"
              className="w-full h-full object-cover filter brightness-[50%]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-transparent to-luxury-black/90" />
      </div>

      {/* Background radial soft spots */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 w-[40rem] h-[40rem] bg-zinc-900/40 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        
        {/* LEFT COLUMN: Editorial Big Typo and CTA Controls */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-start text-left z-20 space-y-6 max-w-xl">
          
          <div className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{heroSettings?.badgeText || "AWARD WINNING IN KOLKATA"}</span>
          </div>

          {/* Majestic Hero Headline split like the aesthetic mockup */}
          <h1 className="font-display font-medium text-4xl sm:text-6xl md:text-7xl lg:text-[76px] text-luxury-cream leading-[0.95] tracking-tight uppercase">
            {heroSettings?.titleLine1 || "CAPTURING"} <br />
            <span className="font-serif italic font-light text-luxury-gold tracking-normal lowercase block mt-2">{heroSettings?.titleLine2 || "Candid Moments."}</span>
          </h1>

          <p className="text-luxury-gray text-xs sm:text-sm md:text-base font-light leading-relaxed max-w-md pt-2">
            {heroSettings?.description || "JR Photography is the Best Wedding Photographer in Kolkata. We connect visionary couples with high-fidelity creators for premium, high-contrast, beautiful candid imagery and cinematic wedding films."}
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-wrap items-center gap-6 pt-5">
            {/* Explore Portfolio Pill */}
            <button
              onClick={() => handleScrollTo(heroSettings?.btn1Link || "#portfolio")}
              className="bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase px-8 py-3.5 rounded-full transition-colors cursor-pointer"
              id="hero-explore-portfolio"
            >
              {heroSettings?.btn1Text || "Explore Portfolio"}
            </button>

            {/* Become a client Line Link */}
            <button
              onClick={() => handleScrollTo(heroSettings?.btn2Link || "#contact")}
              className="text-[#b6b335] hover:text-white font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase cursor-pointer transition-all duration-300 py-2 border-b border-[#b6b335]/30 hover:border-[#b6b335]"
              id="hero-become-client"
            >
              {heroSettings?.btn2Text || "Become a client"}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Infinite Dual-Column Auto-scrolling grid */}
        <div className="lg:col-span-6 xl:col-span-7 h-[500px] sm:h-[600px] md:h-[650px] lg:h-[720px] relative w-full overflow-hidden [mask-image:_linear-gradient(to_bottom,transparent_0%,_black_12%,_black_88%,transparent_100%)] z-10 grid grid-cols-2 gap-4 sm:gap-6 px-1">
          
          {/* Scroll Up Column */}
          <div className="flex flex-col gap-4 sm:gap-6 animate-scroll-up hover:[animation-play-state:paused] h-max py-2">
            {duplicatedCol1.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className="relative aspect-[3/4] w-full rounded-[24px] sm:rounded-[32px] overflow-hidden border border-white/5 bg-zinc-900 group shadow-md"
              >
                <LazyImage 
                  src={card.img} 
                  alt={card.name} 
                  className="w-full h-full object-cover grayscale brightness-85 group-hover:grayscale-0 transition-all duration-700 select-none"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                
                {/* User card pill on bottom left like mockup */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2.5 p-2 bg-black/60 backdrop-blur-md rounded-2.5xl border border-white/10">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/40 shrink-0">
                    <img 
                      src={card.avatar} 
                      alt={card.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[10px] sm:text-[11px] font-display font-bold text-luxury-cream truncate leading-none">
                      {card.name}
                    </h5>
                    <span className="text-[7.5px] sm:text-[8px] font-mono text-zinc-400 block mt-0.5 leading-none truncate">
                      {card.city}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Down Column */}
          <div className="flex flex-col gap-4 sm:gap-6 animate-scroll-down hover:[animation-play-state:paused] h-max py-2">
            {duplicatedCol2.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className="relative aspect-[3/4] w-full rounded-[24px] sm:rounded-[32px] overflow-hidden border border-white/5 bg-zinc-900 group shadow-md"
              >
                <LazyImage 
                  src={card.img} 
                  alt={card.name} 
                  className="w-full h-full object-cover grayscale brightness-85 group-hover:grayscale-0 transition-all duration-700 select-none"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                
                {/* User card pill on bottom left like mockup */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-2.5 p-2 bg-black/60 backdrop-blur-md rounded-2.5xl border border-white/10">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/40 shrink-0">
                    <img 
                      src={card.avatar} 
                      alt={card.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-[10px] sm:text-[11px] font-display font-bold text-luxury-cream truncate leading-none">
                      {card.name}
                    </h5>
                    <span className="text-[7.5px] sm:text-[8px] font-mono text-zinc-400 block mt-0.5 leading-none truncate font-semibold">
                      {card.city}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Elegant Bottom Status & Scroll Indicator Bar */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20 w-full px-1">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] select-none">
            
            {/* Left side: Locations and Reel Status */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-zinc-400">
              <span className="font-bold text-luxury-cream tracking-[0.25em]">
                {studio ? studio.city.split(" ")[0].toUpperCase() : "GLOBAL CENTER"}
              </span>
              <div className="flex items-center space-x-2 text-zinc-500">
                <span className="text-luxury-gold text-[9.5px] leading-none shrink-0">▶</span>
                <span className="text-[9.5px] sm:text-[10px] tracking-[0.18em]">REEL RUNNING (2026 CUT)</span>
              </div>
            </div>

            {/* Right side: Interactive Scroll Discover Trigger */}
            <button
              onClick={() => handleScrollTo("#portfolio")}
              className="text-luxury-gold hover:text-luxury-cream transition-colors duration-300 font-bold tracking-[0.25em] flex items-center space-x-2 cursor-pointer group"
              id="hero-scroll-discover-btn"
            >
              <span>SCROLL TO DISCOVER</span>
              <span className="text-[12px] translate-y-[0.5px] font-sans group-hover:translate-y-1 transition-transform duration-300">↓</span>
            </button>

          </div>
        </div>
      </div>

    </section>
  );
}
