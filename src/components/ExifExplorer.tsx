import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Camera, Target, Aperture, Zap, Clock, Info, Image as ImageIcon, Sliders, Focus, Pin, PinOff, Edit2, Check } from "lucide-react";
import exifr from "exifr";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ExifData {
  camera: string;
  lens: string;
  aperture: string;
  iso: string;
  shutterSpeed: string;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200";
const DEFAULT_EXIF: ExifData = {
  camera: "Sony Alpha a7 III",
  lens: "FE 24-70mm F2.8 GM",
  aperture: "f/2.8",
  iso: "400",
  shutterSpeed: "1/1000s"
};

const INITIAL_ISO_DATA = [
  { name: "100", count: 12 },
  { name: "200", count: 24 },
  { name: "400", count: 48 },
  { name: "800", count: 32 },
  { name: "1600", count: 15 },
  { name: "3200+", count: 6 },
];

const INITIAL_APERTURE_DATA = [
  { name: "f/1.4", count: 8 },
  { name: "f/1.8", count: 18 },
  { name: "f/2.8", count: 42 },
  { name: "f/4.0", count: 28 },
  { name: "f/5.6", count: 15 },
  { name: "f/8.0+", count: 10 },
];

const INITIAL_FOCAL_LENGTH_DATA = [
  { name: "14mm", count: 15 },
  { name: "24mm", count: 45 },
  { name: "35mm", count: 30 },
  { name: "50mm", count: 60 },
  { name: "85mm", count: 25 },
  { name: "135mm", count: 12 },
  { name: "200mm+", count: 8 },
];

const PRESETS = [
  {
    name: "Cinematic Portrait",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200",
    exif: {
      camera: "Canon EOS R5",
      lens: "RF 85mm F1.2 L",
      aperture: "f/1.2",
      iso: "100",
      shutterSpeed: "1/1000s"
    }
  },
  {
    name: "High-Speed Sports",
    image: "https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&q=80&w=1200",
    exif: {
      camera: "Sony Alpha 1",
      lens: "FE 400mm F2.8 GM",
      aperture: "f/2.8",
      iso: "1600",
      shutterSpeed: "1/4000s"
    }
  },
  {
    name: "Minimalist Landscape",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200",
    exif: {
      camera: "Fujifilm GFX 100",
      lens: "GF 23mm F4 R LM WR",
      aperture: "f/11",
      iso: "100",
      shutterSpeed: "2s"
    }
  }
];

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="relative group inline-flex items-center justify-center cursor-help">
       <Info className="w-3.5 h-3.5 text-zinc-600 group-hover:text-luxury-gold transition-colors"/>
       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[200px] sm:w-[240px] bg-[#2A2B2E] text-zinc-200 text-xs p-3 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-white/10 shadow-2xl leading-relaxed font-sans normal-case tracking-normal">
          {text}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A2B2E] rotate-45 border-b border-r border-white/10"></div>
       </div>
    </div>
  );
}

export default function ExifExplorer() {
  const [imagePreview, setImagePreview] = useState<string>(DEFAULT_IMAGE);
  const [exifData, setExifData] = useState<ExifData | null>(DEFAULT_EXIF);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isoData, setIsoData] = useState(INITIAL_ISO_DATA);
  const [focalLengthData, setFocalLengthData] = useState(INITIAL_FOCAL_LENGTH_DATA);
  const [pinnedPhoto, setPinnedPhoto] = useState<{ image: string, exif: ExifData | null } | null>(null);
  const [editedExifData, setEditedExifData] = useState<ExifData | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatShutterSpeed = (exposureTime?: number) => {
    if (!exposureTime) return "Unknown";
    if (exposureTime >= 1) return `${exposureTime}s`;
    return `1/${Math.round(1 / exposureTime)}s`;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    try {
      const output = await exifr.parse(file, {
        pick: ['Make', 'Model', 'LensModel', 'FNumber', 'ISO', 'ExposureTime', 'FocalLength', 'FocalLengthIn35mmFormat'],
      });

      if (output) {
        const make = output.Make || "";
        const model = output.Model || "";
        const camera = [make, model].filter(Boolean).join(" ");
        
        setExifData({
          camera: camera || "Unknown",
          lens: output.LensModel || "Unknown",
          aperture: output.FNumber ? `f/${output.FNumber}` : "Unknown",
          iso: output.ISO ? output.ISO.toString() : "Unknown",
          shutterSpeed: formatShutterSpeed(output.ExposureTime)
        });

        if (output.ISO) {
          setIsoData(prev => {
            const numIso = Number(output.ISO);
            const newData = [...prev];
            const nameKey = numIso >= 3200 ? "3200+" : numIso.toString();
            const existingIdx = newData.findIndex(d => d.name === nameKey);
            if (existingIdx >= 0) {
              newData[existingIdx] = { ...newData[existingIdx], count: newData[existingIdx].count + 1 };
            } else {
              newData.push({ name: nameKey, count: 1 });
            }
            return newData;
          });
        }

        const focalLength = output.FocalLengthIn35mmFormat || output.FocalLength;
        if (focalLength) {
          setFocalLengthData(prev => {
            const focalNum = Number(focalLength);
            const newData = [...prev];
            let nameKey = "24mm";
            if (focalNum <= 28) nameKey = "24mm";
            else if (focalNum <= 40) nameKey = "35mm";
            else if (focalNum <= 60) nameKey = "50mm";
            else if (focalNum <= 105) nameKey = "85mm";
            else if (focalNum <= 180) nameKey = "135mm";
            else nameKey = "200mm+";
            
            const existingIdx = newData.findIndex(d => d.name === nameKey);
            if (existingIdx >= 0) {
              newData[existingIdx] = { ...newData[existingIdx], count: newData[existingIdx].count + 1 };
            } else {
              newData.push({ name: nameKey, count: 1 });
            }
            return newData;
          });
        }

      } else {
        setExifData(null);
      }
      setEditedExifData(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error reading EXIF", error);
      setExifData(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setImagePreview(preset.image);
    setExifData(preset.exif);
    setEditedExifData(null);
    setIsEditMode(false);
  };

  const toggleEditMode = () => {
    if (!isEditMode && !editedExifData && exifData) {
       setEditedExifData({ ...exifData });
    }
    setIsEditMode(!isEditMode);
  };

  const togglePin = () => {
    if (pinnedPhoto) setPinnedPhoto(null);
    else setPinnedPhoto({ image: imagePreview, exif: exifData });
  };

  return (
    <section className="py-24 md:py-32 bg-[#0E0E10] text-zinc-200 relative font-sans overflow-hidden min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 mt-12 md:mt-0">
          <div>
            <span className="text-[10px] font-mono tracking-[0.43em] text-luxury-gold uppercase block mb-4">
              INTERACTIVE TOOL
            </span>
            <h2 className="font-display font-medium text-4xl sm:text-6xl text-luxury-cream uppercase tracking-tight leading-none mb-4">
              EXIF <span className="font-serif italic font-light text-luxury-gold tracking-normal">Explorer</span>
            </h2>
            <p className="max-w-md text-sm text-zinc-500 leading-relaxed font-light">
              Upload an image to reveal embedded metadata.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => (
               <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-zinc-300 transition-colors"
               >
                  {preset.name}
               </button>
            ))}
            <button
               onClick={handleUploadClick}
               className="px-4 py-2 rounded-lg bg-luxury-gold/10 border border-luxury-gold/30 text-luxury-gold hover:bg-luxury-gold/20 text-xs font-medium transition-colors flex items-center gap-2"
            >
               {isUploading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-luxury-gold border-t-transparent animate-spin"/> : <Upload className="w-3.5 h-3.5" />}
               Analyze Image
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          </div>
        </div>
        
        <div className={`grid grid-cols-1 ${pinnedPhoto ? 'xl:grid-cols-2 gap-8' : 'gap-12'}`}>
          {[...(pinnedPhoto ? [{ image: pinnedPhoto.image, exif: pinnedPhoto.exif, isPinned: true }] : []), { image: imagePreview, exif: exifData, isPinned: false }].map((photoData, index) => (
             <div key={index} className="flex flex-col gap-6">
                <PhotoDashboard 
                   photoData={photoData}
                   isoData={isoData}
                   focalLengthData={focalLengthData}
                   isEditMode={!photoData.isPinned && isEditMode}
                   editedExifData={editedExifData}
                   setEditedExifData={setEditedExifData}
                   toggleEditMode={toggleEditMode}
                   togglePin={togglePin}
                   pinnedPhoto={pinnedPhoto}
                />
             </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getCameraType(camera: string) {
  if (!camera || camera === 'Unknown') return null;
  if (/(a7|alpha 1|EOS R|Z[56789]|GFX|X-T|X-H|X-H2|Lumix|a9|a6|X100)/i.test(camera)) return "Mirrorless";
  if (/(EOS [1-9]D|D[0-9]{4}|D[1-9]00|D[1-9]0|D[1-9]|Rebel)/i.test(camera)) return "DSLR";
  if (/(iPhone|Pixel|Galaxy|SM-)/i.test(camera)) return "Smartphone";
  if (/(Mavic|DJI|Phantom)/i.test(camera)) return "Drone";
  return null;
}

function getLensType(lens: string) {
  if (!lens || lens === 'Unknown') return null;
  if (/[0-9]+-[0-9]+mm/i.test(lens)) return "Zoom Lens";
  if (/[0-9]+mm/i.test(lens)) return "Prime Lens";
  return null;
}

function getLensScenario(lens: string) {
  if (!lens || lens === 'Unknown') return null;
  
  if (/[0-9]+-[0-9]+mm/i.test(lens)) {
      const match = lens.match(/(\d+)-(\d+)mm/i);
      if (match) {
          const min = parseInt(match[1]);
          const max = parseInt(match[2]);
          if (min >= 70) return "Sports & Wildlife (Telephoto)";
          if (max <= 35) return "Landscapes & Architecture";
          return "Versatile Everyday (Standard Zoom)";
      }
      return "Versatile Zoom";
  }

  const match = lens.match(/(\d+)mm/i);
  if (!match) return null;
  const focal = parseInt(match[1]);
  if (focal <= 24) return "Ultra-Wide Landscapes";
  if (focal <= 35) return "Street & Environmental";
  if (focal <= 55) return "Standard / Classic";
  if (focal <= 105) return "Portrait / Bokeh King";
  return "Wildlife & Sports";
}

function getCropFactor(camera: string) {
  if (!camera) return 1;
  const c = camera.toLowerCase();
  
  if (c.includes('fujifilm') && c.includes('gfx')) return 0.79;
  if (c.includes('fujifilm') && c.includes('x-')) return 1.5;
  if (c.includes('sony') && c.includes('a6')) return 1.5;
  if (c.includes('canon') && (c.includes('rebel') || c.match(/eos \d{2,3}d/))) return 1.6;
  if (c.includes('panasonic') || c.includes('lumix') || c.includes('olympus') || c.includes('om-d')) {
    if (c.includes('s1') || c.includes('s5')) return 1;
    return 2.0;
  }
  if (c.includes('iphone') || c.includes('pixel') || c.includes('galaxy') || c.includes('sm-')) return 5.0; 
  return 1;
}

function calculateEquiv(focalLengthStr: string, camera: string) {
  if (!focalLengthStr || focalLengthStr === 'Unknown') return focalLengthStr;
  const crop = getCropFactor(camera);
  if (crop === 1) return focalLengthStr;
  
  const parts = focalLengthStr.match(/(\d+)/g);
  if (parts) {
      if (parts.length === 1) {
          return `${Math.round(parseInt(parts[0]) * crop)}mm eqv.`;
      } else if (parts.length === 2) {
          return `${Math.round(parseInt(parts[0]) * crop)}-${Math.round(parseInt(parts[1]) * crop)}mm eqv.`;
      }
  }
  return focalLengthStr;
}

function PhotoDashboard({ photoData, isoData, focalLengthData, isEditMode, editedExifData, setEditedExifData, toggleEditMode, togglePin, pinnedPhoto }: any) {
  const exif = photoData.isPinned ? photoData.exif : (isEditMode ? editedExifData : photoData.exif);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const metadataListRef = useRef<HTMLDivElement>(null);
  const [showEquiv, setShowEquiv] = useState(false);
  const [showStyleAnalysis, setShowStyleAnalysis] = useState(false);
  const styleAnalysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      if (styleAnalysisRef.current) {
        if (showStyleAnalysis) {
          gsap.to(styleAnalysisRef.current, { height: "auto", opacity: 1, duration: 0.6, ease: "power3.out" });
        } else {
          gsap.to(styleAnalysisRef.current, { height: 0, opacity: 0, duration: 0.4, ease: "power3.in" });
        }
      }
      
      if (chartContainerRef.current) {
        gsap.fromTo(chartContainerRef.current, 
          { opacity: 0, scale: 0.95, y: 10 }, 
          { 
            opacity: 1, 
            scale: 1, 
            y: 0,
            duration: 1, 
            ease: "power3.out",
            scrollTrigger: {
              trigger: chartContainerRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      if (metadataListRef.current) {
        gsap.fromTo(metadataListRef.current.children,
          { opacity: 0, x: -15 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: metadataListRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, [photoData.image, showStyleAnalysis]);
  
  if (!exif) return (
     <div className="p-12 text-center text-zinc-500 bg-[#141517] rounded-3xl border border-white/5 h-[600px] flex flex-col items-center justify-center space-y-4">
        <ImageIcon className="w-8 h-8 opacity-50" />
        <p>No EXIF Data found for this image.</p>
     </div>
  );

  const getShutterVal = (s: string) => s ? parseInt(s.split('/')[1] || "1") : 1;
  const getApVal = (a: string) => a ? parseFloat(a.replace('f/','')) : 4;
  const getIsoVal = (i: string) => i ? parseInt(i) : 100;

  const radarData = [
    { subject: 'Fast Shutter', A: getShutterVal(exif.shutterSpeed) >= 500 ? 90 : 40, fullMark: 100 },
    { subject: 'Slow Shutter', A: getShutterVal(exif.shutterSpeed) <= 60 ? 85 : 30, fullMark: 100 },
    { subject: 'Wide Aperture', A: getApVal(exif.aperture) <= 2.8 ? 95 : 45, fullMark: 100 },
    { subject: 'Narrow Aperture', A: getApVal(exif.aperture) >= 8.0 ? 85 : 35, fullMark: 100 },
    { subject: 'High ISO', A: getIsoVal(exif.iso) >= 800 ? 90 : 30, fullMark: 100 },
    { subject: 'Low ISO', A: getIsoVal(exif.iso) <= 400 ? 85 : 40, fullMark: 100 },
  ];

  return (
    <div className="flex flex-col gap-5 w-full">
       <div className="relative aspect-[4/5] sm:aspect-video lg:aspect-[21/9] rounded-[20px] overflow-hidden border border-white/10 group/main bg-[#141517]">
          <AnimatePresence mode="popLayout">
            <motion.img 
              key={photoData.image}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              src={photoData.image} 
              alt="Target" 
              className="w-full h-full object-cover" 
            />
          </AnimatePresence>
          
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/main:opacity-100 transition-opacity">
            {!photoData.isPinned && (
              <button onClick={toggleEditMode} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors title='Edit manually'">
                {isEditMode ? <Check className="w-4 h-4"/> : <Edit2 className="w-4 h-4"/>}
              </button>
            )}
            <button onClick={togglePin} className={`w-10 h-10 rounded-full backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors ${pinnedPhoto ? 'bg-luxury-gold/50 text-white border-luxury-gold/50' : 'bg-black/50 text-zinc-300 hover:text-white'}`} title="Pin Image to compare">
                {pinnedPhoto && !photoData.isPinned ? <Pin className="w-4 h-4"/> : <PinOff className="w-4 h-4"/>}
            </button>
          </div>

          <div className="absolute bottom-4 left-4 w-[calc(100%-2rem)] sm:w-[320px] sm:bottom-6 sm:left-6 bg-[#161719]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 sm:p-5 shadow-2xl">
             <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center bg-white/5 text-zinc-400">
                   <Camera className="w-5 h-5"/>
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                   <div className="text-white font-medium text-sm truncate">{exif.camera}</div>
                   <div className="text-zinc-500 text-[9px] uppercase tracking-wider">{exif.camera?.split(' ')[0] || 'Camera'} Model</div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                <HeroStat icon={<Clock/>} label="Shutter Speed" value={exif.shutterSpeed} tooltip="Freezes or blurs motion depending on the exposure time." />
                <HeroStat icon={<Aperture/>} label="Aperture" value={exif.aperture} tooltip="Controls depth of field and light intake." />
                <HeroStat icon={<Zap/>} label="ISO" value={exif.iso} tooltip="Light sensitivity. High ISO = brighter but grainier." />
                <HeroStat icon={<Target/>} label="Focal Length" value={showEquiv ? calculateEquiv(exif.lens.split(' ').find((v:any) => v.includes('mm')) || 'Unknown', exif.camera) : (exif.lens.split(' ').find((v:any) => v.includes('mm')) || 'Unknown')} tooltip="Determines how 'zoomed in' the photo is." />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-[#141517] border border-white/5 rounded-[20px] p-5 sm:p-6 lg:p-8 flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h4 className="text-[10px] font-mono tracking-[0.15em] text-zinc-400 uppercase flex items-center">
                   CAMERA & LENS
               </h4>
               <button 
                 onClick={() => setShowEquiv(!showEquiv)} 
                 className={`text-[9px] font-mono tracking-wider px-2 py-1 rounded transition-colors ${showEquiv ? 'bg-luxury-gold/20 text-luxury-gold border-luxury-gold/30' : 'bg-white/5 text-zinc-500 border-white/5 hover:text-zinc-300'} border uppercase`}
                 title="Toggle Full-Frame Equivalent Focal Length"
               >
                 FF Equiv
               </button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 flex flex-col justify-center" ref={metadataListRef}>
                <ExifCard icon={<Camera/>} label="Camera Make" value={exif.camera} field="camera" isEditMode={isEditMode} onEdit={setEditedExifData} tooltip="The manufacturer and model of the camera body used to capture the image." indicator={getCameraType(exif.camera)} />
                <ExifCard icon={<Target/>} label="Lens Model" value={exif.lens} field="lens" isEditMode={isEditMode} onEdit={setEditedExifData} tooltip="The specific lens attached to the camera, determining optical quality and distortion characteristics." indicator={getLensType(exif.lens)} indicatorTooltip={getLensScenario(exif.lens)} />
                <ExifCard icon={<Focus/>} label="Focal Length" value={showEquiv ? calculateEquiv(exif.lens.split(' ').find((v:any) => v.includes('mm')) || 'Unknown', exif.camera) : (exif.lens.split(' ').find((v:any) => v.includes('mm')) || 'Unknown')} field="lens" isEditMode={isEditMode} onEdit={setEditedExifData} disabled={true} tooltip="Determines the field of view. Lower numbers (e.g. 24mm) are wider, higher numbers (e.g. 85mm) are more zoomed in." />
                <ExifCard icon={<Aperture/>} label="Aperture" value={exif.aperture} field="aperture" isEditMode={isEditMode} onEdit={setEditedExifData} tooltip="The size of the lens opening. Lower f-stops (e.g. f/1.8) create blurrier backgrounds and let in more light." />
                <ExifCard icon={<Zap/>} label="Sensitivity" value={`ISO ${exif.iso}`} field="iso" isEditMode={isEditMode} onEdit={setEditedExifData} tooltip="The camera sensor's sensitivity to light. Higher values brighten the image but introduce unwanted grain/noise." />
                <ExifCard icon={<Clock/>} label="Shutter Speed" value={exif.shutterSpeed} field="shutterSpeed" isEditMode={isEditMode} onEdit={setEditedExifData} tooltip="How long the sensor is exposed to light. Faster speeds (e.g. 1/1000s) freeze motion, slower speeds blur it." />
             </div>
          </div>
          <div className="lg:col-span-5 bg-[#141517] border border-white/5 rounded-[20px] p-5 sm:p-6 lg:p-8 flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h4 className="text-[10px] font-mono tracking-[0.15em] text-zinc-400 uppercase flex items-center gap-2">
                 Photography Score <InfoTooltip text="An AI-driven estimation of photo quality based on technical metadata, exposure balance, and composition rules." />
               </h4>
             </div>
             <div className="flex items-center gap-6 mb-8">
                <div className="flex-1">
                   <div className="text-5xl font-display font-medium text-luxury-gold flex items-baseline gap-1 tracking-tight">
                      92<span className="text-2xl text-luxury-gold/50">%</span>
                   </div>
                   <div className="text-luxury-gold text-[10px] font-mono uppercase tracking-[0.1em] mt-2 font-medium">Excellent Landscape Shot</div>
                </div>
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                       <circle cx="50%" cy="50%" r="46%" stroke="#1c1d20" strokeWidth="6" fill="transparent" />
                       <circle cx="50%" cy="50%" r="46%" stroke="var(--luxury-gold)" strokeWidth="6" fill="transparent" strokeDasharray="290" strokeDashoffset="23" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="text-luxury-gold flex items-center justify-center w-full h-full">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                </div>
             </div>
             <div className="space-y-4">
                <MetricBar label="Exposure" value={95} />
                <MetricBar label="Sharpness" value={88} />
                <MetricBar label="Composition" value={90} />
                <MetricBar label="Color Range" value={93} />
                <MetricBar label="Dynamic Range" value={91} />
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#141517] border border-white/5 rounded-[20px] p-6 lg:p-8 flex flex-col justify-between items-center text-center">
             <div className="w-full flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-mono tracking-[0.15em] text-zinc-400 uppercase">Aperture Vis</h4>
                <InfoTooltip text="Visualizes the physical blade opening of the lens. Wider apertures let in more light and create subject separation." />
             </div>
             <div className="relative aspect-square w-full max-w-[150px] mx-auto my-4 rounded-full flex items-center justify-center">
                 <div className="absolute inset-0 border-[1px] border-white/10 rounded-full border-dashed" style={{ animation: 'spin 60s linear infinite' }}></div>
                 <div className="absolute inset-2 border-[1px] border-white/5 rounded-full"></div>
                 {[0, 60, 120, 180, 240, 300].map(deg => (
                    <div key={deg} className="absolute w-[40%] h-1 bg-luxury-gold/60 transform origin-left left-1/2 rounded-full" style={{ rotate: `${deg}deg`, top: '50%', marginTop: '-2px' }}/>
                 ))}
                 <div className="w-[35%] h-[35%] bg-black rounded-full z-10 box-shadow-[0_0_20px_var(--luxury-gold)] border-2 border-luxury-gold/50 flex items-center justify-center">
                     <div className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse"></div>
                 </div>
             </div>
             <div className="text-center mt-4 w-full">
                <div className="text-2xl font-display text-white mb-2 tracking-tight">{exif.aperture}</div>
                <div className="text-white text-xs mb-2">Wide Aperture</div>
                <div className="text-zinc-500 text-[10px] leading-relaxed">Wide aperture used to achieve shallow depth of field and beautiful subject separation.</div>
             </div>
          </div>
          
          <div className="bg-[#141517] border border-white/5 rounded-[20px] p-6 lg:p-8 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                 <h4 className="text-[10px] font-mono tracking-[0.15em] text-zinc-400 uppercase">ISO Performance</h4>
                 <InfoTooltip text="Shows the digital sensor amplification. High ISO allows shooting in dark environments but introduces grain and noise." />
             </div>
             <div className="mb-6">
                <div className="text-2xl font-display text-white mb-1">ISO {exif.iso}</div>
                <div className="text-zinc-500 text-[10px] font-mono tracking-[0.1em] uppercase">Low Noise</div>
             </div>
             <div className="flex-1 w-full min-h-[140px] relative overflow-visible mt-auto -mx-2" ref={chartContainerRef}>
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={isoData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                     <XAxis dataKey="name" stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                     <Line type="monotone" dataKey="count" stroke="var(--luxury-gold)" strokeWidth={2} dot={{ r: 3, fill: "var(--luxury-gold)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                   </LineChart>
                 </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#141517] border border-white/5 rounded-[20px] p-6 lg:p-8 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-mono tracking-[0.15em] text-zinc-400 uppercase flex items-center gap-2">Lens Usage <InfoTooltip text="Frequency of focal lengths used in this session. Helps you understand your preferred shooting style." /></h4>
                <span className="text-[10px] text-zinc-500">This Session</span>
             </div>
             <div className="space-y-4 flex-1 flex flex-col justify-center">
                {focalLengthData.map((d: any) => {
                   const maxVal = Math.max(...focalLengthData.map((fd:any) => fd.count), 1);
                   const isCurrent = exif.lens.includes(d.name) || (exif.lens.includes('24') && d.name==='24mm');
                   return (
                      <div key={d.name} className="flex items-center gap-4 group">
                         <div className="w-8 text-[10px] sm:text-xs font-mono text-zinc-400 text-left">{d.name}</div>
                         <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${isCurrent ? 'bg-luxury-gold' : 'bg-zinc-600 group-hover:bg-zinc-500'}`} style={{ width: `${(d.count/maxVal)*100}%` }}></div>
                         </div>
                         <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-luxury-gold' : 'bg-zinc-600'}`}></div>
                      </div>
                   )
                })}
             </div>
             <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center">
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Most Used</span>
                 <span className="text-xs text-luxury-gold font-mono">24mm &gt;</span>
             </div>
          </div>
       </div>

       <div className="flex justify-center mt-4 pt-2">
          <button 
             onClick={() => setShowStyleAnalysis(!showStyleAnalysis)}
             className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-[10px] font-mono uppercase tracking-[0.15em] text-zinc-400 transition-colors"
          >
             {showStyleAnalysis ? '- Hide Aesthetic Style' : '+ View Aesthetic Style'}
          </button>
       </div>

       <div ref={styleAnalysisRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
          <div className="pt-6">
             <div className="bg-[#141517] border border-white/5 rounded-[20px] p-6 lg:p-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-5 text-center md:text-left">
                   <h4 className="text-[10px] font-mono tracking-[0.15em] text-zinc-400 uppercase flex items-center justify-center md:justify-start gap-2">
                      Aesthetic Signature <InfoTooltip text="Radar chart mapping exposure parameters to analyze shooting style." />
                   </h4>
                   <h3 className="text-3xl font-display text-white tracking-tight">Technical Profile</h3>
                   <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-md mx-auto md:mx-0">
                      This visualization maps the intersection of your EXIF exposure tendencies. 
                      A strong bias towards wide apertures and fast shutter speeds suggests a subject-separating approach (such as portraiture or wildlife), while weighting towards narrow apertures implies a deep-focus landscape ideology.
                   </p>
                </div>
                <div className="flex-1 w-full h-[280px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                         <PolarGrid stroke="#27272a" strokeDasharray="3 3"/>
                         <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} />
                         <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                         <Radar name="Style" dataKey="A" stroke="var(--luxury-gold)" strokeWidth={2} fill="var(--luxury-gold)" fillOpacity={0.15} />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function HeroStat({ icon, label, value, tooltip }: { icon: React.ReactNode; label: string; value: string; tooltip?: string }) {
   return (
      <div className="flex items-center gap-3 flex-1 min-w-0 relative isolate">
          <div className="text-zinc-400 shrink-0">
              {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
          </div>
          <div className="min-w-0 leading-tight">
             <div className="text-white text-sm font-medium truncate mb-0.5">{value}</div>
             <div className="text-zinc-500 text-[9px] uppercase tracking-wider flex items-center gap-1">
                {label}
                {tooltip && (
                   <div className="relative group/info inline-flex items-center justify-center cursor-help">
                      <Info className="w-2.5 h-2.5 text-zinc-600 group-hover/info:text-luxury-gold transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[160px] sm:w-[200px] bg-[#2A2B2E] text-zinc-200 text-xs p-3 rounded-lg opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity z-50 border border-white/10 shadow-2xl leading-relaxed font-sans normal-case tracking-normal">
                         {tooltip}
                         <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A2B2E] rotate-45 border-b border-r border-white/10"></div>
                      </div>
                   </div>
                )}
             </div>
          </div>
      </div>
   );
}

function ExifCard({ icon, label, value, isEditMode, field, onEdit, disabled=false, tooltip, indicator, indicatorTooltip }: any) {
  return (
    <div className="bg-[#1A1B1E] border border-white/5 rounded-[14px] p-4 flex gap-4 items-center group hover:bg-[#1E2024] hover:border-white/10 transition-colors relative isolate">
       <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-luxury-gold group-hover:border-luxury-gold/30 transition-all shrink-0">
          {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4" })}
       </div>
       <div className="flex-1 min-w-0 flex flex-col justify-center">
          {isEditMode && !disabled ? (
              <input
                 type="text"
                 value={value.replace('ISO ', '')}
                 onChange={(e) => onEdit((prev:any) => ({ ...prev, [field]: e.target.value }))}
                 className="bg-black/50 border border-luxury-gold/50 rounded px-2 py-0.5 text-sm font-medium text-white outline-none w-full mb-1"
               />
          ) : (
              <div className="text-white text-sm font-medium truncate mb-0.5 flex items-center gap-2">
                 {value}
                 {indicator && (
                    <div className="relative group/indicator inline-flex">
                       <span className="px-1.5 py-0.5 rounded text-[8px] border border-luxury-gold/20 bg-luxury-gold/5 text-luxury-gold font-mono uppercase leading-none cursor-help">{indicator}</span>
                       {indicatorTooltip && (
                           <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 -translate-y-full w-max max-w-[200px] bg-[#2A2B2E] text-zinc-200 text-[10px] p-2 rounded-md opacity-0 pointer-events-none group-hover/indicator:opacity-100 transition-opacity z-[60] border border-white/10 shadow-xl leading-relaxed whitespace-normal text-center">
                              {indicatorTooltip}
                              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A2B2E] rotate-45 border-b border-r border-white/10"></div>
                           </div>
                       )}
                    </div>
                 )}
              </div>
          )}
          <div className="text-zinc-500 text-[9px] font-mono tracking-[0.1em] uppercase flex items-center gap-1.5">
             {label}
             {tooltip && (
                <div className="relative group/info inline-flex items-center justify-center cursor-help">
                   <Info className="w-3 h-3 text-zinc-600 group-hover/info:text-luxury-gold transition-colors" />
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[200px] sm:w-[240px] bg-[#2A2B2E] text-zinc-200 text-xs p-3 rounded-lg opacity-0 pointer-events-none group-hover/info:opacity-100 transition-opacity z-50 border border-white/10 shadow-2xl leading-relaxed font-sans normal-case tracking-normal">
                      {tooltip}
                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A2B2E] rotate-45 border-b border-r border-white/10"></div>
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-center gap-4 group">
       <div className="w-24 text-[10px] sm:text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</div>
       <div className="flex-1 h-[3px] bg-white/5 rounded-full overflow-hidden flex">
          <motion.div 
             initial={{ width: 0 }}
             whileInView={{ width: `${value}%` }} 
             transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
             className="h-full bg-luxury-gold rounded-full" 
          />
       </div>
       <div className="w-8 text-right text-[10px] sm:text-xs font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">{value}%</div>
    </div>
  );
}
