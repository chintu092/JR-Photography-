import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Loader2, Trash2, Download, Search, Mail, Copy, Check, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SubscriberItem {
  id: string;
  email: string;
  subscribedAt: any;
}

export default function SubscriberManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "subscribers"));
      const fetched = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SubscriberItem[];
      
      // Sort in-memory to prevent requiring composite index creation in Firestore initially
      const sorted = fetched.sort((a, b) => {
        const timeA = a.subscribedAt?.seconds || 0;
        const timeB = b.subscribedAt?.seconds || 0;
        return timeB - timeA;
      });

      setItems(sorted);
    } catch (error: any) {
      console.error("Error fetching subscribers:", error);
      toast.error(`Failed to fetch subscribers: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "subscribers", deleteId));
      setItems(prev => prev.filter(item => item.id !== deleteId));
      toast.success("Subscriber successfully removed.");
      setDeleteId(null);
    } catch (error: any) {
      console.error("Error removing subscriber:", error);
      toast.error(`Failed to remove subscriber: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, `subscribers/${deleteId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyEmails = () => {
    if (items.length === 0) return;
    const emails = items.map(i => i.email).join(", ");
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    toast.success("Copied subscriber emails to clipboard!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error("No subscribers to export.");
      return;
    }

    // Header values
    const csvContent = [
      ["ID", "Email Address", "Subscription Date"],
      ...items.map(item => [
        item.id,
        item.email,
        item.subscribedAt ? formatTimestamp(item.subscribedAt) : "N/A"
      ])
    ]
      .map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export initiated successfully.");
  };

  const handleSeedSubscribers = async () => {
    setSaving(true);
    try {
      const mockSubscribers = [
        { email: "john.doe@luxury-studios.com", subscribedAt: serverTimestamp() },
        { email: "sophie.pierre@creative-vibe.net", subscribedAt: serverTimestamp() },
        { email: "marcus.vance@arch-designs.co", subscribedAt: serverTimestamp() },
        { email: "elena.gomez@visuals-atelier.com", subscribedAt: serverTimestamp() },
        { email: "david.chao@lumiere-spaces.org", subscribedAt: serverTimestamp() }
      ];

      for (const subscriber of mockSubscribers) {
        await addDoc(collection(db, "subscribers"), subscriber);
      }

      toast.success("Mock subscribers successfully seeded!");
      fetchItems();
    } catch (error: any) {
      console.error("Error seeding subscribers:", error);
      toast.error(`Error seeding subscribers: ${error.message || error}`);
    } finally {
      setSaving(false);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "N/A";
    let dateObj: Date;
    if (typeof ts.toDate === "function") {
      dateObj = ts.toDate();
    } else if (ts.seconds) {
      dateObj = new Date(ts.seconds * 1000);
    } else {
      dateObj = new Date(ts);
    }
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredItems = items.filter(item =>
    item.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="space-y-6 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">Email Subscribers</h2>
          <p className="text-luxury-cream/40 text-sm">View, query, and export subscribers collected from the footer newsletter sign-up form.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleSeedSubscribers}
            disabled={saving || loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 cursor-pointer disabled:opacity-40 transition-all"
          >
            Seed Mock Subscribers
          </button>
          <button
            onClick={handleCopyEmails}
            disabled={loading || items.length === 0}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 cursor-pointer disabled:opacity-40 flex items-center gap-2 transition-all"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>Copy All Emails</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || items.length === 0}
            className="px-4 py-2 bg-[#cfb53b] hover:bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search controls */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscribers by email..."
            className="w-full bg-luxury-black/40 border border-white/5 hover:border-luxury-gold/40 focus:border-luxury-gold focus:outline-none rounded-2xl pl-12 pr-6 py-4 text-sm text-luxury-cream transition-all placeholder:text-zinc-600 font-sans"
          />
        </div>

        {/* Content Table / Empty state */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
          </div>
        ) : (
          <div className="bg-[#0b0a11]/90 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
                    <th className="py-4 px-6 font-semibold">Subscriber Email</th>
                    <th className="py-4 px-6 font-semibold">Subscription Date</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6 text-white font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-luxury-gold/5 flex items-center justify-center border border-luxury-gold/10 group-hover:border-luxury-gold/30 transition-colors">
                            <Mail className="w-4 h-4 text-luxury-gold" />
                          </div>
                          <span className="font-mono text-sm">{item.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 font-medium">
                        {formatTimestamp(item.subscribedAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-2 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete Subscriber"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-16 text-center text-zinc-500 font-sans text-sm font-medium italic">
                        {searchQuery ? "No matching subscribers found." : "No subscribers collected yet. Fill the footer form to get started."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0a11] border border-white/5 max-w-sm w-full p-8 rounded-3xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-serif text-white">Confirm Removal</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Are you sure you want to delete <span className="text-luxury-gold font-mono break-all">{items.find(i => i.id === deleteId)?.email}</span> from the subscribers catalog?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold uppercase tracking-widest text-[9px] hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? "Removing..." : "Permanently Remove"}</span>
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
