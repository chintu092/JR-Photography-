import React, { useState, useEffect } from "react";
import { db, logAdminActivity } from "../../lib/firebase";
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Database, User, Loader2, ArrowDownAZ, Search, Trash2, 
  RefreshCw, Filter, Calendar, Activity, ShieldCheck, Mail, Sliders 
} from "lucide-react";
import { motion } from "motion/react";

interface AdminActivity {
  id: string;
  action: string;
  details: string;
  category: string;
  adminEmail: string;
  adminUid: string;
  createdAt: any;
}

export default function ActivityLogManager() {
  const { role } = useAuth();
  const toast = useToast();
  const [logs, setLogs] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTime, setFilterTime] = useState<string>("all");
  const [purgePasscode, setPurgePasscode] = useState("");
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Real-time subscription to logs, ordered by creation date descending
    const q = query(collection(db, "activity_logs"), orderBy("createdAt", "desc"), limit(250));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AdminActivity[];
      setLogs(fetchedLogs);
      setLoading(false);
    }, (error) => {
      console.error("Failed to subscribe to logs:", error);
      // Fallback clean read if indexing is building
      const fetchLogsOnce = async () => {
        try {
          const snap = await getDocs(collection(db, "activity_logs"));
          const simpleList = snap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          })) as AdminActivity[];
          setLogs(simpleList.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          }));
        } catch (err) {
          console.error("Fallback audit logs failed:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchLogsOnce();
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestampIn: any) => {
    if (!timestampIn) return "Just now";
    
    // If Firestore Timestamp
    if (timestampIn.seconds) {
      return new Date(timestampIn.seconds * 1000).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }

    try {
      return new Date(timestampIn).toLocaleString();
    } catch {
      return "Pending Sync";
    }
  };

  const handlePurgeLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== "super_admin") {
      toast.error("Access Restricted. Only Super Administrators can purge general logs.");
      return;
    }

    const correctPasscode = (import.meta as any).env.VITE_ADMIN_PASSCODE || "2026";
    if (purgePasscode !== correctPasscode) {
      toast.error("Incorrect administrative password passcode.");
      return;
    }

    setPurging(true);
    try {
      const snap = await getDocs(collection(db, "activity_logs"));
      const batchDeletes = snap.docs.map(d => deleteDoc(doc(db, "activity_logs", d.id)));
      await Promise.all(batchDeletes);

      // Log the purge action itself as a permanent clean record
      await logAdminActivity(
        "Purged Activity Logs",
        "The administrative ledger database was completely cleared by a Super Admin.",
        "security"
      );

      toast.success(" Ledger cleared successfully.");
      setShowPurgeModal(false);
      setPurgePasscode("");
    } catch (err: any) {
      console.error(err);
      toast.error(`Purging failed: ${err.message || err}`);
    } finally {
      setPurging(false);
    }
  };

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const keywords = searchQuery.toLowerCase();
      const matchSearch = 
        (log.action || "").toLowerCase().includes(keywords) || 
        (log.details || "").toLowerCase().includes(keywords) ||
        (log.adminEmail || "").toLowerCase().includes(keywords);

      const matchCat = filterCategory === "all" || (log.category || "").toLowerCase() === filterCategory.toLowerCase();
      
      let matchTime = true;
      if (filterTime !== "all" && log.createdAt) {
        const logDate = log.createdAt.seconds 
          ? new Date(log.createdAt.seconds * 1000) 
          : new Date(log.createdAt);
        
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (filterTime === "today") matchTime = diffDays <= 1;
        if (filterTime === "7days") matchTime = diffDays <= 7;
        if (filterTime === "30days") matchTime = diffDays <= 30;
      }

      return matchSearch && matchCat && matchTime;
    });
  }, [logs, searchQuery, filterCategory, filterTime]);

  const getActionStyles = (action: string) => {
    const act = (action || "").toLowerCase();
    if (act.includes("delete") || act.includes("remove") || act.includes("clear") || act.includes("purge")) {
      return "bg-red-500/10 border-red-500/30 text-red-400";
    }
    if (act.includes("create") || act.includes("add") || act.includes("new") || act.includes("catalog")) {
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    }
    if (act.includes("update") || act.includes("edit") || act.includes("save") || act.includes("mod")) {
      return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    }
    return "bg-indigo-500/10 border-indigo-500/30 text-indigo-400";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Title section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-luxury-gold uppercase tracking-[0.2em] font-mono text-[9px]">
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail & Security Log</span>
          </div>
          <h2 className="text-3xl font-serif text-white tracking-tight lowercase">
            Activity <span className="text-luxury-gold italic">Ledger Hub</span>
          </h2>
          <p className="text-luxury-cream/40 text-xs">
            Review detailed, chronological logs of administrative changes, deletions, and operational updates in real time.
          </p>
        </div>

        {role === "super_admin" && (
          <button
            onClick={() => setShowPurgeModal(true)}
            className="px-5 py-3 bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-400 hover:text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Archive Log</span>
          </button>
        )}
      </div>

      {/* Filter and search parameters */}
      <div className="p-4 bg-luxury-black/40 border border-white/5 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action logs, descriptions and Admins..."
            className="w-full bg-[#07060b]/60 border border-white/10 hover:border-luxury-gold/40 focus:border-[#cfb53b] focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-650 transition-all font-sans"
          />
        </div>

        {/* Filtering choices */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none focus:border-luxury-gold uppercase font-mono tracking-wider w-full sm:w-auto [&>option]:bg-[#07060b] [&>option]:text-white"
            >
              <option value="all">Every Category</option>
              <option value="portfolio">Portfolio Works</option>
              <option value="blog">Editorial Blogs</option>
              <option value="assets">Media Catalogue</option>
              <option value="subscribers">Newsletter Subscriptions</option>
              <option value="settings">Global Layouts</option>
              <option value="security">Security & Access</option>
            </select>
          </div>

          {/* Time Dropdown */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none focus:border-luxury-gold uppercase font-mono tracking-wider w-full sm:w-auto [&>option]:bg-[#07060b] [&>option]:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-luxury-gold mx-auto mb-2" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Syncing system audit log records...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/5 bg-[#07060b]/30 rounded-3xl space-y-3">
          <Activity className="w-8 h-8 text-zinc-500 mx-auto" />
          <p className="text-sm font-serif italic text-zinc-400">The audit ledger has no registered entries matching your search keys.</p>
        </div>
      ) : (
        <div className="bg-[#0b0a11]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/60 border-b border-white/5 text-[9px] uppercase tracking-widest font-mono text-[#94a3b8]">
                  <th className="py-4.5 px-6">Administrator</th>
                  <th className="py-4.5 px-6">Action</th>
                  <th className="py-4.5 px-6">Category</th>
                  <th className="py-4.5 px-6">Ledger Details</th>
                  <th className="py-4.5 px-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-zinc-300 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.012] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5">
                          <User className="w-3.5 h-3.5 text-[#cfb53b]" />
                        </div>
                        <div className="leading-snug">
                          <p className="text-zinc-200 font-medium max-w-[140px] truncate">{log.adminEmail || "unknown@admin.com"}</p>
                          <span className="text-[8.5px] font-mono text-zinc-500 select-all font-semibold uppercase">{(log.adminUid || "unknown").slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg border text-[9.5px] font-bold tracking-wider font-mono uppercase shrink-0 ${getActionStyles(log.action || "")}`}>
                        {log.action || "Unknown Action"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[9.5px] uppercase font-mono tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 text-zinc-400 font-semibold">{log.category || "General"}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-zinc-300 font-normal leading-relaxed max-w-[340px] break-words">{log.details || "No details provided"}</p>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[10.5px] text-zinc-400">
                      {formatTimestamp(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-style View */}
          <div className="block md:hidden divide-y divide-white/5">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-5 space-y-3 hover:bg-white/[0.012] transition-colors">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded border text-[8.5px] font-bold tracking-wider font-mono uppercase ${getActionStyles(log.action || "")}`}>
                    {log.action || "Unknown Action"}
                  </span>
                  <span className="text-[9.5px] font-mono text-zinc-500 font-semibold">{formatTimestamp(log.createdAt)}</span>
                </div>
                <p className="text-white text-xs">{log.details || "No details provided"}</p>
                <div className="flex items-center justify-between pt-1 text-[9.5px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#cfb53b]" />
                    <span className="truncate max-w-[120px] font-semibold">{log.adminEmail || "unknown@admin.com"}</span>
                  </span>
                  <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase text-[8.5px]">{log.category || "General"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECURITY MODAL: PURGE Activity Ledger Confirmation */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0b0a11] border border-white/10 max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 relative"
          >
            <button 
              onClick={() => { setShowPurgeModal(false); setPurgePasscode(""); }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-2">
              <span className="text-[9px] uppercase font-mono tracking-widest text-red-500">Security Clearance Level 3</span>
              <h3 className="text-xl font-serif text-white uppercase italic">Ledger Purging Request</h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                This action is irreversible. All entries in the Firebase activity audit collection will be deleted immediately.
              </p>
            </div>

            <form onSubmit={handlePurgeLogs} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">Admin Passcode To Authorize</label>
                <input
                  type="password"
                  required
                  value={purgePasscode}
                  onChange={(e) => setPurgePasscode(e.target.value)}
                  className="w-full bg-[#0a0910] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500/40 text-center font-mono font-bold tracking-widest"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowPurgeModal(false); setPurgePasscode(""); }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-xs uppercase font-bold tracking-widest text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purging}
                  className="flex-1 py-3 bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-400 hover:text-white rounded-xl text-xs uppercase font-bold tracking-[0.15em] flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {purging && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{purging ? "Purging Ledger..." : "Authorize Purge"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
