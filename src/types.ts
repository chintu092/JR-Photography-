export interface WorkItem {
  id: string;
  title: string;
  category: "Fashion" | "Wedding" | "Lifestyle" | "Commercial";
  image: string;
  description: string;
  year: string;
  client: string;
  role: string;
  beforeImage?: string;
  afterImage?: string;
  details: string[];
  galleryImages?: string[];
}

export interface Service {
  id: string;
  title: string;
  num: string;
  description: string;
  longDesc: string;
  tags: string[];
}

export interface Review {
  id: string;
  name: string;
  role: string;
  company: string;
  comment: string;
  avatar: string;
  rating: number;
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
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight: boolean;
  tags: string[];
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
  readTime: string;
  date: string;
  category: string;
  quote?: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
}
