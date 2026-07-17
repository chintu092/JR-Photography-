import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Twitter, Dribbble, Instagram, Camera, Sparkles } from "lucide-react";
import { audioService } from "../utils/audio";
import LazyImage from "./LazyImage";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Founder() {
  const [data, setData] = useState({
    title: "The Founder",
    badge: "MEET THE CREATIVE DIRECTOR",
    bgName: "Meet Jayanta",
    description: "Jayanta Roy is a fine-art photographer and visual system architect focused on crafting bold, functional photographic legacies. He collaborates with elite fashion houses, editorial agencies, and selective matrimonial clients to balance absolute classic analog depth with micro-precision color science. Based in Kolkata, he experiments daily with medium format sensor dynamics in our master studio.",
    avatar: "/assets/image/Founder/profile.jpg",
    sealText: "WINNING DESIGNER • SINCE 2011 •",
    twitter: "https://twitter.com",
    dribbble: "https://dribbble.com",
    instagram: "https://instagram.com",
    experiences: [
      { role: "Founder at JR Studio", years: "2024-Now" },
      { role: "Creative Director at Leica Labs", years: "2018-2024" },
      { role: "Lead Editorialist at Vogue Paris", years: "2015-2018" },
      { role: "Associate Photographer at Condé Nast", years: "2011-2015" }
    ]
  });

  useEffect(() => {
    async function fetchFounder() {
      try {
        const snap = await getDoc(doc(db, "settings", "founder"));
        if (snap.exists()) {
          const fetched = snap.data();
          setData(prev => ({
            ...prev,
            ...fetched
          }));
        }
      } catch (error) {
        console.error("Error fetching founder settings:", error);
      }
    }
    fetchFounder();
  }, []);

  const handleHover = () => {
    audioService.playWhoosh();
  };

  const handleInteract = () => {
    audioService.playClick();
  };

  return (
    <section className="relative py-28 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5">
      
      {/* Giant ambient background tracking heading matched with mockup */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[9vw] sm:text-[10vw] font-display font-extrabold text-[#ffffff]/[0.02] select-none uppercase tracking-[0.4em] whitespace-nowrap z-0 pointer-events-none text-center">
        {data.bgName}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Portrait Frame with award badge and hover triggers */}
          <div className="md:col-span-6 flex justify-center order-2 md:order-1">
            <motion.div 
              className="relative aspect-[4/5] w-full max-w-[420px] rounded-[36px] overflow-hidden bg-luxury-charcoal shadow-2xl group border border-white/5"
              initial={{ opacity: 0, y: 50, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Background gradient glowing behind portrait */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/30 via-luxury-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-10 mix-blend-color-add pointer-events-none" />

              {/* Founder Image */}
              <LazyImage
                src={data.avatar}
                alt="Jayanta Roy Founder"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1200ms] ease-out brightness-95 group-hover:scale-[1.03]"
                containerClassName="w-full h-full"
              />

              {/* Soft overlay gradient mimicking warm orange/red lighting in mockup split tone */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none z-10" />

              {/* Floating Social Media Icons at bottom-left */}
              <div className="absolute bottom-8 left-8 flex space-x-3.5 z-20">
                <a
                  href={data.twitter}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleInteract}
                  onMouseEnter={handleHover}
                  className="p-3 rounded-full bg-luxury-black/80 backdrop-blur-md text-luxury-cream border border-white/10 hover:bg-luxury-gold hover:text-luxury-black hover:border-transparent transition-all duration-300"
                  aria-label="Twitter X link"
                  id="founder-sm-tw"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={data.dribbble}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleInteract}
                  onMouseEnter={handleHover}
                  className="p-3 rounded-full bg-luxury-black/80 backdrop-blur-md text-luxury-cream border border-white/10 hover:bg-luxury-gold hover:text-luxury-black hover:border-transparent transition-all duration-300"
                  aria-label="Dribbble link"
                  id="founder-sm-db"
                >
                  <Dribbble className="w-4 h-4" />
                </a>
                <a
                  href={data.instagram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleInteract}
                  onMouseEnter={handleHover}
                  className="p-3 rounded-full bg-luxury-black/80 backdrop-blur-md text-luxury-cream border border-white/10 hover:bg-luxury-gold hover:text-luxury-black hover:border-transparent transition-all duration-300"
                  aria-label="Instagram link"
                  id="founder-sm-ig"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>

              {/* Floating Award Rotating Badge in corner */}
              <div className="absolute bottom-6 right-6 z-20 select-none bg-luxury-black/90 border border-white/10 p-2 rounded-full shadow-lg shadow-black/50 backdrop-blur-sm group-hover:border-luxury-gold/40 transition-colors duration-500">
                <div className="relative w-22 h-22 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-22 h-22 animate-[spin_12s_linear_infinite]" id="founder-seal-svg">
                    <defs>
                      <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
                    </defs>
                    <text fill="var(--luxury-gold)" fontSize="8.5" className="font-mono uppercase font-bold tracking-[0.25em]">
                      <textPath href="#circlePath" startOffset="0%">
                        {data.sealText}
                      </textPath>
                    </text>
                  </svg>
                  
                  {/* Central premium camera icon inside badge */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#181d17] border border-white/5 flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-luxury-gold" />
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>

          {/* Right Column: Founder Info details and corporate milestones */}
          <div className="md:col-span-6 text-left space-y-8 order-1 md:order-2">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[9px] font-mono tracking-[0.45em] text-luxury-gold uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{data.badge}</span>
              </div>
              <h2 className="font-display font-medium text-4xl sm:text-5xl text-luxury-cream leading-none uppercase tracking-tight">
                {data.title}
              </h2>
            </div>

            <motion.p 
              className="text-sm sm:text-[15px] text-luxury-gray leading-relaxed font-light"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {data.description}
            </motion.p>

            {/* Subtle Divider */}
            <div className="w-full h-[1px] bg-white/10" />

            {/* Timeline Milestones list matching the mockup mockup */}
            <div className="space-y-5">
              {data.experiences.map((exp, idx) => (
                <motion.div 
                  key={idx}
                  className="flex justify-between items-center group/item cursor-default border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * idx, duration: 0.5 }}
                  onMouseEnter={handleHover}
                >
                  <span className="text-xs font-sans text-luxury-cream/80 group-hover/item:text-luxury-gold group-hover/item:translate-x-1.5 transition-all duration-300 font-medium">
                    {exp.role}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover/item:text-luxury-cream tracking-widest transition-colors duration-300 font-light">
                    {exp.years}
                  </span>
                </motion.div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
