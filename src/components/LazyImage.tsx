import React, { useState } from "react";
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
}

export default function LazyImage({ id, src, alt, className, containerClassName, watermark = false, ...props }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div 
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
      <motion.img
        id={id}
        src={src}
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
      {watermark && loaded && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 opacity-25 mix-blend-overlay">
          <Logo variant="monogram" className="w-24 h-24 md:w-32 md:h-32 text-white -rotate-12 select-none" />
        </div>
      )}
    </div>
  );
}
