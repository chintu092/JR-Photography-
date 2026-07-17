import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  id?: string;
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  watermark?: boolean;
  style?: React.CSSProperties | any;
  sizes?: string;
}

// Utility to optimize Unsplash URLs to use WebP format with custom width
function optimizeUnsplashUrl(url: string, width?: number): string {
  if (!url || !url.includes("images.unsplash.com")) return url;
  
  try {
    const [base, queryString] = url.split("?");
    const params = new URLSearchParams(queryString || "");
    
    params.set("auto", "format");
    params.set("fm", "webp");
    
    if (width) {
      params.set("w", width.toString());
    }
    
    if (!params.has("q")) {
      params.set("q", "80");
    }
    
    return `${base}?${params.toString()}`;
  } catch (err) {
    return url;
  }
}

// Utility to generate responsive srcSet sizes for Unsplash images
function generateUnsplashSrcSet(url: string): string {
  if (!url || !url.includes("images.unsplash.com")) return "";
  
  const widths = [400, 800, 1200, 1600, 2000];
  return widths
    .map((w) => `${optimizeUnsplashUrl(url, w)} ${w}w`)
    .join(", ");
}

export default function LazyImage({ 
  id, 
  src, 
  alt, 
  className, 
  containerClassName, 
  watermark = false, 
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  ...props 
}: LazyImageProps) {
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, load immediately
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "200px", // Trigger slightly before it enters viewport for smooth user experience
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const isUnsplash = src && src.includes("images.unsplash.com");
  const optimizedSrc = isUnsplash ? optimizeUnsplashUrl(src) : src;
  const computedSrcSet = isUnsplash ? generateUnsplashSrcSet(src) : undefined;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName || ""}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 animate-pulse"
          />
        )}
      </AnimatePresence>
      
      {inView && (
        <motion.img
          id={id}
          src={optimizedSrc}
          srcSet={computedSrcSet}
          sizes={isUnsplash ? sizes : undefined}
          alt={alt}
          className={`${className || ""} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          initial={{ scale: 1.05 }}
          animate={{ scale: loaded ? 1 : 1.05 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          referrerPolicy="no-referrer"
          loading="lazy"
          draggable={false}
          {...props}
        />
      )}
      
      {watermark && loaded && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
          <Logo variant="monogram" className="w-24 h-24 md:w-32 md:h-32 text-white -rotate-12 select-none" />
        </div>
      )}
    </div>
  );
}
