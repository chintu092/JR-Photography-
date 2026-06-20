import React, { useState } from "react";
import { Globe, AlertTriangle, CheckCircle2, Phone, Monitor, ShieldAlert } from "lucide-react";
import { SEOSettings } from "../../types";

interface GoogleSEOPreviewProps {
  title: string;
  summary: string;
  focusKeyword?: string;
  content?: string | string[];
  coverImage?: string;
  imageAlt?: string;
  seoSettings?: SEOSettings;
}

export default function GoogleSEOPreview({
  title,
  summary,
  focusKeyword = "",
  content = "",
  coverImage = "",
  imageAlt = "",
  seoSettings,
}: GoogleSEOPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const displayTitle = seoSettings?.title || title || "Untitled Item";
  const displaySummary = seoSettings?.description || summary || "Provide a summary or meta description to configure how this page is displayed in index directories.";
  const displaySlug = seoSettings?.slug || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : "untitled-item");

  const titleLength = displayTitle.length;
  const summaryLength = displaySummary.length;

  // Compile full content body for search matching
  const fullContentStr = (
    displayTitle +
    " " +
    displaySummary +
    " " +
    (Array.isArray(content) ? content.join(" ") : content)
  ).toLowerCase();

  const keywordMatched =
    focusKeyword.trim() !== "" &&
    fullContentStr.includes(focusKeyword.toLowerCase());

  // Define SEO warnings and passes
  const checks: { id: string; name: string; checked: boolean; isWarning: boolean }[] = [
    {
      id: "seo_title_exists",
      name: "SEO title exists",
      checked: displayTitle.trim().length > 0 && displayTitle !== "Untitled Item",
      isWarning: false,
    },
    {
      id: "meta_desc_exists",
      name: "Meta description exists",
      checked: displaySummary.trim().length > 0 && !displaySummary.startsWith("Provide a summary"),
      isWarning: false,
    },
    {
      id: "focus_word_found",
      name: `Focus keyword "${focusKeyword}" found in content`,
      checked: keywordMatched,
      isWarning: false,
    },
    {
      id: "title_optimal_length",
      name: "SEO Title is within optimal limit (50-60 chars)",
      checked: titleLength >= 50 && titleLength <= 60,
      isWarning: true,
    },
    {
      id: "summary_optimal_length",
      name: "Meta Description is within range (140-160 chars)",
      checked: summaryLength >= 140 && summaryLength <= 160,
      isWarning: true,
    },
    {
      id: "og_image_exists",
      name: "Open Graph sharing image configured",
      checked: !!(seoSettings?.ogImage || coverImage),
      isWarning: true,
    },
    {
      id: "image_alt_exists",
      name: "Image descriptive Alt-text covers screen accessibility",
      checked: !!imageAlt.trim() || !!(seoSettings?.title),
      isWarning: true,
    },
  ];

  // Filter out rules that don't apply when they're empty
  const activeChecks = checks.map(c => {
    // If focus keyword is empty, mark matched keyword as not applicable/skipped
    if (c.id === "focus_word_found" && focusKeyword.trim() === "") {
      return { ...c, name: "Add a focus keyword to verify matches", checked: false, skipped: true };
    }
    return c;
  });

  const passedCount = activeChecks.filter((c: any) => c.checked && !c.skipped).length;
  const totalRelevant = activeChecks.filter((c: any) => !c.skipped).length;
  const scorePercent = totalRelevant > 0 ? Math.round((passedCount / totalRelevant) * 100) : 0;

  return (
    <div className="bg-luxury-black/40 border border-luxury-gold/15 rounded-2xl p-4 sm:p-6 space-y-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.25em] text-luxury-gold font-bold flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-luxury-gold" />
            Google SERP Snippet Preview
          </h4>
          <p className="text-[10px] text-luxury-cream/40 mt-1 font-sans">
            Your appearance on global Search Engine Results Pages (SERP).
          </p>
        </div>

        {/* Device preview toggles */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-mono font-medium flex items-center gap-1.5 transition-all ${
              device === "desktop"
                ? "bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/20"
                : "text-luxury-cream/40 hover:text-luxury-cream border border-transparent"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wider font-mono font-medium flex items-center gap-1.5 transition-all ${
              device === "mobile"
                ? "bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/20"
                : "text-luxury-cream/40 hover:text-luxury-cream border border-transparent"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* Actual Simulation Box styled like Google Search Engine Results */}
      <div className="w-full flex justify-center bg-[#f8f9fa] rounded-xl p-4 sm:p-6 border border-white/5 overflow-hidden transition-colors">
        {device === "desktop" ? (
          /* Google Desktop Layout */
          <div className="w-full max-w-[600px] text-left font-sans select-none bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-[#202124] text-[12px] leading-tight mb-1 font-sans">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                <span className="text-[10px] font-bold text-gray-700 font-serif">JP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-950 text-[14px]">JR Photography</span>
                <span className="text-gray-400 text-[11px] truncate">
                  https://jrphotography.com › {displaySlug}
                </span>
              </div>
            </div>

            <h3 className="text-[#1a0dab] hover:underline text-[20px] font-medium leading-[1.3] truncate cursor-pointer font-sans mt-1">
              {displayTitle}
            </h3>

            <p className="text-[#4d5156] text-[14px] leading-[1.58] mt-1 break-words font-sans">
              <span className="text-gray-500 mr-1.5 font-medium">Jun 8, 2026 —</span>
              {displaySummary.length > 160
                ? `${displaySummary.substring(0, 157)}...`
                : displaySummary}
            </p>
          </div>
        ) : (
          /* Google Mobile Layout */
          <div className="w-full max-w-[375px] text-left font-sans select-none bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-[#202124] text-[12px] mb-2 font-sans">
              <div className="w-4.5 h-4.5 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
                <span className="text-[8px] font-bold text-gray-700 font-serif">JP</span>
              </div>
              <div className="leading-tight">
                <p className="text-[12px] font-medium text-gray-900">JR Photography</p>
                <p className="text-[#5f6368] text-[10px] truncate">https://jrphotography.com/{displaySlug}</p>
              </div>
            </div>

            <h3 className="text-[#1558d6] hover:underline text-[18px] leading-tight font-medium cursor-pointer break-words font-sans">
              {displayTitle}
            </h3>

            <p className="text-[#3c4043] text-[13px] leading-[1.4] mt-1.5 break-words font-sans">
              <span className="text-gray-500 mr-1.5 font-medium">Jun 8, 2026 — </span>
              {displaySummary.length > 150
                ? `${displaySummary.substring(0, 147)}...`
                : displaySummary}
            </p>
          </div>
        )}
      </div>

      {/* SEO Score Circle Meter & Length Trackers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-white/5 py-4">
        {/* Score Dial */}
        <div className="flex flex-col items-center justify-center p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-2">
          <div className="relative flex items-center justify-center">
            {/* Simple SVGCircle score dial */}
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-white/5"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                className={`transition-all duration-500 ${
                  scorePercent >= 80 ? "stroke-emerald-400" :
                  scorePercent >= 50 ? "stroke-[#cfb53b]" : "stroke-red-400"
                }`}
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - scorePercent / 100)}
              />
            </svg>
            <span className="absolute text-sm font-sans font-extrabold text-luxury-cream">
              {scorePercent}%
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-[#cfb53b] font-bold">SEO Health Index</span>
        </div>

        {/* Title length */}
        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-center space-y-2">
          <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
            <span>Title Size</span>
            <span className={titleLength >= 50 && titleLength <= 60 ? "text-emerald-400 font-bold" : "text-amber-500"}>
              {titleLength} / 60
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                titleLength >= 50 && titleLength <= 60 ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, (titleLength / 60) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-400">Target limit: 50–60 chars</span>
        </div>

        {/* Description length */}
        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-center space-y-2">
          <div className="flex justify-between items-center text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
            <span>Desc Size</span>
            <span className={summaryLength >= 140 && summaryLength <= 160 ? "text-emerald-400 font-bold" : "text-amber-500"}>
              {summaryLength} / 160
            </span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                summaryLength >= 140 && summaryLength <= 160 ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, (summaryLength / 160) * 100)}%` }}
            />
          </div>
          <span className="text-[9px] text-zinc-400">Target limit: 140–160 chars</span>
        </div>
      </div>

      {/* SEO Health Checker list */}
      <div className="space-y-3">
        <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b]">SEO Audit Protocol</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
          {activeChecks.map((c: any) => {
            if (c.skipped) {
              return (
                <div key={c.id} className="flex items-center gap-2 p-2 bg-white/[0.01] rounded-xl border border-dashed border-white/5 text-zinc-500">
                  <div className="w-5 h-5 rounded-full border border-dashed border-zinc-600 flex items-center justify-center text-[8px] font-bold">—</div>
                  <span className="truncate">{c.name}</span>
                </div>
              );
            }
            return (
              <div
                key={c.id}
                className={`flex items-center gap-2 p-2 bg-white/[0.02] rounded-xl border transition-colors ${
                  c.checked
                    ? "border-emerald-500/10 text-zinc-300 hover:bg-emerald-500/[0.02]"
                    : c.isWarning
                    ? "border-amber-500/15 text-amber-300/80 hover:bg-amber-500/[0.01]"
                    : "border-red-500/15 text-red-300/80 hover:bg-red-500/[0.01]"
                }`}
              >
                {c.checked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${c.isWarning ? "text-amber-400" : "text-red-400"}`} />
                )}
                <span className="truncate leading-tight">{c.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
