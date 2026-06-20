import React, { useState } from "react";

interface LogoProps {
  variant?: "icon" | "full" | "monogram";
  className?: string;
  glow?: boolean;
  src?: string | null;
  brandTextLine1?: string;
  brandTextLine2?: string;
}

export default function Logo({ 
  variant = "full", 
  className = "w-48 h-auto", 
  glow = false, 
  src = null,
  brandTextLine1 = "JR",
  brandTextLine2 = "PHOTOGRAPHY"
}: LogoProps) {
  const [hasError, setHasError] = useState(false);

  // If we have a custom source from dynamic settings or local asset
  const logoSrc = src || (hasError ? null : "/assets/image/Logo/site_logo.png");

  if (logoSrc) {
    if (variant === "monogram") {
      return (
        <img
          src={logoSrc}
          alt="JR Monogram"
          onError={() => setHasError(true)}
          className={`${className} object-contain ${glow ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]" : ""}`}
          referrerPolicy="no-referrer"
        />
      );
    }

    if (variant === "icon") {
      return (
        <div className="flex items-center space-x-3 select-none">
          <img
            src={logoSrc}
            alt="JR Logo Icon"
            onError={() => setHasError(true)}
            className="w-12 h-12 md:w-14 md:h-14 object-contain transition-all duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col -space-y-0.5 border-l border-white/15 pl-3">
            <span className="text-[12px] md:text-[13px] font-sans font-bold tracking-[0.3em] text-luxury-cream uppercase leading-none">
              {brandTextLine1}
            </span>
            <span className="text-[8px] md:text-[8.5px] font-sans font-medium tracking-[0.18em] text-luxury-gold uppercase leading-none mt-1">
              {brandTextLine2}
            </span>
          </div>
        </div>
      );
    }

    // Default 'full' variant utilizing the new image asset
    return (
      <div className="flex flex-col items-center justify-center select-none">
        <img
          src={logoSrc}
          alt="JR Photography Full Logo"
          onError={() => setHasError(true)}
          className={`${className} object-contain h-auto ${glow ? "drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" : ""}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback to beautiful bespoke vector SVGs if the custom site_logo.png is empty, missing, or fails to fetch
  if (variant === "monogram") {
    // Elegant interlocking JR monogram alone
    return (
      <svg
        viewBox="0 0 280 250"
        className={`${className} ${glow ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="currentColor">
          {/* Main J Letter */}
          <text
            x="40"
            y="180"
            fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
            fontWeight="300"
            fontSize="180"
            opacity="0.95"
          >
            J
          </text>
          {/* Interlocking R Letter */}
          <text
            x="130"
            y="215"
            fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
            fontStyle="italic"
            fontWeight="300"
            fontSize="150"
            opacity="0.95"
          >
            R
          </text>
        </g>
      </svg>
    );
  }

  if (variant === "icon") {
    // Highly compact elegant micro logo
    return (
      <div className="flex items-center space-x-3 select-none">
        <svg
          viewBox="0 0 160 120"
          className="w-14 h-11 text-luxury-cream fill-current transition-all duration-300 group-hover:scale-105"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text
            x="10"
            y="95"
            fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
            fontWeight="300"
            fontSize="115"
          >
            J
          </text>
          <text
            x="70"
            y="110"
            fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
            fontStyle="italic"
            fontWeight="300"
            fontSize="85"
          >
            R
          </text>
        </svg>
        <div className="flex flex-col -space-y-0.5 border-l border-white/15 pl-3">
          <span className="text-[12px] md:text-[13px] font-sans font-bold tracking-[0.3em] text-white uppercase leading-none">
            {brandTextLine1}
          </span>
          <span className="text-[8px] md:text-[8.5px] font-sans font-medium tracking-[0.18em] text-luxury-gold uppercase leading-none mt-1">
            {brandTextLine2}
          </span>
        </div>
      </div>
    );
  }

  // Full original majestic logo structure with interlocking letters, flanking lines, stacked side-text, and bottom motto
  return (
    <svg
      viewBox="0 0 420 580"
      className={`${className} ${glow ? "drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" : ""} text-inherit transition-all duration-300`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor">
        {/* Flanking luxury line accents on top */}
        <line
          x1="120"
          y1="105"
          x2="170"
          y2="105"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        <line
          x1="240"
          y1="105"
          x2="290"
          y2="105"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />

        {/* Big overlapping Serif J */}
        <text
          x="35"
          y="380"
          fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
          fontWeight="200"
          fontSize="350"
          opacity="0.95"
        >
          J
        </text>

        {/* Elegant italic Serif R overlapping J and shifted down-right */}
        <text
          x="220"
          y="450"
          fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
          fontStyle="italic"
          fontWeight="300"
          fontSize="230"
          opacity="1"
        >
          R
        </text>

        {/* Stacked Vertical Column: "P H O T O G R A P H Y  &  F I L M S" */}
        <text
          x="350"
          y="90"
          fontFamily="'Inter', 'Epilogue', sans-serif"
          fontWeight="300"
          fontSize="10"
          letterSpacing="0"
          opacity="0.85"
        >
          <tspan x="360" dy="0">P</tspan>
          <tspan x="360" dy="17">H</tspan>
          <tspan x="360" dy="17">O</tspan>
          <tspan x="360" dy="17">T</tspan>
          <tspan x="360" dy="17">O</tspan>
          <tspan x="360" dy="17">G</tspan>
          <tspan x="360" dy="17">R</tspan>
          <tspan x="360" dy="17">A</tspan>
          <tspan x="360" dy="17">P</tspan>
          <tspan x="360" dy="17">H</tspan>
          <tspan x="360" dy="17">Y</tspan>
          
          <tspan x="358" dy="21" fontSize="9" opacity="0.6">&amp;</tspan>
          
          <tspan x="360" dy="21">F</tspan>
          <tspan x="360" dy="17">I</tspan>
          <tspan x="360" dy="17">L</tspan>
          <tspan x="360" dy="17">M</tspan>
          <tspan x="360" dy="17">S</tspan>
        </text>

        {/* Bottom Banner motto: "BEAUTY BEYOND IMAGINATION" */}
        <text
          x="208"
          y="500"
          textAnchor="middle"
          fontFamily="'Playfair Display', 'Didot', 'Georgia', serif"
          fontWeight="400"
          fontSize="15"
          letterSpacing="12"
          opacity="0.9"
        >
          BEAUTY BEYOND IMAGINATION
        </text>
      </g>
    </svg>
  );
}

