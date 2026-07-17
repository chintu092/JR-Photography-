export interface WorkItem {
  id: string;
  title: string;
  category: "Fashion" | "Wedding" | "Lifestyle" | "Commercial";
  image: string;
  imageAlt?: string;
  description: string;
  year: string;
  client: string;
  role: string;
  details: string[];
  galleryImages?: string[];
  seo?: SEOSettings;
  aboutShootTitle?: string;
  behindTheScenesLink?: string;
  ctaSubtitle?: string;
  ctaTitle?: string;
  ctaDesc?: string;
  ctaButtonText?: string;
  location?: string;
  gear?: string;
  projectStatus?: string;
  photographerName?: string;
  order?: number;
}

export interface Service {
  id: string;
  title: string;
  num: string;
  description: string;
  longDesc: string;
  tags: string[];
  order?: number;
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  company: string;
  comment: string;
  avatar: string;
  rating: number;
  order?: number;
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  spotlight: boolean;
}

export interface ProcessStep {
  num: string;
  title: string;
  duration: string;
  description: string;
  image?: string;
}

export interface PlanVariant {
  id: string;
  name: string;
  price: string;
  duration: string;
  description: string;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight: boolean;
  tags: string[];
  duration?: string;
  stylePreset?: "p1" | "p2" | "p3";
  order?: number;
  active?: boolean;
  variants?: PlanVariant[];
  createdAt?: any;
  updatedAt?: any;
  updatedBy?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string[]; // split by paragraphs for easy typographic rendering
  coverImage: string;
  coverImageAlt?: string;
  readTime: string;
  date: string;
  category: string;
  quote?: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  seo?: SEOSettings;
}

export interface SEOSettings {
  title?: string;
  description?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  slug?: string;

  // Social sharing
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;

  // Advanced SEO
  noindex?: boolean;
  nofollow?: boolean;
  schemaType?: string;
  schemaJson?: string;
}

export interface GlobalSEOSettings {
  defaultTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  siteName: string;
  twitterHandle: string;
}

export interface StudioSettings {
  city: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  updatedAt?: any;
  updatedBy?: string;
}
