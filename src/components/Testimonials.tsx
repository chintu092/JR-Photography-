import React from "react";
import { REVIEWS } from "../data";
import { ArrowRight, Star, Quote } from "lucide-react";

// Render high-fidelity partner logo equivalents
const renderBrandLogo = (id: string, company: string) => {
  switch (id) {
    case "r1":
      return (
        <div className="flex items-center space-x-1 pt-4 mt-auto">
          {/* Envato Leaf Logo */}
          <svg className="w-4 h-4 text-[#6D8E1B] fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.2 5c-1.3-1.6-3.4-2.6-5.4-2.6-2.5 0-4.8 1.5-5.8 3.8-1-2.3-3.3-3.8-5.8-3.8-2 0-4.1 1-5.4 2.6-.9 1.1-1.3 2.5-1.2 3.9C2 15 10 21.6 10 21.6s8-6.6 8.3-12.7c.1-1.4-.3-2.8-1.1-3.9z" />
          </svg>
          <span className="text-[13px] font-sans font-bold text-zinc-800 tracking-tighter lowercase">envato</span>
        </div>
      );
    case "r2":
      return (
        <div className="flex items-center space-x-1.5 text-zinc-800 font-mono select-none mt-auto pt-4">
          <div className="w-2.5 h-2.5 rounded-sm bg-neutral-900 shrink-0 rotate-45" />
          <span className="text-[10px] font-display font-extrabold tracking-[0.15em] text-zinc-900 uppercase">STERLING</span>
        </div>
      );
    case "r3":
    default:
      return (
        <div className="flex items-center space-x-1.5 select-none mt-auto pt-4">
          <span className="text-[11px] font-serif font-black italic tracking-[0.05em] text-zinc-800">L'Étoile</span>
          <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full animate-pulse" />
        </div>
      );
  }
};

interface TestimonialCardProps {
  key?: React.Key;
  review: typeof REVIEWS[0];
  index: number;
}

function TestimonialCard({ review, index }: TestimonialCardProps) {
  // Pure elegant, physical light plaster clay look exactly like the screenshot
  return (
    <div
      id={`testimonial-card-${index}`}
      className="flex-shrink-0 w-[290px] sm:w-[440px] md:w-[480px] bg-[#ECECEB] rounded-[40px] p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-6 border border-[#DCDCDA]/45 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:border-[#B7BE43]/40"
    >
      {/* Left section: Identity and Portrait */}
      <div className="w-full sm:w-[130px] shrink-0 flex flex-col justify-between items-start">
        <div>
          <div className="relative w-24 h-28 sm:w-28 sm:h-36 rounded-2xl overflow-hidden mb-3 border border-white/60 shadow-inner bg-stone-300">
            <img
              src={review.avatar}
              alt={review.name}
              className="w-full h-full object-cover grayscale contrast-[1.05] hover:grayscale-0 transition-all duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/80 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Quote className="w-2 h-2 text-zinc-800" />
            </div>
          </div>

          <h4 className="font-display font-bold text-sm sm:text-base text-zinc-900 tracking-tight leading-none">
            {review.name}
          </h4>
          <span className="text-[8.5px] font-mono tracking-widest text-[#6D8E1B] font-extrabold uppercase block mt-1.5 leading-none">
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
            <Star key={idx} className="w-3 h-3 fill-[#6D8E1B] text-[#6D8E1B] shrink-0" />
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
  // Triple the reviews to ensure visual loop coverage for continuous scrolling
  const duplicatedReviews = [...REVIEWS, ...REVIEWS, ...REVIEWS];

  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-32 bg-luxury-black overflow-hidden px-6 md:px-12 border-t border-white/5"
    >
      {/* Background ambient radial glowing spots */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[35rem] h-[35rem] bg-zinc-900/40 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1760px] mx-auto relative z-10">
        
        {/* Elegant layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2.5fr] gap-12 lg:gap-8 items-center">
          
          {/* Left Block: Heading and static description */}
          <div className="flex flex-col justify-between z-20 max-w-md lg:pr-6">
            <div>
              {/* Decorative category label */}
              <div className="flex items-center space-x-2 text-[10px] font-mono tracking-[0.4em] text-[#B7BE43] uppercase mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B7BE43] animate-[pulse_2s_infinite]" />
                <span>TESTIMONIALS</span>
              </div>

              {/* Display Header */}
              <h2 className="font-display font-medium text-4xl sm:text-5xl text-luxury-cream leading-[1.1] uppercase tracking-tight mb-5">
                Trusted by <br className="hidden sm:inline" /> genius people.
              </h2>

              {/* Context text description */}
              <p className="text-luxury-gray text-xs sm:text-sm leading-relaxed font-light mb-8">
                Don't just take our word for it, see what leading publications and visionaries say about working with our high-fidelity design studio.
              </p>

              {/* Action Button */}
              <button
                onClick={() => {
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group inline-flex items-center space-x-3 bg-luxury-black text-white hover:bg-white hover:text-black border border-white/10 rounded-full font-display font-bold text-[10px] sm:text-[11px] tracking-[0.16em] uppercase select-none cursor-pointer p-1.5 pl-6 transition-all duration-300"
                id="testimonials-quote-btn"
              >
                <span>GET A QUOTE</span>
                <div className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#B7BE43] group-hover:text-black">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Left-to-Right Scrolling Infinite Carousel */}
          {/* Applies a soft gradient mask on both ends for neat borders */}
          <div className="relative w-full overflow-hidden py-4 px-1 [mask-image:_linear-gradient(to_right,transparent_0%,_black_10%,_black_90%,transparent_100%)]">
            
            {/* Horizontal Track - Custom left-to-right slide animation on hover pauses */}
            <div className="flex animate-scroll-right hover:[animation-play-state:paused] gap-6 w-max py-2 cursor-grab active:cursor-grabbing">
              {duplicatedReviews.map((review, index) => (
                <TestimonialCard
                  key={`${review.id}-${index}`}
                  review={review}
                  index={index}
                />
              ))}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
