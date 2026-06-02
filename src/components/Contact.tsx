import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Phone, MapPin, Send, Globe, Clock, Sparkles } from "lucide-react";

interface StudioLocation {
  city: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
}

const STUDIOS: StudioLocation[] = [
  {
    city: "PARIS RESIDENCE",
    address: "14 Rue de la Paix, 75002 Paris, France",
    phone: "+33 (0) 1 53 43 80 00",
    hours: "10:00 - 18:00 CEST",
    lat: 48.8688,
    lng: 2.3312
  },
  {
    city: "MILAN HEADQUARTERS",
    address: "Via Monte Napoleone, 8, 20121 Milano, Italy",
    phone: "+39 02 7600 8200",
    hours: "09:30 - 18:30 CEST",
    lat: 45.4682,
    lng: 9.1952
  }
];

export default function Contact() {
  const [activeStudioIdx, setActiveStudioIdx] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const activeStudio = STUDIOS[activeStudioIdx];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    
    // Simulate premium secure SMTP delay
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <section id="contact" className="relative py-24 md:py-36 bg-[#0B0B0B] overflow-hidden px-6 md:px-12 border-t border-white/5">
      {/* Background soft ambiance lights */}
      <div className="absolute top-1/2 left-[10%] w-[35rem] h-[35rem] bg-luxury-gold/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto relative z-10">
        
        {/* Core Big Call to Action */}
        <div className="text-center space-y-6 mb-20 md:mb-28">
          <motion.div 
            className="flex items-center justify-center space-x-2 text-luxury-gold text-xs tracking-[0.4em] font-mono uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            <span>ESTABLISH VISUAL DOMINANCE</span>
          </motion.div>
          
          <h2 className="font-display font-black text-4xl sm:text-6xl md:text-8xl text-luxury-cream leading-none tracking-[0.08em] uppercase select-none">
            LET’S CREATE <br />
            <span className="font-serif italic font-light text-luxury-gold normal-case">something</span> <br />
            ICONIC.
          </h2>
          <p className="max-w-md mx-auto text-xs text-luxury-gray font-light leading-relaxed">
            Direct secure communication lines for selective global clients, commercial brands, and haute couture art requests.
          </p>
        </div>

        {/* Form and info coordinates splitting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Column Left: Booking Form */}
          <div className="lg:col-span-7 bg-[#111]/40 border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/2 rounded-full filter blur-3xl pointer-events-none" />

            <h3 className="font-display text-2xl font-bold uppercase text-luxury-cream mb-8">
              SECURE SECRETS INQUIRY PORTAL
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="contact-name" className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">
                    Your Full Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Isabella Rossi"
                    className="w-full bg-luxury-black border border-white/10 rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-email" className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., mail@isabellarossi.com"
                    className="w-full bg-luxury-black border border-white/10 rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact-subject" className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">
                  Campaign Subject Picker
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Haute Couture Campaign 2026 Paris"
                  className="w-full bg-luxury-black border border-white/10 rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label id="label-message" htmlFor="contact-message" className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block pl-1">
                  Project Details / Artistic Scope *
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us about your creative requirements, scheduling scope, and target locations..."
                  className="w-full bg-luxury-black border border-white/10 rounded-2xl p-4 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold transition-colors resize-none"
                />
              </div>

              {/* Security confirmation / Status box */}
              <AnimatePresence mode="wait">
                {status === "success" && (
                  <motion.div 
                    className="p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center space-x-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Send className="w-5 h-5 shrink-0 text-emerald-400" />
                    <span>Inquiry secure: message transmitted successfully! Our agent squad will contact you in under 4 hours.</span>
                  </motion.div>
                )}
                {status === "error" && (
                  <motion.div 
                    className="p-4 bg-rose-950/40 border border-rose-500/20 text-rose-400 text-xs rounded-2xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <span>Please ensure you have filled out all mandatory (*) parameters.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={status === "sending"}
                className="group w-full py-4 bg-luxury-gold text-luxury-black hover:bg-white font-display font-bold text-[11px] tracking-widest uppercase rounded-full transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg shadow-luxury-gold/5 cursor-pointer"
                id="contact-submit-btn"
              >
                <span>{status === "sending" ? "TRANSMITTING..." : "SECURE TRANSMIT MESSAGE"}</span>
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
              </button>

            </form>
          </div>

          {/* Column Right: Interactive Radar Dark Map & Address */}
          <div className="lg:col-span-5 space-y-8 h-full flex flex-col justify-between">
            
            {/* Real Studio details card */}
            <div className="space-y-6">
              
              {/* Studio Toggle selector tabs */}
              <div className="flex bg-neutral-900 border border-white/5 rounded-full p-1 w-full justify-between">
                {STUDIOS.map((st, sIdx) => (
                  <button
                    key={st.city}
                    onClick={() => setActiveStudioIdx(sIdx)}
                    className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase rounded-full font-bold transition-all ${
                      activeStudioIdx === sIdx
                        ? "bg-[#1C1C1C] text-luxury-gold border border-white/5 shadow-md"
                        : "text-zinc-500 hover:text-luxury-cream"
                    }`}
                    id={`studio-switch-${sIdx}`}
                  >
                    {st.city.split(" ")[0]} Studio
                  </button>
                ))}
              </div>

              {/* Display active studio information details */}
              <motion.div
                key={activeStudio.city}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 p-6 bg-[#111]/30 border border-white/5 rounded-[24px]"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-display font-extrabold text-luxury-cream tracking-wide">
                    {activeStudio.city}
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 text-luxury-gold rounded-full text-[8px] font-mono">
                    GLOBAL CENTER
                  </span>
                </div>

                <div className="space-y-3 font-light text-zinc-400 text-xs">
                  <div className="flex items-start space-x-3.5">
                    <MapPin className="w-4.5 h-4.5 text-luxury-gold shrink-0 mt-0.5" />
                    <span>{activeStudio.address}</span>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <Phone className="w-4.5 h-4.5 text-luxury-gold shrink-0" />
                    <span>{activeStudio.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <Clock className="w-4.5 h-4.5 text-luxury-gold shrink-0" />
                    <span>Business Hours: {activeStudio.hours}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Dark Styled Custom Map Frame */}
            <div className="relative aspect-video sm:aspect-[16/10] lg:aspect-square rounded-[32px] overflow-hidden border border-white/10 bg-[#070707] flex flex-col justify-center items-center p-6 text-center shadow-2xl group">
              
              {/* Radar scanner grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-zinc-900 rounded-full flex items-center justify-center animate-ping duration-3000 pointer-events-none opacity-25" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-zinc-900 rounded-full flex items-center justify-center pointer-events-none opacity-35" />
              
              {/* Spinning focal radar line sweep */}
              <div className="absolute top-1/2 left-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent to-luxury-gold/50 origin-left animate-[spin_6s_linear_infinite] pointer-events-none" />

              {/* Core map target coordinates pinpoint */}
              <div className="relative z-10 space-y-4">
                <div className="relative inline-block">
                  <div className="w-10 h-10 rounded-full bg-luxury-gold/10 border border-luxury-gold flex items-center justify-center animate-bounce">
                    <MapPin className="w-5 h-5 text-luxury-gold" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxury-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-luxury-gold"></span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block tracking-widest">
                    ACTIVE SATELLITE RADAR BEACON
                  </span>
                  <span className="text-xs font-mono font-bold text-luxury-gold uppercase block">
                    LAT: {activeStudio.lat}° N • LNG: {activeStudio.lng}° E
                  </span>
                </div>

                <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed mx-auto font-light leading-normal uppercase">
                  Fully secured custom mapping coordinates logged into tactical global logistics system. Private helipads access coordinates included in Legacy and Couture tiers.
                </p>

                <div className="pt-2">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeStudio.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-[9px] font-mono tracking-widest text-luxury-cream hover:text-luxury-gold bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/5 rounded-full transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>LAUNCH EXTERNAL SATELLITE MAP</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
