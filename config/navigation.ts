import {
  BarChart3,
  Blocks,
  Building2,
  CalendarDays,
  CalendarPlus,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  FileClock,
  LayoutDashboard,
  Mail,
  Settings,
  UserRound,
  UsersRound,
} from "lucide-react";

export const authNavigation = [
  { title: "Login", href: "/login" },
  { title: "Register", href: "/register" },
  { title: "Reset Password", href: "/reset-password" },
] as const;

export const employeeNavigation = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, match: "exact" },
  { title: "Facilities", href: "/facilities", icon: Building2, match: "prefix" },
  { title: "Calendar", href: "/calendar", icon: CalendarDays, match: "exact" },
  { title: "New Booking", href: "/bookings/new", icon: CalendarPlus, match: "exact" },
  { title: "My Bookings", href: "/my-bookings", icon: Clock, match: "exact" },
  { title: "Profile", href: "/profile", icon: UserRound, match: "exact" },
] as const;

export const adminNavigation = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, match: "exact" },
  { title: "Calendar", href: "/admin/calendar", icon: CalendarDays, match: "exact" },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck, match: "prefix" },
  { title: "Approvals", href: "/admin/approvals", icon: ClipboardCheck, match: "prefix" },
  { title: "Facilities", href: "/admin/facilities", icon: Building2, match: "prefix" },
  { title: "Users", href: "/admin/users", icon: UsersRound, match: "prefix" },
  { title: "Blocked Dates", href: "/admin/blocked-dates", icon: Blocks, match: "prefix" },
  { title: "Maintenance", href: "/admin/maintenance", icon: Clock, match: "prefix" },
  { title: "Email Notifications", href: "/admin/email-notifications", icon: Mail, match: "prefix" },
  { title: "Reports", href: "/admin/reports", icon: BarChart3, match: "prefix" },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileClock, match: "prefix" },
  { title: "Settings", href: "/admin/settings", icon: Settings, match: "prefix" },
] as const;

export const adminNavigationGroups = [
  {
    title: "Overview",
    items: adminNavigation.slice(0, 2),
  },
  {
    title: "Operations",
    items: adminNavigation.slice(2, 8),
  },
  {
    title: "Governance",
    items: adminNavigation.slice(8),
  },
] as const;
