import { useState, useEffect, ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, onSnapshot, setDoc, increment, collection } from "firebase/firestore";
import { Helmet, HelmetProvider } from "react-helmet-async";
import CustomCursor from "./components/CustomCursor";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import LoadingScreen from "./components/LoadingScreen";
import LazySection from "./components/LazySection";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import About from "./components/About";
import AboutHero from "./components/AboutHero";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Testimonials from "./components/Testimonials";
import Founder from "./components/Founder";
import Process from "./components/Process";
import Pricing from "./components/Pricing";
import BeforeAfter from "./components/BeforeAfter";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import CommunitySection from "./components/CommunitySection";
import ExifExplorer from "./components/ExifExplorer";
import Footer from "./components/Footer";
import ParallaxDivider from "./components/ParallaxDivider";
import Blog from "./components/Blog";
import BlogDetail from "./components/BlogDetail";
import WorkDetail from "./components/WorkDetail";
import AdminPanel from "./admin/AdminPanel";
import SessionTracker from "./components/SessionTracker";
import CreativeLabs from "./components/CreativeLabs";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === "/about") return "about";
    if (path === "/services") return "services";
    if (path === "/works") return "works";
    if (path === "/blog") return "blog";
    if (path === "/contact") return "contact";
    if (path === "/admin") return "admin";
    
    if (path.startsWith("/works/")) {
      const id = path.substring("/works/".length);
      if (id) return `works-detail-${id}`;
    }
    if (path.startsWith("/blog/")) {
      const id = path.substring("/blog/".length);
      if (id) return `blog-detail-${id}`;
    }

    const hash = window.location.hash.substring(1);
    const validPages = ["home", "about", "services", "works", "blog", "contact", "admin"];
    if (validPages.includes(hash)) {
      return hash;
    }
    if (hash.startsWith("works-detail-")) return hash;
    if (hash.startsWith("blog-detail-")) return hash;

    return "home";
  });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [siteFavicon, setSiteFavicon] = useState<string | null>(null);
  const [brandTextLine1, setBrandTextLine1] = useState<string>("JR");
  const [brandTextLine2, setBrandTextLine2] = useState<string>("PHOTOGRAPHY");
  const [footerCopyrightText, setFooterCopyrightText] = useState<string>("© {YYYY} JR Photography Studio. All rights reserved globally.");
  const [navigationConfig, setNavigationConfig] = useState<any>(null);
  const [themeColors, setThemeColors] = useState<{
    gold: string;
    black: string;
    cream: string;
    gray: string;
  } | null>(null);
  const [globalSeo, setGlobalSeo] = useState<{
    siteName: string;
    defaultTitle: string;
    titleTemplate: string;
    description: string;
    canonicalUrl: string;
    ogImageUrl: string;
    twitterHandle: string;
  } | null>(null);
  const [pageSeo, setPageSeo] = useState<{
    title?: string;
    description?: string;
    canonicalUrl?: string;
    ogImageUrl?: string;
    ogType?: string;
  } | null>(null);

  const [sectionSettings, setSectionSettings] = useState<Record<string, { id: string; visible: boolean; order: number }[]>>({});
  const [dividersConfig, setDividersConfig] = useState<any>({
    divider_1: {
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1600",
      pretitle: "LUXURY WEDDINGS",
      title: "MOMENTS SUSPENDED",
      highlightedText: "In the Ether.",
      description: "Honoring elite matrimonial narratives globally. Operating between Kolkata, domestic destinations, and selective premium destinations worldwide.",
      alignment: "right" as "left" | "center" | "right",
      height: "large" as "screen" | "large" | "medium"
    },
    divider_2: {
      image: "https://images.unsplash.com/photo-1549064492-c416b7418968?auto=format&fit=crop&q=80&w=1600",
      pretitle: "TECHNICAL DEVIATION",
      title: "SCULPTING LEGACIES",
      highlightedText: "With Leica and Arri.",
      description: "A masterwork collection in motion. Operating everywhere between Kolkata, domestic destinations, and curated private villas worldwide.",
      alignment: "left" as "left" | "center" | "right",
      height: "medium" as "screen" | "large" | "medium"
    }
  });

  // Computed SEO based on page and fallback
  const activeSeo = {
    title: pageSeo?.title || globalSeo?.defaultTitle || "Award Winning Best Wedding Photographer in Kolkata | JR Photography",
    description: pageSeo?.description || globalSeo?.description || "JR Photography — Award Winning Best Candid Wedding Photographer in Kolkata. We specialize in Candid Wedding Photography, Pre Wedding Photography, Bengali Wedding Photography, and Premium Cinematic Wedding Films.",
    keywords: "Best Wedding Photographer in Kolkata, Award Winning Best Wedding Photographer in Kolkata, Candid Wedding Photography, Pre Wedding Photography, Maternity & Baby Photography, Bengali Wedding Photography, Rice Ceremony Photography, Wedding Films",
    canonicalUrl: pageSeo?.canonicalUrl || globalSeo?.canonicalUrl || "",
    ogImageUrl: pageSeo?.ogImageUrl || globalSeo?.ogImageUrl || "",
    siteName: globalSeo?.siteName || "JR Photography",
    titleTemplate: globalSeo?.titleTemplate || "%s | JR Photography",
    twitterHandle: globalSeo?.twitterHandle || "",
    ogType: pageSeo?.ogType || (currentPage === "home" ? "website" : "article")
  };

  // Sync site settings (Logo & Favicon) from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSiteLogo(data.logoUrl || null);
        setSiteFavicon(data.faviconUrl || null);
        setBrandTextLine1(data.brandTextLine1 || "JR");
        setBrandTextLine2(data.brandTextLine2 || "PHOTOGRAPHY");
        if (data.footerCopyrightText) {
          setFooterCopyrightText(data.footerCopyrightText);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/general");
    });
    return unsub;
  }, []);

  // Sync Navigation configuration
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "navigation"), (docSnap) => {
      if (docSnap.exists()) {
        setNavigationConfig(docSnap.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/navigation");
    });
    return unsub;
  }, []);

  // Sync Theme settings from Firestore and apply to CSS
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "theme"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const colors = {
          gold: data.gold,
          black: data.black,
          cream: data.cream,
          gray: data.gray,
        };
        setThemeColors(colors);
        
        // Inject variables into root for real-time reactivity
        const root = document.documentElement;
        root.style.setProperty('--luxury-gold', colors.gold);
        root.style.setProperty('--luxury-black', colors.black);
        root.style.setProperty('--luxury-cream', colors.cream);
        root.style.setProperty('--luxury-gray', colors.gray);
        
        // Also update background color for smooth transitions
        root.style.backgroundColor = colors.black;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/theme");
    });
    return unsub;
  }, []);

  // Sync Global SEO settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "seo"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGlobalSeo({
          siteName: data.siteName || "JR Photography",
          defaultTitle: data.defaultTitle || "Luxury Photography",
          titleTemplate: data.titleTemplate || "%s | JR Photography",
          description: data.defaultDescription || "",
          canonicalUrl: data.canonicalUrl || "",
          ogImageUrl: data.defaultOgImage || "",
          twitterHandle: data.twitterHandle || "",
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/seo");
    });
    return unsub;
  }, []);

  // Sync Dividers configuration
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "dividers"), (docSnap) => {
      if (docSnap.exists()) {
        setDividersConfig(docSnap.data());
      }
    }, (error) => {
      console.warn("Failed to subscribe to settings/dividers:", error);
    });
    return unsub;
  }, []);

  // Sync Page-specific SEO settings from Firestore
  useEffect(() => {
    if (!currentPage || currentPage === "admin") {
      setPageSeo(null);
      return;
    }

    if (currentPage.startsWith("works-detail-")) {
      const workId = currentPage.replace("works-detail-", "");
      const unsub = onSnapshot(doc(db, "portfolio", workId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPageSeo({
            title: `${data.title} | Portfolio`,
            description: data.description || "",
            canonicalUrl: window.location.origin ? `${window.location.origin}/works/${workId}` : "",
            ogImageUrl: data.image || "",
            ogType: "article",
          });
        } else {
          setPageSeo(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `portfolio/${workId}`);
      });
      return unsub;
    } else if (currentPage.startsWith("blog-detail-")) {
      const blogId = currentPage.replace("blog-detail-", "");
      const unsub = onSnapshot(doc(db, "blog", blogId), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setPageSeo({
            title: `${data.title} | Blog`,
            description: data.summary || "",
            canonicalUrl: window.location.origin ? `${window.location.origin}/blog/${blogId}` : "",
            ogImageUrl: data.coverImage || "",
            ogType: "article",
          });
        } else {
          setPageSeo(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `blog/${blogId}`);
      });
      return unsub;
    }

    const unsub = onSnapshot(doc(db, "settings", "seo", "pages", currentPage), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPageSeo({
          title: data.title || "",
          description: data.description || "",
          canonicalUrl: data.canonicalUrl || "",
          ogImageUrl: data.ogImageUrl || "",
          ogType: data.ogType || "website",
        });
      } else {
        setPageSeo(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `settings/seo/pages/${currentPage}`);
    });
    return unsub;
  }, [currentPage]);

  // Sync page sections layout order & visibility from Firestore
  useEffect(() => {
    const q = collection(db, "page_sections");
    const unsub = onSnapshot(q, (snapshot) => {
      const configs: Record<string, { id: string; visible: boolean; order: number }[]> = {};
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.sections) {
          const sorted = [...data.sections].sort((a, b) => a.order - b.order);
          configs[docSnap.id] = sorted;
        }
      });
      setSectionSettings(configs);
    }, (error) => {
      console.error("Failed to subscribe to page sections layout config:", error);
    });
    return unsub;
  }, []);

  // Real-time Analytics Tracker
  useEffect(() => {
    // Only track if not in admin panel and page is loaded
    if (currentPage === "admin" || loading) return;

    const trackAnalytics = async () => {
      try {
        const analyticsRef = doc(db, "settings", "analytics");
        const isNewSession = !sessionStorage.getItem("visited");
        
        const timestamp = new Date();
        const payload: any = {
          pageViews: increment(1),
          updatedAt: timestamp
        };

        if (isNewSession) {
          sessionStorage.setItem("visited", "true");
          payload.uniqueVisitors = increment(1);
        }

        await setDoc(analyticsRef, payload, { merge: true });
      } catch (error) {
        console.warn("Failed to update real-time analytics:", error);
      }
    };

    trackAnalytics();
  }, [currentPage, loading]);

  // Handle system theme preferences fallback
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Handle popstate & Hash changes for backwards-compatible browser navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      if (path === "/about") {
        setCurrentPage("about");
        return;
      }
      if (path === "/services") {
        setCurrentPage("services");
        return;
      }
      if (path === "/works") {
        setCurrentPage("works");
        return;
      }
      if (path === "/blog") {
        setCurrentPage("blog");
        return;
      }
      if (path === "/contact") {
        setCurrentPage("contact");
        return;
      }
      if (path === "/admin") {
        setCurrentPage("admin");
        return;
      }
      
      if (path.startsWith("/works/")) {
        const id = path.substring("/works/".length);
        if (id) {
          setCurrentPage(`works-detail-${id}`);
          return;
        }
      }
      if (path.startsWith("/blog/")) {
        const id = path.substring("/blog/".length);
        if (id) {
          setCurrentPage(`blog-detail-${id}`);
          return;
        }
      }

      // Fallback: Hash checking for backwards compatibility
      const hash = window.location.hash.substring(1);
      const validPages = ["home", "about", "services", "works", "blog", "contact", "admin"];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      } else if (hash.startsWith("works-detail-") || hash.startsWith("blog-detail-")) {
        setCurrentPage(hash);
      } else if (path === "/" || path === "/home") {
        setCurrentPage("home");
      }
    };

    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);

    const handleNavigateEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail === "string") {
        setCurrentPage(customEvent.detail);
      }
    };
    window.addEventListener("navigate-to-page", handleNavigateEvent);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      window.removeEventListener("navigate-to-page", handleNavigateEvent);
    };
  }, []);

  // Sync state page changes back to the browser's URL path (slugs)
  useEffect(() => {
    if (loading) return;

    let targetPath = "/";
    if (currentPage === "about") targetPath = "/about";
    else if (currentPage === "services") targetPath = "/services";
    else if (currentPage === "works") targetPath = "/works";
    else if (currentPage === "blog") targetPath = "/blog";
    else if (currentPage === "contact") targetPath = "/contact";
    else if (currentPage === "admin") targetPath = "/admin";
    else if (currentPage.startsWith("works-detail-")) {
      const id = currentPage.replace("works-detail-", "");
      targetPath = `/works/${id}`;
    } else if (currentPage.startsWith("blog-detail-")) {
      const id = currentPage.replace("blog-detail-", "");
      targetPath = `/blog/${id}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page: currentPage }, "", targetPath);
    }
  }, [currentPage, loading]);

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
          initial={{ opacity: 0, filter: "brightness(0)" }}
          animate={{ opacity: 1, filter: "brightness(1)" }}
          exit={{ opacity: 0, filter: "brightness(0)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
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
          initial={{ opacity: 0, filter: "brightness(0)" }}
          animate={{ opacity: 1, filter: "brightness(1)" }}
          exit={{ opacity: 0, filter: "brightness(0)" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <BlogDetail blogId={blogId} onBack={() => setCurrentPage("blog")} />
        </motion.div>
      );
    }

    // 3. Main Route definitions
    const homeRenderMap: Record<string, ReactNode> = {
      marquee: <div key="home-marquee"><LazySection><Marquee /></LazySection></div>,
      about: <div key="home-about"><LazySection><About /></LazySection></div>,
      services: <div key="home-services"><LazySection><Services /></LazySection></div>,
      divider_1: (
        <div key="home-divider_1">
          <LazySection>
            <ParallaxDivider
              image={dividersConfig.divider_1?.image}
              pretitle={dividersConfig.divider_1?.pretitle}
              title={dividersConfig.divider_1?.title}
              highlightedText={dividersConfig.divider_1?.highlightedText}
              description={dividersConfig.divider_1?.description}
              alignment={dividersConfig.divider_1?.alignment}
              height={dividersConfig.divider_1?.height}
            />
          </LazySection>
        </div>
      ),
      creative_labs: <div key="home-creative_labs"><LazySection><CreativeLabs /></LazySection></div>,
      portfolio: <div key="home-portfolio"><LazySection><Portfolio onSelectWork={(id) => setCurrentPage(`works-detail-${id}`)} /></LazySection></div>,
      testimonials: <div key="home-testimonials"><Testimonials /></div>,
      founder: <div key="home-founder"><LazySection><Founder /></LazySection></div>,
      divider_2: (
        <div key="home-divider_2">
          <LazySection>
            <ParallaxDivider
              image={dividersConfig.divider_2?.image}
              pretitle={dividersConfig.divider_2?.pretitle}
              title={dividersConfig.divider_2?.title}
              highlightedText={dividersConfig.divider_2?.highlightedText}
              description={dividersConfig.divider_2?.description}
              alignment={dividersConfig.divider_2?.alignment}
              height={dividersConfig.divider_2?.height}
            />
          </LazySection>
        </div>
      ),
      exif_explorer: <div key="home-exif_explorer"><LazySection><ExifExplorer /></LazySection></div>,
      before_after: <div key="home-before_after"><LazySection><BeforeAfter /></LazySection></div>,
      process: <div key="home-process"><LazySection><Process pageId="home" /></LazySection></div>,
      pricing: <div key="home-pricing"><LazySection><Pricing /></LazySection></div>,
      blog: <div key="home-blog"><LazySection><Blog pageId="home" onSelectBlog={(id) => setCurrentPage(`blog-detail-${id}`)} /></LazySection></div>,
      faq: <div key="home-faq"><LazySection><FAQ pageId="home" /></LazySection></div>,
      contact: <div key="home-contact"><LazySection><Contact /></LazySection></div>,
    };

    const renderHomeSections = () => {
      const defaultOrder = [
        { id: "marquee", visible: true },
        { id: "about", visible: true },
        { id: "services", visible: true },
        { id: "divider_1", visible: true },
        { id: "creative_labs", visible: true },
        { id: "portfolio", visible: true },
        { id: "testimonials", visible: true },
        { id: "founder", visible: true },
        { id: "divider_2", visible: true },
        { id: "exif_explorer", visible: true },
        { id: "before_after", visible: true },
        { id: "process", visible: true },
        { id: "pricing", visible: true },
        { id: "blog", visible: true },
        { id: "faq", visible: true },
        { id: "contact", visible: true },
      ];
      const currentConfig = sectionSettings.home || defaultOrder;
      return currentConfig
        .filter(sec => sec.visible)
        .map(sec => homeRenderMap[sec.id])
        .filter(Boolean);
    };

    const aboutRenderMap: Record<string, ReactNode> = {
      about: <div key="about-content"><About /></div>,
      divider: (
        <div key="about-divider">
          <ParallaxDivider
            image={dividersConfig.divider_2?.image}
            pretitle={dividersConfig.divider_2?.pretitle}
            title={dividersConfig.divider_2?.title}
            highlightedText={dividersConfig.divider_2?.highlightedText}
            description={dividersConfig.divider_2?.description}
            alignment={dividersConfig.divider_2?.alignment}
            height={dividersConfig.divider_2?.height}
          />
        </div>
      ),
      faq: <div key="about-faq"><FAQ pageId="about" /></div>,
    };

    const renderAboutSections = () => {
      const defaultOrder = [
        { id: "about", visible: true },
        { id: "divider", visible: true },
        { id: "faq", visible: true },
      ];
      const currentConfig = sectionSettings.about || defaultOrder;
      return currentConfig
        .filter(sec => sec.visible)
        .map(sec => aboutRenderMap[sec.id])
        .filter(Boolean);
    };

    const servicesRenderMap: Record<string, ReactNode> = {
      services: <div key="services-content"><Services /></div>,
      process: <div key="services-process"><Process pageId="services" /></div>,
      pricing: <div key="services-pricing"><Pricing /></div>,
      faq: <div key="services-faq"><FAQ pageId="services" /></div>,
    };

    const renderServicesSections = () => {
      const defaultOrder = [
        { id: "services", visible: true },
        { id: "process", visible: true },
        { id: "pricing", visible: true },
        { id: "faq", visible: true },
      ];
      const currentConfig = sectionSettings.services || defaultOrder;
      return currentConfig
        .filter(sec => sec.visible)
        .map(sec => servicesRenderMap[sec.id])
        .filter(Boolean);
    };

    const worksRenderMap: Record<string, ReactNode> = {
      portfolio: <div key="works-portfolio"><Portfolio onSelectWork={(id) => setCurrentPage(`works-detail-${id}`)} /></div>,
    };

    const renderWorksSections = () => {
      const defaultOrder = [
        { id: "portfolio", visible: true },
      ];
      const currentConfig = sectionSettings.works || defaultOrder;
      return currentConfig
        .filter(sec => sec.visible)
        .map(sec => worksRenderMap[sec.id])
        .filter(Boolean);
    };

    const blogRenderMap: Record<string, ReactNode> = {
      blog: <div key="blog-content"><Blog pageId="blog" onSelectBlog={(id) => setCurrentPage(`blog-detail-${id}`)} /></div>,
    };

    const renderBlogSections = () => {
      const defaultOrder = [
        { id: "blog", visible: true },
      ];
      const currentConfig = sectionSettings.blog || defaultOrder;
      return currentConfig
        .filter(sec => sec.visible)
        .map(sec => blogRenderMap[sec.id])
        .filter(Boolean);
    };

    const contactRenderMap: Record<string, ReactNode> = {
      contact: <div key="contact-content"><Contact /></div>,
      faq: <div key="contact-faq"><FAQ pageId="contact" /></div>,
    };

    const renderContactSections = () => {
      const defaultOrder = [
        { id: "contact", visible: true },
        { id: "faq", visible: true },
      ];
      const currentConfig = sectionSettings.contact || defaultOrder;
      return currentConfig
        .filter(sec => sec.visible)
        .map(sec => contactRenderMap[sec.id])
        .filter(Boolean);
    };

    switch (currentPage) {
      case "admin":
        return (
          <motion.div
            key="admin-page"
            initial={{ opacity: 0, filter: "brightness(0)" }}
            animate={{ opacity: 1, filter: "brightness(1)" }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <AdminPanel onBack={() => setCurrentPage("home")} />
          </motion.div>
        );

      case "about":
        return (
          <motion.div
            key="about-page"
            initial={{ opacity: 0, filter: "brightness(0)", y: 10 }}
            animate={{ opacity: 1, filter: "brightness(1)", y: 0 }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <AboutHero />
            {renderAboutSections()}
          </motion.div>
        );

      case "services":
        return (
          <motion.div
            key="services-page"
            initial={{ opacity: 0, filter: "brightness(0)", y: 10 }}
            animate={{ opacity: 1, filter: "brightness(1)", y: 0 }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {renderServicesSections()}
          </motion.div>
        );

      case "works":
        return (
          <motion.div
            key="works-page"
            initial={{ opacity: 0, filter: "brightness(0)", y: 10 }}
            animate={{ opacity: 1, filter: "brightness(1)", y: 0 }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {renderWorksSections()}
          </motion.div>
        );

      case "blog":
        return (
          <motion.div
            key="blog-page"
            initial={{ opacity: 0, filter: "brightness(0)", y: 10 }}
            animate={{ opacity: 1, filter: "brightness(1)", y: 0 }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {renderBlogSections()}
          </motion.div>
        );

      case "contact":
        return (
          <motion.div
            key="contact-page"
            initial={{ opacity: 0, filter: "brightness(0)", y: 10 }}
            animate={{ opacity: 1, filter: "brightness(1)", y: 0 }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {renderContactSections()}
          </motion.div>
        );

      case "home":
      default:
        return (
          <motion.div
            key="home-page"
            initial={{ opacity: 0, filter: "brightness(0)" }}
            animate={{ opacity: 1, filter: "brightness(1)" }}
            exit={{ opacity: 0, filter: "brightness(0)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Hero />
            {renderHomeSections()}
          </motion.div>
        );
    }
  };

  return (
    <HelmetProvider>
      <div className="relative min-h-screen bg-luxury-black text-luxury-cream overflow-x-hidden selection:bg-luxury-gold selection:text-luxury-black">
        <Helmet>
          <title>
            {activeSeo.title 
              ? activeSeo.titleTemplate.replace("%s", activeSeo.title)
              : activeSeo.siteName}
          </title>
          <link rel="icon" href={siteFavicon || "/assets/image/Logo/site_logo.png"} />
          {activeSeo.description && <meta name="description" content={activeSeo.description} />}
          {activeSeo.keywords && <meta name="keywords" content={activeSeo.keywords} />}
          {activeSeo.canonicalUrl && <link rel="canonical" href={activeSeo.canonicalUrl} />}
          
          {/* Open Graph */}
          <meta property="og:title" content={activeSeo.title || activeSeo.siteName} />
          {activeSeo.description && <meta property="og:description" content={activeSeo.description} />}
          {activeSeo.ogImageUrl && <meta property="og:image" content={activeSeo.ogImageUrl} />}
          {activeSeo.canonicalUrl && <meta property="og:url" content={activeSeo.canonicalUrl} />}
          <meta property="og:type" content={activeSeo.ogType} />
          <meta property="og:site_name" content={activeSeo.siteName} />

          {/* Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          {activeSeo.twitterHandle && <meta name="twitter:site" content={activeSeo.twitterHandle} />}
          <meta name="twitter:title" content={activeSeo.title || activeSeo.siteName} />
          {activeSeo.description && <meta name="twitter:description" content={activeSeo.description} />}
          {activeSeo.ogImageUrl && <meta name="twitter:image" content={activeSeo.ogImageUrl} />}
          
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              "name": activeSeo.siteName || "JR Photography",
              "image": activeSeo.ogImageUrl || "",
              "url": activeSeo.canonicalUrl || "https://rigbiswas.com",
              "telephone": "",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Kolkata",
                "addressRegion": "West Bengal",
                "addressCountry": "IN"
              },
              "priceRange": "$$$"
            })}
          </script>
        </Helmet>

        {/* Immersive SVG subtle noise grain overlay */}
      <div className="grain-overlay" />

      {/* Preloading Screen Experience */}
      <LoadingScreen onComplete={() => setLoading(false)} />

      {!loading && (
        <>
          {/* Active Session and device/IP live tracker */}
          <SessionTracker currentPage={currentPage} />

          {/* Custom mouse follower ring and dot */}
          <CustomCursor />
          
          <FloatingWhatsApp />

          {/* Sticky blurred Navigation wrapper */}
          {currentPage !== "admin" && (
            <Navbar 
              currentPage={currentPage} 
              onNavigate={setCurrentPage} 
              theme={theme} 
              onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}
              logoUrl={siteLogo}
              navConfig={navigationConfig?.headerLinks}
              brandTextLine1={brandTextLine1}
              brandTextLine2={brandTextLine2}
            />
          )}

          {/* Scrolling sections inside AnimatePresence routing dispatcher */}
          <main className="pt-0">
            <AnimatePresence mode="wait">
              {renderPage()}
            </AnimatePresence>
          </main>

          {/* Giant typography luxury footer */}
          {currentPage !== "admin" && (
            <>
              <CommunitySection />
              <Footer 
                onNavigate={setCurrentPage} 
                logoUrl={siteLogo}
                exploreConfig={navigationConfig?.footerExploreLinks}
                legalConfig={navigationConfig?.footerLegalLinks}
                copyrightText={footerCopyrightText}
              />
            </>
          )}
        </>
      )}
    </div>
    </HelmetProvider>
  );
}
