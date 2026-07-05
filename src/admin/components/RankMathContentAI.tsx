import React, { useState } from "react";
import { 
  Sparkles, Loader2, Search, ArrowRight, CheckCircle2, TrendingUp, Info
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface AISuggestion {
  keyword: string;
  volume: string;
  competition: "low" | "medium" | "high";
  status: "good" | "overused" | "unused";
}

const DEFAULT_SUGGESTIONS: AISuggestion[] = [
  { keyword: "fine art photography", volume: "18.5K", competition: "high", status: "good" },
  { keyword: "editorial portrait shoots", volume: "4.2K", competition: "medium", status: "good" },
  { keyword: "Paris luxury lookbooks", volume: "1.8K", competition: "low", status: "good" },
  { keyword: "couture fashion photographer", volume: "8.9K", competition: "high", status: "unused" },
  { keyword: "cinematic strobe lighting tips", volume: "2.1K", competition: "low", status: "good" },
  { keyword: "bridal photography guides", volume: "12.0K", competition: "medium", status: "overused" },
  { keyword: "medium format portraiture", volume: "3.5K", competition: "medium", status: "unused" },
];

export default function RankMathContentAI() {
  const toast = useToast();
  const [targetKeyword, setTargetKeyword] = useState("fine art photography paris");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasReport, setHasReport] = useState(true);

  // Suggested values
  const [wordCount, setWordCount] = useState({ current: 850, target: 1200 });
  const [linkCount, setLinkCount] = useState({ current: 6, target: 10 });
  const [mediaCount, mediaSet] = useState({ current: 14, target: 12 });
  const [headingCount, headingSet] = useState({ current: 5, target: 8 });

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setHasReport(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasReport(true);
      toast.success("Content AI suggestions parsed for your target keyword!");
    }, 1200);
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      
      {/* Top action header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h3 className="font-serif text-xl text-white">Content AI SEO Writing Assistant</h3>
          <p className="text-luxury-cream/40 text-xs mt-1">Harness advanced semantic models to get instant keyword suggestions, volume details, word count limits, and readability goals.</p>
        </div>
      </div>

      {/* Target Keyword input */}
      <div className="p-6 bg-[#0a0a10]/40 border border-white/5 rounded-3xl flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1.5 w-full">
          <label className="text-[10px] uppercase tracking-wider text-[#cfb53b] font-bold">Primary Target Keyword</label>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              placeholder="e.g. fine art editorial lookbook photoshoot"
              className="w-full bg-luxury-black border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
            />
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing || !targetKeyword.trim()}
          className="w-full md:w-auto px-6 py-4 bg-[#cfb53b] text-luxury-black font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-[46px]"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{isAnalyzing ? "Analyzing Semantic Corpus" : "Research with Content AI"}</span>
        </button>
      </div>

      {isAnalyzing && (
        <div className="p-12 text-center bg-luxury-black/30 border border-white/5 rounded-3xl space-y-4">
          <Loader2 className="w-10 h-10 text-[#cfb53b] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[#cfb53b] tracking-widest uppercase">Consulting AI Knowledgebases...</p>
          <p className="text-xs text-zinc-500">Checking search competition, counting keyword distributions, and mapping optimal structure benchmarks.</p>
        </div>
      )}

      {hasReport && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Target meters left column */}
          <div className="lg:col-span-5 bg-luxury-black/30 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Structure Goals</h4>
              <p className="text-luxury-cream/40 text-xs">Recommended structure ratios to optimize semantic search scoring indexes.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5 font-mono">
              {[
                { label: "Word Count Goals", current: wordCount.current, target: wordCount.target, color: "bg-amber-500", percent: (wordCount.current / wordCount.target) * 100 },
                { label: "Internal/External Links", current: linkCount.current, target: linkCount.target, color: "bg-[#cfb53b]", percent: (linkCount.current / linkCount.target) * 100 },
                { label: "Media Assets Counts", current: mediaCount.current, target: mediaCount.target, color: "bg-emerald-400", percent: 100 }, // exceed target is good
                { label: "Subheading Tags (H2-H4)", current: headingCount.current, target: headingCount.target, color: "bg-purple-400", percent: (headingCount.current / headingCount.target) * 100 },
              ].map((meter, index) => (
                <div key={index} className="space-y-1.5 p-4 bg-zinc-950/60 border border-white/5 rounded-2xl">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="uppercase font-bold tracking-wider text-zinc-400 font-sans">{meter.label}</span>
                    <span className="text-white font-bold">{meter.current} / <span className="text-zinc-500">{meter.target}</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${meter.color} transition-all duration-1000`} 
                      style={{ width: `${Math.min(meter.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-2 text-[10px] text-zinc-500 leading-normal">
              <Info className="w-4 h-4 text-[#cfb53b] shrink-0 mt-0.5" />
              <span>We recommend matching at least 80% of these parameters to establish strong semantic content coverage on Google.</span>
            </div>
          </div>

          {/* AI keywords suggestions right column */}
          <div className="lg:col-span-7 bg-luxury-black/30 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="space-y-1 pb-4 border-b border-white/5">
              <h4 className="font-serif text-lg text-white">Suggested Semantic Clusters</h4>
              <p className="text-luxury-cream/40 text-xs">Inject these related LSI keywords within your content body to boost rankings for related queries.</p>
            </div>

            <div className="divide-y divide-white/5">
              {DEFAULT_SUGGESTIONS.map((sug, index) => (
                <div key={index} className="py-3 flex items-center justify-between gap-4 font-mono">
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-white font-bold">{sug.keyword}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400">Volume: <span className="text-white font-bold">{sug.volume}</span></p>
                      <p className="text-[8px] text-zinc-600 uppercase font-sans tracking-wider">Comp: {sug.competition}</p>
                    </div>

                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      sug.status === "good"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : sug.status === "unused"
                        ? "bg-zinc-800 text-zinc-400 border border-white/5"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {sug.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
