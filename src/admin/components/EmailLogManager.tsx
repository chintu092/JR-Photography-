import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "motion/react";

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: "success" | "error";
  errorMessage?: string;
  messageId?: string;
  timestamp: any;
}

export default function EmailLogManager() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "email_logs"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const parsed = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailLog[];
      setLogs(parsed);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-luxury-cream">Email Delivery Logs</h2>
          <p className="text-zinc-400 text-sm mt-1">View the history and status of outbound system emails.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-luxury-gold mb-4" />
            <p>Loading email logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Mail className="w-12 h-12 mb-4 opacity-20" />
            <p>No email logs found yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl bg-[#0c0b11] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className={`p-3 rounded-lg shrink-0 ${log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {log.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3 className="font-semibold text-zinc-200 truncate">{log.subject}</h3>
                    <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                      {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 
                       (log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 
                       (log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown Time'))}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                    <span className="text-zinc-400 flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {log.recipient}
                    </span>
                    {log.status === 'error' && log.errorMessage && (
                      <span className="text-red-400/80 text-xs truncate max-w-[300px]">
                        Error: {log.errorMessage}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
