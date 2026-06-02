import { motion } from "motion/react";
import { PROCESS_STEPS } from "../data";
import { Compass, Sliders, Camera, Cpu, BookOpen, Award, CheckCircle2 } from "lucide-react";
import CriticallyAcclaimedCarousel from "./CriticallyAcclaimedCarousel";

export default function Process() {
  // Use current process steps from data:
  // 01: Discovery & Creative Pitch (Week 1)
  // 02: Strategic Planning & Cast (Week 2 - 3)
  // 03: The Shoot Day Experience (Production)
  // 04: Cinematic Color & Edit (Post-Production)
  // 05: Premium Gallery & Print (Delivery)

  const step01 = PROCESS_STEPS[0];
  const step02 = PROCESS_STEPS[1];
  const step03 = PROCESS_STEPS[2];
  const step04 = PROCESS_STEPS[3];
  const step05 = PROCESS_STEPS[4];

  return (
    <section id="process" className="relative py-24 md:py-36 bg-[#0E0E0E] overflow-hidden px-6 md:px-12 border-t border-white/5 transition-all duration-300">
      {/* Background ambient circular halos */}
      <div className="absolute top-[15%] left-[5%] w-[30rem] h-[30rem] bg-luxury-gold/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[25rem] h-[25rem] bg-deep-teal/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase block mb-4">
              CLIENT EXPERIENCE
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-luxury-cream uppercase tracking-wide leading-none">
              THE REVOLVE TIMELINE
            </h2>
          </div>
          <p className="max-w-md text-sm text-luxury-gray leading-relaxed font-light">
            An uncompromising five-step operational methodology ensuring absolute precision from moodboard conceptualization to final museum-grade deliverables.
          </p>
        </div>

        {/* Bento Grid Layout mimicking the uploaded image layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Phase 01 (Minimalist Up to 14 day Battery Life style) */}
          <motion.div 
            className="lg:col-span-1 bg-luxury-charcoal/90 p-8 rounded-[32px] min-h-[300px] border border-white/5 flex flex-col justify-between transition-all duration-300 hover:border-luxury-gold/20 hover:shadow-2xl hover:shadow-luxury-gold/5 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-luxury-gold tracking-widest uppercase">
                PHASE {step01.num}
              </span>
              <Compass className="w-5 h-5 text-luxury-gray opacity-40 group-hover:text-luxury-gold group-hover:rotate-45 transition-all duration-500" />
            </div>
            
            <div className="space-y-3 my-auto py-4">
              <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-luxury-cream tracking-tight leading-tight">
                {step01.title}
              </h3>
              <p className="text-xs text-luxury-gray font-light leading-relaxed">
                {step01.description}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-white/5 text-[9px] font-mono tracking-widest text-[#B7BE43] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse" />
              <span>DURATION: {step01.duration}</span>
            </div>
          </motion.div>

          {/* Card 2: Phase 02 (Rotating Crown style - peach colored backdrop with bottom cropping image) */}
          <motion.div 
            className="lg:col-span-1 bg-[#DE8E67]/10 p-8 rounded-[32px] min-h-[300px] border border-white/5 flex flex-col justify-between overflow-hidden relative transition-all duration-300 hover:border-[#DE8E67]/30 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-20">
              <span className="text-[10px] font-mono text-[#DE8E67] tracking-widest uppercase">
                PHASE {step02.num}
              </span>
              <Sliders className="w-5 h-5 text-[#DE8E67] opacity-65 group-hover:scale-110 transition-transform duration-300" />
            </div>

            <div className="mt-4 relative z-20">
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-luxury-cream tracking-tight leading-tight">
                {step02.title}
              </h3>
              <p className="text-[11px] text-zinc-300 font-light mt-2 leading-relaxed">
                {step02.description}
              </p>
            </div>

            {/* Bottom cropping aesthetic image of camera dials / lens */}
            <div className="h-40 w-full mt-4 -mx-8 -mb-8 overflow-hidden relative select-none rounded-t-[20px] border-t border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800" 
                alt="Tactical Camera Dial" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-4 px-2.5 py-1 rounded-full bg-black/60 text-[8px] font-mono text-luxury-cream tracking-wider uppercase z-20">
                SCENE PREPARATION
              </div>
            </div>
          </motion.div>

          {/* Card 3: Phase 03 - Tall Vertical Card (Built-in GPS style with model in orange running coat) */}
          <motion.div 
            className="lg:col-span-1 lg:row-span-2 bg-luxury-charcoal/90 rounded-[32px] min-h-[620px] border border-white/5 flex flex-col justify-between overflow-hidden relative transition-all duration-300 hover:border-luxury-gold/25 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Dark glass-like content overlay */}
            <div className="p-8 pb-4 relative z-20">
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-mono text-luxury-gold tracking-widest uppercase">
                  PHASE {step03.num}
                </span>
                <span className="px-3.5 py-1.5 bg-[#B7BE43]/15 text-[#B7BE43] border border-[#B7BE43]/20 rounded-full text-[8.5px] font-mono tracking-widest uppercase animate-pulse">
                  ON PRODUCTION
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-luxury-cream tracking-tight leading-tight">
                {step03.title}
              </h3>
              <p className="text-xs text-luxury-gray font-light mt-3 leading-relaxed">
                {step03.description}
              </p>

              {/* Meticulous Technical Details - GPS-style tags */}
              <div className="grid grid-cols-2 gap-2 mt-6">
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-wider">CAMERA SYSTEM</span>
                  <span className="text-[9px] font-mono text-luxury-cream font-bold mt-0.5">RED MONSTRO 8K</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-wider">OPTICS RANGE</span>
                  <span className="text-[9px] font-mono text-luxury-cream font-bold mt-0.5">LEICA PRILUX</span>
                </div>
              </div>
            </div>

            {/* Immersive tall physical shoot illustration / model image */}
            <div className="flex-grow w-full relative select-none overflow-hidden h-[300px] lg:h-auto border-t border-white/5">
              <img 
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200" 
                alt="Production Shoot Experience"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent z-10" />
              <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center text-luxury-cream">
                <div>
                  <span className="text-[8px] font-mono text-luxury-gold tracking-widest uppercase block mb-0.5">LOCATION SCOUT</span>
                  <span className="text-[11px] font-display font-medium uppercase tracking-wider">AMALFI COAST, ITALY</span>
                </div>
                <Camera className="w-5 h-5 text-luxury-cream opacity-80" />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Phase 04 (1.32" AMOLED style - deep colored backdrop with dynamic face image) */}
          <motion.div 
            className="lg:col-span-1 bg-[#1E5662]/15 p-8 rounded-[32px] min-h-[300px] border border-white/5 flex flex-col justify-between overflow-hidden relative transition-all duration-300 hover:border-deep-teal/30 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-20">
              <span className="text-[10px] font-mono text-[#1E5662] tracking-widest uppercase font-bold dark:text-[#E2ECED]">
                PHASE {step04.num}
              </span>
              <Cpu className="w-5 h-5 text-deep-teal opacity-70 group-hover:rotate-90 transition-transform duration-500" />
            </div>

            <div className="mt-4 relative z-20">
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-luxury-cream tracking-tight leading-tight">
                {step04.title}
              </h3>
              <p className="text-[11px] text-zinc-300 font-light mt-2 leading-relaxed">
                {step04.description}
              </p>
            </div>

            {/* Bottom cropping color graded photographic close-up */}
            <div className="h-40 w-full mt-4 -mx-8 -mb-8 overflow-hidden relative select-none rounded-t-[20px] border-t border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600" 
                alt="Color grading palette" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-4 px-2.5 py-1 rounded-full bg-black/60 text-[8px] font-mono text-[#1E5662] dark:text-[#E2ECED] tracking-wider uppercase z-20">
                8K HDR GRADING
              </div>
            </div>
          </motion.div>

          {/* Card 5: Phase 05 (Noise AI style - Spanning 2 columns horizontally, image overlapping) */}
          <motion.div 
            className="lg:col-span-2 bg-[#121611]/60 p-8 rounded-[32px] min-h-[300px] border border-white/5 flex flex-col sm:flex-row items-stretch justify-between overflow-hidden relative gap-6 transition-all duration-300 hover:border-[#B7BE43]/20 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Details on the Left/Top */}
            <div className="flex flex-col justify-between sm:w-1/2 relative z-20 py-2">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-[10px] font-mono text-luxury-gold tracking-widest uppercase">
                    PHASE {step05.num}
                  </span>
                  <span className="w-1 h-1 bg-zinc-650 rounded-full" />
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">GLOBAL DELIVERY</span>
                </div>

                <h3 className="font-display text-xl sm:text-2xl font-bold uppercase text-luxury-cream tracking-tight leading-tight">
                  {step05.title}
                </h3>
                <p className="text-xs text-luxury-gray font-light mt-3 leading-relaxed">
                  {step05.description}
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-white/5 text-[9px] font-mono tracking-widest text-[#B7BE43] uppercase mt-4">
                <BookOpen className="w-3.5 h-3.5 text-luxury-gold" />
                <span>LINEN ART VOLUMES</span>
              </div>
            </div>

            {/* Overlapping prints image stack on the Right - mimics 'Noise AI' watch layout */}
            <div className="sm:w-1/2 h-44 sm:h-auto min-h-[160px] relative select-none rounded-[24px] overflow-hidden border border-white/5 shadow-inner">
              <img 
                src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800" 
                alt="Bespoke Linen Art Books" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#121611] to-transparent pointer-events-none hidden sm:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-mono uppercase text-luxury-cream z-20 tracking-wider">
                CERTIFIED ORIGINAL
              </div>
            </div>
          </motion.div>

          {/* Card 6: Quality/ Archival Guarantee (1000 NITS peak brightness style) */}
          <motion.div 
            className="lg:col-span-1 bg-luxury-charcoal/90 p-8 rounded-[32px] min-h-[300px] border border-white/5 flex flex-col justify-between transition-all duration-300 hover:border-luxury-gold/15 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-luxury-gold tracking-widest uppercase">
                TRUST ASSURANCES
              </span>
              <Award className="w-5 h-5 text-luxury-gold animate-pulse" />
            </div>

            <div className="space-y-3 my-auto py-4 text-center">
              <div className="text-3xl sm:text-4xl font-display font-black text-luxury-cream uppercase tracking-wider">
                100%
              </div>
              <div className="text-[11px] font-mono text-luxury-gold tracking-widest uppercase font-bold">
                MUSEUM ARCHIVABILITY
              </div>
              <p className="text-[11px] text-luxury-gray font-light">
                Every frame printed using museum certified chemical silver-halide arrays and hand-pressed linen stock with a robust 100-year legacy guarantee.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-1.5 pt-2 border-t border-white/5 text-[9px] font-mono tracking-widest text-[#B7BE43] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
              <span>CERTIFICATION APPROVED</span>
            </div>
          </motion.div>

        </div>

        {/* Redesigned Critically Acclaimed Section with smooth, custom horizontal looping carousel */}
        <div className="lg:col-span-4 mt-12 bg-transparent border-t border-white/5 pt-16">
          <CriticallyAcclaimedCarousel />
        </div>

      </div>
    </section>
  );
}
