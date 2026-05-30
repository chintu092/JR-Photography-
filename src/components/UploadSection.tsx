import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileDown, Sliders, CheckCircle2, Wand2, MessageSquare, Trash2, Image as ImageIcon, Check } from "lucide-react";
import { audioService } from "../utils/audio";

interface ProofPhoto {
  id: string;
  url: string;
  name: string;
  size: string;
  type: string;
  exposure: number; // -50 to 50
  contrast: number; // -50 to 50
  grain: number; // 0 to 100
  preset: string; // 'none' | 'leica' | 'arri' | 'kodak'
  feedback: string;
  aspect: string;
}

const PRESET_FILTERS: Record<string, { name: string; desc: string; css: string }> = {
  none: {
    name: "Pure Raw",
    desc: "Unaltered Hasselblad color capture state.",
    css: "contrast-100 brightness-100 grayscale-0 saturating-100"
  },
  leica: {
    name: "Classic Monochrome",
    desc: "Rich contrast, deep shadows, legendary Leica M vibe.",
    css: "contrast-[1.25] brightness-[0.93] grayscale sepia-[0.08]"
  },
  arri: {
    name: "Arri Cine Log",
    desc: "Subtle desaturation, warm cinematic midtones.",
    css: "saturate-[0.75] contrast-[1.05] brightness-[1.02] sepia-[0.15]"
  },
  kodak: {
    name: "Vintage Kodachrome",
    desc: "Vibrant retro tones with organic satin color palette.",
    css: "contrast-[1.12] brightness-[0.98] hue-rotate-[5deg] saturate-[1.2]"
  }
};

const DEFAULT_PROOFS: ProofPhoto[] = [
  {
    id: "p1",
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=700",
    name: "Milan_Studio_Exhibition_Plate04.jpg",
    size: "4.8 MB",
    type: "image/jpeg",
    exposure: 5,
    contrast: 15,
    grain: 12,
    preset: "leica",
    feedback: "Elevate exposure slightly for print tests on German hand-pressed paper.",
    aspect: "3:4"
  },
  {
    id: "p2",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=700",
    name: "Zurich_Chassis_Precision09.jpg",
    size: "6.2 MB",
    type: "image/jpeg",
    exposure: -10,
    contrast: 20,
    grain: 0,
    preset: "arri",
    feedback: "Maintain high obsidian darkness. Deepen shadow ranges on the rear tyre rims.",
    aspect: "3:4"
  }
];

export default function UploadSection() {
  const [proofs, setProofs] = useState<ProofPhoto[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [submittingDirectives, setSubmittingDirectives] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("jr_studio_proofs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProofs(parsed);
        if (parsed.length > 0) setSelectedId(parsed[0].id);
      } catch (e) {
        setProofs(DEFAULT_PROOFS);
        setSelectedId(DEFAULT_PROOFS[0].id);
      }
    } else {
      setProofs(DEFAULT_PROOFS);
      setSelectedId(DEFAULT_PROOFS[0].id);
    }
  }, []);

  // Save to LocalStorage
  const saveProofs = (updated: ProofPhoto[]) => {
    setProofs(updated);
    localStorage.setItem("jr_studio_proofs", JSON.stringify(updated));
  };

  const handleSelect = (id: string) => {
    audioService.playClick();
    setSelectedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Convert File to Object URL
  const processFiles = (files: FileList) => {
    const updated = [...proofs];
    let firstNewId = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      const url = URL.createObjectURL(file);
      const randomId = "p-" + Math.random().toString(36).substr(2, 9);
      if (!firstNewId) firstNewId = randomId;

      updated.push({
        id: randomId,
        url,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        type: file.type,
        exposure: 0,
        contrast: 0,
        grain: 10,
        preset: "none",
        feedback: "",
        aspect: "3:4"
      });
    }

    if (updated.length > proofs.length) {
      audioService.playClick();
      saveProofs(updated);
      if (firstNewId) setSelectedId(firstNewId);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    audioService.playClick();
    fileInputRef.current?.click();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.playClick();
    const filtered = proofs.filter((p) => p.id !== id);
    saveProofs(filtered);
    if (selectedId === id && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    } else if (filtered.length === 0) {
      setSelectedId("");
    }
  };

  const handleUpdate = (field: keyof ProofPhoto, value: any) => {
    const updated = proofs.map((p) => {
      if (p.id === selectedId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    saveProofs(updated);
  };

  const handleSubmitAll = () => {
    audioService.playWhoosh();
    setSubmittingDirectives(true);
    setTimeout(() => {
      audioService.playClick();
      setSubmittingDirectives(false);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 4500);
    }, 2000);
  };

  const currentProof = proofs.find((p) => p.id === selectedId);

  // Computed filter styles for premium preview
  const getFilterStyle = (proof: ProofPhoto) => {
    const presetStyle = PRESET_FILTERS[proof.preset]?.css || "";
    // exposure and contrast converted to percentage scale
    const expFactor = 100 + proof.exposure;
    const conFactor = 100 + proof.contrast;
    return `${presetStyle}`;
  };

  const getCustomInlineStyles = (proof: ProofPhoto) => {
    return {
      filter: `brightness(${100 + proof.exposure}%) contrast(${100 + proof.contrast}%)`,
    };
  };

  return (
    <section 
      id="upload-studio" 
      className="relative py-28 bg-[#0C0F0A] border-t border-b border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#B7BE43]/2 pointer-events-none filter blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Title elements */}
        <div className="space-y-4 mb-16 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 text-[10px] font-mono tracking-[0.43em] text-[#B7BE43] uppercase bg-[#B7BE43]/10 px-3.5 py-1.5 rounded-full border border-[#B7BE43]/20">
            <Upload className="w-3 h-3 text-[#B7BE43]" />
            <span>Interactive Proof Studio</span>
          </div>
          <h2 className="font-display font-medium text-3xl sm:text-5xl text-luxury-cream uppercase tracking-tight">
            Client Plate Uploads
          </h2>
          <p className="text-xs sm:text-sm text-luxury-gray font-light max-w-lg mx-auto leading-relaxed">
            Drag-and-drop your photography sheets, adjust color spaces using camera laboratory profiles, write direct feedback notes, and submit directives immediately.
          </p>
        </div>

        {/* Master Studio Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel index and drag & drop zone */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Elegant Drag n Drop Plate container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`relative py-12 px-6 rounded-[24px] border-2 border-dashed cursor-pointer text-center transition-all duration-300 flex flex-col items-center justify-center space-y-4 bg-luxury-charcoal/20 select-none group h-[220px] ${
                isDragging 
                  ? "border-[#B7BE43] bg-[#B7BE43]/5" 
                  : "border-white/10 hover:border-white/30 hover:bg-luxury-charcoal/40"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full border border-white/10 bg-[#0C0F0A] flex items-center justify-center text-luxury-cream group-hover:scale-105 group-hover:border-[#B7BE43]/40 group-hover:text-[#B7BE43] transition-all duration-300 shadow-xl">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono tracking-wider text-luxury-cream uppercase font-semibold">
                  Drop files to upload
                </p>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                  or Click to browse storage
                </p>
              </div>
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider">
                Supports High Fidelity TIFF, JPEG, PNG
              </p>
            </div>

            {/* List of active plates uploads */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block pl-2">
                EXHIBITION PLATES IN CONTAINER ({proofs.length})
              </span>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {proofs.map((proof) => {
                  const isCur = proof.id === selectedId;
                  return (
                    <div
                      key={proof.id}
                      onClick={() => handleSelect(proof.id)}
                      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 cursor-pointer select-none ${
                        isCur
                          ? "bg-luxury-charcoal border-[#B7BE43] shadow-lg"
                          : "bg-[#0C0F0A] border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-neutral-900">
                          <img 
                            src={proof.url} 
                            alt={proof.name} 
                            className="w-full h-full object-cover filter brightness-[85%]" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-luxury-cream truncate">
                            {proof.name}
                          </p>
                          <span className="text-[9px] font-mono text-zinc-500 tracking-wider">
                            {proof.size} &bull; ASPECT {proof.aspect}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(proof.id, e)}
                        className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        title="Delete source image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {proofs.length === 0 && (
                  <div className="text-center py-8 bg-luxury-charcoal/10 rounded-xl border border-white/5 space-y-1.5">
                    <ImageIcon className="w-6 h-6 mx-auto text-zinc-600" />
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                      Plate storage empty
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Center Sandbox: Interactive Live Preview with Presets */}
          <div className="lg:col-span-5 flex flex-col h-full bg-luxury-charcoal/20 border border-white/5 rounded-3xl p-5 md:p-6 shadow-2xl relative">
            <span className="absolute top-4 left-4 z-10 px-2 py-0.5 bg-[#0C0F0A]/90 backdrop-blur-sm rounded border border-white/5 text-[8.5px] font-mono text-zinc-400 tracking-wider">
              {currentProof ? `PLATE ${currentProof.id.toUpperCase()}` : "NO PLATE ACTIVE"}
            </span>

            {/* Simulated Live Lens Ring Preview Frame */}
            <div className="relative aspect-[4/5] sm:aspect-[3/4] bg-[#0A0C08] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner group">
              {currentProof ? (
                <>
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={currentProof.url} 
                      alt="Source preview"
                      style={getCustomInlineStyles(currentProof)}
                      className={`w-full h-full object-cover transition-all duration-300 ${getFilterStyle(currentProof)}`}
                      referrerPolicy="no-referrer"
                    />

                    {/* Simulated film grain pattern applied over image */}
                    {currentProof.grain > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30 bg-repeat bg-[size:100px_100px]"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                          opacity: currentProof.grain / 250
                        }}
                      />
                    )}
                  </div>

                  {/* High contrast dynamic visual guidelines overlay */}
                  <div className="absolute inset-0 bg-transparent border-[25px] border-black/10 opacity-60 pointer-events-none" />
                  <div className="absolute left-[33.33%] top-0 bottom-0 border-l border-white/10 pointer-events-none" />
                  <div className="absolute left-[66.66%] top-0 bottom-0 border-l border-white/10 pointer-events-none" />
                  <div className="absolute top-[33.33%] left-0 right-0 border-t border-white/10 pointer-events-none" />
                  <div className="absolute top-[66.66%] left-0 right-0 border-t border-white/10 pointer-events-none" />
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Wand2 className="w-10 h-10 mx-auto text-zinc-600 animate-spin text-zinc-600" />
                  <p className="text-xs font-mono uppercase text-luxury-cream/80 tracking-widest pl-1 leading-none">
                    Select a Plate to Initialize Preview Panel
                  </p>
                </div>
              )}
            </div>

            {/* Profile filters selector below client image */}
            {currentProof && (
              <div className="mt-5 space-y-3">
                <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase block pl-1">
                  CHOOSE CAMERA LAB PROFILE
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(PRESET_FILTERS).map(([key, item]) => {
                    const isSel = currentProof.preset === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          audioService.playClick();
                          handleUpdate("preset", key);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden select-none cursor-pointer ${
                          isSel 
                            ? "bg-luxury-charcoal border-[#B7BE43]"
                            : "bg-[#0C0F0A] border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-mono font-bold text-luxury-cream">
                            {item.name}
                          </p>
                          {isSel && <Check className="w-3.5 h-3.5 text-[#B7BE43] shrink-0" />}
                        </div>
                        <span className="text-[8.5px] text-zinc-500 block leading-tight mt-1 font-light uppercase tracking-wider">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Manual sliders lab & feedback notes */}
          <div className="lg:col-span-3 space-y-6">
            {currentProof ? (
              <>
                {/* Laboratory Sliders */}
                <div className="p-6 bg-luxury-charcoal/20 border border-white/5 rounded-3xl space-y-6">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
                    <Sliders className="w-4 h-4 text-zinc-500" />
                    <span>PRECISION CHROMATICS</span>
                  </div>

                  {/* Exposure Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center font-mono text-xs text-luxury-cream">
                      <span>EXPOSURE</span>
                      <span className={currentProof.exposure > 0 ? "text-[#B7BE43]" : "text-zinc-500"}>
                        {currentProof.exposure > 0 ? `+${currentProof.exposure}%` : `${currentProof.exposure}%`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="-40"
                      max="40"
                      value={currentProof.exposure}
                      onChange={(e) => handleUpdate("exposure", Number(e.target.value))}
                      className="w-full accent-[#B7BE43] bg-neutral-900 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center font-mono text-xs text-luxury-cream">
                      <span>CONTRAST</span>
                      <span className={currentProof.contrast > 0 ? "text-[#B7BE43]" : "text-zinc-500"}>
                        {currentProof.contrast > 0 ? `+${currentProof.contrast}%` : `${currentProof.contrast}%`}
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="-40"
                      max="40"
                      value={currentProof.contrast}
                      onChange={(e) => handleUpdate("contrast", Number(e.target.value))}
                      className="w-full accent-[#B7BE43] bg-neutral-900 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>

                  {/* Noise Film Grain Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center font-mono text-xs text-luxury-cream">
                      <span>ORGANIC GRAIN</span>
                      <span className={currentProof.grain > 0 ? "text-[#B7BE43]" : "text-zinc-500"}>
                        {currentProof.grain}%
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="60"
                      value={currentProof.grain}
                      onChange={(e) => handleUpdate("grain", Number(e.target.value))}
                      className="w-full accent-[#B7BE43] bg-neutral-900 h-1.5 rounded-lg cursor-pointer appearance-none"
                    />
                  </div>
                </div>

                {/* Editorial Notes panel */}
                <div className="p-6 bg-luxury-charcoal/20 border border-white/5 rounded-3xl space-y-4">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400 tracking-widest uppercase">
                    <MessageSquare className="w-4 h-4 text-zinc-500" />
                    <span>CLIENT DIRECTIVES</span>
                  </div>
                  
                  <textarea
                    rows={4}
                    value={currentProof.feedback}
                    onChange={(e) => handleUpdate("feedback", e.target.value)}
                    placeholder="Enter visual directions, lighting preferences, filter requests or framing directives..."
                    className="w-full bg-[#0C0F0A] rounded-2xl border border-white/5 p-4 text-xs font-mono text-luxury-cream focus:outline-none focus:border-[#B7BE43]/50 transition-colors duration-300 resize-none font-light placeholder:text-zinc-600 leading-relaxed"
                  />
                  
                  <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block leading-tight">
                    Directives saved automatically in local container buffer.
                  </span>
                </div>

                {/* Submission CTA control */}
                <button
                  onClick={handleSubmitAll}
                  disabled={submittingDirectives}
                  className="w-full py-4 bg-[#B7BE43] hover:bg-[#c6ce4b] text-luxury-black rounded-full font-display font-bold text-xs tracking-[0.2em] uppercase select-none cursor-pointer flex items-center justify-center space-x-3 transition-colors duration-300 shadow-xl border border-white/10 disabled:opacity-55"
                  id="submit-directives-btn"
                >
                  {submittingDirectives ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-luxury-black border-t-transparent animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Directives</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="p-8 bg-zinc-900/10 border border-white/5 rounded-3xl text-center">
                <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                  No Plate Selected for Parameters panel
                </p>
              </div>
            )}

            {/* Transmission Feedback Indicator */}
            <AnimatePresence>
              {showStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-1.5"
                >
                  <p className="text-xs font-mono font-bold text-green-400 uppercase tracking-widest">
                    Directives Received
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono tracking-wider leading-relaxed">
                    Plate attributes and annotations have been safely synced to the JR Studio production repository. Our art editor will update review copies shortly.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
}
