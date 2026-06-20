import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "motion/react";
import { WorkItem } from "../types";
import { audioService } from "../utils/audio";
import { ArrowLeft, Camera, Calendar, User, Image as ImageIcon, CheckCircle2, ChevronLeft, ChevronRight, X, Loader2, ArrowRight, Play } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LazyImage from "./LazyImage";
import Logo from "./Logo";

interface WorkDetailProps {
  workId: string;
  onBack: () => void;
  onNavigateToContact: () => void;
}

export default function WorkDetail({ workId, onBack, onNavigateToContact }: WorkDetailProps) {
  const [work, setWork] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWork() {
      try {
        const docRef = doc(db, "portfolio", workId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setWork({ id: snap.id, ...snap.data() } as WorkItem);
        } else {
          setWork(null);
        }
      } catch (err) {
        setWork(null);
      } finally {
        setLoading(false);
      }
    }
    fetchWork();
  }, [workId]);

  const [activeImgIndex, setActiveImgIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [workId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allImages = work ? [work.image, ...(work.galleryImages || [])] : [];
      if (activeImgIndex === null || allImages.length === 0) return;
      if (e.key === "ArrowRight") {
        audioService.playWhoosh();
        setActiveImgIndex((activeImgIndex + 1) % allImages.length);
      } else if (e.key === "ArrowLeft") {
        audioService.playWhoosh();
        setActiveImgIndex((activeImgIndex - 1 + allImages.length) % allImages.length);
      } else if (e.key === "Escape") {
        audioService.playClick();
        setActiveImgIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImgIndex, work]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [mosaicIndex, setMosaicIndex] = useState(0);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="py-36 text-center text-luxury-cream">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-luxury-gold" />
      </div>
    );
  }

  if (!work) {
    return (
      <div className="py-36 text-center text-luxury-cream">
        <p>Project case study not found.</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-[#B7BE43] text-[#0C0F0A] uppercase rounded-full font-bold">
          Return to Gallery
        </button>
      </div>
    );
  }

  const handleReturn = () => {
    audioService.playClick();
    onBack();
  };

  const handleBookShoot = () => {
    audioService.playClick();
    onNavigateToContact();
  };

  const allImages = [work.image, ...(work.galleryImages || [])];

  const handleOpenLightbox = (index: number) => {
    audioService.playClick();
    setActiveImgIndex(index);
  };

  const handleCloseLightbox = () => {
    audioService.playClick();
    setActiveImgIndex(null);
  };

  const handleNextImg = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeImgIndex === null) return;
    audioService.playWhoosh();
    setActiveImgIndex((activeImgIndex + 1) % allImages.length);
  };

  const handlePrevImg = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeImgIndex === null) return;
    audioService.playWhoosh();
    setActiveImgIndex((activeImgIndex - 1 + allImages.length) % allImages.length);
  };

  const scrollToMobileIndex = (index: number) => {
    if (mobileScrollRef.current) {
      const children = mobileScrollRef.current.children;
      if (children && children[index]) {
        (children[index] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }
  };

  const handleMobileScroll = () => {
    if (mobileScrollRef.current) {
      const container = mobileScrollRef.current;
      const scrollLeft = container.scrollLeft;
      const width = container.clientWidth;
      if (width > 0) {
        const activeIndex = Math.round(scrollLeft / width);
        if (activeIndex >= 0 && activeIndex < allImages.length && activeIndex !== mosaicIndex) {
          setMosaicIndex(activeIndex);
        }
      }
    }
  };

  // Pagination for the mosaic
  const pageSize = 5;
  
  const handleNextMosaic = () => {
    audioService.playWhoosh();
    setMosaicIndex(prev => {
      const nextIdx = (prev + 1) % allImages.length;
      scrollToMobileIndex(nextIdx);
      return nextIdx;
    });
  };

  const handlePrevMosaic = () => {
    audioService.playWhoosh();
    setMosaicIndex(prev => {
      const prevIdx = (prev - 1 + allImages.length) % allImages.length;
      scrollToMobileIndex(prevIdx);
      return prevIdx;
    });
  };

  // Create a wraparound display list so we always have up to 5 images
  const displayImages = [];
  for (let i = 0; i < Math.min(pageSize, allImages.length); i++) {
    displayImages.push({
      url: allImages[(mosaicIndex + i) % allImages.length],
      originalIndex: (mosaicIndex + i) % allImages.length
    });
  }

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] font-sans pb-28 text-[#F5F5F5] selection:bg-[#B7BE43] selection:text-black">
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#B7BE43] origin-left z-[100]"
      />

      {/* Cinematic Full Header */}
      <div className="relative w-full h-[65vh] min-h-[450px] md:min-h-[580px] overflow-hidden">
        <div className="absolute inset-0">
          <LazyImage
            src={work.image}
            alt={work.imageAlt || work.title}
            className="w-full h-full object-cover grayscale brightness-40"
            containerClassName="w-full h-full"
            watermark={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-[#0A0A0A]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-transparent" />
        </div>

        {/* Float return button top corner */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
          <button
            onClick={handleReturn}
            onMouseEnter={() => audioService.playWhoosh()}
            className="group flex items-center space-x-2 px-5 py-2.5 bg-[#0C0F0A]/90 backdrop-blur-md rounded-full border border-white/10 text-[9.5px] font-mono tracking-widest text-[#B7BE43] uppercase hover:bg-[#B7BE43] hover:text-[#0C0F0A] transition-all duration-300"
            id="work-detail-back-top-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Master Gallery</span>
          </button>
        </div>

        {/* Central heading titles */}
        <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-16 z-10 select-none">
          <div className="max-w-5xl mx-auto text-left space-y-4">
            
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-[#0C0F0A]/90 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-mono tracking-[0.35em] text-[#B7BE43] uppercase font-bold">
              <Camera className="w-3.5 h-3.5" />
              <span>NATIVE {work.category.toUpperCase()} CATALOG CASE</span>
            </div>

            <h1 className="font-display font-medium text-4xl sm:text-6xl md:text-7xl text-[#F5F5F5] leading-[1.03] tracking-tight uppercase">
              {work.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-mono text-[#B7BE43] tracking-wider pt-2 font-bold uppercase">
              <span>{work.photographerName || "JR PHOTOGRAPHY"}</span>
              <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
              <span>{work.location || "KHARAGPUR"}</span>
              <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
              <span>YEAR: {work.year}</span>
              {work.gear && (
                <>
                  <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
                  <span>GEAR: {work.gear}</span>
                </>
              )}
              {work.projectStatus && (
                <>
                  <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
                  <span>STATUS: {work.projectStatus}</span>
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-20">
        {/* Project Meta Details */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-20 border-b border-white/5 pb-16">
          <div>
             <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 font-bold uppercase block mb-3">Project Year</span>
             <span className="text-[13px] text-white tracking-wide uppercase">{work.year}</span>
          </div>
          <div>
             <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 font-bold uppercase block mb-3">Client</span>
             <span className="text-[13px] text-white tracking-wide uppercase">{work.client || "Independent"}</span>
          </div>
          <div>
             <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 font-bold uppercase block mb-3">Role</span>
             <span className="text-[13px] text-white tracking-wide uppercase">{work.role}</span>
          </div>
          <div>
             <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 font-bold uppercase block mb-3">Location</span>
             <span className="text-[13px] text-white tracking-wide uppercase">{work.location || "Kharagpur"}</span>
          </div>
          <div>
             <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 font-bold uppercase block mb-3">Gear</span>
             <span className="text-[13px] text-white tracking-wide uppercase">{work.gear || "Digital"}</span>
          </div>
          <div>
             <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 font-bold uppercase block mb-3">Status</span>
             <span className="text-[13px] text-white tracking-wide uppercase">{work.projectStatus || "Completed"}</span>
          </div>
        </div>

        {/* Selected Moments Section */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="flex items-center space-x-3 text-white uppercase tracking-widest text-[11px] font-bold font-mono">
              <Camera className="w-4 h-4 text-[#B7BE43]" />
              <span>SELECTED MOMENTS</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-[#888] font-mono text-[10px] tracking-widest flex items-center space-x-4 border border-white/5 bg-[#121411] rounded-full px-2 py-1">
                <button onClick={handlePrevMosaic} className="w-8 h-8 flex items-center justify-center hover:text-white hover:bg-white/5 rounded-full transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-16 text-center">
                   <span className="text-white">{mosaicIndex + 1}</span> / {allImages.length}
                </div>
                <button onClick={handleNextMosaic} className="w-8 h-8 flex items-center justify-center hover:text-white hover:bg-white/5 rounded-full transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Snap-Scroll Carousel (under lg breakpoint) */}
          <div className="block lg:hidden relative w-full overflow-hidden mb-12">
            <div 
              ref={mobileScrollRef}
              onScroll={handleMobileScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 pb-4 w-full"
              style={{ 
                scrollbarWidth: "none", 
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch"
              }}
            >
              {allImages.map((imgUrl, idx) => (
                <div 
                  key={idx}
                  className="w-full shrink-0 snap-center rounded-2xl overflow-hidden relative cursor-pointer aspect-[4/3] max-h-[420px]"
                  onClick={() => handleOpenLightbox(idx)}
                >
                  <img 
                    src={imgUrl} 
                    className="w-full h-full object-cover grayscale brightness-[85%] hover:grayscale-0 hover:brightness-100 transition-all duration-300" 
                    alt={`Moment ${idx + 1}`} 
                    draggable={false} 
                    onContextMenu={(e) => e.preventDefault()} 
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                    <Logo variant="monogram" className="w-16 h-16 text-white -rotate-12 select-none" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Visual pager indicator dots on mobile */}
            <div className="flex justify-center items-center space-x-1.5 mt-2">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    audioService.playClick();
                    setMosaicIndex(idx);
                    scrollToMobileIndex(idx);
                  }}
                  className={`h-1 rounded-full transition-all duration-300 ${mosaicIndex === idx ? "w-6 bg-[#B7BE43]" : "w-1.5 bg-zinc-700 hover:bg-zinc-500"}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Mosaic Grid Layout exactly like the mockup */}
          <div className="hidden lg:flex lg:flex-row gap-4 h-auto lg:h-[600px]">
            {/* Image 1 (Left Tall) */}
            {displayImages[0] && (
              <div 
                className="flex-1 rounded-2xl overflow-hidden relative group cursor-pointer lg:h-full h-[400px]"
                onClick={() => handleOpenLightbox(displayImages[0].originalIndex)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img src={displayImages[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] grayscale brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100" alt="Moment 1" draggable={false} />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                  <Logo variant="monogram" className="w-24 h-24 md:w-28 md:h-28 text-white -rotate-12 select-none" />
                </div>
              </div>
            )}
            
            {/* Image 2 (Middle Tall) */}
            {displayImages[1] && (
              <div 
                className="flex-1 rounded-2xl overflow-hidden relative group cursor-pointer lg:h-full h-[400px]"
                onClick={() => handleOpenLightbox(displayImages[1].originalIndex)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <img src={displayImages[1].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] grayscale brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100" alt="Moment 2" draggable={false} />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                  <Logo variant="monogram" className="w-24 h-24 md:w-28 md:h-28 text-white -rotate-12 select-none" />
                </div>
              </div>
            )}
            
            {/* Image 3, 4, 5 (Right Split) */}
            {displayImages.length > 2 && (
              <div className="flex-1 flex flex-col gap-4 lg:h-full h-[600px]">
                {displayImages[2] && (
                  <div 
                    className="flex-[1.5] rounded-2xl overflow-hidden relative group cursor-pointer"
                    onClick={() => handleOpenLightbox(displayImages[2].originalIndex)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <img src={displayImages[2].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] grayscale brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100" alt="Moment 3" draggable={false} />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                      <Logo variant="monogram" className="w-20 h-20 md:w-24 md:h-24 text-white -rotate-12 select-none" />
                    </div>
                  </div>
                )}
                <div className="flex-[1] flex gap-4">
                  {displayImages[3] && (
                    <div 
                      className="flex-1 rounded-2xl overflow-hidden relative group cursor-pointer"
                      onClick={() => handleOpenLightbox(displayImages[3].originalIndex)}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img src={displayImages[3].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] grayscale brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100" alt="Moment 4" draggable={false} />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                        <Logo variant="monogram" className="w-12 h-12 md:w-16 md:h-16 text-white -rotate-12 select-none" />
                      </div>
                    </div>
                  )}
                  {displayImages[4] && (
                    <div 
                      className="flex-1 rounded-2xl overflow-hidden relative group cursor-pointer"
                      onClick={() => handleOpenLightbox(displayImages[4].originalIndex)}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <img src={displayImages[4].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] grayscale brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100" alt="Moment 5" draggable={false} />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                        <Logo variant="monogram" className="w-12 h-12 md:w-16 md:h-16 text-white -rotate-12 select-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-24 pt-16 border-t border-white/5">
          <div className="space-y-6">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase font-bold">
              ABOUT THIS SHOOT
            </span>
            <h2 className="font-display font-medium text-3xl text-white tracking-tight">
              {work.aboutShootTitle || work.title}
            </h2>
            <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-md">
              {work.description}
            </p>
            {work.behindTheScenesLink && (
              <a 
                href={work.behindTheScenesLink} 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center space-x-3 px-6 py-3 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all group mt-6 w-max"
              >
                 <span className="text-[10px] font-mono uppercase tracking-widest font-bold">View Behind The Scenes</span>
                 <Play className="w-3.5 h-3.5 fill-current" />
              </a>
            )}
          </div>

          <div className="space-y-6">
            <span className="text-[10px] font-mono tracking-widest text-[#B7BE43] uppercase font-bold">
              HIGHLIGHTS
            </span>
            <div className="space-y-6 pt-2">
              {work.details.map((detail, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="w-5 h-5 rounded-full border border-[#B7BE43] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-[#B7BE43]" />
                  </div>
                  <span className="text-sm text-zinc-300 tracking-wide font-light leading-relaxed">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Block */}
        <div className="mt-24 bg-[#121411] border border-white/5 rounded-[32px] p-10 md:p-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-full bg-[#1A1D1A] border border-white/5 flex items-center justify-center shrink-0">
               <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#B7BE43] uppercase font-bold">
                {work.ctaSubtitle || "LET'S CREATE SOMETHING BEAUTIFUL"}
              </span>
              <h2 className="font-display text-4xl text-white tracking-tight">
                {work.ctaTitle || "Have a project in mind?"}
              </h2>
              <p className="text-zinc-400 text-sm max-w-md">
                {work.ctaDesc || "I'm available for travel worldwide. Let's capture your story with authenticity, emotion, and artistry."}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleBookShoot}
            className="px-8 py-4 bg-[#B7BE43] text-black font-mono font-bold text-[11px] tracking-widest uppercase rounded-full hover:bg-white transition-colors flex items-center space-x-3 shrink-0"
          >
            <span>{work.ctaButtonText || "GET IN TOUCH"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Lightbox Component remains the same */}
      <AnimatePresence>
        {activeImgIndex !== null && allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#070906]/98 backdrop-blur-xl px-4"
            onClick={handleCloseLightbox}
          >
            <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-10">
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
                PLATE {activeImgIndex + 1} OF {allImages.length}
              </span>
              <button
                onClick={handleCloseLightbox}
                className="p-3 bg-white/5 hover:bg-[#B7BE43] text-white hover:text-black rounded-full transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-w-6xl w-full h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handlePrevImg}
                className="absolute left-0 lg:-left-12 w-12 h-12 rounded-full bg-black/50 hover:bg-[#B7BE43] text-white hover:text-black border border-white/10 flex items-center justify-center transition-colors z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="relative max-w-full max-h-full flex items-center justify-center" onContextMenu={(e) => e.preventDefault()}>
                <motion.img
                  key={activeImgIndex}
                  src={allImages[activeImgIndex]}
                  alt={`Plate ${activeImgIndex + 1}`}
                  className="max-w-full max-h-full object-contain rounded-xl"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  draggable={false}
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
                  <Logo variant="monogram" className="w-32 h-32 md:w-48 md:h-48 text-white -rotate-12 select-none" />
                </div>
              </div>

              <button
                onClick={handleNextImg}
                className="absolute right-0 lg:-right-12 w-12 h-12 rounded-full bg-black/50 hover:bg-[#B7BE43] text-white hover:text-black border border-white/10 flex items-center justify-center transition-colors z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-8 text-center px-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-display text-base font-bold uppercase tracking-wide text-white">
                {work.title}
              </h4>
              <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase block mt-1.5 leading-none">
                USE ← AND → KEYBOARD KEYS TO EXPLORE
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
