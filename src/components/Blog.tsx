import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BLOG_POSTS } from "../data";
import { BlogPost } from "../types";
import { audioService } from "../utils/audio";
import { BookOpen, Calendar, Clock, Sparkles, ArrowRight, User, Loader2 } from "lucide-react";
import { getCollectionData } from "../lib/db-client";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import LazyImage from "./LazyImage";

let _blogCache: BlogPost[] | null = null;

interface BlogProps {
  onSelectBlog: (id: string) => void;
  pageId?: string;
}

export default function Blog({ onSelectBlog, pageId = "blog" }: BlogProps) {
  const [posts, setPosts] = useState<BlogPost[]>(_blogCache || []);
  const [loading, setLoading] = useState(!_blogCache);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [headerConfig, setHeaderConfig] = useState({
    pretitle: "EDITORIAL PUBLICATION",
    title: "THE CHRONICLES",
    subtitle: "An premium dispatch center detailing color science research and medium-format lens physics from our directors on location."
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "section_headers"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const pageKey = pageId === "blog" ? "blog" : `blog_${pageId}`;
        const blogData = data[pageKey] || data.blog;
        if (blogData) {
          setHeaderConfig({
            pretitle: blogData.pretitle || "EDITORIAL PUBLICATION",
            title: blogData.title || "THE CHRONICLES",
            subtitle: blogData.subtitle || "An premium dispatch center detailing color science research and medium-format lens physics from our directors on location."
          });
        }
      }
    }, (error) => {
      console.warn("Error loading blog section headers:", error);
    });
    return unsub;
  }, [pageId]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const items = await getCollectionData<BlogPost>("blog");
        if (items && items.length > 0) {
          const sorted = items.sort((a, b) => b.date.localeCompare(a.date));
          setPosts(sorted);
        } else {
          setPosts([]);
        }
      } catch (err) {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handlePostClick = (id: string) => {
    audioService.playClick();
    onSelectBlog(id);
  };

  const handleHover = () => {
    audioService.playWhoosh();
  };

  return (
    <div className="relative py-28 md:py-36 bg-luxury-black overflow-hidden px-6 md:px-12">
      {/* Decorative background spotlights */}
      <div className="absolute top-1/3 right-[10%] w-[350px] h-[350px] bg-deep-teal/5 rounded-full filter blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-[8%] w-[400px] h-[400px] bg-dark-olive/4 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center space-x-2 text-[9px] font-mono tracking-[0.43em] text-luxury-gold uppercase mb-4">
            <BookOpen className="w-4 h-4 animate-pulse" />
            <span>{headerConfig.pretitle}</span>
          </div>
          <h1 className="font-display font-medium text-4xl sm:text-6xl text-luxury-cream uppercase tracking-tight leading-none mb-6">
            {headerConfig.title}
          </h1>
          <p className="text-xs sm:text-sm text-luxury-gray leading-relaxed font-light">
            {headerConfig.subtitle}
          </p>
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {loading ? (
            [...Array(6)].map((_, idx) => (
              <div 
                key={`skeleton-${idx}`} 
                className="flex flex-col h-full bg-[#121611]/80 border border-white/5 rounded-[32px] overflow-hidden animate-pulse relative"
              >
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="h-64 w-full bg-white/5" />
                <div className="p-8 flex-grow flex flex-col justify-between space-y-6 relative z-10 w-full">
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <div className="w-16 h-3 bg-white/10 rounded" />
                      <div className="w-16 h-3 bg-white/10 rounded" />
                    </div>
                    <div className="w-3/4 h-8 bg-white/10 rounded" />
                    <div className="space-y-2 mt-4">
                      <div className="w-full h-3 bg-white/5 rounded" />
                      <div className="w-5/6 h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-white/10" />
                      <div className="space-y-1">
                        <div className="w-20 h-2 bg-white/10 rounded" />
                        <div className="w-12 h-2 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="w-4 h-4 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-24 text-luxury-cream/60 font-mono text-xs uppercase tracking-widest leading-relaxed">
              No publications found.
            </div>
          ) : posts.map((post, idx) => {
            const isHovered = hoveredId === post.id;
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="group relative flex flex-col h-full bg-luxury-charcoal/60 border border-white/5 rounded-[32px] overflow-hidden cursor-pointer hover:border-luxury-gold/20 shadow-2xl transition-colors duration-500"
                onClick={() => handlePostClick(post.id)}
                onMouseEnter={() => {
                  setHoveredId(post.id);
                  handleHover();
                }}
                onMouseLeave={() => setHoveredId(null)}
                id={`blog-post-card-${post.id}`}
              >
                {/* Image Cover */}
                <div className="aspect-[16/10] overflow-hidden relative">
                  <LazyImage
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1000ms] ease-out"
                    containerClassName="w-full h-full"
                  />
                  {/* Category overlay label */}
                  <span className="absolute top-6 left-6 px-3 py-1.5 bg-luxury-black/95 rounded-full text-[8px] font-mono tracking-widest text-luxury-gold uppercase border border-white/10">
                    {post.category}
                  </span>
                </div>

                {/* Card Content body */}
                <div className="p-8 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Timestamp metadata */}
                    <div className="flex items-center space-x-4 text-[9px] font-mono text-luxury-gray tracking-wider">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-luxury-gold shrink-0" />
                        <span>{post.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-luxury-gray shrink-0" />
                        <span>{post.readTime}</span>
                      </span>
                    </div>

                    <h2 className="font-display font-medium text-xl sm:text-2xl text-luxury-cream group-hover:text-luxury-gold transition-colors duration-300 uppercase leading-snug">
                      {post.title}
                    </h2>

                    <p className="text-xs text-luxury-gray font-light leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    {/* Post Author Details */}
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-7 h-7 rounded-full object-cover border border-luxury-gold/50"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left leading-none">
                        <span className="text-[9px] font-display font-bold uppercase text-luxury-cream block">
                          {post.author.name}
                        </span>
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase block mt-0.5">
                          {post.author.role}
                        </span>
                      </div>
                    </div>

                    {/* Go indicator */}
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-luxury-gold flex items-center justify-center transition-colors duration-300">
                      <ArrowRight className="w-4 h-4 text-luxury-cream group-hover:text-luxury-black transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </div>
  );
}
