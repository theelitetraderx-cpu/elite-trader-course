import type {
  Course,
  Module,
  Lesson,
  AnalyticsOverview,
  Notification,
  Note,
} from "@/types";

/** Course program catalog — structure only, no seeded lesson content */
export const DEMO_COURSES: Course[] = [
  {
    id: "course-foundation",
    title: "Foundation",
    slug: "foundation",
    description:
      "Crypto basics, Binance setup, spot trading, and the core skills to start trading with discipline.",
    price: 99,
    instructor: "The Elite Trader Team",
    duration_minutes: 0,
    difficulty: "beginner",
    category: "Foundation",
    status: "published",
    rating: 0,
    student_count: 0,
    lesson_count: 0,
    module_count: 0,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "course-pro",
    title: "PRO",
    slug: "pro",
    description:
      "Everything in Foundation, plus futures trading, advanced analysis, strategy sessions, and live signals.",
    price: 349,
    instructor: "The Elite Trader Team",
    duration_minutes: 0,
    difficulty: "intermediate",
    category: "Professional",
    status: "published",
    rating: 0,
    student_count: 0,
    lesson_count: 0,
    module_count: 0,
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "course-elite",
    title: "ELITE",
    slug: "elite",
    description:
      "Everything in PRO, plus elite entry models, A+ setups, private community, and priority support.",
    price: 599,
    instructor: "The Elite Trader Team",
    duration_minutes: 0,
    difficulty: "advanced",
    category: "Institutional",
    status: "published",
    rating: 0,
    student_count: 0,
    lesson_count: 0,
    module_count: 0,
    created_at: "2025-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

export const COURSE_CURRICULUM: Record<
  string,
  { highlights: string[]; includes?: string; memberPrice: number }
> = {
  foundation: {
    highlights: [
      "Crypto Basics",
      "Binance Setup",
      "SPOT Trading",
      "Technical Analysis Basics",
      "Risk Management",
      "Trading Psychology",
      "Community Access",
    ],
    memberPrice: 49,
  },
  pro: {
    includes: "Everything in FOUNDATION",
    highlights: [
      "FUTURES Trading",
      "Advanced Technical Analysis",
      "Trade Planning",
      "Risk to Reward Models",
      "Weekly Market Analysis",
      "Strategy Sessions + LIVE SIGNALS",
    ],
    memberPrice: 249,
  },
  elite: {
    includes: "Everything in PRO",
    highlights: [
      "ELITE Entry Models",
      "A+ Trade Setups",
      "Exclusive Market Insights",
      "LIVE STRATEGY BREAKDOWN",
      "PRIVATE ELITE COMMUNITY",
      "STRATEGY UPDATES",
      "Priority Support + Exclusive Access",
    ],
    memberPrice: 499,
  },
};

export const DEMO_MODULES: Module[] = [];
export const DEMO_LESSONS: Lesson[] = [];
export const DEMO_NOTES: Note[] = [];
export const DEMO_NOTIFICATIONS: Notification[] = [];

export const DEMO_ANALYTICS: AnalyticsOverview = {
  totalStudents: 0,
  activeStudents: 0,
  totalCourses: 3,
  totalVideos: 0,
  totalDownloads: 0,
  storageUsed: 0,
  revenue: 0,
  todayLogins: 0,
  avgWatchTime: 0,
  completionRate: 0,
};

export const SIGNAL_PLANS = [
  {
    name: "1 Month Signals",
    price: 40,
    period: "1 Mo",
    description: "Live trade signals for one month.",
    popular: false,
  },
  {
    name: "3 Months Signals",
    price: 70,
    period: "3 Mo",
    description: "Three months of live signals and market updates.",
    popular: false,
  },
  {
    name: "6 Months Signals",
    price: 180,
    period: "6 Mo",
    description: "Half-year access to signals and strategy alerts.",
    popular: false,
  },
  {
    name: "Lifetime Signals",
    price: 349,
    salePrice: 299,
    period: "LT",
    description: "Unlimited signals access — best long-term value.",
    popular: true,
  },
] as const;

export const TESTIMONIALS = [
  {
    name: "Community Member",
    role: "PRO Trader",
    content:
      "Every single day, our members post high-probability setups and verified profits. We don't just teach trading — we build professional traders who execute with discipline.",
    rating: 5,
    avatar: "ET",
  },
  {
    name: "Elite Trader Philosophy",
    role: "Core Principle",
    content: "In trading, knowledge is common. Execution and discipline are rare. If you want results, choose ELITE.",
    rating: 5,
    avatar: "★",
  },
  {
    name: "Verified Results",
    role: "Community Wins",
    content:
      "98% win rate average across our active community. 300+ disciplined traders mastering the futures market together.",
    rating: 5,
    avatar: "VR",
  },
];

export const FAQ_ITEMS = [
  {
    question: "How do I enrol?",
    answer:
      "Contact us via Telegram (@Elitefuture) or email (theelitetraderx@gmail.com). Enter your member code on the enrolment page to unlock discounted pricing — Foundation $49, PRO $249, ELITE $499 with code ELITE.",
  },
  {
    question: "What plans do you offer?",
    answer:
      "Three structured paths: Foundation (crypto & spot basics), PRO (futures + live signals), and ELITE (A+ setups + private community). Standalone signal packages are also available from $40/month.",
  },
  {
    question: "Do I get lifetime access?",
    answer:
      "Yes. All course plans include lifetime access (LT) to purchased content, including future updates to your tier.",
  },
  {
    question: "What's the difference between PRO and ELITE?",
    answer:
      "PRO includes everything in Foundation plus futures trading, advanced analysis, strategy sessions, and live signals. ELITE adds elite entry models, A+ setups, live strategy breakdowns, private community, and priority support.",
  },
  {
    question: "Can I buy signals without the full course?",
    answer:
      "Yes. Standalone signal packages: 1 month ($40), 3 months ($70), 6 months ($180), or Lifetime ($299). For signals plus full education, compare ELITE at $499 with member code.",
  },
  {
    question: "How do I get support?",
    answer:
      "Reach us on Telegram @Elitefuture or email theelitetraderx@gmail.com. Support is available 7 days a week.",
  },
];

export const PRICING_PLANS = [
  {
    name: "Foundation",
    price: 99,
    memberPrice: 49,
    period: "Lifetime",
    description: "Crypto basics, Binance setup, spot trading, and core discipline skills.",
    features: COURSE_CURRICULUM.foundation.highlights,
    popular: false,
    tier: "foundation" as const,
  },
  {
    name: "PRO",
    price: 349,
    memberPrice: 249,
    period: "Lifetime",
    description: "Everything in Foundation, plus futures, advanced analysis, and live signals.",
    features: ["Includes Everything in FOUNDATION", ...COURSE_CURRICULUM.pro.highlights],
    popular: false,
    tier: "pro" as const,
  },
  {
    name: "ELITE",
    price: 599,
    memberPrice: 499,
    period: "Lifetime",
    description: "Everything in PRO, plus A+ setups, private community, and priority support.",
    features: ["Includes Everything in PRO", ...COURSE_CURRICULUM.elite.highlights],
    popular: true,
    tier: "elite" as const,
  },
];

export const TEAM_MEMBERS = [
  {
    name: "The Elite Trader Team",
    role: "Market Professionals",
    bio: "Experienced futures and crypto traders focused on structured education, real execution, and disciplined community growth.",
    expertise: ["Futures", "Crypto", "Risk Management"],
  },
];

export const CONTENT_SYSTEM = [
  {
    title: "Precision Video Lessons",
    description:
      "High-quality, structured modules focused on real trading concepts and execution clarity.",
  },
  {
    title: "Live Trading Environment",
    description:
      "Access a dedicated trading room with real-time setups, execution guidance, and market context. (Upcoming)",
    upcoming: true,
  },
];
