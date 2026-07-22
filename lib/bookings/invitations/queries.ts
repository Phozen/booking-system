import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { BookingStatus } from "@/lib/bookings/queries";
import type { BookingCateringDetails } from "@/lib/bookings/catering/format";
import type {
  BookingInvitation,
  BookingInvitationStatus,
  InviteCandidate,
  InvitationProfile,
  InvitedBooking,
} from "@/lib/bookings/invitations/types";
import type { FacilityType } from "@/lib/facilities/validation";

type ProfileRecord =
  | {
      id: string;
      email: string;
      full_name: string | null;
    }
  | {
      id: string;
      email: string;
      full_name: string | null;
    }[]
  | null;

type FacilityRecord =
  | {
      id: string;
      name: string;
      slug?: string;
      level: string;
      type: FacilityType;
      capacity?: number;
    }
  | {
      id: string;
      name: string;
      slug?: string;
      level: string;
      type: FacilityType;
      capacity?: number;
    }[]
  | null;

type InvitationRecord = {
  id: string;
  booking_id: string;
  invited_user_id: string;
  invited_by: string;
  status: BookingInvitationStatus;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  invited_user?: ProfileRecord;
  inviter?: ProfileRecord;
};

type InvitedBookingRecord = InvitationRecord & {
  bookings?:
    | {
        id: string;
        facility_id: string;
        user_id: string;
        title: string;
        description: string | null;
        attendee_count: number | null;
        teams_meeting: boolean | null;
        catering_required: boolean | null;
        catering_type: BookingCateringDetails["type"] | null;
        catering_pax: number | null;
        catering_serving_time: BookingCateringDetails["servingTime"] | null;
        catering_dietary_notes: string | null;
        catering_notes: string | null;
        status: BookingStatus;
        starts_at: string;
        ends_at: string;
        approval_required: boolean;
        created_at: string;
        updated_at: string;
        facilities?: FacilityRecord;
        profiles?: ProfileRecord;
      }
    | {
        id: string;
        facility_id: string;
        user_id: string;
        title: string;
        description: string | null;
        attendee_count: number | null;
        teams_meeting: boolean | null;
        catering_required: boolean | null;
        catering_type: BookingCateringDetails["type"] | null;
        catering_pax: number | null;
        catering_serving_time: BookingCateringDetails["servingTime"] | null;
        catering_dietary_notes: string | null;
        catering_notes: string | null;
        status: BookingStatus;
        starts_at: string;
        ends_at: string;
        approval_required: boolean;
        created_at: string;
        updated_at: string;
        facilities?: FacilityRecord;
        profiles?: ProfileRecord;
      }[]
    | null;
};

export const invitationSelect = `
  id,
  booking_id,
  invited_user_id,
  invited_by,
  status,
  response_message,
  responded_at,
  created_at,
  updated_at,
  invited_user:profiles!booking_invitations_invited_user_id_fkey (
    id,
    email,
    full_name
  ),
  inviter:profiles!booking_invitations_invited_by_fkey (
    id,
    email,
    full_name
  )
`;

const invitedBookingSelect = `
  ${invitationSelect},
  bookings!booking_invitations_booking_id_fkey (
    id,
    facility_id,
    user_id,
    title,
    description,
    attendee_count,
    teams_meeting,
    catering_required,
    catering_type,
    catering_pax,
    catering_serving_time,
    catering_dietary_notes,
    catering_notes,
    status,
    starts_at,
    ends_at,
    approval_required,
    created_at,
    updated_at,
    facilities (
      id,
      name,
      slug,
      level,
      type,
      capacity
    ),
    profiles!bookings_user_id_fkey (
      id,
      email,
      full_name
    )
  )
`;

function firstRecord<T>(record: T | T[] | null | undefined) {
  return Array.isArray(record) ? record[0] : record ?? null;
}

function mapProfile(record: ProfileRecord): InvitationProfile | null {
  const profile = firstRecord(record);

  return profile
    ? {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
      }
    : null;
}

export function mapInvitation(record: InvitationRecord): BookingInvitation {
  return {
    id: record.id,
    bookingId: record.booking_id,
    invitedUserId: record.invited_user_id,
    invitedBy: record.invited_by,
    status: record.status,
    responseMessage: record.response_message,
    respondedAt: record.responded_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    invitedUser: mapProfile(record.invited_user ?? null),
    inviter: mapProfile(record.inviter ?? null),
  };
}

export async function getInvitationsForBooking(
  supabase: SupabaseClient,
  bookingId: string,
) {
  const { data, error } = await supabase
    .from("booking_invitations")
    .select(invitationSelect)
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load booking invitations.");
  }

  return ((data as unknown as InvitationRecord[] | null) ?? []).map(
    mapInvitation,
  );
}

function normalizeCandidateSearch(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s@._+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function searchActiveInviteCandidates(
  supabase: SupabaseClient,
  ownerUserId: string,
  searchValue: string,
  limit = 20,
): Promise<InviteCandidate[]> {
  const search = normalizeCandidateSearch(searchValue);
  if (search.length < 2) return [];

  const pattern = `%${search}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,department")
    .eq("status", "active")
    .neq("id", ownerUserId)
    .or(`full_name.ilike.${pattern},email.ilike.${pattern},department.ilike.${pattern}`)
    .order("full_name", { ascending: true })
    .order("email", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 20)));

  if (error) throw new Error("Unable to search active users.");

  return ((data ?? []) as {
    id: string; email: string; full_name: string | null; department: string | null;
  }[]).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    department: profile.department,
  }));
}

export async function searchInviteCandidatesForBooking(
  supabase: SupabaseClient,
  bookingId: string,
  ownerUserId: string,
  searchValue: string,
  limit = 20,
): Promise<InviteCandidate[] | null> {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (bookingError) {
    throw new Error("Unable to verify booking access.");
  }

  if (!booking) {
    return null;
  }

  const search = normalizeCandidateSearch(searchValue);

  if (search.length < 2) {
    return [];
  }

  const resultLimit = Math.max(1, Math.min(limit, 20));
  const pattern = `%${search}%`;
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,email,full_name,department")
    .eq("status", "active")
    .neq("id", ownerUserId)
    .or(
      `full_name.ilike.${pattern},email.ilike.${pattern},department.ilike.${pattern}`,
    )
    .order("full_name", { ascending: true })
    .order("email", { ascending: true })
    .limit(resultLimit * 2);

  if (profilesError) {
    throw new Error("Unable to search active users.");
  }

  const matchingProfiles =
    (profiles as {
      id: string;
      email: string;
      full_name: string | null;
      department: string | null;
    }[] | null) ?? [];

  if (matchingProfiles.length === 0) {
    return [];
  }

  const { data: existing, error: existingError } = await supabase
    .from("booking_invitations")
    .select("invited_user_id")
    .eq("booking_id", bookingId)
    .in(
      "invited_user_id",
      matchingProfiles.map((profile) => profile.id),
    );

  if (existingError) {
    throw new Error("Unable to load existing invitations.");
  }

  const invitedUserIds = new Set(
    ((existing as { invited_user_id: string }[] | null) ?? []).map(
      (item) => item.invited_user_id,
    ),
  );

  return matchingProfiles
    .filter((profile) => !invitedUserIds.has(profile.id))
    .slice(0, resultLimit)
    .map((profile) => ({
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      department: profile.department,
    }));
}

function mapInvitedBooking(record: InvitedBookingRecord): InvitedBooking | null {
  const bookingRecord = firstRecord(record.bookings);

  if (!bookingRecord) {
    return null;
  }

  const facilityRecord = firstRecord(bookingRecord.facilities);

  return {
    invitation: mapInvitation(record),
    booking: {
      id: bookingRecord.id,
      facilityId: bookingRecord.facility_id,
      userId: bookingRecord.user_id,
      title: bookingRecord.title,
      description: bookingRecord.description,
      attendeeCount: bookingRecord.attendee_count,
      teamsMeeting: Boolean(bookingRecord.teams_meeting),
      catering: {
        required: Boolean(bookingRecord.catering_required),
        type: bookingRecord.catering_type,
        pax: bookingRecord.catering_pax,
        servingTime: bookingRecord.catering_serving_time,
        dietaryNotes: bookingRecord.catering_dietary_notes,
        notes: bookingRecord.catering_notes,
      },
      status: bookingRecord.status,
      startsAt: bookingRecord.starts_at,
      endsAt: bookingRecord.ends_at,
      approvalRequired: bookingRecord.approval_required,
      createdAt: bookingRecord.created_at,
      updatedAt: bookingRecord.updated_at,
      facility: facilityRecord
        ? {
            id: facilityRecord.id,
            name: facilityRecord.name,
            slug: facilityRecord.slug,
            level: facilityRecord.level,
            type: facilityRecord.type,
            capacity: facilityRecord.capacity,
          }
        : null,
      organizer: mapProfile(bookingRecord.profiles ?? null),
    },
  };
}

export async function getInvitedBookingById(
  supabase: SupabaseClient,
  bookingId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("booking_invitations")
    .select(invitedBookingSelect)
    .eq("booking_id", bookingId)
    .eq("invited_user_id", userId)
    .in("status", ["pending", "accepted", "declined"])
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load invited booking.");
  }

  return data
    ? mapInvitedBooking(data as unknown as InvitedBookingRecord)
    : null;
}

export async function getMyInvitations(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("booking_invitations")
    .select(invitedBookingSelect)
    .eq("invited_user_id", userId)
    .in("status", ["pending", "accepted", "declined"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Unable to load invitations.");
  }

  return ((data as unknown as InvitedBookingRecord[] | null) ?? [])
    .map(mapInvitedBooking)
    .filter((item): item is InvitedBooking => Boolean(item));
}

export async function getMyInvitationSummary(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("booking_invitations")
    .select("status")
    .eq("invited_user_id", userId)
    .in("status", ["pending", "accepted"]);

  if (error) {
    throw new Error("Unable to load invitation summary.");
  }

  const invitations =
    (data as { status: BookingInvitationStatus }[] | null) ?? [];

  return {
    pending: invitations.filter((item) => item.status === "pending").length,
    accepted: invitations.filter((item) => item.status === "accepted").length,
    total: invitations.length,
  };
}
