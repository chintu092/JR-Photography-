import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { BLOG_POSTS } from "../data";
import { BlogPost } from "../types";
import { audioService } from "../utils/audio";
import { ArrowLeft, Calendar, Clock, Quote, Sparkles, User, Share2, Loader2 } from "lucide-react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import LazyImage from "./LazyImage";
import { Helmet } from "react-helmet-async";
import WayficFormRenderer from "./WayficFormRenderer";

interface BlogDetailProps {
  blogId: string;
  onBack: () => void;
}

export default function BlogDetail({ blogId, onBack }: BlogDetailProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    async function fetchPost() {
      try {
        const docRef = doc(db, "blog", blogId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() } as BlogPost);
        } else {
          setPost(null);
        }
      } catch (err) {
        console.error("Error fetching blog post:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [blogId]);

  useEffect(() => {
    // Scroll to top immediately when viewing a detail article page
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [blogId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxury-gold" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-36 text-center text-luxury-cream">
        <p>Article not found.</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-[#B7BE43] text-[#0C0F0A] uppercase rounded-full font-bold">
          Return to Blog
        </button>
      </div>
    );
  }

  const handleReturn = () => {
    audioService.playClick();
    onBack();
  };

  return (
    <div className="relative min-h-screen bg-luxury-black pb-28 md:pb-36 overflow-hidden">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "image": [
              post.coverImage
            ],
            "datePublished": post.date,
            "author": [{
                "@type": "Person",
                "name": post.author.name
            }]
          })}
        </script>
      </Helmet>
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] sm:h-1 bg-luxury-gold origin-left z-[100] rounded-r-full"
      />
      {/* Absolute colored spotlights on background */}
      <div className="absolute top-1/4 left-[5%] w-[400px] h-[400px] bg-deep-teal/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-[10%] w-[350px] h-[350px] bg-dark-olive/6 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Hero Header Area (Large Scale Photographic) */}
      <div className="relative w-full h-[60vh] min-h-[400px] md:min-h-[550px] overflow-hidden">
        {/* Full Image */}
        <div className="absolute inset-0">
          <LazyImage
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            className="w-full h-full object-cover grayscale brightness-50"
            containerClassName="w-full h-full"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-black via-luxury-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0C0F0A]/40 to-transparent" />
        </div>

        {/* Float navigation back triggers */}
        <div className="absolute top-28 left-6 md:left-12 z-20">
          <button
            onClick={handleReturn}
            onMouseEnter={() => audioService.playWhoosh()}
            className="group flex items-center space-x-2 px-5 py-2.5 bg-[#0C0F0A]/80 backdrop-blur-md rounded-full border border-white/10 text-[9.5px] font-mono tracking-widest text-[#B7BE43] uppercase hover:bg-[#B7BE43] hover:text-[#0C0F0A] transition-all duration-300"
            id="blog-detail-back-top-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Publications</span>
          </button>
        </div>

        {/* Central visual header text */}
        <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-16 z-10 select-none">
          <div className="max-w-4xl mx-auto text-left space-y-4">
            
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#B7BE43]/15 rounded-full border border-[#B7BE43]/20 text-[8.5px] font-mono tracking-widest text-[#B7BE43] uppercase">
              <Sparkles className="w-3 h-3" />
              <span>{post.category}</span>
            </div>

            <h1 className="font-display font-medium text-3xl sm:text-5xl md:text-6xl text-luxury-cream leading-[1.05] tracking-tight uppercase">
              {post.title}
            </h1>

            {/* Author Specs & Date details */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-4 border-t border-white/5 text-luxury-gray text-[10px] font-mono tracking-widest">
              <div className="flex items-center space-x-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#B7BE43]"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left leading-none">
                  <span className="text-luxury-cream font-bold block uppercase text-[10px]">{post.author.name}</span>
                  <span className="text-zinc-500 uppercase text-[8px] block mt-0.5">{post.author.role}</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-[#B7BE43]" />
                  <span>{post.date}</span>
                </div>
                <div>•</div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-luxury-gray" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Narrative Body */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 pt-16 relative z-10 text-left">
        <div className="space-y-8">
          
          {/* Big custom quote block if available */}
          {post.quote && (
            <div className="relative glass-panel rounded-[28px] p-8 md:p-10 border-l-4 border-l-[#B7BE43] my-6">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-[#B7BE43]/10" />
              <p className="font-serif italic text-lg md:text-xl text-luxury-cream leading-relaxed relative z-10">
                "{post.quote}"
              </p>
              <span className="text-[9px] font-mono text-[#B7BE43] tracking-[0.25em] uppercase block mt-4">— EDITORIAL NOTE</span>
            </div>
          )}

          {/* Paragraph rendering */}
          {post.content.map((pText, pIdx) => {
            if (pText.includes("[wayfic-form")) {
              return (
                <div key={pIdx} className="my-8 max-w-xl mx-auto bg-luxury-black/60 p-6 sm:p-8 border border-white/5 rounded-3xl">
                  <WayficFormRenderer shortcode={pText} />
                </div>
              );
            }
            // First paragraph might have big dropcap as option
            return (
              <p
                key={pIdx}
                className={`text-sm sm:text-base text-[#eee] font-light leading-relaxed tracking-wide ${
                  pIdx === 0 ? "first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-[#B7BE43] first-letter:float-left first-letter:mr-3 first-letter:mt-1 font-light" : ""
                }`}
              >
                {pText}
              </p>
            );
          })}

          <div className="h-[1px] bg-white/5 my-10 pt-10" />

          {/* Footer of details article details */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-6 bg-[#121611]/40 rounded-[24px] border border-white/5">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase block">AUTHOR PORTRAIT</span>
              <span className="text-xs font-display font-bold text-luxury-cream uppercase tracking-wide">
                By {post.author.name}
              </span>
              <p className="text-[10.5px] text-luxury-gray font-light mt-1">
                Visual ambassador focused on medium format aesthetics and elite gallery-calibrated compositions.
              </p>
            </div>

            <button
              onClick={() => {
                const shareData = {
                  title: post.title,
                  text: post.summary,
                  url: window.location.href,
                };
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  alert("Link copied to clipboard for sharing.");
                }
              }}
              className="px-4.5 py-2.5 rounded-full bg-white/5 hover:bg-[#B7BE43] text-[#B7BE43] hover:text-luxury-black border border-white/5 hover:border-transparent text-[9.5px] font-mono uppercase tracking-widest flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Frame</span>
            </button>
          </div>

          {/* Bottom Back Nav Trigger */}
          <div className="pt-12 text-center">
            <button
              onClick={handleReturn}
              onMouseEnter={() => audioService.playWhoosh()}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-[#B7BE43] text-luxury-black hover:bg-[#E9E9E7] font-display font-bold text-[11px] tracking-widest uppercase rounded-full transition-all duration-300 shadow-md cursor-pointer"
              id="blog-detail-bottom-return-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Publications Chronicle</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
