import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Logo from "./Logo";

const MOTTO_WORDS = ["AUTHENTIC", "CINEMATIC", "EDITORIAL", "CHRONICLE", "JR PHOTOGRAPHY"];

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Progress counter
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setVisible(false);
            onComplete();
          }, 800);
          return 100;
        }
        // Varied increment speed for custom lifelike feel
        const step = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + step, 100);
      });
    }, 70);

    // Rotate motto words
    const wordInterval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % MOTTO_WORDS.length);
    }, 320);

    return () => {
      clearInterval(interval);
      clearInterval(wordInterval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-luxury-black z-99999 flex flex-col justify-between p-8 md:p-16 select-none"
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%", 
            transition: { duration: 0.9, cubicBezier: [0.76, 0, 0.24, 1] } 
          }}
        >
          {/* Top Info */}
          <div className="flex justify-between items-center text-xs tracking-widest text-[#555] font-mono">
            <span>JR ARCHIVES</span>
            <span>EST. 2011</span>
          </div>

          {/* Central Animated Logo & Motto */}
          <div className="text-center my-auto flex flex-col items-center">
            <motion.div 
              className="w-48 sm:w-64 max-w-sm text-luxury-cream self-center mb-4"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Logo variant="full" />
            </motion.div>
            
            {/* Rotating Motto Word */}
            <div className="h-8 mt-4 overflow-hidden flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={MOTTO_WORDS[currentWordIndex]}
                  className="text-xs tracking-[0.4em] text-luxury-gold font-sans font-medium uppercase block"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {MOTTO_WORDS[currentWordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Counter */}
          <div className="flex justify-between items-end">
            <div className="text-xs text-[#555] max-w-xs leading-relaxed hidden md:block">
              <p>Meticulous fine-art photography and cinematography pipelines for global luxury brands.</p>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-5xl md:text-8xl font-display font-extrabold text-luxury-cream leading-none select-none">
                {progress}%
              </div>
              <div className="w-36 md:w-56 h-[1px] bg-[#222] mt-4 relative overflow-hidden">
                <motion.div 
                  className="absolute left-0 top-0 h-full bg-[#D4AF37]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
