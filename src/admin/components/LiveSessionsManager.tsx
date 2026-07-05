import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, query, doc, deleteDoc } from "firebase/firestore";
import { 
  Laptop, Smartphone, Tablet, Globe, Search, Copy, 
  Trash2, RefreshCw, Eye, ShieldCheck, MapPin, Radio, 
  MousePointerClick, Monitor, ChevronRight, Loader2
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface ActiveSession {
  id: string;
  ip: string;
  deviceType: string;
  os: string;
  browser: string;
  page: string;
  joinedAt: any;
  lastActive: any;
  city?: string;
  country?: string;
  org?: string;
  email?: string;
  isAdmin?: boolean;
}

export default function LiveSessionsManager() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const toast = useToast();

  useEffect(() => {
    // Set up real-time subscription to active sessions
    const q = collection(db, "active_sessions");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessionsData: ActiveSession[] = [];
        snapshot.forEach((doc) => {
          sessionsData.push({ id: doc.id, ...doc.data() } as ActiveSession);
        });

        // Sort by last active (most recent first)
        sessionsData.sort((a, b) => {
          const timeA = a.lastActive?.seconds || 0;
          const timeB = b.lastActive?.seconds || 0;
          return timeB - timeA;
        });

        setSessions(sessionsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to live sessions:", error);
        toast.show("Permission denied. Ensure you are a verified administrator.", "error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.show(`${label} copied to clipboard`, "success");
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (confirm("Are you sure you want to terminate this live user session?")) {
      try {
        await deleteDoc(doc(db, "active_sessions", sessionId));
        toast.show("Session terminated successfully", "success");
      } catch (err) {
        console.error("Error terminating session:", err);
        toast.show("Failed to terminate session", "error");
      }
    }
  };

  // Helper to get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="w-5 h-5 text-emerald-400" />;
      case "tablet":
        return <Tablet className="w-5 h-5 text-indigo-400" />;
      default:
        return <Laptop className="w-5 h-5 text-amber-400" />;
    }
  };

  // Helper to format timestamps gracefully
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Check if session is actually active (heartbeat within last 60 seconds)
  const isSessionActive = (session: ActiveSession) => {
    if (!session.lastActive) return true;
    const date = session.lastActive.toDate ? session.lastActive.toDate() : new Date(session.lastActive);
    const diffSeconds = (new Date().getTime() - date.getTime()) / 1000;
    return diffSeconds < 60; // considered active if heartbeat is less than 1 minute old
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch = 
      s.ip?.toLowerCase().includes(queryLower) ||
      s.page?.toLowerCase().includes(queryLower) ||
      s.browser?.toLowerCase().includes(queryLower) ||
      s.os?.toLowerCase().includes(queryLower) ||
      s.city?.toLowerCase().includes(queryLower) ||
      s.country?.toLowerCase().includes(queryLower) ||
      s.email?.toLowerCase().includes(queryLower);

    const matchesDevice = 
      filterDevice === "all" || 
      s.deviceType?.toLowerCase() === filterDevice.toLowerCase();

    return matchesSearch && matchesDevice;
  });

  // Calculate statistics
  const activeCount = sessions.filter(isSessionActive).length;
  const mobileCount = sessions.filter(s => s.deviceType?.toLowerCase() === "mobile").length;
  const laptopCount = sessions.filter(s => s.deviceType?.toLowerCase() === "laptop/desktop" || !s.deviceType).length;
  const tabletCount = sessions.filter(s => s.deviceType?.toLowerCase() === "tablet").length;

  // Breakdown of active pages
  const pageBreakdown: { [key: string]: number } = {};
  sessions.forEach(s => {
    const p = s.page || "Home Page";
    pageBreakdown[p] = (pageBreakdown[p] || 0) + 1;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-serif text-luxury-gold italic lowercase tracking-tight">live visitor tracker</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold tracking-widest animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>{activeCount} Live Now</span>
            </div>
          </div>
          <p className="text-luxury-cream/40 text-sm">
            Monitor real-time user activity, connected devices, geolocations, and IP addresses visiting your website.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 500);
            }}
            className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-luxury-gold/40 hover:bg-white/10 transition-all text-zinc-400 hover:text-white"
            title="Refresh connection"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total active sessions */}
        <div className="bg-[#0b0911]/60 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <Radio className="w-6 h-6 text-red-500 mb-3" />
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Live Connections</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-serif text-white font-medium">{sessions.length}</span>
            <span className="text-xs text-zinc-500 font-mono">active tabs</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Real-time sockets currently established in browsers.
          </p>
        </div>

        {/* Laptops/Desktops */}
        <div className="bg-[#0b0911]/60 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <Laptop className="w-6 h-6 text-amber-500 mb-3" />
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Laptop & Desktop</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-serif text-white font-medium">{laptopCount}</span>
            <span className="text-xs text-zinc-500 font-mono">
              {sessions.length > 0 ? Math.round((laptopCount / sessions.length) * 100) : 0}% share
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Standard high-fidelity screens and workstations.
          </p>
        </div>

        {/* Mobile & Tablet */}
        <div className="bg-[#0b0911]/60 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <Smartphone className="w-6 h-6 text-emerald-400 mb-3" />
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Mobile Devices</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-serif text-white font-medium">{mobileCount + tabletCount}</span>
            <span className="text-xs text-zinc-500 font-mono">
              {sessions.length > 0 ? Math.round(((mobileCount + tabletCount) / sessions.length) * 100) : 0}% share
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Handheld displays, mobile OS browsers, and tablets.
          </p>
        </div>

        {/* Top Active Page */}
        <div className="bg-[#0b0911]/60 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
          <MousePointerClick className="w-6 h-6 text-indigo-400 mb-3" />
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Top Active Area</p>
          <div className="mt-1">
            <span className="text-xl font-serif text-white truncate block capitalize">
              {Object.keys(pageBreakdown).reduce((a, b) => pageBreakdown[a] > pageBreakdown[b] ? a : b, "No visitors") || "None"}
            </span>
            <span className="text-xs text-zinc-500 font-mono mt-0.5 block">
              {Object.keys(pageBreakdown).length > 0 
                ? `${Math.max(...Object.values(pageBreakdown))} current reader(s)` 
                : "0 active readers"}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">
            Page that is currently holding the highest traffic density.
          </p>
        </div>

      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-[#0b0911]/40 border border-white/5 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by IP, country, page, browser, or admin email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-11 pr-4 py-3 text-xs text-luxury-cream focus:outline-none focus:border-luxury-gold/40 transition-all font-mono"
          />
        </div>

        {/* Device select */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto shrink-0 pb-1 md:pb-0">
          {[
            { id: "all", label: "All Devices" },
            { id: "laptop/desktop", label: "Laptop / Desktop" },
            { id: "mobile", label: "Mobile" },
            { id: "tablet", label: "Tablet" }
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => setFilterDevice(device.id)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 border cursor-pointer ${
                filterDevice === device.id
                  ? "bg-luxury-gold/10 text-luxury-gold border-luxury-gold/30"
                  : "bg-black/20 text-zinc-500 border-white/5 hover:border-white/10"
              }`}
            >
              {device.label}
            </button>
          ))}
        </div>

      </div>

      {/* REAL-TIME SESSION TABLE/LIST */}
      {loading ? (
        <div className="bg-[#0b0911]/40 border border-white/5 rounded-3xl p-24 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-luxury-gold mx-auto" />
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Synchronizing Live Sockets...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-[#0b0911]/40 border border-white/5 rounded-3xl p-24 text-center space-y-4">
          <Eye className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">No Live Sessions Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            There are no live users matching your search filters at this exact moment. Any active session will automatically pop up here instantly.
          </p>
        </div>
      ) : (
        <div className="bg-[#0b0911]/40 border border-white/5 rounded-3xl overflow-hidden">
          
          <div className="p-4 bg-[#0a0810] border-b border-white/5 hidden md:grid grid-cols-12 text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
            <div className="col-span-3">User IP & Location</div>
            <div className="col-span-3">Platform & OS</div>
            <div className="col-span-3">Active Page</div>
            <div className="col-span-2 text-right">Time Status</div>
            <div className="col-span-1 text-right">Control</div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredSessions.map((session) => {
              const isActiveNow = isSessionActive(session);
              return (
                <div 
                  key={session.id} 
                  className="p-4 hover:bg-white/[0.02] transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                >
                  
                  {/* IP Address & Location */}
                  <div className="col-span-1 md:col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-zinc-100 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                        {session.ip}
                      </span>
                      <button 
                        onClick={() => handleCopy(session.ip, "IP Address")}
                        className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors"
                        title="Copy IP Address"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {session.isAdmin && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#846df7]/15 border border-[#846df7]/30 text-[#846df7] text-[8px] uppercase font-bold tracking-widest">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Admin</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-medium font-sans">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        {session.city || "Unknown City"}, {session.country || "Unknown Country"}
                      </span>
                    </div>

                    {session.org && session.org !== "Unknown" && (
                      <p className="text-[9px] text-zinc-500 font-mono truncate max-w-xs" title={session.org}>
                        ISP: {session.org}
                      </p>
                    )}

                    {session.email && (
                      <p className="text-[10px] text-luxury-gold font-mono truncate" title={session.email}>
                        👤 {session.email}
                      </p>
                    )}
                  </div>

                  {/* Device Platform, OS, Browser */}
                  <div className="col-span-1 md:col-span-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-bold text-zinc-200 capitalize">
                        {session.deviceType || "Laptop/Desktop"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                        <span className="text-zinc-400 font-sans">{session.os}</span>
                        <span>•</span>
                        <span className="text-zinc-400 font-sans">{session.browser}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Active Page location */}
                  <div className="col-span-1 md:col-span-3 space-y-1">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold md:hidden">Active Page</p>
                    <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 px-3 py-1.5 rounded-2xl w-fit">
                      <Eye className="w-3.5 h-3.5 text-luxury-gold shrink-0" />
                      <span className="text-xs text-zinc-300 font-mono truncate max-w-[180px] lg:max-w-[240px] capitalize">
                        {session.page === "home" ? "Home Page" : session.page?.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Timestamps & Heartbeat glowing indicators */}
                  <div className="col-span-1 md:col-span-2 flex md:flex-col justify-between md:items-end gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isActiveNow ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isActiveNow ? "text-emerald-400" : "text-zinc-500"}`}>
                        {isActiveNow ? "Active Now" : "Idle/Away"}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-[10px] text-zinc-500">
                        Joined: <span className="text-zinc-400 font-mono">{formatTimeAgo(session.joinedAt)}</span>
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Heartbeat: <span className="text-zinc-400 font-mono">{formatTimeAgo(session.lastActive)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Terminate session control */}
                  <div className="col-span-1 md:col-span-1 text-right">
                    <button 
                      onClick={() => handleTerminateSession(session.id)}
                      className="p-2.5 bg-red-500/5 hover:bg-red-500 border border-red-500/10 text-red-500 hover:text-white rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                      title="Terminate User Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase font-bold tracking-widest md:hidden">Terminate</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Footer of panel */}
          <div className="p-4 bg-[#0a0810] border-t border-white/5 text-right">
            <p className="text-[9px] font-mono text-zinc-600">
              Session states are kept warm in high-performance cloud clusters. Total cached sessions: {sessions.length}
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
