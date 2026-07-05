import React, { useState } from "react";
import { 
  Code, Save, Copy, FileText, CheckCircle, HelpCircle, Plus, Trash
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface SchemaPreset {
  id: string;
  name: string;
  type: string;
  description: string;
}

const PRESETS: SchemaPreset[] = [
  { id: "article", name: "Article / News / BlogPosting", type: "NewsArticle", description: "Incorporate author, publisher, and timestamp details for news articles and blog posts." },
  { id: "product", name: "Product & Reviews Markup", type: "Product", description: "Qualify for Google search shopping stars, pricing tags, and real-time inventory counts." },
  { id: "event", name: "Event & Exhibition Details", type: "Event", description: "Present ticketing prices, dates, times, and venue locations directly under links." },
  { id: "recipe", name: "Food & Photography Recipe", type: "Recipe", description: "Highlight preparation time, ingredients, cuisine categories, and nutrition facts." },
  { id: "course", name: "Academic / Masterclass Course", type: "Course", description: "Provide syllabus details, instructors names, and lesson schedules metadata." },
  { id: "video", name: "VideoObject Rich Snippet", type: "VideoObject", description: "Incorporate description, thumbnail assets, duration and direct embed coordinates." },
];

export default function RankMathSchemaTemplates() {
  const toast = useToast();
  const [selectedPreset, setSelectedPreset] = useState("article");
  
  // Shared States
  const [baseTitle, setBaseTitle] = useState("Sartorial Editorial Shoot in Paris");
  const [baseDesc, setBaseDesc] = useState("A professional behind-the-scenes breakdown of the high-fashion photography session.");
  const [baseImage, setBaseImage] = useState("https://jrphotography.com/wp-content/uploads/paris-shoot.jpg");

  // Article States
  const [authorName, setAuthorName] = useState("John Doe");
  const [publisherName, setPublisherName] = useState("JR Photography Studio");
  const [publisherLogo, setPublisherLogo] = useState("https://jrphotography.com/logo.png");

  // Product States
  const [brandName, setBrandName] = useState("Sony Alpha");
  const [skuNumber, setSkuNumber] = useState("ILCE-7RM5");
  const [price, setPrice] = useState("3899.00");
  const [currency, setCurrency] = useState("USD");
  const [rating, setRating] = useState("4.9");
  const [availability, setAvailability] = useState("https://schema.org/InStock");

  // Event States
  const [eventLocation, setEventLocation] = useState("Champs-Élysées Gallery, Paris");
  const [startDate, setStartDate] = useState("2026-09-15T18:00");
  const [endDate, setEndDate] = useState("2026-09-15T22:00");

  // Recipe States
  const [prepTime, setPrepTime] = useState("PT15M");
  const [cookTime, setCookTime] = useState("PT30M");
  const [ingredients, setIngredients] = useState("Canon EOS R5 camera\nProfoto B10X studio strobe\nOctabox 3-foot reflector");

  // Video States
  const [embedUrl, setEmbedUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");
  const [duration, setDuration] = useState("PT5M30S");

  const generateSchema = () => {
    const context = { "@context": "https://schema.org" };
    
    switch (selectedPreset) {
      case "article":
        return JSON.stringify({
          ...context,
          "@type": "BlogPosting",
          "headline": baseTitle,
          "description": baseDesc,
          "image": baseImage,
          "datePublished": "2026-06-24T13:40:00Z",
          "author": {
            "@type": "Person",
            "name": authorName
          },
          "publisher": {
            "@type": "Organization",
            "name": publisherName,
            "logo": {
              "@type": "ImageObject",
              "url": publisherLogo
            }
          }
        }, null, 2);

      case "product":
        return JSON.stringify({
          ...context,
          "@type": "Product",
          "name": baseTitle,
          "description": baseDesc,
          "image": baseImage,
          "brand": {
            "@type": "Brand",
            "name": brandName
          },
          "sku": skuNumber,
          "offers": {
            "@type": "Offer",
            "url": "https://jrphotography.com/shop",
            "priceCurrency": currency,
            "price": price,
            "availability": availability
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "reviewCount": "18"
          }
        }, null, 2);

      case "event":
        return JSON.stringify({
          ...context,
          "@type": "Event",
          "name": baseTitle,
          "description": baseDesc,
          "image": baseImage,
          "startDate": startDate,
          "endDate": endDate,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": eventLocation,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": eventLocation
            }
          }
        }, null, 2);

      case "recipe":
        return JSON.stringify({
          ...context,
          "@type": "Recipe",
          "name": baseTitle,
          "description": baseDesc,
          "image": baseImage,
          "prepTime": prepTime,
          "cookTime": cookTime,
          "recipeIngredient": ingredients.split("\n").filter(Boolean),
          "author": {
            "@type": "Person",
            "name": authorName
          }
        }, null, 2);

      case "course":
        return JSON.stringify({
          ...context,
          "@type": "Course",
          "name": baseTitle,
          "description": baseDesc,
          "provider": {
            "@type": "Organization",
            "name": publisherName,
            "sameAs": "https://jrphotography.com"
          }
        }, null, 2);

      case "video":
        return JSON.stringify({
          ...context,
          "@type": "VideoObject",
          "name": baseTitle,
          "description": baseDesc,
          "thumbnailUrl": baseImage,
          "uploadDate": "2026-06-24T13:40:00Z",
          "contentUrl": embedUrl,
          "embedUrl": embedUrl,
          "duration": duration
        }, null, 2);

      default:
        return "{}";
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSchema());
    toast.success("Structured Schema JSON-LD copied to clipboard!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-500">
      
      {/* Selector side rail */}
      <div className="lg:col-span-4 space-y-3 bg-[#0a0a10]/40 border border-white/5 p-4 rounded-3xl h-fit">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 pl-2">Select Schema Type</span>
        
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedPreset === preset.id
                  ? "bg-[#cfb53b]/10 border-[#cfb53b]/25 text-white"
                  : "bg-zinc-950/20 border-white/5 text-luxury-cream/40 hover:text-white"
              }`}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider">{preset.name}</h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-tight">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Form */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-luxury-black/30 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-4 h-fit">
          <div className="space-y-1 pb-4 border-b border-white/5">
            <h4 className="font-serif text-lg text-white">Schema Parameters</h4>
            <p className="text-luxury-cream/40 text-xs">Fill structured properties dynamically below to map the generated code.</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Item Headline / Name</label>
              <input
                type="text"
                value={baseTitle}
                onChange={(e) => setBaseTitle(e.target.value)}
                className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Item Description Snippet</label>
              <textarea
                value={baseDesc}
                onChange={(e) => setBaseDesc(e.target.value)}
                rows={2}
                className="w-full bg-luxury-black border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Item Featured Image URL</label>
              <input
                type="text"
                value={baseImage}
                onChange={(e) => setBaseImage(e.target.value)}
                className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            {selectedPreset === "article" && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Author Persona Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Publisher Organization</label>
                  <input
                    type="text"
                    value={publisherName}
                    onChange={(e) => setPublisherName(e.target.value)}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedPreset === "product" && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Brand</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">SKU Code</label>
                    <input
                      type="text"
                      value={skuNumber}
                      onChange={(e) => setSkuNumber(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Price</label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Aggregate Rating</label>
                    <input
                      type="text"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedPreset === "event" && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Venue Location / Address</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Start Time</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">End Time</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedPreset === "recipe" && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Preparation Time</label>
                    <input
                      type="text"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Cook Time</label>
                    <input
                      type="text"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                      className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Ingredients (one per line)</label>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    rows={3}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedPreset === "video" && (
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Video Embed/Source URL</label>
                  <input
                    type="text"
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Duration Format</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-luxury-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visual codeblock output */}
        <div className="bg-[#050408] border border-white/5 p-6 rounded-3xl space-y-4 flex flex-col justify-between h-full min-h-[450px]">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#cfb53b] flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                <span>JSON-LD Live Output</span>
              </span>
              <button
                onClick={copyToClipboard}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer font-bold"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight">This markup is generated in real-time, matching standard crawler specifications.</p>
          </div>

          <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 overflow-y-auto max-h-[380px] text-left">
            <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap select-all">
              {generateSchema()}
            </pre>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-zinc-500 leading-normal">
              Fully compliant schema ready for Google's Structured Data Testing Tool. Automatically injects on corresponding pages.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
