import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WORK_ITEMS } from "../data";
import { WorkItem } from "../types";
import { audioService } from "../utils/audio";
import { X, Sparkles, Play, CheckCircle2, Compass, ChevronLeft, ChevronRight } from "lucide-react";

interface PortfolioProps {
  onSelectWork?: (id: string) => void;
}

export default function Portfolio({ onSelectWork }: PortfolioProps) {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<WorkItem | null>(null);
  
  // Video lightbox state
  const [videoOpen, setVideoOpen] = useState<boolean>(false);

  // Mouse coordinate tracker for internal-card mouse follow reticle
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // For horizontal slider calculations & dragging
  const sliderRef = useRef<HTMLDivElement>(null);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredCardId(cardId);
  };

  const handleCardMouseLeave = () => {
    setHoveredCardId(null);
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
    <section id="portfolio" className="relative py-28 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5">
      {/* Decorative organic gradients of palette color */}
      <div className="absolute top-1/4 right-[5%] w-[400px] h-[400px] bg-deep-teal/4 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-10 left-[8%] w-[350px] h-[350px] bg-dark-olive/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto relative z-10">
        
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
                className="w-11 h-11 rounded-full border border-white/10 hover:border-[#B7BE43] bg-luxury-charcoal/40 hover:bg-[#B7BE43] text-luxury-cream hover:text-luxury-black transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Previous masterpiece"
                id="filmstrip-prev-btn"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={scrollNext}
                className="w-11 h-11 rounded-full border border-white/10 hover:border-[#B7BE43] bg-luxury-charcoal/40 hover:bg-[#B7BE43] text-luxury-cream hover:text-luxury-black transition-all duration-300 flex items-center justify-center cursor-pointer"
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
            {WORK_ITEMS.map((work, idx) => (
              <div
                key={work.id}
                className="snap-center shrink-0 w-[85vw] sm:w-[480px] md:w-[520px] lg:w-[580px] xl:w-[680px] 2xl:w-[740px] 3xl:w-[840px] h-[520px] md:h-[600px] xl:h-[680px] 2xl:h-[750px] relative rounded-[36px] overflow-hidden bg-luxury-charcoal border border-white/5 cursor-pointer"
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
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="absolute inset-0 zoom-container">
                  <img 
                    src={work.image} 
                    alt={work.title} 
                    className="w-full h-full object-cover zoom-image grayscale brightness-85 hover:grayscale-0 transition-all duration-[800ms]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/35 to-transparent opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-dark-olive/20 via-transparent to-deep-teal/20 mix-blend-overlay" />
                </div>

                {/* High visual editorial tagging */}
                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
                  <span className="px-3.5 py-1.5 bg-[#0C0F0A]/90 backdrop-blur-md rounded-full text-[8.5px] font-mono tracking-widest text-[#B7BE43] uppercase border border-white/10">
                    {work.category}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 tracking-[0.2em] uppercase">
                    Nº 0{idx+1} / 0{WORK_ITEMS.length}
                  </span>
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
                    <span className="text-luxury-gold tracking-widest hover:underline cursor-pointer">
                      EXPLORE CASE STUDY →
                    </span>
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
                      <Compass className="w-4 h-4 text-luxury-gold animate-[spin_20s_linear_infinite] mb-1 opacity-80" />
                      <span className="text-[8px] font-mono tracking-widest font-extrabold text-luxury-cream">VIEW</span>
                      <span className="text-[7px] font-mono tracking-widest text-[#B7BE43] font-bold uppercase leading-none">CASE</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
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
            <span className="text-[8px] font-mono text-luxury-gray tracking-wider">0{WORK_ITEMS.length}</span>
          </div>
        </div>

        {/* --- RAW vs. retouched Before/After Comparison Section --- */}
        {/* Remove comparison slider */}

      </div>

      {/* Case Study Modals - Immersive overlay */}
      <AnimatePresence>
        {selectedCaseStudy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-[#0C0F0A]/96 backdrop-blur-md"
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
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-[#B7BE43] text-luxury-cream hover:text-luxury-black transition-colors z-20"
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
                    <img
                      src={selectedCaseStudy.image}
                      alt={selectedCaseStudy.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4 bg-luxury-charcoal border border-white/5 rounded-2xl flex justify-between items-center text-xs font-mono">
                    <span className="text-luxury-gray uppercase text-[9px]">CATEGORY:</span>
                    <span className="text-[#B7BE43] font-bold uppercase text-[9px]">{selectedCaseStudy.category}</span>
                  </div>
                </div>

                {/* Column right side metadata, story, features */}
                <div className="md:col-span-7 space-y-6 text-left">
                  <div className="flex items-center space-x-3 font-mono text-[10px] text-luxury-gold">
                    <span>JR PORTFOLIO CASE</span>
                    <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
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
                          <CheckCircle2 className="w-4 h-4 text-[#B7BE43] mt-0.5 shrink-0" />
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
                      className="w-full py-4 bg-[#B7BE43] text-luxury-black font-display font-bold text-[11px] tracking-widest uppercase rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"
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
                <span className="text-[10px] font-mono text-[#B7BE43] tracking-widest uppercase block animate-pulse">
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
                    className="px-6 py-3 bg-[#E9E9E7] text-[#0C0F0A] font-display font-bold text-[9px] tracking-wider uppercase rounded-full hover:bg-[#B7BE43] hover:text-[#0C0F0A] transition-colors cursor-pointer"
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
    </section>
  );
}
