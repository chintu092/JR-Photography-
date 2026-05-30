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
    title: "Fashion & Editorial",
    num: "01",
    description: "Avant-garde haute couture lighting and dynamic compositions for high-end fashion lines and magazine covers.",
    longDesc: "Our haute couture fashion coverage brings cinematic drama and elite visual poetry to designer collections, editorials, and branding initiatives. We leverage customized hard-shadow studio frameworks and epic real-life scenery.",
    tags: ["High Fashion", "Runway Editorial", "Studio Casting", "Hard Contour Lighting"]
  },
  {
    id: "s2",
    title: "Luxury Wedding",
    num: "02",
    description: "Documentary and fine-art style coverage capturing emotional elegance, grand estates, and intimate celebration.",
    longDesc: "Tailored for high-profile celebrations and luxury weddings worldwide. We capture candid emotions and scenic backdrops utilizing state-of-the-art medium format lenses to ensure heirloom physical printing quality.",
    tags: ["Destination Weddings", "Fine Art Candid", "Medium Format Portraits", "Dusk Sessions"]
  },
  {
    id: "s3",
    title: "Commercial Campaigns",
    num: "03",
    description: "Aesthetic storytelling and premium commercial visual assets designed to build unstoppable luxury brand status.",
    longDesc: "We produce visual media that elevates architectural, luxury automotive, design-focused products, and tech clients. Focused on clean minimalism, tactile details, and rich color theory.",
    tags: ["Product Launches", "Brand Epics", "Luxury Automotive", "Billboard High-res"]
  },
  {
    id: "s4",
    title: "Cinematic Videography",
    num: "04",
    description: "Immersive high-fidelity 4K or 8K commercial films, narrative storytelling, and aesthetic campaign reels.",
    longDesc: "Moving portraits and highly stylized film coverage. Using Hollywood-certified camera systems, custom LUT color pipelines, and sophisticated sound design presets.",
    tags: ["Aesthetic Moodfilms", "Commercial Ads", "Haute Runway Reels", "4K HDR Masterwork"]
  },
  {
    id: "s5",
    title: "Drone & Aerials",
    num: "05",
    description: "Expansive landscape perspectives and architectural scale captured from breathtaking high-elevation views.",
    longDesc: "Using ultra-high resolution cinematic drones. We provide beautiful spatial mapping, majestic scenic backdrops, and majestic panning shots for elite properties and locations.",
    tags: ["Aerial Panoramas", "Elite Real Estate", "Landscape Scaling", "Licensed Operators"]
  },
  {
    id: "s6",
    title: "High-End Event Coverage",
    num: "06",
    description: "Exclusive red carpet galas, luxury exhibitions, premier art summits, and runway after-parties.",
    longDesc: "Discreet and elegant live coverage. We translate fast-moving premium social spectacles into pristine documentary photography ready for instant press distribution.",
    tags: ["Private Galas", "Art Exhibitions", "PR Distribution", "High Society Documentaries"]
  }
];

export const WORK_ITEMS: WorkItem[] = [
  {
    id: "w1",
    title: "La Parisienne Couture",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
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
    description: "We deep-dive into your aesthetic values, create a bespoke cinematic moodboard, align lighting philosophies, and define narrative scopes."
  },
  {
    num: "02",
    title: "Strategic Planning & Cast",
    duration: "Week 2 - 3",
    description: "Location scouting globally, permits, custom lighting architecture setup, talent casting, scheduling, and gear selection."
  },
  {
    num: "03",
    title: "The Shoot Day Experience",
    duration: "Production",
    description: "Premium on-set craft, high-fidelity film tools, meticulous attention to raw physical detail, and private luxury lounge trailers for clients."
  },
  {
    num: "04",
    title: "Cinematic Color & Edit",
    duration: "Post-Production",
    description: "Ultra-precise selection, fine-art black-and-white developing, hand-calibrated cinematic color-grading profiles, and narrative editing."
  },
  {
    num: "05",
    title: "Premium Gallery & Print",
    duration: "Delivery",
    description: "Access to private secure digital vault galleries in 8K alongside certified hand-pressed physical linen art volumes delivered globally."
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
    answer: "Our creative agency is headquartered in Paris, France and Milan, Italy. However, over 80% of our premium portfolio is captured worldwide. We maintain an in-house global travel logistics team to safely dispatch equipment and talent to any remote landscape, city, or private island."
  },
  {
    id: "f2",
    question: "Which equipment does the agency use?",
    answer: "We shoot primarily with Hasselblad H6D-100c and Phase One IQ4 medium format cameras for unmatched raw resolution and dynamic value. For high-velocity fashion of moving spectacles, we use Leica M11 / SL2. Our cinematic films are captured using Arri Alexa Mini LF systems with Master Anamorphic prime glass."
  },
  {
    id: "f3",
    question: "What is your typical post-production delivery timeline?",
    answer: "Because our color grading and physical proofing processes are done by hand-craft specialists, the standard delivery is 4 to 6 weeks. However, we deliver a curated set of 8 premium 'Next-Day Teasers' within 24 hours of production for immediate social/PR applications."
  },
  {
    id: "f4",
    question: "Can we request custom hand-pressed print books?",
    answer: "Yes, visual longevity is our primary philosophy. We collaborate with master bookbinders in Munich and Florence to produce leather, velvet, and organic linen-bound archives. We print on certified matte archival museum papers that protect colors for over 200 years."
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "Chasing Shadows: The Physics of Hard Strobe Editorial",
    summary: "Discover how the strategic use of high-contrast contour strobe lighting can turn standard fashion portraits into dramatic, sculptural masterpieces.",
    category: "Lighting Dynamics",
    coverImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200",
    readTime: "6 min read",
    date: "May 25, 2026",
    quote: "Contrast is not just the difference between light and dark; it is the boundary where a photograph gains its soul.",
    content: [
      "In modern luxury fashion campaigns, the pursuit of softness has sometimes led to a loss of character. When every face is evenly illuminated with massive softboxes, we lose the topographical narrative that makes human features so fascinating. To subvert this, our studio has returned to the stark beauty of hard strobes.",
      "By utilizing structured reflectors and open-bulb flashes, we carve deep, dramatic contours. This technique, heavily popularized by mid-century Parisian magazine editorials, relies on absolute precision. A shift of just two centimeters in the strobe position can make the difference between an elegant jawline shadow and an unwanted facial obstruction.",
      "To tame this high-contrast method, we use subtle ambient silver reflectors that bounce back just enough fill light to preserve delicate textures without diluting the primary direction. The result is a sculptural three-dimensionality that commands attention on large billboards and high-density digital displays."
    ],
    author: {
      name: "Estelle Vancamp",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
      role: "Lead Fashion Photographer"
    }
  },
  {
    id: "b2",
    title: "The Medium Format Manifesto: Why Pixels Alone are Not Enough",
    summary: "An exploration of scale, transition gradient, and compression space, detailing why 100-megapixel sensors provide unmatched editorial character.",
    category: "Technical Craft",
    coverImage: "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1200",
    readTime: "8 min read",
    date: "April 18, 2026",
    quote: "A sensor does not merely count light; it interprets space. Medium format lens dynamics create a transition speed that flat digital files cannot copy.",
    content: [
      "In the commercial landscape, we often hear debates centered entirely around megapixel count. But resolution is merely a side benefit of true medium format photography. The real magic lies in three key elements: spatial compression, light transition speeds, and dynamic range depth.",
      "Because Hasselblad and Phase One sensors are physically larger than standard full-frame DSLRs, they utilize lenses with longer focal lengths to achieve the same field of view. This introduces a subtle, breathtaking compression that gently detaches the subject from the background, creating a genuine three-dimensional look that feels immersive.",
      "Furthermore, the roll-off from highlight to shadow happens with a luxurious gradation. Rather than hitting an abrupt digital ceiling where highlights clip, medium format preserves detail well into the white channels. This makes it the definitive medium for luxury landscape couture, architectural captures, and legacy wedding portfolios."
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
