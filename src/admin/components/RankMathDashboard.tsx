import React, { useState, useEffect } from "react";
import { 
  Sparkles, Shield, Compass, Image as ImageIcon, Link2, Map, Zap, 
  BarChart3, Settings, HelpCircle, ToggleLeft, ToggleRight, CheckSquare, 
  Code, AlertCircle, RefreshCw, FileText, Share2, HelpCircle as HelpIcon 
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";

interface Module {
  id: string;
  name: string;
  description: string;
  category: "all" | "seo" | "analytics" | "performance" | "advanced";
  icon: React.ComponentType<any>;
  badge?: "FREE" | "PRO" | "AI";
  tabId?: string;
}

const ALL_MODULES: Module[] = [
  {
    id: "analytics",
    name: "Analytics & Search Console",
    description: "Integrate Google Search Console, Analytics 4, and Adsense to track clicks, keywords, and earnings.",
    category: "analytics",
    icon: BarChart3,
    badge: "PRO",
    tabId: "dashboard",
  },
  {
    id: "content_ai",
    name: "Content AI (Writing Copilot)",
    description: "Get proprietary AI-based recommendations for keywords, word length, media count, and formatting.",
    category: "advanced",
    icon: Sparkles,
    badge: "AI",
    tabId: "content_ai",
  },
  {
    id: "four_zero_four",
    name: "404 Monitor",
    description: "Crawl and log broken URL paths hit by visitors & bots. Redirect immediately to save link juice.",
    category: "seo",
    icon: AlertCircle,
    badge: "FREE",
    tabId: "four_zero_four",
  },
  {
    id: "redirections",
    name: "Redirections Manager",
    description: "Seamlessly create 301, 302, 307 redirects. Supports exact, starts-with, contains, and regex rules.",
    category: "seo",
    icon: Link2,
    badge: "FREE",
    tabId: "redirections",
  },
  {
    id: "sitemaps",
    name: "XML Sitemap Engine",
    description: "Generate dynamic photographic indices, blog archives, and media maps for crawling search networks.",
    category: "seo",
    icon: Map,
    badge: "FREE",
    tabId: "sitemaps",
  },
  {
    id: "indexing",
    name: "Instant Indexing (IndexNow)",
    description: "Directly publish and notify Microsoft Bing, Yandex, and Seznam when you post blogs or portfolios.",
    category: "performance",
    icon: Zap,
    badge: "FREE",
    tabId: "indexing",
  },
  {
    id: "local_seo",
    name: "Local SEO & Knowledge Graph",
    description: "Establish physical organization latitude, longitude, and contact profile tags to trigger sidebar cards.",
    category: "seo",
    icon: Compass,
    badge: "FREE",
    tabId: "local_seo",
  },
  {
    id: "schema_templates",
    name: "Schema (Structured Data)",
    description: "Incorporate advanced JSON-LD rich snippet code for Google to feature stars, jobs, and products.",
    category: "advanced",
    icon: Code,
    badge: "PRO",
    tabId: "schema_templates",
  },
  {
    id: "image_seo",
    name: "Image SEO Optimizer",
    description: "Automatically inject missing ALT and TITLE attributes on the fly using customizable templates.",
    category: "performance",
    icon: ImageIcon,
    badge: "PRO",
    tabId: "general_settings",
  },
  {
    id: "role_manager",
    name: "Role & Permission Manager",
    description: "Restrict access to SEO capabilities among Administrators, Editors, Authors, and Contributors.",
    category: "advanced",
    icon: Shield,
    badge: "PRO",
    tabId: "role_manager",
  },
  {
    id: "seo_analyzer",
    name: "Site SEO Analyzer Audit",
    description: "Run a site-wide diagnostic scan evaluating security, speed, links, indexability, and mobile status.",
    category: "analytics",
    icon: CheckSquare,
    badge: "FREE",
    tabId: "seo_analyzer",
  },
  {
    id: "link_builder",
    name: "Internal Link Builder",
    description: "Define auto-replace rules to convert high-value keywords to internal links across your blog posts.",
    category: "advanced",
    icon: Link2,
    badge: "PRO",
    tabId: "link_builder",
  }
];

interface RankMathDashboardProps {
  onTabChange: (tabId: string) => void;
}

export default function RankMathDashboard({ onTabChange }: RankMathDashboardProps) {
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState<"all" | "seo" | "analytics" | "performance" | "advanced">("all");
  const [modulesState, setModulesState] = useState<Record<string, boolean>>({
    analytics: true,
    content_ai: true,
    four_zero_four: true,
    redirections: true,
    sitemaps: true,
    indexing: true,
    local_seo: true,
    schema_templates: true,
    image_seo: true,
    role_manager: true,
    seo_analyzer: true,
    link_builder: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchModules() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seo_modules"));
        if (docSnap.exists()) {
          setModulesState({
            ...modulesState,
            ...docSnap.data().active,
          });
        }
      } catch (error) {
        console.error("Failed to load modules state:", error);
      }
    }
    fetchModules();
  }, []);

  const handleToggle = async (moduleId: string) => {
    const updated = {
      ...modulesState,
      [moduleId]: !modulesState[moduleId],
    };
    setModulesState(updated);
    try {
      await setDoc(doc(db, "settings", "seo_modules"), { active: updated }, { merge: true });
      toast.success(`${ALL_MODULES.find(m => m.id === moduleId)?.name} ${updated[moduleId] ? "Activated" : "Deactivated"}!`);
    } catch (e: any) {
      toast.error(`Failed to update module state: ${e.message}`);
    }
  };

  const handleBulkToggle = async (status: boolean) => {
    const bulk: Record<string, boolean> = {};
    Object.keys(modulesState).forEach(k => {
      bulk[k] = status;
    });
    setModulesState(bulk);
    try {
      await setDoc(doc(db, "settings", "seo_modules"), { active: bulk }, { merge: true });
      toast.success(`All Rank Math modules ${status ? "Activated" : "Deactivated"} successfully.`);
    } catch (e: any) {
      toast.error("Failed to bulk update modules.");
    }
  };

  const filteredModules = ALL_MODULES.filter(m => activeFilter === "all" || m.category === activeFilter);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h3 className="font-serif text-xl text-white">Rank Math Modules Manager</h3>
          <p className="text-luxury-cream/40 text-xs mt-1">Activate, de-activate, or configure advanced SEO modules tailored for your fine art photographic workspace.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleBulkToggle(true)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
          >
            Enable All
          </button>
          <button
            onClick={() => handleBulkToggle(false)}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-red-500/20 cursor-pointer"
          >
            Disable All
          </button>
        </div>
      </div>

      {/* Category Filter Tab Selector */}
      <div className="flex flex-wrap gap-1 bg-[#0a0a10]/60 border border-white/5 p-1 rounded-xl w-fit">
        {[
          { id: "all", label: "All Modules" },
          { id: "seo", label: "Core SEO" },
          { id: "analytics", label: "Analytics" },
          { id: "performance", label: "Performance" },
          { id: "advanced", label: "Advanced Elements" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === tab.id
                ? "bg-[#cfb53b]/10 text-[#cfb53b] border border-[#cfb53b]/10"
                : "text-luxury-cream/40 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const Icon = module.icon;
          const isActive = !!modulesState[module.id];
          return (
            <div 
              key={module.id} 
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between gap-5 relative overflow-hidden group ${
                isActive 
                  ? "bg-luxury-black/40 border-white/10" 
                  : "bg-zinc-950/20 border-white/5 opacity-60 hover:opacity-80"
              }`}
            >
              {/* Floating Badge */}
              {module.badge && (
                <span className={`absolute top-4 right-4 text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded tracking-widest ${
                  module.badge === "AI" 
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/25" 
                    : module.badge === "PRO" 
                    ? "bg-luxury-gold/10 text-[#cfb53b] border border-luxury-gold/25"
                    : "bg-zinc-800 text-zinc-400 border border-white/5"
                }`}>
                  {module.badge}
                </span>
              )}

              <div className="space-y-3">
                <div className={`p-3 rounded-2xl w-fit border ${
                  isActive 
                    ? "bg-[#cfb53b]/10 border-[#cfb53b]/25 text-[#cfb53b]" 
                    : "bg-zinc-900 border-white/5 text-zinc-500"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{module.name}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3">{module.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                {/* Module Settings Trigger */}
                {isActive && module.tabId ? (
                  <button
                    onClick={() => onTabChange(module.tabId!)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-luxury-gold hover:text-white uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Module Off</span>
                )}

                {/* Status Toggle Switch */}
                <button
                  onClick={() => handleToggle(module.id)}
                  className="flex items-center gap-1.5 focus:outline-none cursor-pointer"
                >
                  <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                    isActive ? "text-[#cfb53b]" : "text-zinc-500"
                  }`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  {isActive ? (
                    <ToggleRight className="w-6 h-6 text-[#cfb53b]" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-zinc-600" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
