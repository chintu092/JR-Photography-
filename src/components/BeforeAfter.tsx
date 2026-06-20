import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Camera, Image as ImageIcon, Sliders, Stars } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function BeforeAfter() {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, handleMove]);

  useEffect(() => {
    const labels = document.querySelectorAll('.before-after-label');
    if (containerRef.current && labels.length > 0) {
      gsap.fromTo(
        labels,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          }
        }
      );
    }
  }, []);

  const imageUrl = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=2000";

  return (
    <section className="relative py-24 md:py-36 bg-[#0a0910] overflow-hidden px-4 md:px-6 border-t border-white/5">
      {/* Background ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-luxury-gold/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Cinematic Light Leaks */}
      <motion.div 
        className="absolute top-[-10%] left-[10%] w-[50vw] h-[30vw] bg-gradient-to-br from-luxury-gold/10 to-transparent rounded-full blur-[100px] opacity-50 mix-blend-screen pointer-events-none rotate-45"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[-10%] right-[5%] w-[40vw] h-[40vw] bg-gradient-to-tl from-[#9A93F5]/10 to-transparent rounded-full blur-[120px] opacity-40 mix-blend-screen pointer-events-none -rotate-12"
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          x: [0, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              backgroundColor: Math.random() > 0.5 ? "rgba(212, 175, 55, 0.6)" : "rgba(255, 255, 255, 0.4)",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              boxShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              x: [0, (Math.random() - 0.5) * 50],
              opacity: [0, Math.random() * 0.5 + 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-16 mt-12 md:mt-0">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 text-[10px] rounded-full border border-white/10 backdrop-blur-md bg-white/5 shadow-xl">
            <Stars className="w-3.5 h-3.5 text-luxury-gold" />
            <span className="font-bold uppercase tracking-[0.2em] text-white">Before & After</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-white tracking-wide">
            See the <span className="bg-gradient-to-r from-[#9A93F5] to-[#E3C5F5] text-transparent bg-clip-text">Magic</span> in Real Time
          </h2>
          <p className="text-[#a1a1aa] text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            One image. Endless possibilities. Move the slider to see how our signature color grading transforms ordinary shots into extraordinary masterpieces.
          </p>
        </motion.div>

        {/* The Before / After Container */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto max-w-5xl group"
        >
          <div 
            ref={containerRef}
            className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl md:rounded-3xl overflow-hidden cursor-ew-resize select-none ring-1 ring-white/20 shadow-2xl"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* The After Image (Base Layer - Right Side) */}
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=2000" 
                alt="After color grading" 
                className="w-full h-full object-cover object-center pointer-events-none"
              />
            </div>
            
            {/* The Before Image (Top Layer - Clipped - Left Side) */}
            <div 
              className="absolute inset-0 z-10" 
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <img 
                src="https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=2000" 
                alt="Before color grading" 
                className="w-full h-full object-cover object-center pointer-events-none saturate-50 brightness-90 contrast-75"
              />
            </div>

            {/* Labels */}
            <div className={`absolute top-6 left-6 z-20 transition-opacity duration-300 before-after-label ${position < 10 ? 'opacity-0' : 'opacity-100'}`}>
              <div className="px-5 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center gap-2 shadow-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                <span className="text-xs font-medium text-white/90">Original</span>
              </div>
            </div>

            <div className={`absolute top-6 right-6 z-20 transition-opacity duration-300 before-after-label ${position > 90 ? 'opacity-0' : 'opacity-100'}`}>
              <div className="px-5 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center gap-2 shadow-xl">
                <span className="text-xs font-medium text-white/90">Enhanced</span>
                <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
              </div>
            </div>

            {/* The Divider Line */}
            <div 
              className="absolute top-0 bottom-0 z-30 w-[2px] bg-white cursor-ew-resize drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ left: `${position}%` }}
            >
              {/* Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/20 backdrop-blur-xl border border-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] transform transition-transform hover:scale-110 active:scale-95 group-hover:bg-white/10">
                <div className="flex items-center gap-0.5">
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Handwritten-style instruction tip below */}
          <div className="absolute -bottom-14 left-[45%] flex items-start opacity-70 pointer-events-none hidden md:flex">
            <svg width="30" height="30" viewBox="0 0 100 100" fill="none" className="text-white/60 transform rotate-[-45deg] scale-y-[-1] mt-2 translate-y-2">
              <path d="M70,80 Q40,90 20,50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M20,50 L15,65 M20,50 L35,45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <span className="font-serif italic text-white text-lg ml-2 transform translate-y-6">Drag to compare</span>
          </div>

        </motion.div>

        {/* Features / Details Bottom Strip */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 max-w-5xl mx-auto pt-8 md:pt-16 pb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="p-3 rounded-xl border border-white/10 shrink-0 h-fit w-fit flex items-center justify-center">
              <Stars className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1 mt-1 md:mt-0">
              <h4 className="text-[10px] uppercase tracking-widest text-[#d4d4d8] font-bold">Signature Grade</h4>
              <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-[200px]">Artistic enhancements in every detail</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="p-3 rounded-xl border border-white/10 shrink-0 h-fit w-fit flex items-center justify-center">
              <span className="text-white font-bold text-[10px] uppercase tracking-widest px-1">HD</span>
            </div>
            <div className="space-y-1 mt-1 md:mt-0">
              <h4 className="text-[10px] uppercase tracking-widest text-[#d4d4d8] font-bold">Super Resolution</h4>
              <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-[200px]">Crisp, clear & high resolution</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="p-3 rounded-xl border border-white/10 shrink-0 h-fit w-fit flex items-center justify-center">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1 mt-1 md:mt-0">
              <h4 className="text-[10px] uppercase tracking-widest text-[#d4d4d8] font-bold">Vibrant Colors</h4>
              <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-[200px]">True-to-life colors that pop</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="p-3 rounded-xl border border-white/10 shrink-0 h-fit w-fit flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </div>
            <div className="space-y-1 mt-1 md:mt-0">
              <h4 className="text-[10px] uppercase tracking-widest text-[#d4d4d8] font-bold">Perfect Lighting</h4>
              <p className="text-[#a1a1aa] text-xs leading-relaxed max-w-[200px]">Balanced lighting for stunning results</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
