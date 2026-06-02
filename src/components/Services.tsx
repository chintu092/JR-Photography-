import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SERVICES } from "../data";
import { ArrowRight, Sparkles, Check, X } from "lucide-react";
import { Service } from "../types";

export default function Services() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  return (
    <section id="services" className="relative py-24 md:py-36 bg-[#0E0E0E] overflow-hidden px-6 md:px-12">
      {/* Background ambient lighting glows only */}
      <div className="absolute top-[30%] left-[20%] w-[35rem] h-[35rem] bg-luxury-gold/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[35rem] h-[35rem] bg-luxury-gold/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 md:mb-24 gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase block mb-4">
              SPECIALTIES
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-luxury-cream uppercase tracking-wide">
              OUR LUXURY ARCHITECTURES
            </h2>
          </div>
          <p className="max-w-md text-sm text-luxury-gray leading-relaxed font-light">
            Each discipline represents an absolute commitment to medium-format precision, bespoke color profiles, and award-winning lighting.
          </p>
        </div>

        {/* Services Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <motion.div
              key={service.id}
              className="glass-panel glass-panel-hover p-8 rounded-[32px] flex flex-col justify-between h-[360px] cursor-pointer group relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setSelectedService(service)}
            >
              {/* Subtle Gold Dust Glow behind card */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-luxury-gold/3 group-hover:bg-luxury-gold/10 rounded-full filter blur-2xl transition-all duration-500" />
              
              {/* Card Header: Num and Sparkle */}
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-luxury-gold tracking-widest pl-1">
                  NO. {service.num}
                </span>
                <span className="p-2 bg-white/5 rounded-full text-[#444] group-hover:text-luxury-gold group-hover:bg-luxury-gold/10 transition-all duration-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Service Title & Info */}
              <div className="space-y-3 mt-10">
                <h3 className="font-display text-2xl font-bold text-luxury-cream group-hover:text-luxury-gold transition-colors duration-300 uppercase">
                  {service.title}
                </h3>
                <p className="text-xs text-luxury-gray leading-relaxed font-light line-clamp-3">
                  {service.description}
                </p>
              </div>

              {/* Card Footer: Tags & Arrow */}
              <div className="flex justify-between items-center pt-6 border-t border-white/5 mt-auto">
                <div className="flex flex-wrap gap-2 max-w-[80%]">
                  {service.tags.slice(0, 2).map((tag, tIdx) => (
                    <span key={tIdx} className="text-[9px] font-mono tracking-wider space-x-1.5 uppercase text-zinc-500 bg-[#141414] px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="p-2 rounded-full bg-white/5 text-luxury-cream group-hover:bg-[#fff] group-hover:text-black transition-all duration-400">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating CTA inquiry prompt below services */}
        <div className="mt-16 text-center">
          <p className="text-xs font-mono tracking-[0.25em] text-luxury-gray uppercase">
            DESIRE SOMETHING BESPOKE?{" "}
            <a href="#contact" className="text-luxury-gold hover:text-luxury-cream underline transition-colors cursor-pointer inline-flex items-center ml-1">
              INQUIRE DIRECTLY <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </a>
          </p>
        </div>

      </div>

      {/* Services Detailed Popup Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
            />

            {/* Modal Body */}
            <motion.div
              className="bg-luxury-black border border-white/10 p-8 md:p-12 rounded-[40px] max-w-2xl w-full relative z-10 shadow-2xl space-y-6"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
            >
              <button
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-luxury-cream"
                onClick={() => setSelectedService(null)}
                aria-label="Close modal"
                id="close-services-modal-btn"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-mono text-luxury-gold tracking-widest uppercase">
                  Service Spec No. {selectedService.num}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                <span className="text-xs font-mono text-[#555] uppercase">Certified Legacy</span>
              </div>

              <h3 className="font-display text-3xl md:text-4xl font-extrabold text-luxury-cream uppercase tracking-wide border-b border-white/5 pb-4">
                {selectedService.title}
              </h3>

              <div className="space-y-4">
                <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Operational Overview:</h4>
                <p className="text-sm md:text-base text-luxury-gray font-light leading-relaxed">
                  {selectedService.longDesc}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Premium Milestones Included:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedService.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5 text-xs text-luxury-cream">
                      <Check className="w-4 h-4 text-luxury-gold shrink-0" />
                      <span>{tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => {
                    setSelectedService(null);
                    window.location.hash = "#contact";
                  }}
                  className="px-6 py-3 bg-luxury-gold text-luxury-black font-display font-medium text-[11px] tracking-widest uppercase rounded-full hover:bg-white hover:text-black transition-colors"
                  id="modal-services-inquire-btn"
                >
                  Book Service Campaign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
