import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Award, Eye, ShieldCheck, Globe, Sparkles, ArrowRight, MoveRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const [hoveredWidget, setHoveredWidget] = useState<number | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    
    const paragraphs = textRef.current.querySelectorAll("p");
    
    const tl = gsap.fromTo(paragraphs, 
      {
        y: 40,
        opacity: 0,
        filter: "blur(4px)" // Added slight blur for prestige aesthetic
      },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.9,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 85%", // Trigger when top of text block is 85% down viewport
          toggleActions: "play none none reverse",
        }
      }
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section id="about" className="relative py-20 sm:p-12 md:py-32 bg-luxury-black overflow-hidden px-4 sm:px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* LEFT PANEL: High-Contrast Editorial Glass Card */}
          <motion.div
            className="lg:col-span-6 bg-white/10 backdrop-blur-xl rounded-[40px] p-8 sm:p-12 flex flex-col justify-between border border-white/20 shadow-2xl relative overflow-hidden group min-h-[580px] lg:min-h-[640px]"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Subtle light grain overlay inside client card */}
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none rounded-[40px]" />
            
            <div className="space-y-8 relative z-10">
              {/* Pill Badge */}
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[9px] font-mono font-bold tracking-[0.25em] text-[#B7BE43] uppercase">
                  OUR PHILOSOPHY <span className="text-white">✦</span>
                </span>
              </div>

              {/* Giant Serif Editorial Headline */}
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white leading-[1.12] tracking-tight uppercase">
                WE DO NOT RECORD LIGHT. <br />
                <span className="font-serif italic text-[#B7BE43] font-normal normal-case block my-2">We sculpt it.</span>
                TO HARNESS THE EXTRAORDINARY.
              </h2>

              {/* Professional Paragraph Block */}
              <div ref={textRef} className="space-y-4 text-sm sm:text-[15px] text-zinc-300 leading-relaxed font-normal">
                <p>
                  Founded in 2011, JR Photography has evolved into an award-winning, premium photography agency, recognized as the best wedding photographer in Kolkata, operating all over India. We bring back your pleasant memories of your special day with utmost care.
                </p>
                <p>
                  We capture fine-art fashion, elite wedding stories, luxury pre-wedding shoots, and beautiful Bengali ceremonies. Our team frames every candid moment, then weaves the pictures magically to create a value for a lifetime, delivering cinematic reality instead of mechanical defaults.
                </p>
              </div>
            </div>

            {/* Action Buttons styled like Home */}
            <div className="flex flex-wrap items-center gap-6 pt-8 relative z-10">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase px-8 py-3.5 rounded-full transition-colors cursor-pointer"
              >
                Explore Archives
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-[#b6b335] hover:text-white font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase cursor-pointer transition-all duration-300 py-2 border-b border-[#b6b335]/30 hover:border-[#b6b335]"
              >
                Become a client
              </button>
            </div>
          </motion.div>

          {/* RIGHT PANEL: High-Fashion Flowing Gradient & Interactive Rigor Dashboard */}
          <motion.div
            className="lg:col-span-6 bg-gradient-to-tr from-[#1E5662] via-[#6D8E1B] to-[#3E4A18] rounded-[40px] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-center gap-6 relative overflow-hidden min-h-[580px] lg:min-h-[640px] shadow-2xl"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          >
            {/* Organic Fluid light pulses in background */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute -bottom-36 -right-36 w-96 h-96 bg-[#B7BE43]/20 rounded-full filter blur-[120px] animate-pulse" />
            <div className="absolute -top-36 -left-36 w-96 h-96 bg-[#1e5662]/30 rounded-full filter blur-[120px]" />

            {/* Center glass calibration card (Emulates the dialing core from sample image) */}
            <div className="w-full md:w-[260px] bg-white/10 backdrop-blur-xl rounded-[32px] p-6 flex flex-col justify-between border border-white/20 shadow-2xl relative z-10 hover:scale-[1.02] transition-transform duration-500">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B7BE43] inline-block animate-ping" />
                    LENS METRIC 
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#B7BE43]" />
                </div>

                {/* SVG Radial Calibration Dial Speedometer style */}
                <div className="relative flex flex-col items-center justify-center py-4">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <defs>
                        <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6D8E1B" />
                          <stop offset="100%" stopColor="#B7BE43" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="transparent"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="8"
                        strokeDasharray="230"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="transparent"
                        stroke="url(#dialGrad)"
                        strokeWidth="8"
                        strokeDasharray="230"
                        strokeDashoffset="12" /* Custom calibrated offset representing 95%+ precision index */
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
                      <span className="text-4xl font-display font-black text-white tracking-tight leading-none">98</span>
                      <span className="text-[7px] font-mono tracking-widest text-[#B7BE43] font-bold uppercase mt-1">RIGOR INDEX</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail calibrations rows */}
              <div className="space-y-3 pt-3 border-t border-white/10 text-[10px] sm:text-xs">
                <div className="flex justify-between items-center text-white/70">
                  <span>Focal Precision</span>
                  <span className="font-mono text-white font-bold">99.8%</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Color Fidelity</span>
                  <span className="font-mono text-white font-bold">100% Labs</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span>Archival Lifespan</span>
                  <span className="font-mono text-white font-bold">200+ Yrs</span>
                </div>
              </div>
            </div>

            {/* Vertical Stack List (Emulates Recession, Prediction, Base lists) */}
            <div className="w-full md:flex-1 flex flex-col gap-3.5 relative z-10">
              {[
                { 
                  val: "15+", 
                  lbl: "YEARS OF ESSENCE", 
                  desc: "Kolkata workshops",
                  ico: <ShieldCheck className="w-4 h-4 text-olive-green" /> 
                },
                { 
                  val: "500+", 
                  lbl: "HIGH-END COMMISSIONS", 
                  desc: "Selective fashion editorials",
                  ico: <Award className="w-4 h-4 text-olive-green" /> 
                },
                { 
                  val: "100+", 
                  lbl: "GLOBAL CLIENTS", 
                  desc: "Elite international vault",
                  ico: <Globe className="w-4 h-4 text-olive-green" /> 
                },
                { 
                  val: "35+", 
                  lbl: "ELITE TROPHIES", 
                  desc: "Global design certificates",
                  ico: <Eye className="w-4 h-4 text-olive-green" /> 
                }
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-luxury-black/90 rounded-[20px] p-4 flex items-center justify-between border border-white/5 shadow-md hover:border-white/20 transition-all duration-300"
                  onMouseEnter={() => setHoveredWidget(i)}
                  onMouseLeave={() => setHoveredWidget(null)}
                >
                  <div className="space-y-1">
                    <span className="text-[8px] font-mono tracking-widest text-[#999F94] uppercase block">
                      {stat.lbl}
                    </span>
                    <span className="text-xl sm:text-2xl font-display font-extrabold text-white leading-none">
                      {stat.val}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-500 block">
                      {stat.desc}
                    </span>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full min-h-[44px]">
                    <div className="p-1 px-1.5 rounded-md bg-white/5 text-[9px] font-mono text-[#B7BE43] leading-none">
                      {hoveredWidget === i ? "✦ LIVE" : "ACTIVE"}
                    </div>
                    <div className="opacity-70 group-hover:opacity-100 mt-2 transition-opacity duration-300">
                      {stat.ico}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>

          {/* BOTTOM PANEL: Photography Instruments / Gear */}
          <motion.div
            className="lg:col-span-12 bg-white/5 backdrop-blur-md rounded-[40px] p-8 sm:p-12 border border-white/10 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none rounded-[40px]" />
            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
              <div className="max-w-md xl:shrink-0">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[9px] font-mono font-bold tracking-[0.25em] text-[#B7BE43] uppercase mb-6">
                  THE ARSENAL <span className="text-white">✦</span>
                </span>
                <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight uppercase leading-tight mb-4">
                  Precision <br />
                  <span className="font-serif italic text-zinc-400 font-normal normal-case block my-1">Instruments</span>
                </h3>
                <p className="text-sm text-zinc-400 font-normal leading-relaxed">
                  We demand absolute technical rigor. Our primary toolset is meticulously curated to deliver uncompromising fidelity, dynamic range, and cinematic depth for large-scale editorial and luxury captures.
                </p>
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {[
                  { type: "Medium Format", gear: "Fujifilm GFX 100S", focus: "Studio & High-End Edits" },
                  { type: "Primary 35mm", gear: "Sony Alpha a7R V", focus: "Location & Speed" },
                  { type: "Prime Lenses", gear: "85mm f/1.4 GM", focus: "Cinematic Portraiture" },
                  { type: "Wide Angle", gear: "24-70mm f/2.8 GM II", focus: "Environmental Scope" },
                  { type: "Lighting", gear: "Profoto Pro-11", focus: "Precise Light Sculpting" },
                  { type: "Aerial", gear: "DJI Mavic 3 Cine", focus: "Grand Perspectives" },
                ].map((item, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:border-white/15 transition-all group">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] block mb-1 group-hover:text-zinc-400 transition-colors">{item.type}</span>
                    <h4 className="text-white font-display font-medium text-sm tracking-wide uppercase mb-4">{item.gear}</h4>
                    <span className="text-[9px] text-[#B7BE43] font-mono uppercase border border-[#B7BE43]/20 bg-[#B7BE43]/5 px-2 py-1 rounded inline-block">{item.focus}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

