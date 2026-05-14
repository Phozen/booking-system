export const publicRoutes = ["/", "/login", "/register", "/reset-password"];

export const employeeSmokeRoutes = [
  { path: "/dashboard", heading: /dashboard/i },
  { path: "/facilities", heading: /facilities/i },
  { path: "/calendar", heading: /calendar/i },
  { path: "/profile", heading: /profile/i },
];

export const adminSmokeRoutes = [
  { path: "/admin/dashboard", heading: /admin dashboard/i },
  { path: "/admin/bookings", heading: /bookings/i },
  { path: "/admin/approvals", heading: /approvals/i },
  { path: "/admin/facilities", heading: /facilities/i },
];

export const superAdminSmokeRoutes = [
  { path: "/admin/users", heading: /users/i },
  { path: "/admin/settings", heading: /settings/i },
];
