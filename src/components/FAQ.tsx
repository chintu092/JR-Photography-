import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FAQS } from "../data";
import { Plus, Minus, HelpCircle, ArrowRight } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-24 md:py-36 bg-[#0E0E0E] overflow-hidden px-6 md:px-12 border-t border-white/5">
      {/* Background radial lighting */}
      <div className="absolute bottom-[10%] left-[8%] w-[25rem] h-[25rem] bg-luxury-gold/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-20">
          <div className="inline-flex items-center space-x-2 text-luxury-gold text-xs tracking-[0.4em] font-mono uppercase">
            <HelpCircle className="w-4 h-4 text-luxury-gold" />
            <span>ACCORDION ARCHIVE</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-luxury-cream uppercase tracking-wide">
            FREQUENT INQUIRIES
          </h2>
          <p className="max-w-md mx-auto text-xs text-luxury-gray font-light leading-relaxed">
            Everything you need to know about preparing for medium format campaigns, timelines, copyright, and physical print shipping.
          </p>
        </div>

        {/* Minimal Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.id}
                className="bg-[#111]/40 border border-white/5 rounded-[24px] overflow-hidden hover:border-white/10 transition-colors duration-450"
              >
                {/* Accordion header button tab */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-4 text-luxury-cream hover:text-luxury-gold transition-colors duration-300"
                  id={`faq-toggle-${faq.id}`}
                >
                  <span className="font-display text-base md:text-[18px] font-bold uppercase tracking-wide">
                    {faq.question}
                  </span>
                  
                  {/* Circle plus/minus indicator */}
                  <span className={`p-2 bg-white/5 rounded-full text-luxury-gold transition-transform duration-300 ${isOpen ? "rotate-180 bg-luxury-gold/10" : ""}`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>

                {/* FAQ answer animation container */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                    >
                      <div className="px-6 md:px-8 pb-8 text-xs sm:text-sm text-luxury-gray leading-relaxed font-light border-t border-white/3 pt-4">
                        <p>{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Actionable Prompt Below FAQs */}
        <div className="mt-16 text-center border-t border-white/5 pt-8">
          <p className="text-xs font-mono text-luxury-gray uppercase tracking-widest">
            STILL HAVE AN UNRESOLVED CUSTOM REQUIREMENT?{" "}
            <a
              href="#contact"
              className="text-luxury-gold hover:text-luxury-cream font-bold underline transition-all ml-1 cursor-pointer inline-flex items-center"
            >
              INQUIRE DIRECTLY <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </a>
          </p>
        </div>

      </div>
    </section>
  );
}
