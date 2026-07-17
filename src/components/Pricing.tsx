import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { PricingTier } from "../types";
import { Check, Star, AlertCircle, ArrowRight, Sparkles, Crown, Diamond, Loader2 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { PRICING_PLANS as fallbackPricingTiers } from "../data";

interface PricingCardProps {
  key?: React.Key;
  tier: PricingTier;
  index: number;
  handlePricingClick: (name: string) => void;
}

function PricingCard({ tier, index, handlePricingClick }: PricingCardProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("default");

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
  const getTierMetadata = (stylePreset?: string, idx: number = 0) => {
    const preset = stylePreset || `p${(idx % 3) + 1}`;
    switch (preset) {
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

  const meta = getTierMetadata(tier.stylePreset, index);

  const isDefaultSelected = selectedVariantId === "default";
  const activeVariant = (tier.variants || []).find(v => v.id === selectedVariantId);

  const displayName = isDefaultSelected 
    ? tier.name 
    : (activeVariant?.name || tier.name);

  const displayPrice = isDefaultSelected 
    ? tier.price 
    : activeVariant?.price;

  const displayDelivery = isDefaultSelected 
    ? (tier.duration || meta.duration) 
    : activeVariant?.duration;

  // Plan description always remains static and same for all options
  const displayDescription = tier.description;

  // Plan features update dynamically based on the selected variant's description/services list
  const displayFeatures = isDefaultSelected
    ? (tier.features || [])
    : (activeVariant?.description || "")
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);

  const getSelectedStyle = (isSelected: boolean) => {
    if (isSelected) {
      switch (tier.stylePreset || `p${(index % 3) + 1}`) {
        case "p1":
          return "bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30 shadow-lg shadow-luxury-gold/5";
        case "p2":
          return "bg-[#DE8E67]/10 text-[#DE8E67] border-[#DE8E67]/30 shadow-lg shadow-[#DE8E67]/5";
        case "p3":
        default:
          return "bg-[#1E5662]/10 text-[#54B1C5] border-[#1E5662]/30 shadow-lg shadow-[#1E5662]/5";
      }
    }
    return "bg-white/[0.01]/10 text-zinc-400 border-white/5 hover:border-white/10 hover:text-white";
  };

  const getDotStyle = (isSelected: boolean) => {
    if (isSelected) {
      switch (tier.stylePreset || `p${(index % 3) + 1}`) {
        case "p1":
          return "bg-luxury-gold";
        case "p2":
          return "bg-[#DE8E67]";
        case "p3":
        default:
          return "bg-[#54B1C5]";
      }
    }
    return "bg-zinc-600";
  };

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
          className="absolute inset-0 bg-luxury-black pointer-events-none z-30 rounded-[40px]"
          style={{ opacity: overlayOpacity }}
        />

        {/* Visual background glass grain overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[20rem] h-[20rem] bg-white/[0.01] rounded-full filter blur-3xl pointer-events-none" />

        {/* Left side: Plan Identity & Icon */}
        <div className="lg:w-1/2 flex flex-col justify-between relative z-10 text-left">
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
            <h3 className="font-display text-2xl sm:text-4.5xl font-black uppercase text-luxury-cream tracking-tight max-w-sm leading-none mb-4 min-h-[3rem] line-clamp-2">
              {displayName}
            </h3>

            {/* Descr */}
            <p className="text-xs sm:text-sm text-luxury-gray font-light leading-relaxed max-w-md min-h-[4rem]">
              {displayDescription}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-5">
              {(tier.tags || []).map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[8px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.01] text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Variants Radio Toggle Group */}
            {tier.variants && tier.variants.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                <span className="text-[9px] font-mono tracking-[0.22em] text-[#cfb53b] uppercase block font-bold">
                  Select Package Variant
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedVariantId("default")}
                    className={`px-3 py-2 rounded-xl text-[9.5px] font-mono tracking-wider uppercase border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${getSelectedStyle(selectedVariantId === "default")}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-transform ${getDotStyle(selectedVariantId === "default")}`} />
                    Standard Rate
                  </button>

                  {tier.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-3 py-2 rounded-xl text-[9.5px] font-mono tracking-wider uppercase border transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${getSelectedStyle(selectedVariantId === v.id)}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full transition-transform ${getDotStyle(selectedVariantId === v.id)}`} />
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Time Info at the bottom */}
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase">
              ESTIMATED DELIVERY
            </span>
            <span className="text-xs font-mono font-bold text-luxury-cream tracking-wider">
              {displayDelivery}
            </span>
          </div>
        </div>

        {/* Right side: Price & Features checklist */}
        <div className="lg:w-1/2 flex flex-col justify-between relative z-10 lg:border-l lg:border-white/5 lg:pl-12 text-left">
          <div>
            {/* Huge Price Display */}
            <div className="flex items-baseline pb-5 sm:pb-6">
              <span className={`text-4xl sm:text-6xl font-display font-black tracking-tight whitespace-nowrap ${meta.priceColor}`}>
                {displayPrice}
              </span>
            </div>

            {/* Line separator */}
            <div className="border-t border-white/5 w-full mb-6" />

            {/* Features items */}
            <ul className="space-y-4 mb-8 sm:mb-10 animate-fade-in">
              {displayFeatures.map((feature, fIdx) => (
                <li key={fIdx} className="flex items-start space-x-3.5 text-[11px] sm:text-xs text-luxury-cream animate-none">
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
              onClick={() => handlePricingClick(displayName)}
              className="group w-full py-4.5 px-6 rounded-full font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.15em] uppercase focus:outline-none transition-all bg-[#2a2c16] hover:bg-[#34371b] text-[#b6b335] flex items-center justify-center space-x-2 active:scale-95 cursor-pointer"
              id={`pricing-book-${tier.id}`}
            >
              <span>SELECT PLAN FOUNDATION</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>

            <span className="text-[8.5px] font-mono text-zinc-500 text-center block mt-3.5 uppercase tracking-widest">
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
  const [plans, setPlans] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerConfig, setHeaderConfig] = useState({
    pretitle: "RESERVATIONS & RATES",
    title: "INVESTMENTS & RATES",
    subtitle: "We operate fully customized commissions under premium confidentiality. Select a foundation profile below to initiate your aesthetic direction journey."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "section_headers"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pricing) {
          setHeaderConfig({
            pretitle: data.pricing.pretitle || "RESERVATIONS & RATES",
            title: data.pricing.title || "INVESTMENTS & RATES",
            subtitle: data.pricing.subtitle || "We operate fully customized commissions under premium confidentiality. Select a foundation profile below to initiate your aesthetic direction journey."
          });
        }
      }
    }, (error) => {
      console.warn("Error loading pricing section headers:", error);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "pricing_plans"));
        let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PricingTier));
        if (fetched.length > 0) {
          fetched.sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : 999;
            const orderB = b.order !== undefined ? b.order : 999;
            return orderA - orderB;
          });
          setPlans(fetched);
        } else {
          // Fallback to offline hardcoded
          setPlans(fallbackPricingTiers);
        }
      } catch (err) {
        console.error("Error loading dynamic plans, falling back:", err);
        setPlans(fallbackPricingTiers);
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  useEffect(() => {
    if (loading || plans.length === 0) return;

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

    // Refresh layout geometry
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [loading, plans]);

  const handlePricingClick = (planName: string) => {
    // 1. Store the selected plan globally for Wayfic dynamic form prepopulation
    (window as any).pendingSelectedPlan = planName;

    // 2. Dispatch event to update form values if WayficFormRenderer is already rendered
    const applyEvent = new CustomEvent("apply-plan-selection", { detail: { planName } });
    window.dispatchEvent(applyEvent);

    // 3. Fallback for static elements (pre-existing elements)
    const contactSubject = document.getElementById("contact-subject") as HTMLInputElement;
    if (contactSubject) {
      contactSubject.value = `Inquire Shoot Tier: ${planName}`;
    }
    const messageField = document.getElementById("contact-message") as HTMLTextAreaElement;
    if (messageField) {
      messageField.value = `Hello JR Photography team, I would like to inquire about the physical and visual details of the "${planName}" package. Please let us know raw dates calendar availability.`;
    }

    // 4. Handle navigation / scroll redirect
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    } else {
      // If we are on an inner page (like services tab) where the contact section is not present:
      // Redirect to the dedicated contact portal page
      const navEvent = new CustomEvent("navigate-to-page", { detail: "contact" });
      window.dispatchEvent(navEvent);
    }
  };

  return (
    <section 
      ref={containerRef}
      id="pricing" 
      className="relative py-24 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5"
    >
      {/* Background neon visual ambient element */}
      <div className="absolute top-[30%] right-[5%] w-[45rem] h-[45rem] bg-luxury-gold/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[35rem] h-[35rem] bg-[#DE8E67]/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 md:mb-28 gap-6">
          <div>
            <span className="text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase block mb-4">
              {headerConfig.pretitle}
            </span>
            <h2 className="font-display font-black text-4xl sm:text-6xl text-luxury-cream uppercase tracking-wide leading-none">
              {headerConfig.title}
            </h2>
          </div>
          <p className="max-w-md text-sm text-luxury-gray leading-relaxed font-light">
            {headerConfig.subtitle}
          </p>
        </div>

        {/* Stacked Interactive Cards Wrapper */}
        <div className="relative pt-4 pb-12 flex flex-col min-h-[300px] justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 text-luxury-gold">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">Aligning dynamic collections...</span>
            </div>
          ) : plans.filter(tier => tier.active !== false).length === 0 ? (
            <div className="text-center py-24 bg-[#0a0a0a]/40 border border-white/5 rounded-[40px] animate-in fade-in duration-500">
              <span className="text-[10px] font-mono tracking-[0.3em] text-[#cfb53b] uppercase block mb-3 font-bold">
                COMMISSIONS FULL
              </span>
              <p className="text-xs text-luxury-gray font-light max-w-sm mx-auto leading-relaxed">
                All foundational packages are currently reserved. Please request a customized proposal below to secure calendar priority bookings.
              </p>
            </div>
          ) : (
            plans.filter(tier => tier.active !== false).map((tier, index) => (
              <PricingCard
                key={tier.id}
                tier={tier}
                index={index}
                handlePricingClick={handlePricingClick}
              />
            ))
          )}
        </div>

        {/* Pricing Help Notice block */}
        <div className="glass-panel p-6 sm:p-8 rounded-[32px] mt-16 flex flex-col md:flex-row justify-between items-center bg-luxury-black/30 border border-white/5 gap-6">
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
            className="text-[#b6b335] hover:text-white font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase cursor-pointer transition-all duration-300 py-2 border-b border-[#b6b335]/30 hover:border-[#b6b335]"
            id="pricing-custom-inquiry-btn"
          >
            Request Private NDA Custom Proposal
          </button>
        </div>

      </div>
    </section>
  );
}
