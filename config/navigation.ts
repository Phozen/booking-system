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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, match: "exact" },
  { title: "Facilities", href: "/facilities", icon: Building2, match: "prefix" },
  { title: "Calendar", href: "/calendar", icon: CalendarDays, match: "exact" },
  { title: "Invitations", href: "/invitations", icon: UserPlus, match: "exact" },
  { title: "New Booking", href: "/bookings/new", icon: CalendarPlus, match: "exact" },
  { title: "My Bookings", href: "/my-bookings", icon: Clock, match: "exact" },
] as const;

export const adminNavigation = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, match: "exact" },
  { title: "Calendar", href: "/admin/calendar", icon: CalendarDays, match: "exact" },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck, match: "prefix" },
  { title: "Approvals", href: "/admin/approvals", icon: ClipboardCheck, match: "prefix" },
  { title: "Facilities", href: "/admin/facilities", icon: Building2, match: "prefix" },
  { title: "Users", href: "/admin/users", icon: UsersRound, match: "prefix", superAdminOnly: true },
  { title: "Blocked Dates", href: "/admin/blocked-dates", icon: Blocks, match: "prefix" },
  { title: "Maintenance", href: "/admin/maintenance", icon: Clock, match: "prefix" },
  { title: "Email Notifications", href: "/admin/email-notifications", icon: Mail, match: "prefix" },
  { title: "Reports", href: "/admin/reports", icon: BarChart3, match: "prefix" },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileClock, match: "prefix" },
  { title: "Integrations", href: "/admin/integrations/microsoft-calendar", icon: PlugZap, match: "prefix", superAdminOnly: true },
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
          "/admin/blocked-dates",
          "/admin/maintenance",
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
          "/admin/settings",
        ].includes(item.href),
      ),
    },
  ].filter((group) => group.items.length > 0);
}

export const adminNavigationGroups = getAdminNavigationGroups("super_admin");
