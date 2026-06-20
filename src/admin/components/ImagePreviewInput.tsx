import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Eye, AlertCircle } from "lucide-react";

interface ImagePreviewInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  list?: string;
  className?: string;
  errorMsgClass?: string;
  defaultPreview?: string;
}

export default function ImagePreviewInput({
  id,
  label,
  value,
  onChange,
  placeholder = "https://...",
  list,
  className = "",
  errorMsgClass = "",
  defaultPreview
}: ImagePreviewInputProps) {
  const [hasError, setHasError] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Reset error state dynamically when input changes
  useEffect(() => {
    setHasError(false);
  }, [value]);

  const handleManualPreview = () => {
    // Increment the preview key to force trigger image element reload and check error status
    setPreviewKey((prev) => prev + 1);
    setHasError(false);
  };

  return (
    <div className={`space-y-3 w-full ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-[10px] uppercase tracking-[0.2em] text-luxury-gold/60 font-medium">
          {label}
        </label>
      </div>
      
      <div className="flex gap-2">
        <input
          id={id || `img-input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-luxury-black/60 border border-luxury-gold/5 rounded-xl px-4 py-3 text-sm text-luxury-cream focus:outline-none focus:border-luxury-gold/40 placeholder:text-luxury-cream/20 font-sans"
          placeholder={placeholder}
          list={list}
        />
        <button
          type="button"
          onClick={handleManualPreview}
          disabled={!value}
          className="px-4 py-3 bg-luxury-gold/10 hover:bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/20 rounded-xl transition-all font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
          title="Force manual preview refresh"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
      </div>

      {/* Live Preview Section directly below the field */}
      <div className="relative mt-2 rounded-xl overflow-hidden border border-white/5 bg-[#050508]/80 aspect-[16/9] flex flex-col items-center justify-center p-4">
        {!value && !defaultPreview ? (
          <div className="text-center space-y-2 text-luxury-cream/20">
            <ImageIcon className="w-8 h-8 mx-auto stroke-[1.2] text-luxury-gold/20" />
            <p className="font-mono text-[9px] uppercase tracking-[0.25em]">No Image URL Provided</p>
          </div>
        ) : hasError ? (
          <div className="text-center space-y-3 w-full h-full flex flex-col items-center justify-center relative p-6 bg-red-950/10 rounded-xl border border-red-500/15">
            <img 
              src="https://placehold.co/600x400/0a0a0f/ea580c?text=Invalid+Image+Preview" 
              alt="Fallback Placeholder"
              className="absolute inset-0 w-full h-full object-cover opacity-20 filter grayscale"
            />
            <div className="relative z-10 space-y-2">
              <AlertCircle className="w-8 h-8 text-red-500 stroke-[1.5] mx-auto animate-pulse" />
              <p className={`text-red-400 font-mono text-[10px] uppercase tracking-[0.2em] font-semibold bg-luxury-black/90 px-3 py-1.5 rounded-lg border border-red-500/20 ${errorMsgClass}`}>
                Unable to load image preview.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative group flex items-center justify-center">
            <img
              key={`${value || defaultPreview}-${previewKey}`}
              src={value || defaultPreview}
              alt={`${label} Preview`}
              onLoad={() => setHasError(false)}
              onError={() => setHasError(true)}
              className="max-h-full max-w-full object-contain rounded-lg drop-shadow-lg"
            />
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm border border-luxury-gold/20 px-2.5 py-1 rounded text-[8px] text-luxury-gold uppercase tracking-[0.2em] font-mono pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {value ? "Live Preview Loaded" : "Default Used"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
