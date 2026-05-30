import React, { useState, useEffect } from "react";
import { ArrowUp, Camera, Compass, Volume2, VolumeX, Instagram, Twitter, Dribbble } from "lucide-react";
import { audioService } from "../utils/audio";
import Logo from "./Logo";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    setAudioEnabled(audioService.isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioService.setSoundEnabled(newState);
    if (newState) {
      setTimeout(() => {
        audioService.playClick();
      }, 50);
    }
  };

  const scrollToTop = () => {
    audioService.playClick();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLinkClick = (pageId: string) => {
    audioService.playClick();
    onNavigate(pageId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHover = () => {
    audioService.playWhoosh();
  };

  return (
    <footer className="relative bg-[#000] text-luxury-cream border-t border-white/5 py-16 md:py-24 px-6 md:px-12 select-none">
      
      {/* Footer Grid links */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 md:pb-24 border-b border-white/5 relative z-10">
        
        {/* Column 1: Core logo, brand summary, and Sound control switcher */}
        <div className="md:col-span-4 space-y-6">
          <div className="flex items-center">
            <Logo variant="icon" />
          </div>
          <p className="text-xs text-luxury-gray leading-relaxed font-light max-w-sm">
            Operational center orchestrating fine-art photography, luxury digital grading, and certified ancestral museum prints globally. Focused entirely on minimalist, atmospheric dark prestige.
          </p>
          
          <div className="flex items-center space-x-6">
            <div className="text-[10px] font-mono tracking-widest text-[#555] uppercase flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-luxury-gold" />
              <span>HQ Milan • Residence Paris</span>
            </div>
          </div>

          {/* Premium Audio Control Switcher */}
          <div className="pt-4">
            <button
              onClick={toggleSound}
              onMouseEnter={handleHover}
              className={`inline-flex items-center space-x-3 px-4 py-2 border rounded-full transition-all duration-300 text-[10px] font-mono tracking-widest uppercase cursor-pointer ${
                audioEnabled
                  ? "bg-[#B7BE43]/15 text-[#B7BE43] border-[#B7BE43]/30 hover:bg-[#B7BE43]/25"
                  : "bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10"
              }`}
              id="footer-audio-toggle-btn"
              title="Toggle audio feedback"
            >
              {audioEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-[#B7BE43]" />
                  <span>AUDIO DESIGN: ACTIVE</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                  <span>AUDIO DESIGN: MUTED</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Column 2: Directory */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-mono tracking-[0.25em] text-[#B7BE43] uppercase border-b border-white/5 pb-2 font-bold">
            DIRECTORY
          </h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs font-light text-luxury-gray">
            <li>
              <button
                onClick={() => handleLinkClick("home")}
                onMouseEnter={handleHover}
                className="hover:text-[#B7BE43] transition-colors border-none bg-transparent cursor-pointer text-left font-sans block"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick("about")}
                onMouseEnter={handleHover}
                className="hover:text-[#B7BE43] transition-colors border-none bg-transparent cursor-pointer text-left font-sans block"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick("services")}
                onMouseEnter={handleHover}
                className="hover:text-[#B7BE43] transition-colors border-none bg-transparent cursor-pointer text-left font-sans block"
              >
                Services
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick("works")}
                onMouseEnter={handleHover}
                className="hover:text-[#B7BE43] transition-colors border-none bg-transparent cursor-pointer text-left font-sans block"
              >
                Archives
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick("blog")}
                onMouseEnter={handleHover}
                className="hover:text-[#B7BE43] transition-colors border-none bg-transparent cursor-pointer text-left font-sans block"
              >
                Blog Publications
              </button>
            </li>
            <li>
              <button
                onClick={() => handleLinkClick("contact")}
                onMouseEnter={handleHover}
                className="hover:text-[#B7BE43] transition-colors border-none bg-transparent cursor-pointer text-left font-sans block"
              >
                Inquire Now
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Communication */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-[10px] font-mono tracking-[0.25em] text-[#B7BE43] uppercase border-b border-white/5 pb-2 font-bold">
            INQUIRY SATELLITES
          </h4>
          <ul className="space-y-4 text-xs font-light text-luxury-gray text-left">
            <li className="flex flex-col">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">COMMERCIAL & BRANDS:</span>
              <a href="mailto:vogue-editorial@jrphotography.com" onMouseEnter={handleHover} className="hover:text-[#B7BE43] transition-colors">
                vogue-editorial@jrphotography.com
              </a>
            </li>
            <li className="flex flex-col">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">WEDDINGS & PRIVATE CODES:</span>
              <a href="mailto:private-villa@jrphotography.com" onMouseEnter={handleHover} className="hover:text-[#B7BE43] transition-colors">
                private-villa@jrphotography.com
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Ascend Button */}
        <div className="md:col-span-2 flex justify-start md:justify-end items-start pt-2">
          <button
            onClick={scrollToTop}
            onMouseEnter={handleHover}
            className="group flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-[#B7BE43] text-[#B7BE43] hover:text-luxury-black border border-white/5 rounded-full transition-all duration-500 hover:shadow-lg hover:shadow-[#B7BE43]/5 cursor-pointer"
            aria-label="Back to top"
            id="footer-scroll-to-top-btn"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            <span className="text-[8px] font-mono tracking-widest mt-1.5 hidden md:block">ASCEND</span>
          </button>
        </div>

      </div>

      {/* Large decorative logo */}
      <div className="max-w-7xl mx-auto py-12 select-none opacity-[0.03] border-b border-white/5 flex justify-center">
        <div className="w-48 md:w-64">
          <Logo variant="full" />
        </div>
      </div>

      {/* Copyrights & credits bottom */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-zinc-600 gap-4">
        
        <div className="flex items-center space-x-2">
          <span>© 2026 JR PHOTOGRAPHY STUDIO. All rights reserved globally.</span>
        </div>

        <div className="flex items-center space-x-6 text-zinc-500 font-bold uppercase tracking-wider">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" onMouseEnter={handleHover} className="hover:text-[#B7BE43] flex items-center space-x-1">
            <Instagram className="w-3.5 h-3.5" />
            <span>INSTAGRAM</span>
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" onMouseEnter={handleHover} className="hover:text-[#B7BE43] flex items-center space-x-1">
            <Twitter className="w-3.5 h-3.5" />
            <span>TWITTER</span>
          </a>
          <a href="https://dribbble.com" target="_blank" rel="noreferrer" onMouseEnter={handleHover} className="hover:text-[#B7BE43] flex items-center space-x-1">
            <ZeroDribbble className="hidden" />
            <Dribbble className="w-3.5 h-3.5" />
            <span>DRIBBBLE</span>
          </a>
        </div>

      </div>
    </footer>
  );
}

// Minimal placeholder component to satisfy linter if required for any unused logic exports
function ZeroDribbble() {
  return null;
}
