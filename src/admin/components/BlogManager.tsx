import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType, logAdminActivity } from "../../lib/firebase";
import { 
  collection, doc, getDocs, setDoc, deleteDoc, getDoc, 
  serverTimestamp, Timestamp 
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Loader2, Plus, Edit2, Trash2, Save, X, Sparkles, 
  ChevronLeft, LayoutGrid, Eye, EyeOff, Globe, BookOpen, RefreshCw, Folder
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BlogPost, SEOSettings } from "../../types";
import { BLOG_POSTS } from "../../data";
import { getCollectionData } from "../../lib/db-client";
import ImagePreviewInput from "./ImagePreviewInput";
import SEOAssistantPanel from "./SEOAssistantPanel";

export default function BlogManager() {
  const { user, role: currentAdminRole } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);

  const canModifyPost = (post: any) => {
    if (!user) return false;
    const isRoot = user.email && user.email.toLowerCase().trim() === "supriyos9@gmail.com";
    if (isRoot || currentAdminRole === "super_admin") return true;
    if (currentAdminRole === "writer" || currentAdminRole === "Writer") {
      return post.createdBy === user.uid || (post.createdByEmail && post.createdByEmail.toLowerCase().trim() === user.email?.toLowerCase().trim());
    }
    return true; // other roles
  };

  // Saved Draft placeholder for local storage restoration
  const [savedDraft, setSavedDraft] = useState<any | null>(null);

  // Nested custom SEO configurations for the post
  const [seoDraft, setSeoDraft] = useState<SEOSettings>({
    title: "",
    description: "",
    focusKeyword: "",
    canonicalUrl: "",
    ogImageUrl: "",
    noIndex: false,
    slug: "",
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkCategory, setBulkCategory] = useState<string>("Journal");

  // Check for saved drafts on mount
  useEffect(() => {
    const raw = localStorage.getItem("jrphotography-blog-draft");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.editingPost) {
          setSavedDraft(parsed);
        }
      } catch (err) {
        console.error("Failed to parse unsaved blog draft:", err);
      }
    }
  }, []);

  // Sync draft to local storage on edits
  useEffect(() => {
    if (editingPost) {
      localStorage.setItem("jrphotography-blog-draft", JSON.stringify({ editingPost, seoDraft, isSlugCustomized }));
    }
  }, [editingPost, seoDraft, isSlugCustomized]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetched = await getCollectionData<BlogPost>("blog");
      // Sort by descending timing or title safely
      setPosts(fetched.sort((a, b) => (b.title || "").localeCompare(a.title || "")));
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Fetch or initialize custom page-level SEO settings whenever the edited post changes
  useEffect(() => {
    async function loadPostSEO() {
      if (!editingPost || !editingPost.id) {
        // Reset custom SEO schema for new templates
        setSeoDraft({
          title: "",
          description: "",
          focusKeyword: "",
          canonicalUrl: "",
          ogImageUrl: "",
          noIndex: false,
          slug: "",
        });
        return;
      }

      try {
        const seoDoc = await getDoc(doc(db, "settings", "seo", "pages", `blog-detail-${editingPost.id}`));
        if (seoDoc.exists()) {
          setSeoDraft(seoDoc.data() as SEOSettings);
        } else {
          // Preset smart default metadata based on raw item details
          setSeoDraft({
            title: editingPost.title || "",
            description: editingPost.summary || "",
            focusKeyword: editingPost.category || "",
            canonicalUrl: "",
            ogImageUrl: editingPost.coverImage || "",
            noIndex: false,
            slug: editingPost.id,
          });
        }
      } catch (err) {
        console.error("Failed to load post específicas SEO parameters:", err);
      }
    }

    loadPostSEO();
  }, [editingPost?.id]);

  const handleEditClick = (post: BlogPost) => {
    // Set custom visual state bindings
    window.location.hash = `/admin/posts/edit/${post.id}`;
    setEditingPost(post);
    const expectedSlug = post.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    setIsSlugCustomized(post.id !== expectedSlug && !!post.id);
  };

  const handleAddNewClick = () => {
    window.location.hash = `/admin/posts/new`;
    setIsSlugCustomized(false);
    setEditingPost({
      title: "",
      category: "Technical Craft",
      summary: "",
      coverImage: "",
      coverImageAlt: "",
      readTime: "5 min read",
      content: [] as string[],
      quote: "",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      author: { 
        name: "Supriyo S.", 
        role: "Lead Curator & Director", 
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
      }
    });
  };

  const handleBulkImport = async () => {
    if (!user || !bulkUrls.trim()) return;
    setSaving(true);
    let successCount = 0;
    
    try {
      let parsedData: any[] = [];
      const trimmedData = bulkUrls.trim();
      
      if (trimmedData.startsWith('[') && trimmedData.endsWith(']')) {
        try {
          parsedData = JSON.parse(trimmedData);
        } catch (e) {
           throw new Error("Invalid JSON format provided. Please ensure it is a valid JSON array.");
        }
      } else {
        const urls = trimmedData.split("\n").map(u => u.trim()).filter(u => u.length > 0);
        parsedData = urls.map(url => {
          const titleMatch = url.match(/\/([^/?#]+)[^/]*$/i);
          const titleString = titleMatch ? decodeURIComponent(titleMatch[1].split('.')[0].replace(/[-_]/g, ' ')) : "Bulk Uploaded Editorial";
          const cleanTitle = titleString.charAt(0).toUpperCase() + titleString.slice(1);
          return { coverImage: url, title: cleanTitle };
        });
      }

      await Promise.all(parsedData.map(async (itemData: any) => {
        const d = new Date();
        const baseSlug = itemData.slug || `bulk-blog-${d.getTime()}-${Math.floor(Math.random() * 10000)}`;
        
        const cleanTitle = itemData.title || "Bulk Uploaded Editorial";
        const category = itemData.category || bulkCategory;
        
        const data: any = {
          title: cleanTitle,
          category: category,
          summary: itemData.summary || "Bulk uploaded cover media content draft.",
          coverImage: itemData.coverImage || "",
          coverImageAlt: itemData.coverImageAlt || `${category} Editorial Cover Strategy`,
          readTime: itemData.readTime || "2 min read",
          content: itemData.content || [],
          quote: itemData.quote || "",
          date: itemData.date || d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          author: itemData.author || { 
            name: "Supriyo S.", 
            role: "Lead Curator & Director", 
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          order: posts.length + successCount + 1,
          ...itemData
        };

        // Remove slug from data body
        if (data.slug) delete data.slug;

        await setDoc(doc(db, "blog", baseSlug), data);
        successCount++;
      }));
      toast.success(`Successfully added ${successCount} blog drafts`);
      setShowBulkUpload(false);
      setBulkUrls("");
      fetchPosts();
    } catch (e: any) {
      console.error("Error bulk uploading:", e);
      toast.error(`Error during bulk import: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = () => {
    window.location.hash = `/admin/posts`;
    localStorage.removeItem("jrphotography-blog-draft");
    setEditingPost(null);
  };

  const handleSave = async () => {
    if (!user || !editingPost || !editingPost.title) return;
    if (editingPost.id && !canModifyPost(editingPost)) {
      toast.error("Action Denied: You cannot modify blog articles authored by other team members.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const isNew = !editingPost.id;
      const baseSlug = seoDraft.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "untitled-post";
      const id = baseSlug;
      const oldId = editingPost.id;

      // Clean lines to paragraphs arrays
      const contentArray = typeof editingPost.content === 'string'
        ? (editingPost.content as string).split('\n').filter(s => s.trim())
        : (editingPost.content || []);

      const data: any = {
        title: editingPost.title || "",
        category: editingPost.category || "General",
        summary: editingPost.summary || "",
        coverImage: editingPost.coverImage || "",
        coverImageAlt: editingPost.coverImageAlt || "",
        readTime: editingPost.readTime || "5 min read",
        content: contentArray,
        quote: editingPost.quote || "",
        date: editingPost.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        author: {
          name: editingPost.author?.name || user.displayName || user.email?.split("@")[0] || "Supriyo S.",
          role: editingPost.author?.role || (currentAdminRole === "writer" ? "Writer / Contributor" : "Lead Curator"),
          avatar: editingPost.author?.avatar || "",
        },
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
        createdBy: editingPost.createdBy || user.uid,
        createdByEmail: editingPost.createdByEmail || user.email || "",
      };

      let finalCreatedAt = serverTimestamp();
      if (!isNew && editingPost.createdAt) {
        const val = editingPost.createdAt as any;
        if (typeof val.toDate === "function") {
          finalCreatedAt = val;
        } else if (typeof val === "string") {
          try {
            finalCreatedAt = Timestamp.fromDate(new Date(val)) as any;
          } catch (e) {
            console.warn("Legacy string date format failed to parse:", e);
          }
        } else if (val.seconds !== undefined) {
          finalCreatedAt = new Timestamp(val.seconds, val.nanoseconds) as any;
        } else if (val instanceof Date) {
          finalCreatedAt = Timestamp.fromDate(val) as any;
        } else {
          finalCreatedAt = val;
        }
      }
      data.createdAt = finalCreatedAt;

      // 1. Commit primary post body inside Firestore `blog`
      await setDoc(doc(db, "blog", id!), data, { merge: true });

      // 2. Commit parallel customized page SEO metrics
      const seoData = {
        title: seoDraft.title || data.title,
        description: seoDraft.description || data.summary,
        focusKeyword: seoDraft.focusKeyword || data.category,
        canonicalUrl: seoDraft.canonicalUrl || "",
        ogImageUrl: seoDraft.ogImageUrl || data.coverImage,
        noIndex: !!seoDraft.noIndex,
        slug: id,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      await setDoc(doc(db, "settings", "seo", "pages", `blog-detail-${id}`), seoData, { merge: true });

      // Log creation or update
      await logAdminActivity(
        isNew ? "Created Blog Post" : "Updated Blog Post",
        `${isNew ? "Added new" : "Modified"} editorial post "${data.title}" (ID: ${id})`,
        "blog"
      );
      // Clean local storage draft representation
      localStorage.removeItem("jrphotography-blog-draft");

      // If existing item and id changed, delete old one
      if (!isNew && oldId && oldId !== id) {
        try {
          await deleteDoc(doc(db, "blog", oldId));
          await deleteDoc(doc(db, "settings", "seo", "pages", `blog-detail-${oldId}`));
        } catch (e) {
          console.warn("Failed to delete outdated old document:", e);
        }
      }

      setMessage({ type: "success", text: `Blog post "${data.title}" saved successfully along with customized SEO parameters!` });
      toast.success(`Blog post "${data.title}" saved successfully along with customized SEO parameters!`);
      setTimeout(() => {
        setEditingPost(null);
        fetchPosts();
        window.location.hash = `/admin/posts`;
      }, 1500);
    } catch (error: any) {
      console.error("Error saving blog post:", error);
      setMessage({ type: "error", text: "Failed to upload and save blog document." });
      toast.error(`Failed to save blog post: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, `blog/${editingPost.id || 'new'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const targetPost = posts.find(p => p.id === deleteId);
    if (targetPost && !canModifyPost(targetPost)) {
      toast.error("Action Denied: You cannot delete blog articles authored by other team members.");
      setDeleteId(null);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await deleteDoc(doc(db, "blog", deleteId));
      // Delete SEO record too to keep Firestore database perfectly clean
      await deleteDoc(doc(db, "settings", "seo", "pages", `blog-detail-${deleteId}`));

      await logAdminActivity(
        "Deleted Blog Post",
        `Permanently removed blog post with ID "${deleteId}" and associated customized SEO metatags.`,
        "blog"
      );
      
      setPosts(prev => prev.filter(p => p.id !== deleteId));
      setMessage({ type: "success", text: "Post and metadata deleted successfully." });
      toast.success("Blog post and metadata coordinates removed successfully.");
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error deleting post:", error);
      setMessage({ type: "error", text: "Unresolved authority constraints preventing deletion." });
      toast.error(`Error deleting post: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      const snap = await getDocs(collection(db, "blog"));
      if (!snap.empty) {
        setMessage({ type: "error", text: "Cannot seed: Database already contains data. Clear it first." });
        toast.error("Cannot seed: Database already contains data. Clear it first.");
        setSaving(false);
        return;
      }

      for (const item of BLOG_POSTS) {
        const id = item.id || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await setDoc(doc(db, "blog", id), {
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });

        // Seed basic dynamic page-level search settings matching SEO defaults
        await setDoc(doc(db, "settings", "seo", "pages", `blog-detail-${id}`), {
          title: item.title,
          description: item.summary,
          focusKeyword: item.category,
          slug: id,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
      }
      setMessage({ type: "success", text: "Default editorials seeded successfully!" });
      toast.success("Default photography blog editorials seeded successfully!");
      fetchPosts();
    } catch (error: any) {
      console.error("Error seeding blog posts:", error);
      setMessage({ type: "error", text: "Failed to seed editorial database." });
      toast.error(`Failed to seed editorial database: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  if (editingPost) {
    /* DEDICATED FULL SCREEN BLOG EDIT DESIGN WITH SIDE PREVIEWS AND SEO ASSISTANCE COMBO */
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-left max-w-7xl mx-auto min-h-screen pb-16">
        {/* Editor controls bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="p-2 sm:p-3 bg-white/5 hover:bg-[#cfb53b] hover:text-black rounded-xl border border-white/5 transition-all text-zinc-400 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#cfb53b]">editorial curator workspace</span>
              <h2 className="text-2xl sm:text-3xl font-serif text-white italic truncate max-w-[280px] sm:max-w-md">
                {editingPost.id ? `Editing: ${editingPost.title}` : "Create New Post"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto self-end sm:self-center">
            <button
              onClick={handleBackClick}
              className="flex-1 sm:flex-initial px-4 py-3 bg-white/5 rounded-xl text-xs uppercase font-bold tracking-widest text-zinc-400 hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-initial px-6 py-3 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Publishing..." : "Save Blog Post"}</span>
            </button>
          </div>
        </div>

        {saving && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-xs flex items-center gap-2 font-mono uppercase">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Synchronizing files. Please wait while records build on Google Cloud Firestore...</span>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-xl text-xs uppercase tracking-widest text-center font-medium ${
            message.type === "success" 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {message.text}
          </div>
        )}

        {/* Master Form Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT Form Panels */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-luxury-black/40 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6">
              <h4 className="text-xs uppercase tracking-widest text-[#cfb53b] font-bold pb-2 border-b border-white/5 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-[#cfb53b]" />
                Primary Editorial Parameters
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Artistic Post Title</label>
                  <input
                    type="text"
                    value={editingPost.title || ""}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditingPost({ ...editingPost, title: newTitle });
                      if (!isSlugCustomized) {
                        setSeoDraft(prev => ({
                          ...prev,
                          slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
                        }));
                      }
                    }}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. Masterclass Candid Frames"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Custom URL Slug Path</label>
                    <label className="text-[10px] flex items-center gap-1.5 text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={isSlugCustomized} 
                        onChange={(e) => setIsSlugCustomized(e.target.checked)}
                        className="accent-[#cfb53b]"
                      />
                      <span>Custom Entry</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={seoDraft.slug || ""}
                    onChange={(e) => {
                      setIsSlugCustomized(true);
                      setSeoDraft({ ...seoDraft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") });
                    }}
                    disabled={!isSlugCustomized}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. masterclass-candid-frames"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Editorial Category</label>
                  <input
                    type="text"
                    list="blog-categories"
                    value={editingPost.category || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="Lighting Dynamics, Portfolios, etc."
                  />
                  <datalist id="blog-categories">
                    <option value="Technical Craft" />
                    <option value="Lighting Dynamics" />
                    <option value="Matrimonial Journeys" />
                    <option value="Creative Direction" />
                    <option value="Fashion Features" />
                  </datalist>
                </div>
              </div>

              {/* Cover Image + Alt Preview Input */}
              <ImagePreviewInput
                label="Cover Hero Image URL"
                value={editingPost.coverImage || ""}
                onChange={(val) => setEditingPost({ ...editingPost, coverImage: val })}
                placeholder="https://images.unsplash.com/photo-..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Hero Alt Text Reference (A11y)</label>
                  <input
                    type="text"
                    value={editingPost.coverImageAlt || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImageAlt: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="Describe image elements..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Estimated Reading Duration</label>
                  <input
                    type="text"
                    value={editingPost.readTime || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                    placeholder="e.g. 5 min read"
                  />
                </div>
              </div>

              {/* Summary field */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-sans">Index Summary (Shown on previews & previews lists)</label>
                <textarea
                  value={editingPost.summary || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 resize-none leading-relaxed"
                  rows={3}
                  placeholder="Draft editorial descriptions..."
                />
              </div>

              {/* Quote details */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Featured Pull Quote Quote (Optional)</label>
                <input
                  type="text"
                  value={editingPost.quote || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, quote: e.target.value })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 italic"
                  placeholder="Pull quote accent block..."
                />
              </div>

              {/* Full copy layout */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Full Blog Content Copy (Press ENTER for new paragraphs)</label>
                <textarea
                  value={
                    Array.isArray(editingPost.content) 
                      ? editingPost.content.join('\n') 
                      : (editingPost.content || "")
                  }
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value as any })}
                  className="w-full bg-luxury-black border border-white/10 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 min-h-[220px]"
                  placeholder="Introduce structural elements and paragraphs here..."
                />
              </div>
            </div>

            {/* Author Identity segment */}
            <div className="bg-luxury-black/40 border border-white/5 p-6 rounded-3xl space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-bold">Author Identity Attributes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Name</label>
                  <input
                    type="text"
                    value={editingPost.author?.name || ""}
                    onChange={(e) => setEditingPost({ 
                      ...editingPost, 
                      author: { ...(editingPost.author || {} as any), name: e.target.value } 
                    })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Role Title</label>
                  <input
                    type="text"
                    value={editingPost.author?.role || ""}
                    onChange={(e) => setEditingPost({ 
                      ...editingPost, 
                      author: { ...(editingPost.author || {} as any), role: e.target.value } 
                    })}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40"
                  />
                </div>
              </div>

              <ImagePreviewInput
                label="Author Portrait Avatar Image"
                value={editingPost.author?.avatar || ""}
                onChange={(val) => setEditingPost({ 
                  ...editingPost, 
                  author: { ...(editingPost.author || {} as any), avatar: val } 
                })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* RIGHT SEO & Copilot Previews Section */}
          <div className="lg:col-span-6 flex flex-col h-full sticky top-8">
            <SEOAssistantPanel
              type="posts"
              currentTitle={editingPost.title || ""}
              currentSummary={editingPost.summary || ""}
              currentContent={editingPost.content}
              coverImage={editingPost.coverImage}
              imageAlt={editingPost.coverImageAlt}
              seoSettings={seoDraft}
              onUpdate={setSeoDraft}
            />
          </div>

        </div>

      </div>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {savedDraft && !editingPost && (
        <div className="bg-[#cfb53b]/10 border border-[#cfb53b]/30 p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#cfb53b]" />
            <div className="text-left">
              <h4 className="text-sm font-bold text-[#cfb53b] uppercase tracking-widest">Unsaved Draft Recovered</h4>
              <p className="text-xs text-white/70">An autosaved draft "{savedDraft.editingPost.title || "Untitled"}" was found from your last session.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={() => {
                localStorage.removeItem("jrphotography-blog-draft");
                setSavedDraft(null);
              }}
              className="px-3 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto"
            >
              Discard
            </button>
            <button
              onClick={() => {
                setEditingPost(savedDraft.editingPost);
                if (savedDraft.seoDraft) setSeoDraft(savedDraft.seoDraft);
                if (savedDraft.isSlugCustomized !== undefined) setIsSlugCustomized(savedDraft.isSlugCustomized);
                setSavedDraft(null);
              }}
              className="px-3 py-2 bg-[#cfb53b] text-black hover:bg-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all w-full sm:w-auto"
            >
              Restore Draft
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2 text-left">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">editorial catalog</h2>
          <p className="text-luxury-cream/40 text-sm">Review, create, and refine candid stories and lighting case-files in Kolkata.</p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            onClick={() => setShowBulkUpload(true)}
            disabled={saving}
            className="px-4 py-2 bg-[#cfb53b]/20 hover:bg-[#cfb53b]/30 text-[#cfb53b] rounded-xl text-xs font-bold uppercase tracking-widest border border-[#cfb53b]/40 cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          >
            <Folder className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={handleSeed}
            disabled={saving}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 cursor-pointer disabled:opacity-40"
          >
            Seed Defaults
          </button>
          <button
            onClick={handleAddNewClick}
            className="px-4 py-2 bg-luxury-gold hover:bg-luxury-cream text-luxury-black rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create BlogPost</span>
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0a11] border border-white/10 max-w-lg w-full p-6 sm:p-8 rounded-3xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowBulkUpload(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-1">
               <span className="text-[9px] uppercase font-mono tracking-widest text-[#cfb53b]">Bulk Operations</span>
               <h3 className="text-xl font-serif text-white uppercase italic">Batch Import Editorial Covers</h3>
               <p className="text-[10px] text-zinc-500">Provide a list of image URLs (one per line) or a JSON array of complete blog objects to import multiple editorial drafts at once.</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Default Category</label>
                  <select
                     value={bulkCategory}
                     onChange={(e: any) => setBulkCategory(e.target.value)}
                     className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 font-mono"
                  >
                     <option value="Journal">Journal</option>
                     <option value="Technical Craft">Technical Craft</option>
                     <option value="Lighting Case">Lighting Case</option>
                     <option value="Industry Updates">Industry Updates</option>
                  </select>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Image URLs or JSON Array</label>
                  <textarea
                     value={bulkUrls}
                     onChange={(e) => setBulkUrls(e.target.value)}
                     placeholder={'[\n  {\n    "title": "My Awesome Blog Post",\n    "category": "Journal",\n    "summary": "This is a short summary.",\n    "coverImage": "https://example.com/cover.jpg",\n    "coverImageAlt": "Cover photo",\n    "readTime": "5 min read",\n    "quote": "Photography is light.",\n    "content": ["First paragraph...", "Second paragraph..."],\n    "author": {\n      "name": "Supriyo S.",\n      "role": "Lead Curator",\n      "avatar": "https://..."\n    }\n  }\n]'}
                     className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]/40 h-48 resize-none font-mono tracking-tight"
                  />
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBulkUpload(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs uppercase font-bold tracking-widest text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={saving || !bulkUrls.trim()}
                  className="flex-1 py-3 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs uppercase font-bold tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin text-black" />}
                  <span>{saving ? "Importing..." : "Run Import"}</span>
                </button>
            </div>
          </motion.div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-xs uppercase tracking-widest text-center ${
          message.type === "success" 
            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-luxury-black/40 border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden group select-none text-left"
            >
              <div className="aspect-[16/10] bg-zinc-900 relative overflow-hidden">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.coverImageAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-700 uppercase font-mono font-bold text-xs">No Cover Image</div>
                )}
                
                {/* Float controls overlay */}
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {canModifyPost(post) ? (
                    <>
                      <button
                        onClick={() => handleEditClick(post)}
                        className="p-2 sm:p-2.5 bg-luxury-black/85 hover:bg-[#cfb53b] text-white hover:text-black rounded-xl border border-white/5 cursor-pointer backdrop-blur-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(post.id || null)}
                        className="p-2 sm:p-2.5 bg-luxury-black/85 hover:bg-red-500 text-white rounded-xl border border-white/5 cursor-pointer backdrop-blur-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl text-[9px] uppercase font-bold tracking-widest text-[#cfb53b] flex items-center gap-1">
                      <span>✦</span>
                      <span>Read Only</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-[#cfb53b] font-bold">{post.category}</span>
                <h3 className="font-serif text-lg text-white leading-tight truncate">{post.title}</h3>
                <p className="text-[10px] text-zinc-500">{post.date} • {post.readTime}</p>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans">{post.summary}</p>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-white/5 rounded-2xl text-zinc-500 font-medium">
              No entries logged inside Firestore. Select "Seed Defaults" context to initialize catalogs.
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border border-white/5 max-w-sm w-full p-8 rounded-3xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center mx-auto text-red-400">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-serif text-white leading-snug">Confirm Deletion</h3>
                <p className="text-zinc-500 text-xs">
                  Are you sure you want to permanently delete "{posts.find(p => p.id === deleteId)?.title}"? This action is irreversible.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmDelete}
                  disabled={saving}
                  className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold uppercase tracking-widest text-[9px] hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Deleting..." : "Permanently Delete"}
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={saving}
                  className="w-full bg-white/5 text-zinc-400 py-3 rounded-xl font-semibold uppercase tracking-widest text-[9px] hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
