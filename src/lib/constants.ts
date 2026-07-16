export const BRAND = {
  name: "THE ELITE TRADER",
  shortName: "Elite Trader",
  logoPath: "/images/logo.png",
  tagline: "Think Smart. Trade Wise. Become Elite.",
  subtagline:
    "Learn the skills, discipline, and mindset required to navigate the markets with confidence.",
  motto: "Discipline today, freedom tomorrow.",
  description:
    "The premier learning platform for modern futures and crypto traders. Master professional strategies and risk management with The Elite Trader.",
  footerDescription:
    "Structured futures and crypto education — Foundation, PRO, and ELITE paths with live signals and a professional trading community.",
} as const;

export const CONTACT = {
  email: "theelitetraderx@gmail.com",
  telegram: "@Elitefuture",
  telegramUrl: "https://t.me/Elitefuture",
  supportNote: "Global trading education — support via Telegram & email, 7 days a week.",
} as const;

export const COLORS = {
  background: "#050505",
  secondaryBg: "#101010",
  card: "#181818",
  goldPrimary: "#D4AF37",
  goldBright: "#FFD700",
  goldDark: "#B8860B",
  white: "#FFFFFF",
  grey: "#A8A8A8",
  border: "rgba(212,175,55,0.25)",
} as const;

export const STATS = [
  { value: "98%", label: "Win Rate Avg" },
  { value: "300+", label: "Active Traders" },
  { value: "3", label: "Structured Paths" },
  { value: "LT", label: "Lifetime Access" },
] as const;

export const WHY_CHOOSE_US = [
  {
    title: "Expert Mentorship",
    description: "Learn from experienced market professionals.",
    icon: "GraduationCap",
  },
  {
    title: "Proven Strategies",
    description: "Structured strategies with real market validation.",
    icon: "Target",
  },
  {
    title: "Risk Management",
    description: "Protect capital. Trade confidently.",
    icon: "Shield",
  },
  {
    title: "Elite Community",
    description: "Connect, grow, and succeed with serious traders.",
    icon: "Users",
  },
] as const;

export const ELITE_ADVANTAGES = [
  {
    title: "A+ Setups Only",
    description: "High-probability, repeatable strategies — no guesswork.",
  },
  {
    title: "Risk-First Trading",
    description: "Protect capital before chasing profits.",
  },
  {
    title: "Real Execution",
    description: "Learn entries, exits & trade management in live conditions.",
  },
  {
    title: "Leverage Clarity",
    description: "Use futures smartly — not like gambling.",
  },
  {
    title: "Mistake Correction",
    description: "Fix errors with structured guidance.",
  },
  {
    title: "Discipline System",
    description: "Trade with rules, not emotions.",
  },
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/pricing", label: "Pricing" },
  { href: "/community", label: "Community" },
  { href: "/signals", label: "Signals" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LINKS = {
  explore: [
    { href: "/courses", label: "Courses" },
    { href: "/pricing", label: "Pricing & Plans" },
    { href: "/community", label: "Community" },
    { href: "/signals", label: "Live Signals" },
    { href: "/contact", label: "Enrol Now" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/login", label: "Log In" },
  ],
} as const;

export const STUDENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/dashboard/notes", label: "My Courses", icon: "FileText" },
  { href: "/dashboard/meetings", label: "Live Meetings", icon: "Video" },
  { href: "/dashboard/profile", label: "Profile", icon: "User" },
] as const;

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users", permission: "manage_users" as const },
  { href: "/admin/meetings", label: "Live Meetings", icon: "Video", permission: "manage_meetings" as const },
  { href: "/admin/courses", label: "Courses & Content", icon: "BookOpen", permission: "manage_courses" as const },
  { href: "/admin/payments", label: "Payment History", icon: "Receipt", permission: "view_payments" as const },
] as const;

export const MEMBER_CODE = "ELITE";
