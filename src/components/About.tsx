import { motion } from "motion/react";
import { Award, Eye, ShieldCheck, Globe } from "lucide-react";

const STATS = [
  { value: "15+", label: "YEARS OF ESSENCE", icon: <ShieldCheck className="w-4 h-4 text-luxury-gold" /> },
  { value: "500+", label: "HIGH-END COMMISSIONS", icon: <Award className="w-4 h-4 text-luxury-gold" /> },
  { value: "100+", label: "GLOBAL CLIENTS", icon: <Globe className="w-4 h-4 text-luxury-gold" /> },
  { value: "35+", label: "AWWWARDS & TROPHIES", icon: <Eye className="w-4 h-4 text-luxury-gold" /> },
];

export default function About() {
  return (
    <section id="about" className="relative py-24 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Editorial Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left: Giant Split Typography */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase block mb-6">
                OUR PHILOSOPHY
              </span>
              <h2 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-luxury-cream leading-[1.12] tracking-wide uppercase">
                WE DO NOT RECORD LIGHT. <br />
                <span className="font-serif italic text-luxury-gold font-light normal-case">We sculpt it.</span> <br />
                TO HARNESS THE EXTRAORDINARY.
              </h2>
            </motion.div>

            {/* Immersive Dark Card Accent */}
            <motion.div
              className="glass-panel p-8 md:p-10 rounded-[32px] border border-white/5 relative overflow-hidden group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full filter blur-3xl group-hover:bg-luxury-gold/10 transition-colors duration-500" />
              <p className="font-serif italic text-lg sm:text-xl text-[#ccc] leading-relaxed relative z-10">
                "Our cameras are tools of historical protection. We collaborate with world-renowned fashion houses and selective couples to immortalize raw emotional frequency in its most pristine, cinematic physical representation."
              </p>
              <div className="mt-6 flex items-center space-x-3 text-xs tracking-widest font-mono text-luxury-gold uppercase">
                <span>JAYANTA ROY (JR)</span>
                <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                <span className="text-zinc-650">FOUNDER & CHIEF CREATIVE</span>
              </div>
            </motion.div>
          </div>

          {/* Right: Storytelling & Stat Grid */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-12">
            
            {/* Agency Narrative Description */}
            <motion.div
              className="space-y-6 text-sm text-luxury-gray leading-relaxed font-light"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p>
                Founded in 2011, JR Photography has evolved from an independent Parisian fine-art workshop into a top-tier international photography agency operating between Paris, Milan, and select luxury destinations globally.
              </p>
              <p>
                We capture fine-art fashion, elite wedding stories, luxury automotive highlights, and brand editorials. We reject mechanical defaults: every image in our vault goes through individual manual light calibration and premium cinematic styling overseen by our creative director.
              </p>
            </motion.div>

            {/* Strategic Stat Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 pt-6 border-t border-white/5">
              {STATS.map((stat, index) => (
                <motion.div
                  key={index}
                  className="p-5 md:p-6 bg-[#111] border border-white/5 rounded-[24px] hover:border-luxury-gold/20 transition-all duration-300"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono tracking-widest text-[#555] uppercase">
                      {stat.label}
                    </span>
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-extrabold text-luxury-cream leading-none tracking-tight">
                    {stat.value}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
