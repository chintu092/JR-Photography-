import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Save, Loader2, Plus, Trash2, Image as ImageIcon, Sparkles, 
  ChevronRight, AlignLeft, Info, HelpCircle, Laptop, Smartphone,
  Sliders, ArrowUp, ArrowDown, BookOpen, Settings
} from "lucide-react";
import ImagePreviewInput from "./ImagePreviewInput";
import { PROCESS_STEPS } from "../../data";
import { ProcessStep } from "../../types";

type ActiveSubTab = "marquee" | "about" | "founder" | "labs" | "before_after" | "exif" | "contact" | "dividers" | "headers" | "process";

interface SectionContentManagerProps {
  initialSubTab?: ActiveSubTab;
}

export default function SectionContentManager({ initialSubTab }: SectionContentManagerProps = {}) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>(initialSubTab || "about");

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedFaqHeaderPage, setSelectedFaqHeaderPage] = useState<"faq" | "faq_home" | "faq_about" | "faq_services" | "faq_contact">("faq");
  const [selectedBlogHeaderPage, setSelectedBlogHeaderPage] = useState<"blog" | "blog_home">("blog");
  const [selectedProcessHeaderPage, setSelectedProcessHeaderPage] = useState<"process" | "process_home" | "process_services">("process");

  // Section Headers State
  const [sectionHeadersData, setSectionHeadersData] = useState({
    services: {
      pretitle: "SPECIALTIES",
      title: "OUR LUXURY ARCHITECTURES",
      subtitle: "Each discipline represents an absolute commitment to medium-format precision, bespoke color profiles, and award-winning lighting."
    },
    portfolio: {
      pretitle: "STUDIO PORTFOLIO",
      title: "SELECTED REVERIES",
      subtitle: ""
    },
    testimonials: {
      pretitle: "TESTIMONIALS",
      title: "Trusted by genius people.",
      subtitle: "Don't just take our word for it, see what leading publications and visionaries say about working with our high-fidelity design studio."
    },
    critically_acclaimed: {
      pretitle: "CRITICALLY ACCLAIMED DEPT",
      title: "AVANT-GARDE VISION. METICULOUS PHYSICAL FORMS.",
      subtitle: "Capturing raw human emotion, sophisticated silhouettes, and high-fashion aesthetics, preserving museum-grade physical visual legacies to cherish forever."
    },
    process: {
      pretitle: "CLIENT EXPERIENCE",
      title: "THE REVOLVE TIMELINE",
      subtitle: "An uncompromising five-step operational methodology ensuring absolute precision from moodboard conceptualization to final museum-grade deliverables."
    },
    process_home: {
      pretitle: "CLIENT EXPERIENCE",
      title: "THE REVOLVE TIMELINE",
      subtitle: "An uncompromising five-step operational methodology ensuring absolute precision from moodboard conceptualization to final museum-grade deliverables."
    },
    process_services: {
      pretitle: "SERVICES PROCESS",
      title: "WORKFLOW TIMELINE",
      subtitle: "How we curate and execute bespoke photography commissions from creative brief to final museum-grade deliverables."
    },
    pricing: {
      pretitle: "RESERVATIONS & RATES",
      title: "INVESTMENTS & RATES",
      subtitle: "We operate fully customized commissions under premium confidentiality. Select a foundation profile below to initiate your aesthetic direction journey."
    },
    blog: {
      pretitle: "EDITORIAL PUBLICATION",
      title: "THE CHRONICLES",
      subtitle: "An premium dispatch center detailing color science research and medium-format lens physics from our directors on location."
    },
    blog_home: {
      pretitle: "STUDIO JOURNAL",
      title: "THE LATEST JOURNAL",
      subtitle: "Recent dispatches and research notes from our directors on location."
    },
    faq: {
      pretitle: "ACCORDION ARCHIVE",
      title: "FREQUENT INQUIRIES",
      subtitle: "Everything you need to know about preparing for medium format campaigns, timelines, copyright, and physical print shipping."
    },
    faq_home: {
      pretitle: "ACCORDION ARCHIVE",
      title: "FREQUENT INQUIRIES",
      subtitle: "Everything you need to know about preparing for medium format campaigns, timelines, copyright, and physical print shipping."
    },
    faq_about: {
      pretitle: "ABOUT INQUIRIES",
      title: "ABOUT REVERIES & DETAILS",
      subtitle: "Answers to common questions regarding our creative background, director experience, and bespoke equipment."
    },
    faq_services: {
      pretitle: "SERVICES DETAILS",
      title: "SPECIALTY COMMISSIONS FAQ",
      subtitle: "Everything you need to know about booking bespoke photography architectures, production timelines, and licensing."
    },
    faq_contact: {
      pretitle: "BOOKING ARCHIVE",
      title: "RESERVATION INQUIRIES",
      subtitle: "Frequently asked questions regarding our scheduling availability, travel options, and custom print commission requests."
    }
  });

  // Dividers State
  const [dividersData, setDividersData] = useState({
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

  // Marquee State
  const [marqueeData, setMarqueeData] = useState({
    tickerItems: ["FINE ART WEDDINGS", "EDITORIAL ESSENCE", "LUXURY STORYTELLING", "CINEMATIC CAPTURES"]
  });

  // About State
  const [aboutData, setAboutData] = useState({
    badge: "OUR PHILOSOPHY",
    title: "WE DO NOT RECORD LIGHT. We sculpt it. TO HARNESS THE EXTRAORDINARY.",
    description1: "Founded in 2011, JR Photography has evolved into an award-winning, premium photography agency, recognized as the best wedding photographer in Kolkata, operating all over India. We bring back your pleasant memories of your special day with utmost care.",
    description2: "We capture fine-art fashion, elite wedding stories, luxury pre-wedding shoots, and beautiful Bengali ceremonies. Our team frames every candid moment, then weaves the pictures magically to create a value for a lifetime, delivering cinematic reality instead of mechanical defaults.",
    btn1Text: "Explore Archives",
    btn1Link: "#works",
    btn2Text: "Become a client",
    btn2Link: "#contact",
    rigorIndex: 98,
    focalPrecision: "99.8%",
    colorFidelity: "100% Labs",
    archivalLifespan: "200+ Yrs",
    stats: [
      { val: "15+", lbl: "YEARS OF ESSENCE", desc: "Kolkata workshops" },
      { val: "500+", lbl: "HIGH-END COMMISSIONS", desc: "Selective fashion editorials" },
      { val: "100+", lbl: "GLOBAL CLIENTS", desc: "Elite international vault" },
      { val: "35+", lbl: "ELITE TROPHIES", desc: "Global design certificates" }
    ],
    arsenalTitle: "Precision Instruments",
    arsenalDesc: "We demand absolute technical rigor. Our primary toolset is meticulously curated to deliver uncompromising fidelity, dynamic range, and cinematic depth for large-scale editorial and luxury captures.",
    gear: [
      { type: "Medium Format", gear: "Fujifilm GFX 100S", focus: "Studio & High-End Edits" },
      { type: "Primary 35mm", gear: "Sony Alpha a7R V", focus: "Location & Speed" },
      { type: "Prime Lenses", gear: "85mm f/1.4 GM", focus: "Cinematic Portraiture" },
      { type: "Wide Angle", gear: "24-70mm f/2.8 GM II", focus: "Environmental Scope" },
      { type: "Lighting", gear: "Profoto Pro-11", focus: "Precise Light Sculpting" },
      { type: "Aerial", gear: "DJI Mavic 3 Cine", focus: "Grand Perspectives" }
    ]
  });

  // Founder State
  const [founderData, setFounderData] = useState({
    title: "The Founder",
    badge: "MEET THE CREATIVE DIRECTOR",
    bgName: "Meet Jayanta",
    description: "Jayanta Roy is a fine-art photographer and visual system architect focused on crafting bold, functional photographic legacies. He collaborates with elite fashion houses, editorial agencies, and selective matrimonial clients to balance absolute classic analog depth with micro-precision color science. Based in Kolkata, he experiments daily with medium format sensor dynamics in our master studio.",
    avatar: "/assets/image/Founder/profile.jpg",
    sealText: "WINNING DESIGNER • SINCE 2011 •",
    twitter: "https://twitter.com",
    dribbble: "https://dribbble.com",
    instagram: "https://instagram.com",
    experiences: [
      { role: "Founder at JR Studio", years: "2024-Now" },
      { role: "Creative Director at Leica Labs", years: "2018-2024" },
      { role: "Lead Editorialist at Vogue Paris", years: "2015-2018" },
      { role: "Associate Photographer at Condé Nast", years: "2011-2015" }
    ]
  });

  // Creative Labs Cards State
  const [labsData, setLabsData] = useState({
    cards: [
      { id: "lc1", title: "Computational Discovery", category: "learn", tag: "TEST RUN", description: "Agentic research engine that generates and scores code variations to help discover models and accelerate iteration.", image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=600", linkText: "Learn More", color: "#3b82f6", darkTheme: false },
      { id: "lc2", title: "Literature Insights", category: "learn", tag: "READING", description: "Literature tool to find papers, structure data tables, and create artifacts like reports, slide decks, and more.", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600", linkText: "Learn More", color: "#eab308", darkTheme: false },
      { id: "lc3", title: "Learn Your Way", category: "learn", tag: "COURSE 1", description: "An AI learning tool that transforms content into a dynamic and engaging experience tailored for you.", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600", linkText: "Try It Now", color: "#f97316", darkTheme: false },
      { id: "lc5", title: "Stitch", category: "develop", tag: "STITCH", description: "An AI design canvas that transforms natural language into high-fidelity UI you can iterate and collaborate on.", image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=600", linkText: "Try It Now", color: "#10b981", darkTheme: true },
      { id: "lc7", title: "dreambeans", category: "explore", tag: "DREAMBEANS", description: "Dreambeans provides personalized collections of stories each day covering the things that matter most to you.", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600", linkText: "Learn More", color: "#f43f5e", darkTheme: false, bgColor: "#FAF6F0", textColor: "#433422" },
      { id: "lc9", title: "Pomelli", category: "create", tag: "POMELLI", description: "An AI-powered marketing tool designed to build scalable, on-brand content to help you connect with your audience faster.", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600", linkText: "Try It Now", color: "#84cc16", darkTheme: false }
    ]
  });

  // Before After State
  const [beforeAfterData, setBeforeAfterData] = useState({
    pretitle: "VISUAL CALIBRATION",
    title: "Aesthetic Preservation",
    description: "Observe the difference. Slide to compare our untouched camera raw capture against our masterfully color-calibrated final image.",
    beforeImg: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    afterImg: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    beforeLabel: "Camera Raw",
    afterLabel: "Master Print"
  });

  // Exif Explorer State
  const [exifData, setExifData] = useState({
    defaultImg: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200",
    camera: "Sony Alpha a7 III",
    lens: "FE 24-70mm F2.8 GM",
    aperture: "f/2.8",
    iso: "400",
    shutterSpeed: "1/1000s"
  });

  // Contact State
  const [contactData, setContactData] = useState({
    pretitle: "RESERVE YOUR CAPTURE",
    title: "Become a Client",
    description: "Let's craft your photographic legacy. Tell us your story and we will design a visual identity plan perfectly calibrated for your narrative.",
    email: "contact@jrphotography.com",
    phone: "+91 98765 43210",
    address: "Salt Lake City, Sector V, Kolkata, India"
  });

  // Process Steps State
  const [processStepsData, setProcessStepsData] = useState<{ steps: ProcessStep[] }>({
    steps: PROCESS_STEPS
  });

  // Load Content Settings from Firestore
  useEffect(() => {
    async function loadAllContent() {
      try {
        setLoading(true);

        const marqueeSnap = await getDoc(doc(db, "settings", "marquee"));
        if (marqueeSnap.exists()) setMarqueeData(marqueeSnap.data() as any);

        const aboutSnap = await getDoc(doc(db, "settings", "about"));
        if (aboutSnap.exists()) setAboutData(aboutSnap.data() as any);

        const founderSnap = await getDoc(doc(db, "settings", "founder"));
        if (founderSnap.exists()) setFounderData(founderSnap.data() as any);

        const labsSnap = await getDoc(doc(db, "settings", "creative_labs"));
        if (labsSnap.exists()) setLabsData(labsSnap.data() as any);

        const beforeAfterSnap = await getDoc(doc(db, "settings", "before_after"));
        if (beforeAfterSnap.exists()) setBeforeAfterData(beforeAfterSnap.data() as any);

        const exifSnap = await getDoc(doc(db, "settings", "exif_explorer"));
        if (exifSnap.exists()) setExifData(exifSnap.data() as any);

        const contactSnap = await getDoc(doc(db, "settings", "contact"));
        if (contactSnap.exists()) setContactData(contactSnap.data() as any);

        const dividersSnap = await getDoc(doc(db, "settings", "dividers"));
        if (dividersSnap.exists()) setDividersData(dividersSnap.data() as any);

        const processStepsSnap = await getDoc(doc(db, "settings", "process_steps"));
        if (processStepsSnap.exists()) {
          const data = processStepsSnap.data();
          if (data.steps && Array.isArray(data.steps)) {
            const mergedSteps = data.steps.map((step: any, index: number) => {
              const defaultStep: Partial<ProcessStep> = PROCESS_STEPS[index] || {};
              return {
                ...defaultStep,
                ...step,
                image: step.image || defaultStep.image || ""
              };
            });
            setProcessStepsData({ steps: mergedSteps });
          }
        }

        const headersSnap = await getDoc(doc(db, "settings", "section_headers"));
        if (headersSnap.exists()) {
          setSectionHeadersData(prev => ({
            ...prev,
            ...headersSnap.data()
          }));
        }

      } catch (error) {
        console.error("Error loading section content:", error);
        toast.error("Failed to load some section content. Hardcoded values will act as default.");
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      loadAllContent();
    }
  }, [isAdmin]);

  // Save active sub-tab's modifications
  const handleSaveSubTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      let targetDoc = "";
      let payload = {};

      if (activeSubTab === "marquee") {
        targetDoc = "marquee";
        payload = marqueeData;
      } else if (activeSubTab === "about") {
        targetDoc = "about";
        payload = aboutData;
      } else if (activeSubTab === "founder") {
        targetDoc = "founder";
        payload = founderData;
      } else if (activeSubTab === "labs") {
        targetDoc = "creative_labs";
        payload = labsData;
      } else if (activeSubTab === "before_after") {
        targetDoc = "before_after";
        payload = beforeAfterData;
      } else if (activeSubTab === "exif") {
        targetDoc = "exif_explorer";
        payload = exifData;
      } else if (activeSubTab === "contact") {
        targetDoc = "contact";
        payload = contactData;
      } else if (activeSubTab === "dividers") {
        targetDoc = "dividers";
        payload = dividersData;
      } else if (activeSubTab === "headers") {
        targetDoc = "section_headers";
        payload = sectionHeadersData;
      } else if (activeSubTab === "process") {
        targetDoc = "process_steps";
        payload = processStepsData;
        
        // Also save section headers since they are editable in the Process tab now too
        await setDoc(doc(db, "settings", "section_headers"), {
          ...sectionHeadersData,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid
        });
      }

      await setDoc(doc(db, "settings", targetDoc), {
        ...payload,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });

      toast.success(`${activeSubTab.toUpperCase().replace("_", " ")} content saved successfully!`);
    } catch (error: any) {
      console.error(`Error saving ${activeSubTab}:`, error);
      toast.error(`Error saving content: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  // About Helper methods
  const handleAboutStatChange = (idx: number, field: string, value: string) => {
    const updatedStats = [...aboutData.stats];
    updatedStats[idx] = { ...updatedStats[idx], [field]: value };
    setAboutData(prev => ({ ...prev, stats: updatedStats }));
  };

  const handleAboutGearChange = (idx: number, field: string, value: string) => {
    const updatedGear = [...aboutData.gear];
    updatedGear[idx] = { ...updatedGear[idx], [field]: value };
    setAboutData(prev => ({ ...prev, gear: updatedGear }));
  };

  // Founder Helper methods
  const handleFounderExperienceChange = (idx: number, field: string, value: string) => {
    const updatedExp = [...founderData.experiences];
    updatedExp[idx] = { ...updatedExp[idx], [field]: value };
    setFounderData(prev => ({ ...prev, experiences: updatedExp }));
  };

  // Creative Labs Helper methods
  const handleLabCardChange = (idx: number, field: string, value: any) => {
    const updatedCards = [...labsData.cards];
    updatedCards[idx] = { ...updatedCards[idx], [field]: value };
    setLabsData(prev => ({ ...prev, cards: updatedCards }));
  };

  const addLabCard = () => {
    const newId = `lc${Date.now()}`;
    const newCard = {
      id: newId,
      title: "New Lab Project",
      category: "learn" as const,
      tag: "ALPHA RUN",
      description: "Describe this innovative experiment and computation discovery here.",
      image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=600",
      linkText: "Learn More",
      color: "#B7BE43",
      darkTheme: false
    };
    setLabsData(prev => ({ ...prev, cards: [...prev.cards, newCard] }));
  };

  const removeLabCard = (idx: number) => {
    const updatedCards = labsData.cards.filter((_, i) => i !== idx);
    setLabsData(prev => ({ ...prev, cards: updatedCards }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
      </div>
    );
  }

  const subTabs: { id: ActiveSubTab; label: string }[] = [
    { id: "headers", label: "Section Headers" },
    { id: "about", label: "About Intro & Arsenal" },
    { id: "founder", label: "Founder Bio" },
    { id: "labs", label: "Creative Labs Carousel" },
    { id: "process", label: "Process Timeline Steps" },
    { id: "dividers", label: "Luxury Dividers" },
    { id: "before_after", label: "Before & After Slider" },
    { id: "exif", label: "Exif Explorer Default" },
    { id: "contact", label: "Contact Details" },
    { id: "marquee", label: "Marquee Ticker" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Vertical Sub-tabs */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible border border-white/5 rounded-2xl bg-luxury-black/30 p-2 gap-1 scrollbar-none">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 shrink-0 px-4 py-3 rounded-xl text-left text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "bg-luxury-gold text-black shadow-lg"
                  : "text-luxury-cream/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Editing Form Panel */}
        <div className="flex-1 bg-luxury-black/40 border border-luxury-gold/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSaveSubTab} className="space-y-8">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div>
                <h3 className="text-xl font-serif text-white tracking-wide uppercase">
                  {subTabs.find(t => t.id === activeSubTab)?.label} Content
                </h3>
                <p className="text-luxury-cream/40 text-xs mt-1">
                  Configure text labels, descriptions, and custom images shown inside this section.
                </p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-luxury-gold text-black font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-white transition-all disabled:opacity-50 shrink-0"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Content
              </button>
            </div>

            {/* Section Headers Editor */}
            {activeSubTab === "headers" && (
              <div className="space-y-8">
                <div className="bg-[#B7BE43]/5 border border-[#B7BE43]/10 p-4 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
                  <div className="text-xs text-luxury-cream/80 space-y-1">
                    <p className="font-bold text-luxury-gold">Page-wise Section Headers Management</p>
                    <p className="leading-relaxed">Dynamically edit pretitles, main headings, and description paragraphs across the public application in real-time. Unconfigured fields will automatically fall back to their premium studio defaults.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* 1. Services Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Services Section (Specialties)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.services.pretitle} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            services: { ...prev.services, pretitle: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.services.title} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            services: { ...prev.services, title: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData.services.subtitle} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          services: { ...prev.services, subtitle: e.target.value }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>

                  {/* 2. Portfolio Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Portfolio Section (Masterworks)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.portfolio.pretitle} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            portfolio: { ...prev.portfolio, pretitle: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.portfolio.title} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            portfolio: { ...prev.portfolio, title: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Testimonials Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Client Reviews Section (Testimonials)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.testimonials.pretitle} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            testimonials: { ...prev.testimonials, pretitle: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.testimonials.title} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            testimonials: { ...prev.testimonials, title: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData.testimonials.subtitle} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          testimonials: { ...prev.testimonials, subtitle: e.target.value }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>

                  {/* 4. Critically Acclaimed Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Critically Acclaimed (Avant-Garde Carousel)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.critically_acclaimed.pretitle} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            critically_acclaimed: { ...prev.critically_acclaimed, pretitle: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.critically_acclaimed.title} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            critically_acclaimed: { ...prev.critically_acclaimed, title: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData.critically_acclaimed.subtitle} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          critically_acclaimed: { ...prev.critically_acclaimed, subtitle: e.target.value }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>

                  {/* 5. Process Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                        <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Client Experience Process (Timeline)</h4>
                      </div>

                      {/* Page selection tabs */}
                      <div className="flex flex-wrap gap-1 bg-[#0a0910] border border-white/5 p-1 rounded-xl">
                        {[
                          { id: "process", label: "Default" },
                          { id: "process_home", label: "Home" },
                          { id: "process_services", label: "Services" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedProcessHeaderPage(tab.id as any)}
                            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              selectedProcessHeaderPage === tab.id
                                ? "bg-luxury-gold text-black font-bold shadow-md"
                                : "text-luxury-cream/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData[selectedProcessHeaderPage]?.pretitle || ""} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            [selectedProcessHeaderPage]: {
                              ...(prev[selectedProcessHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                              pretitle: e.target.value
                            }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData[selectedProcessHeaderPage]?.title || ""} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            [selectedProcessHeaderPage]: {
                              ...(prev[selectedProcessHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                              title: e.target.value
                            }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData[selectedProcessHeaderPage]?.subtitle || ""} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          [selectedProcessHeaderPage]: {
                            ...(prev[selectedProcessHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                            subtitle: e.target.value
                          }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>

                  {/* 6. Pricing Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Investments & Rates (Pricing)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.pricing.pretitle} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, pretitle: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData.pricing.title} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, title: e.target.value }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData.pricing.subtitle} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          pricing: { ...prev.pricing, subtitle: e.target.value }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>

                  {/* 7. Blog/Chronicles Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                        <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Editorial Chronicles (Blog / Insights)</h4>
                      </div>
                      
                      {/* Page selection tabs */}
                      <div className="flex flex-wrap gap-1 bg-[#0a0910] border border-white/5 p-1 rounded-xl">
                        {[
                          { id: "blog", label: "Default / Page" },
                          { id: "blog_home", label: "Home Page" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedBlogHeaderPage(tab.id as any)}
                            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              selectedBlogHeaderPage === tab.id
                                ? "bg-luxury-gold text-black font-bold shadow-md"
                                : "text-luxury-cream/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData[selectedBlogHeaderPage]?.pretitle || ""} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            [selectedBlogHeaderPage]: {
                              ...(prev[selectedBlogHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                              pretitle: e.target.value
                            }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData[selectedBlogHeaderPage]?.title || ""} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            [selectedBlogHeaderPage]: {
                              ...(prev[selectedBlogHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                              title: e.target.value
                            }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData[selectedBlogHeaderPage]?.subtitle || ""} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          [selectedBlogHeaderPage]: {
                            ...(prev[selectedBlogHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                            subtitle: e.target.value
                          }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>

                  {/* 8. FAQ Section */}
                  <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                        <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Frequent Inquiries (FAQ Archive)</h4>
                      </div>
                      
                      {/* Page selection tabs */}
                      <div className="flex flex-wrap gap-1 bg-[#0a0910] border border-white/5 p-1 rounded-xl">
                        {[
                          { id: "faq", label: "Default" },
                          { id: "faq_home", label: "Home" },
                          { id: "faq_about", label: "About" },
                          { id: "faq_services", label: "Services" },
                          { id: "faq_contact", label: "Contact" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedFaqHeaderPage(tab.id as any)}
                            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              selectedFaqHeaderPage === tab.id
                                ? "bg-luxury-gold text-black font-bold shadow-md"
                                : "text-luxury-cream/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData[selectedFaqHeaderPage]?.pretitle || ""} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            [selectedFaqHeaderPage]: {
                              ...(prev[selectedFaqHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                              pretitle: e.target.value
                            }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                        <input 
                          type="text" 
                          value={sectionHeadersData[selectedFaqHeaderPage]?.title || ""} 
                          onChange={(e) => setSectionHeadersData(prev => ({
                            ...prev,
                            [selectedFaqHeaderPage]: {
                              ...(prev[selectedFaqHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                              title: e.target.value
                            }
                          }))}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                      <textarea 
                        value={sectionHeadersData[selectedFaqHeaderPage]?.subtitle || ""} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          [selectedFaqHeaderPage]: {
                            ...(prev[selectedFaqHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                            subtitle: e.target.value
                          }
                        }))}
                        rows={2}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* About Section Editor */}
            {activeSubTab === "about" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pill Badge</label>
                    <input 
                      type="text" 
                      value={aboutData.badge} 
                      onChange={(e) => setAboutData(prev => ({ ...prev, badge: e.target.value }))}
                      className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none font-sans" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold text-[#B7BE43]">Rigor Index Score (Dial)</label>
                    <input 
                      type="number" 
                      value={aboutData.rigorIndex} 
                      onChange={(e) => setAboutData(prev => ({ ...prev, rigorIndex: Number(e.target.value) }))}
                      className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none font-mono" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Editorial Title Headline</label>
                  <textarea 
                    value={aboutData.title} 
                    onChange={(e) => setAboutData(prev => ({ ...prev, title: e.target.value }))}
                    rows={2}
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none font-sans resize-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Paragraph Block 1</label>
                  <textarea 
                    value={aboutData.description1} 
                    onChange={(e) => setAboutData(prev => ({ ...prev, description1: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none font-sans resize-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Paragraph Block 2</label>
                  <textarea 
                    value={aboutData.description2} 
                    onChange={(e) => setAboutData(prev => ({ ...prev, description2: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:border-luxury-gold/40 transition-colors outline-none font-sans resize-none" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-white/5 rounded-xl">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold font-mono tracking-widest text-luxury-gold uppercase">Primary Button (Left Panel)</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-wider text-luxury-cream/30">Button Text</label>
                      <input type="text" value={aboutData.btn1Text} onChange={(e) => setAboutData(prev => ({ ...prev, btn1Text: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-wider text-luxury-cream/30">Button Link</label>
                      <input type="text" value={aboutData.btn1Link} onChange={(e) => setAboutData(prev => ({ ...prev, btn1Link: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold font-mono tracking-widest text-luxury-gold uppercase">Secondary Button (Left Panel)</h4>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-wider text-luxury-cream/30">Button Text</label>
                      <input type="text" value={aboutData.btn2Text} onChange={(e) => setAboutData(prev => ({ ...prev, btn2Text: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-wider text-luxury-cream/30">Button Link</label>
                      <input type="text" value={aboutData.btn2Link} onChange={(e) => setAboutData(prev => ({ ...prev, btn2Link: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                    </div>
                  </div>
                </div>

                {/* Left Panel Calibrated Metric Scores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-white/5 rounded-xl bg-black/20">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Focal Precision %</label>
                    <input type="text" value={aboutData.focalPrecision} onChange={(e) => setAboutData(prev => ({ ...prev, focalPrecision: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Color Fidelity %</label>
                    <input type="text" value={aboutData.colorFidelity} onChange={(e) => setAboutData(prev => ({ ...prev, colorFidelity: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Archival Lifespan</label>
                    <input type="text" value={aboutData.archivalLifespan} onChange={(e) => setAboutData(prev => ({ ...prev, archivalLifespan: e.target.value }))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs text-luxury-cream outline-none" />
                  </div>
                </div>

                {/* About Stats Cards */}
                <div className="space-y-4">
                  <h4 className="text-sm font-serif text-luxury-gold tracking-wide">Right Panel Metrics List (Stats)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {aboutData.stats.map((stat, i) => (
                      <div key={i} className="bg-[#0a0910] border border-white/5 p-4 rounded-xl space-y-3">
                        <span className="text-[10px] font-mono text-luxury-gold">Metric #{i+1}</span>
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-widest text-luxury-cream/40">Value Label (e.g. 15+)</label>
                          <input type="text" value={stat.val} onChange={(e) => handleAboutStatChange(i, "val", e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-widest text-luxury-cream/40">Stat Name</label>
                          <input type="text" value={stat.lbl} onChange={(e) => handleAboutStatChange(i, "lbl", e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] uppercase tracking-widest text-luxury-cream/40">Short Description</label>
                          <input type="text" value={stat.desc} onChange={(e) => handleAboutStatChange(i, "desc", e.target.value)} className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About Arsenal and Gear */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-sm font-serif text-luxury-gold tracking-wide">The Arsenal Intro</h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Arsenal Headline</label>
                      <input type="text" value={aboutData.arsenalTitle} onChange={(e) => setAboutData(prev => ({ ...prev, arsenalTitle: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Arsenal Description</label>
                      <textarea value={aboutData.arsenalDesc} onChange={(e) => setAboutData(prev => ({ ...prev, arsenalDesc: e.target.value }))} rows={2} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white resize-none" />
                    </div>
                  </div>

                  <h4 className="text-sm font-serif text-luxury-gold tracking-wide pt-2">Camera Gear Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aboutData.gear.map((g, idx) => (
                      <div key={idx} className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] block">Gear Slot #{idx + 1}</span>
                        <input type="text" placeholder="Type (e.g. Medium Format)" value={g.type} onChange={(e) => handleAboutGearChange(idx, "type", e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                        <input type="text" placeholder="Model Name (e.g. Fujifilm GFX)" value={g.gear} onChange={(e) => handleAboutGearChange(idx, "gear", e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-bold" />
                        <input type="text" placeholder="Focus/Niche (e.g. Studio Captures)" value={g.focus} onChange={(e) => handleAboutGearChange(idx, "focus", e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-luxury-gold" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Founder Section Editor */}
            {activeSubTab === "founder" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pill Badge Text</label>
                    <input type="text" value={founderData.badge} onChange={(e) => setFounderData(prev => ({ ...prev, badge: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Biography Headline Title</label>
                    <input type="text" value={founderData.title} onChange={(e) => setFounderData(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-serif" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Background Floating Heading</label>
                    <input type="text" value={founderData.bgName} onChange={(e) => setFounderData(prev => ({ ...prev, bgName: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Rotating Seal text</label>
                    <input type="text" value={founderData.sealText} onChange={(e) => setFounderData(prev => ({ ...prev, sealText: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <ImagePreviewInput
                    label="Founder Portrait Image"
                    value={founderData.avatar}
                    onChange={(val) => setFounderData(prev => ({ ...prev, avatar: val }))}
                    placeholder="/assets/image/Founder/profile.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Detailed Biography Paragraph</label>
                  <textarea 
                    value={founderData.description} 
                    onChange={(e) => setFounderData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white resize-none leading-relaxed" 
                  />
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border border-white/5 rounded-xl bg-black/10">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Twitter Link</label>
                    <input type="text" value={founderData.twitter} onChange={(e) => setFounderData(prev => ({ ...prev, twitter: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Dribbble Link</label>
                    <input type="text" value={founderData.dribbble} onChange={(e) => setFounderData(prev => ({ ...prev, dribbble: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40">Instagram Link</label>
                    <input type="text" value={founderData.instagram} onChange={(e) => setFounderData(prev => ({ ...prev, instagram: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                  </div>
                </div>

                {/* Experience/Milestone Timeline */}
                <div className="space-y-4">
                  <h4 className="text-sm font-serif text-luxury-gold tracking-wide">Professional Milestones Timeline</h4>
                  <div className="space-y-3">
                    {founderData.experiences.map((exp, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/20 border border-white/5 p-3 rounded-lg items-center">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500">Role / Milestone Description</label>
                          <input type="text" value={exp.role} onChange={(e) => handleFounderExperienceChange(idx, "role", e.target.value)} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-medium" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500">Years Duration</label>
                          <input type="text" value={exp.years} onChange={(e) => handleFounderExperienceChange(idx, "years", e.target.value)} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Creative Labs Editor */}
            {activeSubTab === "labs" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2">
                  <h4 className="text-sm font-serif text-luxury-gold uppercase tracking-wider">Interactive Carousel Cards</h4>
                  <button 
                    type="button" 
                    onClick={addLabCard}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0910] border border-white/5 hover:border-luxury-gold/55 rounded-lg text-[10px] uppercase font-mono tracking-wider text-white"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Lab Card
                  </button>
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
                  {labsData.cards.map((card, idx) => (
                    <div key={card.id || idx} className="bg-black/30 border border-white/5 p-5 rounded-2xl relative space-y-4">
                      <button
                        type="button"
                        onClick={() => removeLabCard(idx)}
                        className="absolute top-4 right-4 text-red-500/60 hover:text-red-500 transition-colors"
                        title="Remove Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40">Title</label>
                          <input type="text" value={card.title} onChange={(e) => handleLabCardChange(idx, "title", e.target.value)} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40">Category</label>
                          <select 
                            value={card.category} 
                            onChange={(e) => handleLabCardChange(idx, "category", e.target.value)}
                            className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white"
                          >
                            <option value="learn">Learn</option>
                            <option value="develop">Develop</option>
                            <option value="explore">Explore</option>
                            <option value="create">Create</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40">Tag Badge Text</label>
                          <input type="text" value={card.tag} onChange={(e) => handleLabCardChange(idx, "tag", e.target.value)} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <ImagePreviewInput
                          label="Image Link"
                          value={card.image}
                          onChange={(val) => handleLabCardChange(idx, "image", val)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40">Card Description</label>
                        <textarea value={card.description} onChange={(e) => handleLabCardChange(idx, "description", e.target.value)} rows={2} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white resize-none" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40">Link Button Label</label>
                          <input type="text" value={card.linkText} onChange={(e) => handleLabCardChange(idx, "linkText", e.target.value)} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Accent Color (Hex)</label>
                          <input type="text" value={card.color} onChange={(e) => handleLabCardChange(idx, "color", e.target.value)} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono" />
                        </div>
                        <div className="space-y-1.5 flex items-center pt-5">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                            <input 
                              type="checkbox" 
                              checked={card.darkTheme} 
                              onChange={(e) => handleLabCardChange(idx, "darkTheme", e.target.checked)}
                              className="rounded bg-black border-white/10 text-luxury-gold focus:ring-0"
                            />
                            Dark Theme Styled
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before After Slider Editor */}
            {activeSubTab === "before_after" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pill Badge</label>
                    <input type="text" value={beforeAfterData.pretitle} onChange={(e) => setBeforeAfterData(prev => ({ ...prev, pretitle: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-sans" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Slider Title</label>
                    <input type="text" value={beforeAfterData.title} onChange={(e) => setBeforeAfterData(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-serif" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Before (Raw) Label</label>
                    <input type="text" value={beforeAfterData.beforeLabel} onChange={(e) => setBeforeAfterData(prev => ({ ...prev, beforeLabel: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">After (Master) Label</label>
                    <input type="text" value={beforeAfterData.afterLabel} onChange={(e) => setBeforeAfterData(prev => ({ ...prev, afterLabel: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Slider Description Description</label>
                  <textarea 
                    value={beforeAfterData.description} 
                    onChange={(e) => setBeforeAfterData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white resize-none" 
                  />
                </div>

                <div className="space-y-4 p-4 border border-white/5 rounded-xl bg-black/10">
                  <ImagePreviewInput
                    label="Untouched Raw Image Link (Left side of slider)"
                    value={beforeAfterData.beforeImg}
                    onChange={(val) => setBeforeAfterData(prev => ({ ...prev, beforeImg: val }))}
                  />
                  <ImagePreviewInput
                    label="Calibrated Final Image Link (Right side of slider)"
                    value={beforeAfterData.afterImg}
                    onChange={(val) => setBeforeAfterData(prev => ({ ...prev, afterImg: val }))}
                  />
                </div>
              </div>
            )}

            {/* Exif Explorer Editor */}
            {activeSubTab === "exif" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-serif text-luxury-gold uppercase tracking-wider">Default Static Image EXIF Data</h4>
                  <ImagePreviewInput
                    label="Default Image Link"
                    value={exifData.defaultImg}
                    onChange={(val) => setExifData(prev => ({ ...prev, defaultImg: val }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Camera Brand/Model</label>
                    <input type="text" value={exifData.camera} onChange={(e) => setExifData(prev => ({ ...prev, camera: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Lens Specifications</label>
                    <input type="text" value={exifData.lens} onChange={(e) => setExifData(prev => ({ ...prev, lens: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Aperture Target (e.g. f/2.8)</label>
                    <input type="text" value={exifData.aperture} onChange={(e) => setExifData(prev => ({ ...prev, aperture: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">ISO (e.g. 400)</label>
                    <input type="text" value={exifData.iso} onChange={(e) => setExifData(prev => ({ ...prev, iso: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Shutter Speed (e.g. 1/1000s)</label>
                    <input type="text" value={exifData.shutterSpeed} onChange={(e) => setExifData(prev => ({ ...prev, shutterSpeed: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white font-mono" />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Details Editor */}
            {activeSubTab === "contact" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pill Badge Text</label>
                    <input type="text" value={contactData.pretitle} onChange={(e) => setContactData(prev => ({ ...prev, pretitle: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Headline Title</label>
                    <input type="text" value={contactData.title} onChange={(e) => setContactData(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-serif" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono">Contact Subtitle Description</label>
                  <textarea 
                    value={contactData.description} 
                    onChange={(e) => setContactData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white resize-none" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Studio Email Address</label>
                    <input type="email" value={contactData.email} onChange={(e) => setContactData(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Studio Telephone Phone</label>
                    <input type="text" value={contactData.phone} onChange={(e) => setContactData(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Studio Physical Address</label>
                    <input type="text" value={contactData.address} onChange={(e) => setContactData(prev => ({ ...prev, address: e.target.value }))} className="w-full bg-[#0a0910] border border-white/5 rounded-lg px-3 py-2 text-xs text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Marquee Ticker Editor */}
            {activeSubTab === "marquee" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-serif text-luxury-gold uppercase tracking-wider">Scrolling Ticker Items</h4>
                  <button 
                    type="button" 
                    onClick={() => setMarqueeData(prev => ({ ...prev, tickerItems: [...prev.tickerItems, "NEW MARQUEE HEADLINE"] }))}
                    className="flex items-center gap-1 px-3 py-1 bg-[#0a0910] border border-white/5 hover:border-luxury-gold/50 rounded-lg text-[10px] uppercase font-mono text-white"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {marqueeData.tickerItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center bg-[#0a0910] p-4 rounded-xl border border-white/5">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-luxury-cream/40 font-mono">Ticker Line #{idx + 1}</label>
                        <input 
                          type="text" 
                          value={item} 
                          onChange={(e) => {
                            const updated = [...marqueeData.tickerItems];
                            updated[idx] = e.target.value;
                            setMarqueeData(prev => ({ ...prev, tickerItems: updated }));
                          }} 
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-4 py-2 text-sm text-white" 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = marqueeData.tickerItems.filter((_, i) => i !== idx);
                          setMarqueeData(prev => ({ ...prev, tickerItems: updated }));
                        }}
                        className="text-red-500/50 hover:text-red-500 pt-5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dividers Editor */}
            {activeSubTab === "dividers" && (
              <div className="space-y-12">
                {/* Divider 1: Luxury Weddings */}
                <div className="space-y-6 p-6 rounded-3xl border border-luxury-gold/15 bg-luxury-black/30">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-base font-serif text-luxury-gold uppercase tracking-wider">Divider 1: Luxury Weddings</h4>
                    <p className="text-xs text-luxury-cream/40 font-mono mt-1">Configures the first major parallax story breaker element on the Home page.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Pill Pretitle</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_1.pretitle} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_1: { ...prev.divider_1, pretitle: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Main Bold Heading</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_1.title} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_1: { ...prev.divider_1, title: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase tracking-wider" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-1">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold font-serif italic text-luxury-gold">Italic Highlight Text</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_1.highlightedText} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_1: { ...prev.divider_1, highlightedText: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Sub-Description Text</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_1.description} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_1: { ...prev.divider_1, description: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Text Alignment</label>
                      <select 
                        value={dividersData.divider_1.alignment} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_1: { ...prev.divider_1, alignment: e.target.value as any }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono cursor-pointer"
                      >
                        <option value="left">Left Aligned</option>
                        <option value="center">Centered</option>
                        <option value="right">Right Aligned</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Section Height</label>
                      <select 
                        value={dividersData.divider_1.height} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_1: { ...prev.divider_1, height: e.target.value as any }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono cursor-pointer"
                      >
                        <option value="medium">Medium height (55vh)</option>
                        <option value="large">Large height (80vh)</option>
                        <option value="screen">Full Screen (100vh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ImagePreviewInput
                      label="Divider Parallax Background Image"
                      value={dividersData.divider_1.image}
                      onChange={(url) => setDividersData(prev => ({
                        ...prev,
                        divider_1: { ...prev.divider_1, image: url }
                      }))}
                    />
                  </div>
                </div>

                {/* Divider 2: Technical Deviation */}
                <div className="space-y-6 p-6 rounded-3xl border border-luxury-gold/15 bg-luxury-black/30">
                  <div className="border-b border-white/5 pb-3">
                    <h4 className="text-base font-serif text-luxury-gold uppercase tracking-wider">Divider 2: Technical Deviation</h4>
                    <p className="text-xs text-luxury-cream/40 font-mono mt-1">Configures the second major parallax breaker (shown on Home and About pages).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Pill Pretitle</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_2.pretitle} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_2: { ...prev.divider_2, pretitle: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Main Bold Heading</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_2.title} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_2: { ...prev.divider_2, title: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white uppercase tracking-wider" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-1">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold font-serif italic text-luxury-gold">Italic Highlight Text</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_2.highlightedText} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_2: { ...prev.divider_2, highlightedText: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Sub-Description Text</label>
                      <input 
                        type="text" 
                        value={dividersData.divider_2.description} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_2: { ...prev.divider_2, description: e.target.value }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Text Alignment</label>
                      <select 
                        value={dividersData.divider_2.alignment} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_2: { ...prev.divider_2, alignment: e.target.value as any }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono cursor-pointer"
                      >
                        <option value="left">Left Aligned</option>
                        <option value="center">Centered</option>
                        <option value="right">Right Aligned</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-luxury-cream/40 font-mono font-bold">Section Height</label>
                      <select 
                        value={dividersData.divider_2.height} 
                        onChange={(e) => setDividersData(prev => ({
                          ...prev,
                          divider_2: { ...prev.divider_2, height: e.target.value as any }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono cursor-pointer"
                      >
                        <option value="medium">Medium height (55vh)</option>
                        <option value="large">Large height (80vh)</option>
                        <option value="screen">Full Screen (100vh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ImagePreviewInput
                      label="Divider Parallax Background Image"
                      value={dividersData.divider_2.image}
                      onChange={(url) => setDividersData(prev => ({
                        ...prev,
                        divider_2: { ...prev.divider_2, image: url }
                      }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Process Timeline Steps Editor */}
            {activeSubTab === "process" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="border-b border-white/5 pb-3">
                  <h4 className="text-base font-serif text-luxury-gold uppercase tracking-wider">Five-Phase Operational Methodology</h4>
                  <p className="text-xs text-luxury-cream/40 font-mono mt-1">Configure each step of your high-fidelity client timeline and page-specific headings shown on the Services and Home screens.</p>
                </div>

                {/* Section Headers editor directly in Process page */}
                <div className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold" />
                      <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white">Process Section Heading & Subheading</h4>
                    </div>

                    {/* Page selection tabs */}
                    <div className="flex flex-wrap gap-1 bg-[#0a0910] border border-white/5 p-1 rounded-xl">
                      {[
                        { id: "process", label: "Default" },
                        { id: "process_home", label: "Home" },
                        { id: "process_services", label: "Services" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedProcessHeaderPage(tab.id as any)}
                          className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            selectedProcessHeaderPage === tab.id
                              ? "bg-luxury-gold text-black font-bold shadow-md"
                              : "text-luxury-cream/60 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Pretitle / Badge</label>
                      <input 
                        type="text" 
                        value={sectionHeadersData[selectedProcessHeaderPage]?.pretitle || ""} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          [selectedProcessHeaderPage]: {
                            ...(prev[selectedProcessHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                            pretitle: e.target.value
                          }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Main Title</label>
                      <input 
                        type="text" 
                        value={sectionHeadersData[selectedProcessHeaderPage]?.title || ""} 
                        onChange={(e) => setSectionHeadersData(prev => ({
                          ...prev,
                          [selectedProcessHeaderPage]: {
                            ...(prev[selectedProcessHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                            title: e.target.value
                          }
                        }))}
                        className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">Sub-Description</label>
                    <textarea 
                      value={sectionHeadersData[selectedProcessHeaderPage]?.subtitle || ""} 
                      onChange={(e) => setSectionHeadersData(prev => ({
                        ...prev,
                        [selectedProcessHeaderPage]: {
                          ...(prev[selectedProcessHeaderPage] || { pretitle: "", title: "", subtitle: "" }),
                          subtitle: e.target.value
                        }
                      }))}
                      rows={2}
                      className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  {processStepsData.steps.map((step, index) => (
                    <div 
                      key={index} 
                      className="bg-[#0e0e12]/60 border border-white/5 p-6 rounded-2xl space-y-4 hover:border-luxury-gold/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-luxury-gold/10 text-luxury-gold font-mono text-xs font-bold border border-luxury-gold/20">
                          {step.num || `0${index + 1}`}
                        </span>
                        <span className="text-xs font-mono uppercase tracking-widest text-luxury-cream/60">
                          PHASE {step.num || `0${index + 1}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">
                            Phase Title
                          </label>
                          <input 
                            type="text" 
                            value={step.title || ""} 
                            onChange={(e) => {
                              const newSteps = [...processStepsData.steps];
                              newSteps[index] = { ...newSteps[index], title: e.target.value };
                              setProcessStepsData({ steps: newSteps });
                            }}
                            className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none font-sans" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">
                            Duration / Badge
                          </label>
                          <input 
                            type="text" 
                            value={step.duration || ""} 
                            onChange={(e) => {
                              const newSteps = [...processStepsData.steps];
                              newSteps[index] = { ...newSteps[index], duration: e.target.value };
                              setProcessStepsData({ steps: newSteps });
                            }}
                            className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none font-sans" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-luxury-cream/40 font-mono">
                          Detailed Description
                        </label>
                        <textarea 
                          value={step.description || ""} 
                          onChange={(e) => {
                            const newSteps = [...processStepsData.steps];
                            newSteps[index] = { ...newSteps[index], description: e.target.value };
                            setProcessStepsData({ steps: newSteps });
                          }}
                          rows={3}
                          className="w-full bg-[#0a0910] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-luxury-gold/40 transition-colors outline-none resize-none font-sans" 
                        />
                      </div>

                      {/* Image selector for each process step */}
                      <div className="pt-2">
                        <ImagePreviewInput
                          label="Phase Image"
                          value={step.image || ""}
                          onChange={(url) => {
                            const newSteps = [...processStepsData.steps];
                            newSteps[index] = { ...newSteps[index], image: url };
                            setProcessStepsData({ steps: newSteps });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
