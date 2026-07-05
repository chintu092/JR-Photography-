import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Volume2, 
  VolumeX, 
  Instagram, 
  Twitter, 
  Dribbble, 
  Loader2, 
  Mail, 
  X
} from "lucide-react";
import { audioService } from "../utils/audio";
import Logo from "./Logo";
import SEOSitemap from "./SEOSitemap";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface NavItem {
  id: string; // internal id for drag/drop or mapping
  label: string;
  actionId: string; // The page ID or URL
  isExternal?: boolean;
}

interface FooterProps {
  onNavigate: (page: string) => void;
  logoUrl?: string | null;
  exploreConfig?: NavItem[];
  legalConfig?: NavItem[];
  copyrightText?: string;
}

export default function Footer({ onNavigate, logoUrl = null, exploreConfig, legalConfig, copyrightText }: FooterProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    setAudioEnabled(audioService.isSoundEnabled());
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    
    setIsSubmitting(true);
    setSubscribeStatus("idle");
    audioService.playClick();
    
    try {
      await addDoc(collection(db, "subscribers"), {
        email,
        subscribedAt: serverTimestamp(),
      });
      setSubscribeStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
      setSubscribeStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleLinkClick = (pageId: string) => {
    audioService.playClick();
    onNavigate(pageId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHover = () => {
    audioService.playWhoosh();
  };

  return (
    <footer className="w-full bg-[#0a0a0a] text-zinc-400 font-sans border-t border-white/5 py-12 md:py-20 px-6 md:px-12 select-none relative z-10">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16 border-b border-white/5">
          
          {/* Brand & Description (4 cols) border-r on md */}
          <div className="md:col-span-4 flex flex-col items-start md:pr-12 md:border-r border-white/5 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col items-start w-24">
                <Logo variant="icon" src={logoUrl} />
                <div className="mt-4 text-[10.5px] tracking-[0.2em] text-[#b6b335] font-mono uppercase font-bold w-full text-center">
                  Photography
                </div>
              </div>
              
              <p className="text-[13px] leading-relaxed text-zinc-400 font-light pt-2">
                Operational center orchestrating fine-art photography, luxury digital grading, and certified ancestral museum prints globally. Focused entirely on minimalist, atmospheric dark prestige.
              </p>
            </div>

            <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 flex items-center space-x-2 pt-4">
              <MapPin className="w-3.5 h-3.5 text-[#b6b335]" />
              <span>Kolkata, India • Operating Worldwide</span>
            </div>
          </div>

          {/* Explore Menu (2 cols) */}
          <div className="md:col-span-2 md:pl-8 flex flex-col space-y-8 mt-2 md:mt-0">
            <h4 className="text-[11px] font-mono tracking-[0.2em] text-[#b6b335] uppercase font-bold">Explore</h4>
            <ul className="space-y-5 text-[13px] text-zinc-300 font-light">
              {(exploreConfig !== undefined ? exploreConfig : [
                { id: "e1", actionId: "home", label: "Home" },
                { id: "e2", actionId: "about", label: "About" },
                { id: "e3", actionId: "services", label: "Services" },
                { id: "e4", actionId: "works", label: "Archives" },
                { id: "e5", actionId: "blog", label: "Blog Publications" },
              ]).map((item) => (
                <li key={item.id}>
                  {item.isExternal ? (
                    <a href={item.actionId} target="_blank" rel="noreferrer" onMouseEnter={handleHover} className="hover:text-white transition-colors block">
                      {item.label}
                    </a>
                  ) : (
                    <button onClick={() => handleLinkClick(item.actionId)} onMouseEnter={handleHover} className="hover:text-white transition-colors block text-left">
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Menu (2 cols) */}
          <div className="md:col-span-2 md:pl-4 flex flex-col space-y-8 mt-2 md:mt-0">
            <h4 className="text-[11px] font-mono tracking-[0.2em] text-[#b6b335] uppercase font-bold">Legal</h4>
            <ul className="space-y-5 text-[13px] text-zinc-300 font-light">
              {(legalConfig !== undefined ? legalConfig : [
                { id: "l1", actionId: "#", label: "Privacy Policy", isExternal: true },
                { id: "l2", actionId: "#", label: "Terms of Service", isExternal: true },
                { id: "l3", actionId: "#", label: "Returns & Refunds", isExternal: true },
              ]).map((item) => (
                <li key={item.id}>
                  {item.isExternal ? (
                    <a href={item.actionId} target={item.actionId !== "#" ? "_blank" : undefined} rel="noreferrer" onMouseEnter={handleHover} className="hover:text-white transition-colors block">
                      {item.label}
                    </a>
                  ) : (
                    <button onClick={() => handleLinkClick(item.actionId)} onMouseEnter={handleHover} className="hover:text-white transition-colors block text-left">
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Inquiries (4 cols) */}
          <div className="md:col-span-4 md:pl-6 flex flex-col space-y-8 mt-2 md:mt-0">
            <h4 className="text-[11px] font-mono tracking-[0.2em] text-[#b6b335] uppercase font-bold">Inquiries</h4>
            <div className="space-y-8 text-sm font-light">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-zinc-500 mb-2.5">Commercial & Brands</div>
                <a href="mailto:vogue-editorial@jrphotography.com" onMouseEnter={handleHover} className="text-[13px] text-zinc-300 hover:text-white transition-colors block">vogue-editorial@jrphotography.com</a>
              </div>
              <div>
                <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-zinc-500 mb-2.5">Weddings & Private Clients</div>
                <a href="mailto:private-villa@jrphotography.com" onMouseEnter={handleHover} className="text-[13px] text-zinc-300 hover:text-white transition-colors block">private-villa@jrphotography.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION - Audio Toggle */}
        <div className="border border-white/5 rounded-full px-6 py-5 flex flex-col md:flex-row items-center justify-between bg-[#0b0a11] gap-4">
          <div className="flex items-center space-x-6">
            <div className="w-10 h-10 rounded-full bg-[#18171d] flex items-center justify-center shadow-inner shadow-black/40">
              {audioEnabled ? <Volume2 className="w-4 h-4 text-[#b6b335]" /> : <VolumeX className="w-4 h-4 text-[#b6b335]" />}
            </div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#b6b335] uppercase font-bold">
              Audio Design: {audioEnabled ? "Active" : "Muted"}
            </span>
          </div>
          <button 
            onClick={toggleSound}
            onMouseEnter={handleHover}
            className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.1em] text-zinc-500 hover:text-white uppercase transition-colors px-2 cursor-pointer"
          >
            <span>{audioEnabled ? "Turn Off" : "Turn On"}</span>
            <X className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* LOWER SECTION - Subscribe */}
        <div className="bg-[#0b0a11] border border-white/5 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 mt-6">
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 rounded-full bg-[#18171d] flex items-center justify-center shrink-0 border border-white/5 shadow-inner shadow-black/40">
              <Mail className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <h4 className="text-[10px] sm:text-[11px] font-mono tracking-[0.15em] text-[#b6b335] uppercase font-bold mb-2">Subscribe for Archives & Exclusives</h4>
              <p className="text-[13px] text-zinc-400 font-light">Curated updates on works, prints, and releases.</p>
            </div>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:max-w-[380px] relative flex shadow-inner shadow-black/40 items-center bg-[#070609] border border-white/5 rounded-full focus-within:border-white/15 transition-all h-14 pr-1.5 pl-6">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              disabled={isSubmitting || subscribeStatus === "success"}
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-zinc-600 outline-none w-full h-full"
              required
            />
            <button 
              type="submit" 
              disabled={isSubmitting || subscribeStatus === "success" || !email}
              className="bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono text-[10px] font-bold tracking-[0.15em] uppercase px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : subscribeStatus === "success" ? "Subscribed" : "Subscribe"}
            </button>
          </form>
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-zinc-500 tracking-[0.1em] uppercase border-t border-white/5 mt-10">
          <div className="mb-6 md:mb-0 flex items-center relative group">
            <span>
              {(copyrightText || "© {YYYY} JR Photography Studio. All rights reserved globally.")
                .replace("2026", new Date().getFullYear().toString())
                .replace("{YYYY}", new Date().getFullYear().toString())}
            </span>
            <button 
              onClick={() => handleLinkClick("admin")} 
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Admin Portal"
            ></button>
          </div>
          <div className="flex items-center space-x-6 text-[#9a9a9a]">
            <a href="#" onMouseEnter={handleHover} className="hover:text-white flex items-center space-x-2 transition-colors">
              <Instagram className="w-4 h-4" />
              <span>Instagram</span>
            </a>
            <div className="w-px h-3 bg-white/10"></div>
            <a href="#" onMouseEnter={handleHover} className="hover:text-white flex items-center space-x-2 transition-colors">
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </a>
            <div className="w-px h-3 bg-white/10"></div>
            <a href="#" onMouseEnter={handleHover} className="hover:text-white flex items-center space-x-2 transition-colors">
              <Dribbble className="w-4 h-4" />
              <span>Dribbble</span>
            </a>
          </div>
        </div>
      </div>
      <SEOSitemap />
    </footer>
  );
}
