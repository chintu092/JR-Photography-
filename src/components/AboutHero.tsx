import React from "react";
import { motion } from "motion/react";
import LazyImage from "./LazyImage";

export default function AboutHero() {
  const slidingImages = [
    { src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600", rotate: -12, marginTop: "40px" },
    { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600", rotate: -4, marginTop: "-40px" },
    { src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600", rotate: 5, marginTop: "20px" },
    { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600", rotate: 15, marginTop: "60px" },
    { src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600", rotate: -8, marginTop: "-10px" },
    { src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600", rotate: 8, marginTop: "-30px" },
  ];

  const carouselItems = [...slidingImages, ...slidingImages, ...slidingImages];

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center pt-32 pb-24 overflow-hidden bg-[#0A0A0A] select-none border-b border-white/5 font-sans">
      
      {/* BACKGROUND CAROUSEL CARDS */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 flex items-start pt-16 sm:pt-24">
        <motion.div
          animate={{ x: ["0%", "-33.333333%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 sm:gap-16 w-max pl-8 sm:pl-16 relative"
        >
          {carouselItems.map((item, idx) => (
            <div
              key={`bg-card-${idx}`}
              className="relative w-[180px] sm:w-[220px] lg:w-[260px] aspect-[3/4] rounded-xl overflow-hidden opacity-50 sm:opacity-70 shrink-0"
              style={{ rotate: item.rotate, marginTop: item.marginTop }}
            >
              <img
                src={item.src}
                alt="Fashion"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
            </div>
          ))}
        </motion.div>

        {/* Global Bottom Gradient to fade backgrounds seamlessly */}
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent pointer-events-none" />
      </div>

      {/* PRIMARY TEXT & BUTTONS */}
      <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 relative z-10 space-y-6 mt-16 sm:mt-24">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-sans font-medium text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] tracking-tight max-w-4xl mx-auto drop-shadow-2xl"
        >
          Fashion content for every garment, body type, and channel
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg text-zinc-300 font-light leading-relaxed drop-shadow-lg"
        >
          Turn product shots into on-model fits, campaign heroes, lookbooks, PDP images, and paid social assets. No casting. No reshoots.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 w-full max-w-[600px] mx-auto"
        >
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "contact";
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.15em] uppercase px-8 py-3.5 rounded-full transition-colors cursor-pointer"
          >
            GET STARTED FREE
          </a>
          <a
            href="#works"
            onClick={(e) => {
              e.preventDefault();
              window.location.hash = "works";
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent border border-[#b6b335]/30 hover:border-[#b6b335] hover:bg-[#b6b335]/10 text-[#b6b335] font-mono text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-bold px-8 py-3.5 rounded-full transition-colors cursor-pointer"
          >
            EXPLORE WORKFLOWS <span className="ml-2 font-normal">→</span>
          </a>
        </motion.div>
      </div>

    </section>
  );
}

