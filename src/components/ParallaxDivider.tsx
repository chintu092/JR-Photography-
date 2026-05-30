import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Camera, Compass } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface ParallaxDividerProps {
  image: string;
  pretitle: string;
  title: string;
  highlightedText: string;
  description?: string;
  alignment?: "left" | "center" | "right";
  height?: "screen" | "large" | "medium";
}

export default function ParallaxDivider({
  image,
  pretitle,
  title,
  highlightedText,
  description,
  alignment = "center",
  height = "large",
}: ParallaxDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Elegant floating text parallax effect specifically for the layout content
    const ctx = gsap.context(() => {
      if (textRef.current && containerRef.current) {
        gsap.fromTo(
          textRef.current,
          { y: 50, opacity: 0.8 },
          {
            y: -50,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Compute height styling
  const heightClasses = {
    screen: "h-screen min-h-[600px] md:min-h-[800px]",
    large: "h-[80vh] min-h-[500px] md:min-h-[700px]",
    medium: "h-[55vh] min-h-[350px] md:min-h-[500px]",
  };

  // Alignments
  const alignmentClasses = {
    left: "text-left items-start md:pl-20 max-w-2xl mr-auto",
    center: "text-center items-center justify-center max-w-4xl mx-auto",
    right: "text-left md:text-right items-start md:items-end md:pr-20 max-w-2xl ml-auto",
  };

  return (
    <div
      ref={containerRef}
      className={`parallax-bg-wrapper relative w-full ${heightClasses[height]} overflow-hidden flex items-center justify-center px-6 md:px-12 border-0`}
    >
      {/* Absolute Parallaxed Deep Background Image (rendered larger to permit travel space) */}
      <div
        className="parallax-bg absolute -top-[12%] left-0 w-full h-[124%] bg-cover bg-center grayscale contrast-110 brightness-75 transition-all duration-300"
        style={{ backgroundImage: `url(${image})` }}
      />

      {/* Luxury Cinematic Gradient Mapping Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/90 via-luxury-black/35 to-luxury-black/95 z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-luxury-black/80 via-transparent to-luxury-black/80 z-0" />
      
      {/* Subtle decorative target reticle element to add fine-art visual complexity */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
        <div className="w-96 h-96 border border-white/5 rounded-full flex items-center justify-center animate-[spin_120s_linear_infinite]">
          <div className="w-80 h-80 border border-white/5 border-dashed rounded-full" />
        </div>
      </div>

      {/* Floating Interactive Content */}
      <div
        ref={textRef}
        className={`relative z-10 w-full flex flex-col space-y-6 ${alignmentClasses[alignment]}`}
      >
        {/* Pretitle Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono tracking-[0.4em] text-luxury-gold uppercase">
          <Camera className="w-3.5 h-3.5" />
          <span>{pretitle}</span>
        </div>

        {/* Major Split Serif Title */}
        <h2 className="font-display font-medium text-4xl sm:text-6xl md:text-7xl leading-[1.08] text-luxury-cream tracking-wide uppercase select-none">
          {title} <br className="hidden sm:inline" />
          <span className="font-serif italic font-light text-luxury-gold tracking-normal text-3xl sm:text-5xl md:text-6xl normal-case pl-1 block sm:inline">
            {highlightedText}
          </span>
        </h2>

        {/* Optional Elegant Sub-description */}
        {description && (
          <p className="text-xs sm:text-sm text-[#eee] max-w-md font-light leading-relaxed tracking-wide drop-shadow-md">
            {description}
          </p>
        )}

        {/* Small horizontal luxury bar accent */}
        <div className="w-16 h-[1px] bg-luxury-gold/50" />

        {/* Coordinate indicator line */}
        <div className="flex items-center space-x-2 text-[8px] font-mono tracking-widest text-[#555] uppercase">
          <Compass className="w-3 h-3 text-luxury-gold/60" />
          <span>JR ARCHIVES</span>
          <span>•</span>
          <span>EST. 2011</span>
          <span>•</span>
          <span>Nº 48.8566 E 2.3522</span>
        </div>
      </div>
    </div>
  );
}
