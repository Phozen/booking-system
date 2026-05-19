import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { zonedDateTimeToUtc } from "@/lib/calendar/date-range";

export type AvailabilityTimelineItem = {
  id: string;
  type: "available" | "confirmed" | "pending" | "blocked" | "maintenance";
  label: string;
  startsAt: string;
  endsAt: string;
  detail: string | null;
};

type TimelineOptions = {
  facilityId: string;
  date: string;
  timezone: string;
  adminView?: boolean;
};

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function toRange(date: string, timezone: string) {
  const { year, month, day } = parseDateParts(date);

  return {
    startsAt: zonedDateTimeToUtc(year, month, day, 0, 0, 0, timezone),
    endsAt: zonedDateTimeToUtc(year, month, day + 1, 0, 0, 0, timezone),
  };
}

function clamp(value: string, startsAt: Date, endsAt: Date) {
  const date = new Date(value);
  if (date < startsAt) return startsAt;
  if (date > endsAt) return endsAt;
  return date;
}

function isValidDateInput(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export async function getFacilityAvailabilityTimeline(
  supabase: SupabaseClient,
  options: TimelineOptions,
): Promise<AvailabilityTimelineItem[]> {
  if (!isValidDateInput(options.date)) {
    return [];
  }

  const range = toRange(options.date, options.timezone);

  if (
    Number.isNaN(range.startsAt.getTime()) ||
    Number.isNaN(range.endsAt.getTime())
  ) {
    return [];
  }

  const startsIso = range.startsAt.toISOString();
  const endsIso = range.endsAt.toISOString();
  const [bookingsResult, blockedResult, maintenanceResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,title,status,starts_at,ends_at,profiles!bookings_user_id_fkey(email,full_name)")
      .eq("facility_id", options.facilityId)
      .in("status", ["pending", "confirmed"])
      .lt("starts_at", endsIso)
      .gt("ends_at", startsIso),
    supabase
      .from("blocked_periods")
      .select("id,title,scope,starts_at,ends_at,blocked_period_facilities(facility_id)")
      .eq("is_active", true)
      .lt("starts_at", endsIso)
      .gt("ends_at", startsIso),
    supabase
      .from("maintenance_closures")
      .select("id,title,starts_at,ends_at")
      .eq("facility_id", options.facilityId)
      .in("status", ["scheduled", "in_progress"])
      .lt("starts_at", endsIso)
      .gt("ends_at", startsIso),
  ]);

  const bookedItems: AvailabilityTimelineItem[] = (
    (bookingsResult.data as unknown as {
      id: string;
      title: string;
      status: "pending" | "confirmed";
      starts_at: string;
      ends_at: string;
      profiles:
        | { email: string; full_name: string | null }
        | { email: string; full_name: string | null }[]
        | null;
    }[] | null) ?? []
  ).map((booking) => {
    const profile = Array.isArray(booking.profiles)
      ? booking.profiles[0]
      : booking.profiles;

    return {
      id: booking.id,
      type: booking.status,
      label: booking.status === "pending" ? "Pending" : "Booked",
      startsAt: clamp(booking.starts_at, range.startsAt, range.endsAt).toISOString(),
      endsAt: clamp(booking.ends_at, range.startsAt, range.endsAt).toISOString(),
      detail: options.adminView
        ? `${booking.title} - ${profile?.full_name || profile?.email || "Unknown"}`
        : booking.status === "pending"
          ? "Pending booking"
          : "Booked",
    };
  });

  const blockedItems: AvailabilityTimelineItem[] = (
    (blockedResult.data as unknown as {
      id: string;
      title: string;
      scope: string;
      starts_at: string;
      ends_at: string;
      blocked_period_facilities?: { facility_id: string }[] | null;
    }[] | null) ?? []
  )
    .filter((period) => {
      if (period.scope === "all_facilities") return true;
      return (period.blocked_period_facilities ?? []).some(
        (item) => item.facility_id === options.facilityId,
      );
    })
    .map((period) => ({
      id: period.id,
      type: "blocked",
      label: "Blocked",
      startsAt: clamp(period.starts_at, range.startsAt, range.endsAt).toISOString(),
      endsAt: clamp(period.ends_at, range.startsAt, range.endsAt).toISOString(),
      detail: options.adminView ? period.title : "Blocked period",
    }));

  const maintenanceItems: AvailabilityTimelineItem[] = (
    (maintenanceResult.data as unknown as {
      id: string;
      title: string;
      starts_at: string;
      ends_at: string;
    }[] | null) ?? []
  ).map((closure) => ({
    id: closure.id,
    type: "maintenance",
    label: "Maintenance",
    startsAt: clamp(closure.starts_at, range.startsAt, range.endsAt).toISOString(),
    endsAt: clamp(closure.ends_at, range.startsAt, range.endsAt).toISOString(),
    detail: options.adminView ? closure.title : "Maintenance",
  }));

  const busyItems = [...bookedItems, ...blockedItems, ...maintenanceItems].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt),
  );
  const availability: AvailabilityTimelineItem[] = [];
  let cursor = range.startsAt;

  for (const item of busyItems) {
    const itemStart = new Date(item.startsAt);
    const itemEnd = new Date(item.endsAt);

    if (itemStart > cursor) {
      availability.push({
        id: `available-${cursor.toISOString()}-${itemStart.toISOString()}`,
        type: "available",
        label: "Available",
        startsAt: cursor.toISOString(),
        endsAt: itemStart.toISOString(),
        detail: "Available",
      });
    }

    if (itemEnd > cursor) {
      cursor = itemEnd;
    }
  }

  if (cursor < range.endsAt) {
    availability.push({
      id: `available-${cursor.toISOString()}-${range.endsAt.toISOString()}`,
      type: "available",
      label: "Available",
      startsAt: cursor.toISOString(),
      endsAt: range.endsAt.toISOString(),
      detail: "Available",
    });
  }

  return [...busyItems, ...availability].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
}
