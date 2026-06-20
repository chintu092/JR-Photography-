import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, getDocs, setDoc, deleteDoc, doc, query, orderBy, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Plus, Trash2, Edit3, Clipboard, Check, RefreshCw, X, Eye, 
  Download, Search, Mail, FileText, Settings, ShieldAlert, Sparkles, MoveUp, MoveDown, Send, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FormField {
  id: string;
  name: string;
  type: "text" | "email" | "tel" | "date" | "select" | "textarea" | "checkbox";
  label: string;
  required: boolean;
  placeholder: string;
  options?: string; // Comma-separated for select/checkbox
  width?: "full" | "half" | "third" | "quarter";
}

interface WayficForm {
  id: string; // formId
  title: string;
  header?: string;
  fields: FormField[];
  mailto: string;
  subject: string;
  bodyTemplate: string;
  successMessage: string;
  createdAt?: any;
  updatedAt?: any;
}

interface WayficSubmission {
  id: string;
  formId: string;
  formTitle: string;
  data: Record<string, any>;
  status: "New" | "Pending" | "Replied";
  createdAt: any;
}

export default function WayficFormsManager() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [activeSubTab, setActiveSubTab] = useState<"forms" | "submissions">("forms");
  const [forms, setForms] = useState<WayficForm[]>([]);
  const [submissions, setSubmissions] = useState<WayficSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingForm, setEditingForm] = useState<Partial<WayficForm>>({
    id: "",
    title: "",
    fields: [
      { id: "f1", name: "your-name", type: "text", label: "Your Name", required: true, placeholder: "e.g., Isabella Rossi", width: "half" },
      { id: "f2", name: "your-email", type: "email", label: "Email Address", required: true, placeholder: "e.g., mail@isabellarossi.com", width: "half" },
      { id: "f3", name: "your-subject", type: "text", label: "Subject", required: false, placeholder: "Inquiry topic", width: "full" },
      { id: "f4", name: "your-message", type: "textarea", label: "Your Message", required: true, placeholder: "Write your requirements...", width: "full" }
    ],
    mailto: user?.email || "admin@wayfic.com",
    subject: "New Submission on [{form_title}]: {your-subject}",
    bodyTemplate: "<p><strong>Submitted Fields:</strong></p>\n<p>Name: {your-name}</p>\n<p>Email: {your-email}</p>\n<p>Subject: {your-subject}</p>\n<p>Message:<br/>{your-message}</p>",
    successMessage: "Thank you! Your inquiry was transmitted successfully."
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Submission Filter
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [formFilter, setFormFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<WayficSubmission | null>(null);

  // Submission Delete Confirmation dialog state
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  // Outbound Email templates states for Wayfic submissions
  const [emailTemplates, setEmailTemplates] = useState<Record<string, { subject: string, body: string }>>({
    Initial_Inquiry: { subject: "Thank you for reaching out!", body: "Hi {name},\n\nThank you for reaching out to JR Photography Studio!\n\nWe received your custom form submission regarding: {subject}.\n\nLet's coordinate on scheduling soon.\n\nWarmly,\nJR Team" },
    Booking_Confirmed: { subject: "Your Booking is Confirmed!", body: "Hi {name},\n\nWe are excited to confirm your photographic booking!\n\nWarmly,\nJR Team" },
    Follow_Up: { subject: "Following up on your inquiry", body: "Hi {name},\n\nJust checking in if you had any questions regarding your custom form enquiry: {subject}.\n\nWarmly,\nJR Team" }
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
        console.warn("Failed to load email templates from settings:", err);
      }
    };
    fetchTemplates();
  }, []);

  const applyTemplate = (sub: any, templateKey: string) => {
    const tpl = emailTemplates[templateKey];
    if (!tpl) {
      setReplySubject("");
      setReplyBody("");
      return;
    }
    let subSubject = tpl.subject;
    let subBody = tpl.body;

    const primaryName = sub.data.name || sub.data["your-name"] || sub.data["first-name"] || "there";
    const primaryEmail = sub.data.email || sub.data["your-email"] || "recipient@example.com";
    const rawSubject = sub.data.subject || sub.data["your-subject"] || "custom form submission";
    const rawDate = sub.data.bookingDate || sub.data["booking-date"] || "your requested date";

    const replacements: Record<string, string> = {
      "{name}": primaryName,
      "{subject}": rawSubject,
      "{date}": rawDate,
      "{email}": primaryEmail
    };

    for (const [key, val] of Object.entries(replacements)) {
      subSubject = subSubject.replaceAll(key, val);
      subBody = subBody.replaceAll(key, val);
    }

    setReplySubject(subSubject);
    setReplyBody(subBody);
  };

  useEffect(() => {
    if (selectedSubmission) {
      applyTemplate(selectedSubmission, selectedTemplateKey);
    }
  }, [selectedSubmission?.id, selectedTemplateKey, emailTemplates]);

  const handleSendReply = async () => {
    if (!selectedSubmission) return;
    const primaryEmail = selectedSubmission.data.email || selectedSubmission.data["your-email"] || "";
    if (!primaryEmail) {
      toast.error("No valid email address detected key in this submission.");
      return;
    }
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
          customRecipient: primaryEmail,
          mailSubject: replySubject,
          mailBody: replyBody.replace(/\n/g, "<br/>")
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Reply successfully sent via SMTP to ${primaryEmail}!`);
        setShowReplyForm(false);
      } else {
        toast.error(data.message || "Failed to deliver email through SMTP server.");
      }
    } catch (err: any) {
      console.error("Error sending response email via custom SMTP API:", err);
      toast.error(`Error sending email: ${err.message || err}`);
    } finally {
      setSendingReply(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch Forms
      const formsSnap = await getDocs(query(collection(db, "wayfic_forms"), orderBy("createdAt", "desc")));
      const fetchedForms = formsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WayficForm[];
      
      // If no forms, create a seed Contact form
      if (fetchedForms.length === 0) {
        const seedFormId = "contact";
        const seedForm: WayficForm = {
          id: seedFormId,
          title: "Wayfic Contact Form Beta",
          header: "SECURE SECRETS INQUIRY PORTAL",
          fields: [
            { id: "f1", name: "name", type: "text", label: "Your Full Name", required: true, placeholder: "e.g., Isabella Rossi", width: "half" },
            { id: "f2", name: "email", type: "email", label: "Email Address", required: true, placeholder: "e.g., mail@isabellarossi.com", width: "half" },
            { id: "f3", name: "subject", type: "text", label: "Campaign Subject Picker", required: false, placeholder: "e.g., Haute Couture Campaign 2026 Paris", width: "half" },
            { id: "f4", name: "bookingDate", type: "date", label: "Requested Consultation Date", required: false, placeholder: "dd/mm/yyyy", width: "half" },
            { id: "f5", name: "leadSource", type: "select", label: "How did you hear about us?", required: false, placeholder: "Please select...", options: "Unknown, Instagram, Referral, Google Search, Other", width: "full" },
            { id: "f6", name: "message", type: "textarea", label: "Project Details / Artistic Scope", required: true, placeholder: "Tell us about your creative requirements, scheduling scope, and target locations...", width: "full" }
          ],
          mailto: user?.email || "admin@wayfic.com",
          subject: "Inquiry from {name}: {subject}",
          bodyTemplate: "<p><strong>Aesthetic Campaign Inquiry Details:</strong></p>\n<ul>\n<li><strong>Name:</strong> {name}</li>\n<li><strong>Email:</strong> {email}</li>\n<li><strong>Subject:</strong> {subject}</li>\n<li><strong>Consultation:</strong> {bookingDate}</li>\n<li><strong>Source:</strong> {leadSource}</li>\n</ul>\n<p><strong>Artistic Scope:</strong></p>\n<p>{message}</p>",
          successMessage: "Inquiry secure: message transmitted successfully! Our agent squad will contact you in under 4 hours."
        };
        await setDoc(doc(db, "wayfic_forms", seedFormId), {
          ...seedForm,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        fetchedForms.push(seedForm);
      }

      setForms(fetchedForms);

      // Fetch Submissions
      const subSnap = await getDocs(query(collection(db, "wayfic_submissions"), orderBy("createdAt", "desc")));
      const fetchedSubs = subSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WayficSubmission[];
      setSubmissions(fetchedSubs);

    } catch (error: any) {
      console.error("Error loading Wayfic Forms payload:", error);
      toast.error(`Loading error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCopyShortcode = (formId: string) => {
    const code = `[wayfic-form id="${formId}"]`;
    navigator.clipboard.writeText(code);
    setCopiedId(formId);
    toast.success("Shortcode copied to system clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddFormField = () => {
    const newField: FormField = {
      id: "f_" + Math.random().toString(36).substr(2, 9),
      name: `field-${(editingForm.fields?.length || 0) + 1}`,
      type: "text",
      label: `Field Name ${(editingForm.fields?.length || 0) + 1}`,
      required: false,
      placeholder: "",
      width: "full"
    };
    setEditingForm({
      ...editingForm,
      fields: [...(editingForm.fields || []), newField]
    });
  };

  const handleRemoveField = (id: string) => {
    setEditingForm({
      ...editingForm,
      fields: (editingForm.fields || []).filter(f => f.id !== id)
    });
  };

  const handleFieldChange = (fieldId: string, updates: Partial<FormField>) => {
    setEditingForm({
      ...editingForm,
      fields: (editingForm.fields || []).map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const fields = [...(editingForm.fields || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    
    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;
    setEditingForm({ ...editingForm, fields });
  };

  const handleOpenCreateMode = () => {
    setEditorMode("create");
    setEditingForm({
      id: `form-${Math.random().toString(36).substr(2, 5)}`,
      title: "New Wayfic Custom Form",
      fields: [
        { id: "f1", name: "your-name", type: "text", label: "Your Name", required: true, placeholder: "e.g., Isabella Rossi" },
        { id: "f2", name: "your-email", type: "email", label: "Email Address", required: true, placeholder: "e.g., mail@isabellarossi.com" },
        { id: "f3", name: "your-message", type: "textarea", label: "Your Message", required: true, placeholder: "Write message here..." }
      ],
      mailto: user?.email || "admin@wayfic.com",
      subject: "Submission received: {your-name}",
      bodyTemplate: "<p>Name: {your-name}</p><p>Email: {your-email}</p><p>Message: {your-message}</p>",
      successMessage: "Thank you! Form has been submitted successfully."
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditMode = (form: WayficForm) => {
    setEditorMode("edit");
    setEditingForm({ ...form });
    setIsEditorOpen(true);
  };

  const saveForm = async () => {
    if (!editingForm.id || !editingForm.title) {
      toast.error("Please provide a values for Form Title and Identifier.");
      return;
    }

    // Sanitize Form ID key to match format required by system rules
    const formattedId = editingForm.id.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    
    setSaving(true);
    try {
      const docRef = doc(db, "wayfic_forms", formattedId);
      const payload = {
        ...editingForm,
        id: formattedId,
        updatedAt: serverTimestamp(),
        createdAt: editingForm.createdAt || serverTimestamp()
      };
      
      await setDoc(docRef, payload);
      toast.success("Wayfic Form model synchronized successfully!");
      setIsEditorOpen(false);
      fetchAllData();
    } catch (error: any) {
      console.error("Failed to sync Form details:", error);
      toast.error(`Database synchronization error: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, `wayfic_forms/${formattedId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteFormId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "wayfic_forms", deleteFormId));
      toast.success("Erase complete! Form successfully excised.");
      setForms(prev => prev.filter(f => f.id !== deleteFormId));
      setDeleteFormId(null);
    } catch (error: any) {
      console.error("Removal failure:", error);
      toast.error("Form removal error encountered.");
      handleFirestoreError(error, OperationType.WRITE, `wayfic_forms/${deleteFormId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!deleteSubId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, "wayfic_submissions", deleteSubId));
      toast.success("Submission successfully excised.");
      setSubmissions(prev => prev.filter(s => s.id !== deleteSubId));
      if (selectedSubmission?.id === deleteSubId) setSelectedSubmission(null);
      setDeleteSubId(null);
    } catch (error: any) {
      console.error("Failed to delete log trace:", error);
      toast.error("Removal database tracking error.");
      handleFirestoreError(error, OperationType.WRITE, `wayfic_submissions/${deleteSubId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Form ID", "Form Title", "Submitted Data JSON", "Status", "Timestamp"],
      ...submissions.map(s => [
        s.formId,
        s.formTitle || "Unknown",
        JSON.stringify(s.data).replace(/"/g, '""'),
        s.status || "New",
        s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : "Unspecified"
      ])
    ]
      .map(e => e.map(val => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wayfic_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  const filteredSubs = submissions.filter(sub => {
    const searchMatch = JSON.stringify(sub.data).toLowerCase().includes(submissionSearch.toLowerCase()) || 
                        sub.formId.toLowerCase().includes(submissionSearch.toLowerCase());
    const formFilterMatch = formFilter === "all" || sub.formId === formFilter;
    return searchMatch && formFilterMatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Upper header action area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-luxury-gold flex items-center gap-1.5 bg-luxury-gold/5 px-2 py-0.5 rounded-full border border-luxury-gold/20">
              <Sparkles className="w-3 h-3" />
              Dynamic Shortcodes CF7 Protocol
            </span>
          </div>
          <h2 className="text-3xl font-serif text-white uppercase tracking-wider">
            Wayfic Forms <span className="font-sans italic font-light text-luxury-gold text-lg normal-case">beta</span>
          </h2>
          <p className="text-zinc-500 text-xs">
            Administer, model, configure and track multi-purpose form components. Inject form shortcodes anywhere.
          </p>
        </div>

        {/* Dynamic selector triggers */}
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 border border-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab("forms")}
              className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                activeSubTab === "forms" 
                  ? "bg-[#141125] border border-[#2b215c] text-white" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Forms Builder
            </button>
            <button
              onClick={() => setActiveSubTab("submissions")}
              className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                activeSubTab === "submissions" 
                  ? "bg-[#141125] border border-[#2b215c] text-white" 
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Live Submissions ({submissions.length})
            </button>
          </div>
          
          {activeSubTab === "forms" && (
            <button
              onClick={handleOpenCreateMode}
              className="px-4 py-2.5 bg-[#846df7] hover:bg-[#6c51ef] text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Form</span>
            </button>
          )}

          {activeSubTab === "submissions" && (
            <button
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-12 h-12 border-2 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500 font-mono text-xs">Aesthetic structures loading...</p>
        </div>
      ) : activeSubTab === "forms" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card list */}
          <div className="lg:col-span-12 space-y-4">
            {forms.map(form => (
              <div 
                key={form.id} 
                className="bg-luxury-black/40 border border-white/5 hover:border-white/10 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative group overflow-hidden transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/2 rounded-full filter blur-3xl pointer-events-none" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-lg text-white font-bold">{form.title}</h3>
                    <code className="text-[10px] bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold rounded px-2 py-0.5 font-mono">
                      id="{form.id}"
                    </code>
                  </div>

                  {form.header && (
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#cfb53b]">
                      Header: <span className="text-zinc-300 font-sans italic tracking-normal lowercase normal-case">{form.header}</span>
                    </div>
                  )}
                  
                  {/* Shortcode widget rendering */}
                  <div className="flex items-center gap-2 bg-black/50 border border-white/5 p-2 rounded-xl max-w-md">
                    <span className="text-[11px] font-mono text-zinc-400 pl-1 select-all">
                      [wayfic-form id="{form.id}"]
                    </span>
                    <button
                      onClick={() => handleCopyShortcode(form.id)}
                      className="p-1 px-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] uppercase font-mono text-zinc-300 transition-all flex items-center gap-1 ml-auto"
                    >
                      {copiedId === form.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Clipboard className="w-3 h-3" />
                      )}
                      <span>{copiedId === form.id ? "COPIED" : "COPY"}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-zinc-500 font-mono">
                    Fields: {form.fields?.map(f => `${f.label} (${f.type})`).join(", ")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEditMode(form)}
                    className="p-3 bg-white/5 hover:bg-[#846df7]/10 hover:text-[#846df7] border border-white/5 rounded-2xl text-zinc-400 transition-all"
                    title="Edit form fields"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab("submissions");
                      setFormFilter(form.id);
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs border border-white/5 rounded-2xl text-zinc-300 font-semibold transition-all"
                  >
                    View Inquiries
                  </button>
                  {form.id !== "contact" && (
                    <button
                      onClick={() => setDeleteFormId(form.id)}
                      className="p-3 bg-rose-955/20 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5 rounded-2xl text-zinc-400 transition-all"
                      title="Erase form permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Submissions View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel filters & lists */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-luxury-black/40 border border-white/5 p-4 rounded-3xl space-y-3">
              {/* Filter Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block pl-1">Filter Form</label>
                  <select
                    value={formFilter}
                    onChange={(e) => setFormFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="all">All Wayfic Forms</option>
                    {forms.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 block pl-1">Search Fields</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search query..."
                      value={submissionSearch}
                      onChange={(e) => setSubmissionSearch(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 pl-8 text-xs text-white"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions items column list */}
            <div className="space-y-2 pr-1 max-h-[60vh] overflow-y-auto pretty-scrollbar">
              {filteredSubs.length === 0 ? (
                <div className="text-center py-12 p-6 bg-luxury-black/20 border border-white/5 rounded-2xl">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 text-xs">No matching inquiry logs track files found.</p>
                </div>
              ) : (
                filteredSubs.map(sub => {
                  const subDate = sub.createdAt?.toDate ? sub.createdAt.toDate().toLocaleString() : "Recently";
                  const primaryName = sub.data.name || sub.data["your-name"] || sub.data["first-name"] || "Anonymous submission";
                  const primaryEmail = sub.data.email || sub.data["your-email"] || "Missing Email address";
                  const isSelected = selectedSubmission?.id === sub.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#141125] border-[#2b215c]" 
                          : "bg-luxury-black/30 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] uppercase font-mono tracking-widest text-[#cfb53b]">
                          {sub.formId}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          {subDate}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-white truncate max-w-xs">{primaryName}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{primaryEmail}</p>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Right panel submission details detail */}
          <div className="lg:col-span-7">
            {selectedSubmission ? (
              <div className="bg-luxury-black/40 border border-white/5 p-6 md:p-8 rounded-3xl space-y-6 relative overflow-hidden animate-in fade-in duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/3 rounded-full filter blur-3xl pointer-events-none" />
                
                {/* Header detail */}
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold rounded-full px-2.5 py-0.5">
                      {selectedSubmission.formId}
                    </span>
                    <h3 className="font-serif text-lg text-white font-bold mt-2">
                      Inquiry Submission Detail
                    </h3>
                    <p className="text-zinc-500 text-[10px] font-mono">
                      Timestamp: {selectedSubmission.createdAt?.toDate ? selectedSubmission.createdAt.toDate().toString() : "Recently"}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteSubId(selectedSubmission.id)}
                    className="p-2.5 bg-red-955/20 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 rounded-xl border border-white/5 transition-all"
                    title="Exise this submission trace permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Submission core payload data rendered beautifully */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono uppercase text-[#cfb53b] tracking-wider">Submitted Form Payload</h4>
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 divide-y divide-white/5">
                    {Object.entries(selectedSubmission.data).map(([key, val]) => (
                      <div key={key} className="py-2.5 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                        <span className="sm:col-span-4 font-mono text-zinc-500 font-bold truncate select-all">{key}</span>
                        <span className="sm:col-span-8 text-white font-medium select-all whitespace-pre-wrap break-all">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Outbound Template Reply (SMTP) */}
                <div className="bg-[#0b0a11]/90 border border-white/10 rounded-2xl overflow-hidden shadow-lg mt-4">
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    type="button"
                    className="w-full flex items-center justify-between p-5 bg-white/[0.01] hover:bg-white/[0.03] text-left transition-colors cursor-pointer border-b border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-[#846df7]" />
                      <div>
                        <p className="text-xs uppercase font-mono text-[#846df7] font-bold tracking-wider">Outbound Template Reply (SMTP)</p>
                        <p className="text-[10px] text-zinc-500 font-sans">Draft customized emails via Outbound Mail Configuration directly from this submission.</p>
                      </div>
                    </div>
                    <span className="text-[#846df7] text-[10px] font-mono font-bold">
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
                        className="p-5 space-y-4 border-t border-white/5 bg-black/20"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-widest pl-0.5">Select Reply Preset Template</label>
                          <select
                            value={selectedTemplateKey}
                            onChange={(e) => setSelectedTemplateKey(e.target.value)}
                            className="w-full bg-[#0b0a11] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#846df7]"
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
                            className="w-full bg-[#0b0a11] border border-white/10 focus:border-[#846df7] focus:outline-none rounded-xl px-4 py-3 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold tracking-widest pl-0.5">Response Body (Placeholders auto-replaced)</label>
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Enter email response body..."
                            className="w-full h-40 bg-[#0b0a11] border border-white/10 focus:border-[#846df7] focus:outline-none rounded-xl p-4 text-xs text-luxury-cream transition-all placeholder:text-zinc-600 font-sans"
                          />
                        </div>

                        <button
                          onClick={handleSendReply}
                          disabled={sendingReply}
                          className="w-full bg-[#846df7] hover:bg-white hover:text-black text-white py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all cursor-pointer flex items-center justify-center gap-2 border border-transparent hover:border-white/10"
                        >
                          {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                          <span>{sendingReply ? "Dispatched Response..." : "Send Outbound Response via SMTP"}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#846df7]/10 hover:bg-[#846df7]/25 text-[#846df7] border border-[#846df7]/20 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{showReplyForm ? "Close Reply Draft" : "Reply via SMTP"}</span>
                  </button>
                  <a
                    href={`mailto:${selectedSubmission.data.email || selectedSubmission.data["your-email"] || ""}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all border border-white/5"
                  >
                    <span>Mailto Link</span>
                  </a>
                </div>

              </div>
            ) : (
              <div className="bg-luxury-black/20 border border-dashed border-white/10 rounded-3xl py-32 text-center text-zinc-500 space-y-3">
                <Eye className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs">Select any incoming form submission from the list to view full payload logs.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Editor Modal Sheet */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              className="bg-[#0b0a12] border border-white/5 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-y-auto pretty-scrollbar relative p-6 md:p-8 space-y-6 flex flex-col"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              
              {/* Editor Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4 shrink-0">
                <div>
                  <h3 className="font-serif text-xl text-white font-bold">
                    {editorMode === "create" ? "Model New Wayfic Form Beta" : "Modify Wayfic Form Protocol"}
                  </h3>
                  <p className="text-zinc-500 text-xs">Configure unique identifiers, dynamic aesthetic fields, and delivery coordinates.</p>
                </div>
                <button 
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Editor core splitter */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto py-1 pr-1 flex-1">
                
                {/* Visual Fields Builder */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-[#cfb53b]">Form Title *</label>
                      <input
                        type="text"
                        value={editingForm.title || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                        placeholder="e.g., Lead Contact Form"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-[#cfb53b]">Form ID Key *</label>
                      <input
                        type="text"
                        disabled={editorMode === "edit"}
                        value={editingForm.id || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, id: e.target.value })}
                        placeholder="e.g., custom-contact-form"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-luxury-gold disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono uppercase text-[#cfb53b]">Form Header *</label>
                        <span className="text-[9px] font-mono text-zinc-500">Public Display Heading</span>
                      </div>
                      <input
                        type="text"
                        value={editingForm.header || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, header: e.target.value })}
                        placeholder="e.g., SECURE SECRETS INQUIRY PORTAL"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-luxury-gold"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">Copy Shortcode</label>
                      <div className="w-full h-[42px] bg-[#14121d] border border-white/5 rounded-xl px-3 text-xs text-zinc-400 font-mono flex items-center justify-between">
                        <span className="truncate mr-2">[wayfic-form id="{editingForm.id || "new-form"}"]</span>
                        {editingForm.id && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`[wayfic-form id="${editingForm.id}"]`);
                              toast.success("Shortcode copied!");
                            }}
                            className="text-[9px] shrink-0 font-mono uppercase tracking-widest text-[#cfb53b] hover:underline"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <h4 className="text-[11px] font-mono uppercase text-luxury-cream tracking-widest pl-1">Form Field Definitions</h4>
                      <button
                        type="button"
                        onClick={handleAddFormField}
                        className="text-[10px] font-mono tracking-wide text-luxury-gold uppercase hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Field</span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pretty-scrollbar pr-1">
                      {editingForm.fields?.map((field, idx) => (
                        <div 
                          key={field.id} 
                          className="p-4 bg-white/3 border border-white/5 rounded-2xl space-y-3 relative group/field"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-zinc-500">Field #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveField(idx, "up")}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (editingForm.fields?.length || 0) - 1}
                                onClick={() => moveField(idx, "down")}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveField(field.id)}
                                className="p-1 px-2.5 bg-red-950/20 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-white/5 rounded-lg text-[9px] uppercase font-mono transition-all ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[9px] font-mono uppercase text-zinc-500">Public Label</label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => handleFieldChange(field.id, { label: e.target.value })}
                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                              />
                            </div>
                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[9px] font-mono uppercase text-zinc-500">Input Tag ID (CF7 name)</label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) => handleFieldChange(field.id, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white font-mono"
                              />
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-[9px] font-mono uppercase text-zinc-500">Field Type</label>
                              <select
                                value={field.type}
                                onChange={(e: any) => handleFieldChange(field.id, { type: e.target.value })}
                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                              >
                                <option value="text">Text Block</option>
                                <option value="email">Email</option>
                                <option value="tel">Phone</option>
                                <option value="date">Date</option>
                                <option value="select">Selection Dropdown</option>
                                <option value="textarea">Large Text Area</option>
                                <option value="checkbox">Checkboxes</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-[9px] font-mono uppercase text-zinc-500">Placeholder Text</label>
                              <input
                                type="text"
                                value={field.placeholder}
                                onChange={(e) => handleFieldChange(field.id, { placeholder: e.target.value })}
                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <label className="text-[9px] font-mono uppercase text-zinc-500">Field Width</label>
                              <select
                                value={field.width || "full"}
                                onChange={(e: any) => handleFieldChange(field.id, { width: e.target.value })}
                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                              >
                                <option value="full">Full Width (100%)</option>
                                <option value="half">Half Width (50%)</option>
                                <option value="third">One Third (33%)</option>
                                <option value="quarter">One Quarter (25%)</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3 flex items-center pr-2 pt-4">
                              <label className="flex items-center space-x-2 text-[10px] font-mono uppercase text-zinc-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => handleFieldChange(field.id, { required: e.target.checked })}
                                  className="rounded border-zinc-700 bg-zinc-900 text-luxury-gold focus:ring-0 cursor-pointer"
                                />
                                <span>Mandatory *</span>
                              </label>
                            </div>
                          </div>

                          {(field.type === "select" || field.type === "checkbox") && (
                            <div className="space-y-1 pt-1">
                              <label className="text-[9px] font-mono uppercase text-zinc-500 pl-1">
                                Options List (Comma-separated, e.g., Instagram, Referral, Google)
                              </label>
                              <input
                                type="text"
                                value={field.options || ""}
                                onChange={(e) => handleFieldChange(field.id, { options: e.target.value })}
                                placeholder="Option 1, Option 2, Option 3"
                                className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-xs text-white"
                              />
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Email Delivery Tab Configuration */}
                <div className="lg:col-span-5 bg-white/2 border border-white/5 p-6 rounded-3xl space-y-5">
                  <div className="space-y-1 pb-2 border-b border-white/5">
                    <h3 className="font-serif text-sm font-semibold text-[#cfb53b] uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Email Notification Protocol
                    </h3>
                    <p className="text-[10px] text-zinc-500">CF7-style routing variables format tags: <code>{`{field-name}`}</code>.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-zinc-500">Deliver To Recipient Address</label>
                      <input
                        type="email"
                        value={editingForm.mailto || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, mailto: e.target.value })}
                        placeholder="e.g., admin@wayfic.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-zinc-500">Email Subject Line</label>
                      <input
                        type="text"
                        value={editingForm.subject || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, subject: e.target.value })}
                        placeholder="e.g., Inquiry from {name}: {subject}"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-zinc-500">HTML Mail Body Blueprint</label>
                      <textarea
                        rows={7}
                        value={editingForm.bodyTemplate || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, bodyTemplate: e.target.value })}
                        placeholder="<p>Name: {name}</p>\n<p>Message: {message}</p>"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white font-mono leading-relaxed"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase text-zinc-500">Visual Success Response Feedback Message</label>
                      <input
                        type="text"
                        value={editingForm.successMessage || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, successMessage: e.target.value })}
                        placeholder="We received your message successfully."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Action Buttons footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveForm}
                  disabled={saving}
                  className="px-6 py-2.5 bg-luxury-gold hover:bg-[#cfb53b]/90 text-luxury-black rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center space-x-2"
                >
                  {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{saving ? "SAVING..." : "SAVE FORM"}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Absolute state-driven Custom Confirmation Modals for Form & Submission Deletion */}
      <AnimatePresence>
        {deleteFormId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0c15] border border-rose-500/20 max-w-sm w-full rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/25 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-lg font-bold text-white uppercase tracking-wider">Confirm Form Deletion</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Are you completely sure you want to permanently erase the form <code className="text-rose-400">{deleteFormId}</code>? This action violates integrity schemas and is completely irreversible.
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteFormId(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteForm}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteSubId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e0c15] border border-rose-500/20 max-w-sm w-full rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/25 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-5 h-5 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-lg font-bold text-white uppercase tracking-wider">Decommission Inquiry</h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Verify: erase this specific form submission trace permanently? This record will be decommissioned from the database.
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteSubId(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmission}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black transition-all"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
