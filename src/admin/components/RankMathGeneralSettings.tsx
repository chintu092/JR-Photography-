import React, { useState, useEffect } from "react";
import { 
  Save, Loader2, Link2, ImageIcon, Globe, FileText, ChevronRight, HelpCircle, AlertCircle
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useToast } from "../../context/ToastContext";

export default function RankMathGeneralSettings() {
  const toast = useToast();
  const [activeSubSection, setActiveSubSection] = useState<"links" | "images" | "breadcrumbs" | "webmaster" | "robots" | "htaccess">("links");
  const [loading, setLoading] = useState(false);

  // General Settings States
  const [stripCategory, setStripCategory] = useState(true);
  const [redirectAttachments, setRedirectAttachments] = useState(true);
  const [nofollowExternal, setNofollowExternal] = useState(false);
  const [nofollowImages, setNofollowImages] = useState(false);
  const [openExternalNewTab, setOpenExternalNewTab] = useState(true);

  // Images states
  const [addAltAttributes, setAddAltAttributes] = useState(true);
  const [altFormat, setAltFormat] = useState("%title% %filename%");
  const [addTitleAttributes, setAddTitleAttributes] = useState(false);
  const [titleFormat, setTitleFormat] = useState("%title% photoshoot");

  // Breadcrumbs states
  const [enableBreadcrumbs, setEnableBreadcrumbs] = useState(true);
  const [breadcrumbsSeparator, setBreadcrumbsSeparator] = useState("»");
  const [showHomeLink, setShowHomeLink] = useState(true);
  const [homeLabel, setHomeLabel] = useState("Home");
  const [breadcrumbPrefix, setBreadcrumbPrefix] = useState("You are here:");

  // Webmaster tools states
  const [googleKey, setGoogleKey] = useState("");
  const [bingKey, setBingKey] = useState("");
  const [baiduKey, setBaiduKey] = useState("");
  const [yandexKey, setYandexKey] = useState("");
  const [pinterestKey, setPinterestKey] = useState("");

  // robots.txt & .htaccess states
  const [robotsTxt, setRobotsTxt] = useState(
    "User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php\n\nSitemap: https://jrphotography.com/sitemap.xml"
  );
  const [htaccess, setHtaccess] = useState(
    "# Block directory browsing\nOptions -Indexes\n\n# Secure headers\nHeader set X-XSS-Protection \"1; mode=block\"\nHeader set X-Content-Type-Options \"nosniff\"\nHeader set X-Frame-Options \"SAMEORIGIN\""
  );

  useEffect(() => {
    async function loadGeneralSettings() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "seo_general"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStripCategory(data.stripCategory !== false);
          setRedirectAttachments(data.redirectAttachments !== false);
          setNofollowExternal(!!data.nofollowExternal);
          setNofollowImages(!!data.nofollowImages);
          setOpenExternalNewTab(data.openExternalNewTab !== false);

          setAddAltAttributes(data.addAltAttributes !== false);
          setAltFormat(data.altFormat || "%title% %filename%");
          setAddTitleAttributes(!!data.addTitleAttributes);
          setTitleFormat(data.titleFormat || "%title% photoshoot");

          setEnableBreadcrumbs(data.enableBreadcrumbs !== false);
          setBreadcrumbsSeparator(data.breadcrumbsSeparator || "»");
          setShowHomeLink(data.showHomeLink !== false);
          setHomeLabel(data.homeLabel || "Home");
          setBreadcrumbPrefix(data.breadcrumbPrefix || "You are here:");

          setGoogleKey(data.googleKey || "");
          setBingKey(data.bingKey || "");
          setBaiduKey(data.baiduKey || "");
          setYandexKey(data.yandexKey || "");
          setPinterestKey(data.pinterestKey || "");

          if (data.robotsTxt) setRobotsTxt(data.robotsTxt);
          if (data.htaccess) setHtaccess(data.htaccess);
        }
      } catch (error) {
        console.error("Failed to load general settings:", error);
      }
    }
    loadGeneralSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "seo_general"), {
        stripCategory,
        redirectAttachments,
        nofollowExternal,
        nofollowImages,
        openExternalNewTab,
        addAltAttributes,
        altFormat,
        addTitleAttributes,
        titleFormat,
        enableBreadcrumbs,
        breadcrumbsSeparator,
        showHomeLink,
        homeLabel,
        breadcrumbPrefix,
        googleKey,
        bingKey,
        baiduKey,
        yandexKey,
        pinterestKey,
        robotsTxt,
        htaccess,
      }, { merge: true });
      toast.success("Rank Math General Settings stored securely!");
    } catch (e: any) {
      toast.error(`Error saving settings: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-500">
      
      {/* Sub tabs list side rail */}
      <div className="lg:col-span-3 space-y-1 bg-[#0a0a10]/40 border border-white/5 p-3 rounded-2xl h-fit">
        {[
          { id: "links", label: "Links Options", icon: Link2 },
          { id: "images", label: "Images SEO", icon: ImageIcon },
          { id: "breadcrumbs", label: "Breadcrumbs", icon: ChevronRight },
          { id: "webmaster", label: "Webmaster Keys", icon: Globe },
          { id: "robots", label: "Edit robots.txt", icon: FileText },
          { id: "htaccess", label: "Edit .htaccess", icon: FileText },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubSection(item.id as any)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSubSection === item.id
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
        
        {activeSubSection === "links" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">General Links Settings</h4>
              <p className="text-luxury-cream/40 text-xs">Configure redirects, link attribute additions, and default browser behaviours for post URLs and assets.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {[
                {
                  state: stripCategory,
                  setter: setStripCategory,
                  title: "Strip Category Base",
                  desc: "Automatically remove slug category names from core URLs (e.g. /category/lookbook to /lookbook)."
                },
                {
                  state: redirectAttachments,
                  setter: setRedirectAttachments,
                  title: "Redirect Attachment Parent URIs",
                  desc: "Instantly redirect media attachment links directly back to the matching parent portfolio/blog work."
                },
                {
                  state: nofollowExternal,
                  setter: setNofollowExternal,
                  title: "Nofollow External Links",
                  desc: "Add rel=\"nofollow\" attributes to outgoing external resource links on the fly."
                },
                {
                  state: nofollowImages,
                  setter: setNofollowImages,
                  title: "Nofollow Image File Links",
                  desc: "Inject rel=\"nofollow\" on raw image resource wrappers to prevent PageRank leak."
                },
                {
                  state: openExternalNewTab,
                  setter: setOpenExternalNewTab,
                  title: "Open External in New Tab",
                  desc: "Auto-add target=\"_blank\" parameter triggers on external domain hyper-link targets."
                }
              ].map((opt, index) => (
                <div key={index} className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{opt.title}</p>
                    <p className="text-[10px] text-zinc-500 leading-tight">{opt.desc}</p>
                  </div>
                  <button
                    onClick={() => opt.setter(!opt.state)}
                    className={`w-12 shrink-0 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                      opt.state ? "bg-[#cfb53b]" : "bg-zinc-800"
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                      opt.state ? "translate-x-6" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubSection === "images" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Advanced Images SEO Optimizer</h4>
              <p className="text-luxury-cream/40 text-xs">Avoid manual labeling. Automatically fill blank ALT and TITLE metadata elements dynamically with customized rules.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Add Missing ALT Attributes</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">Intercept raw HTML tags to append customized alt parameters whenever empty.</p>
                </div>
                <button
                  onClick={() => setAddAltAttributes(!addAltAttributes)}
                  className={`w-12 shrink-0 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                    addAltAttributes ? "bg-[#cfb53b]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                    addAltAttributes ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {addAltAttributes && (
                <div className="space-y-2 p-4 bg-zinc-950/20 border border-white/5 rounded-2xl">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">ALT Attribute Text Format Template</label>
                  <input
                    type="text"
                    value={altFormat}
                    onChange={(e) => setAltFormat(e.target.value)}
                    placeholder="%title% %filename%"
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                  />
                  <p className="text-[9px] text-zinc-500">Variables list: <span className="text-[#cfb53b]">%title%</span>, <span className="text-[#cfb53b]">%filename%</span>, <span className="text-[#cfb53b]">%sitename%</span>, <span className="text-[#cfb53b]">%category%</span></p>
                </div>
              )}

              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Add Missing TITLE Attributes</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">Automatically add hover tool-tip title tags onto loaded graphic assets.</p>
                </div>
                <button
                  onClick={() => setAddTitleAttributes(!addTitleAttributes)}
                  className={`w-12 shrink-0 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                    addTitleAttributes ? "bg-[#cfb53b]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                    addTitleAttributes ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {addTitleAttributes && (
                <div className="space-y-2 p-4 bg-zinc-950/20 border border-white/5 rounded-2xl">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">TITLE Attribute Text Format Template</label>
                  <input
                    type="text"
                    value={titleFormat}
                    onChange={(e) => setTitleFormat(e.target.value)}
                    placeholder="%title% lookbook"
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                  />
                  <p className="text-[9px] text-zinc-500">Uses same dynamic token keywords replacement parser.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubSection === "breadcrumbs" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Structured Breadcrumb Links</h4>
              <p className="text-luxury-cream/40 text-xs">Help web crawlers map categories and display elegant navigation steps inside organic Google search results.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Enable Breadcrumbs Engine</p>
                  <p className="text-[10px] text-zinc-500 leading-tight">Generates matching schema hierarchies and renders breadcrumbs trails on nested subpages.</p>
                </div>
                <button
                  onClick={() => setEnableBreadcrumbs(!enableBreadcrumbs)}
                  className={`w-12 shrink-0 h-6 flex items-center rounded-full p-1 transition-all cursor-pointer ${
                    enableBreadcrumbs ? "bg-[#cfb53b]" : "bg-zinc-800"
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                    enableBreadcrumbs ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>

              {enableBreadcrumbs && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Separator Symbol</label>
                    <input
                      type="text"
                      value={breadcrumbsSeparator}
                      onChange={(e) => setBreadcrumbsSeparator(e.target.value)}
                      placeholder="»"
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Homepage Label</label>
                    <input
                      type="text"
                      value={homeLabel}
                      onChange={(e) => setHomeLabel(e.target.value)}
                      placeholder="Home"
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Breadcrumb Trail Prefix</label>
                    <input
                      type="text"
                      value={breadcrumbPrefix}
                      onChange={(e) => setBreadcrumbPrefix(e.target.value)}
                      placeholder="You are here:"
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubSection === "webmaster" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Search Engine Webmaster Verification</h4>
              <p className="text-luxury-cream/40 text-xs">Verify your fine art photography studio ownership keys directly within major world indexing systems.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {[
                { label: "Google Search Console Key", val: googleKey, setter: setGoogleKey, ph: "google-site-verification=32-char-key" },
                { label: "Bing Webmaster Center Key", val: bingKey, setter: setBingKey, ph: "32-digit hexadecimal code" },
                { label: "Baidu Index Tool Token", val: baiduKey, setter: setBaiduKey, ph: "token code string" },
                { label: "Yandex Web Verification Id", val: yandexKey, setter: setYandexKey, ph: "yandex-verification-id" },
                { label: "Pinterest Account Token", val: pinterestKey, setter: setPinterestKey, ph: "pinterest-app-secret-string" }
              ].map((inp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">{inp.label}</label>
                  <input
                    type="text"
                    value={inp.val}
                    onChange={(e) => inp.setter(e.target.value)}
                    placeholder={inp.ph}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubSection === "robots" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Direct Edit robots.txt Rules</h4>
              <p className="text-luxury-cream/40 text-xs">Instruct spider bots where and how to search your server resources. Set directories limits on the fly.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <textarea
                value={robotsTxt}
                onChange={(e) => setRobotsTxt(e.target.value)}
                rows={8}
                className="w-full bg-[#050408] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#cfb53b]/40 leading-relaxed"
              />
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-2 text-[10px] text-yellow-500 leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Caution: Editing robots.txt limits can block or break how search crawlers parse your collections. Test changes.</span>
              </div>
            </div>
          </div>
        )}

        {activeSubSection === "htaccess" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="font-serif text-lg text-white">Direct Edit .htaccess Configurations</h4>
              <p className="text-luxury-cream/40 text-xs">Establish server rewrite directives, secure security headers and direct permanent redirects codes manually.</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <textarea
                value={htaccess}
                onChange={(e) => setHtaccess(e.target.value)}
                rows={8}
                className="w-full bg-[#050408] border border-white/10 rounded-xl p-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#cfb53b]/40 leading-relaxed"
              />
              <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-2 text-[10px] text-red-400 leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Warning: Corrupt syntax directives in .htaccess can trigger standard server 500 Internals error. Modify cautiously.</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Configuration Options</span>
        </button>

      </div>
    </div>
  );
}
