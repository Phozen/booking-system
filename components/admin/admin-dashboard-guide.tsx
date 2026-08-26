import { BookOpen, ClipboardCheck, ListChecks, Wrench } from "lucide-react";

const features = [
  {
    title: "Room booking",
    body: "Staff book rooms by date and time. Open slots are first come, first served.",
  },
  {
    title: "Outlook calendar",
    body: "Confirmed bookings create or update an Outlook calendar event.",
  },
  {
    title: "Email updates",
    body: "Staff and selected mailboxes get email when bookings are confirmed, changed, or cancelled.",
  },
  {
    title: "Food and drinks",
    body: "Bookings can include catering requests for the right teams to act on.",
  },
  {
    title: "Teams meetings",
    body: "A booking can include a Teams link when the meeting needs online joining.",
  },
] as const;

const responsibilities = [
  {
    title: "Approve bookings",
    body: "Review pending requests and approve or reject them when a room needs approval.",
    icon: ClipboardCheck,
  },
  {
    title: "Manage bookings",
    body: "View, support, and handle booking issues for staff across rooms and dates.",
    icon: BookOpen,
  },
  {
    title: "Facility closures",
    body: "Mark rooms unavailable for maintenance, blocked periods, or other closures.",
    icon: Wrench,
  },
] as const;

export function AdminDashboardGuide() {
  return (
    <section
      aria-labelledby="admin-dashboard-guide-heading"
      className="rounded-xl border border-border/70 bg-card p-4 text-card-foreground sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <ListChecks className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2
            id="admin-dashboard-guide-heading"
            className="text-lg font-semibold tracking-normal"
          >
            Admin guide
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What QBook does, and what HR and Administration handle here.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What QBook does
          </h3>
          <ul className="mt-3 grid gap-3">
            {features.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your responsibilities
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            For HR and Administration admins. Super admin system settings are
            separate.
          </p>
          <ul className="mt-3 grid gap-3">
            {responsibilities.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  className="rounded-lg border border-border/60 bg-background/80 px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
