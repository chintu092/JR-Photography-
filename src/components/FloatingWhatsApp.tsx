import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, Check, WifiOff, Clock } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function FloatingWhatsApp() {
  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: true,
    number: "1234567890",
    message: "Hello! I'm interested in booking a photography consultation. Could you share more details?",
    hoursEnabled: false,
    hoursStart: "09:00",
    hoursEnd: "18:00",
    days: [1, 2, 3, 4, 5],
    awayMessage: "We are currently away. We'll respond as soon as we're back!"
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? window.navigator.onLine : true);
  const [toastVisible, setToastVisible] = useState(false);
  const [isAway, setIsAway] = useState(false);

  useEffect(() => {
    const checkAwayStatus = (config: typeof whatsappConfig) => {
      if (!config.hoursEnabled) {
        setIsAway(false);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday...
      
      if (!config.days.includes(currentDay)) {
        setIsAway(true);
        return;
      }

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeVal = currentHour * 60 + currentMin;

      const [startH, startM] = config.hoursStart.split(":").map(Number);
      const startTimeVal = startH * 60 + startM;

      const [endH, endM] = config.hoursEnd.split(":").map(Number);
      const endTimeVal = endH * 60 + endM;

      if (currentTimeVal < startTimeVal || currentTimeVal > endTimeVal) {
        setIsAway(true);
      } else {
        setIsAway(false);
      }
    };

    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updatedConfig = {
          enabled: data.whatsappEnabled !== false, // Default to true
          number: data.whatsappNumber || "1234567890",
          message: data.whatsappMessage || "Hello! I'm interested in booking a photography consultation. Could you share more details?",
          hoursEnabled: !!data.whatsappHoursEnabled,
          hoursStart: data.whatsappHoursStart || "09:00",
          hoursEnd: data.whatsappHoursEnd || "18:00",
          days: data.whatsappDays || [1, 2, 3, 4, 5],
          awayMessage: data.whatsappAwayMessage || "We are currently away. We'll respond as soon as we're back!"
        };
        setWhatsappConfig(updatedConfig);
        checkAwayStatus(updatedConfig);
      }
      setLoading(false);
    });

    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };
    updateTime();

    // Check away status every 15 seconds to ensure real-time accuracy
    const timerId = setInterval(() => {
      updateTime();
      setWhatsappConfig((prev) => {
        checkAwayStatus(prev);
        return prev;
      });
    }, 15000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      unsub();
      clearInterval(timerId);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  if (loading || !whatsappConfig.enabled) return null;

  const whatsappUrl = `https://wa.me/${whatsappConfig.number.replace(/\D/g,'')}?text=${encodeURIComponent(whatsappConfig.message)}`;

  const handleClick = async (e: React.MouseEvent) => {
    if (!isOnline) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsappConfig.number).catch(err => console.error("Could not copy number", err));
    }
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);

    try {
      await addDoc(collection(db, "whatsapp_clicks"), {
        clickedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error logging whatsapp click:", err);
    }
    
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      <motion.a
        href={isOnline ? whatsappUrl : "#"}
        onClick={handleClick}
        target={isOnline ? "_blank" : undefined}
        rel={isOnline ? "noopener noreferrer" : undefined}
        className={`fixed bottom-6 right-6 z-[100] flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-colors duration-300 group ${
          isOnline
            ? (isAway ? "bg-amber-600 hover:bg-amber-700 cursor-pointer" : "bg-green-500 hover:bg-green-600 cursor-pointer")
            : "bg-zinc-600 hover:bg-zinc-600 cursor-not-allowed"
        }`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        whileHover={isOnline ? { scale: 1.1 } : {}}
        whileTap={isOnline ? { scale: 0.9 } : {}}
        aria-label="Quick Inquiry via WhatsApp"
      >
        {isOnline ? (
          isAway ? (
            <Clock className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )
        ) : (
          <WifiOff className="w-6 h-6 text-white/50" />
        )}
        
        <div className="absolute right-16 px-4 py-2 bg-luxury-black/90 backdrop-blur-md border border-white/10 text-white text-xs font-mono tracking-wider rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap hidden sm:block">
          {isOnline ? (isAway ? whatsappConfig.awayMessage : `${greeting}! Quick Inquiry`) : "Service Unavailable (Check Connection)"}
        </div>
        
        {/* Pulse effect */}
        {isOnline && (
          <div className={`absolute inset-0 rounded-full border-2 ${isAway ? 'border-amber-400' : 'border-luxury-gold'} animate-ping opacity-30 pointer-events-none`} />
        )}

        {/* Copy Toast */}
        <AnimatePresence>
          {toastVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-16 right-0 px-4 py-3 bg-green-500/90 backdrop-blur-md text-white text-xs font-medium rounded-xl flex items-center gap-2 whitespace-nowrap border border-green-400/30 shadow-xl"
            >
              <Check className="w-4 h-4" />
              Number copied to clipboard!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.a>
    </AnimatePresence>
  );
}
