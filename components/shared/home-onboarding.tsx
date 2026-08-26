import Image from "next/image";
import {
  BookOpen,
  CalendarDays,
  Coffee,
  ListChecks,
  Mail,
  Users,
  Video,
} from "lucide-react";

import { BookingFlowSlideshow } from "@/components/shared/booking-flow-slideshow";

const features = [
  {
    title: "Room booking",
    body: "Book meeting rooms by date and time. Open slots are first come, first served.",
    icon: CalendarDays,
  },
  {
    title: "Food and drinks",
    body: "Request catering on a booking so the right people are notified.",
    icon: Coffee,
  },
  {
    title: "Teams meetings",
    body: "Add a Teams link when the meeting needs online joining.",
    icon: Video,
  },
  {
    title: "Invite colleagues",
    body: "Add attendees so they get the same booking details by email.",
    icon: Users,
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
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Walk through a booking in six steps, then see how QBook works with
            Outlook and email.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <BookingFlowSlideshow />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="size-4" aria-hidden="true" />
            What QBook does
          </h3>

          <div className="mt-3 rounded-2xl border border-[#0078D4]/25 bg-gradient-to-br from-[#0078D4]/10 via-card to-card p-4 shadow-xs dark:border-[#4CC2FF]/30 dark:from-[#0078D4]/15">
            <div className="flex items-start gap-3">
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                <Image
                  src="/outlook-icon.png"
                  alt="Microsoft Outlook"
                  width={48}
                  height={48}
                  className="size-12 object-contain p-1"
                />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold tracking-normal text-foreground">
                  Synced with Outlook
                </p>
                <p className="mt-1 text-sm leading-6 text-foreground/85">
                  When a booking is confirmed, QBook creates or updates an
                  Outlook calendar event so it shows on your work calendar.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/90 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#0078D4]/15 text-[#0078D4] dark:text-[#4CC2FF]">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold">Calendar event</p>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Room, time, and meeting details land in Outlook after
                  confirmation.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/90 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#0078D4]/15 text-[#0078D4] dark:text-[#4CC2FF]">
                    <Mail className="size-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold">Email updates</p>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  You get email when a booking is submitted, approved,
                  confirmed, changed, or cancelled.
                </p>
              </div>
            </div>
          </div>

          <ul className="mt-4 grid gap-3">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
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
