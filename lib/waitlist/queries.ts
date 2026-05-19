import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WaitlistStatus } from "@/lib/waitlist/format";

type WaitlistRecord = {
  id: string;
  requester_id: string;
  facility_id: string | null;
  requested_starts_at: string;
  requested_ends_at: string;
  attendee_count: number | null;
  reason: string | null;
  status: WaitlistStatus;
  admin_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  facilities?: { id: string; name: string; level: string } | { id: string; name: string; level: string }[] | null;
  profiles?: { id: string; email: string; full_name: string | null } | { id: string; email: string; full_name: string | null }[] | null;
};

export type WaitlistRequest = {
  id: string;
  requesterId: string;
  facilityId: string | null;
  startsAt: string;
  endsAt: string;
  attendeeCount: number | null;
  reason: string | null;
  status: WaitlistStatus;
  adminResponse: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  facility: { id: string; name: string; level: string } | null;
  requester: { id: string; email: string; fullName: string | null } | null;
};

const waitlistSelect = `
  id,
  requester_id,
  facility_id,
  requested_starts_at,
  requested_ends_at,
  attendee_count,
  reason,
  status,
  admin_response,
  reviewed_by,
  reviewed_at,
  created_at,
  updated_at,
  facilities (
    id,
    name,
    level
  ),
  profiles!booking_waitlist_requests_requester_id_fkey (
    id,
    email,
    full_name
  )
`;

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function mapWaitlist(record: WaitlistRecord): WaitlistRequest {
  const facility = first(record.facilities);
  const requester = first(record.profiles);

  return {
    id: record.id,
    requesterId: record.requester_id,
    facilityId: record.facility_id,
    startsAt: record.requested_starts_at,
    endsAt: record.requested_ends_at,
    attendeeCount: record.attendee_count,
    reason: record.reason,
    status: record.status,
    adminResponse: record.admin_response,
    reviewedAt: record.reviewed_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    facility,
    requester: requester
      ? { id: requester.id, email: requester.email, fullName: requester.full_name }
      : null,
  };
}

export async function getMyWaitlistRequests(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("booking_waitlist_requests")
    .select(waitlistSelect)
    .eq("requester_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load waitlist requests.");

  return ((data as unknown as WaitlistRecord[] | null) ?? []).map(mapWaitlist);
}

export async function getAdminWaitlistRequests(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("booking_waitlist_requests")
    .select(waitlistSelect)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load waitlist requests.");

  return ((data as unknown as WaitlistRecord[] | null) ?? []).map(mapWaitlist);
}
