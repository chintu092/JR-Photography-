import React, { useState } from "react";
import { 
  Sparkles, Monitor, Tablet, Phone, Loader2, RefreshCw, 
  CheckCircle, FileText, Globe, Key, Search, HelpCircle, Code 
} from "lucide-react";
import { SEOSettings } from "../../types";
import GoogleSEOPreview from "./GoogleSEOPreview";

interface SEOAssistantPanelProps {
  type: "posts" | "portfolio" | "services" | "testimonials" | "faq";
  currentTitle: string;
  currentSummary: string;
  currentContent?: string | string[];
  coverImage?: string;
  imageAlt?: string;
  seoSettings: SEOSettings;
  onUpdate: (updatedSeo: SEOSettings) => void;
  onUpdateGeneralFields?: (fields: { title?: string; summary?: string; imageAlt?: string }) => void;
}

export default function SEOAssistantPanel({
  type,
  currentTitle,
  currentSummary,
  currentContent = "",
  coverImage = "",
  imageAlt = "",
  seoSettings,
  onUpdate,
  onUpdateGeneralFields,
}: SEOAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<"audit" | "devices" | "copilot">("audit");
  const [deviceFrame, setDeviceFrame] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [copilotFeedback, setCopilotFeedback] = useState<string | null>(null);

  // Fallback to general fields if SEO specific fields are not set
  const title = seoSettings.title || currentTitle || "";
  const description = seoSettings.description || currentSummary || "";
  const focusKeyword = seoSettings.focusKeyword || "";
  const customSchema = seoSettings.schemaJson || "";

  const handleGenerate = async (field: string) => {
    setGeneratingField(field);
    setCopilotFeedback(null);
    try {
      const response = await fetch("/api/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          title: currentTitle,
          summary: currentSummary,
          keyword: focusKeyword,
          content: Array.isArray(currentContent) ? currentContent.join("\n") : currentContent,
          type,
        }),
      });

      const data = await response.json();
      if (data.text) {
        if (data.warning) {
          setCopilotFeedback(`⚠️ ${data.warning}`);
        }
        if (field === "title") {
          onUpdate({ ...seoSettings, title: data.text });
        } else if (field === "description") {
          onUpdate({ ...seoSettings, description: data.text });
        } else if (field === "keywords") {
          onUpdate({ ...seoSettings, focusKeyword: data.text.split(",")[0]?.trim() || "" });
          setCopilotFeedback(`Suggested Keywords: ${data.text}`);
        } else if (field === "schema") {
          onUpdate({ ...seoSettings, schemaJson: data.text, schemaType: type === "posts" ? "BlogPosting" : "CreativeWork" });
        } else if (field === "og") {
          onUpdate({
            ...seoSettings,
            ogTitle: seoSettings.title || currentTitle,
            ogDescription: seoSettings.description || currentSummary,
            ogImage: coverImage,
            twitterTitle: seoSettings.title || currentTitle,
            twitterDescription: seoSettings.description || currentSummary,
            twitterImage: coverImage,
          });
          setCopilotFeedback("Social sharing titles, descriptions & images synchronized successfully!");
        }
      }
    } catch (error) {
      console.error("AI Assistant optimization failed:", error);
    } finally {
      setGeneratingField(null);
    }
  };

  return (
    <div className="bg-luxury-black/30 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md h-full flex flex-col">
      {/* Visual Header Tabs */}
      <div className="flex border-b border-white/5 bg-[#0a0a10]">
        {[
          { id: "audit", label: "SEO Audit", icon: Globe },
          { id: "devices", label: "Device Previews", icon: Monitor },
          { id: "copilot", label: "AI Copilot", icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                isActive 
                  ? "border-[#cfb53b] text-white bg-white/[0.02]" 
                  : "border-transparent text-luxury-cream/40 hover:text-luxury-cream hover:bg-white/[0.01]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#cfb53b]" : "text-luxury-cream/40"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pane Content */}
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {activeTab === "audit" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <GoogleSEOPreview 
              title={title}
              summary={description}
              focusKeyword={focusKeyword}
              content={currentContent}
              coverImage={coverImage}
              imageAlt={imageAlt}
              seoSettings={seoSettings}
            />
          </div>
        )}

        {activeTab === "devices" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-[#0a0a10]/50 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-luxury-cream/40 pl-2">Responsive Device Visualizer</span>
              <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setDeviceFrame("desktop")}
                  className={`p-1.5 rounded ${deviceFrame === "desktop" ? "bg-[#cfb53b]/10 text-[#cfb53b]" : "text-zinc-500 hover:text-white"}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceFrame("tablet")}
                  className={`p-1.5 rounded ${deviceFrame === "tablet" ? "bg-[#cfb53b]/10 text-[#cfb53b]" : "text-zinc-500 hover:text-white"}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceFrame("mobile")}
                  className={`p-1.5 rounded ${deviceFrame === "mobile" ? "bg-[#cfb53b]/10 text-[#cfb53b]" : "text-zinc-500 hover:text-white"}`}
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inner responsive iframe or visually styled canvas simulator */}
            <div className="w-full flex justify-center bg-[#07060b] rounded-2xl border border-white/5 p-4 min-h-[350px] overflow-hidden">
              <div 
                className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-500 shadow-2xl flex flex-col"
                style={{
                  width: deviceFrame === "desktop" ? "100%" : deviceFrame === "tablet" ? "480px" : "320px",
                  maxWidth: "100%",
                }}
              >
                {/* Visual frame header */}
                <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-white/5">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <div className="w-full bg-[#121118] py-1 rounded-md text-[9px] text-[#cfb53b]/60 text-center font-mono truncate">
                    https://jrphotography.com/preview/{type}/{seoSettings.slug || "item-slug"}
                  </div>
                </div>

                {/* Simulated Content Body */}
                <div className="flex-1 bg-luxury-black text-luxury-cream overflow-y-auto max-h-[300px] select-none text-left">
                  {coverImage && (
                    <div className="w-full aspect-[21/9] relative bg-zinc-900 group">
                      <img src={coverImage} alt={imageAlt || "Preview item"} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-luxury-black to-transparent" />
                    </div>
                  )}
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono tracking-widest text-[#cfb53b] uppercase">PREVIEW BRAND MODE</span>
                      <h1 className="text-xl sm:text-2xl font-serif text-white">{currentTitle || "Title Field is Empty"}</h1>
                      <p className="text-[10px] text-luxury-cream/40 font-mono">Published Jun 8, 2026 • 5 min read</p>
                    </div>
                    <p className="text-xs text-luxury-cream/70 leading-relaxed italic border-l border-[#cfb53b]/40 pl-3">
                      {currentSummary || "Heuristics description preview snippet. Enter values inside form coordinates to live refresh indices."}
                    </p>
                    <div className="space-y-2 pt-2">
                       <p className="text-[11px] text-[#cfb53b]/80 uppercase tracking-wider font-bold">Featured Details</p>
                       <div className="w-10 h-0.5 bg-[#cfb53b]" />
                       <p className="text-[11px] text-luxury-cream/50 leading-relaxed">
                         The full details of this creative output will be shown in a responsive layout across desktop and hand-held devices.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "copilot" && (
          <div className="space-y-6 animate-in fade-in duration-500 text-left">
            <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#cfb53b] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider">AI SEO Copilot Assistants</h5>
                <p className="text-[10px] text-luxury-cream/60 leading-relaxed">
                  Leverage Google Gemini server-side AI rules to generate production-ready organic titles, meta tags, indexable key elements, schema representations, and Open Graph attributes.
                </p>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  id: "title",
                  label: "Generate SEO Title",
                  desc: "Drafts attention-grabbing organic listing titles.",
                  field: "title",
                },
                {
                  id: "description",
                  label: "Generate Meta Description",
                  desc: "Creates engaging 140-160 character description snippets.",
                  field: "description",
                },
                {
                  id: "keywords",
                  label: "Suggest Focus Keywords",
                  desc: "Recommends key terms based on text clusters.",
                  field: "keywords",
                },
                {
                  id: "og",
                  label: "Generate Open Graph Cards",
                  desc: "Syncs layout information for social sharing previews.",
                  field: "og",
                },
                {
                  id: "schema",
                  label: "Generate Schema Markup",
                  desc: "Creates search crawler JSON-LD semantic structure.",
                  field: "schema",
                },
              ].map((act) => {
                const isThisLoading = generatingField === act.field;
                return (
                  <div
                    key={act.id}
                    className="p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{act.label}</p>
                      <p className="text-[10px] text-luxury-cream/40">{act.desc}</p>
                    </div>
                    <button
                      type="button"
                      disabled={generatingField !== null}
                      onClick={() => handleGenerate(act.field)}
                      className="px-3 py-1.5 bg-[#cfb53b] disabled:bg-zinc-700 text-luxury-black font-semibold rounded-lg text-[9px] uppercase tracking-widest transition-all hover:bg-luxury-cream shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {isThisLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{isThisLoading ? "Synthesizing" : "Generate"}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {copilotFeedback && (
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-400 font-medium">
                {copilotFeedback}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
