import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarPlus,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Wrench,
  FileClock,
  Activity,
  LayoutDashboard,
  Mail,
  PlugZap,
  Settings,
  UserPlus,
  UsersRound,
} from "lucide-react";

export const authNavigation = [
  { title: "Login", href: "/login" },
  { title: "Register", href: "/register" },
  { title: "Reset Password", href: "/reset-password" },
] as const;

export const employeeNavigation = [
  {
    title: "Book a room",
    href: "/bookings/new",
    icon: CalendarPlus,
    match: "exact",
    tone: "blue",
    header: true,
    help: "Reserve a meeting room in a few guided steps.",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    match: "exact",
    tone: "emerald",
    header: true,
    help: "See when rooms are free or already booked.",
  },
  {
    title: "My bookings",
    href: "/my-bookings",
    icon: Clock,
    match: "exact",
    tone: "amber",
    header: true,
    help: "View and manage rooms you already booked.",
  },
  {
    title: "Invites",
    href: "/invitations",
    icon: UserPlus,
    match: "exact",
    tone: "violet",
    header: true,
    help: "Accept or decline invitations from coworkers.",
  },
  {
    title: "Rooms",
    href: "/facilities",
    icon: Building2,
    match: "prefix",
    tone: "sky",
    header: true,
    help: "Browse rooms by size, floor, and equipment.",
  },
] as const;

export const employeeHeaderNavigation = employeeNavigation.filter(
  (item) => item.header,
);

/** Big quick-action cards on the employee home dashboard (Rooms stays in top nav only). */
const DASHBOARD_ACTION_HREFS = new Set([
  "/bookings/new",
  "/calendar",
  "/my-bookings",
  "/invitations",
]);

export const employeeDashboardActions = employeeNavigation.filter((item) =>
  DASHBOARD_ACTION_HREFS.has(item.href),
);

export const adminNavigation = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, match: "exact" },
  { title: "Calendar", href: "/admin/calendar", icon: CalendarDays, match: "exact" },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck, match: "prefix" },
  { title: "Approvals", href: "/admin/approvals", icon: ClipboardCheck, match: "prefix" },
  { title: "Facilities", href: "/admin/facilities", icon: Building2, match: "prefix" },
  { title: "Users", href: "/admin/users", icon: UsersRound, match: "prefix", superAdminOnly: true },
  { title: "Departments", href: "/admin/departments", icon: Building2, match: "prefix", superAdminOnly: true },
  { title: "Unavailability", href: "/admin/unavailability", icon: Wrench, match: "prefix" },
  { title: "Email Notifications", href: "/admin/email-notifications", icon: Mail, match: "prefix" },
  { title: "Reports", href: "/admin/reports", icon: BarChart3, match: "prefix" },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileClock, match: "prefix" },
  { title: "Integrations", href: "/admin/integrations/microsoft-calendar", icon: PlugZap, match: "prefix", superAdminOnly: true },
  { title: "System Health", href: "/admin/system-health", icon: Activity, match: "exact", superAdminOnly: true },
  { title: "Settings", href: "/admin/settings", icon: Settings, match: "prefix", superAdminOnly: true },
] as const;

export function getAdminNavigationGroups(role?: string | null) {
  const isSuperAdmin = role === "super_admin";
  const visibleItems = adminNavigation.filter(
    (item) => !("superAdminOnly" in item) || !item.superAdminOnly || isSuperAdmin,
  );

  return [
    {
      title: "Overview",
      items: visibleItems.slice(0, 2),
    },
    {
      title: "Operations",
      items: visibleItems.filter((item) =>
        [
          "/admin/bookings",
          "/admin/approvals",
          "/admin/facilities",
          "/admin/users",
          "/admin/departments",
          "/admin/unavailability",
        ].includes(item.href),
      ),
    },
    {
      title: "Governance",
      items: visibleItems.filter((item) =>
        [
          "/admin/email-notifications",
          "/admin/reports",
          "/admin/audit-logs",
          "/admin/integrations/microsoft-calendar",
          "/admin/system-health",
          "/admin/settings",
        ].includes(item.href),
      ),
    },
  ].filter((group) => group.items.length > 0);
}

export const adminNavigationGroups = getAdminNavigationGroups("super_admin");
