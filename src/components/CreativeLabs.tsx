import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles, BookOpen, Layers, Compass, Cpu, Check } from "lucide-react";
import LazyImage from "./LazyImage";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface LabCard {
  id: string;
  title: string;
  category: "create" | "develop" | "explore" | "learn";
  tag: string;
  description: string;
  image: string;
  linkText: string;
  color: string; // Dynamic hex color for the thick offset frame
  darkTheme: boolean; // Whether the card itself is dark themed (like in "Develop" category)
  bgColor?: string; // Optional custom background color
  textColor?: string; // Optional custom text color
  tagBg?: string; // Optional custom tag background color
}

const LAB_CARDS: LabCard[] = [
  // Learn
  {
    id: "lc1",
    title: "Computational Discovery",
    category: "learn",
    tag: "TEST RUN",
    description: "Agentic research engine that generates and scores code variations to help discover models and accelerate iteration.",
    image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=600",
    linkText: "Learn More",
    color: "#3b82f6", // Electric Blue
    darkTheme: false,
  },
  {
    id: "lc2",
    title: "Literature Insights",
    category: "learn",
    tag: "READING",
    description: "Literature tool to find papers, structure data tables, and create artifacts like reports, slide decks, and more.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600",
    linkText: "Learn More",
    color: "#eab308", // Yellow / Gold
    darkTheme: false,
  },
  {
    id: "lc3",
    title: "Learn Your Way",
    category: "learn",
    tag: "COURSE 1",
    description: "An AI learning tool that transforms content into a dynamic and engaging experience tailored for you.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600",
    linkText: "Try It Now",
    color: "#f97316", // Orange
    darkTheme: false,
  },
  {
    id: "lc4",
    title: "Vantage",
    category: "learn",
    tag: "VANTAGE",
    description: "Develop and measure future-ready skills like collaboration, creativity, critical thinking via GenAI-simulated teamwork.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
    linkText: "Learn More",
    color: "#a855f7", // Violet
    darkTheme: false,
  },

  // Develop
  {
    id: "lc5",
    title: "Stitch",
    category: "develop",
    tag: "STITCH",
    description: "An AI design canvas that transforms natural language into high-fidelity UI you can iterate and collaborate on.",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600",
    linkText: "Try It Now",
    color: "#10b981", // Emerald Green
    darkTheme: true,
  },
  {
    id: "lc6",
    title: "Opal",
    category: "develop",
    tag: "OPAL",
    description: "A tool that helps you write, test, and share AI mini-apps in a simple, visual language.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600",
    linkText: "Try It Now",
    color: "#06b6d4", // Cyan
    darkTheme: true,
  },

  // Explore
  {
    id: "lc7",
    title: "dreambeans",
    category: "explore",
    tag: "DREAMBEANS",
    description: "Dreambeans provides personalized collections of stories each day covering the things that matter most to you.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600",
    linkText: "Learn More",
    color: "#f43f5e", // Rose / Peach
    darkTheme: false,
    bgColor: "#FAF6F0", // Warm beige
    textColor: "#433422",
  },
  {
    id: "lc8",
    title: "CC",
    category: "explore",
    tag: "COMPANION",
    description: "An experimental agent to guide you. Get a personalized summary of what you need to know.",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=600",
    linkText: "Learn More",
    color: "#64748b", // Slate
    darkTheme: false,
  },

  // Create
  {
    id: "lc9",
    title: "Pomelli",
    category: "create",
    tag: "POMELLI",
    description: "An AI-powered marketing tool designed to build scalable, on-brand content to help you connect with your audience faster.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600",
    linkText: "Try It Now",
    color: "#84cc16", // Lime Green
    darkTheme: false,
  },
  {
    id: "lc10",
    title: "Studio Flo",
    category: "create",
    tag: "STUDIO FLO",
    description: "A new agency tool designed to help you organize shoot schedules, locate spaces, or sketch layouts dynamically.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600",
    linkText: "Try It Now",
    color: "#6366f1", // Indigo
    darkTheme: true,
  }
];

export default function CreativeLabs() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cards, setCards] = useState<LabCard[]>(LAB_CARDS);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function fetchLabs() {
      try {
        const snap = await getDoc(doc(db, "settings", "creative_labs"));
        if (snap.exists() && snap.data()?.cards) {
          setCards(snap.data().cards);
        }
      } catch (error) {
        console.error("Error fetching labs settings:", error);
      }
    }
    fetchLabs();
  }, []);

  // Filter cards based on selected category
  const filteredCards = cards.filter(
    (card) => activeCategory === "All" || card.category === activeCategory.toLowerCase()
  );

  // Reset active index when category changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  // Auto scroll effect
  useEffect(() => {
    if (isPaused) return;
    if (filteredCards.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev >= filteredCards.length - 1) {
          return 0; // Wrap back to first card
        }
        return prev + 1;
      });
    }, 4000); // Scroll every 4 seconds

    return () => clearInterval(interval);
  }, [isPaused, filteredCards.length, activeCategory]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? filteredCards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev >= filteredCards.length - 1 ? 0 : prev + 1));
  };

  // Dynamic header title based on active category, matching Google Labs video exactly
  const getHeaderTitle = () => {
    const cat = activeCategory.toLowerCase();
    if (cat === "all") return "Be the first to learn";
    return `Be the first to ${cat}`;
  };

  return (
    <section className="relative py-28 px-4 sm:px-8 bg-[#F8FAFC] overflow-hidden select-none border-t border-slate-200/50">
      
      {/* Decorative clean background shapes matching Google aesthetic */}
      <div className="absolute top-0 right-0 w-[45%] h-[45%] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[45%] h-[45%] rounded-full bg-[#cfb53b]/5 blur-[100px] pointer-events-none" />
      
      {/* Large visual circular overlay at the top, mimicking the blue arc in the video */}
      <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[1200px] h-[350px] rounded-full border-b border-blue-500/10 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Dynamic Section Header Title with seamless text swap transition */}
        <div className="text-center mb-12 h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.h2
              key={activeCategory}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-4xl sm:text-5xl md:text-6xl font-semibold text-slate-900 tracking-tight"
            >
              {getHeaderTitle()}
            </motion.h2>
          </AnimatePresence>
        </div>

        {/* Dynamic 3D Cover Flow Carousel Deck */}
        <div 
          className="relative h-[530px] w-full flex items-center justify-center overflow-visible my-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="relative w-full max-w-md h-full flex items-center justify-center">
            
            <AnimatePresence initial={false}>
              {filteredCards.map((card, idx) => {
                const offset = idx - activeIndex;
                const absOffset = Math.abs(offset);
                
                // Only render cards that are close to the center to prevent performance lag
                if (absOffset > 2) return null;

                // Rotated stacked positions matching the video exactly
                // Left cards: offset negative, rotated counter-clockwise (-5 deg), scaled down, lower opacity
                // Right cards: offset positive, rotated clockwise (5 deg), scaled down, lower opacity
                // Center card: offset 0, fully upright, highest z-index, fully opaque
                const xOffset = offset * (isMobile ? 140 : 290); // Overlapping offset on desktop
                const rotate = offset === 0 ? 0 : offset < 0 ? -6 : 6;
                const scale = offset === 0 ? 1.02 : 0.88;
                const opacity = offset === 0 ? 1 : 0.45;
                const zIndex = 20 - absOffset;

                return (
                  <motion.div
                    key={card.id}
                    style={{
                      position: "absolute",
                      zIndex,
                      width: "100%",
                      maxWidth: "340px",
                    }}
                    animate={{
                      x: xOffset,
                      rotate,
                      scale,
                      opacity,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 180,
                      damping: 24,
                    }}
                    className="origin-center select-none"
                  >
                    {/* Organic thick offset background border shape */}
                    <div 
                      className="absolute inset-0 rounded-[44px] pointer-events-none transition-transform duration-500 -z-10"
                      style={{
                        border: `6px solid ${card.color}`,
                        transform: "translate(-8px, -8px) scale(1.01)",
                      }}
                    />

                    {/* Main Premium Card Frame */}
                    <div 
                      className={`rounded-[36px] p-6 flex flex-col h-[450px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100 backdrop-blur-md transition-colors duration-500 ${
                        card.darkTheme 
                          ? "bg-[#0b0c10] text-white border-white/5" 
                          : "bg-white text-slate-800"
                      }`}
                      style={{
                        backgroundColor: card.bgColor || undefined,
                        color: card.textColor || undefined,
                      }}
                    >
                      {/* Premium Header Image */}
                      <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden mb-6 bg-slate-100 border border-slate-200/40">
                        <LazyImage
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                        
                        {/* Status Label Pill */}
                        <div className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${
                          card.darkTheme 
                            ? "bg-black/60 border-white/15" 
                            : "bg-white/95 border-slate-200/60"
                        }`}>
                          <span 
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: card.color }}
                          />
                          <span className={`text-[9px] font-mono font-bold tracking-wider uppercase ${
                            card.darkTheme ? "text-slate-300" : "text-slate-600"
                          }`}>
                            {card.tag}
                          </span>
                        </div>
                      </div>

                      {/* Content Description */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-sans text-xl font-bold tracking-tight mb-2">
                            {card.title}
                          </h3>
                          <p className={`text-xs sm:text-[13px] leading-relaxed font-light ${
                            card.darkTheme ? "text-slate-400" : "text-slate-500"
                          }`}
                          style={{
                            color: card.textColor ? `${card.textColor}dd` : undefined
                          }}
                          >
                            {card.description}
                          </p>
                        </div>

                        {/* Card Link Trigger CTA */}
                        <div className="flex items-center gap-1.5 group cursor-pointer pt-3">
                          <span 
                            className="text-xs font-mono font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
                            style={{ color: card.color }}
                          >
                            {card.linkText}
                          </span>
                          <span 
                            className="text-xs transition-transform duration-300 group-hover:translate-x-1"
                            style={{ color: card.color }}
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel Prev/Next Navigation Controls */}
        <div className="flex items-center justify-center gap-5 mt-6 mb-12">
          <button
            onClick={handlePrev}
            className="p-3.5 rounded-full border border-slate-200 bg-white text-slate-800 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-3.5 rounded-full border border-slate-200 bg-white text-slate-800 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-sm active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills & Stamp at the very bottom */}
        <div className="flex flex-col items-center gap-8 pt-4">
          
          {/* Custom Stylized Tag Pills */}
          <div className="flex flex-wrap justify-center gap-3">
            {["All", "Create", "Develop", "Explore", "Learn"].map((cat) => {
              const isActive = activeCategory === cat;
              
              const getCatColor = (c: string) => {
                if (c === "Create") return "#84cc16"; // Lime Green
                if (c === "Develop") return "#10b981"; // Emerald Green
                if (c === "Explore") return "#f43f5e"; // Rose
                if (c === "Learn") return "#3b82f6"; // Blue
                return "#0f172a"; // Dark Slate
              };

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? "bg-slate-900 font-extrabold text-white scale-105" 
                      : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                  style={{
                    backgroundColor: isActive ? getCatColor(cat) : undefined,
                    borderColor: isActive ? getCatColor(cat) : undefined,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Subtitle brand stamp matching the video perfectly */}

        </div>

      </div>
    </section>
  );
}
