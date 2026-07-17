import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send, Globe, Clock, Sparkles } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { StudioSettings } from "../types";
import WayficFormRenderer from "./WayficFormRenderer";

const FALLBACK_STUDIO = {
  city: "KOLKATA STUDIO",
  address: "Salt Lake City, Sector V, Kolkata, India",
  phone: "+91 98765 43210",
  hours: "10:00 - 18:00 IST",
  lat: 22.5726,
  lng: 88.4344
};

const DEFAULT_CONTACT_DATA = {
  pretitle: "ESTABLISH VISUAL DOMINANCE",
  title: "LET’S CREATE something ICONIC.",
  description: "Direct secure communication lines for selective global clients, commercial brands, and haute couture art requests.",
  email: "contact@jrphotography.com",
  phone: "+91 98765 43210",
  address: "Salt Lake City, Sector V, Kolkata, India"
};

export default function Contact() {
  const [studio, setStudio] = useState<StudioSettings | typeof FALLBACK_STUDIO>(FALLBACK_STUDIO);
  const [contactData, setContactData] = useState(DEFAULT_CONTACT_DATA);

  useEffect(() => {
    const fetchStudioAndContact = async () => {
      try {
        // Fetch Studio coordinates
        const studioSnap = await getDoc(doc(db, "settings", "studio"));
        if (studioSnap.exists()) {
          setStudio(studioSnap.data() as StudioSettings);
        }
      } catch (error) {
        console.warn("Studio settings offline/unavailable, using defaults.");
      }

      try {
        // Fetch Contact editable content
        const contactSnap = await getDoc(doc(db, "settings", "contact"));
        if (contactSnap.exists()) {
          const data = contactSnap.data();
          setContactData(prev => ({
            ...prev,
            ...data
          }));
        }
      } catch (error) {
        console.warn("Contact settings offline/unavailable, using defaults.");
      }
    };
    fetchStudioAndContact();
  }, []);

  return (
    <section id="contact" className="relative py-24 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5">
      {/* Background soft ambiance lights */}
      <div className="absolute top-1/2 left-[10%] w-[35rem] h-[35rem] bg-luxury-gold/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Core Big Call to Action */}
        <div className="text-center space-y-6 mb-20 md:mb-28">
          <motion.div 
            className="flex items-center justify-center space-x-2 text-luxury-gold text-xs tracking-[0.4em] font-mono uppercase"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{contactData.pretitle}</span>
          </motion.div>
          
          <h2 className="font-display font-black text-4xl sm:text-6xl md:text-8xl text-luxury-cream leading-none tracking-[0.08em] uppercase select-none">
            {contactData.title.includes("something") ? (
              <>
                {contactData.title.split("something")[0]}
                <span className="font-serif italic font-light text-luxury-gold normal-case">something</span>
                {contactData.title.split("something")[1]}
              </>
            ) : contactData.title}
          </h2>
          <p className="max-w-md mx-auto text-xs text-luxury-gray font-light leading-relaxed">
            {contactData.description}
          </p>
        </div>

        {/* Form and info coordinates splitting */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Column Left: Booking Form */}
          <div className="lg:col-span-7 bg-luxury-black/40 border border-white/5 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/2 rounded-full filter blur-3xl pointer-events-none" />

            <WayficFormRenderer formId="contact" />
          </div>

          {/* Column Right: Interactive Radar Dark Map & Address */}
          <div className="lg:col-span-5 space-y-8 h-full flex flex-col justify-between">
            
            {/* Real Studio details card */}
            <div className="space-y-6">
              
              {/* Display active studio information details */}
              <motion.div
                key={studio.city}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 p-6 bg-luxury-black/30 border border-white/5 rounded-[24px]"
              >
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-display font-extrabold text-luxury-cream tracking-wide">
                    {studio.city}
                  </span>
                  <span className="px-2.5 py-0.5 bg-luxury-gold/10 text-luxury-gold rounded-full text-[8px] font-mono">
                    GLOBAL CENTER
                  </span>
                </div>

                <div className="space-y-3 font-light text-zinc-400 text-xs">
                  <div className="flex items-start space-x-3.5">
                    <MapPin className="w-4.5 h-4.5 text-luxury-gold shrink-0 mt-0.5" />
                    <span>{contactData.address || studio.address}</span>
                  </div>
                  <div className="flex items-center space-x-3.5">
                    <Phone className="w-4.5 h-4.5 text-luxury-gold shrink-0" />
                    <span>{contactData.phone || studio.phone}</span>
                  </div>
                  {contactData.email && (
                    <div className="flex items-center space-x-3.5">
                      <Mail className="w-4.5 h-4.5 text-luxury-gold shrink-0" />
                      <span>{contactData.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3.5">
                    <Clock className="w-4.5 h-4.5 text-luxury-gold shrink-0" />
                    <span>Business Hours: {studio.hours}</span>
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
                    LAT: {studio.lat || FALLBACK_STUDIO.lat}° N • LNG: {studio.lng || FALLBACK_STUDIO.lng}° E
                  </span>
                </div>

                <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed mx-auto font-light leading-normal uppercase">
                  Fully secured custom mapping coordinates logged into tactical global logistics system. Private helipads access coordinates included in Legacy and Couture tiers.
                </p>

                <div className="pt-2">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactData.address || studio.address)}`}
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
