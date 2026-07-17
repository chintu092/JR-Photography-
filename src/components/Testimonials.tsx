import React, { useState, useEffect, useRef } from "react";
import { REVIEWS } from "../data";
import { ArrowRight, Star, Quote, Loader2 } from "lucide-react";
import { getCollectionData } from "../lib/db-client";
import { Review } from "../types";
import { motion } from "motion/react";
import LazyImage from "./LazyImage";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

gsap.registerPlugin(ScrollTrigger);

let _testimonialsCache: Review[] | null = null;

// Render high-fidelity partner logo equivalents
const renderBrandLogo = (id: string, company: string) => {
  if (company.toLowerCase().includes("envato")) {
    return (
      <div className="flex items-center space-x-1 pt-4 mt-auto">
        <svg className="w-4 h-4 text-luxury-gold fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M21.2 5c-1.3-1.6-3.4-2.6-5.4-2.6-2.5 0-4.8 1.5-5.8 3.8-1-2.3-3.3-3.8-5.8-3.8-2 0-4.1 1-5.4 2.6-.9 1.1-1.3 2.5-1.2 3.9C2 15 10 21.6 10 21.6s8-6.6 8.3-12.7c.1-1.4-.3-2.8-1.1-3.9z" />
        </svg>
        <span className="text-[13px] font-sans font-bold text-zinc-800 tracking-tighter lowercase">envato</span>
      </div>
    );
  }
  
  if (company.toLowerCase().includes("sterling")) {
    return (
      <div className="flex items-center space-x-1.5 text-zinc-800 font-mono select-none mt-auto pt-4">
        <div className="w-2.5 h-2.5 rounded-sm bg-neutral-900 shrink-0 rotate-45" />
        <span className="text-[10px] font-display font-extrabold tracking-[0.15em] text-zinc-900 uppercase">STERLING</span>
      </div>
    );
  }

  if (company.toLowerCase().includes("vogue") || company.toLowerCase().includes("etoile") || company.toLowerCase().includes("étoile")) {
    return (
      <div className="flex items-center space-x-1.5 select-none mt-auto pt-4">
        <span className="text-[11px] font-serif font-black italic tracking-[0.05em] text-zinc-800">
          {company.toLowerCase().includes("vogue") ? "VOGUE" : "L'Étoile"}
        </span>
        <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 select-none mt-auto pt-4 opacity-40 grayscale">
      <span className="text-[10px] font-display font-bold tracking-[0.15em] text-zinc-900 uppercase">{company}</span>
    </div>
  );
};

interface TestimonialCardProps {
  review: Review;
  index: number;
  key?: React.Key;
}

function TestimonialCard({ review, index }: TestimonialCardProps) {
  return (
    <div
      id={`testimonial-card-${index}`}
      className="flex-shrink-0 w-[290px] sm:w-[440px] md:w-[480px] bg-luxury-cream rounded-[40px] p-6 sm:p-8 flex flex-col sm:row gap-5 sm:gap-6 border border-luxury-gray/45 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-luxury-gold/40"
    >
      {/* Left section: Identity and Portrait */}
      <div className="w-full sm:w-[130px] shrink-0 flex flex-col justify-between items-start">
        <div>
          <div className="relative w-24 h-28 sm:w-28 sm:h-36 rounded-2xl overflow-hidden mb-3 border border-white/60 shadow-inner bg-stone-300">
            <LazyImage
              src={review.avatar}
              alt={review.name}
              className="w-full h-full object-cover grayscale contrast-[1.05] hover:grayscale-0 transition-all duration-500"
              containerClassName="w-full h-full"
            />
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Quote className="w-2 h-2 text-zinc-800" />
            </div>
          </div>

          <h4 className="font-display font-bold text-sm sm:text-base text-zinc-900 tracking-tight leading-none">
            {review.name}
          </h4>
          <span className="text-[8.5px] font-mono tracking-widest text-luxury-gold font-extrabold uppercase block mt-1.5 leading-none">
            {review.role}
          </span>
          <span className="text-[8.5px] font-mono text-zinc-500 uppercase block mt-0.5 leading-none">
            {review.company}
          </span>
        </div>

        {renderBrandLogo(review.id, review.company)}
      </div>

      {/* Decorative center divider */}
      <div className="hidden sm:block w-px bg-black/10 self-stretch my-2 shrink-0" />

      {/* Right section: Rating and feedback text */}
      <div className="flex-1 flex flex-col justify-center items-start">
        <div className="flex space-x-1 mb-3">
          {[...Array(review.rating || 5)].map((_, idx) => (
            <Star key={idx} className="w-3 h-3 fill-luxury-gold text-luxury-gold shrink-0" />
          ))}
        </div>

        <blockquote className="text-[13px] sm:text-[15px] md:text-[16px] font-display font-medium text-zinc-800 leading-relaxed text-left tracking-tight select-none">
          “{review.comment}”
        </blockquote>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>(_testimonialsCache || []);
  const [loading, setLoading] = useState(!_testimonialsCache);
  const [headerConfig, setHeaderConfig] = useState({
    pretitle: "TESTIMONIALS",
    title: "Trusted by genius people.",
    subtitle: "Don't just take our word for it, see what leading publications and visionaries say about working with our high-fidelity design studio."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "section_headers"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.testimonials) {
          setHeaderConfig({
            pretitle: data.testimonials.pretitle || "TESTIMONIALS",
            title: data.testimonials.title || "Trusted by genius people.",
            subtitle: data.testimonials.subtitle || "Don't just take our word for it, see what leading publications and visionaries say about working with our high-fidelity design studio."
          });
        }
      }
    }, (error) => {
      console.warn("Error loading testimonials section headers:", error);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const fetched = await getCollectionData<Review>("testimonials");
        setReviews(fetched);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (loading || reviews.length === 0) return;

    let ctx = gsap.context(() => {
      gsap.fromTo(
        ".testimonial-anim-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#testimonials",
            start: "top 70%",
          }
        }
      );
    });

    return () => ctx.revert();
  }, [loading, reviews]);

  // Triple the reviews to ensure visual loop coverage for continuous scrolling
  const duplicatedReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5"
    >
      {/* Background ambient radial glowing spots */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[35rem] h-[35rem] bg-zinc-900/40 rounded-full filter blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-7xl mx-auto relative z-10"
      >
        
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2.5fr] gap-12 lg:gap-8 items-center">
          
          <div className="flex flex-col justify-between z-20 max-w-md lg:pr-6">
            <div>
              <div className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.4em] text-luxury-gold uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-[pulse_2s_infinite]" />
                <span>{headerConfig.pretitle}</span>
              </div>

              <h2 className="font-display font-medium text-4xl sm:text-5xl text-luxury-cream leading-[1.1] uppercase tracking-tight mb-5">
                {headerConfig.title}
              </h2>

              <p className="text-luxury-gray text-xs sm:text-sm leading-relaxed font-light mb-8">
                {headerConfig.subtitle}
              </p>

              <button
                onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.15em] uppercase px-8 py-3.5 rounded-full transition-colors cursor-pointer"
                id="testimonials-quote-btn"
              >
                GET A QUOTE
              </button>
            </div>
          </div>

          <div className="relative w-full overflow-hidden py-4 px-1 [mask-image:_linear-gradient(to_right,transparent_0%,_black_10%,_black_90%,transparent_100%)]">
            
            {loading ? (
              <div className="flex gap-6 w-max py-2 overflow-hidden items-center opacity-70">
                {[...Array(4)].map((_, idx) => (
                  <div key={`skeleton-${idx}`} className="w-[320px] md:w-[350px] shrink-0 p-8 rounded-3xl bg-luxury-charcoal/60 border border-white/5 relative overflow-hidden animate-pulse">
                    <div className="absolute inset-0 bg-white/[0.02]" />
                    <div className="flex space-x-1 mb-6">
                      {[...Array(5)].map((_, s) => <div key={s} className="w-3.5 h-3.5 bg-white/10 rounded-full" />)}
                    </div>
                    <div className="space-y-4 mb-8 relative z-10">
                      <div className="w-full h-4 bg-white/10 rounded" />
                      <div className="w-5/6 h-4 bg-white/10 rounded" />
                      <div className="w-4/6 h-4 bg-white/10 rounded" />
                    </div>
                    <div className="flex items-center space-x-4 border-t border-white/5 pt-5 relative z-10">
                      <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                      <div className="space-y-2 w-full">
                        <div className="w-1/2 h-3 bg-white/10 rounded" />
                        <div className="w-1/3 h-2 bg-white/5 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="w-full text-center py-20 text-luxury-cream/40 font-mono text-xs uppercase tracking-[0.2em] leading-relaxed">
                No client testimonials found.
              </div>
            ) : (
              <div className="flex animate-scroll-right hover:[animation-play-state:paused] gap-6 w-max py-2 cursor-grab active:cursor-grabbing">
                {duplicatedReviews.map((review, index) => (
                  <div key={`${review.id}-${index}`} className="testimonial-anim-card opacity-0">
                    <TestimonialCard
                      review={review}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </motion.div>
    </section>
  );
}

