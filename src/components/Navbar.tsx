import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, ArrowUpRight, Instagram, Dribbble, Sun, Moon } from "lucide-react";
import { audioService } from "../utils/audio";
import Logo from "./Logo";

const NAV_ITEMS: NavItem[] = [
  { id: "nav1", label: "Home", actionId: "home" },
  { id: "nav2", label: "About", actionId: "about" },
  { id: "nav3", label: "Process", actionId: "services" },
  { id: "nav4", label: "Works", actionId: "works" },
  { id: "nav5", label: "Blog", actionId: "blog" },
  { id: "nav6", label: "Contact", actionId: "contact" }
];

interface NavItem {
  id: string; // internal id for drag/drop or mapping
  label: string;
  actionId: string; // The page ID or URL
  isExternal?: boolean;
}

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  theme: string;
  onToggleTheme: () => void;
  logoUrl?: string | null;
  navConfig?: NavItem[];
  brandTextLine1?: string;
  brandTextLine2?: string;
}

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  theme, 
  onToggleTheme, 
  logoUrl = null, 
  navConfig,
  brandTextLine1,
  brandTextLine2
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fallback to static if not available
  const displayItems = navConfig !== undefined ? navConfig : NAV_ITEMS;


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    audioService.playClick();
    onNavigate(pageId);
    setMobileMenuOpen(false);
    
    // Scroll window back to top on transitions
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHover = () => {
    audioService.playWhoosh();
  };

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          scrolled ? "bg-luxury-black/70 backdrop-blur-md py-4 border-b border-white/5" : "bg-transparent py-6"
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          {/* Brand Logo */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <a 
              href="/" 
              onClick={(e) => handleNavClick(e, "home")}
              onMouseEnter={handleHover}
              className="flex items-center space-x-1 group"
              id="nav-logo"
            >
              <Logo variant="icon" src={logoUrl} brandTextLine1={brandTextLine1} brandTextLine2={brandTextLine2} />
            </a>
          </motion.div>

          {/* Large Screen Nav */}
          <nav className="hidden lg:flex items-center space-x-1.5 bg-black/30 p-1.5 rounded-full border border-white/5 backdrop-blur-sm">
            {displayItems.map((item, idx) => {
              // Normalize sub-level pages (e.g., works-detail gets Works marked as active)
              const isWorkActive = item.actionId === "works" && currentPage.startsWith("works");
              const isBlogActive = item.actionId === "blog" && currentPage.startsWith("blog");
              const isActive = currentPage === item.actionId || isWorkActive || isBlogActive;

              if (item.isExternal) {
                return (
                  <motion.a
                    key={item.id}
                    href={item.actionId}
                    target="_blank"
                    rel="noreferrer"
                    onMouseEnter={handleHover}
                    className="relative text-[11px] font-display font-medium tracking-[0.15em] uppercase px-4 py-2 rounded-full transition-colors duration-300 text-luxury-gray hover:text-luxury-cream"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + idx * 0.05, ease: "easeOut" }}
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      {item.label} <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </motion.a>
                );
              }

              return (
                <motion.a
                  key={item.id}
                  href={item.actionId === "home" ? "/" : `/${item.actionId}`}
                  onClick={(e) => handleNavClick(e, item.actionId)}
                  onMouseEnter={handleHover}
                  className={`relative text-[11px] font-display font-medium tracking-[0.15em] uppercase px-4 py-2 rounded-full transition-colors duration-300 ${
                    isActive ? "text-luxury-black" : "text-luxury-gray hover:text-luxury-cream"
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + idx * 0.05, ease: "easeOut" }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBackground"
                      className="absolute inset-0 bg-luxury-gold rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </motion.a>
              );
            })}
          </nav>

          {/* CTA Link - Inquire Now & Theme Toggle */}
          <motion.div 
            className="hidden lg:flex items-center space-x-4"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: "easeOut" }}
          >
            {/* Theme Toggle Button */}
            <button
               onClick={() => {
                 audioService.playClick();
                 onToggleTheme();
               }}
               onMouseEnter={handleHover}
               className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 text-luxury-cream hover:text-luxury-gold transition-colors"
               aria-label="Toggle Theme"
            >
               {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* CTA Link - Inquire Now */}
            <a
                href="#contact"
                onClick={(e) => handleNavClick(e, "contact")}
                onMouseEnter={handleHover}
                className="group flex items-center space-x-2 text-[11px] font-display font-bold uppercase py-2.5 px-5 bg-white text-black hover:bg-luxury-gold hover:text-black rounded-full transition-all duration-300 shadow-lg hover:shadow-luxury-gold/10"
                id="nav-cta-btn"
            >
                <span>INQUIRE NOW</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </a>
          </motion.div>

          {/* Hamburger Icon */}
          <button
            onClick={() => {
              audioService.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            onMouseEnter={handleHover}
            className="lg:hidden p-2 text-luxury-cream hover:text-luxury-gold transition-colors cursor-pointer"
            aria-label="Toggle menu"
            id="mobile-menu-toggle-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-luxury-black z-30 flex flex-col justify-between pt-24 p-8 border-r border-white/5 lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
          >
            <div className="flex flex-col space-y-6">
              <span className="text-[10px] font-mono tracking-widest text-luxury-gray border-b border-white/5 pb-2 uppercase flex justify-between items-center">
                <span>Browse Directory</span>
                <button 
                  onClick={(e) => handleNavClick(e, "admin")}
                  className="text-[9px] text-luxury-gold/40 hover:text-luxury-gold transition-colors"
                >
                  Admin Portal
                </button>
              </span>
              <nav className="flex flex-col space-y-4">
                {displayItems.map((item, index) => {
                  const isWorkActive = item.actionId === "works" && currentPage.startsWith("works");
                  const isBlogActive = item.actionId === "blog" && currentPage.startsWith("blog");
                  const isActive = currentPage === item.actionId || isWorkActive || isBlogActive;

                  if (item.isExternal) {
                    return (
                      <motion.a
                        key={item.id}
                        href={item.actionId}
                        target="_blank"
                        rel="noreferrer"
                        onMouseEnter={handleHover}
                        className="text-xl font-display font-semibold tracking-wider uppercase transition-colors flex items-center justify-between text-luxury-cream hover:text-luxury-gold"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="flex items-center gap-2">{item.label} <ArrowUpRight className="w-5 h-5" /></span>
                      </motion.a>
                    );
                  }

                  return (
                    <motion.a
                      key={item.id}
                      href={item.actionId === "home" ? "/" : `/${item.actionId}`}
                      onClick={(e) => handleNavClick(e, item.actionId)}
                      onMouseEnter={handleHover}
                      className={`text-xl font-display font-semibold tracking-wider uppercase transition-colors flex items-center justify-between ${
                        isActive ? "text-luxury-gold" : "text-luxury-cream hover:text-luxury-gold"
                      }`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <span>{item.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 bg-luxury-gold rounded-full" />}
                    </motion.a>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="flex flex-col space-y-6 pt-6 border-t border-white/5">


              <div className="flex space-x-4">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  onMouseEnter={handleHover}
                  onClick={() => audioService.playClick()}
                  className="p-2.5 rounded-full bg-white/5 text-luxury-cream hover:bg-luxury-gold/15 hover:text-luxury-gold transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://dribbble.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  onMouseEnter={handleHover}
                  onClick={() => audioService.playClick()}
                  className="p-2.5 rounded-full bg-white/5 text-luxury-cream hover:bg-luxury-gold/15 hover:text-luxury-gold transition-colors"
                >
                  <Dribbble className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    audioService.playClick();
                    onToggleTheme();
                  }}
                  onMouseEnter={handleHover}
                  className="p-2.5 rounded-full bg-white/5 text-luxury-cream hover:bg-luxury-gold/15 hover:text-luxury-gold transition-colors ml-auto"
                  aria-label="Toggle Theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] font-mono text-luxury-gray uppercase tracking-widest">
                Kolkata • India • Worldwide
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
