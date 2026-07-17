import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FAQS } from "../data";
import { Plus, Minus, HelpCircle, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { db } from "../lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { FaqItem } from "../types";

interface FAQProps {
  pageId?: string;
}

export default function FAQ({ pageId = "home" }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerConfig, setHeaderConfig] = useState({
    pretitle: "ACCORDION ARCHIVE",
    title: "FREQUENT INQUIRIES",
    subtitle: "Everything you need to know about preparing for medium format campaigns, timelines, copyright, and physical print shipping."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "section_headers"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const pageKey = pageId === "home" ? "faq" : `faq_${pageId}`;
        const faqData = data[pageKey] || data.faq;
        
        if (faqData) {
          setHeaderConfig({
            pretitle: faqData.pretitle || "ACCORDION ARCHIVE",
            title: faqData.title || "FREQUENT INQUIRIES",
            subtitle: faqData.subtitle || "Everything you need to know about preparing for medium format campaigns, timelines, copyright, and physical print shipping."
          });
        }
      }
    }, (error) => {
      console.warn("Error loading FAQ section headers:", error);
    });
    return unsub;
  }, [pageId]);

  useEffect(() => {
    async function loadFaqs() {
      try {
        const docRef = doc(db, "faq_pages", pageId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists() && snapshot.data().faqs?.length) {
          setFaqs(snapshot.data().faqs);
        } else if (pageId !== "home") {
          // fallback to home page if no specific FAQs text for this page
          const fallbackSnap = await getDoc(doc(db, "faq_pages", "home"));
          if (fallbackSnap.exists() && fallbackSnap.data().faqs?.length) {
            setFaqs(fallbackSnap.data().faqs);
          } else {
            setFaqs(FAQS); // local fallback
          }
        } else {
          setFaqs(FAQS); // local fallback
        }
      } catch (err) {
        setFaqs(FAQS);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, [pageId]);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) return <div className="py-24 flex justify-center"><div className="w-6 h-6 border-2 border-luxury-gold border-t-transparent rounded-full animate-spin" /></div>;

  if (faqs.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <section id="faq" className="relative py-24 md:py-36 bg-[#0E0E0E] overflow-hidden px-6 md:px-12 border-t border-white/5">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      {/* Background radial lighting */}
      <div className="absolute bottom-[10%] left-[8%] w-[25rem] h-[25rem] bg-luxury-gold/3 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-20">
          <div className="inline-flex items-center space-x-2 text-luxury-gold text-xs tracking-[0.4em] font-mono uppercase">
            <HelpCircle className="w-4 h-4 text-luxury-gold" />
            <span>{headerConfig.pretitle}</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-luxury-cream uppercase tracking-wide">
            {headerConfig.title}
          </h2>
          <p className="max-w-md mx-auto text-xs text-luxury-gray font-light leading-relaxed">
            {headerConfig.subtitle}
          </p>
        </div>

        {/* Minimal Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
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
