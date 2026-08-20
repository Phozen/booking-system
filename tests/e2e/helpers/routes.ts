export const publicRoutes = ["/", "/login", "/register", "/reset-password"];

export const employeeSmokeRoutes = [
  { path: "/dashboard", heading: /^(hi, |welcome)/i },
  { path: "/facilities", heading: /^rooms$/i },
  { path: "/calendar", heading: /^calendar$/i },
  { path: "/profile", heading: /^your details$/i },
];

export const adminSmokeRoutes = [
  { path: "/admin/dashboard", heading: /^room booking control$/i },
  { path: "/admin/bookings", heading: /^booking management$/i },
  { path: "/admin/approvals", heading: /^pending room requests$/i },
  { path: "/admin/facilities", heading: /^facility management$/i },
  { path: "/admin/reports", heading: /^reports and exports$/i },
];

export const superAdminSmokeRoutes = [
  { path: "/admin/users", heading: /^elevated user access$/i },
  { path: "/admin/settings", heading: /^system settings$/i },
  { path: "/admin/system-health", heading: /^system health$/i },
  { path: "/admin/integrations/microsoft-calendar", heading: /^microsoft 365 calendar$/i },
];
