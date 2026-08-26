import { BookOpen, CircleHelp, Mail } from "lucide-react";

import { BookingFlowSlideshow } from "@/components/shared/booking-flow-slideshow";

const basics = [
  {
    title: "Book a room",
    body: "Open Book a room, pick the room, date, and time, then fill in the meeting details and send.",
  },
  {
    title: "Check the calendar",
    body: "Use Calendar to see what is already booked before you choose a slot.",
  },
  {
    title: "Manage your bookings",
    body: "Open My bookings to view, edit, or cancel bookings you still control.",
  },
] as const;

const rules = [
  {
    title: "First come, first served",
    body: "Open slots go to the first complete booking request. Book early when you need a busy room.",
  },
  {
    title: "System improvements",
    body: (
      <>
        For ideas or issues with how QBook works, email{" "}
        <a
          href="mailto:it@qhazanahsabah.com.my"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          it@qhazanahsabah.com.my
        </a>
        .
      </>
    ),
  },
  {
    title: "Booking conflicts",
    body: (
      <>
        For clashes or disputes about a booking, email{" "}
        <a
          href="mailto:hr@qhazanahsabah.com.my"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          hr@qhazanahsabah.com.my
        </a>
        .
      </>
    ),
  },
] as const;

export function HomeOnboarding() {
  return (
    <section
      aria-labelledby="home-onboarding-heading"
      className="rounded-xl border border-border/70 bg-card p-4 text-card-foreground sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <BookOpen className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2
            id="home-onboarding-heading"
            className="text-lg font-semibold tracking-normal"
          >
            Getting started
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A short guide to booking rooms and the house rules.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <BookingFlowSlideshow />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CircleHelp className="size-4" aria-hidden="true" />
            How to use QBook
          </h3>
          <ol className="mt-3 grid gap-3">
            {basics.map((item, index) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-foreground"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Mail className="size-4" aria-hidden="true" />
            Rules and contacts
          </h3>
          <ul className="mt-3 grid gap-3">
            {rules.map((item) => (
              <li
                key={item.title}
                className="rounded-lg border border-border/60 bg-background/80 px-3 py-3"
              >
                <p className="font-medium">{item.title}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
