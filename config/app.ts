export const appConfig = {
  name: process.env.APP_NAME ?? "Booking System",
  description: "Internal company facility booking system.",
  companyName: process.env.COMPANY_NAME ?? "",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Kuala_Lumpur",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supportEmail: process.env.SYSTEM_CONTACT_EMAIL ?? "",
} as const;

export const defaultFacilities = [
  {
    code: "MR-L5-01",
    name: "Meeting Room 1",
    level: "Level 5",
    type: "meeting_room",
  },
  {
    code: "MR-L5-02",
    name: "Meeting Room 2",
    level: "Level 5",
    type: "meeting_room",
  },
  {
    code: "MR-L6-01",
    name: "Meeting Room 1",
    level: "Level 6",
    type: "meeting_room",
  },
  {
    code: "MR-L6-02",
    name: "Meeting Room 2",
    level: "Level 6",
    type: "meeting_room",
  },
  {
    code: "EH-L1-01",
    name: "Event Hall",
    level: "Level 1",
    type: "event_hall",
  },
] as const;
