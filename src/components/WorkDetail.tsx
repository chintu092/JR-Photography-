import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WORK_ITEMS } from "../data";
import { audioService } from "../utils/audio";
import { ArrowLeft, Camera, Compass, CheckCircle2, Sparkles, SlidersHorizontal, Play, X, ChevronLeft, ChevronRight } from "lucide-react";

interface WorkDetailProps {
  workId: string;
  onBack: () => void;
  onNavigateToContact: () => void;
}

export default function WorkDetail({ workId, onBack, onNavigateToContact }: WorkDetailProps) {
  const work = WORK_ITEMS.find((w) => w.id === workId);

  // Before/after state config
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  // Immersive Lightbox state
  const [activeImgIndex, setActiveImgIndex] = useState<number | null>(null);

  // Fallback before/after image pool links if specific isn't assigned
  const beforeImg = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200";
  const afterImg = work?.image || beforeImg;

  useEffect(() => {
    // Scroll to top immediately when viewing a detail project case-study
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [workId]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImgIndex === null || !work?.galleryImages) return;
      if (e.key === "ArrowRight") {
        audioService.playWhoosh();
        setActiveImgIndex((activeImgIndex + 1) % work.galleryImages.length);
      } else if (e.key === "ArrowLeft") {
        audioService.playWhoosh();
        setActiveImgIndex((activeImgIndex - 1 + work.galleryImages.length) % work.galleryImages.length);
      } else if (e.key === "Escape") {
        audioService.playClick();
        setActiveImgIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImgIndex, work]);

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
    if (activeImgIndex === null || !work.galleryImages) return;
    audioService.playWhoosh();
    setActiveImgIndex((activeImgIndex + 1) % work.galleryImages.length);
  };

  const handlePrevImg = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeImgIndex === null || !work.galleryImages) return;
    audioService.playWhoosh();
    setActiveImgIndex((activeImgIndex - 1 + work.galleryImages.length) % work.galleryImages.length);
  };

  // Slider navigation move tracking
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

  return (
    <div className="relative min-h-screen bg-luxury-black pb-28 md:pb-36 overflow-hidden">
      {/* Decorative colored visual blobs */}
      <div className="absolute top-1/4 right-[8%] w-[450px] h-[450px] bg-deep-teal/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-[5%] w-[350px] h-[350px] bg-dark-olive/6 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Cinematic Full Header */}
      <div className="relative w-full h-[65vh] min-h-[450px] md:min-h-[580px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={work.image}
            alt={work.title}
            className="w-full h-full object-cover grayscale brightness-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/40 via-transparent to-transparent" />
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

            <h1 className="font-display font-medium text-4xl sm:text-6xl md:text-7xl text-luxury-cream leading-[1.03] tracking-tight uppercase">
              {work.title}
            </h1>

            <div className="flex items-center space-x-3 text-[10.5px] font-mono text-[#B7BE43] tracking-wider pt-2 font-bold uppercase">
              <span>JR FINE ART</span>
              <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
              <span>REF ID: {work.id.toUpperCase()}</span>
              <span className="w-1.5 h-1.5 bg-[#B7BE43] rounded-full" />
              <span>YEAR: {work.year}</span>
            </div>

          </div>
        </div>
      </div>

      {/* Narrative grid details columns */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 pt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start text-left">
          
          {/* Main Story Narrative (8 col of 12) */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase block">
                CREATIVE COMMISSION SUMMARY
              </span>
              <p className="text-sm sm:text-base text-luxury-cream font-light leading-relaxed tracking-wide">
                {work.description}
              </p>
              <p className="text-xs sm:text-sm text-luxury-gray font-light leading-relaxed">
                This project was orchestrated to push the boundaries of high-contrast contour strobe setups, utilizing state-of-the-art digital plates as well as hand-processed analog sheets to capture texture in micro-dimensions. Every framing, exposure setting, and physical composition was calibrated dynamically to support deep luxury brand values.
              </p>
            </div>

            {/* In-view slider comparison specifically for this project */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2.5">
                <SlidersHorizontal className="w-4 h-4 text-[#B7BE43]" />
                <span className="text-[10px] font-mono text-[#B7BE43] tracking-widest uppercase font-bold">
                  COLOR SCIENCE RETOUCH LABORATORY
                </span>
              </div>

              <div 
                className="relative h-[300px] sm:h-[380px] w-full select-none overflow-hidden rounded-[28px] border border-white/5 cursor-ew-resize shadow-2xl"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseDown={() => setIsSliding(true)}
                onMouseUp={() => setIsSliding(false)}
                onMouseLeave={() => setIsSliding(false)}
              >
                {/* AFTER IMAGE (Graded and vibrant) */}
                <img
                  src={afterImg}
                  alt="Graded Masterplate View"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                <span className="absolute bottom-6 right-6 px-3 py-1.5 bg-[#0C0F0A]/90 rounded-full text-[8px] font-mono uppercase text-luxury-cream tracking-widest border border-white/10 z-20">
                  DEVELOPED MASTER
                </span>

                {/* BEFORE IMAGE (RAW neutral grey/unprocessed) */}
                <div 
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={afterImg}
                    alt="RAW negative profile View"
                    className="absolute inset-y-0 left-0 h-full w-full object-cover grayscale brightness-65 contrast-85"
                    style={{ width: "100%", maxWidth: "none" }}
                    referrerPolicy="no-referrer"
                  />

                  <span className="absolute bottom-6 left-6 px-3 py-1.5 bg-[#0C0F0A]/90 rounded-full text-[8px] font-mono uppercase text-luxury-gray tracking-widest border border-white/10 z-20 whitespace-nowrap">
                    RAW LOG CAMERA ARCHIVE
                  </span>
                </div>

                {/* Vertical slider divider */}
                <div 
                  className="absolute top-0 bottom-0 z-20 w-[2px] bg-[#B7BE43] pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#B7BE43] border border-white flex items-center justify-center pointer-events-auto shadow-xl">
                    <span className="text-[12px] text-luxury-black font-extrabold select-none">↔</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Return Trigger area */}
            <div className="pt-6">
              <button
                onClick={handleReturn}
                onMouseEnter={() => audioService.playWhoosh()}
                className="inline-flex items-center space-x-2 text-xs font-mono text-luxury-gray hover:text-[#B7BE43] uppercase tracking-widest transition-colors"
                id="work-detail-mid-back-btn"
              >
                <span>← BACK TO PORTFOLIO ARCHIVES</span>
              </button>
            </div>
          </div>

          {/* Technical Specs Board (4 col of 12) */}
          <div className="lg:col-span-4 space-y-8 bg-[#121611]/60 p-8 rounded-[32px] border border-white/5 relative overflow-hidden shadow-xl">
            {/* Spotlight blur */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-deep-teal/10 rounded-full filter blur-2xl pointer-events-none" />

            {/* Brief meta Table */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono tracking-widest text-[#B7BE43] uppercase font-bold border-b border-white/5 pb-2">
                PROJECT SPECIFICATION
              </h4>
              <div className="space-y-3.5">
                <div>
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase block mb-0.5">CLIENT BRAND:</span>
                  <span className="text-[12px] font-display font-extrabold text-[#F5F5F5] uppercase tracking-wider block">
                    {work.client}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase block mb-0.5">RELEASE DATE:</span>
                  <span className="text-[12px] font-display font-extrabold text-[#F5F5F5] uppercase tracking-wider block">
                    {work.year}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase block mb-0.5">REPRESENTING ROLE:</span>
                  <span className="text-[12px] font-display font-extrabold text-[#F5F5F5] uppercase tracking-wider block">
                    {work.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Production features check list */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">TACTICAL SHOT DETAILS:</h4>
              <div className="space-y-2.5">
                {work.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start space-x-2.5 text-xs text-[#ccc] font-light leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-[#B7BE43] mt-0.5 shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA action trigger button inside container card */}
            <div className="pt-6 border-t border-white/5">
              <button
                onClick={handleBookShoot}
                className="w-full py-4 bg-[#B7BE43] text-luxury-black font-display font-bold text-[10.5px] tracking-widest uppercase rounded-full hover:bg-white transition-colors duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                id="work-detail-book-scale-btn"
              >
                <span>Inquire Custom Shoot</span>
              </button>
              <span className="text-[8px] font-mono text-zinc-500 tracking-wider text-center block mt-3 uppercase">
                *Worldwide dispatch logistics managed immediately
              </span>
            </div>

          </div>

        </div>

        {/* Curated Exhibition Photo Gallery Section */}
        <div className="mt-24 pt-20 border-t border-white/5 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3.5">
              <div className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.43em] text-[#B7BE43] uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EXHIBITION PLATES</span>
              </div>
              <h3 className="font-display font-medium text-3xl sm:text-4xl text-luxury-cream uppercase tracking-tight">
                Curated Shot Collection
              </h3>
              <p className="text-xs sm:text-sm text-luxury-gray font-light max-w-xl leading-relaxed">
                Explore the exclusive high-fidelity photo series captured during this masterwork session. Click on any frame to activate the premium visual lightbox player.
              </p>
            </div>
            
            <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase shrink-0">
              {work.galleryImages?.length || 4} MASTER PLATES RELEASED
            </span>
          </div>

          {/* Asymmetric Elegant Photography Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {work.galleryImages?.map((imgUrl, imgIdx) => {
              // Asymmetric style grid to make it look highly stylized like a premium exhibition
              let colSpanClass = "col-span-1";
              let heightClass = "h-[300px] sm:h-[360px]";
              if (imgIdx === 0) {
                colSpanClass = "sm:col-span-2 col-span-1";
                heightClass = "h-[300px] sm:h-[400px]";
              } else if (imgIdx === 3) {
                colSpanClass = "col-span-1 sm:col-span-2 lg:col-span-1";
                heightClass = "h-[300px] sm:h-[360px] lg:h-[400px]";
              }

              return (
                <div
                  key={imgIdx}
                  className={`${colSpanClass} relative overflow-hidden rounded-[28px] border border-white/5 bg-luxury-charcoal group cursor-pointer ${heightClass} shadow-xl max-w-full`}
                  onClick={() => handleOpenLightbox(imgIdx)}
                >
                  <img
                    src={imgUrl}
                    alt={`Exhibition sheet #${imgIdx + 1}`}
                    className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04] grayscale brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Lens focus hover indicator */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#B7BE43] text-luxury-black flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Aesthetic plate metadata tagging */}
                  <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-[#0C0F0A]/90 backdrop-blur-sm rounded-lg border border-white/5 text-[8.5px] font-mono text-zinc-400 tracking-wider">
                    PLATE {work.id.toUpperCase()}-0{imgIdx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Fullscreen Photo Lightbox Player */}
      <AnimatePresence>
        {activeImgIndex !== null && work.galleryImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/98 backdrop-blur-lg px-4"
            onClick={handleCloseLightbox}
          >
            {/* Top Bar: Counter & Dismiss */}
            <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-10">
              <span className="text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
                PLATE {activeImgIndex + 1} OF {work.galleryImages.length}
              </span>
              <button
                onClick={handleCloseLightbox}
                className="p-3 bg-white/5 hover:bg-[#B7BE43] text-luxury-cream hover:text-luxury-black rounded-full transition-colors duration-300 cursor-pointer"
                id="lightbox-close-btn"
                aria-label="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Central Slide Content Framed and Counter Balanced */}
            <div className="relative max-w-5xl w-full max-h-[75vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {/* Previous Photo Trigger */}
              <button
                onClick={handlePrevImg}
                className="absolute left-2 sm:left-4 z-20 w-12 h-12 rounded-full bg-black/70 hover:bg-[#B7BE43] text-luxury-cream hover:text-luxury-black border border-white/10 flex items-center justify-center transition-colors duration-300 cursor-pointer shadow-lg"
                id="lightbox-prev-btn"
                aria-label="Previous plate"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Display Element */}
              <div className="overflow-hidden rounded-2xl border border-white/10 max-h-[75vh] mx-10 sm:mx-16 bg-zinc-900/40">
                <motion.img
                  key={activeImgIndex}
                  src={work.galleryImages[activeImgIndex]}
                  alt={`Selected exhibition sheet ${activeImgIndex + 1}`}
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Next Photo Trigger */}
              <button
                onClick={handleNextImg}
                className="absolute right-2 sm:right-4 z-20 w-12 h-12 rounded-full bg-black/70 hover:bg-[#B7BE43] text-luxury-cream hover:text-luxury-black border border-white/10 flex items-center justify-center transition-colors duration-300 cursor-pointer shadow-lg"
                id="lightbox-next-btn"
                aria-label="Next plate"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Credits / Play guide labels */}
            <div className="absolute bottom-8 text-center px-4" onClick={(e) => e.stopPropagation()}>
              <h4 className="font-display text-sm sm:text-base font-bold uppercase text-luxury-cream tracking-wide">
                {work.title}
              </h4>
              <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase block mt-1.5 leading-none">
                USE ← AND → KEYBOARD KEYS OR CLICK BUTTONS TO EXPLORE
              </span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
