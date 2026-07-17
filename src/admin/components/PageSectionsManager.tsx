import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { motion } from "motion/react";
import { 
  Layers, Save, Loader2, RotateCcw, Eye, EyeOff, 
  ArrowUp, ArrowDown, Sparkles, Check, HelpCircle, Edit3
} from "lucide-react";
import { getCollectionData, saveDocument } from "../../lib/db-client";
import { logAdminActivity } from "../../lib/firebase";
import SectionContentManager from "./SectionContentManager";

export interface SectionConfig {
  id: string;
  name: string;
  visible: boolean;
  order: number;
}

const DEFAULT_SECTIONS: Record<string, SectionConfig[]> = {
  home: [
    { id: "marquee", name: "Marquee Ticker", visible: true, order: 0 },
    { id: "about", name: "About Intro", visible: true, order: 1 },
    { id: "services", name: "Services Showcase", visible: true, order: 2 },
    { id: "divider_1", name: "Luxury Weddings Divider", visible: true, order: 3 },
    { id: "creative_labs", name: "Creative Labs Carousel", visible: true, order: 4 },
    { id: "portfolio", name: "Portfolio Grid", visible: true, order: 5 },
    { id: "testimonials", name: "Client Testimonials", visible: true, order: 6 },
    { id: "founder", name: "Founder Statement", visible: true, order: 7 },
    { id: "divider_2", name: "Technical Deviation Divider", visible: true, order: 8 },
    { id: "exif_explorer", name: "Exif Explorer Tool", visible: true, order: 9 },
    { id: "before_after", name: "Before & After Slider", visible: true, order: 10 },
    { id: "process", name: "Process & Workflow", visible: true, order: 11 },
    { id: "pricing", name: "Pricing Options", visible: true, order: 12 },
    { id: "blog", name: "Latest Blog Feed", visible: true, order: 13 },
    { id: "faq", name: "FAQ Section", visible: true, order: 14 },
    { id: "contact", name: "Contact Studio", visible: true, order: 15 },
  ],
  about: [
    { id: "about", name: "About Content", visible: true, order: 0 },
    { id: "divider", name: "Technical Deviation Divider", visible: true, order: 1 },
    { id: "faq", name: "Frequently Asked Questions", visible: true, order: 2 },
  ],
  services: [
    { id: "services", name: "Services Overview", visible: true, order: 0 },
    { id: "process", name: "Process & Workflow", visible: true, order: 1 },
    { id: "pricing", name: "Pricing Tables", visible: true, order: 2 },
    { id: "faq", name: "Frequently Asked Questions", visible: true, order: 3 },
  ],
  works: [
    { id: "portfolio", name: "Portfolio Grid", visible: true, order: 0 },
  ],
  blog: [
    { id: "blog", name: "Blog List", visible: true, order: 0 },
  ],
  contact: [
    { id: "contact", name: "Contact Form & Details", visible: true, order: 0 },
    { id: "faq", name: "Frequently Asked Questions", visible: true, order: 1 },
  ]
};

const PAGE_LABELS: Record<string, string> = {
  home: "Home Page",
  about: "About Page",
  services: "Services Page",
  works: "Works Page",
  blog: "Blog Page",
  contact: "Contact Page"
};

export default function PageSectionsManager({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [activePage, setActivePage] = useState<string>("home");
  const [managerTab, setManagerTab] = useState<"layout" | "content">("layout");
  const [initialSubTab, setInitialSubTab] = useState<any>("about");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Local state for all loaded pages
  const [allPagesSections, setAllPagesSections] = useState<Record<string, SectionConfig[]>>(DEFAULT_SECTIONS);

  // Load section settings from Firestore / Proxy DB on mount
  useEffect(() => {
    async function fetchSectionSettings() {
      try {
        setLoading(true);
        const data = await getCollectionData<{ id: string; sections: SectionConfig[] }>("page_sections");
        
        if (data && data.length > 0) {
          const loadedConfigs: Record<string, SectionConfig[]> = { ...DEFAULT_SECTIONS };
          
          data.forEach(docData => {
            if (docData.id && docData.sections) {
              // Ensure we sort loaded sections by order
              const sorted = [...docData.sections].sort((a, b) => a.order - b.order);
              loadedConfigs[docData.id] = sorted;
            }
          });
          
          setAllPagesSections(loadedConfigs);
        }
      } catch (error) {
        console.error("Error fetching page sections layout:", error);
        toast.error("Failed to fetch page sections. Falling back to default layout.");
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      fetchSectionSettings();
    }
  }, [isAdmin]);

  const activeSections = allPagesSections[activePage] || [];

  // Toggle Visibility
  const handleToggleVisibility = (sectionId: string) => {
    const updatedSections = activeSections.map(section => {
      if (section.id === sectionId) {
        return { ...section, visible: !section.visible };
      }
      return section;
    });

    setAllPagesSections(prev => ({
      ...prev,
      [activePage]: updatedSections
    }));
  };

  // Move Section Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...activeSections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;

    // Recalculate order values
    const updated = newSections.map((sec, idx) => ({ ...sec, order: idx }));

    setAllPagesSections(prev => ({
      ...prev,
      [activePage]: updated
    }));
  };

  // Move Section Down
  const handleMoveDown = (index: number) => {
    if (index === activeSections.length - 1) return;
    const newSections = [...activeSections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;

    // Recalculate order values
    const updated = newSections.map((sec, idx) => ({ ...sec, order: idx }));

    setAllPagesSections(prev => ({
      ...prev,
      [activePage]: updated
    }));
  };

  // Reset to default
  const handleReset = () => {
    const defaults = DEFAULT_SECTIONS[activePage] || [];
    setAllPagesSections(prev => ({
      ...prev,
      [activePage]: defaults
    }));
    toast.success(`Layout reset to default for ${PAGE_LABELS[activePage]}`);
  };

  // Save specific page sections config to Database
  const handleSave = async () => {
    try {
      setSaving(true);
      await saveDocument("page_sections", activePage, {
        sections: activeSections
      });

      // Log in ledger
      try {
        await logAdminActivity(
          "Update Page Sections Layout",
          `Administrator ${user?.email} updated the sections layout and order for the ${PAGE_LABELS[activePage]}.`,
          "Layout"
        );
      } catch (err) {
        console.error("Failed to log activity:", err);
      }

      toast.success(`${PAGE_LABELS[activePage]} sections layout updated and published successfully!`);
    } catch (error: any) {
      console.error("Failed to save page sections config:", error);
      toast.error(`Failed to save layout: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  // Edit Section
  const handleEditSection = (sectionId: string) => {
    const sectionToSubTab: Record<string, string> = {
      marquee: "marquee",
      about: "about",
      founder: "founder",
      creative_labs: "labs",
      before_after: "before_after",
      exif_explorer: "exif",
      contact: "contact",
      divider_1: "dividers",
      divider_2: "dividers",
      divider: "dividers",
      process: "process",
    };

    const sectionToExternalTab: Record<string, string> = {
      portfolio: "portfolio",
      blog: "blog",
      services: "process",
      pricing: "pricing",
      testimonials: "testimonials",
      faq: "faq",
    };

    if (sectionToSubTab[sectionId]) {
      setInitialSubTab(sectionToSubTab[sectionId]);
      setManagerTab("content");
      toast.success(`Opening content editor for ${sectionId}...`);
    } else if (sectionToExternalTab[sectionId] && onNavigateToTab) {
      toast.success(`Navigating to the dedicated ${sectionToExternalTab[sectionId]} manager...`);
      onNavigateToTab(sectionToExternalTab[sectionId]);
    } else {
      toast.error(`No dedicated editor found for section: ${sectionId}`);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold/20" />
      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sub-tab selection */}
      <div className="flex border-b border-white/5 pb-1">
        <button
          onClick={() => setManagerTab("layout")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
            managerTab === "layout"
              ? "border-luxury-gold text-luxury-gold"
              : "border-transparent text-luxury-cream/40 hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layout & Ordering</span>
        </button>
        <button
          onClick={() => setManagerTab("content")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
            managerTab === "content"
              ? "border-luxury-gold text-luxury-gold"
              : "border-transparent text-luxury-cream/40 hover:text-white"
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Section Content</span>
        </button>
      </div>

      {managerTab === "content" ? (
        <SectionContentManager initialSubTab={initialSubTab} />
      ) : (
        <>
          <div className="space-y-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">page layout & sections</h2>
              <p className="text-luxury-cream/40 text-sm">Control the display state, custom rendering order, and visibility of components per page.</p>
            </div>
            
            {/* Actions Bar */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#cfb53b] text-luxury-black hover:bg-luxury-cream font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save layout</span>
              </button>
            </div>
          </div>

      {/* Pages switcher tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {Object.keys(DEFAULT_SECTIONS).map((pageId) => {
          const isActive = activePage === pageId;
          return (
            <button
              key={pageId}
              onClick={() => setActivePage(pageId)}
              className={`px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                isActive
                  ? "bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30"
                  : "bg-[#0a0910] text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300"
              } cursor-pointer`}
            >
              {PAGE_LABELS[pageId]}
            </button>
          );
        })}
      </div>

      {/* Excluded Section Notice for Home */}
      {activePage === "home" && (
        <div className="bg-luxury-gold/5 border border-luxury-gold/20 p-5 rounded-2xl flex items-start gap-4">
          <Sparkles className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-serif text-white uppercase tracking-wider">Home Hero Protection Active</h4>
            <p className="text-[10px] text-luxury-cream/50 leading-relaxed">
              By architectural design, the **Home Hero (Splash Panel)** is locked statically at the absolute top of the index. This ensures the landing gate remains visually immediate and branding rules are preserved. It is excluded from the section pipeline below.
            </p>
          </div>
        </div>
      )}

      {/* Layout sequence panel */}
      <div className="bg-luxury-black/40 border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-luxury-gold" />
            <h3 className="text-sm font-serif text-white uppercase tracking-widest">Section Hierarchy</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">{activeSections.length} sections registered</span>
        </div>

        {activeSections.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs font-light">
            No sections registered or managed for this page yet.
          </div>
        ) : (
          <div className="space-y-3">
            {activeSections.map((section, index) => {
              const isFirst = index === 0;
              const isLast = index === activeSections.length - 1;
              return (
                <motion.div
                  key={section.id}
                  layoutId={section.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                    section.visible 
                      ? "bg-[#0a0910]/80 border-white/5 hover:border-luxury-gold/20" 
                      : "bg-[#050508]/40 border-white/5 opacity-50"
                  }`}
                >
                  {/* Left: Index & Name */}
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center font-mono text-[10px] text-zinc-400">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-serif text-white">{section.name}</h4>
                        <span className="text-[9px] font-mono text-zinc-600 uppercase">id: {section.id}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {section.visible ? "Displaying beautifully to clients" : "Temporarily offline & bypassed"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Operations */}
                  <div className="flex items-center gap-2 sm:self-center self-end">
                    {/* Edit Header Option if applicable */}
                    {["services", "portfolio", "testimonials", "creative_labs", "process", "pricing", "blog", "faq"].includes(section.id) && (
                      <button
                        onClick={() => {
                          setInitialSubTab("headers");
                          setManagerTab("content");
                          toast.success(`Opening Section Headers editor...`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/15 transition-all cursor-pointer text-xs font-semibold"
                        title="Edit Section Header (Title & Subtitle)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-luxury-gold animate-pulse" />
                        <span className="hidden sm:inline text-luxury-gold">Edit Header</span>
                      </button>
                    )}

                    {/* Edit Option */}
                    <button
                      onClick={() => handleEditSection(section.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-luxury-gold/20 bg-luxury-gold/5 text-luxury-gold hover:bg-luxury-gold/15 transition-all cursor-pointer text-xs font-semibold"
                      title="Edit Section Content"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    {/* Toggle visibility */}
                    <button
                      onClick={() => handleToggleVisibility(section.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        section.visible 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" 
                          : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                      }`}
                      title={section.visible ? "Hide Section" : "Show Section"}
                    >
                      {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={isFirst}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isFirst 
                          ? "bg-transparent border-transparent text-zinc-700 cursor-not-allowed" 
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                      }`}
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={isLast}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isLast 
                          ? "bg-transparent border-transparent text-zinc-700 cursor-not-allowed" 
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                      }`}
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context Guide */}
      <div className="bg-[#0b0a11] border border-white/5 p-6 rounded-2xl space-y-3">
        <h4 className="text-xs uppercase tracking-widest text-[#cfb53b] font-semibold flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Layout Pipeline Instructions
        </h4>
        <ul className="list-disc pl-5 text-[10px] text-zinc-400 space-y-1.5 leading-relaxed">
          <li>Sections can be rearranged instantaneously inside the viewport flow without breaking underlying code.</li>
          <li>Hiding a section prevents it from being loaded in the DOM tree, accelerating load performance for final users.</li>
          <li>Changes will take effect instantly in client routes once the layout configuration is saved.</li>
        </ul>
      </div>
        </>
      )}
    </section>
  );
}
