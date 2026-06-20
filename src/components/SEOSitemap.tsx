import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { WORK_ITEMS, BLOG_POSTS } from "../data";

export default function SEOSitemap() {
  const [works, setWorks] = useState<string[]>(WORK_ITEMS.map(w => w.id));
  const [blogs, setBlogs] = useState<string[]>(BLOG_POSTS.map(b => b.id));

  useEffect(() => {
    async function fetchIds() {
      try {
        const snap1 = await getDocs(collection(db, "portfolio"));
        if (!snap1.empty) setWorks(snap1.docs.map(d => d.id));
        
        const snap2 = await getDocs(collection(db, "blog"));
        if (!snap2.empty) setBlogs(snap2.docs.map(d => d.id));
      } catch (err) {
        console.warn("Could not fetch sitemap context", err);
      }
    }
    fetchIds();
  }, []);

  const staticRoutes = ["#home", "#about", "#services", "#works", "#blog", "#contact"];

  return (
    <nav className="sr-only" aria-hidden="true">
      <h3>Sitemap Navigation</h3>
      <ul>
        {staticRoutes.map(r => (
          <li key={r}><a href={r}>{r.replace("#", "")}</a></li>
        ))}
        {works.map(id => (
          <li key={`work-${id}`}><a href={`#works-detail-${id}`}>Portfolio - {id}</a></li>
        ))}
        {blogs.map(id => (
          <li key={`blog-${id}`}><a href={`#blog-detail-${id}`}>Blog - {id}</a></li>
        ))}
      </ul>
    </nav>
  );
}
