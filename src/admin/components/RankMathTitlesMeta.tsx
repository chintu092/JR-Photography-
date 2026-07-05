import React, { useState, useEffect } from "react";
import { 
  Save, Loader2, Globe, Share2, FileText, Sparkles, Sliders
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";

export default function RankMathTitlesMeta() {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"global" | "social" | "archives" | "post_types">("global");
  const [loading, setLoading] = useState(false);

  // Global meta states
  const [globalIndexStatus, setGlobalIndexStatus] = useState<"index" | "noindex">("index");
  const [metaSeparator, setMetaSeparator] = useState("-");
  const [capitalizeTitles, setCapitalizeTitles] = useState(true);
  const [fallbackOgImage, setFallbackOgImage] = useState("");

  // Social meta states
  const [facebookAppId, setFacebookAppId] = useState("");
  const [twitterCardType, setTwitterCardType] = useState("summary_large_image");
  const [twitterHandle, setTwitterHandle] = useState("@jrphotography");

  // Archives states
  const [enableAuthorArchives, setEnableAuthorArchives] = useState(false);
  const [authorPrefix, setAuthorPrefix] = useState("author");
  const [authorIndex, setAuthorIndex] = useState<"index" | "noindex">("noindex");
  const [dateIndex, setDateIndex] = useState<"index" | "noindex">("noindex");
  const [searchIndex, setSearchIndex] = useState<"index" | "noindex">("noindex");

  // Post types default meta templates
  const [postTitleTemplate, setPostTitleTemplate] = useState("%title% %separator% %sitename%");
  const [postDescTemplate, setPostDescTemplate] = useState("%excerpt% %separator% Read more about our professional photoshoot collections.");
  const [portfolioTitleTemplate, setPortfolioTitleTemplate] = useState("Portfolio: %title% %separator% %sitename%");
  const [portfolioDescTemplate, setPortfolioDescTemplate] = useState("Explore %title%, curated professional photography works by JR Studio.");
  const [serviceTitleTemplate, setServiceTitleTemplate] = useState("Service Packages: %title% %separator% %sitename%");
  const [serviceDescTemplate, setServiceDescTemplate] = useState("%title% photoshoot offerings. Packages include editing, high-resolution prints.");

  useEffect(() => {
    async function loadMetaSettings() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seo_titles_meta"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGlobalIndexStatus(data.globalIndexStatus || "index");
          setMetaSeparator(data.metaSeparator || "-");
          setCapitalizeTitles(data.capitalizeTitles !== false);
          setFallbackOgImage(data.fallbackOgImage || "");

          setFacebookAppId(data.facebookAppId || "");
          setTwitterCardType(data.twitterCardType || "summary_large_image");
          setTwitterHandle(data.twitterHandle || "@jrphotography");

          setEnableAuthorArchives(!!data.enableAuthorArchives);
          setAuthorPrefix(data.authorPrefix || "author");
          setAuthorIndex(data.authorIndex || "noindex");
          setDateIndex(data.dateIndex || "noindex");
          setSearchIndex(data.searchIndex || "noindex");

          setPostTitleTemplate(data.postTitleTemplate || "%title% %separator% %sitename%");
          setPostDescTemplate(data.postDescTemplate || "%excerpt% %separator% Read more about our professional photoshoot collections.");
          setPortfolioTitleTemplate(data.portfolioTitleTemplate || "Portfolio: %title% %separator% %sitename%");
          setPortfolioDescTemplate(data.portfolioDescTemplate || "Explore %title%, curated professional photography works by JR Studio.");
          setServiceTitleTemplate(data.serviceTitleTemplate || "Service Packages: %title% %separator% %sitename%");
          setServiceDescTemplate(data.serviceDescTemplate || "%title% photoshoot offerings. Packages include editing, high-resolution prints.");
        }
      } catch (error) {
        console.error("Failed to load title meta settings:", error);
      }
    }
    loadMetaSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "seo_titles_meta"), {
        globalIndexStatus,
        metaSeparator,
        capitalizeTitles,
        fallbackOgImage,
        facebookAppId,
        twitterCardType,
        twitterHandle,
        enableAuthorArchives,
        authorPrefix,
        authorIndex,
        dateIndex,
        searchIndex,
        postTitleTemplate,
        postDescTemplate,
        portfolioTitleTemplate,
        portfolioDescTemplate,
        serviceTitleTemplate,
        serviceDescTemplate
      }, { merge: true });
      toast.success("Titles & Meta default options saved successfully!");
    } catch (e: any) {
      toast.error(`Error saving metadata options: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const SEPARATORS = ["-", "|", "•", "/", "»", "~", "*", "★"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-500">
      
      {/* Sub tabs list rail */}
      <div className="lg:col-span-3 space-y-1 bg-[#0a0a10]/40 border border-white/5 p-3 rounded-2xl h-fit">
        {[
          { id: "global", label: "Global Meta Settings", icon: Sliders },
          { id: "social", label: "Social Meta Profile", icon: Share2 },
          { id: "archives", label: "Archives Indexing", icon: Globe },
          { id: "post_types", label: "Default Templates", icon: FileText },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id as any)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === item.id
                  ? "bg-[#cfb53b]/10 text-[#cfb53b] border border-[#cfb53b]/15"
                  : "text-luxury-cream/40 hover:bg-white/[0.02] hover:text-white border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main settings options configuration block */}
      <div className="lg:col-span-9 bg-luxury-black/40 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
        
        {activeSubTab === "global" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Global Meta Settings</h4>
              <p className="text-luxury-cream/40 text-xs">Configure site-wide title separators, capitalization, indexation and default graphical tags.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Global Index Status Directive</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "index", label: "INDEX (Allow Search)", desc: "Enable crawling by Google, Bing and Yandex bots." },
                    { id: "noindex", label: "NOINDEX (Private)", desc: "Request search engines not to render site links." },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setGlobalIndexStatus(opt.id as any)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        globalIndexStatus === opt.id
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
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Meta Title Separator</label>
                <div className="flex flex-wrap gap-2">
                  {SEPARATORS.map(sep => (
                    <button
                      key={sep}
                      onClick={() => setMetaSeparator(sep)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-mono transition-all cursor-pointer ${
                        metaSeparator === sep
                          ? "bg-[#cfb53b]/20 border-[#cfb53b] text-white font-bold"
                          : "bg-zinc-950/40 border-white/5 text-zinc-500 hover:text-white"
                      }`}
                    >
                      {sep}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-zinc-500">Separates single page titles from the core site name inside your browser tab indicator.</p>
              </div>

              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Capitalize Meta Titles Automatically</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">Uppercase the initial character of all words in custom page titles.</p>
                </div>
                <button
                  onClick={() => setCapitalizeTitles(!capitalizeTitles)}
                  className={`w-12 shrink-0 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                    capitalizeTitles ? "bg-[#cfb53b]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                    capitalizeTitles ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Fallback OpenGraph Share Image (URL)</label>
                <input
                  type="text"
                  value={fallbackOgImage}
                  onChange={(e) => setFallbackOgImage(e.target.value)}
                  placeholder="https://jrphotography.com/fallback-cover.jpg"
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                />
                <p className="text-[9px] text-zinc-500 font-mono">Used if specific on-page portfolio images are not configured during social sharing.</p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "social" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Social Meta Profile Coordinates</h4>
              <p className="text-luxury-cream/40 text-xs">Define global tags and developer app keys to render rich cards inside Facebook, Pinterest, and X (Twitter).</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Facebook Admin/App Id</label>
                <input
                  type="text"
                  value={facebookAppId}
                  onChange={(e) => setFacebookAppId(e.target.value)}
                  placeholder="e.g. 15938472910394"
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Default Twitter Card Representation</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "summary_large_image", label: "Summary Card with Large Image", desc: "Displays prominent visual photography block." },
                    { id: "summary", label: "Simple Summary Text Card", desc: "Displays standard compact rectangular text link." },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setTwitterCardType(opt.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        twitterCardType === opt.id
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
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Default Twitter/X Username Account Handle</label>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  placeholder="@jrphotography"
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "archives" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Archives Indexation Safeguards</h4>
              <p className="text-luxury-cream/40 text-xs">Guard against duplicate content indexing errors. Control indexing rules on searches, dates, and author feeds.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Enable Author Feeds & Archives</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">Keeps author pages active (usually disabled for single-author sites to avoid duplicate pages).</p>
                </div>
                <button
                  onClick={() => setEnableAuthorArchives(!enableAuthorArchives)}
                  className={`w-12 shrink-0 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                    enableAuthorArchives ? "bg-[#cfb53b]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                    enableAuthorArchives ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {enableAuthorArchives && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-950/20 border border-white/5 rounded-2xl">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Author Page Prefix URL Base</label>
                    <input
                      type="text"
                      value={authorPrefix}
                      onChange={(e) => setAuthorPrefix(e.target.value)}
                      placeholder="author"
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Author Archives Index Status</label>
                    <select
                      value={authorIndex}
                      onChange={(e) => setAuthorIndex(e.target.value as any)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    >
                      <option value="index">INDEX (Crawler Allowed)</option>
                      <option value="noindex">NOINDEX (Block Crawler)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Date-based Archives Index Directive</label>
                  <select
                    value={dateIndex}
                    onChange={(e) => setDateIndex(e.target.value as any)}
                    className="w-full bg-[#050408] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  >
                    <option value="index">INDEX (Index Date URLs)</option>
                    <option value="noindex">NOINDEX (Hide Date URLs - Recommended)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Internal Search Result Pages Status</label>
                  <select
                    value={searchIndex}
                    onChange={(e) => setSearchIndex(e.target.value as any)}
                    className="w-full bg-[#050408] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  >
                    <option value="index">INDEX (Allow Index of search queries)</option>
                    <option value="noindex">NOINDEX (Block search queries Index - Recommended)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "post_types" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Default XML Title & Description Templates</h4>
              <p className="text-luxury-cream/40 text-xs">Establish the automatic format rules for generating search tags whenever new blog or portfolio pages are published.</p>
            </div>

            <div className="space-y-6 pt-4 border-t border-white/5">
              <div className="space-y-4">
                <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b]">Blog Post Defaults</h5>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Title Template</label>
                    <input
                      type="text"
                      value={postTitleTemplate}
                      onChange={(e) => setPostTitleTemplate(e.target.value)}
                      className="w-full bg-[#050408] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Meta Description Template</label>
                    <textarea
                      value={postDescTemplate}
                      onChange={(e) => setPostDescTemplate(e.target.value)}
                      rows={2}
                      className="w-full bg-[#050408] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#cfb53b]/40 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b]">Portfolio Work Defaults</h5>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Title Template</label>
                    <input
                      type="text"
                      value={portfolioTitleTemplate}
                      onChange={(e) => setPortfolioTitleTemplate(e.target.value)}
                      className="w-full bg-[#050408] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Meta Description Template</label>
                    <textarea
                      value={portfolioDescTemplate}
                      onChange={(e) => setPortfolioDescTemplate(e.target.value)}
                      rows={2}
                      className="w-full bg-[#050408] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#cfb53b]/40 leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b]">Studio Services Defaults</h5>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Title Template</label>
                    <input
                      type="text"
                      value={serviceTitleTemplate}
                      onChange={(e) => setServiceTitleTemplate(e.target.value)}
                      className="w-full bg-[#050408] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Meta Description Template</label>
                    <textarea
                      value={serviceDescTemplate}
                      onChange={(e) => setServiceDescTemplate(e.target.value)}
                      rows={2}
                      className="w-full bg-[#050408] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#cfb53b]/40 leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6 animate-pulse"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Title & Meta Configurations</span>
        </button>

      </div>
    </div>
  );
}
