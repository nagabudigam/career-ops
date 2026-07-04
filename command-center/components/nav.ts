import {
  Radar,
  Sparkles,
  Mail,
  LayoutDashboard,
  Briefcase,
  FileText,
  Inbox,
  FileBadge,
  MessageSquareText,
  BarChart3,
  CalendarClock,
  Wrench,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** key into the badge-counts map for a numeric indicator */
  badge?: "inbox";
}

// Scanner and Evaluate sit at the top — the primary "find → assess" actions.
export const NAV: NavItem[] = [
  { href: "/scan", label: "Scan", icon: Radar, desc: "Portal scanner" },
  { href: "/evaluate", label: "Evaluate", icon: Sparkles, desc: "Local-model JD eval" },
  { href: "/inbox", label: "Inbox", icon: Mail, desc: "Application responses", badge: "inbox" },
  { href: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & KPIs" },
  { href: "/applications", label: "Applications", icon: Briefcase, desc: "Tracker & board" },
  { href: "/reports", label: "Reports", icon: FileText, desc: "Evaluations A–G" },
  { href: "/pipeline", label: "Pipeline", icon: Inbox, desc: "Pending URLs" },
  { href: "/cv", label: "CV / PDF", icon: FileBadge, desc: "Tailor & export" },
  { href: "/interview-prep", label: "Interview Prep", icon: MessageSquareText, desc: "Prep & stories" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, desc: "Patterns" },
  { href: "/followups", label: "Follow-ups", icon: CalendarClock, desc: "Cadence" },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, desc: "Data integrity" },
  { href: "/profile", label: "Profile", icon: User, desc: "Candidate" },
];
