import { WorkItem, Service, Review, TeamMember, ProcessStep, PricingTier, FaqItem, BlogPost } from "./types";

export const BRAND_LOGOS = [
  { name: "VOGUE", id: "l-vogue" },
  { name: "CHANEL", id: "l-chanel" },
  { name: "BALENCIAGA", id: "l-balenciaga" },
  { name: "GQ MAGAZINE", id: "l-gq" },
  { name: "ROLEX", id: "l-rolex" },
  { name: "HARPER'S BAZAAR", id: "l-harpers" },
  { name: "CARTIER", id: "l-cartier" },
];

export const SERVICES: Service[] = [
  {
    id: "s1",
    title: "Bengali & Luxury Wedding",
    num: "01",
    description: "Award-winning traditional and luxury Bengali wedding photography across Kolkata, capturing pristine cultural rituals.",
    longDesc: "As the Best Wedding Photographer in Kolkata, our luxury wedding coverage brings cinematic drama and elite visual poetry to traditional Bengali rituals, Mehendi, Sangeet, and grand reception ceremonies. We capture every pristine cultural detail with utmost care.",
    tags: ["Bengali Wedding Photography", "Luxury Weddings", "Kolkata Venues", "Cultural Rituals"]
  },
  {
    id: "s2",
    title: "Candid Wedding Photography",
    num: "02",
    description: "Documentary and fine-art style candid coverage capturing emotional elegance and intimate celebrations.",
    longDesc: "Our team of the best candid wedding photographers in Kolkata frames every moment of your special day with utmost care. Tailored for high-profile celebrations, we capture candid emotions and fleeting smiles utilizing state-of-the-art lenses.",
    tags: ["Candid Wedding", "Fine Art Photojournalism", "Emotional Portraits", "Kolkata Weddings"]
  },
  {
    id: "s3",
    title: "Pre-Wedding Photography",
    num: "03",
    description: "Aesthetic storytelling and premium pre-wedding photoshoots designed to capture the unique chemistry of couples.",
    longDesc: "We produce visual media that elevates your pre-wedding story. Focused on cinematic storytelling, vintage shots, and beautiful scenic backdrops across Kolkata's finest locations and destinations.",
    tags: ["Pre-Wedding Photography", "Kolkata Destinations", "Cinematic Storytelling", "Theme Shots"]
  },
  {
    id: "s4",
    title: "Cinematic Wedding Films",
    num: "04",
    description: "Immersive high-fidelity 4K commercial wedding films, narrative storytelling, and aesthetic campaign reels.",
    longDesc: "Grand, Creative & Unique Wedding Films. Moving portraits and highly stylized film coverage using Hollywood-certified camera systems and sophisticated sound design to weave the pictures magically to create value for a lifetime.",
    tags: ["Wedding Films", "Aesthetic Moodfilms", "4K HDR Masterwork", "Cinematic Storytelling"]
  },
  {
    id: "s5",
    title: "Maternity & Baby Photography",
    num: "05",
    description: "Expansive emotional perspectives capturing the beauty of maternity and newborn milestones.",
    longDesc: "Using ultra-high resolution lenses, we provide beautiful, delicate, and caring photoshoots for maternity, baby arrivals, and Rice Ceremony photography in Kolkata, cherishing life's beautiful beginnings.",
    tags: ["Maternity Photography", "Baby Photoshoot", "Rice Ceremony", "Kolkata"]
  },
  {
    id: "s6",
    title: "Destination Wedding Coverage",
    num: "06",
    description: "Exclusive destination wedding galas, operating all over India with our award-winning aesthetic.",
    longDesc: "Rigorous and elegant live coverage for destination weddings in Patna and across India. We translate fast-moving premium social spectacles into pristine documentary photography ready for instant physical printing.",
    tags: ["Destination Weddings", "Patna Wedding Photography", "All Over India", "High Society Documentaries"]
  }
];

export const WORK_ITEMS: WorkItem[] = [
  {
    id: "w1",
    title: "La Parisienne Couture",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Avant-garde dark autumn haute couture editorial",
    description: "An avant-garde dark autumn haute couture editorial filmed on the limestone cliffs of Étretat, France.",
    year: "2025",
    client: "Vogue France",
    role: "Lead Creative & Photography",
    details: [
      "Shot exclusively on Hasselblad H6D-100c medium format systems.",
      "Custom ambient twilight lighting setup using portable Profoto rigs.",
      "Vogue Editor's Choice Award for Best Editorial Series of Spring 2025.",
      "Exhibited in Paris Creative Art Week."
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    id: "w2",
    title: "The Como Promise",
    category: "Wedding",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Private wedding at Villa Balbiano, Lake Como",
    description: "A three-day ultra-luxury intimate destination wedding set along the romantic horizons of Villa d'Este.",
    year: "2026",
    client: "The Sterling Family",
    role: "Aesthetic Fine Art Direction & Video",
    details: [
      "Fine-art analog-hybrid wedding execution utilizing Hasselblad and Leica M6 black and white film.",
      "Immersive cinematography using Arri Alexa Mini LF.",
      "Privately published collection inside luxury linen-bound coffee-table volume."
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    id: "w3",
    title: "Sculpting the Hour",
    category: "Commercial",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Luxury horological product capture for Vacheron Constantin",
    description: "Atmospheric minimalist product launch for an iconic Swiss gold timepiece showing liquid micro-dynamics.",
    year: "2025",
    client: "Aethelgard Swiss",
    role: "Macro Studio Photography",
    details: [
      "Executed with ultra-precise macro focus-stacking technologies.",
      "Custom fluid motion sculpture rigs simulating dark obsidian ink waves.",
      "Global billboard campaign throughout Zurich, Tokyo, and New York."
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    id: "w4",
    title: "Shadows of Amalfi",
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Vintage maritime lifestyle photoshoot on the Amalfi Coast",
    description: "Moody black-and-white lifestyle chronicle tracking an Italian sculptor's creative flow in her coastal sanctuary.",
    year: "2026",
    client: "Artisan Living Guild",
    role: "Candid Documentary Photography",
    details: [
      "Natural-light organic session focusing on raw physical textures.",
      "Printed on custom German hand-pressed cotton fine art paper.",
      "Featured inside Harper's Bazaar Art supplement."
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    id: "w5",
    title: "The Silent Speedster",
    category: "Commercial",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "High intensity automotive shoot for Porsche Taycan Turbo S",
    description: "Atmospheric evening launch photography for a conceptual high-performance electric hypercar.",
    year: "2025",
    client: "Valkyrie Motors",
    role: "Motion-rig & Car Commercial Director",
    details: [
      "Shot in a high-voltage neon studio environment using customized robotic cameras.",
      "Precision motion blur synchronization to capture velocity while maintaining extreme chassis focus.",
      "Awarded European Commercial Photo of the Year."
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=1200"
    ]
  },
  {
    id: "w6",
    title: "Symphony of Silk",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Close-up color graded photographic fashion details of silk",
    description: "Flowing physical geometries captured using continuous slow-shutter strobe flashes in Florence, Italy.",
    year: "2026",
    client: "Maison de L'Étoile",
    role: "Lead Fashion Photographer",
    details: [
      "Strobe-drag and multi-exposure creative overlay mechanics.",
      "Featured on massive 15-story digital motion billboards in Milan.",
      "Collaborated with Italian model Isabella Rossi."
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1510747440251-2485fc3f684e?auto=format&fit=crop&q=80&w=1200"
    ]
  }
];

export const BEFORE_AFTER_IMAGE = {
  title: "Creative Color Grading & Raw Edit Process",
  subtitle: "Drag the slider to preview the dramatic raw-to-finishing color-grading science applied to every frame by our master designers.",
  before: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200", // Saturation stripped down as "RAW LOG" via CSS filtering or styled
  after: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200", // Rich color grade via specialized overlays
};

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Genevieve Dubois",
    role: "Editor-at-Large",
    company: "VOGUE Paris",
    comment: "JR Photography doesn't just snap photographs — they orchestrate cinematic symphonies. Their light manipulation borders on sorcery. Our readers were absolutely spellbound by the autumn cliffs exhibition.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5
  },
  {
    id: "r2",
    name: "Marcus Sterling",
    role: "Venture Partner",
    company: "Sterling Holdings",
    comment: "The destination wedding photos were an absolute legacy achievement. To capture both the sweeping scale of Lake Como and the delicate raw emotion of a teardrop is a spectacular technical and human feat.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5
  },
  {
    id: "r3",
    name: "Alessia Moretti",
    role: "VP of Global Brand",
    company: "Maison de L'Étoile",
    comment: "JR is the official keeper of our visual identity. Their absolute refusal to cut corners, their stunning eye for minimalist details, and their cinematic speed on-set is standard-defining.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    rating: 5
  }
];

export const TEAM: TeamMember[] = [
  {
    id: "t1",
    name: "Jayanta Roy",
    role: "Founder & Creative Director",
    image: "/assets/image/Founder/profile.jpg",
    bio: "Ex-Leica Visual Ambassador with 15+ years exploring fine-art shadows. Passionate about capturing organic moments with high-end medium format systems.",
    spotlight: true
  },
  {
    id: "t2",
    name: "Estelle Vancamp",
    role: "Lead Fashion Photographer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600",
    bio: "Specialist in hard contrast editorial lighting and avant-garde street architecture styling. Former editor for Parisian fashion houses.",
    spotlight: false
  },
  {
    id: "t3",
    name: "Julian Sterling",
    role: "Chief Cinematographer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=600",
    bio: "Awarded documentary filmmaker. Julian designs the epic, flowy moving frames, custom LUT parameters, and rich spatial acoustic arrays.",
    spotlight: false
  }
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    num: "01",
    title: "Discovery & Creative Pitch",
    duration: "Week 1",
    description: "We deep-dive into your aesthetic values, create a bespoke cinematic moodboard, align lighting philosophies, and define narrative scopes.",
    image: "https://images.unsplash.com/photo-1512540315028-2c1a6497da04?auto=format&fit=crop&q=80&w=800"
  },
  {
    num: "02",
    title: "Strategic Planning & Cast",
    duration: "Week 2 - 3",
    description: "Location scouting globally, permits, custom lighting architecture setup, talent casting, scheduling, and gear selection.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"
  },
  {
    num: "03",
    title: "The Shoot Day Experience",
    duration: "Production",
    description: "Premium on-set craft, high-fidelity film tools, meticulous attention to raw physical detail, and private luxury lounge trailers for clients.",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200"
  },
  {
    num: "04",
    title: "Cinematic Color & Edit",
    duration: "Post-Production",
    description: "Ultra-precise selection, fine-art black-and-white developing, hand-calibrated cinematic color-grading profiles, and narrative editing.",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600"
  },
  {
    num: "05",
    title: "Premium Gallery & Print",
    duration: "Delivery",
    description: "Access to private secure digital vault galleries in 8K alongside certified hand-pressed physical linen art volumes delivered globally.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800"
  }
];

export const PRICING_PLANS: PricingTier[] = [
  {
    id: "p1",
    name: "Elite Editorial",
    price: "$4,500",
    description: "Tailored for designers, creative directors, and high-fashion publications looking to establish strong conceptual presence.",
    features: [
      "1 full day shoot in premium studio or curated location",
      "Direction by lead style photographer",
      "Full digital vault with 40 ultra-high resolution retouched frames",
      "Digital press kit ready for publication",
      "Private commercial usage license bundle"
    ],
    highlight: false,
    tags: ["Fashion", "Creative Portfolio", "Local Shoots"]
  },
  {
    id: "p2",
    name: "Legacy Masterclass",
    price: "$9,500",
    description: "Designed for premium couples or high-society milestones desiring unmatched cinematic narrative protection.",
    features: [
      "Up to 2 days coverage worldwide",
      "Headed by Jayanta Roy + secondary shooter",
      "80 expertly graded luxury medium-format plates",
      "Fully sound-designed 5-minute custom 4K cinematic film reel",
      "Luxurious physical hand-bound linen box & leather-leather legacy books"
    ],
    highlight: true,
    tags: ["Destination Weddings", "Milestones", "Private Estates"]
  },
  {
    id: "p3",
    name: "Couture Campaign",
    price: "$18,000",
    description: "Commercial multi-channel elite campaigns for high-jewelry, luxury automotive, or global fashion labels.",
    features: [
      "3-day custom location production worldwide",
      "Entire studio squad including professional colorists & stylists",
      "Unlimited digital proofs + 150 high-end retouched prints",
      "Full broadcast cinema video (60s ad, 30s cut, raw cuts)",
      "Universal global advertising rights & billboard releases"
    ],
    highlight: false,
    tags: ["Corporate Brands", "Automotive", "Global Launch"]
  }
];

export const FAQS: FaqItem[] = [
  {
    id: "f1",
    question: "Where is JR Photography based, and do you travel?",
    answer: "We are proudly based in Kolkata, but operating all over India. We travel extensively for destination weddings across cities like Patna, Bhubaneswar, Delhi, and beyond to capture your special day, no matter the location."
  },
  {
    id: "f2",
    question: "How much does a wedding photographer cost in Kolkata?",
    answer: "The cost depends on various factors: the number of days, the scale of the event, and the specific services (Candid, Traditional, Cinematic Video). Generally, premium photography starts at moderate pricing but varies based on your unique customized package."
  },
  {
    id: "f3",
    question: "What is the cost of your photography packages?",
    answer: "Our photography packages are fully tailored. We offer options ranging from simple pre-wedding shoots to comprehensive multi-day luxury Bengali wedding coverage. Please reach out to our team with your dates and event details for an accurate quote."
  },
  {
    id: "f4",
    question: "Is 500 photos enough for a wedding?",
    answer: "Yes, 500 beautifully curated and hand-edited images are perfectly sufficient to tell the complete narrative of your wedding. Focusing on quality over quantity ensures every final picture is a cinematic showpiece."
  },
  {
    id: "f5",
    question: "Where is the best place to shoot a pre-wedding in Kolkata?",
    answer: "Kolkata offers stunning backdrops, from the vintage aesthetics of North Kolkata streets and the Hooghly riverbanks at Princep Ghat, to eco-parks and luxurious resorts. We customize the location based on the theme you envision."
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "Pre-Wedding and Wedding Photoshoots in Kolkata: Latest Trends",
    summary: "From Cinematic storytelling to Vintage Bollywood Looks, explore the top trending wedding photography ideas sweeping across Kolkata this season.",
    category: "Wedding Trends",
    coverImage: "https://images.unsplash.com/photo-1542044801-645ff72d5b6e?auto=format&fit=crop&q=80&w=1200",
    readTime: "6 min read",
    date: "June 05, 2026",
    quote: "A wedding is not just an event; it's a cinematic story waiting to be told through the lens.",
    content: [
      "The wedding photography scene in Kolkata is constantly evolving. Today's couples are moving away from traditional, stiff poses and leaning heavily into authentic, narrative-driven experiences. The priority now is to capture the raw vibe of the celebration.",
      "One of the biggest trends is Cinematic Storytelling. Instead of random video clips, modern wedding films employ narrative arcs, utilizing voice-overs from the vows or heartfelt speeches from parents to create an emotionally resonant, documentary-style film.",
      "Another rising trend is the 'Vintage Bollywood Look' during pre-wedding shoots. Utilizing the historic architectures of North Kolkata or classic yellow taxis, couples are reenacting dramatic, nostalgic aesthetics with sepia-toned or deep contrast color palettes."
    ],
    author: {
      name: "JR Team",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
      role: "Lead Photographer"
    }
  },
  {
    id: "b2",
    title: "Things to Remember While Hiring the Best Wedding Photographer in Kolkata",
    summary: "Expert advice on balancing budget, reviewing portfolios, and establishing rapport to find the perfect photography team for your big day.",
    category: "Planning",
    coverImage: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=1200",
    readTime: "8 min read",
    date: "April 18, 2026",
    quote: "Your wedding photographs are the only investment from your wedding day that actually increases in value over time.",
    content: [
      "Hiring the best wedding photographer in Kolkata is arguably one of the most critical decisions you will make during your wedding planning. It's not just about pointing a camera; it's about trusting someone with your most precious, unrepeatable moments.",
      "First, do proper research. Beyond just scrolling Instagram feeds, ask to see full, delivered wedding albums. This reveals consistency across an entire 12-hour day, not just the single best sunset shot.",
      "Consider the budget realistically. The cost of a wedding photographer in Kolkata varies based on team size, equipment, and expertise. High-quality cinematic videos and candid documentary photography require seasoned artistic professionals. Finally, always arrange a physical meeting or video call. If your personalities do not genuinely click, it will show on camera. You want a team that feels like an extension of your family."
    ],
    author: {
      name: "Jayanta Roy",
      avatar: "/assets/image/Founder/profile.jpg",
      role: "Founder & Creative Director"
    }
  },
  {
    id: "b3",
    title: "Echoes of Como: Preserving Matrimonial Legacies Privately",
    summary: "How to craft bespoke, documentary wedding experiences that dodge standard clichés to celebrate genuine connection.",
    category: "Matrimonial Journeys",
    coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
    readTime: "5 min read",
    date: "March 11, 2026",
    quote: "The finest wedding photographs are not staged; they are anticipated. They are the split seconds when decorum slips, revealing true passion.",
    content: [
      "Luxury wedding photography has too often fallen victim to formulaic checklists. We see the same poses, the same artificial smiles, and the same pre-packaged grand-entrance compositions across countless albums. At JR Photography, we believe an elite matrimonio deserves a far more poetic documentary approach.",
      "When we capture a wedding at Villa d'Este or along the cliffs of Amalfi, we operate with a quiet, observant stance. We look for the micro-moments: the nervous tightening of a hand, the silent exchange of glances during a speech, or the misty atmosphere of the lake rolling over the ceremony terrace. This analog-hybrid methodology honors the raw gravity of the day.",
      "Our post-production process is equally deliberate. We dodge standard, high-key digital wedding presets. Instead, our colorists apply custom-tailored cinema tones that root files in timeless elegance. These organic colors translate beautifully into physical hand-pressed books, transforming simple memories into family heirlooms."
    ],
    author: {
      name: "Estelle Vancamp",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
      role: "Lead Fashion Photographer"
    }
  }
];
