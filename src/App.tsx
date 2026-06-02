import { useState, useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import CustomCursor from "./components/CustomCursor";
import LoadingScreen from "./components/LoadingScreen";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import About from "./components/About";
import Services from "./components/Services";
import ComparisonSlider from "./components/ComparisonSlider";
import Portfolio from "./components/Portfolio";
import Testimonials from "./components/Testimonials";
import Founder from "./components/Founder";
import Process from "./components/Process";
import Pricing from "./components/Pricing";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { BEFORE_AFTER_IMAGE } from "./data";
import ParallaxDivider from "./components/ParallaxDivider";
import Blog from "./components/Blog";
import BlogDetail from "./components/BlogDetail";
import WorkDetail from "./components/WorkDetail";
import UploadSection from "./components/UploadSection";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [theme] = useState<"dark">("dark");

  // Handle system theme preferences fallback
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }, []);

  // Handle browser hash navigation support (e.g. #about, #contact, #works)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const validPages = ["home", "about", "services", "works", "blog", "contact"];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Initial check
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Sync scroll triggers and Lenis on page changes
  useEffect(() => {
    if (loading) return;

    // Reset scroll positions smoothly on page transition
    window.scrollTo({ top: 0, behavior: "instant" as any });

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential easing
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Give standard DOM elements a slight delay to fully paint before applying GSAP
    const timeout = setTimeout(() => {
      // Dynamic scroll reveals for headings and text
      const reveals = document.querySelectorAll(".reveal-el");
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // Parallax container backgrounds
      const bgTriggers = document.querySelectorAll(".parallax-bg-wrapper");
      bgTriggers.forEach((el) => {
        const bg = el.querySelector(".parallax-bg");
        if (bg) {
          gsap.fromTo(
            bg,
            { yPercent: -10 },
            {
              yPercent: 10,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      });

      // Recalculate ScrollTriggers once layout settling is complete
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timeout);
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [loading, currentPage]);

  const renderPage = () => {
    // 1. Works Detail page parsing
    if (currentPage.startsWith("works-detail-")) {
      const workId = currentPage.replace("works-detail-", "");
      return (
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WorkDetail 
            workId={workId} 
            onBack={() => setCurrentPage("works")} 
            onNavigateToContact={() => setCurrentPage("contact")} 
          />
        </motion.div>
      );
    }

    // 2. Blog Detail page parsing
    if (currentPage.startsWith("blog-detail-")) {
      const blogId = currentPage.replace("blog-detail-", "");
      return (
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BlogDetail blogId={blogId} onBack={() => setCurrentPage("blog")} />
        </motion.div>
      );
    }

    // 3. Main Route definitions
    switch (currentPage) {
      case "about":
        return (
          <motion.div
            key="about-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <About />
            <ParallaxDivider
              image="https://images.unsplash.com/photo-1549064492-c416b7418968?auto=format&fit=crop&q=80&w=1600"
              pretitle="TECHNICAL DEVIATION"
              title="SCULPTING LEGACIES"
              highlightedText="With Leica and Arri."
              description="A masterwork collection in motion. Operating everywhere between Milan, Paris, Lake Como, and curated private villas worldwide."
              alignment="left"
              height="medium"
            />
            <FAQ />
          </motion.div>
        );

      case "services":
        return (
          <motion.div
            key="services-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <Services />
            <Process />
            <Pricing />
            <FAQ />
          </motion.div>
        );

      case "works":
        return (
          <motion.div
            key="works-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <Portfolio onSelectWork={(id) => setCurrentPage(`works-detail-${id}`)} />
          </motion.div>
        );

      case "blog":
        return (
          <motion.div
            key="blog-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <Blog onSelectBlog={(id) => setCurrentPage(`blog-detail-${id}`)} />
          </motion.div>
        );

      case "contact":
        return (
          <motion.div
            key="contact-page"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <Contact />
            <FAQ />
          </motion.div>
        );

      case "home":
      default:
        return (
          <motion.div
            key="home-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Hero />
            <Marquee />
            <About />
            <Services />
            <ComparisonSlider
              beforeImg={BEFORE_AFTER_IMAGE.before}
              afterImg={BEFORE_AFTER_IMAGE.after}
              title="COLOR SCIENCE LABORATORY"
              description="Experience the delicate balance of light and color with our interactive retouching laboratory."
            />
            {/* <UploadSection /> */}
            
            {/* Luxury Weddings Divider */}
            <ParallaxDivider
              image="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600"
              pretitle="LUXURY WEDDINGS"
              title="MOMENTS SUSPENDED"
              highlightedText="In the Ether."
              description="Honoring elite matrimonial narratives globally. Operating between Paris, Milan, Lake Como and selective premium destinations worldwide."
              alignment="right"
              height="large"
            />

            <Portfolio onSelectWork={(id) => setCurrentPage(`works-detail-${id}`)} />

            <Testimonials />
            <Founder />

            {/* Technical Deviation Parallax Divider restored to home page as requested */}
            <ParallaxDivider
              image="https://images.unsplash.com/photo-1549064492-c416b7418968?auto=format&fit=crop&q=80&w=1600"
              pretitle="TECHNICAL DEVIATION"
              title="SCULPTING LEGACIES"
              highlightedText="With Leica and Arri."
              description="A masterwork collection in motion. Operating everywhere between Milan, Paris, Lake Como, and curated private villas worldwide."
              alignment="left"
              height="medium"
            />

            <Process />
            <Pricing />

            {/* Editorial blog publications section on the landing page */}
            <Blog onSelectBlog={(id) => setCurrentPage(`blog-detail-${id}`)} />

            <FAQ />
            <Contact />
          </motion.div>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-luxury-black text-luxury-cream overflow-x-hidden selection:bg-luxury-gold selection:text-luxury-black">
      {/* Immersive SVG subtle noise grain overlay */}
      <div className="grain-overlay" />

      {/* Preloading Screen Experience */}
      <LoadingScreen onComplete={() => setLoading(false)} />

      {!loading && (
        <>
          {/* Custom mouse follower ring and dot */}
          <CustomCursor />

          {/* Sticky blurred Navigation wrapper */}
          <Navbar 
            currentPage={currentPage} 
            onNavigate={setCurrentPage} 
            theme={theme} 
          />

          {/* Scrolling sections inside AnimatePresence routing dispatcher */}
          <main className="pt-0">
            <AnimatePresence mode="wait">
              {renderPage()}
            </AnimatePresence>
          </main>

          {/* Giant typography luxury footer */}
          <Footer onNavigate={setCurrentPage} />
        </>
      )}
    </div>
  );
}
