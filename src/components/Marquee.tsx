import { BRAND_LOGOS } from "../data";

export default function Marquee() {
  // Duplicate logos arrays to ensure seamless infinite looping without gaps
  const repeatedBrands = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];

  return (
    <section className="relative py-12 md:py-16 bg-[#000] border-y border-white/5 overflow-hidden select-none">
      {/* Outer Glow limits */}
      <div className="absolute top-0 bottom-0 left-0 w-16 md:w-36 bg-gradient-to-r from-luxury-black to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 md:w-36 bg-gradient-to-l from-luxury-black to-transparent z-10 pointer-events-none" />

      {/* Marquee Wrapper Container */}
      <div className="flex w-[300%] overflow-hidden">
        <div className="flex space-x-12 md:space-x-24 animate-marquee whitespace-nowrap py-2">
          {repeatedBrands.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="flex items-center space-x-3 text-luxury-cream hover:text-luxury-gold transition-colors duration-400 group cursor-default"
            >
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-[0.3em] font-light">
                {brand.name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold opacity-45 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 ml-4 md:ml-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
