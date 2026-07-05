import React, { useState, useEffect } from "react";
import { 
  AlertCircle, Trash, Download, Link2, Settings, FileSpreadsheet, RefreshCw, Info, HelpCircle, Loader2
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Log404 {
  id: string;
  uri: string;
  hits: number;
  referer: string;
  userAgent: string;
  lastSeen: string;
}

const DEFAULT_LOGS: Log404[] = [
  {
    id: "log-1",
    uri: "/wp-login.php",
    hits: 42,
    referer: "Direct / Unknown",
    userAgent: "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
    lastSeen: "2026-06-24 12:45:00"
  },
  {
    id: "log-2",
    uri: "/portfolio-old-shoot/",
    hits: 15,
    referer: "https://m.facebook.com/",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    lastSeen: "2026-06-24 10:20:15"
  },
  {
    id: "log-3",
    uri: "/old-services/commercial-commercial-photography",
    hits: 28,
    referer: "https://www.google.com/",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    lastSeen: "2026-06-24 11:10:30"
  },
  {
    id: "log-4",
    uri: "/wp-content/themes/old-theme/assets/css/main.css",
    hits: 6,
    referer: "https://jrphotography.com/about",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    lastSeen: "2026-06-23 18:33:12"
  },
  {
    id: "log-5",
    uri: "/category/uncategorized",
    hits: 19,
    referer: "https://bing.com/",
    userAgent: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    lastSeen: "2026-06-24 08:04:11"
  }
];

interface RankMath404MonitorProps {
  onAddRedirect: (source: string) => void;
}

export default function RankMath404Monitor({ onAddRedirect }: RankMath404MonitorProps) {
  const toast = useToast();
  const [monitorMode, setMonitorMode] = useState<"simple" | "advanced">("advanced");
  const [logLimit, setLogLimit] = useState(100);
  const [excludePaths, setExcludePaths] = useState("/wp-admin/*\n/temp/*\n*.css");
  const [logs, setLogs] = useState<Log404[]>(DEFAULT_LOGS);
  const [activeTab, setActiveTab] = useState<"logs" | "settings">("logs");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seo_404_settings"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMonitorMode(data.monitorMode || "advanced");
          setLogLimit(data.logLimit || 100);
          setExcludePaths(data.excludePaths || "/wp-admin/*\n/temp/*\n*.css");
        }
      } catch (error) {
        console.error("Failed to load 404 settings:", error);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "seo_404_settings"), {
        monitorMode,
        logLimit,
        excludePaths,
      }, { merge: true });
      toast.success("404 Monitor configuration options saved!");
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast.success("404 crawl logs cleared!");
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
    toast.success("Log item removed.");
  };

  const handleExportCSV = () => {
    const headers = "URI,Hits,Referer,User-Agent,Last Seen\n";
    const rows = logs.map(l => `"${l.uri}",${l.hits},"${l.referer}","${l.userAgent}","${l.lastSeen}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rank-math-404-crawl-error-logs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Crawl logs exported successfully.");
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-500">
      
      {/* Top action header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h3 className="font-serif text-xl text-white">404 Error Monitor Settings</h3>
          <p className="text-luxury-cream/40 text-xs mt-1">Trace broken links, missing image references, and robotic web exploits instantly to configure redirects.</p>
        </div>

        <div className="flex bg-[#0a0a10]/60 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "logs" ? "bg-[#cfb53b]/10 text-[#cfb53b]" : "text-luxury-cream/40 hover:text-white"
            }`}
          >
            Crawl Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-[#cfb53b]/10 text-[#cfb53b]" : "text-luxury-cream/40 hover:text-white"
            }`}
          >
            Monitor Settings
          </button>
        </div>
      </div>

      {activeTab === "logs" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-4 bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-luxury-cream/60 text-xs">
              <Info className="w-4 h-4 text-[#cfb53b]" />
              <span>Rank Math is tracking all unresolved 404 client-side responses in real-time.</span>
            </div>
            
            {logs.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-red-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash className="w-3.5 h-3.5" />
                  <span>Clear All Logs</span>
                </button>
              </div>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center bg-luxury-black/30 border border-white/5 rounded-3xl space-y-3">
              <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-serif text-zinc-400">Pristine Health Status</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">Zero broken URLs or missing index references have been reported. Congratulations, your photographic site is clean!</p>
            </div>
          ) : (
            <div className="bg-luxury-black/30 border border-white/5 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#050408]/60 border-b border-white/5 text-[9px] uppercase tracking-widest text-[#cfb53b] font-bold">
                      <th className="py-4 px-6">Broken URI Request</th>
                      <th className="py-4 px-4 text-center">Hits</th>
                      <th className="py-4 px-4">Referer Source</th>
                      <th className="py-4 px-4">User-Agent / Robot Info</th>
                      <th className="py-4 px-4">Last Event Time</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-luxury-cream/80 font-mono">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 font-bold text-white max-w-[200px] truncate">{log.uri}</td>
                        <td className="py-4 px-4 text-center font-bold text-[#cfb53b]">{log.hits}</td>
                        <td className="py-4 px-4 text-[10px] max-w-[150px] truncate">{log.referer}</td>
                        <td className="py-4 px-4 text-[9px] max-w-[250px] truncate text-zinc-500" title={log.userAgent}>
                          {log.userAgent}
                        </td>
                        <td className="py-4 px-4 text-[10px] text-zinc-400 font-sans whitespace-nowrap">{log.lastSeen}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onAddRedirect(log.uri)}
                              className="px-2.5 py-1.5 bg-[#cfb53b]/10 hover:bg-[#cfb53b] text-[#cfb53b] hover:text-luxury-black rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Instantly configure a 301 redirection rule"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Redirect</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/5 rounded-lg transition-all cursor-pointer"
                              title="Delete log row"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-luxury-black/30 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">404 Tracking Resolution Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "simple", label: "Simple Tracking Mode", desc: "Logs only the requested broken URI path and event timestamp. Safe and highly memory-efficient." },
                  { id: "advanced", label: "Advanced Detailed Mode", desc: "Traces full referer websites, detailed browser search agent clusters and request parameters." },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setMonitorMode(opt.id as any)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      monitorMode === opt.id
                        ? "bg-[#cfb53b]/10 border-[#cfb53b]/30 text-white"
                        : "bg-zinc-950/40 border-white/5 text-luxury-cream/50"
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider">{opt.label}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Log Record Retention Limit</label>
              <input
                type="number"
                value={logLimit}
                onChange={(e) => setLogLimit(Number(e.target.value))}
                placeholder="100"
                className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
              />
              <p className="text-[9px] text-zinc-500">Maximum database log ceiling. Records automatically cycle out once limit is reached.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Exclude Crawler Error Paths</label>
              <textarea
                value={excludePaths}
                onChange={(e) => setExcludePaths(e.target.value)}
                rows={4}
                className="w-full bg-[#050408] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#cfb53b]/40 leading-relaxed"
                placeholder="/wp-admin/*&#10;/temp/*"
              />
              <p className="text-[9px] text-zinc-500">Exclude known paths or specific search query targets from polluting your active 404 crawl log directory.</p>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
            <span>Save 404 Monitor Settings</span>
          </button>
        </div>
      )}
    </div>
  );
}
