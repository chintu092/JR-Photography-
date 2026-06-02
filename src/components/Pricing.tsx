import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { PRICING_PLANS } from "../data";
import { PricingTier } from "../types";
import { Check, Star, AlertCircle, ArrowRight, Sparkles, Crown, Diamond } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface PricingCardProps {
  key?: React.Key;
  tier: PricingTier;
  index: number;
  handlePricingClick: (name: string) => void;
}

function PricingCard({ tier, index, handlePricingClick }: PricingCardProps) {
  const markerRef = useRef<HTMLDivElement>(null);

  // Track the scroll of a hidden flow marker positioned above the card
  const { scrollYProgress } = useScroll({
    target: markerRef,
    offset: ["start 100px", "end start"],
  });

  // Calculate high-fidelity physics-based stacked transformations
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, -18]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.85], [0, 0.5]);

  // Map icons and specific styles per tier
  const getTierMetadata = (id: string) => {
    switch (id) {
      case "p1":
        return {
          icon: <Sparkles className="w-5 h-5 text-luxury-gold" />,
          duration: "3 - 4 WEEKS",
          cardBg: "bg-gradient-to-br from-[#121212] via-[#0D0D0D] to-[#141414]",
          iconBg: "bg-white/5 border-white/10",
          borderStyle: "border-white/5 hover:border-luxury-gold/20",
          priceColor: "text-luxury-cream",
          buttonStyle: "bg-neutral-800 hover:bg-white text-luxury-cream hover:text-black",
          accentColor: "text-luxury-gold",
          checkBg: "bg-luxury-gold/10 border-luxury-gold/20 text-luxury-gold"
        };
      case "p2":
        return {
          icon: <Crown className="w-5 h-5 text-[#DE8E67]" />,
          duration: "4 - 6 WEEKS",
          cardBg: "bg-gradient-to-br from-[#1A1513] via-[#0E0B0A] to-[#25150E]",
          iconBg: "bg-[#DE8E67]/10 border-[#DE8E67]/20",
          borderStyle: "border-[#DE8E67]/30 hover:border-[#DE8E67]/60 shadow-2xl shadow-[#DE8E67]/5",
          priceColor: "text-[#E9967A] dark:text-[#F3A589]",
          buttonStyle: "bg-[#F5F5F5] text-black hover:bg-luxury-gold hover:text-black shadow-xl",
          accentColor: "text-[#DE8E67]",
          checkBg: "bg-[#DE8E67]/10 border-[#DE8E67]/20 text-[#DE8E67]"
        };
      case "p3":
      default:
        return {
          icon: <Diamond className="w-5 h-5 text-[#1E5662]" />,
          duration: "6 - 8 WEEKS",
          cardBg: "bg-gradient-to-br from-[#0F1415] via-[#0B0D0D] to-[#121A1C]",
          iconBg: "bg-[#1E5662]/10 border-[#1E5662]/20",
          borderStyle: "border-[#1E5662]/20 hover:border-[#1E5662]/50",
          priceColor: "text-[#54B1C5]",
          buttonStyle: "bg-[#1E5662]/20 border border-[#1E5662]/30 hover:bg-white hover:text-black text-luxury-cream",
          accentColor: "text-[#54B1C5]",
          checkBg: "bg-[#1E5662]/10 border-[#1E5662]/20 text-[#54B1C5]"
        };
    }
  };

  const meta = getTierMetadata(tier.id);

  return (
    <div className="relative w-full pricing-card-wrapper opacity-0">
      {/* Hidden scroll flow offset marker element */}
      <div ref={markerRef} className="absolute -top-12 left-0 w-full h-1 pointer-events-none" />

      {/* Sticky layout container */}
      <motion.div
        className={`sticky w-full rounded-[40px] p-6 sm:p-10 lg:p-12 mb-12 flex flex-col lg:flex-row gap-8 lg:gap-16 border transition-all duration-500 overflow-hidden ${meta.cardBg} ${meta.borderStyle}`}
        style={{
          top: `calc(105px + ${index * 24}px)`,
          zIndex: 10 + index,
          scale,
          y: yOffset,
        }}
      >
        {/* Dynamic Shadow Layer for physical depth perception */}
        <motion.div 
          className="absolute inset-0 bg-[#050505] pointer-events-none z-30 rounded-[40px]"
          style={{ opacity: overlayOpacity }}
        />

        {/* Visual background glass grain overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[20rem] h-[20rem] bg-white/[0.01] rounded-full filter blur-3xl pointer-events-none" />

        {/* Left side: Plan Identity & Icon */}
        <div className="lg:w-1/2 flex flex-col justify-between relative z-10">
          <div>
            {/* Top Row: Icon squircle and Optional Highlight badge */}
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${meta.iconBg} shadow-inner`}>
                {meta.icon}
              </div>

              {tier.highlight && (
                <div className="px-3.5 py-1.5 bg-[#DE8E67]/10 text-[#DE8E67] border border-[#DE8E67]/20 rounded-full text-[8.5px] font-mono tracking-widest uppercase flex items-center space-x-1.5 animate-pulse">
                  <Star className="w-3 h-3 fill-[#DE8E67]" />
                  <span>CLIENT PREFERENCE</span>
                </div>
              )}
            </div>

            {/* Heading */}
            <h3 className="font-display text-2xl sm:text-4.5xl font-black uppercase text-luxury-cream tracking-tight max-w-sm leading-none mb-4">
              {tier.name}
            </h3>

            {/* Descr */}
            <p className="text-xs sm:text-sm text-luxury-gray font-light leading-relaxed max-w-md">
              {tier.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              {tier.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[8px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.01] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Delivery Time Info at the bottom */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase">
              ESTIMATED DELIVERY
            </span>
            <span className="text-xs font-mono font-bold text-luxury-cream tracking-wider">
              {meta.duration}
            </span>
          </div>
        </div>

        {/* Right side: Price & Features checklist */}
        <div className="lg:w-1/2 flex flex-col justify-between relative z-10 lg:border-l lg:border-white/5 lg:pl-12">
          <div>
            {/* Huge Price Display */}
            <div className="flex items-baseline space-x-2 pb-5 sm:pb-6">
              <span className={`text-4xl sm:text-6xl font-display font-black tracking-tight ${meta.priceColor}`}>
                {tier.price}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em]">
                / deposit foundation
              </span>
            </div>

            {/* Line separator */}
            <div className="border-t border-white/5 w-full mb-6" />

            {/* Features items */}
            <ul className="space-y-4 mb-8 sm:mb-10">
              {tier.features.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start space-x-3.5 text-[11px] sm:text-xs text-luxury-cream">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-0.5 ${meta.checkBg}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="font-light leading-relaxed text-zinc-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button & Disclaimer info */}
          <div>
            <button
              onClick={() => handlePricingClick(tier.name)}
              className={`group w-full py-4.5 px-6 rounded-full font-display font-bold text-[10px] sm:text-xs tracking-[0.22em] uppercase focus:outline-none transition-all duration-300 ${meta.buttonStyle} flex items-center justify-center space-x-2`}
              id={`pricing-book-${tier.id}`}
            >
              <span>SELECT PLAN FOUNDATION</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>

            <span className="text-[8.5px] font-mono text-[#555] text-center block mt-3.5 uppercase tracking-widest">
              * Complete NDA options and customizable riders available
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const cards = containerRef.current?.querySelectorAll(".pricing-card-wrapper");
    if (!cards || cards.length === 0) return;

    const ctx = gsap.context(() => {
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 80,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              toggleActions: "play none none none",
            },
            delay: index * 0.12,
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handlePricingClick = (planName: string) => {
    // Fill the contact form subject and scroll to contact
    const contactSubject = document.getElementById("contact-subject") as HTMLInputElement;
    if (contactSubject) {
      contactSubject.value = `Inquire Shoot Tier: ${planName}`;
    }
    const messageField = document.getElementById("contact-message") as HTMLTextAreaElement;
    if (messageField) {
      messageField.value = `Hello JR Photography team, I would like to inquire about the physical and visual details of the "${planName}" package. Please let us know raw dates calendar availability.`;
    }
    const contactSection = document.getElementById("contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section 
      ref={containerRef}
      id="pricing" 
      className="relative py-24 md:py-36 bg-[#090909] overflow-hidden px-6 md:px-12 border-t border-white/5"
    >
      {/* Background neon visual ambient element */}
      <div className="absolute top-[30%] right-[5%] w-[45rem] h-[45rem] bg-luxury-gold/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[35rem] h-[35rem] bg-[#DE8E67]/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1440px] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 md:mb-28 gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase block mb-4">
              RESERVATIONS & RATES
            </span>
            <h2 className="font-display font-black text-4xl sm:text-6xl text-luxury-cream uppercase tracking-wide leading-none">
              INVESTMENTS & RATES
            </h2>
          </div>
          <p className="max-w-md text-sm text-luxury-gray leading-relaxed font-light">
            We operate fully customized commissions under premium confidentiality. Select a foundation profile below to initiate your aesthetic direction journey.
          </p>
        </div>

        {/* Stacked Interactive Cards Wrapper */}
        <div className="relative pt-4 pb-12 flex flex-col">
          {PRICING_PLANS.map((tier, index) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              index={index}
              handlePricingClick={handlePricingClick}
            />
          ))}
        </div>

        {/* Pricing Help Notice block */}
        <div className="glass-panel p-6 sm:p-8 rounded-[32px] mt-16 flex flex-col md:flex-row justify-between items-center bg-[#111]/30 border border-white/5 gap-6">
          <div className="flex items-center space-x-4 max-w-xl text-left">
            <AlertCircle className="w-5 h-5 text-luxury-gold shrink-0" />
            <p className="text-xs text-luxury-gray font-light leading-relaxed">
              <strong>Need a private NDA shoot or global travel arrangements?</strong> We understand high-profile client demands. Our production squad handles discrete security, intellectual copyright bypass, and dedicated travel support globally.
            </p>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("contact");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-6 py-3.5 bg-white/5 hover:bg-white hover:text-black rounded-full text-xs text-luxury-cream border border-white/10 tracking-widest uppercase whitespace-nowrap transition-all duration-300"
            id="pricing-custom-inquiry-btn"
          >
            Request Private NDA Custom Proposal
          </button>
        </div>

      </div>
    </section>
  );
}
