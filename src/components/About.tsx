import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Eye, ShieldCheck, Globe, Camera, Cpu, Layers, Compass, Hourglass, ArrowRight } from "lucide-react";
import { audioService } from "../utils/audio";

const LABELS = [
  { id: "character", title: "Organic Character", subtitle: "01 / PRESERVATION", text: "We reject synthetic, over-smoothed digital files. Our workflows celebrate authentic high-contrast values, real organic medium-format texture, and uncompromised light response.", icon: <ShieldCheck className="w-5 h-5 text-luxury-gold" />, image: "https://images.unsplash.com/photo-1549064492-c416b7418968?auto=format&fit=crop&q=80&w=1000" },
  { id: "patience", title: "Calculated Patience", subtitle: "02 / COMPOSITION", text: "A landmark shot demands extraordinary commitment. We spend days analyzing geographic coordinates, atmospheric densities, and the specific behavior of local shadow currents.", icon: <Compass className="w-5 h-5 text-luxury-gold" />, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000" },
  { id: "permanence", title: "Enduring Archive", subtitle: "03 / HERITAGE", text: "Every proof undergoes meticulous custom color calibration. We finalize our works for high-end archival pigment prints designed to stay visually pristine for over a century.", icon: <Layers className="w-5 h-5 text-luxury-gold" />, image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1000" },
];

const GEARS = [
  { name: "Leica M11 Monochrom", class: "Classic Monochrome", description: "Configured with a dedicated monochrome sensor to yield raw luminance records of unmatched purity.", spec: "60.3 Megapixels / Pure Carbon Silvers / Summilux 35mm f/1.4" },
  { name: "Hasselblad H6D-100c", class: "Medium Format Sovereign", description: "The definitive tool for monumental museum plates and ultimate color-critical commercial projects.", spec: "100 Megapixels / 16-Bit Color Space / HC 80mm f/2.2" },
  { name: "ARRI Alexa Mini LF", class: "Cinematic Movement", description: "Selected to immortalize intimate fashion narratives and physical performance in rich, golden-hour motion.", spec: "Large Format Sensor / Cine Log-C Color Engine / Zeiss Prime" }
];

const CHRONICLES = [
  { year: "2011", title: "The Marais Atelier", desc: "Jayanta Roy establishes a highly private silver-gelatin developer studio in Paris' historic Marais district." },
  { year: "2016", title: "The Milanese Expansion", desc: "Setting up a physical base in Milan's Quadrilatero to cater to high-fashion showrooms and Lake Como micro-weddings." },
  { year: "2021", title: "Medium Format Supremacy", desc: "Upgrading all studio sensors exclusively to 100MP Hasselblad digital backs to secure ultimate legacy clarity." },
  { year: "2026", title: "Digital Light Table", desc: "Introducing live high-fidelity interactive proofing and remote plate customization tools for our global elite roster." }
];

const STATS = [
  { value: "15+", label: "YEARS OF ESSENCE", icon: <ShieldCheck className="w-4 h-4 text-luxury-gold" /> },
  { value: "500+", label: "HIGH-END COMMISSIONS", icon: <Award className="w-4 h-4 text-luxury-gold" /> },
  { value: "100+", label: "GLOBAL CLIENTS", icon: <Globe className="w-4 h-4 text-luxury-gold" /> },
  { value: "35+", label: "AWWWARDS & TROPHIES", icon: <Eye className="w-4 h-4 text-luxury-gold" /> },
];

export default function About() {
  const [activeTab, setActiveTab] = useState("character");
  const [activeGear, setActiveGear] = useState<number | null>(null);
  const [expandedChronicle, setExpandedChronicle] = useState<string>("2026");

  const handleTabClick = (id: string) => {
    audioService.playClick();
    setActiveTab(id);
  };

  const currentTabInfo = LABELS.find((t) => t.id === activeTab) || LABELS[0];

  return (
    <section id="about" className="relative py-28 md:py-40 bg-luxury-black overflow-hidden px-6 md:px-12">
      {/* Aesthetic Mesh Background Lights */}
      <div className="absolute top-[10%] left-[5%] w-[45rem] h-[45rem] bg-luxury-gold/2 rounded-full filter blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[5%] w-[35rem] h-[35rem] bg-deep-teal/4 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Decorative vertical lines for desktop monitors to anchor the visual weight */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5 pointer-events-none -translate-x-1/2 hidden 2xl:block" />

      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto space-y-24 md:space-y-36">
        
        {/* SECTION 1: MASTERING LIGHT (SPLIT INTRO & STATS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left: Big Manifesto Block */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase bg-luxury-gold/10 px-3.5 py-1.5 rounded-full border border-luxury-gold/20 mb-6">
                <Camera className="w-3 h-3 text-luxury-gold" />
                <span>STUDIO MANIFESTO</span>
              </div>
              <h2 className="font-display font-medium text-3xl sm:text-5xl md:text-6xl text-luxury-cream leading-[1.05] tracking-tight uppercase">
                WE DO NOT RECORD LIGHT. <br />
                <span className="font-serif italic text-luxury-gold font-light normal-case">We sculpt it.</span> <br />
                TO HARNESS THE EXTRAORDINARY.
              </h2>
            </motion.div>

            {/* Immersive Dark Quote Card */}
            <motion.div
              className="glass-panel p-8 md:p-10 rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-luxury-gold/5 rounded-full filter blur-3xl group-hover:bg-luxury-gold/10 transition-colors duration-500" />
              <p className="font-serif italic text-lg sm:text-xl text-[#D1D5DB] leading-relaxed relative z-10 font-light">
                "Our cameras are tools of historical preservation. We collaborate with high-fashion ateliers, architectural authorities, and elite private rosters worldwide to preserve raw emotion as physical heirlooms designed to endure generations."
              </p>
              <div className="mt-8 flex items-center space-x-4 text-[10px] tracking-[0.25em] font-mono text-luxury-gold uppercase">
                <span>JAYANTA ROY (JR)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold shrink-0" />
                <span className="text-zinc-500">FOUNDER & CHIEF CREATIVE</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Agency Narrative Narrative & Stats */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-12">
            
            <motion.div
              className="space-y-6 text-xs sm:text-sm text-luxury-gray leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <p className="border-l border-luxury-gold/30 pl-4 py-1">
                Founded in Paris, <strong className="text-luxury-cream font-medium">JR Photography</strong> has evolved from an independent fine-art laboratory into a world-class visual agency working with selective taste-makers in Milan, France, Saint-Tropez, and curated locations internationally.
              </p>
              <p className="pl-5 text-zinc-400">
                Under the creative leadership of Jayanta Roy, we reject industrial shortcuts and robotic automated presets. Every photo is custom-developed, calibrated to high-end monochrome or chromatic precision, and designed to look majestic on large displays.
              </p>
            </motion.div>

            {/* Premium Interactive Stat Blocks */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 pt-8 border-t border-white/5">
              {STATS.map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="p-6 bg-[#111310]/80 border border-white/5 rounded-[24px] hover:border-luxury-gold/30 transition-all duration-300 shadow-xl group cursor-default"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono tracking-widest text-[#555] group-hover:text-luxury-gold/80 transition-colors duration-300 uppercase">
                      {stat.label}
                    </span>
                    <div className="p-1 rounded-full bg-white/5 group-hover:bg-luxury-gold/10 transition-colors duration-300">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-extrabold text-luxury-cream leading-none tracking-tight">
                    {stat.value}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

        </div>

        {/* SECTION 2: INTERACTIVE PHILOSOPHY PILLARS */}
        <div className="border-t border-white/5 pt-20 md:pt-28">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-[10px] font-mono tracking-[0.4em] text-luxury-gold uppercase">THE SOUL OF THE MEDIUM</span>
            <h3 className="font-display font-medium text-2xl sm:text-4xl text-luxury-cream uppercase tracking-tight">
              Our Core Creative Pillars
            </h3>
            <p className="text-xs sm:text-sm text-luxury-gray font-light leading-relaxed">
              An elegant focus on authentic high-fidelity materials, meticulous atmospheric calculations, and ultimate archival permanence.
            </p>
          </div>

          {/* Tab Slider Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left Column: Tab Selectors */}
            <div className="lg:col-span-5 space-y-3.5">
              {LABELS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full p-6 text-left rounded-3xl border transition-all duration-500 flex items-start space-x-4 cursor-pointer relative overflow-hidden select-none ${
                      isActive 
                        ? "bg-luxury-charcoal border-luxury-gold shadow-2xl" 
                        : "bg-luxury-charcoal/10 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className={`p-3 rounded-2xl transition-colors duration-300 shrink-0 ${isActive ? "bg-luxury-gold/10 text-luxury-gold" : "bg-white/5 text-zinc-500"}`}>
                      {tab.icon}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-[#555] uppercase block leading-none mb-1.5">
                        {tab.subtitle}
                      </span>
                      <h4 className="text-sm font-display font-bold text-luxury-cream tracking-wide uppercase">
                        {tab.title}
                      </h4>
                      <p className="text-xs text-luxury-gray font-light mt-1.5 leading-relaxed line-clamp-2">
                        {tab.text}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Fluid Image & Content Fader */}
            <div className="lg:col-span-7 h-[420px] bg-[#111310] border border-white/5 rounded-[36px] overflow-hidden relative shadow-2xl flex flex-col justify-end p-8 md:p-10 group">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 z-0"
                >
                  <img 
                    src={currentTabInfo.image} 
                    alt={currentTabInfo.title} 
                    className="w-full h-full object-cover filter brightness-[45%] contrast-[105%] transition-transform duration-[4000ms] group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/30 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Dynamic Content Overlay */}
              <div className="relative z-10 space-y-4 max-w-xl">
                <span className="text-[10px] font-mono tracking-[0.3em] text-luxury-gold uppercase">
                  {currentTabInfo.subtitle}
                </span>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h4 className="text-xl sm:text-2xl font-display font-bold text-luxury-cream uppercase tracking-tight">
                      {currentTabInfo.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed mt-2.5">
                      {currentTabInfo.text}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="pt-2 flex items-center space-x-2 text-[10px] font-mono tracking-widest text-luxury-gold uppercase group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Explore creative index</span>
                  <span>→</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* SECTION 3: INSTRUMENTS OF THE CRAFT */}
        <div className="border-t border-white/5 pt-20 md:pt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Summary info panel */}
            <div className="lg:col-span-4 space-y-6">
              <span className="text-[10px] font-mono tracking-[0.4em] text-luxury-gold uppercase block leading-none">
                TECHNICAL SUPERIORITY
              </span>
              <h3 className="font-display font-medium text-2xl sm:text-4xl text-luxury-cream uppercase tracking-tight">
                INSTRUMENTS <br />
                OF PRESERVATION
              </h3>
              <p className="text-xs sm:text-sm text-luxury-gray font-light leading-relaxed">
                We shoot exclusively with physical mediums that possess unique glass profiles, deep dimensional response, and absolute color fidelity. No standard DSLRs, no shortcuts.
              </p>
              
              <div className="p-6 bg-luxury-charcoal/20 border border-white/5 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-luxury-gold/10 rounded-xl text-luxury-gold">
                    <Hourglass className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-mono font-bold text-luxury-cream uppercase">Archival Pigment Printing</h5>
                    <p className="text-[10.5px] text-zinc-500 font-light mt-0.5 leading-tight">Acid-free German baryta paper sets our standards.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right physical camera grid with interactive specs */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {GEARS.map((gear, idx) => {
                const isHovered = activeGear === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => {
                      audioService.playClick();
                      setActiveGear(idx);
                    }}
                    onMouseLeave={() => setActiveGear(null)}
                    className="p-6 md:p-8 rounded-[32px] border bg-[#111310]/50 hover:bg-[#111310] transition-all duration-300 flex flex-col justify-between h-[280px] relative overflow-hidden select-none group cursor-pointer"
                    style={{
                      borderColor: isHovered ? "rgba(183,190,67,0.3)" : "rgba(233,233,231,0.05)",
                      boxShadow: isHovered ? "0 15px 35px -10px rgba(183,190,67,0.08)" : "none"
                    }}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-gold/2 rounded-full filter blur-2xl group-hover:bg-luxury-gold/5 transition-all duration-300" />
                    
                    <div>
                      {/* Decorative Lens Spotting */}
                      <div className="w-10 h-10 rounded-full border border-white/5 bg-luxury-black flex items-center justify-center text-zinc-650 group-hover:border-luxury-gold/30 group-hover:text-luxury-gold transition-all duration-300 mb-6 font-mono text-[10px]">
                        0{idx + 1}
                      </div>

                      <span className="text-[10px] font-mono text-luxury-gold tracking-wider uppercase block mb-1">
                        {gear.class}
                      </span>
                      <h4 className="text-lg font-display font-bold text-luxury-cream tracking-tight uppercase leading-snug">
                        {gear.name}
                      </h4>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <p className="text-xs text-luxury-gray leading-relaxed font-light">
                        {gear.description}
                      </p>
                      
                      <div className="h-0 group-hover:h-8 overflow-hidden transition-all duration-500 opacity-0 group-hover:opacity-100 mt-2">
                        <span className="text-[9.5px] font-mono text-[#777] block uppercase tracking-wider">
                          {gear.spec}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* SECTION 4: CHRONICLES OF EVOLUTION (TIMELINE) */}
        <div className="border-t border-white/5 pt-20 md:pt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Header Panel */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-mono tracking-[0.4em] text-luxury-gold uppercase block leading-none">
                OUR JOURNEY IN DEVIATION
              </span>
              <h3 className="font-display font-medium text-2xl sm:text-4xl text-luxury-cream uppercase tracking-tight">
                Chronicles of <br />
                Creative Essence
              </h3>
              <p className="text-xs sm:text-sm text-luxury-gray font-light leading-relaxed">
                Expanding our vision deliberately, step-by-step, preserving high-end visual authenticity on both public campaigns and intimate private plates. Click on years to view details.
              </p>

              <div className="inline-flex items-center space-x-2 text-[10.5px] font-mono text-zinc-500 uppercase tracking-widest pl-1">
                <Globe className="w-4 h-4 text-zinc-500 animate-spin" style={{ animationDuration: "12s" }} />
                <span>Operating Globally</span>
              </div>
            </div>

            {/* Right Sleek Modern Timeline Arc */}
            <div className="lg:col-span-7 space-y-4">
              {CHRONICLES.map((item) => {
                const isExpanded = expandedChronicle === item.year;
                return (
                  <div
                    key={item.year}
                    onClick={() => {
                      audioService.playClick();
                      setExpandedChronicle(item.year);
                    }}
                    className={`p-6 rounded-[28px] border cursor-pointer select-none transition-all duration-500 relative overflow-hidden ${
                      isExpanded 
                        ? "bg-[#111310] border-luxury-gold shadow-2xl" 
                        : "bg-luxury-charcoal/15 border-white/5 hover:border-white/12 hover:bg-luxury-charcoal/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <span className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-350 ${isExpanded ? "text-luxury-gold" : "text-zinc-650"}`}>
                          {item.year}
                        </span>
                        <h4 className="text-sm font-mono tracking-wider text-luxury-cream uppercase font-bold">
                          {item.title}
                        </h4>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-zinc-500 transition-all duration-300 ${isExpanded ? "rotate-90 text-luxury-gold border-luxury-gold/40" : ""}`}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className={`mt-4 overflow-hidden transition-all duration-500 ${isExpanded ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <p className="text-xs text-luxury-gray leading-relaxed font-light pl-16">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
