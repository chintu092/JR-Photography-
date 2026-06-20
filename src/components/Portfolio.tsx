import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WORK_ITEMS, BEFORE_AFTER_IMAGE } from "../data";
import { WorkItem } from "../types";
import { audioService } from "../utils/audio";
import { X, Sparkles, Play, CheckCircle2, Compass, ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { getCollectionData } from "../lib/db-client";
import LazyImage from "./LazyImage";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";

// Simple in-memory cache to prevent re-fetching during session and eliminate loading delays
let _portfolioCache: WorkItem[] | null = null;

gsap.registerPlugin(Flip);

interface PortfolioProps {
  onSelectWork?: (id: string) => void;
}

export default function Portfolio({ onSelectWork }: PortfolioProps) {
  const [portfolioItems, setPortfolioItems] = useState<WorkItem[]>(_portfolioCache || []);
  const [loading, setLoading] = useState<boolean>(!_portfolioCache);

  useEffect(() => {
    async function fetchItems() {
      try {
        const snap = await getCollectionData<any>("portfolio");
        if (snap && snap.length > 0) {
          const items = snap.map(doc => {
            const fallback = WORK_ITEMS.find(wi => wi.id === doc.id || wi.title?.toLowerCase() === doc.title?.toLowerCase());
            return {
              id: doc.id,
              ...doc,
              imageAlt: doc.imageAlt || fallback?.imageAlt || `${doc.category || 'Portfolio'} photography - ${doc.title || 'Masterwork'}`
            } as WorkItem;
          });
          const sorted = items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
          setPortfolioItems(sorted);
        } else {
          setPortfolioItems([]);
        }
      } catch (err) {
        setPortfolioItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const filteredItems = portfolioItems;

  const [selectedCaseStudy, setSelectedCaseStudy] = useState<WorkItem | null>(null);
  
  // --- Cinematic GSAP Lightbox Custom System ---
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const filteredItemsRef = useRef<WorkItem[]>([]);
  const lightboxIndexRef = useRef<number | null>(null);

  useEffect(() => {
    filteredItemsRef.current = filteredItems;
  }, [filteredItems]);

  useEffect(() => {
    lightboxIndexRef.current = lightboxIndex;
  }, [lightboxIndex]);

  const handleOpenLightbox = (index: number) => {
    const work = filteredItems[index];
    if (!work) return;
    
    audioService.playClick();
    audioService.playWhoosh();
    
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });

    const sourceImg = document.getElementById(`portfolio-img-${work.id}`);
    
    if (sourceImg) {
      const state = Flip.getState(sourceImg, { props: "transform,opacity" });
      
      setLightboxIndex(index);
      setLightboxOpen(true);
      
      requestAnimationFrame(() => {
        const targetImg = document.getElementById("lightbox-expanded-img");
        if (targetImg) {
          Flip.from(state, {
            duration: 0.7,
            ease: "power2.out",
            scale: true,
            onComplete: () => {
              gsap.fromTo("#lightbox-caption", 
                { opacity: 0, y: 35 }, 
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" }
              );
              gsap.fromTo("#lightbox-ui-controls", 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.5, overwrite: "auto" }
              );
            }
          });
        }
      });
    } else {
      setLightboxIndex(index);
      setLightboxOpen(true);
      requestAnimationFrame(() => {
        gsap.fromTo("#lightbox-container", 
          { opacity: 0, scale: 0.95 }, 
          { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out", overwrite: "auto" }
        );
      });
    }
  };

  const handleCloseLightbox = () => {
    audioService.playClick();
    const idx = lightboxIndex;
    if (idx !== null) {
      const work = filteredItems[idx];
      const sourceImg = document.getElementById(`portfolio-img-${work.id}`);
      const targetImg = document.getElementById("lightbox-expanded-img");
      
      if (sourceImg && targetImg) {
        const state = Flip.getState(targetImg);
        
        gsap.to("#lightbox-caption, #lightbox-ui-controls", {
          opacity: 0,
          duration: 0.2,
          overwrite: "auto",
          onComplete: () => {
            setLightboxOpen(false);
            setLightboxIndex(null);
            
            requestAnimationFrame(() => {
              Flip.from(state, {
                duration: 0.55,
                ease: "power2.out",
                scale: true
              });
            });
          }
        });
        return;
      }
    }
    setLightboxOpen(false);
    setLightboxIndex(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const idx = lightboxIndexRef.current;
      if (idx === null) return;
      
      if (e.key === "Escape") {
        e.preventDefault();
        setLightboxOpen(false);
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const items = filteredItemsRef.current;
        const prevIdx = (idx - 1 + items.length) % items.length;
        audioService.playClick();
        gsap.to("#lightbox-expanded-img", {
          opacity: 0,
          x: 40,
          duration: 0.25,
          overwrite: "auto",
          onComplete: () => {
            setLightboxIndex(prevIdx);
            setZoomScale(1);
            setPanOffset({ x: 0, y: 0 });
            gsap.fromTo("#lightbox-expanded-img", 
              { opacity: 0, x: -40 },
              { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" }
            );
          }
        });
        gsap.fromTo("#lightbox-caption", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, overwrite: "auto" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const items = filteredItemsRef.current;
        const nextIdx = (idx + 1) % items.length;
        audioService.playClick();
        gsap.to("#lightbox-expanded-img", {
          opacity: 0,
          x: -40,
          duration: 0.25,
          overwrite: "auto",
          onComplete: () => {
            setLightboxIndex(nextIdx);
            setZoomScale(1);
            setPanOffset({ x: 0, y: 0 });
            gsap.fromTo("#lightbox-expanded-img", 
              { opacity: 0, x: 40 },
              { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" }
            );
          }
        });
        gsap.fromTo("#lightbox-caption", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, overwrite: "auto" });
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleZoom = () => {
    audioService.playClick();
    setZoomScale(prev => (prev === 1 ? 1.8 : 1));
    setPanOffset({ x: 0, y: 0 });
  };

  const handleLightboxMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pctX = x / rect.width;
    const pctY = y / rect.height;
    
    const panX = (0.5 - pctX) * (zoomScale - 1) * 350;
    const panY = (0.5 - pctY) * (zoomScale - 1) * 350;
    
    setPanOffset({ x: panX, y: panY });
  };

  const handlePrevLightbox = () => {
    const idx = lightboxIndex;
    if (idx === null) return;
    audioService.playClick();
    
    const prevIdx = (idx - 1 + filteredItems.length) % filteredItems.length;
    gsap.to("#lightbox-expanded-img", {
      opacity: 0,
      x: 40,
      duration: 0.25,
      overwrite: "auto",
      onComplete: () => {
        setLightboxIndex(prevIdx);
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        gsap.fromTo("#lightbox-expanded-img", 
          { opacity: 0, x: -40 },
          { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" }
        );
      }
    });

    gsap.fromTo("#lightbox-caption", 
      { opacity: 0, y: 15 }, 
      { opacity: 1, y: 0, duration: 0.4, overwrite: "auto" }
    );
  };

  const handleNextLightbox = () => {
    const idx = lightboxIndex;
    if (idx === null) return;
    audioService.playClick();
    
    const nextIdx = (idx + 1) % filteredItems.length;
    gsap.to("#lightbox-expanded-img", {
      opacity: 0,
      x: -40,
      duration: 0.25,
      overwrite: "auto",
      onComplete: () => {
        setLightboxIndex(nextIdx);
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        gsap.fromTo("#lightbox-expanded-img", 
          { opacity: 0, x: 40 },
          { opacity: 1, x: 0, duration: 0.4, ease: "power2.out", overwrite: "auto" }
        );
      }
    });

    gsap.fromTo("#lightbox-caption", 
      { opacity: 0, y: 15 }, 
      { opacity: 1, y: 0, duration: 0.4, overwrite: "auto" }
    );
  };
  
  // Before/after state
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  // Video lightbox state
  const [videoOpen, setVideoOpen] = useState<boolean>(false);

  // Mouse coordinate tracker for internal-card mouse follow reticle
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Card reference list for GSAP target selector mapping
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // For horizontal slider calculations & dragging
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Function to filter category with a premium liquid GSAP Flip transition
  // Before/after offset calculation
  const handleMove = (clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    const progress = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
    setSliderPosition(progress);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1 || isSliding) {
      const rect = e.currentTarget.getBoundingClientRect();
      handleMove(e.clientX, rect);
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    const card = cardRefs.current[cardId];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    setHoveredCardId(cardId);

    // Dynamic magnetic pulling calculations
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;

    // A subtle 0.06 factor ensures a premium luxury feel (feels heavy, fluid, and luxurious)
    const strength = 0.06;
    const pullX = deltaX * strength;
    const pullY = deltaY * strength;

    // Drag the internal magnetic content wrapper slightly toward the user cursor
    const content = card.querySelector(".magnetic-content");
    if (content) {
      gsap.to(content, {
        x: pullX,
        y: pullY,
        scale: 1.012,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto"
      });
    }

    // Parallax counterpart: shift image in the opposite direction slightly
    const bgImg = card.querySelector(".zoom-image");
    if (bgImg) {
      gsap.to(bgImg, {
        x: -pullX * 0.4,
        y: -pullY * 0.4,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto"
      });
    }
  };

  const handleCardMouseLeave = (cardId: string) => {
    setHoveredCardId(null);
    const card = cardRefs.current[cardId];
    if (card) {
      const content = card.querySelector(".magnetic-content");
      if (content) {
        // High-end elastic return animation
        gsap.to(content, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.65,
          ease: "elastic.out(1.05, 0.6)",
          overwrite: "auto"
        });
      }

      const bgImg = card.querySelector(".zoom-image");
      if (bgImg) {
        gsap.to(bgImg, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    }
  };

  // Tracking progress of horizontal scrolling track
  const handleSliderScroll = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      const totalScrollable = scrollWidth - clientWidth;
      const progress = totalScrollable > 0 ? (scrollLeft / totalScrollable) * 100 : 0;
      setSliderProgress(progress);
    }
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener("scroll", handleSliderScroll);
      return () => slider.removeEventListener("scroll", handleSliderScroll);
    }
  }, []);

  // Scrolling via Arrow Buttons
  const scrollPrev = () => {
    audioService.playClick();
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -460, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    audioService.playClick();
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 460, behavior: "smooth" });
    }
  };

  // Dragging Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleMouseMoveDrag = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.6; // Speed multiplier
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
    <>
      <section id="portfolio" className="relative py-28 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5">
      {/* Decorative organic gradients of palette color */}
      <div className="absolute top-1/4 right-[5%] w-[400px] h-[400px] bg-deep-teal/4 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-10 left-[8%] w-[350px] h-[350px] bg-dark-olive/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 md:mb-20 gap-8">
          <div>
            <div className="inline-flex items-center space-x-2 text-[9px] font-mono tracking-[0.43em] text-luxury-gold uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STUDIO PORTFOLIO</span>
            </div>
            <h2 className="font-display font-medium text-4xl sm:text-6xl text-luxury-cream uppercase tracking-tight leading-none">
              SELECTED <br className="hidden sm:inline" />
              <span className="font-serif italic font-light text-luxury-gold tracking-normal">Masterworks</span>
            </h2>
          </div>
          
          {/* Controls: Left & Right Navigation Chevrons */}
          <div className="flex items-center space-x-4 self-end lg:self-auto">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">SWIPING & DRAGGING SUPPORTED</span>
            
            <div className="flex space-x-2">
              <button
                onClick={scrollPrev}
                className="w-11 h-11 rounded-full border border-white/10 hover:border-[#b6b335]/30 bg-luxury-charcoal/40 hover:bg-[#2a2c16] text-luxury-cream hover:text-[#b6b335] transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Previous masterpiece"
                id="filmstrip-prev-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={scrollNext}
                className="w-11 h-11 rounded-full border border-white/10 hover:border-[#b6b335]/30 bg-luxury-charcoal/40 hover:bg-[#2a2c16] text-luxury-cream hover:text-[#b6b335] transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Next masterpiece"
                id="filmstrip-next-btn"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- FILMSTRIP SCROLLING GALLERY --- */}
        <div className="relative">
          {/* Ambient gradients helping define scroll boundaries */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-luxury-black to-transparent z-10 pointer-events-none hidden sm:block" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-luxury-black to-transparent z-10 pointer-events-none hidden sm:block" />

          {/* Horizontal strip */}
          <div 
            ref={sliderRef}
            className={`flex overflow-x-auto overflow-y-hidden gap-7 py-4 snap-x snap-mandatory scrollbar-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onMouseMove={handleMouseMoveDrag}
            style={{ scrollbarWidth: "none" }}
          >
            {loading ? (
              [...Array(4)].map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="portfolio-card snap-center shrink-0 w-[85vw] sm:w-[480px] md:w-[520px] lg:w-[580px] h-[520px] md:h-[600px] relative rounded-[36px] overflow-hidden bg-white/[0.02] border border-white/5 cursor-wait"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                  <div className="absolute bottom-12 left-12 space-y-6">
                    <div className="w-24 h-5 bg-white/10 rounded-full animate-pulse" />
                    <div className="w-64 h-10 bg-white/10 rounded-xl animate-pulse" />
                    <div className="w-48 h-5 bg-white/5 rounded-full animate-pulse flex items-center gap-2">
                       <div className="w-4 h-4 bg-white/20 rounded-full shrink-0" />
                       <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredItems.length === 0 ? (
              <div className="w-full text-center py-32 text-luxury-cream/60 font-mono text-xs uppercase tracking-[0.25em] leading-relaxed self-center">
                No gallery cases found.
              </div>
            ) : (
              filteredItems.map((work, idx) => (
                <div
                  key={work.id}
                  ref={(el) => { cardRefs.current[work.id] = el; }}
                className="portfolio-card snap-center shrink-0 w-[85vw] sm:w-[480px] md:w-[520px] lg:w-[580px] h-[520px] md:h-[600px] relative rounded-[36px] overflow-hidden bg-luxury-charcoal border border-white/5 cursor-pointer"
                onClick={() => {
                  if (isDragging) return; // ignore click on drag release
                  audioService.playClick();
                  if (onSelectWork) {
                    onSelectWork(work.id);
                  } else {
                    setSelectedCaseStudy(work);
                  }
                }}
                onMouseEnter={() => audioService.playWhoosh()}
                onMouseMove={(e) => handleCardMouseMove(e, work.id)}
                onMouseLeave={() => handleCardMouseLeave(work.id)}
              >
                {/* Magnetic Interactive Content Wrapper */}
                <div className="magnetic-content absolute inset-0 w-full h-full pointer-events-none rounded-[36px] overflow-hidden flex flex-col justify-between">
                  <div className="absolute inset-0 zoom-container">
                    <LazyImage 
                      id={`portfolio-img-${work.id}`}
                      src={work.image} 
                      alt={work.imageAlt || work.title} 
                      className="w-full h-full object-cover zoom-image grayscale brightness-85 hover:grayscale-0 transition-all duration-[800ms]"
                      containerClassName="w-full h-full"
                      watermark={true}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/35 to-transparent opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-dark-olive/20 via-transparent to-deep-teal/20 mix-blend-overlay" />
                  </div>

                  {/* High visual editorial tagging */}
                  <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
                    <span className="px-3.5 py-1.5 bg-luxury-black/90 backdrop-blur-md rounded-full text-[8.5px] font-mono tracking-widest text-[#B7BE43] uppercase border border-white/10">
                      {work.category}
                    </span>
                    <div className="flex items-center space-x-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLightbox(idx);
                        }}
                        className="w-8 h-8 rounded-full bg-luxury-black/90 hover:bg-luxury-gold text-luxury-cream hover:text-luxury-black flex items-center justify-center transition-all duration-300 border border-white/10 backdrop-blur-md shadow-lg cursor-pointer pointer-events-auto"
                        title="Expand high-res photo"
                        id={`btn-expand-${work.id}`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase">
                        Nº 0{idx+1} / 0{filteredItems.length}
                      </span>
                    </div>
                  </div>

                  {/* Visual content overlay block */}
                  <div className="absolute bottom-0 left-0 w-full p-8 md:p-10 z-10 flex flex-col justify-end">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono tracking-widest text-[#B7BE43] uppercase block font-bold">
                        {work.client} • {work.year}
                      </span>
                      <h3 className="font-display font-medium text-3.5xl text-luxury-cream uppercase tracking-tight leading-none group-hover:text-luxury-gold transition-colors duration-300">
                        {work.title}
                      </h3>
                      <p className="text-xs text-luxury-gray max-w-sm line-clamp-2 font-light mt-2.5">
                        {work.description}
                      </p>
                    </div>

                    <div className="w-full h-[1px] bg-white/5 my-5" />

                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-luxury-gray tracking-widest">DRAG OR USE CHEVRONS</span>
                      <span className="text-[#B7BE43] tracking-widest hover:underline cursor-pointer">
                        EXPLORE CASE STUDY →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom mouse reticle for cards */}
                <AnimatePresence>
                  {hoveredCardId === work.id && (
                    <motion.div
                      className="hidden md:flex absolute pointer-events-none z-30 w-22 h-22 rounded-full border border-[#B7BE43]/70 bg-deep-teal/40 backdrop-blur-xs flex-col items-center justify-center text-center shadow-lg shadow-luxury-gold/10"
                      style={{
                        left: mousePos.x,
                        top: mousePos.y,
                        translateX: "-50%",
                        translateY: "-50%",
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    >
                      <Compass className="w-4 h-4 text-[#B7BE43] animate-[spin_20s_linear_infinite] mb-1 opacity-80" />
                      <span className="text-[8px] font-mono tracking-widest font-extrabold text-luxury-cream">VIEW</span>
                      <span className="text-[7px] font-mono tracking-widest text-[#B7BE43] font-bold uppercase leading-none">CASE</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              ))
            )}
          </div>

          {/* Custom Interactive Scroll Progress Track */}
          <div className="mt-10 max-w-sm mx-auto flex items-center space-x-4">
            <span className="text-[8px] font-mono text-luxury-gray tracking-wider">01</span>
            <div className="flex-grow h-[2px] bg-white/5 relative overflow-hidden rounded">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-[#B7BE43] transition-all duration-100"
                style={{ width: `${sliderProgress}%` }}
              />
            </div>
            <span className="text-[8px] font-mono text-luxury-gray tracking-wider">0{filteredItems.length}</span>
          </div>
        </div>

        {/* --- Brand New Cinematic Before & After Section --- */}
      </div>
    </section>

    <section className="relative w-full z-50">

      {/* Case Study Modals - Immersive overlay */}
      <AnimatePresence>
        {selectedCaseStudy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-luxury-black/96 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCaseStudy(null)}
            />

            <motion.div
              className="bg-luxury-black border border-white/10 p-6 md:p-10 lg:p-12 rounded-[40px] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl space-y-8 scrollbar-none"
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
            >
              {/* Close Button top corner */}
              <button
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-luxury-gold text-luxury-cream hover:text-luxury-black transition-colors z-20"
                onClick={() => setSelectedCaseStudy(null)}
                aria-label="Close modal"
                id="close-case-study-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Column left side image display */}
                <div className="md:col-span-5 space-y-4">
                  <div className="aspect-[3/4] rounded-[24px] overflow-hidden border border-white/5">
                    <LazyImage
                      src={selectedCaseStudy.image}
                      alt={selectedCaseStudy.imageAlt || selectedCaseStudy.title}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                      watermark={true}
                    />
                  </div>
                  <div className="p-4 bg-luxury-charcoal border border-white/5 rounded-2xl flex justify-between items-center text-xs font-mono">
                    <span className="text-luxury-gray uppercase text-[9px]">CATEGORY:</span>
                    <span className="text-luxury-gold font-bold uppercase text-[9px]">{selectedCaseStudy.category}</span>
                  </div>
                </div>

                {/* Column right side metadata, story, features */}
                <div className="md:col-span-7 space-y-6 text-left">
                  <div className="flex items-center space-x-3 font-mono text-[10px] text-luxury-gold">
                    <span>JR PORTFOLIO CASE</span>
                    <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full" />
                    <span>REF: {selectedCaseStudy.id.toUpperCase()}</span>
                  </div>

                  <h3 className="font-display font-medium text-3xl sm:text-4xl text-luxury-cream uppercase tracking-tight leading-none">
                    {selectedCaseStudy.title}
                  </h3>

                  <p className="text-xs sm:text-sm font-light leading-relaxed text-luxury-gray">
                    {selectedCaseStudy.description}
                  </p>

                  {/* Production specs table */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">CLIENT:</span>
                      <span className="text-[11px] font-display font-bold tracking-widest text-[#F5F5F5] uppercase block">
                        {selectedCaseStudy.client}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">YEAR:</span>
                      <span className="text-[11px] font-display font-bold tracking-widest text-[#F5F5F5] uppercase block">
                        {selectedCaseStudy.year}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">ROLE:</span>
                      <span className="text-[11px] font-display font-bold tracking-widest text-[#F5F5F5] uppercase block">
                        {selectedCaseStudy.role}
                      </span>
                    </div>
                  </div>

                  {/* Technical production bullet spec points */}
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">TACTICAL PRODUCTION SPECS:</h4>
                    <div className="space-y-2.5">
                      {selectedCaseStudy.details?.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start space-x-2.5 text-xs text-luxury-cream text-left font-light">
                          <CheckCircle2 className="w-4 h-4 text-luxury-gold mt-0.5 shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inquire custom shoot using details */}
                  <div className="pt-6">
                    <button
                      onClick={() => {
                        setSelectedCaseStudy(null);
                        const contactEl = document.getElementById("contact");
                        if (contactEl) {
                          contactEl.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="w-full py-4 bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.15em] uppercase rounded-full transition-colors cursor-pointer"
                      id="modal-case-study-contact-btn"
                    >
                      Inquire Similar Shoot Scale
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Lightbox Player frame */}
      <AnimatePresence>
        {videoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setVideoOpen(false)}
            />

            <motion.div
              className="bg-[#0A0D08] border border-white/5 rounded-[32px] overflow-hidden w-full max-w-3xl aspect-video relative z-10 shadow-2xl flex flex-col justify-center items-center p-8 text-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-luxury-cream transition-colors cursor-pointer"
                onClick={() => setVideoOpen(false)}
                id="close-video-lightbox-btn"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Realistic mock of premium player */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-luxury-gold tracking-widest uppercase block animate-pulse">
                  INQUIST REEL PIPELINE ESTABLISHED
                </span>
                <h4 className="font-display text-2xl font-bold uppercase text-luxury-cream">
                  JR RED & ARRI GRADING WORKFLOW
                </h4>
                <p className="text-xs text-luxury-gray max-w-sm mx-auto leading-relaxed font-light">
                  Our private client cinematic reel highlights continuous slow motion, drone mappings, and custom-designed LUT profiles tailored specifically to luxury automotive and editorial client demands.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setVideoOpen(false);
                      const contactEl = document.getElementById("contact");
                      if (contactEl) {
                        contactEl.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="px-8 py-3.5 bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono font-bold text-[10px] tracking-[0.15em] uppercase rounded-full transition-colors cursor-pointer"
                    id="video-lightbox-inquire-btn"
                  >
                    REQUEST HIGH-FI PRIVATE SCREENING ACCESS
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cinematic GSAP Lightbox Custom System Overlay */}
      <AnimatePresence>
        {lightboxOpen && lightboxIndex !== null && filteredItems[lightboxIndex] && (() => {
          const activeWork = filteredItems[lightboxIndex];
          return (
            <div 
              id="lightbox-container"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-fade-in"
              style={{ contentVisibility: "auto" }}
            >
              {/* Soft atmospheric gradient backdrops */}
              <div className="absolute inset-x-0 top-0 h-[30vh] bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-[30vh] bg-gradient-to-t from-black/90 via-black/70 to-transparent pointer-events-none z-10" />

              <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-deep-teal/10 rounded-full filter blur-[100px] pointer-events-none" />
              <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-luxury-gold/5 rounded-full filter blur-[120px] pointer-events-none" />

              {/* Close backdrop click */}
              <div className="absolute inset-0 cursor-zoom-out" onClick={handleCloseLightbox} />

              {/* Centered Image Container */}
              <div 
                className="relative w-full max-w-5xl h-[55vh] md:h-[65vh] flex items-center justify-center px-4 md:px-12 z-20 overflow-hidden"
                onMouseMove={handleLightboxMouseMove}
              >
                <div className="relative max-w-full max-h-full overflow-hidden rounded-[24px] border border-white/5 bg-luxury-black flex items-center justify-center select-none shadow-2xl">
                  <img
                    id="lightbox-expanded-img"
                    src={activeWork.image}
                    alt={activeWork.imageAlt || activeWork.title}
                    className="max-w-full max-h-[55vh] md:max-h-[65vh] object-contain rounded-[24px] pointer-events-auto cursor-grab active:cursor-grabbing"
                    referrerPolicy="no-referrer"
                    draggable={false}
                    style={{
                      transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`,
                      transition: zoomScale === 1 ? "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)" : "none"
                    }}
                  />
                  
                  {zoomScale > 1 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[9px] font-mono tracking-widest text-[#B7BE43] border border-white/10 uppercase select-none pointer-events-none">
                      Drag / Move mouse to pan
                    </div>
                  )}
                </div>
              </div>

              {/* UI Controls Header */}
              <div 
                id="lightbox-ui-controls"
                className="absolute top-8 left-6 right-6 md:left-12 md:right-12 flex justify-between items-center z-30"
              >
                <div className="flex items-center space-x-3 md:space-x-4">
                  <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[9.5px] font-mono tracking-wider text-zinc-400 uppercase border border-white/10">
                    {activeWork.category}
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px] hidden sm:block">
                    {activeWork.year}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Zoom Action Button */}
                  <button
                    onClick={handleToggleZoom}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-luxury-gold text-luxury-cream hover:text-luxury-black transition-all duration-300 border border-white/10 backdrop-blur-md cursor-pointer"
                    title={zoomScale > 1 ? "Zoom Out" : "Zoom In"}
                  >
                    {zoomScale > 1 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                  </button>

                  {/* Close Action Button */}
                  <button
                    onClick={handleCloseLightbox}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-luxury-gold text-luxury-cream hover:text-luxury-black transition-all duration-300 border border-white/10 backdrop-blur-md cursor-pointer"
                    title="Close Lightbox"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slider Controls (Left & Right Chevrons) */}
              <div className="absolute inset-y-0 left-4 md:left-8 flex items-center z-30">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevLightbox(); }}
                  className="w-12 h-12 rounded-full border border-white/10 hover:border-luxury-gold/30 bg-black/40 hover:bg-[#2a2c16] text-luxury-cream hover:text-luxury-gold transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-md pointer-events-auto shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>

              <div className="absolute inset-y-0 right-4 md:right-8 flex items-center z-30">
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextLightbox(); }}
                  className="w-12 h-12 rounded-full border border-white/10 hover:border-luxury-gold/30 bg-black/40 hover:bg-[#2a2c16] text-luxury-cream hover:text-luxury-gold transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-md pointer-events-auto shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Photographic Editorial Captions */}
              <div 
                id="lightbox-caption"
                className="absolute bottom-8 left-6 right-6 md:bottom-12 md:left-12 md:right-12 z-30 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pointer-events-none"
              >
                <div className="space-y-2 max-w-xl">
                  <span className="text-[10px] font-mono tracking-[0.25em] text-[#B7BE43] uppercase block font-bold">
                    {activeWork.client} — {activeWork.year}
                  </span>
                  <h3 className="font-display font-medium text-3xl sm:text-4xl text-luxury-cream uppercase tracking-tight leading-none font-serif italic text-luxury-gold">
                    {activeWork.title}
                  </h3>
                  <p className="text-xs text-luxury-gray font-light max-w-md leading-relaxed hidden sm:block">
                    {activeWork.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto">
                  <button
                    onClick={() => {
                      setLightboxOpen(false);
                      setLightboxIndex(null);
                      if (onSelectWork) {
                        onSelectWork(activeWork.id);
                      } else {
                        setSelectedCaseStudy(activeWork);
                      }
                    }}
                    className="px-6 py-3 bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono font-bold text-[10px] tracking-[0.15em] uppercase rounded-full transition-colors cursor-pointer border border-[#b6b335]/20"
                  >
                    View Structural Case Study
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500 tracking-widest hidden sm:block">
                    IMAGE {lightboxIndex + 1} OF {filteredItems.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>
    </section>
    </>
  );
}
