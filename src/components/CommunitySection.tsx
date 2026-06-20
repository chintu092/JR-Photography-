import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Facebook, Link as LinkIcon, Edit2, Layout, Type } from "lucide-react";
import LazyImage from "./LazyImage";
import { doc, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

export default function CommunitySection() {
  const [content, setContent] = useState({
    titleHeader: "Stay connected.",
    subtitleHeader: "Engage with our art.",
    body: "Join our official Facebook page to stay updated with our latest collections, exclusive behind-the-scenes content, and a community of photography enthusiasts. From Paris to Milan, be part of our journey.",
    joinLink: "https://www.facebook.com/share/1Bf4XdWk9p/",
    backgroundImage: "https://images.unsplash.com/photo-1549064492-c416b7418968?auto=format&fit=crop&q=80&w=800",
    imageURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  });

  useEffect(() => {
    const docRef = doc(db, "settings", "community");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setContent(prev => ({ ...prev, ...docSnap.data() }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/community");
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <section className="py-24 md:py-32 bg-[#0A0A0A] text-white relative font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        
        {/* LEFT COLUMN: Text Content */}
        <div className="space-y-8 lg:pr-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[13px] text-zinc-300 select-none">
            Join the community
          </div>
          
          <h2 className="text-[2.75rem] leading-[1.1] sm:text-6xl md:text-[4rem] font-medium tracking-tight">
            <span className="text-white block">{content.titleHeader}</span>
            <span className="text-[#888888] block text-[2.75rem] leading-[1.1] sm:text-6xl md:text-[4rem]">{content.subtitleHeader}</span>
          </h2>
          
          <p className="text-[#A1A1AA] text-lg md:text-[21px] leading-[1.6] max-w-lg font-light">
            {content.body}
          </p>
        </div>

        {/* RIGHT COLUMN: Glass Mockup UI */}
        <div className="relative w-full max-w-xl mx-auto lg:ml-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[32px] p-2 bg-[#1A1A1A] border border-white/10 shadow-2xl relative overflow-hidden"
          >
            {/* Background image to mimic the sand dunes in reference */}
            <div className="absolute inset-0 z-0">
               <LazyImage 
                 src={content.backgroundImage} 
                 alt="Background Texture" 
                 className="w-full h-full object-cover opacity-30 mix-blend-luminosity" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
            </div>

            {/* Inner Glass Card */}
            <div className="relative z-10 w-full h-full bg-white/10 backdrop-blur-2xl rounded-[24px] border border-white/10 p-6 flex flex-col text-center">
               
               {/* Fake Mockup Toolbar */}
               <div className="flex justify-between items-center mb-8">
                 <div className="flex gap-2">
                   <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-zinc-400">
                     <Layout className="w-4 h-4" />
                   </div>
                   <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-zinc-400">
                     <Edit2 className="w-4 h-4" />
                   </div>
                   <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-zinc-400">
                     <Type className="w-4 h-4" />
                   </div>
                 </div>
                 <div className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-medium text-white/80">
                   Update
                 </div>
               </div>
               
               {/* Avatar */}
               <div className="w-[104px] h-[104px] rounded-full overflow-hidden mx-auto mb-5 shadow-2xl mask mask-circle relative border border-white/20">
                 <img 
                   src={content.imageURL} 
                   alt="Community Member Profile" 
                   className="w-full h-full object-cover scale-110" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/30 to-blue-500/30 mix-blend-overlay" />
               </div>
               
               {/* Info */}
               <h3 className="text-[22px] font-medium text-white tracking-tight mb-1">
                 JR Photography
               </h3>
               
               <div className="flex items-center justify-center gap-1.5 text-sm text-[#888888] mb-3">
                 facebook.com <LinkIcon className="w-3.5 h-3.5" />
               </div>
               
               {/* Members */}
               <div className="flex items-center justify-center gap-2 mb-8">
                 <div className="flex -space-x-2">
                   <img className="w-6 h-6 rounded-full border border-[#2A2A2A]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=40&q=80" alt="Community Member Avatar 1" />
                   <img className="w-6 h-6 rounded-full border border-[#2A2A2A]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=40&q=80" alt="Community Member Avatar 2" />
                   <div className="w-6 h-6 rounded-full border border-[#2A2A2A] bg-white/20 flex items-center justify-center text-[8px] font-medium">+</div>
                 </div>
                 <span className="text-[13px] text-zinc-300 font-medium">Active community</span>
               </div>
               
               {/* Join Button */}
               <a 
                 href={content.joinLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full py-4 bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.15em] uppercase rounded-full transition-colors mb-8 shadow-xl active:scale-[0.98] flex items-center justify-center cursor-pointer"
               >
                 Join now
               </a>
               
               {/* Footer Details */}
               <div className="w-full text-left text-[13px] leading-relaxed text-[#A1A1AA] space-y-1.5 mt-auto">
                  <p className="text-zinc-200 font-medium mb-2 text-[14px]">Exclusive artistic access</p>
                  <p>- Premium campaign behind-the-scenes</p>
                  <p>- Private gallery previews & announcements</p>
               </div>
            </div>

            {/* Fab Chat Icon Mimic */}
            <div className="absolute bottom-6 right-6 w-14 h-14 bg-[#2a2c16] rounded-full flex items-center justify-center shadow-2xl z-20 hover:scale-105 transition-transform cursor-pointer border border-[#b6b335]/20">
              <svg className="w-6 h-6 text-[#b6b335]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
          </motion.div>
        </div>

      </div>
    </section>
  );
}
