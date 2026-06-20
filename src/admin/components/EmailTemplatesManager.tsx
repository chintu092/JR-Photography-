import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { 
  Loader2, Mail, Check, AlignLeft, Edit3, Trash2, 
  Server, Send, Terminal, Eye, EyeOff, AlertTriangle, Play
} from "lucide-react";

export default function EmailTemplatesManager() {
  const { user } = useAuth();
  const toast = useToast();
  
  // Navigation for tab switcher: "templates" or "smtp"
  const [activeSubTab, setActiveSubTab] = useState<"templates" | "smtp">("templates");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Template States
  const [templates, setTemplates] = useState<Record<string, { subject: string, body: string }>>({
    Initial_Inquiry: { subject: "Thank you for reaching out!", body: "Hi {name},\n\nThank you for reaching out..." },
    Booking_Confirmed: { subject: "Your Booking is Confirmed!", body: "Hi {name},\n\nWe are excited to confirm your booking for {date}..." },
    Follow_Up: { subject: "Following up on your inquiry", body: "Hi {name},\n\nJust checking in..." }
  });
  const [activeTemplate, setActiveTemplate] = useState("Initial_Inquiry");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");

  // SMTP Gateway States
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("JR Photography Studio");
  const [showPassword, setShowPassword] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);

  // Testing Interface States
  const [testRecipient, setTestRecipient] = useState("");
  const [testSubject, setTestSubject] = useState("SMTP Delivery Check - JR Photography Studio");
  const [testBody, setTestBody] = useState("Greetings!\n\nThis is a diagnostic connection test message sent from the live Admin panel of JR Photography Studio.\n\nWarm regards,\nJR Team.");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpLogs, setSmtpLogs] = useState<string[]>([]);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      // Load templates
      const templatesSnap = await getDoc(doc(db, "settings", "email_templates"));
      if (templatesSnap.exists()) {
        const data = templatesSnap.data() as any;
        if (data.templates) {
          setTemplates(data.templates);
        }
      }

      // Load SMTP configs
      const smtpSnap = await getDoc(doc(db, "settings", "smtp"));
      if (smtpSnap.exists()) {
        const data = smtpSnap.data() as any;
        setSmtpHost(data.host || "");
        setSmtpPort(data.port || "587");
        setSmtpUsername(data.username || "");
        setSmtpPassword(data.password || "");
        setSmtpSecure(data.secure === true);
        setSmtpFromEmail(data.fromEmail || "");
        setSmtpFromName(data.fromName || "JR Photography Studio");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load configurations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (templates[activeTemplate]) {
      setDraftSubject(templates[activeTemplate].subject);
      setDraftBody(templates[activeTemplate].body);
    }
  }, [activeTemplate, templates]);

  // Saves Email templates
  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = {
        ...templates,
        [activeTemplate]: { subject: draftSubject, body: draftBody }
      };
      await setDoc(doc(db, "settings", "email_templates"), { templates: updated }, { merge: true });
      setTemplates(updated);
      toast.success("Template saved successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  // Saves SMTP config
  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      await setDoc(doc(db, "settings", "smtp"), {
        host: smtpHost,
        port: smtpPort,
        username: smtpUsername,
        password: smtpPassword,
        secure: smtpSecure,
        fromEmail: smtpFromEmail,
        fromName: smtpFromName
      }, { merge: true });
      toast.success("SMTP Configuration saved successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save SMTP configuration.");
    } finally {
      setSavingSmtp(false);
    }
  };

  // Triggers live SMTP test call on Custom Server
  const handleSendTestMail = async () => {
    if (!smtpHost) {
      toast.warn("Please enter an SMTP Host first.");
      return;
    }
    if (!smtpPort) {
      toast.warn("Please specify an SMTP Port (e.g. 587 or 465).");
      return;
    }
    if (!testRecipient) {
      toast.warn("Please enter a Recipient Email address.");
      return;
    }

    setTestingSmtp(true);
    setSmtpLogs(["[CLIENT] Preparing test dispatch...", "[CLIENT] Requesting secure loop to Express SMTP backend..."]);
    setTestSuccess(null);

    try {
      const response = await fetch("/api/mail/test-smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          username: smtpUsername,
          password: smtpPassword,
          secure: smtpSecure,
          fromEmail: smtpFromEmail,
          fromName: smtpFromName,
          toEmail: testRecipient,
          subject: testSubject,
          body: testBody
        })
      });

      const resData = await response.json();
      if (resData.logs) {
        setSmtpLogs(resData.logs);
      } else {
        setSmtpLogs(prev => [...prev, `[CLIENT] Connection response status: ${response.status}`]);
      }

      if (resData.success) {
        setTestSuccess(true);
        toast.success("SMTP Test email dispatched successfully!");
      } else {
        setTestSuccess(false);
        toast.error(resData.message || "SMTP server connection failed.");
      }
    } catch (err: any) {
      console.error(err);
      setSmtpLogs(prev => [...prev, `[FATAL] Local request sequence aborted: ${err.message}`]);
      setTestSuccess(false);
      toast.error("Failed to establish outbound connector endpoint request.");
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Tab Header System */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">Outbound Mail Configuration</h2>
          <p className="text-luxury-cream/40 text-sm">Control automated correspondences, lead signatures and live SMTP deliverability gates.</p>
        </div>

        {/* Sub-tab selection filters */}
        <div className="flex bg-black/40 p-1 border border-white/5 rounded-xl shrink-0">
          <button
            onClick={() => setActiveSubTab("templates")}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold transition-all rounded-lg ${
              activeSubTab === "templates"
              ? "bg-[#cfb53b]/10 text-[#cfb53b] border border-[#cfb53b]/20"
              : "text-zinc-400 hover:text-white"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveSubTab("smtp")}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-semibold transition-all rounded-lg flex items-center gap-2 ${
              activeSubTab === "smtp"
              ? "bg-[#cfb53b]/10 text-[#cfb53b] border border-[#cfb53b]/20"
              : "text-zinc-400 hover:text-white"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            SMTP Gateway
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
        </div>
      ) : activeSubTab === "templates" ? (
        /* ==================== TEMPLATES TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 border border-white/5 bg-[#0b0a11] rounded-2xl p-4 flex flex-col gap-2">
            <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Lead Stages</h3>
            {Object.keys(templates).map(key => (
              <button
                key={key}
                onClick={() => setActiveTemplate(key)}
                className={`text-left px-4 py-3 rounded-xl transition-all ${
                  activeTemplate === key 
                  ? 'bg-[#cfb53b]/10 text-[#cfb53b] border border-[#cfb53b]/20 font-bold' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {key.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 border border-white/5 bg-[#0b0a11] rounded-2xl p-6 flex flex-col gap-5">
            <div className="space-y-2 border-b border-white/5 pb-4">
              <h3 className="text-xl font-serif text-white">{activeTemplate.replace('_', ' ')}</h3>
              <p className="text-xs text-zinc-500 font-mono">Variables available: &#123;name&#125;, &#123;email&#125;, &#123;date&#125;</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Email Subject</label>
              <input
                type="text"
                value={draftSubject}
                onChange={(e) => setDraftSubject(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all font-sans"
              />
            </div>

            <div className="space-y-2 flex-grow">
              <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Email Body</label>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                className="w-full h-[250px] bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl p-4 py-3 text-sm text-white transition-all font-mono resize-none leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end shrink-0">
               <button
                  onClick={handleSave}
                  disabled={saving || (draftSubject === templates[activeTemplate].subject && draftBody === templates[activeTemplate].body)}
                  className="px-6 py-3 bg-[#cfb53b] hover:bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Template</span>
                </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== SMTP GATEWAY TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* SMTP Configuration column */}
          <div className="lg:col-span-3 border border-white/5 bg-[#0b0a11] rounded-2xl p-6 flex flex-col gap-5">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-serif text-white">SMTP Server Settings</h3>
              <p className="text-xs text-zinc-500">Configure parameters to route outbound email dispatches via a dedicated relay server.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">SMTP Host</label>
                <input
                  type="text"
                  placeholder="e.g. smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">SMTP Port</label>
                <input
                  type="text"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-xs font-semibold text-white">Require SSL / TLS (Secure Port)</label>
                  <p className="text-[10px] text-zinc-500">Port 465 typically requires SSL encryption, while Port 587 uses STARTTLS.</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${smtpSecure ? "bg-[#cfb53b]" : "bg-white/10"}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${smtpSecure ? "transform translate-x-4" : ""}`}></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">SMTP Username</label>
                <input
                  type="text"
                  placeholder="e.g. sender@gmail.com"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">SMTP Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter SMTP password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl pl-4 pr-10 py-3 text-sm text-white transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">From Email Address</label>
                <input
                  type="email"
                  placeholder="sender@domain.com"
                  value={smtpFromEmail}
                  onChange={(e) => setSmtpFromEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest block">From Name (Signature)</label>
                <input
                  type="text"
                  placeholder="JR Photography Studio"
                  value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-3 text-sm text-white transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={handleSaveSmtp}
                disabled={savingSmtp || !smtpHost}
                className="px-6 py-3 bg-[#cfb53b] hover:bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
              >
                {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save SMTP Configuration</span>
              </button>
            </div>
          </div>

          {/* Test connection column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Live Test Console */}
            <div className="border border-white/5 bg-[#0b0a11] rounded-2xl p-6 flex flex-col gap-4">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-base font-serif text-white">WP-SMTP Delivery Tester</h3>
                <p className="text-[11px] text-zinc-500">Dispatch a live test email through your customized relay credentials to verify indexing.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">Recipient Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. administrator@gmail.com"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">Test Subject</label>
                  <input
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">Message Draft</label>
                  <textarea
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#cfb53b] focus:outline-none rounded-xl px-4 py-2 text-xs text-white transition-all font-sans resize-none"
                  />
                </div>

                <button
                  onClick={handleSendTestMail}
                  disabled={testingSmtp || !testRecipient || !smtpHost}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-650 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {testingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Execute Diagnostic Connection</span>
                </button>
              </div>
            </div>

            {/* Terminal Live Debug Logs Console Output */}
            <div className="border border-white/5 bg-[#06050a] rounded-2xl p-5 flex-grow flex flex-col min-h-[250px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#cfb53b]" />
                  <span className="text-[10px] uppercase tracking-widest text-[#cfb53b] font-bold">SMTP Handshake Logs</span>
                </div>
                {testSuccess !== null && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    testSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {testSuccess ? "SUCCESS" : "CRITICAL FAILURE"}
                  </span>
                )}
              </div>

              {smtpLogs.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                  <Terminal className="w-8 h-8 text-white/5 mb-2" />
                  <p className="text-[10px] text-zinc-600 font-mono">Consolidated debug socket logs will execute in real-time when the test button is dispatched.</p>
                </div>
              ) : (
                <div className="bg-black/60 border border-white/5 rounded-xl p-3 flex-grow overflow-auto max-h-[300px] font-mono text-[10px] space-y-1.5 scrollbar-thin text-zinc-300">
                  {smtpLogs.map((log, i) => {
                    let colorClass = "text-zinc-400";
                    if (log.startsWith("[SYSTEM]")) {
                      colorClass = "text-[#cfb53b]";
                    } else if (log.startsWith("[INFO]") || log.includes("C: ")) {
                      colorClass = "text-emerald-400";
                    } else if (log.startsWith("[ERROR]") || log.startsWith("[FATAL") || log.includes("Error:") || log.includes("S: 5")) {
                      colorClass = "text-red-400";
                    } else if (log.includes("S: ")) {
                      colorClass = "text-blue-400";
                    }
                    return (
                      <div key={i} className={`${colorClass} whitespace-pre-wrap break-all leading-relaxed`}>
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
