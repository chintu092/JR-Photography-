import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Loader2, Trash2, Download, Search, Mail, Eye, Calendar, User, Check, Sparkles, Copy, Archive, Bell, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LeadItem {
  id: string;
  name: string;
  email: string;
  bookingDate: string;
  subject: string;
  message: string;
  createdAt: any;
  status?: string;
  notes?: string;
  followUpDate?: string;
}

export default function LeadManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewLead, setViewLead] = useState<LeadItem | null>(null);
  const [activeView, setActiveView] = useState<"active" | "archived">("active");
  const [notesDraft, setNotesDraft] = useState("");
  const [followUpDateDraft, setFollowUpDateDraft] = useState("");

  // Outbound Email templates states
  const [emailTemplates, setEmailTemplates] = useState<Record<string, { subject: string, body: string }>>({
    Initial_Inquiry: { subject: "Thank you for reaching out!", body: "Hi {name},\n\nThank you for reaching out to JR Photography Studio!\n\nWe received your message regarding: {subject}.\n\nLet's coordinate on schedule dates soon.\n\nWarmly,\nJR Team" },
    Booking_Confirmed: { subject: "Your Booking is Confirmed!", body: "Hi {name},\n\nWe are excited to confirm your photographic booking!\n\nDetails:\n- Project: {subject}\n- Scheduled Frame: {date}\n\nWarmly,\nJR Team" },
    Follow_Up: { subject: "Following up on your inquiry", body: "Hi {name},\n\nJust checking in if you had any questions regarding your enquiry for: {subject}.\n\nWarmly,\nJR Team" }
  });
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("Initial_Inquiry");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const templatesSnap = await getDoc(doc(db, "settings", "email_templates"));
        if (templatesSnap.exists()) {
          const data = templatesSnap.data() as any;
          if (data.templates) {
            setEmailTemplates(prev => ({
              ...prev,
              ...data.templates
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to load email templates from settings, utilizing defaults:", err);
      }
    };
    fetchTemplates();
  }, []);

  const applyTemplate = (lead: LeadItem, templateKey: string) => {
    const tpl = emailTemplates[templateKey];
    if (!tpl) {
      setReplySubject("");
      setReplyBody("");
      return;
    }
    let sub = tpl.subject;
    let body = tpl.body;

    const replacements: Record<string, string> = {
      "{name}": lead.name || "there",
      "{subject}": lead.subject || "your inquiry",
      "{date}": lead.bookingDate || "your requested date",
      "{email}": lead.email || ""
    };

    for (const [key, val] of Object.entries(replacements)) {
      sub = sub.replaceAll(key, val);
      body = body.replaceAll(key, val);
    }

    setReplySubject(sub);
    setReplyBody(body);
  };

  useEffect(() => {
    if (viewLead) {
      applyTemplate(viewLead, selectedTemplateKey);
    }
  }, [viewLead?.id, selectedTemplateKey, emailTemplates]);

  const handleSendReply = async () => {
    if (!viewLead) return;
    if (!replySubject.trim() || !replyBody.trim()) {
      toast.warn("Subject and Body cannot be empty.");
      return;
    }

    setSendingReply(true);
    try {
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customRecipient: viewLead.email,
          mailSubject: replySubject,
          mailBody: replyBody.replace(/\n/g, "<br/>")
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Reply successfully dispatched via SMTP to ${viewLead.email}!`);
        setShowReplyForm(false);
        if (viewLead.status !== "Contacted" && viewLead.status !== "Booked") {
          await handleUpdateStatus(viewLead.id, "Contacted");
        }
      } else {
        toast.error(data.message || "Failed to deliver email through SMTP server.");
      }
    } catch (err: any) {
      console.error("Error sending reply via custom SMTP API:", err);
      toast.error(`Error sending email: ${err.message || err}`);
    } finally {
      setSendingReply(false);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as LeadItem[];
      
      setItems(fetched);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast.error(`Failed to fetch leads: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "contacts", id), { status: newStatus });
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Status updated to ${newStatus}.`);

      const leadName = items.find(i => i.id === id)?.name || "Unknown Lead";
      await addDoc(collection(db, "activity_logs"), {
        action: `Updated Lead Status`,
        category: "leads",
        details: `Changed status to ${newStatus} for ${leadName}.`,
        createdAt: serverTimestamp(),
        adminEmail: user?.email || "Unknown",
        adminUid: user?.uid || "Unknown"
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(`Failed to update status.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!viewLead) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "contacts", viewLead.id), { 
        notes: notesDraft,
        followUpDate: followUpDateDraft 
      });
      setItems(prev => prev.map(item => item.id === viewLead.id ? { 
        ...item, 
        notes: notesDraft,
        followUpDate: followUpDateDraft
      } : item));
      setViewLead({ ...viewLead, notes: notesDraft, followUpDate: followUpDateDraft });
      toast.success("Notes & settings saved successfully.");

      await addDoc(collection(db, "activity_logs"), {
        action: `Updated Lead Details`,
        category: "leads",
        details: `Updated notes/reminders for ${viewLead.name}.`,
        createdAt: serverTimestamp(),
        adminEmail: user?.email || "Unknown",
        adminUid: user?.uid || "Unknown"
      });
    } catch (error: any) {
      console.error("Error saving notes:", error);
      toast.error(`Failed to save notes.`);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "contacts", deleteId));
      setItems(prev => prev.filter(item => item.id !== deleteId));
      toast.success("Lead successfully removed.");
      setDeleteId(null);
      if (viewLead?.id === deleteId) {
        setViewLead(null);
      }
    } catch (error: any) {
      console.error("Error removing lead:", error);
      toast.error(`Failed to remove lead: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, `contacts/${deleteId}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const isArchived = item.status === "Archived";
    
    // Filter by view
    if (activeView === "active" && isArchived) return false;
    if (activeView === "archived" && !isArchived) return false;

    // Filter by search query
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.bookingDate || "").toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.error("No leads to export.");
      return;
    }

    const csvContent = [
      ["ID", "Name", "Email", "Wedding Date", "Status", "Subject", "Message", "Submitted At"],
      ...filteredItems.map(item => [
        item.id,
        item.name || "",
        item.email || "",
        item.bookingDate || "",
        item.status || "New",
        item.subject || "",
        item.message || "",
        item.createdAt ? formatTimestamp(item.createdAt) : "N/A"
      ])
    ]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export initiated successfully.");
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

  const newLeads = items.filter(item => !item.status || item.status === "New").length;
  const pendingResponses = items.filter(item => item.status === "Contacted").length;
  const totalBookings = items.filter(item => item.status === "Booked").length;

  return (
    <section className="space-y-6 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">Lead Management</h2>
          <p className="text-luxury-cream/40 text-sm">View and manage booking inquiries and leads from the contact form.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={fetchItems}
            disabled={loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 cursor-pointer disabled:opacity-40 transition-all"
          >
            Refresh
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0a11]/90 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">New Leads</p>
            <p className="text-3xl font-serif text-white">{newLeads}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#cfb53b]/10 flex items-center justify-center text-[#cfb53b] border border-[#cfb53b]/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0b0a11]/90 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Pending Responses</p>
            <p className="text-3xl font-serif text-white">{pendingResponses}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Mail className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0b0a11]/90 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Total Bookings</p>
            <p className="text-3xl font-serif text-white">{totalBookings}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Top Controls: Search & View Toggles */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, email, or wedding date..."
              className="w-full bg-luxury-black/40 border border-white/5 hover:border-luxury-gold/40 focus:border-luxury-gold focus:outline-none rounded-2xl pl-12 pr-6 py-4 text-sm text-luxury-cream transition-all placeholder:text-zinc-600 font-sans"
            />
          </div>
          
          <div className="flex bg-[#0b0a11] border border-white/10 rounded-xl p-1 self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveView("active")}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeView === "active" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Active Leads
            </button>
            <button
              onClick={() => setActiveView("archived")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                activeView === "archived" ? "bg-white/10 text-[#cfb53b]" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archived</span>
            </button>
          </div>
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
                    <th className="py-4 px-6 font-semibold">Lead Details</th>
                    <th className="py-4 px-6 font-semibold">Contact & Dates</th>
                    <th className="py-4 px-6 font-semibold hidden lg:table-cell">Status</th>
                    <th className="py-4 px-6 font-semibold hidden xl:table-cell">Submitted At</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${
                      item.followUpDate && new Date(item.followUpDate) <= new Date() && item.status !== "Archived" && item.status !== "Booked" ? 'border-l-2 border-l-red-500 bg-red-500/[0.02]' : ''
                    }`}>
                      <td className="py-4 px-6 text-white font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                            item.followUpDate && new Date(item.followUpDate) <= new Date() && item.status !== "Archived" && item.status !== "Booked"
                            ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                            : 'bg-luxury-gold/5 border-luxury-gold/10 group-hover:border-luxury-gold/30 text-luxury-gold'
                          }`}>
                            {item.followUpDate && new Date(item.followUpDate) <= new Date() && item.status !== "Archived" && item.status !== "Booked" 
                              ? <Bell className="w-4 h-4 animate-pulse" />
                              : <User className="w-4 h-4" />
                            }
                          </div>
                          <div>
                            <span className="font-semibold block text-sm">{item.name || "Unknown"}</span>
                            <span className="text-[10px] text-zinc-500 font-sans truncate block max-w-[150px] sm:max-w-[200px]" title={item.subject}>{item.subject || "No Subject"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            <a href={`mailto:${item.email}`} className="hover:text-luxury-gold transition-colors block max-w-[120px] truncate">{item.email}</a>
                            <button onClick={() => copyToClipboard(item.email)} className="text-zinc-500 hover:text-white transition-colors" title="Copy Email"><Copy className="w-3 h-3" /></button>
                          </div>
                          {item.bookingDate && (
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
                              <Calendar className="w-3 h-3" />
                              <span>{item.bookingDate}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <div className="relative">
                          <select
                            value={item.status || "New"}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-lg border focus:outline-none appearance-none cursor-pointer pr-6 ${
                              item.status === 'Archived' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                              item.status === 'Booked' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              item.status === 'Contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-luxury-gold/10 text-luxury-gold border-luxury-gold/20'
                            }`}
                          >
                            <option value="New" className="bg-[#0b0a11] text-luxury-gold">New</option>
                            <option value="Contacted" className="bg-[#0b0a11] text-blue-400">Contacted</option>
                            <option value="Booked" className="bg-[#0b0a11] text-emerald-400">Booked</option>
                            <option value="Archived" className="bg-[#0b0a11] text-zinc-400">Archived</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-zinc-400 font-medium hidden xl:table-cell">
                        {formatTimestamp(item.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setViewLead(item);
                              setNotesDraft(item.notes || "");
                              setFollowUpDateDraft(item.followUpDate || "");
                              setShowReplyForm(false);
                              setSelectedTemplateKey("Initial_Inquiry");
                            }}
                            className="p-2 bg-white/5 hover:bg-[#cfb53b]/10 text-zinc-400 hover:text-[#cfb53b] border border-white/5 hover:border-[#cfb53b]/20 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="View/Edit Lead Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status !== "Archived" ? (
                             <button
                              onClick={() => handleUpdateStatus(item.id, "Archived")}
                              className="p-2 bg-white/5 hover:bg-zinc-500/10 text-zinc-400 hover:text-zinc-300 border border-white/5 hover:border-zinc-500/20 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Archive Lead"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                             <button
                              onClick={() => handleUpdateStatus(item.id, "New")}
                              className="p-2 bg-white/5 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Restore Lead"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-2 bg-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-zinc-500 font-sans text-sm font-medium italic">
                        {searchQuery ? "No leads match your search criteria." : "No leads received yet."}
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
                  Are you sure you want to delete lead <span className="text-luxury-gold font-mono break-all">{items.find(i => i.id === deleteId)?.name}</span>?
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

      {/* View Lead Modal */}
      <AnimatePresence>
        {viewLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setViewLead(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0b0a11] border border-white/5 w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#cfb53b]/5 to-transparent pointer-events-none" />
              
              <div className="p-6 md:p-8 flex items-start justify-between border-b border-white/5 relative z-10 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#cfb53b] mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Inquiry Record</span>
                  </div>
                  <h3 className="text-2xl font-serif text-white">{viewLead.name || "Unknown"}</h3>
                  <p className="text-xs text-zinc-500 font-mono">{viewLead.email}</p>
                </div>
                <button
                  onClick={() => setViewLead(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors cursor-pointer"
                >
                  X
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto relative z-10 flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Wedding Date</p>
                    <div className="flex items-center gap-2 text-zinc-300 text-sm">
                      <Calendar className="w-4 h-4 text-[#cfb53b]" />
                      <span>{viewLead.bookingDate || <span className="text-zinc-600 italic">Not specified</span>}</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Received</p>
                    <p className="text-zinc-300 text-sm">{formatTimestamp(viewLead.createdAt)}</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Subject</p>
                  <p className="text-white font-medium">{viewLead.subject || <span className="text-zinc-600 italic">No subject</span>}</p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-3">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Message</p>
                  <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {viewLead.message || <span className="text-zinc-600 italic">No message content.</span>}
                  </div>
                </div>

                <div className="bg-[#cfb53b]/5 border border-[#cfb53b]/20 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] uppercase text-[#cfb53b] font-bold tracking-widest">Private Notes / Meeting Summary</p>
                    <div className="flex items-center gap-2 border border-[#cfb53b]/20 bg-black/40 rounded-lg px-3 py-1.5 focus-within:border-[#cfb53b] transition-colors">
                      <Bell className="w-3.5 h-3.5 text-[#cfb53b]/60" />
                      <input 
                        type="date"
                        value={followUpDateDraft}
                        onChange={(e) => setFollowUpDateDraft(e.target.value)}
                        className="bg-transparent border-none text-xs text-white focus:outline-none placeholder:text-zinc-600 appearance-none outline-none"
                        title="Set Follow-Up Reminder"
                      />
                    </div>
                  </div>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Add private annotations, meeting details, or follow-up notes here..."
                    className="w-full h-32 bg-black/40 border border-[#cfb53b]/20 focus:border-[#cfb53b] focus:outline-none rounded-xl p-4 text-sm text-luxury-cream transition-all placeholder:text-zinc-600 font-sans resize-none"
                  />
                </div>

                {/* Collapsible Outbound Mail Reply Form using Templates & SMTP */}
                <div className="bg-[#0b0a11]/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    type="button"
                    className="w-full flex items-center justify-between p-5 bg-white/[0.01] hover:bg-white/[0.03] text-left transition-colors cursor-pointer border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#cfb53b]" />
                      <div>
                        <p className="text-xs uppercase font-mono text-[#cfb53b] font-bold tracking-wider">Outbound Template Reply (SMTP)</p>
                        <p className="text-[10px] text-zinc-500 font-sans">Draft responsive, secure correspondences directly through SMTP gateway settings.</p>
                      </div>
                    </div>
                    <span className="text-[#cfb53b] text-[10px] font-mono font-bold">
                      {showReplyForm ? "COLLAPSE [-]" : "EXPAND DRAFT [+]"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showReplyForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="p-5 space-y-4 border-t border-white/5 bg-black/20 animate-in fade-in duration-300"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-widest pl-0.5">Select Reply Preset Template</label>
                          <select
                            value={selectedTemplateKey}
                            onChange={(e) => setSelectedTemplateKey(e.target.value)}
                            className="w-full bg-[#0b0a11] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#cfb53b]"
                          >
                            <option value="Initial_Inquiry">Initial Inquiry Response</option>
                            <option value="Booking_Confirmed">Booking Confirmation Letter</option>
                            <option value="Follow_Up">Friendly Follow-Up Check</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-widest pl-0.5">Response Subject</label>
                          <input
                            type="text"
                            value={replySubject}
                            onChange={(e) => setReplySubject(e.target.value)}
                            placeholder="Draft email subject line..."
                            className="w-full bg-[#0b0a11] border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-widest pl-0.5">Response Body (Placeholders auto-replaced)</label>
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Enter email response body..."
                            className="w-full h-40 bg-[#0b0a11] border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl p-4 text-xs text-luxury-cream transition-all placeholder:text-zinc-600 font-sans"
                          />
                        </div>

                        <button
                          onClick={handleSendReply}
                          disabled={sendingReply}
                          className="w-full bg-[#cfb53b] hover:bg-white text-black py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Send className="w-3.5 h-3.5 text-black" />}
                          <span>{sendingReply ? "Dispatched Response..." : "Send Outbound Response via SMTP"}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="p-6 md:p-8 border-t border-white/5 bg-black/20 flex flex-wrap gap-3 justify-end shrink-0 relative z-10">
                 <button
                  onClick={handleSaveNotes}
                  disabled={saving || (notesDraft === (viewLead.notes || "") && followUpDateDraft === (viewLead.followUpDate || ""))}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 border border-white/5"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Notes</span>
                </button>
                 <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="px-5 py-2.5 bg-[#cfb53b]/10 hover:bg-[#cfb53b]/20 text-[#cfb53b] border border-[#cfb53b]/20 hover:border-[#cfb53b]/40 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{showReplyForm ? "Close Reply Form" : "Reply via SMTP"}</span>
                </button>
                 <a
                  href={`mailto:${viewLead.email}`}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/5"
                >
                  <span>Mailto link</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
