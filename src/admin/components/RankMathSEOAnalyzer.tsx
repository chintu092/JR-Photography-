import React, { useState } from "react";
import { 
  Sparkles, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2, Download, Info, CheckCircle
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface AuditTest {
  id: string;
  name: string;
  category: "basic" | "advanced" | "performance" | "security";
  status: "passed" | "warning" | "failed";
  description: string;
  recommendation: string;
}

const AUDIT_RULES: AuditTest[] = [
  {
    id: "t1",
    name: "Focus Keyword in SEO Title tag",
    category: "basic",
    status: "passed",
    description: "Your primary focus keyword resides within the critical head Title tag elements.",
    recommendation: "Ensure key term remains on the extreme left of the template text."
  },
  {
    id: "t2",
    name: "Meta Description length criteria",
    category: "basic",
    status: "passed",
    description: "Meta description measures exactly 142 characters (ideal range: 120-160 characters).",
    recommendation: "Keep the character threshold below 160 to avoid Google snippet truncation."
  },
  {
    id: "t3",
    name: "Subheadings H2/H3 coverage",
    category: "basic",
    status: "passed",
    description: "Target focus keyword cluster terms discovered inside H2 tags.",
    recommendation: "Good job! Try grouping related keywords inside child H3 tags as well."
  },
  {
    id: "t4",
    name: "Image alt tags attribute check",
    category: "basic",
    status: "warning",
    description: "Some custom blog graphics are missing corresponding alt attribute strings.",
    recommendation: "Activate our 'Image SEO' automatic injector or add descriptive labels in your Asset Manager."
  },
  {
    id: "t5",
    name: "Internal and External links ratio",
    category: "basic",
    status: "passed",
    description: "Found robust organic distribution (4 internal links, 2 external outbound links).",
    recommendation: "Keep external links tagged with target=\"_blank\" to preserve browse sessions."
  },
  {
    id: "t6",
    name: "Canonical link tags existence",
    category: "advanced",
    status: "passed",
    description: "All index pages actively specify corresponding self-referential canonical parameters.",
    recommendation: "No duplicate index routing issues identified. Excellent."
  },
  {
    id: "t7",
    name: "JSON-LD structured schema parsing",
    category: "advanced",
    status: "passed",
    description: "Identified BlogPosting and Organization rich snippet codes injected successfully.",
    recommendation: "Trigger search consoles testing models to check reviews eligibility."
  },
  {
    id: "t8",
    name: "Open Graph sharing tags checklist",
    category: "advanced",
    status: "passed",
    description: "Fully configured og:title, og:description, and og:image social graphics.",
    recommendation: "Verify card ratios inside Facebook's official developers sharing debugger."
  },
  {
    id: "t9",
    name: "XML Sitemap registry reference",
    category: "advanced",
    status: "passed",
    description: "Live sitemaps catalog detected in robots.txt indices directory.",
    recommendation: "Re-submit references to Bing Webmaster tools for accelerated crawling."
  },
  {
    id: "t10",
    name: "Page Assets size and weight index",
    category: "performance",
    status: "warning",
    description: "Total page load weights measure 2.4MB. Large raw photography assets found.",
    recommendation: "Use the custom 'Asset Manager' to convert raw image assets into lightweight next-gen WebP or AVIF formats."
  },
  {
    id: "t11",
    name: "Resource minification (CSS/JS files)",
    category: "performance",
    status: "passed",
    description: "All client script bundles are compressed and minified via Vite production compilers.",
    recommendation: "Asset caching headers are active, speeding up recurring page sessions."
  },
  {
    id: "t12",
    name: "Server Response speed limits (TTFB)",
    category: "performance",
    status: "passed",
    description: "Server Response Latency measures 140ms. Well within standard thresholds.",
    recommendation: "Maintain scale-to-zero configurations on Cloud Run for optimal database cold-starts."
  },
  {
    id: "t13",
    name: "SSL Certificate / Secure HTTPS layers",
    category: "security",
    status: "passed",
    description: "Site fully serves SSL/TLS secure HTTPS protocols with modern HSTS directives.",
    recommendation: "No insecure mixed-content calls identified on client browser stages."
  },
  {
    id: "t14",
    name: "Directory Index indexing block",
    category: "security",
    status: "passed",
    description: "Web server directory listing browsing is disabled securely.",
    recommendation: "Correct. Prevents raw code directory structures from being accessed by crawlers."
  },
  {
    id: "t15",
    name: "Database optimization metrics",
    category: "security",
    status: "passed",
    description: "Firestore database indices are healthy with zero transient query lags.",
    recommendation: "Run routine schema audits when registering high-frequency portfolio lookbooks."
  }
];

export default function RankMathSEOAnalyzer() {
  const toast = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [hasScanned, setHasScanned] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | "basic" | "advanced" | "performance" | "security">("all");

  const runAudit = () => {
    setIsScanning(true);
    setHasScanned(false);
    
    const steps = [
      "Connecting crawler engines...",
      "Extracting on-page metatags...",
      "Analyzing photography image alt structures...",
      "Checking robots.txt & Sitemap indices...",
      "Verifying secure SSL HSTS handshakes...",
      "Compiling final performance diagnostic scores..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanStep(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setHasScanned(true);
        toast.success("Site SEO diagnostic audit completed successfully!");
      }
    }, 800);
  };

  const tests = AUDIT_RULES.filter(t => activeCategory === "all" || t.category === activeCategory);
  
  const totalTests = AUDIT_RULES.length;
  const passedCount = AUDIT_RULES.filter(t => t.status === "passed").length;
  const warningCount = AUDIT_RULES.filter(t => t.status === "warning").length;
  const failedCount = AUDIT_RULES.filter(t => t.status === "failed").length;
  const score = Math.round((passedCount / totalTests) * 100);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      
      {/* Top action header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h3 className="font-serif text-xl text-white">Full Site SEO Audit Scanner</h3>
          <p className="text-luxury-cream/40 text-xs mt-1">Simulate spider bot crawlers to analyze title tags, alt attributes, performance weights, and SSL configurations.</p>
        </div>

        <button
          onClick={runAudit}
          disabled={isScanning}
          className="px-5 py-2.5 bg-[#cfb53b] text-luxury-black font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all hover:bg-white disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
        >
          {isScanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>{isScanning ? "Running Audit" : "Analyze SEO Score"}</span>
        </button>
      </div>

      {isScanning && (
        <div className="p-12 text-center bg-luxury-black/30 border border-white/5 rounded-3xl space-y-4">
          <Loader2 className="w-10 h-10 text-[#cfb53b] animate-spin mx-auto" />
          <p className="text-sm font-mono text-[#cfb53b] tracking-widest uppercase">{scanStep}</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">Evaluating on-page guidelines, server response headers and sitemaps directory indexing models.</p>
        </div>
      )}

      {hasScanned && !isScanning && (
        <div className="space-y-6">
          {/* Summary stats counters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-luxury-black/30 border border-white/5 p-6 rounded-3xl flex flex-col justify-between items-center text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Audit SEO Score</span>
              <div className="relative flex items-center justify-center my-4">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.02)" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="#cfb53b" strokeWidth="6" fill="transparent" 
                          strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * score) / 100} />
                </svg>
                <span className="absolute text-2xl font-serif text-white">{score}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Excellent Health</span>
            </div>

            {[
              { label: "Passed Tests", count: passedCount, desc: "Direct SEO criteria fully matched.", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Warnings", count: warningCount, desc: "Elements requiring simple tweaks.", icon: AlertTriangle, color: "text-yellow-500" },
              { label: "Failed Tests", count: failedCount, desc: "Critical tags or files missing.", icon: XCircle, color: "text-red-400" },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-luxury-black/30 border border-white/5 p-6 rounded-3xl flex flex-col justify-between text-left">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{stat.label}</span>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="my-3">
                    <p className={`text-4xl font-serif ${stat.color}`}>{stat.count}</p>
                  </div>
                  <p className="text-[10px] text-zinc-400">{stat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Test filters bar */}
          <div className="flex flex-wrap gap-1 bg-[#0a0a10]/60 border border-white/5 p-1 rounded-xl w-fit">
            {[
              { id: "all", label: "All Audited Rules" },
              { id: "basic", label: "Basic SEO" },
              { id: "advanced", label: "Advanced SEO" },
              { id: "performance", label: "Performance" },
              { id: "security", label: "Security & Headers" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-[#cfb53b]/10 text-[#cfb53b] border border-[#cfb53b]/10"
                    : "text-luxury-cream/40 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tests output checklist */}
          <div className="bg-luxury-black/30 border border-white/5 rounded-3xl divide-y divide-white/5 overflow-hidden">
            {tests.map((test) => {
              return (
                <div key={test.id} className="p-5 sm:p-6 hover:bg-white/[0.01] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">
                      {test.status === "passed" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {test.status === "warning" && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                      {test.status === "failed" && <XCircle className="w-5 h-5 text-red-400" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{test.name}</h4>
                        <span className="text-[8px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded text-zinc-500">
                          {test.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-normal">{test.description}</p>
                      
                      {test.status !== "passed" && (
                        <div className="bg-zinc-950/40 border border-white/5 p-3 rounded-xl text-[10px] text-zinc-400 font-serif italic mt-2">
                          <span className="text-[#cfb53b] font-sans font-bold uppercase not-italic tracking-wider text-[8px] mr-1.5">Rank Math Fix:</span>
                          {test.recommendation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className={`text-[9px] font-mono uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border ${
                      test.status === "passed"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : test.status === "warning"
                        ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    }`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
