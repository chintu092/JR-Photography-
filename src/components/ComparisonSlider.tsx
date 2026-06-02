import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

interface ComparisonSliderProps {
  beforeImg: string;
  afterImg: string;
  title: string;
  description: string;
}

export default function ComparisonSlider({ beforeImg, afterImg, title, description }: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isSliding, setIsSliding] = useState<boolean>(false);

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
    <section className="relative py-24 md:py-36 bg-luxury-black px-6 md:px-12 overflow-hidden">
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-luxury-cream uppercase tracking-wide">
            {title}
          </h2>
          <p className="text-sm text-luxury-gray max-w-2xl mx-auto leading-relaxed font-light">
            {description}
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-2.5">
            <SlidersHorizontal className="w-4 h-4 text-[#B7BE43]" />
            <span className="text-[10px] font-mono text-[#B7BE43] tracking-widest uppercase font-bold">
              COLOR SCIENCE RETOUCH LABORATORY
            </span>
          </div>

          <div 
            className="relative h-[300px] sm:h-[380px] md:h-[500px] w-full select-none overflow-hidden rounded-[28px] border border-white/5 cursor-ew-resize shadow-2xl"
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
                src={beforeImg}
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
      </div>
    </section>
  );
}
