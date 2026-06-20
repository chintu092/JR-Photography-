import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { 
  doc, getDoc, getDocs, setDoc, collection, onSnapshot, 
  serverTimestamp, writeBatch 
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, Save, Loader2, Link as LinkIcon, FileText, ImageIcon, 
  ChevronDown, AlertTriangle, CheckCircle, BarChart3, AlertCircle, 
  Sparkles, Download, CheckSquare, Search, EyeOff, LayoutGrid, Eye, HelpCircle
} from "lucide-react";
import { WORK_ITEMS, BLOG_POSTS } from "../../data";
import ImagePreviewInput from "./ImagePreviewInput";
import SEOAssistantPanel from "./SEOAssistantPanel";
import { SEOSettings as SEOSettingsType } from "../../types";

const STATIC_PAGES = [
  { id: "global", label: "Global Settings", path: "/" },
  { id: "home", label: "Home Page", path: "/" },
  { id: "about", label: "About Page", path: "/about" },
  { id: "services", label: "Services Page", path: "/services" },
  { id: "works", label: "Portfolio Page", path: "/works" },
  { id: "blog", label: "Blog Page", path: "/blog" },
  { id: "contact", label: "Contact Page", path: "/contact" },
];

export default function SEOSettings() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "optimizer">("dashboard");
  const [selectedPage, setSelectedPage] = useState("global");
  
  // Inventory of all pages (static + dynamic)
  const [pagesInventory, setPagesInventory] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  
  // Page Optimizer fields State
  const [pageTitle, setPageTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  
  // Global Fields State
  const [siteName, setSiteName] = useState("");
  const [defaultTitle, setDefaultTitle] = useState("");
  const [titleTemplate, setTitleTemplate] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats Counters
  const [stats, setStats] = useState({
    total: 0,
    missingTitle: 0,
    missingDesc: 0,
    missingOG: 0,
    noIndexCount: 0,
    duplicateTitles: 0,
    duplicateDescriptions: 0,
  });

  // Dynamic Content source tracking
  const [works, setWorks] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  // 1. Live Fetch blog and portfolio context to build complete routing table
  useEffect(() => {
    const unsubPortfolio = onSnapshot(collection(db, "portfolio"), (snap) => {
      const dbWorks = snap.empty ? [] : snap.docs.map(d => ({
        id: `works-detail-${d.id}`,
        dbId: d.id,
        label: `Work: ${d.data().title || "Untitled Work"}`,
        rawTitle: d.data().title || "",
        rawDesc: d.data().description || "",
        rawImage: d.data().image || "",
        imageAlt: d.data().imageAlt || "",
        collection: "portfolio"
      }));
      setWorks(dbWorks);
    });

    const unsubBlog = onSnapshot(collection(db, "blog"), (snap) => {
      const dbBlogs = snap.empty ? [] : snap.docs.map(d => ({
        id: `blog-detail-${d.id}`,
        dbId: d.id,
        label: `Blog: ${d.data().title || "Untitled Post"}`,
        rawTitle: d.data().title || "",
        rawDesc: d.data().summary || "",
        rawImage: d.data().coverImage || "",
        imageAlt: d.data().imageAlt || "",
        collection: "blog"
      }));
      setBlogs(dbBlogs);
    });

    return () => {
      unsubPortfolio();
      unsubBlog();
    };
  }, []);

  // 2. Compute full SEO registry audit across all dynamic and static pages
  useEffect(() => {
    async function auditSystem() {
      setLoadingInventory(true);
      try {
        // Fetch all specific SEO entries in subcollection settings/seo/pages/*
        const pageDocsSnap = await getDocs(collection(db, "settings", "seo", "pages"));
        const seoMap = new Map<string, any>();
        pageDocsSnap.forEach(d => {
          seoMap.set(d.id, d.data());
        });

        const rootSeoDoc = await getDoc(doc(db, "settings", "seo"));
        const rootSeo = rootSeoDoc.exists() ? rootSeoDoc.data() : {};

        // Merge all static entries
        const fullAuditList: any[] = [];
        
        // Populate static pages
        STATIC_PAGES.forEach(pg => {
          const custom = seoMap.get(pg.id) || {};
          const isGlobal = pg.id === "global";
          
          const aud: any = {
            id: pg.id,
            label: pg.label,
            path: pg.path,
            isStatic: true,
            title: isGlobal ? (rootSeo.defaultTitle || pg.label) : (custom.title || pg.label),
            description: isGlobal ? (rootSeo.defaultDescription || "") : (custom.description || ""),
            ogImage: isGlobal ? (rootSeo.defaultOgImage || "") : (custom.ogImageUrl || ""),
            noIndex: !!custom.noIndex,
            focusKeyword: custom.focusKeyword || "",
            imageAlt: "Standard brand asset",
            issues: []
          };
          fullAuditList.push(aud);
        });

        // Add dynamic portfolio
        works.forEach(wi => {
          const custom = seoMap.get(wi.id) || {};
          const aud: any = {
            id: wi.id,
            dbId: wi.dbId,
            label: wi.label,
            path: `/works/${wi.dbId}`,
            isStatic: false,
            collection: "portfolio",
            title: custom.title || wi.rawTitle,
            description: custom.description || wi.rawDesc,
            ogImage: custom.ogImageUrl || wi.rawImage,
            noIndex: !!custom.noIndex,
            focusKeyword: custom.focusKeyword || "",
            imageAlt: wi.imageAlt || "",
            issues: []
          };
          fullAuditList.push(aud);
        });

        // Add dynamic blogs
        blogs.forEach(bl => {
          const custom = seoMap.get(bl.id) || {};
          const aud: any = {
            id: bl.id,
            dbId: bl.dbId,
            label: bl.label,
            path: `/blog/${bl.dbId}`,
            isStatic: false,
            collection: "blog",
            title: custom.title || bl.rawTitle,
            description: custom.description || bl.rawDesc,
            ogImage: custom.ogImageUrl || bl.rawImage,
            noIndex: !!custom.noIndex,
            focusKeyword: custom.focusKeyword || "",
            imageAlt: bl.imageAlt || "",
            issues: []
          };
          fullAuditList.push(aud);
        });

        // Compute diagnostics & issues
        let missingTitles = 0;
        let missingDescs = 0;
        let missingOGs = 0;
        let noIndices = 0;

        const titleCounts = new Map<string, number>();
        const descCounts = new Map<string, number>();

        fullAuditList.forEach(item => {
          if (item.id === "global") return; // skip global layout doc from standard counts
          
          if (!item.title || item.title.trim() === "" || item.title === "Untitled Item") {
            item.issues.push("Missing SEO Title");
            missingTitles++;
          } else {
            const cleanT = item.title.toLowerCase().trim();
            titleCounts.set(cleanT, (titleCounts.get(cleanT) || 0) + 1);
          }

          if (!item.description || item.description.trim() === "") {
            item.issues.push("Missing Meta Description");
            missingDescs++;
          } else {
            const cleanD = item.description.toLowerCase().trim();
            descCounts.set(cleanD, (descCounts.get(cleanD) || 0) + 1);
          }

          if (!item.ogImage || item.ogImage.trim() === "") {
            item.issues.push("Missing OG Share Image");
            missingOGs++;
          }

          if (item.noIndex) {
            noIndices++;
          }
        });

        // Re-examine items to flag duplicates
        let dupTitles = 0;
        let dupDescs = 0;

        fullAuditList.forEach(item => {
          if (item.id === "global") return;
          
          if (item.title) {
            const cleanT = item.title.toLowerCase().trim();
            if ((titleCounts.get(cleanT) || 0) > 1) {
              item.issues.push("Duplicate Page Title");
              dupTitles++;
            }
          }

          if (item.description) {
            const cleanD = item.description.toLowerCase().trim();
            if ((descCounts.get(cleanD) || 0) > 1) {
              item.issues.push("Duplicate Meta Description");
              dupDescs++;
            }
          }
        });

        setPagesInventory(fullAuditList);
        setStats({
          total: fullAuditList.length - 1, // minus global configuration
          missingTitle: missingTitles,
          missingDesc: missingDescs,
          missingOG: missingOGs,
          noIndexCount: noIndices,
          duplicateTitles: Math.round(dupTitles / 2), // paired groupings
          duplicateDescriptions: Math.round(dupDescs / 2)
        });

      } catch (error) {
        console.error("Failed to compile complete SEO audit reports:", error);
      } finally {
        setLoadingInventory(false);
      }
    }

    auditSystem();
  }, [works, blogs, saving]);

  // 3. Load input fields on selecting target page optimizer
  useEffect(() => {
    async function fetchSEO() {
      if (!isAdmin) return;
      setLoadingPage(true);
      try {
        const docPath = selectedPage === "global" 
          ? doc(db, "settings", "seo") 
          : doc(db, "settings", "seo", "pages", selectedPage);
        
        const seoDoc = await getDoc(docPath);
        if (seoDoc.exists()) {
          const data = seoDoc.data();
          setDescription(data.description || data.defaultDescription || "");
          setCanonicalUrl(data.canonicalUrl || "");
          setOgImageUrl(data.ogImageUrl || data.defaultOgImage || "");
          setFocusKeyword(data.focusKeyword || "");
          setNoIndex(!!data.noIndex);
          setCustomSlug(data.slug || "");
          
          if (selectedPage === "global") {
            setSiteName(data.siteName || "");
            setDefaultTitle(data.defaultTitle || "");
            setTitleTemplate(data.titleTemplate || "");
            setTwitterHandle(data.twitterHandle || "");
          } else {
            setPageTitle(data.title || "");
          }
        } else {
          // Clear form to clean draft defaults
          setDescription("");
          setCanonicalUrl("");
          setOgImageUrl("");
          setFocusKeyword("");
          setNoIndex(false);
          setCustomSlug("");
          setSiteName("");
          setDefaultTitle("");
          setTitleTemplate("");
          setTwitterHandle("");
          setPageTitle("");
        }
      } catch (error) {
        console.error("Error fetching page specific SEO coordinates:", error);
      } finally {
        setLoadingPage(false);
      }
    }
    fetchSEO();
  }, [isAdmin, selectedPage]);

  // 4. Manual saving of audited page SEO configurations
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const docPath = selectedPage === "global" 
        ? doc(db, "settings", "seo") 
        : doc(db, "settings", "seo", "pages", selectedPage);

      const data: any = {
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };

      if (selectedPage === "global") {
        data.siteName = siteName;
        data.defaultTitle = defaultTitle;
        data.titleTemplate = titleTemplate;
        data.defaultDescription = description;
        data.canonicalUrl = canonicalUrl;
        data.defaultOgImage = ogImageUrl;
        data.twitterHandle = twitterHandle;
      } else {
        data.title = pageTitle;
        data.description = description;
        data.focusKeyword = focusKeyword;
        data.canonicalUrl = canonicalUrl;
        data.ogImageUrl = ogImageUrl;
        data.noIndex = noIndex;
        data.slug = customSlug;
      }

      await setDoc(docPath, data, { merge: true });
      setMessage({ type: "success", text: "SEO coordinates synchronized and written!" });
      toast.success("SEO configurations saved and updated successfully!");
      setTimeout(() => setMessage(null), 3500);
    } catch (error: any) {
      console.error("Failed to push custom SEO record:", error);
      setMessage({ type: "error", text: "Failed to apply SEO metadata details." });
      toast.error(`Failed to save SEO configurations: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  // 5. BULK GENERATION heuristic action
  const handleBulkGenerate = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const batch = writeBatch(db);
      let correctedCounts = 0;

      for (const item of pagesInventory) {
        if (item.id === "global") continue;
        const currentHasNoTitle = !item.title || item.title === "Untitled Item";
        const currentHasNoDesc = !item.description || item.description === "";

        if (currentHasNoTitle || currentHasNoDesc) {
          const loc = "Kolkata";
          const dRef = doc(db, "settings", "seo", "pages", item.id);
          
          const cleanName = item.label.replace("Blog: ", "").replace("Work: ", "");
          const cleanTitle = currentHasNoTitle 
            ? `${cleanName} | Luxury Editorial Photographer ${loc}` 
            : item.title;
          
          const cleanDesc = currentHasNoDesc 
            ? `${cleanName}. Experience professional candid framing, rich contrast wedding compositions, and modern pre-shoot art directions based in ${loc}.` 
            : item.description;

          batch.set(dRef, {
            title: cleanTitle,
            description: cleanDesc,
            focusKeyword: item.focusKeyword || cleanName.split(" ")[0] || "Photographer",
            slug: item.id,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid,
          }, { merge: true });

          correctedCounts++;
        }
      }

      if (correctedCounts > 0) {
        await batch.commit();
        setMessage({ type: "success", text: `Bulk optimizer run complete! Enhanced elements for ${correctedCounts} layouts.` });
        toast.success(`Bulk optimizer run complete! Enhanced elements for ${correctedCounts} layouts.`);
      } else {
        setMessage({ type: "success", text: "All views are fully pre-filled under current metrics. No bulk generation needed!" });
        toast.success("All views are fully pre-filled under current metrics.");
      }
    } catch (err: any) {
      console.error("Bulk optimization error:", err);
      setMessage({ type: "error", text: "Failures occurred rewriting bulk records." });
      toast.error(`Failures occurred while rewriting bulk SEO records: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  // 6. CSV Export of site metadata
  const handleExportReport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Page/Post,Target Path,SEO Title,Meta Description,Focus Keyword,No Index,Indexed Issues\n";

      pagesInventory.forEach(item => {
        const titleStr = `"${(item.title || "").replace(/"/g, '""')}"`;
        const descStr = `"${(item.description || "").replace(/"/g, '""')}"`;
        const issueStr = `"${item.issues.join(", ")}"`;
        const row = `${item.label},${item.path || "/"},${titleStr},${descStr},${item.focusKeyword || "none"},${item.noIndex ? "TRUE" : "FALSE"},${issueStr}\n`;
        csvContent += row;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `seo_site_audit_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Exporting report failed:", e);
    }
  };

  return (
    <section className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Upper header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2 text-left">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">SEO optimization</h2>
          <p className="text-luxury-cream/40 text-sm">Fine-tune spatial visibility, discoverability parameters, and local Google index status across your studio pages.</p>
        </div>

        {/* Dashboard Sub-tab controller */}
        <div className="flex bg-[#0a0a10] border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "dashboard"
                ? "bg-luxury-gold/20 text-[#cfb53b] border border-luxury-gold/15"
                : "text-luxury-cream/40 hover:text-white"
            }`}
          >
            SEO Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab("optimizer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeSubTab === "optimizer"
                ? "bg-luxury-gold/20 text-[#cfb53b] border border-luxury-gold/15"
                : "text-luxury-cream/40 hover:text-white"
            }`}
          >
            Page SEO Editor
          </button>
        </div>
      </div>

      {activeSubTab === "dashboard" ? (
        /* SEO DASHBOARD METRICS */
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Diagnostic Info Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Pages",
                value: stats.total,
                desc: "Active page index elements",
                color: "text-white"
              },
              {
                label: "Missing SEO Title",
                value: stats.missingTitle,
                desc: "High risk of search listing skip",
                color: stats.missingTitle > 0 ? "text-red-400" : "text-[#cfb53b]/40"
              },
              {
                label: "Missing Descriptions",
                value: stats.missingDesc,
                desc: "Generates generic Google fallback text",
                color: stats.missingDesc > 0 ? "text-amber-400" : "text-[#cfb53b]/40"
              },
              {
                label: "Marked No Index",
                value: stats.noIndexCount,
                desc: "Visible ONLY through shared direct links",
                color: "text-zinc-500"
              }
            ].map((st, i) => (
              <div key={i} className="bg-luxury-black/40 border border-white/5 rounded-2xl p-4 sm:p-6 text-left space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-[#cfb53b] font-bold">{st.label}</span>
                <p className={`text-3xl font-extrabold ${st.color}`}>{st.value}</p>
                <p className="text-[10px] text-zinc-500 leading-tight">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-luxury-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 text-left flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Unassigned OG Images</span>
                <p className="text-xl font-extrabold text-amber-500 mt-1">{stats.missingOG}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-white/5" />
            </div>

            <div className="bg-luxury-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 text-left flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Duplicate Titles</span>
                <p className="text-xl font-extrabold text-amber-500 mt-1">{stats.duplicateTitles}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-white/5" />
            </div>

            <div className="bg-luxury-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 text-left flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Duplicate Descriptions</span>
                <p className="text-xl font-extrabold text-amber-500 mt-1">{stats.duplicateDescriptions}</p>
              </div>
              <FileText className="w-8 h-8 text-white/5" />
            </div>
          </div>

          {/* Quick Actions Console */}
          <div className="bg-luxury-black/40 border border-luxury-gold/10 p-6 rounded-3xl text-left space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-luxury-gold">Diagnostic Quick Actions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleBulkGenerate}
                disabled={saving}
                className="p-4 bg-white/[0.02] hover:bg-[#cfb53b]/10 hover:border-[#cfb53b]/30 border border-white/5 rounded-2xl text-left cursor-pointer transition-all space-y-2 group"
              >
                <Sparkles className="w-6 h-6 text-[#cfb53b]" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#cfb53b] transition-colors">Bulk Generate Metadata</p>
                  <p className="text-[10px] text-zinc-500">Heuristically auto-populates all layouts currently lacking SEO titles or description copy.</p>
                </div>
              </button>

              <button
                onClick={() => {
                  // Preconfigure selected item from list with issues and redirect
                  const candidate = pagesInventory.find(p => p.issues.length > 0 && p.id !== "global");
                  if (candidate) {
                    setSelectedPage(candidate.id);
                  } else {
                    setSelectedPage("home");
                  }
                  setActiveSubTab("optimizer");
                }}
                className="p-4 bg-white/[0.02] hover:bg-[#cfb53b]/10 hover:border-[#cfb53b]/30 border border-white/5 rounded-2xl text-left cursor-pointer transition-all space-y-2 group"
              >
                <CheckSquare className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors">Fix SEO Issues</p>
                  <p className="text-[10px] text-zinc-500">Filters page optimizer directly targeting elements throwing unresolved tracking errors.</p>
                </div>
              </button>

              <button
                onClick={handleExportReport}
                className="p-4 bg-white/[0.02] hover:bg-[#cfb53b]/10 hover:border-[#cfb53b]/30 border border-white/5 rounded-2xl text-left cursor-pointer transition-all space-y-2 group"
              >
                <Download className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-blue-400 transition-colors">Export SEO Report (CSV)</p>
                  <p className="text-[10px] text-zinc-500">Generates and triggers download of raw CSV log files reporting all metadata audits.</p>
                </div>
              </button>
            </div>
            
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl text-center text-[10px] uppercase tracking-widest font-mono mt-4 ${
                  message.type === "success" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </div>

          {/* Master Audited Pages Registry List */}
          <div className="bg-luxury-black/45 border border-white/5 rounded-3xl overflow-hidden">
            <div className="border-b border-white/5 bg-[#0a0a10] px-6 py-4 flex justify-between items-center text-left">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Active Audited Registry</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Tracking health indicators and content parameters across all sections of your application.</p>
              </div>
            </div>

            {loadingInventory ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#cfb53b]" />
              </div>
            ) : (
              <div className="divide-y divide-white/5 text-left">
                {pagesInventory.map(item => {
                  const hasIssues = item.issues.length > 0;
                  return (
                    <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{item.label}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                            item.isStatic ? "bg-zinc-800 text-zinc-400" : "bg-luxury-gold/10 text-[#cfb53b]"
                          }`}>
                            {item.isStatic ? "static" : "creative catalog"}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-tight">{item.path}</p>
                        <p className="text-xs text-zinc-400 font-sans truncate pr-10">
                          {item.id === "global" ? "Shared header & fallback indexing presets for JR Photography." : (item.description || "No descriptions established. Crawlers will map visual strings default.")}
                        </p>
                        
                        {/* Issues checklist alerts */}
                        {hasIssues && item.id !== "global" && (
                          <div className="flex gap-2 flex-wrap pt-1">
                            {item.issues.map((iss: string, idx: number) => (
                              <span key={idx} className="text-[9px] text-amber-400/90 bg-amber-400/5 px-2 py-1 rounded-md border border-amber-400/10 flex items-center gap-1 font-mono uppercase">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>{iss}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Optimizer Routing Link */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {item.noIndex ? (
                          <span className="text-[9px] uppercase bg-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5 font-bold">
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>noindex</span>
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase bg-emerald-500/5 text-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-500/10 flex items-center gap-1.5 font-bold">
                            <Eye className="w-3.5 h-3.5" />
                            <span>indexed</span>
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setSelectedPage(item.id);
                            setActiveSubTab("optimizer");
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-[#cfb53b] text-white hover:text-black font-semibold rounded-xl text-[10px] uppercase tracking-wider transition-all border border-white/10 hover:border-transparent cursor-pointer"
                        >
                          Configure SEO
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* PAGE SEO OPTIMIZER SIDEBAR GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-500">
          
          {/* LEFT Form Area */}
          <div className="lg:col-span-6 bg-luxury-black/40 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* PAGE SELECTOR DROPDOWN */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#cfb53b] font-bold">
                  <Globe className="w-4 h-4 text-[#cfb53b]" />
                  SELECT TARGET CONTEXT
                </label>
                <div className="relative group">
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-5 py-4 text-xs font-semibold text-white appearance-none focus:outline-none focus:border-[#cfb53b]/60 transition-all cursor-pointer"
                  >
                    <optgroup label="Shared Global Setup" className="bg-zinc-950">
                      <option value="global">Global Shared Blueprint</option>
                    </optgroup>
                    <optgroup label="Core Pages" className="bg-zinc-950">
                      {STATIC_PAGES.filter(p => p.id !== "global").map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Creative Projects" className="bg-zinc-950">
                      {works.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Editorials & Blogs" className="bg-zinc-950">
                      {blogs.map((page) => (
                        <option key={page.id} value={page.id}>
                          {page.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:text-[#cfb53b]" />
                </div>
              </div>

              {loadingPage ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#cfb53b]" />
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {selectedPage === "global" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Website Base Brand Name</label>
                        <input
                          type="text"
                          value={siteName}
                          onChange={(e) => setSiteName(e.target.value)}
                          placeholder="JR Photography"
                          className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white uppercase tracking-widest focus:outline-none focus:border-[#cfb53b]/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Twitter Author Tag</label>
                        <input
                          type="text"
                          value={twitterHandle}
                          onChange={(e) => setTwitterHandle(e.target.value)}
                          placeholder="@jrphotography_kol"
                          className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Base Title Suffix</label>
                        <input
                          type="text"
                          value={defaultTitle}
                          onChange={(e) => setDefaultTitle(e.target.value)}
                          placeholder="Fine Art Editorial Photographer"
                          className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Page Title Template Format</label>
                        <input
                          type="text"
                          value={titleTemplate}
                          onChange={(e) => setTitleTemplate(e.target.value)}
                          placeholder="%s | JR Photography Kolkata"
                          className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4 border-b border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Page Specific Custom Title</label>
                        <input
                          type="text"
                          value={pageTitle}
                          onChange={(e) => setPageTitle(e.target.value)}
                          placeholder="My Beautiful Portfolio Case Story"
                          className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                        />
                      </div>

                      {/* URL Slug rewrite */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Custom URL Slug Path</label>
                          <input
                            type="text"
                            value={customSlug}
                            onChange={(e) => setCustomSlug(e.target.value)}
                            placeholder="my-beautiful-portfolio-story"
                            className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Target Focus Keyword</label>
                          <input
                            type="text"
                            value={focusKeyword}
                            onChange={(e) => setFocusKeyword(e.target.value)}
                            placeholder="Kolkata Wedding Photographer"
                            className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#cfb53b] font-bold">
                        <FileText className="w-4 h-4 text-[#cfb53b]" />
                        META DESCRIPTION SUMMARY
                      </label>
                      <span className={`text-[10px] font-mono ${
                        description.length >= 140 && description.length <= 160 ? "text-emerald-400" : "text-zinc-500"
                      }`}>
                        {description.length}/160 Chars
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={selectedPage === "global" ? "Write global site fallback descriptions..." : "Specific description for custom crawl parameters..."}
                      rows={4}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none font-sans leading-relaxed"
                    />
                  </div>

                  {/* Advanced settings: Canonical, NoIndex */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                        <LinkIcon className="w-3.5 h-3.5" />
                        Canonical URL Override
                      </label>
                      <input
                        type="url"
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        placeholder="https://jrphotography.com"
                        className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-[#cfb53b]/40"
                      />
                    </div>

                    {selectedPage !== "global" && (
                      <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-0.5 pr-2">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-white leading-none">NO-INDEX CRAWL BLOCK</p>
                          <p className="text-[9px] text-zinc-500 leading-tight">Instructs robots to ignore indexing protocols on this target link.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNoIndex(!noIndex)}
                          className={`w-12 h-6 flex items-center rounded-full p-1 transition-all ${
                            noIndex ? "bg-red-500" : "bg-zinc-800"
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                            noIndex ? "translate-x-6" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* social sharing Open Graph Custom Image */}
                  <ImagePreviewInput
                    label="Open Graph Sharing Image URL (Facebook, LinkedIn, Pinterest)"
                    value={ogImageUrl}
                    onChange={setOgImageUrl}
                    placeholder="https://images.unsplash.com/photo-example...jpg"
                  />
                </div>
              )}

            </div>

            {/* SAVE TRIGGER BUTTONS */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <button
                onClick={handleSave}
                disabled={saving || loadingPage}
                className="w-full bg-[#cfb53b] hover:bg-white text-luxury-black py-4 rounded-xl font-bold uppercase tracking-[0.25em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? "saving configuration..." : `apply ${selectedPage} seo changes`}</span>
              </button>

              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl text-center text-[10px] uppercase tracking-widest font-mono ${
                    message.type === "success" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </div>

          </div>

          {/* RIGHT Visual Sandbox Column */}
          <div className="lg:col-span-6 flex flex-col">
            <SEOAssistantPanel
              type={
                selectedPage.startsWith("blog-detail-") ? "posts" :
                selectedPage.startsWith("works-detail-") ? "portfolio" : "posts"
              }
              currentTitle={pageTitle || siteName}
              currentSummary={description}
              coverImage={ogImageUrl}
              seoSettings={{
                title: pageTitle,
                description: description,
                focusKeyword: focusKeyword,
                canonicalUrl: canonicalUrl,
                ogImageUrl: ogImageUrl,
                noIndex: noIndex,
                slug: customSlug,
              } as any}
              onUpdate={(updated: any) => {
                setPageTitle(updated.title || "");
                setDescription(updated.description || "");
                setFocusKeyword(updated.focusKeyword || "");
                setCanonicalUrl(updated.canonicalUrl || "");
                setOgImageUrl(updated.ogImage || updated.ogImageUrl || "");
                setNoIndex(!!updated.noIndex);
                setCustomSlug(updated.slug || "");
              }}
            />
          </div>

        </div>
      )}

    </section>
  );
}
